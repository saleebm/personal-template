import { generateObject, generateText, streamText } from 'ai';
import { google, createGoogleGenerativeAI, type GoogleGenerativeAIProviderMetadata } from '@ai-sdk/google';
import { AIEnhancementSchema, type AIEnhancement, type APIKeyConfig } from './types.js';
import { RuleLoader } from './rule-loader.js';
import { MCPService } from './mcp-service.js';

export class AIService {
  private model: ReturnType<typeof google>;
  private modelName: string;
  private ruleLoader: RuleLoader;
  private mcpService: MCPService;

  constructor(modelName: string = 'gemini-2.5-pro', apiKeys?: APIKeyConfig, projectPath: string = process.cwd()) {
    this.modelName = modelName;
    this.ruleLoader = new RuleLoader(projectPath);
    this.mcpService = new MCPService(projectPath);

    // Validate and set model based on configuration
    if (this.isClaudeModel(modelName)) {
      const anthropicKey = apiKeys?.anthropicApiKey || process.env['ANTHROPIC_API_KEY'];

      if (!anthropicKey) {
        console.warn(`Warning: ${modelName} requires Anthropic API key`);
        // Fallback to Gemini if available
        const googleKey = apiKeys?.googleApiKey || process.env['GOOGLE_API_KEY'];
        if (googleKey) {
          console.log('Falling back to gemini-2.5-pro');
          this.modelName = 'gemini-2.5-pro';
          if (apiKeys?.googleApiKey) {
            // Use createGoogleGenerativeAI for custom API key
            const googleProvider = createGoogleGenerativeAI({
              apiKey: apiKeys.googleApiKey
            });
            this.model = googleProvider(this.modelName);
          } else {
            // Use default google provider (reads from GOOGLE_API_KEY env var)
            this.model = google(this.modelName);
          }
        } else {
          throw new Error('No valid API keys found. Please provide apiKeys in config or set environment variables');
        }
      } else {
        // Use Claude with Anthropic SDK
        const { anthropic } = require('@ai-sdk/anthropic');
        this.model = anthropic(modelName, {
          apiKey: anthropicKey
        });
      }
    } else {
      // Gemini models
      const googleKey = apiKeys?.googleApiKey || process.env['GOOGLE_API_KEY'];
      if (!googleKey) {
        throw new Error('Google API key is required for Gemini models. Provide it via config.apiKeys.googleApiKey or GOOGLE_API_KEY environment variable');
      }
      if (apiKeys?.googleApiKey) {
        // Use createGoogleGenerativeAI for custom API key
        const googleProvider = createGoogleGenerativeAI({
          apiKey: apiKeys.googleApiKey
        });
        this.model = googleProvider(modelName);
      } else {
        // Use default google provider (reads from GOOGLE_API_KEY env var)
        this.model = google(modelName);
      }
    }
  }

  private isClaudeModel(modelName: string): boolean {
    return modelName.startsWith('claude-');
  }

  async enhancePrompt(rawPrompt: string, context?: string): Promise<AIEnhancement & { tokenUsage?: { input: number; output: number } }> {
    try {
      // Load project rules
      const rules = await this.ruleLoader.loadRules();
      console.log(`📊 Enhancing with ${rules.count} rules (${rules.rulesText.length} chars)`);

      const enhancementPrompt = await this.buildEnhancementPrompt(rawPrompt, context, rules.rulesText);
      console.log(`📝 Total prompt size: ${enhancementPrompt.length} characters`);

      // Use structured generation with Zod schema
      const { object, usage } = await generateObject({
        model: this.model,
        schema: AIEnhancementSchema,
        prompt: enhancementPrompt,
        temperature: 0.7,
        maxRetries: 3,
        abortSignal: AbortSignal.timeout(60000) // 60 second timeout
      });

      // Add token count to the result
      const enhancedWithTokens = {
        ...object,
        tokenCount: usage?.totalTokens || 0,
        tokenUsage: {
          input: usage?.inputTokens || 0,
          output: usage?.outputTokens || 0
        }
      };

      return enhancedWithTokens;
    } catch (error) {
      console.error('AI enhancement failed:', error);
      return this.createFallbackEnhancement(rawPrompt);
    }
  }

