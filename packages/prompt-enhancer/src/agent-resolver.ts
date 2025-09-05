import { promises as fs } from 'fs';
import { join, relative } from 'path';
import { findProjectRoot } from './utils.js';
import type { AgentInfo, AgentResolutionResult } from './types.js';

export class AgentResolver {
  private projectPath: string;
  private agentCache: Map<string, AgentInfo[]> = new Map();
  private readonly AGENT_PATTERNS = [
    /\b(?:use|with|using)\s+([a-z-]+(?:\-[a-z-]+)*(?:\-engineer|\-agent|\-orchestrator|\-architect|\-resolver|\-reviewer))/gi,
    /\@([a-z-]+(?:\-[a-z-]+)*(?:\-engineer|\-agent|\-orchestrator|\-architect|\-resolver|\-reviewer))/gi,
    /(?:nextjs|typescript|backend|frontend|ui|api|workflow|ai-dr)[\-\s]*(engineer|agent|orchestrator|architect|resolver|reviewer|challenger)/gi
  ];

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  async resolveAgentMentions(prompt: string): Promise<AgentResolutionResult> {
    const projectRoot = findProjectRoot(this.projectPath);
    const availableAgents = await this.loadAvailableAgents(projectRoot);
    
    let processedPrompt = prompt;
    const resolvedAgents: AgentInfo[] = [];
    
    // Detect potential agent mentions using patterns
    const potentialAgents = this.detectAgentMentions(prompt);
    
    // Try to match potential agents to available agents
    for (const mention of potentialAgents) {
      const matchedAgent = this.findBestAgentMatch(mention, availableAgents);
      if (matchedAgent && !resolvedAgents.find(a => a.name === matchedAgent.name)) {
        resolvedAgents.push(matchedAgent);
        
        // Replace the mention with the proper @agent-{name} format
        const agentReference = `@agent-${matchedAgent.name}`;
        processedPrompt = this.replaceMentionInPrompt(processedPrompt, mention, agentReference);
      }
    }
    
    return {
      originalPrompt: prompt,
      processedPrompt,
      resolvedAgents
    };
  }

  private async loadAvailableAgents(projectRoot: string): Promise<AgentInfo[]> {
    const cacheKey = projectRoot;
    if (this.agentCache.has(cacheKey)) {
      return this.agentCache.get(cacheKey)!;
    }

    const agents: AgentInfo[] = [];
    const agentsDir = join(projectRoot, '.claude/agents');

    try {
      await fs.access(agentsDir);
      const files = await fs.readdir(agentsDir);
      
      for (const file of files) {
        if (file.endsWith('.md')) {
          try {
            const filePath = join(agentsDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const agentInfo = this.parseAgentFile(content, filePath);
            if (agentInfo) {
              agents.push(agentInfo);
            }
          } catch (error) {
            console.warn(`Failed to parse agent file ${file}:`, error);
          }
        }
      }
    } catch (error) {
      // .claude/agents directory doesn't exist
    }

    this.agentCache.set(cacheKey, agents);
    return agents;
  }

  private parseAgentFile(content: string, filePath: string): AgentInfo | null {
    // Parse frontmatter to extract name and description
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch || !frontmatterMatch[1]) {
      return null;
    }

    const frontmatter = frontmatterMatch[1];
    const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
    
    // For description, handle both single line and multi-line formats
    let descriptionMatch = frontmatter.match(/^description:\s*([\s\S]*?)(?=\n[a-zA-Z_-]+:|$)/m);
    
    if (!nameMatch || !nameMatch[1]) {
      return null;
    }

    let description = '';
    if (descriptionMatch && descriptionMatch[1]) {
      // Clean up the description by removing excessive newlines and escape sequences
      description = descriptionMatch[1]
        .replace(/\\n/g, ' ')
        .replace(/\n\s*/g, ' ')
        .trim();
      
      // Truncate long descriptions for readability
      if (description.length > 200) {
        description = description.substring(0, 200) + '...';
      }
    }

    const agentName = nameMatch[1].trim();
    return {
      name: agentName,
      description: description || `Agent: ${agentName}`,
      filePath
    };
  }

