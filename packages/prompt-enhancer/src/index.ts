import { v4 as uuidv4 } from "uuid";
import {
  PromptEnhancerConfigSchema,
  type PromptEnhancerConfig,
  type RawPromptInput,
  type StructuredPrompt,
  type ValidationResult,
  type PromptSearchQuery,
  type AIEnhancement,
  type WorkflowExecution,
  type EnhancedPromptResult,
  type APIKeyConfig,
  RawPromptInputSchema,
  StructuredPromptSchema,
  APIKeyConfigSchema,
} from "./types.js";
import { AIService } from "./ai-service.js";
import { PromptValidator } from "./validator.js";
import { PromptStorage } from "./storage.js";
import { ContextAnalyzer } from "./context.js";
import { WorkflowOrchestrator } from "./workflow-orchestrator.js";
import { ReferenceDiscovery } from "./reference-discovery.js";
import { AgentResolver } from "./agent-resolver.js";

// Export all types
export * from "./types.js";
export { AIService } from "./ai-service.js";
export { PromptValidator } from "./validator.js";
export { PromptStorage } from "./storage.js";
export { ContextAnalyzer } from "./context.js";
export { WorkflowOrchestrator } from "./workflow-orchestrator.js";
export { ReferenceDiscovery } from "./reference-discovery.js";
export { AgentResolver } from "./agent-resolver.js";
export { RuleLoader } from "./rule-loader.js";
export { MCPService } from "./mcp-service.js";
export * from "./utils.js";

export class PromptEnhancerSDK {
  private config: PromptEnhancerConfig;
  private aiService: AIService;
  private validator: PromptValidator;
  private storage: PromptStorage;
  private contextAnalyzer: ContextAnalyzer;
  private workflowOrchestrator: WorkflowOrchestrator;
  private referenceDiscovery: ReferenceDiscovery;
  private agentResolver: AgentResolver;

  constructor(config: Partial<PromptEnhancerConfig> = {}) {
    // Validate and merge config with defaults
    this.config = PromptEnhancerConfigSchema.parse({
      projectPath: config.projectPath || process.cwd(),
      ...config,
    });

    // Initialize services
    this.aiService = new AIService(
      this.config.model,
      this.config.apiKeys,
      this.config.projectPath,
    );
    this.validator = new PromptValidator();
    this.storage = new PromptStorage(
      this.config.outputDir,
      this.config.projectPath,
    );
    this.contextAnalyzer = new ContextAnalyzer(this.config.projectPath);
    this.workflowOrchestrator = new WorkflowOrchestrator(
      this.config.projectPath,
      this.config.outputDir,
    );
    this.referenceDiscovery = new ReferenceDiscovery(this.config.projectPath);
    this.agentResolver = new AgentResolver(this.config.projectPath);

    if (this.config.debug) {
      console.log("PromptEnhancerSDK initialized with config:", this.config);
    }
  }

  async enhance(input: string | RawPromptInput): Promise<StructuredPrompt> {
    try {
      // Normalize input
      const rawInput = this.normalizeInput(input);

      // Validate input
      const validated = RawPromptInputSchema.parse(rawInput);

      if (!validated.content || validated.content.trim() === "") {
        throw new Error("Input content cannot be empty");
      }

      // Resolve agent mentions in the prompt
      const agentResolution = await this.agentResolver.resolveAgentMentions(
        validated.content,
      );

      if (this.config.debug && agentResolution.resolvedAgents.length > 0) {
        console.log(
          "Resolved agents:",
          agentResolution.resolvedAgents.map((a) => a.name),
        );
      }

      // Use the processed prompt for further enhancement
      const processedValidated = {
        ...validated,
        content: agentResolution.processedPrompt,
      };

      // Get codebase context if enabled
      let contextString = "";
      if (this.config.enableCodebaseContext) {
        const context = await this.contextAnalyzer.analyze(
          processedValidated.content,
        );
        contextString = this.formatContextForAI(context);
      }

      // Enhance with AI
      const aiEnhancement = await this.aiService.enhancePrompt(
        processedValidated.content,
        contextString,
      );

      // Build structured prompt
      const structured = await this.buildStructuredPrompt(
        aiEnhancement,
        processedValidated,
        rawInput.metadata,
        agentResolution,
      );

      // Validate the result
      const validation = this.validator.validate(structured);
      structured.validation = validation;

      if (this.config.debug) {
        console.log("Enhancement complete:", {
          id: structured.id,
          score: validation.score,
          workflow: structured.workflow,
        });
      }

      return structured;
    } catch (error) {
      console.error("Enhancement failed:", error);
      // Return a basic structured prompt as fallback
      return this.createFallbackPrompt(input);
    }
  }