  async enhanceWithSearchGrounding(rawPrompt: string, searchQuery?: string): Promise<AIEnhancement & { searchResults?: any }> {
    try {
      // Use Google Search grounding for real-time information with gemini-2.5-pro
      const modelWithSearch = google('gemini-2.5-pro');

      const enhancementPrompt = `${await this.buildEnhancementPrompt(rawPrompt)}
      
If relevant, use current web search results to enhance the prompt with up-to-date information.
Search for: ${searchQuery || rawPrompt}`;

      const { object, usage } = await generateObject({
        model: modelWithSearch,
        schema: AIEnhancementSchema,
        prompt: enhancementPrompt,
        temperature: 0.7
      });

      return {
        ...object,
        tokenCount: usage?.totalTokens || 0,
        searchResults: true
      };
    } catch (error) {
      console.error('Search grounding enhancement failed:', error);
      return this.enhancePrompt(rawPrompt);
    }
  }

  /**
   * Enhanced prompt with Google Search and URL context tools
   * Uses AI SDK v5 tools integration for grounding
   */
  async enhanceWithGoogleTools(
    rawPrompt: string,
    options?: {
      urls?: string[];
      searchQueries?: string[];
      useMCP?: boolean;
      mcpConfig?: string;
    }
  ): Promise<AIEnhancement & { sources?: any; metadata?: any }> {
    try {
      // Load custom MCP config if provided
      if (options?.mcpConfig) {
        this.mcpService.loadCustomConfig(options.mcpConfig);
      }

      // Prepare the tools
      const tools: Record<string, any> = {};

      // Add Google Search tool
      if (options?.searchQueries && options.searchQueries.length > 0) {
        tools.google_search = google.tools.googleSearch({});
      }

      // Add URL Context tool  
      if (options?.urls && options.urls.length > 0) {
        tools.url_context = google.tools.urlContext({});
      }

      // Add MCP tools if requested
      if (options?.useMCP) {
        const mcpTools = this.mcpService.createMCPTools();
        Object.assign(tools, mcpTools);
      }

      // Build enhanced prompt with context
      let contextPrompt = await this.buildEnhancementPrompt(rawPrompt);

      if (options?.urls && options.urls.length > 0) {
        contextPrompt += `\n\nRelevant URLs for context:\n${options.urls.map(url => `- ${url}`).join('\n')}`;
      }

      if (options?.searchQueries && options.searchQueries.length > 0) {
        contextPrompt += `\n\nSearch for additional context on:\n${options.searchQueries.map(q => `- ${q}`).join('\n')}`;
      }

      // Use gemini-2.5-pro for better quality
      const enhancementModel = google('gemini-2.5-pro');
      
      let enhancedContext = contextPrompt;
      let toolCallMetadata: any = {};

      // If we have tools, use experimental approach with generateText first
      if (Object.keys(tools).length > 0) {
        try {
          // First, use generateText with tools to get context
          const { text: toolEnhancedText, toolCalls, toolResults, providerMetadata: toolMeta } = await generateText({
            model: enhancementModel,
            prompt: contextPrompt,
            tools,
            temperature: 0.7,
            maxRetries: 3
          });

          // Include tool results in context
          if (toolEnhancedText) {
            enhancedContext = `${contextPrompt}\n\nTool-enhanced context:\n${toolEnhancedText}`;
          }

          // Store tool metadata
          toolCallMetadata = {
            toolCalls,
            toolResults,
            providerMetadata: toolMeta
          };
        } catch (toolError) {
          console.warn('Tool execution failed, continuing with original context:', toolError);
        }
      }

      // Now generate structured output with enhanced context
      const { object, usage, providerMetadata } = await generateObject({
        model: enhancementModel,
        schema: AIEnhancementSchema,
        prompt: enhancedContext,
        temperature: 0.7,
        maxRetries: 3
      });

      // Extract metadata from provider or tool metadata
      const metadata = (toolCallMetadata.providerMetadata?.google || providerMetadata?.google) as GoogleGenerativeAIProviderMetadata | undefined;
      const groundingMetadata = metadata?.groundingMetadata;
      const urlContextMetadata = metadata?.urlContextMetadata;

      return {
        ...object,
        tokenCount: usage?.totalTokens || 0,
        sources: {
          grounding: groundingMetadata,
          urlContext: urlContextMetadata,
          toolResults: toolCallMetadata.toolResults
        },
        metadata: {
          toolsUsed: Object.keys(tools),
          mcpServers: options?.useMCP ? this.mcpService.getAvailableServers() : [],
          toolCalls: toolCallMetadata.toolCalls,
          tokenUsage: {
            input: usage?.inputTokens || 0,
            output: usage?.outputTokens || 0
          }
        }
      };
    } catch (error) {
      console.error('Google tools enhancement failed:', error);
      // Fallback to basic enhancement
      return this.enhancePrompt(rawPrompt);
    }
  }