  private detectAgentMentions(prompt: string): string[] {
    const mentions = new Set<string>();
    
    // First pass: Look for known full agent names (most specific)
    const knownAgentTerms = [
      'nextjs-ui-api-engineer',
      'typescript-error-resolver', 
      'backend-typescript-architect',
      'senior-code-reviewer',
      'ai-dr-workflow-orchestrator',
      'ai-dr-challenger',
      'principal-engineer',
      'playwright-test-engineer'
    ];

    const foundFullNames = [];
    for (const term of knownAgentTerms) {
      if (prompt.toLowerCase().includes(term.toLowerCase())) {
        mentions.add(term);
        foundFullNames.push(term);
      }
    }

    // Second pass: Use pattern matching, but exclude substrings of already found full names
    for (const pattern of this.AGENT_PATTERNS) {
      const matches = prompt.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          const mention = match[1].toLowerCase();
          
          // Skip if this mention is a substring of an already found full agent name
          const isSubstring = foundFullNames.some(fullName => 
            fullName.toLowerCase().includes(mention) && fullName.toLowerCase() !== mention
          );
          
          if (!isSubstring && mention.length > 4) { // Avoid very short mentions
            mentions.add(mention);
          }
        }
      }
    }

    return Array.from(mentions);
  }

  private findBestAgentMatch(mention: string, availableAgents: AgentInfo[]): AgentInfo | null {
    // Direct name match (highest priority)
    const directMatch = availableAgents.find(agent => 
      agent.name.toLowerCase() === mention.toLowerCase()
    );
    if (directMatch) {
      return directMatch;
    }

    // Exact substring match in agent name (e.g., "nextjs-ui-api-engineer" contains "nextjs-ui-api-engineer")
    const exactSubstringMatch = availableAgents.find(agent =>
      agent.name.toLowerCase().includes(mention.toLowerCase()) && 
      mention.toLowerCase().length > 5 // Avoid matching very short strings like "ui" or "api"
    );
    if (exactSubstringMatch) {
      return exactSubstringMatch;
    }

    // Prefix match (e.g., "nextjs" matches "nextjs-ui-api-engineer" but only if at the start)
    const prefixMatch = availableAgents.find(agent =>
      agent.name.toLowerCase().startsWith(mention.toLowerCase() + '-') &&
      mention.toLowerCase().length > 4 // Avoid very short prefixes
    );
    if (prefixMatch) {
      return prefixMatch;
    }

    return null;
  }

  private replaceMentionInPrompt(prompt: string, mention: string, replacement: string): string {
    // Escape special characters in the mention for regex
    const escapedMention = mention.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Replace various forms of the mention with the standardized format
    // Be more specific to avoid multiple replacements
    const patterns = [
      // Handle @mentions first (most specific)
      new RegExp(`@${escapedMention}\\b`, 'gi'),
      // Handle "use/with/using" + agent name
      new RegExp(`\\b(?:use|with|using)\\s+${escapedMention}\\b`, 'gi'),
      // Handle plain mentions (but only if not already replaced)
      new RegExp(`\\b${escapedMention}\\b(?!-)`, 'gi') // Avoid matching already processed @agent-xxx
    ];

    let result = prompt;
    
    // Apply replacements in order of specificity
    for (const pattern of patterns) {
      if (pattern.test(result)) {
        result = result.replace(pattern, replacement);
        break; // Only apply the first matching pattern to avoid double replacements
      }
    }

    return result;
  }

  async getAvailableAgents(): Promise<AgentInfo[]> {
    const projectRoot = findProjectRoot(this.projectPath);
    return this.loadAvailableAgents(projectRoot);
  }
}