  async enhanceWithSearch(
    input: string | RawPromptInput,
    searchQuery?: string,
  ): Promise<StructuredPrompt> {
    try {
      const rawInput = this.normalizeInput(input);
      const validated = RawPromptInputSchema.parse(rawInput);

      if (!validated.content || validated.content.trim() === "") {
        throw new Error("Input content cannot be empty");
      }

      // Get codebase context if enabled
      let contextString = "";
      if (this.config.enableCodebaseContext) {
        const context = await this.contextAnalyzer.analyze(validated.content);
        contextString = this.formatContextForAI(context);
      }

      // Enhance with AI and search grounding
      const aiEnhancement = await this.aiService.enhanceWithSearchGrounding(
        validated.content,
        searchQuery,
      );

      // Build structured prompt
      const structured = await this.buildStructuredPrompt(
        aiEnhancement,
        validated,
        rawInput.metadata,
      );

      // Validate the result
      const validation = this.validator.validate(structured);
      structured.validation = validation;

      if (this.config.debug) {
        console.log("Search-enhanced prompt complete:", {
          id: structured.id,
          score: validation.score,
          searchUsed: true,
        });
      }

      return structured;
    } catch (error) {
      console.error("Search enhancement failed:", error);
      // Fallback to regular enhancement
      return this.enhance(input);
    }
  }

  async enhanceWithWorkflow(
    input: string | RawPromptInput,
  ): Promise<EnhancedPromptResult> {
    try {
      // First, get the standard enhancement
      const structuredPrompt = await this.enhance(input);

      // Get codebase context
      const rawInput = this.normalizeInput(input);
      const context = this.config.enableCodebaseContext
        ? await this.contextAnalyzer.analyze(rawInput.content)
        : null;

      // Re-enhance with engineering focus
      const aiEnhancement = await this.aiService.enhancePrompt(
        rawInput.content,
        context ? this.formatContextForAI(context) : undefined,
      );

      // Analyze complexity
      const complexity = await this.aiService.analyzeComplexity(
        rawInput.content,
      );

      // Create workflow if needed
      const workflow = await this.workflowOrchestrator.orchestrateWorkflow(
        structuredPrompt,
        aiEnhancement,
        complexity,
      );

      // Build result
      const result: EnhancedPromptResult = {
        id: workflow.id,
        original: rawInput.content,
        enhanced: aiEnhancement.instruction,
        workflow,
        metadata: {
          createdAt: new Date(),
          tokenCount: aiEnhancement.tokenCount || 0,
          complexity,
          agentsRequired: (workflow.agents?.length || 0) > 0,
          contextFilesUsed: workflow.contextFiles,
        },
        outputFile: workflow.results?.outputPath || "",
      };

      // Store the result
      if (workflow.results?.outputPath) {
        await this.storage.save(structuredPrompt);
      }

      return result;
    } catch (error) {
      console.error("Workflow enhancement failed:", error);
      throw error;
    }
  }

  async store(prompt: StructuredPrompt): Promise<string> {
    return this.storage.save(prompt);
  }

  async retrieve(id: string): Promise<StructuredPrompt | null> {
    return this.storage.load(id);
  }

  async search(query: PromptSearchQuery): Promise<StructuredPrompt[]> {
    return this.storage.search(query);
  }

  async update(
    id: string,
    updates: Partial<StructuredPrompt>,
  ): Promise<StructuredPrompt> {
    const existing = await this.retrieve(id);
    if (!existing) {
      throw new Error(`Prompt not found: ${id}`);
    }

    const updated = {
      ...existing,
      ...updates,
      metadata: {
        ...existing.metadata,
        updatedAt: new Date(),
      },
    };

    // Re-validate
    updated.validation = this.validator.validate(updated);

    // Save
    await this.storage.save(updated);

    return updated;
  }