  /**
   * Load custom MCP configuration
   */
  public loadMCPConfig(configPath: string): void {
    this.mcpService.loadCustomConfig(configPath);
  }

  /**
   * Get available MCP servers
   */
  public getAvailableMCPServers(): string[] {
    return this.mcpService.getAvailableServers();
  }

  async generateClarifyingQuestions(prompt: string): Promise<string[]> {
    try {
      const { text, usage } = await generateText({
        model: this.model,
        prompt: `Given this engineering task prompt: "${prompt}"
        
Generate 3-5 specific technical clarifying questions to better understand the implementation requirements.
Focus on:
- Technical architecture decisions
- Dependencies and integrations
- Performance requirements
- Testing strategy
- Security considerations

Format as a JSON array of strings.`
      });

      console.log(`Token usage for questions: ${usage?.totalTokens || 0} tokens`);

      const match = text.match(/\[.*\]/s);
      if (match) {
        return JSON.parse(match[0]);
      }

      return this.getDefaultClarifyingQuestions();
    } catch (error) {
      console.error('Failed to generate clarifying questions:', error);
      return this.getDefaultClarifyingQuestions();
    }
  }

  async* streamEnhancement(rawPrompt: string) {
    try {
      const { textStream } = streamText({
        model: this.model,
        prompt: await this.buildEnhancementPrompt(rawPrompt)
      });

      for await (const chunk of textStream) {
        yield chunk;
      }
    } catch (error) {
      console.error('Stream enhancement failed:', error);
      yield 'Enhancement failed. Please try again.';
    }
  }

  async analyzeComplexity(prompt: string): Promise<'simple' | 'moderate' | 'complex'> {
    try {
      const { text } = await generateText({
        model: this.model,
        prompt: `Analyze the complexity of this engineering task:
"${prompt}"

Consider:
1. Number of components/files to modify
2. Dependencies and integrations required
3. Testing requirements
4. Potential for breaking changes
5. Need for multiple sub-agents

Respond with exactly one word: simple, moderate, or complex`,
        maxRetries: 2,
        temperature: 0.3
      });

      const complexity = text.trim().toLowerCase();
      if (complexity === 'simple' || complexity === 'moderate' || complexity === 'complex') {
        return complexity as 'simple' | 'moderate' | 'complex';
      }
      return 'moderate';
    } catch (error) {
      console.error('Complexity analysis failed:', error);
      return 'moderate';
    }
  }

  async suggestAgents(prompt: string, complexity: 'simple' | 'moderate' | 'complex'): Promise<string[]> {
    if (complexity === 'simple') {
      return [];
    }

    try {
      const { text } = await generateText({
        model: this.model,
        prompt: `Given this ${complexity} engineering task:
"${prompt}"

Which of these specialized agents would be most helpful?
- ai-dr-workflow-orchestrator: Workflow execution and task management
- ai-dr-challenger: Critical evaluation and validation
- nextjs-ui-api-engineer: UI/React/Next.js/Tailwind development
- principle-engineer: Architecture reviews and system design
- typescript-error-resolver: TypeScript error resolution

Return a JSON array of agent names that would be beneficial. Empty array if none needed.`,
        maxRetries: 2,
        temperature: 0.5
      });

      const match = text.match(/\[.*\]/s);
      if (match) {
        const agents = JSON.parse(match[0]);
        return agents.filter((agent: string) =>
          ['ai-dr-workflow-orchestrator', 'ai-dr-challenger', 'nextjs-ui-api-engineer',
            'principle-engineer', 'typescript-error-resolver'].includes(agent)
        );
      }
      return [];
    } catch (error) {
      console.error('Agent suggestion failed:', error);
      return complexity === 'complex' ? ['ai-dr-workflow-orchestrator'] : [];
    }
  }

  private async buildEnhancementPrompt(rawPrompt: string, context?: string, projectRules?: string): Promise<string> {
    return `You are an expert software engineering prompt engineer specializing in creating detailed, actionable prompts for AI coding assistants.

Original Engineering Task:
${rawPrompt}

${context ? `Project Context:
${context}

` : ''}
${projectRules ? `${projectRules}

` : ''}

Create an enhanced engineering prompt that:
1. Provides crystal-clear, specific technical instructions
2. Identifies exact files and dependencies that need modification
3. Includes measurable success criteria (tests passing, metrics, etc.)
4. Detects the appropriate workflow type (feature, bug, refactor, testing, architecture, etc.)
5. Adds technical constraints and requirements based on project rules
6. Suggests relevant sub-agents if task complexity warrants it
7. Provides a confidence score (0-100) based on prompt clarity
8. Estimates task complexity (simple/moderate/complex)
9. Outlines the logical order of implementation steps

Focus on engineering excellence:
- Code quality and maintainability
- Test coverage requirements
- Performance considerations
- Security implications
- Documentation needs

CRITICAL: The enhanced prompt should be comprehensive and self-contained. It should include all relevant project rules, coding standards, and development guidelines so that ANY AI agent (not just Claude) can execute the task properly without needing to reference external files.

🚫 ANTI-HALLUCINATION REQUIREMENTS:
- ONLY include information that can be verified from the original prompt or provided context
- DO NOT invent specific file names, API endpoints, or implementation details that are not mentioned
- When suggesting files/dependencies, use generic patterns (e.g., "relevant component files" not "UserProfile.tsx")
- Clearly distinguish between:
  * GIVEN: Information explicitly provided in the original prompt
  * INFERRED: Reasonable assumptions based on common patterns
  * SUGGESTED: Recommendations that should be validated
- If you cannot verify specific technical details, use placeholder language like:
  * "Identify the appropriate [component/service/file] for..."
  * "Update relevant [configuration/schema/routes] to..."
  * "Implement in the designated [directory/module/package]"
- Mark any assumptions with clear language: "Assuming standard project structure..."
- Include validation steps: "Verify that [assumed component/file] exists before proceeding"

VERIFICATION CHECKLIST - The enhanced prompt must:
✅ Base all specific claims on information from the original prompt or context
✅ Use generic, adaptable language for implementation details
✅ Include verification steps for any assumptions made
✅ Clearly label what is given vs. inferred vs. suggested
✅ Avoid inventing specific names, paths, or technical details not provided

Return the enhanced prompt following the exact schema provided.`;
  }

  private createFallbackEnhancement(rawPrompt: string): AIEnhancement & { tokenUsage?: { input: number; output: number } } {
    const workflowType = this.detectWorkflowType(rawPrompt);
    const complexity = this.estimateComplexity(rawPrompt);

    return {
      instruction: this.improveInstruction(rawPrompt),
      context: {
        relevantFiles: [],
        dependencies: [],
        technicalStack: ['TypeScript', 'Bun'],
        agentSuggestions: complexity !== 'simple' ? this.suggestAgentsFallback(workflowType) : undefined
      },
      clarifyingQuestions: rawPrompt.length < 50 ? this.getDefaultClarifyingQuestions() : undefined,
      successCriteria: this.getDefaultSuccessCriteria(workflowType),
      constraints: this.getDefaultConstraints(workflowType),
      workflowType,
      confidenceScore: 50,
      estimatedComplexity: complexity,
      orderOfSteps: this.getDefaultSteps(workflowType),
      tokenCount: rawPrompt.length * 2 // Rough estimate
    };
  }

  private detectWorkflowType(prompt: string): AIEnhancement['workflowType'] {
    const lower = prompt.toLowerCase();

    if (/\b(bug|fix|error|issue|problem|broken|crash|failure)\b/.test(lower)) return 'bug';
    if (/\b(add|create|implement|build|feature|new|develop)\b/.test(lower)) return 'feature';
    if (/\b(refactor|restructure|reorganize|clean|improve code)\b/.test(lower)) return 'refactor';
    if (/\b(document|docs|readme|comment|explain|guide)\b/.test(lower)) return 'documentation';
    if (/\b(research|investigate|explore|analyze|compare|evaluate)\b/.test(lower)) return 'research';
    if (/\b(pr|pull request|review|merge|code review)\b/.test(lower)) return 'pr_review';
    if (/\b(architect|design|structure|pattern|system)\b/.test(lower)) return 'architecture';
    if (/\b(test|testing|coverage|unit|integration|e2e)\b/.test(lower)) return 'testing';
    if (/\b(optimize|performance|speed|faster|efficiency)\b/.test(lower)) return 'optimization';
    if (/\b(security|vulnerability|auth|encrypt|protect)\b/.test(lower)) return 'security';
    if (/\b(deploy|deployment|ci|cd|pipeline|release)\b/.test(lower)) return 'deployment';

    return 'general';
  }