  validate(prompt: StructuredPrompt): ValidationResult {
    return this.validator.validate(prompt);
  }

  getConfig(): PromptEnhancerConfig {
    return this.config;
  }

  async getAvailableAgents() {
    return this.agentResolver.getAvailableAgents();
  }

  async resolveAgentMentions(prompt: string) {
    return this.agentResolver.resolveAgentMentions(prompt);
  }

  async isReady(): Promise<boolean> {
    // Check if AI service is available
    try {
      const testPrompt = "Test connectivity";
      await this.aiService.analyzeComplexity(testPrompt);
      return true;
    } catch {
      return false;
    }
  }

  export(
    prompt: StructuredPrompt,
    format: "json" | "yaml" | "markdown" = "json",
  ): string {
    switch (format) {
      case "json":
        return JSON.stringify(prompt, null, 2);

      case "yaml":
        return this.exportToYaml(prompt);

      case "markdown":
        return this.exportToMarkdown(prompt);

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private normalizeInput(input: string | RawPromptInput): RawPromptInput {
    if (typeof input === "string") {
      return {
        content: input,
        type: undefined,
        metadata: {
          timestamp: new Date(),
        },
      };
    }
    return {
      ...input,
      metadata: {
        ...input.metadata,
        timestamp: input.metadata?.timestamp || new Date(),
      },
    };
  }

  private async buildStructuredPrompt(
    aiEnhancement: AIEnhancement,
    rawInput: RawPromptInput,
    metadata?: RawPromptInput["metadata"],
    agentResolution?: any,
  ): Promise<StructuredPrompt> {
    const now = new Date();

    // Discover references
    const discoveredReferences =
      await this.referenceDiscovery.discoverReferences(rawInput.content);
    const validatedReferences =
      await this.referenceDiscovery.validateReferences(discoveredReferences);

    return {
      id: uuidv4(),
      version: "1.0.0",
      workflow: aiEnhancement.workflowType,
      instruction: aiEnhancement.instruction,
      context: {
        projectOverview: "AI Dr. workflow orchestration system",
        relevantFiles: aiEnhancement.context.relevantFiles.map((path) => ({
          path,
          summary: `File: ${path}`,
        })),
        dependencies: aiEnhancement.context.dependencies,
        currentState: "",
        technicalStack: aiEnhancement.context.technicalStack,
      },
      inputs: [
        {
          label: "Original Prompt",
          value: rawInput.content,
          type: "text",
        },
      ],
      expectedOutput: {
        format: this.getOutputFormat(aiEnhancement.workflowType),
        structure: this.getOutputStructure(aiEnhancement.workflowType),
      },
      validation: {
        isValid: true,
        score: aiEnhancement.confidenceScore,
        issues: [],
        suggestions: [],
      },
      metadata: {
        createdAt: now,
        updatedAt: now,
        author: metadata?.author,
        tags: metadata?.tags,
      },
      clarifyingQuestions: aiEnhancement.clarifyingQuestions,
      successCriteria: aiEnhancement.successCriteria,
      constraints: aiEnhancement.constraints,
      // New sections
      discoveredReferences:
        validatedReferences.length > 0 ? validatedReferences : undefined,
      handOffGuidance: undefined, // Will be populated by AI in future enhancement
      openQuestions: undefined, // Will be populated by AI in future enhancement
      constraintsAndNonGoals: undefined, // Will be populated by AI in future enhancement
      agentResolution: agentResolution || undefined,
    };
  }

  private createFallbackPrompt(
    input: string | RawPromptInput,
  ): StructuredPrompt {
    const normalized = this.normalizeInput(input);
    const now = new Date();

    return {
      id: uuidv4(),
      version: "1.0.0",
      workflow: "general",
      instruction: normalized.content,
      context: {
        projectOverview: "",
        relevantFiles: [],
        dependencies: [],
        currentState: "",
        technicalStack: [],
      },
      inputs: [
        {
          label: "Original Input",
          value: normalized.content,
          type: "text",
        },
      ],
      expectedOutput: {
        format: "structured_data",
      },
      validation: {
        isValid: false,
        score: 0,
        issues: [
          {
            severity: "error",
            field: "enhancement",
            message: "Failed to enhance prompt",
          },
        ],
        suggestions: [
          "Try rephrasing your prompt",
          "Add more specific details",
        ],
      },
      metadata: {
        createdAt: now,
        updatedAt: now,
      },
    };
  }

  private formatContextForAI(context: any): string {
    let contextString = `Project Context:
- Files: ${context.files?.length || 0} relevant files found
- Dependencies: ${Object.keys(context.dependencies || {})
      .slice(0, 10)
      .join(", ")}
- Tech Stack: ${context.technicalStack?.join(", ") || "TypeScript, Bun"}`;

    // Include project rules and agent instructions
    if (context.agentInstructions) {
      contextString += `

PROJECT RULES AND AGENT INSTRUCTIONS:
The enhanced prompt must include and follow these comprehensive project rules:

${context.agentInstructions}

IMPORTANT: These rules must be incorporated into the enhanced prompt itself, not just referenced. The enhanced prompt should be self-contained and include all relevant coding standards, behavior guidelines, and development practices.`;
    }

    if (context.projectRules) {
      contextString += `

ADDITIONAL PROJECT RULES:
${context.projectRules}`;
    }

    return contextString;
  }

  private getOutputFormat(
    workflowType: string,
  ): StructuredPrompt["expectedOutput"]["format"] {
    const formats: Record<
      string,
      StructuredPrompt["expectedOutput"]["format"]
    > = {
      bug: "code",
      feature: "code",
      refactor: "code",
      documentation: "documentation",
      research: "analysis",
      pr_review: "analysis",
      general: "structured_data",
    };
    return formats[workflowType] || "structured_data";
  }

  private getOutputStructure(workflowType: string): string {
    const structures: Record<string, string> = {
      bug: "Fixed code with error handling",
      feature: "Implementation with tests",
      refactor: "Improved code structure",
      documentation: "Markdown documentation",
      research: "Analysis with recommendations",
      pr_review: "Review feedback",
      general: "Appropriate format for task",
    };
    return structures[workflowType] || "Structured output";
  }

  private exportToYaml(prompt: StructuredPrompt): string {
    // Simple YAML export (for production, use a proper YAML library)
    const lines = [
      `id: ${prompt.id}`,
      `version: ${prompt.version}`,
      `workflow: ${prompt.workflow}`,
      `score: ${prompt.validation.score}`,
      "",
      "instruction: |",
      ...prompt.instruction.split("\n").map((line) => `  ${line}`),
      "",
    ];

    if (prompt.successCriteria?.length) {
      lines.push("successCriteria:");
      prompt.successCriteria.forEach((criteria) => {
        lines.push(`  - ${criteria}`);
      });
    }

    return lines.join("\n");
  }

  private exportToMarkdown(prompt: StructuredPrompt): string {
    const sections = [
      `# Enhanced Prompt`,
      "",
      `**ID**: ${prompt.id}`,
      `**Workflow**: ${prompt.workflow}`,
      `**Score**: ${prompt.validation.score}/100`,
      "",
      "## Instruction",
      prompt.instruction,
      "",
    ];

    if (prompt.context.relevantFiles.length > 0) {
      sections.push("## Relevant Files");
      prompt.context.relevantFiles.forEach((file) => {
        sections.push(`- \`${file.path}\`: ${file.summary}`);
      });
      sections.push("");
    }

    if (prompt.successCriteria?.length) {
      sections.push("## Success Criteria");
      prompt.successCriteria.forEach((criteria, i) => {
        sections.push(`${i + 1}. ✅ ${criteria}`);
      });
      sections.push("");
    }

    if (prompt.constraints?.length) {
      sections.push("## Constraints");
      prompt.constraints.forEach((constraint) => {
        sections.push(`- ${constraint}`);
      });
      sections.push("");
    }

    if (prompt.clarifyingQuestions?.length) {
      sections.push("## Clarifying Questions");
      prompt.clarifyingQuestions.forEach((question, i) => {
        sections.push(`${i + 1}. ${question}`);
      });
    }

    return sections.join("\n");
  }
}