  private estimateComplexity(prompt: string): 'simple' | 'moderate' | 'complex' {
    const indicators = {
      complex: /\b(architecture|system|redesign|multiple|integration|workflow|orchestrate)\b/i,
      moderate: /\b(implement|feature|refactor|optimize|enhance)\b/i,
      simple: /\b(fix|update|add|change|modify|document)\b/i
    };

    if (indicators.complex.test(prompt) || prompt.length > 300) return 'complex';
    if (indicators.moderate.test(prompt) || prompt.length > 150) return 'moderate';
    return 'simple';
  }

  private suggestAgentsFallback(workflowType: AIEnhancement['workflowType']): string[] {
    const agentMap: Record<string, string[]> = {
      architecture: ['principle-engineer'],
      feature: ['nextjs-ui-api-engineer'],
      bug: ['typescript-error-resolver'],
      refactor: ['ai-dr-challenger'],
      optimization: ['principle-engineer'],
      security: ['principle-engineer', 'ai-dr-challenger'],
      deployment: ['ai-dr-workflow-orchestrator'],
      testing: ['ai-dr-challenger']
    };

    return agentMap[workflowType] || [];
  }

  private improveInstruction(raw: string): string {
    let improved = raw.trim();

    const actionWords = [
      'implement', 'create', 'fix', 'add', 'update', 'refactor',
      'optimize', 'test', 'document', 'deploy', 'secure', 'analyze'
    ];

    const startsWithAction = actionWords.some(word =>
      improved.toLowerCase().startsWith(word)
    );

    if (!startsWithAction && improved.length < 100) {
      if (improved.includes('not working') || improved.includes('broken')) {
        improved = `Fix the issue where ${improved}`;
      } else if (improved.includes('need') || improved.includes('want')) {
        improved = `Implement functionality to ${improved.replace(/i need|i want|we need|we want/gi, '')}`;
      } else {
        improved = `Implement: ${improved}`;
      }
    }

    improved = improved.charAt(0).toUpperCase() + improved.slice(1);

    if (!/[.!?]$/.test(improved)) {
      improved += '.';
    }

    return improved;
  }

  private getDefaultClarifyingQuestions(): string[] {
    return [
      'What is the specific technical goal and acceptance criteria?',
      'Which files/components need modification and why?',
      'What are the performance and scalability requirements?',
      'Are there existing patterns or conventions to follow?',
      'What testing strategy should be implemented?',
      'Are there security or compliance considerations?'
    ];
  }

  private getDefaultSuccessCriteria(workflowType: AIEnhancement['workflowType']): string[] {
    const criteria: Record<AIEnhancement['workflowType'], string[]> = {
      bug: [
        'Issue is resolved and no longer reproducible',
        'All existing tests pass without regression',
        'New tests added to prevent regression',
        'Error handling improved'
      ],
      feature: [
        'Feature works as specified with edge cases handled',
        'Unit and integration tests provide >80% coverage',
        'Documentation and examples updated',
        'Performance benchmarks met',
        'Accessibility requirements satisfied'
      ],
      refactor: [
        'Code complexity reduced (measurable via metrics)',
        'All tests pass with no functionality changes',
        'Performance maintained or improved',
        'Code follows established patterns',
        'Technical debt reduced'
      ],
      documentation: [
        'All public APIs documented with examples',
        'Setup and usage instructions clear and tested',
        'Architecture decisions documented',
        'Troubleshooting guide included'
      ],
      research: [
        'All viable options evaluated with pros/cons',
        'Performance benchmarks compared',
        'Cost analysis provided',
        'Implementation plan detailed',
        'Risks and mitigations identified'
      ],
      pr_review: [
        'Code quality verified against standards',
        'Test coverage adequate (>80%)',
        'No security vulnerabilities introduced',
        'Performance impact assessed',
        'Documentation updated'
      ],
      architecture: [
        'System design documented with diagrams',
        'Scalability considerations addressed',
        'Security architecture reviewed',
        'Integration points defined',
        'Migration path specified'
      ],
      testing: [
        'Test coverage increased to target percentage',
        'Edge cases and error conditions covered',
        'Performance tests implemented',
        'Test execution time optimized',
        'CI/CD integration working'
      ],
      optimization: [
        'Performance metrics improved by target percentage',
        'Bottlenecks identified and resolved',
        'Resource usage reduced',
        'Benchmarks documented',
        'No functionality regression'
      ],
      security: [
        'Vulnerabilities identified and patched',
        'Security best practices implemented',
        'Authentication/authorization verified',
        'Sensitive data properly encrypted',
        'Security tests added'
      ],
      deployment: [
        'Deployment pipeline configured and tested',
        'Rollback strategy implemented',
        'Monitoring and alerting setup',
        'Documentation updated',
        'Zero-downtime deployment achieved'
      ],
      general: [
        'Task completed as specified',
        'Quality standards met',
        'Tests added/updated',
        'Documentation current',
        'Code reviewed and approved'
      ]
    };

    return criteria[workflowType];
  }

  private getDefaultConstraints(workflowType: AIEnhancement['workflowType']): string[] {
    const constraints: Record<AIEnhancement['workflowType'], string[]> = {
      bug: ['Maintain backward compatibility', 'Add comprehensive error logging', 'Include regression tests'],
      feature: ['Follow project coding standards', 'Include input validation', 'Ensure mobile responsiveness'],
      refactor: ['No external API changes', 'Preserve all functionality', 'Maintain or improve performance'],
      documentation: ['Use markdown format', 'Include working code examples', 'Keep under 5000 words'],
      research: ['Provide quantitative comparisons', 'Include implementation timelines', 'Consider team expertise'],
      pr_review: ['Check against security checklist', 'Verify test coverage >80%', 'Ensure no breaking changes'],
      architecture: ['Consider microservices principles', 'Plan for 10x scale', 'Minimize vendor lock-in'],
      testing: ['Achieve 80% code coverage', 'Tests must run in <5 minutes', 'Mock external dependencies'],
      optimization: ['No functionality changes', 'Benchmark before and after', 'Document optimization techniques'],
      security: ['Follow OWASP guidelines', 'Implement defense in depth', 'Include security tests'],
      deployment: ['Ensure rollback capability', 'Test in staging first', 'Update runbooks'],
      general: ['Follow best practices', 'Maintain code quality', 'Update relevant documentation']
    };

    return constraints[workflowType];
  }

  private getDefaultSteps(workflowType: AIEnhancement['workflowType']): string[] {
    const steps: Record<AIEnhancement['workflowType'], string[]> = {
      bug: [
        '1. Reproduce the issue locally',
        '2. Identify root cause through debugging',
        '3. Implement fix with proper error handling',
        '4. Add tests to prevent regression',
        '5. Verify fix resolves issue completely'
      ],
      feature: [
        '1. Design component/API architecture',
        '2. Implement core functionality',
        '3. Add comprehensive tests',
        '4. Implement edge cases and error handling',
        '5. Update documentation and examples'
      ],
      refactor: [
        '1. Analyze current implementation',
        '2. Plan refactoring approach',
        '3. Implement changes incrementally',
        '4. Ensure all tests pass',
        '5. Verify performance metrics'
      ],
      architecture: [
        '1. Analyze requirements and constraints',
        '2. Design system architecture',
        '3. Create proof of concept',
        '4. Document design decisions',
        '5. Plan implementation phases'
      ],
      testing: [
        '1. Identify test gaps',
        '2. Write unit tests',
        '3. Implement integration tests',
        '4. Add E2E tests if needed',
        '5. Integrate with CI/CD'
      ],
      optimization: [
        '1. Profile and identify bottlenecks',
        '2. Benchmark current performance',
        '3. Implement optimizations',
        '4. Measure improvements',
        '5. Document changes'
      ],
      security: [
        '1. Perform security audit',
        '2. Identify vulnerabilities',
        '3. Implement fixes',
        '4. Add security tests',
        '5. Update security documentation'
      ],
      deployment: [
        '1. Setup deployment environment',
        '2. Configure CI/CD pipeline',
        '3. Implement deployment scripts',
        '4. Test deployment process',
        '5. Document procedures'
      ],
      documentation: [
        '1. Outline documentation structure',
        '2. Write main content',
        '3. Add code examples',
        '4. Review for clarity',
        '5. Test examples work'
      ],
      research: [
        '1. Define evaluation criteria',
        '2. Research available options',
        '3. Create comparison matrix',
        '4. Test promising solutions',
        '5. Document recommendations'
      ],
      pr_review: [
        '1. Review code changes',
        '2. Check test coverage',
        '3. Verify documentation',
        '4. Test functionality',
        '5. Provide feedback'
      ],
      general: [
        '1. Understand requirements',
        '2. Plan implementation',
        '3. Execute task',
        '4. Test and verify',
        '5. Document changes'
      ]
    };

    return steps[workflowType] || steps.general;
  }
}