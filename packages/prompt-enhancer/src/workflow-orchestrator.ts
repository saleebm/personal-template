import { v4 as uuidv4 } from "uuid";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, resolve } from "path";
import { minimatch } from "minimatch";
import type {
  WorkflowExecution,
  AgentCoordination,
  StructuredPrompt,
  AIEnhancement,
} from "./types.js";
import { generatePromptPath, ensurePromptDirectory } from "./utils.js";

export class WorkflowOrchestrator {
  private projectPath: string;
  private agentsDir: string;
  private contextDir: string;
  private outputDir: string;

  constructor(projectPath: string, outputDir: string = ".ai-dr/crafted") {
    this.projectPath = resolve(projectPath);
    this.agentsDir = join(this.projectPath, ".claude", "agents");
    this.contextDir = join(this.projectPath, ".claude", "tasks");
    this.outputDir = outputDir;

    // Ensure directories exist
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    [this.contextDir, this.outputDir].forEach((dir) => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  async orchestrateWorkflow(
    prompt: StructuredPrompt,
    enhancement: AIEnhancement,
    complexity: "simple" | "moderate" | "complex",
  ): Promise<WorkflowExecution> {
    const sessionId = this.generateSessionId();
    const contextFile = this.createContextFile(sessionId, prompt, enhancement);

    // Determine if agents are needed
    const needsAgents =
      complexity !== "simple" ||
      (enhancement.context.agentSuggestions &&
        enhancement.context.agentSuggestions.length > 0) ||
      false;

    // Build execution plan
    const executionPlan = this.buildExecutionPlan(enhancement, needsAgents);

    // Create workflow execution object
    const workflow: WorkflowExecution = {
      id: uuidv4(),
      sessionId,
      prompt,
      agents: needsAgents
        ? this.prepareAgents(
            enhancement.context.agentSuggestions || [],
            contextFile,
          )
        : undefined,
      contextFiles: [
        contextFile,
        ...this.findRelevantContextFiles(prompt.instruction),
      ],
      executionPlan,
      status: "pending",
      results: {
        outputPath: generatePromptPath(this.projectPath, this.outputDir),
        logs: [],
        metrics: {
          totalTokens: enhancement.tokenCount || 0,
          executionTime: 0,
          stepsCompleted: 0,
        },
      },
    };

    // Save the enhanced prompt to output file
    await this.saveEnhancedPrompt(workflow, enhancement);

    return workflow;
  }

  private generateSessionId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `session_${timestamp}_${uuidv4().slice(0, 8)}`;
  }

  private createContextFile(
    sessionId: string,
    prompt: StructuredPrompt,
    enhancement: AIEnhancement,
  ): string {
    const contextPath = join(this.contextDir, `context_${sessionId}.md`);

    const contextContent = `# Context Session: ${sessionId}
Generated: ${new Date().toISOString()}

## Original Prompt
${prompt.instruction}

## Enhancement Details
- **Workflow Type**: ${enhancement.workflowType}
- **Complexity**: ${enhancement.estimatedComplexity}
- **Confidence Score**: ${enhancement.confidenceScore}%
- **Token Count**: ${enhancement.tokenCount || "N/A"}

## Success Criteria
${enhancement.successCriteria.map((c) => `- ${c}`).join("\n")}

## Implementation Steps
${enhancement.orderOfSteps?.map((s) => s).join("\n") || "No specific steps defined"}

## Constraints
${enhancement.constraints?.map((c) => `- ${c}`).join("\n") || "No constraints specified"}

## Relevant Files
${enhancement.context.relevantFiles.map((f) => `- ${f}`).join("\n") || "No files identified"}

## Technical Stack
${enhancement.context.technicalStack.join(", ")}

## Sub-Agent Recommendations
${enhancement.context.agentSuggestions?.map((a) => `- ${a}`).join("\n") || "No agents needed"}

## Session Log
- [${new Date().toISOString()}] Session initialized
`;

    writeFileSync(contextPath, contextContent, "utf-8");
    return contextPath;
  }

  private prepareAgents(
    agentSuggestions: string[],
    contextFile: string,
  ): AgentCoordination[] {
    return agentSuggestions.map((agentType, index) => ({
      agentType: agentType as AgentCoordination["agentType"],
      agentPath: this.resolveAgentPath(agentType),
      contextFile,
      task: this.generateAgentTask(agentType),
      priority: this.getAgentPriority(agentType, index),
    }));
  }

  private resolveAgentPath(agentType: string): string {
    // Dynamic path resolution for agent configurations
    const agentFile = `${agentType}.md`;
    const fullPath = join(this.agentsDir, agentFile);

    if (existsSync(fullPath)) {
      return fullPath;
    }

    // Fallback to relative path
    return join(".claude", "agents", agentFile);
  }

  private generateAgentTask(agentType: string): string {
    const taskMap: Record<string, string> = {
      "ai-dr-workflow-orchestrator":
        "Orchestrate the workflow execution and manage task dependencies",
      "ai-dr-challenger":
        "Validate the implementation and identify potential issues",
      "nextjs-ui-api-engineer":
        "Design and implement UI components with modern patterns",
      "principle-engineer": "Review architecture and ensure scalability",
      "typescript-error-resolver":
        "Resolve TypeScript errors and ensure type safety",
    };

    return taskMap[agentType] || "Assist with task implementation";
  }

  private getAgentPriority(agentType: string, index: number): number {
    const priorityMap: Record<string, number> = {
      "principle-engineer": 10,
      "ai-dr-workflow-orchestrator": 9,
      "typescript-error-resolver": 8,
      "nextjs-ui-api-engineer": 7,
      "ai-dr-challenger": 6,
    };

    return priorityMap[agentType] || 5 - index;
  }

  private buildExecutionPlan(
    enhancement: AIEnhancement,
    needsAgents: boolean,
  ): WorkflowExecution["executionPlan"] {
    const plan: WorkflowExecution["executionPlan"] = [];
    let stepNumber = 1;

    // Initial analysis step
    plan.push({
      step: stepNumber++,
      description: "Analyze project context and requirements",
      agent: needsAgents ? "ai-dr-workflow-orchestrator" : undefined,
    });

    // Add custom steps from enhancement
    if (enhancement.orderOfSteps) {
      enhancement.orderOfSteps.forEach((stepDesc) => {
        plan.push({
          step: stepNumber++,
          description: stepDesc,
          agent: this.suggestAgentForStep(stepDesc),
          dependencies: [stepNumber - 2],
        });
      });
    }

    // Validation step
    if (needsAgents) {
      plan.push({
        step: stepNumber++,
        description: "Validate implementation and run tests",
        agent: "ai-dr-challenger",
        dependencies: plan.map((p) => p.step).filter((s) => s < stepNumber - 1),
      });
    }

    // Documentation step
    plan.push({
      step: stepNumber,
      description: "Generate documentation and update context",
      dependencies: [stepNumber - 1],
    });

    return plan;
  }

  private suggestAgentForStep(stepDescription: string): string | undefined {
    const lower = stepDescription.toLowerCase();

    if (
      lower.includes("ui") ||
      lower.includes("component") ||
      lower.includes("frontend")
    ) {
      return "nextjs-ui-api-engineer";
    }
    if (
      lower.includes("architecture") ||
      lower.includes("design") ||
      lower.includes("system")
    ) {
      return "principle-engineer";
    }
    if (lower.includes("type") || lower.includes("typescript")) {
      return "typescript-error-resolver";
    }
    if (lower.includes("test") || lower.includes("validate")) {
      return "ai-dr-challenger";
    }

    return undefined;
  }

  private findRelevantContextFiles(instruction: string): string[] {
    const contextFiles: string[] = [];

    if (!existsSync(this.contextDir)) {
      return contextFiles;
    }

    // Find related context files based on keywords
    try {
      const files = readFileSync(join(this.contextDir, "index.md"), "utf-8")
        .split("\n")
        .filter((line) => line.trim());

      const keywords = this.extractKeywords(instruction);

      files.forEach((file) => {
        if (keywords.some((keyword) => file.toLowerCase().includes(keyword))) {
          const fullPath = join(this.contextDir, file);
          if (existsSync(fullPath)) {
            contextFiles.push(fullPath);
          }
        }
      });
    } catch (error) {
      // No index file or error reading, return empty
    }

    return contextFiles.slice(0, 5); // Limit to 5 most relevant files
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
    ]);
    return text
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 3 && !stopWords.has(word))
      .slice(0, 10);
  }

  private async saveEnhancedPrompt(
    workflow: WorkflowExecution,
    enhancement: AIEnhancement,
  ): Promise<void> {
    const outputPath = workflow.results?.outputPath;
    if (!outputPath) return;

    // Ensure directory exists
    await ensurePromptDirectory(outputPath);

    const enhancedPrompt = `# Enhanced Prompt
**Session ID**: ${workflow.sessionId}
**Generated**: ${new Date().toISOString()}
**Complexity**: ${enhancement.estimatedComplexity}
**Confidence**: ${enhancement.confidenceScore}%

## Engineering Task
${enhancement.instruction}

## Implementation Plan

### Workflow Type
${enhancement.workflowType}

### Success Criteria
${enhancement.successCriteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}

### Implementation Steps
${enhancement.orderOfSteps?.map((s, i) => `${i + 1}. ${s}`).join("\n") || "Follow standard workflow"}

### Technical Context
- **Files to Modify**: ${enhancement.context.relevantFiles.join(", ") || "To be determined"}
- **Dependencies**: ${enhancement.context.dependencies.join(", ") || "None identified"}
- **Tech Stack**: ${enhancement.context.technicalStack.join(", ")}

### Constraints & Requirements
${enhancement.constraints?.map((c) => `- ${c}`).join("\n") || "Standard project constraints apply"}

${
  enhancement.clarifyingQuestions && enhancement.clarifyingQuestions.length > 0
    ? `
### Clarifying Questions
${enhancement.clarifyingQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}
`
    : ""
}

## Execution Plan
${workflow.executionPlan
  .map(
    (step) =>
      `### Step ${step.step}: ${step.description}
${step.agent ? `**Agent**: ${step.agent}` : ""}
${step.dependencies ? `**Dependencies**: Steps ${step.dependencies.join(", ")}` : ""}`,
  )
  .join("\n\n")}

## Context Files
${workflow.contextFiles.map((f) => `- ${f}`).join("\n")}

${
  workflow.agents
    ? `
## Sub-Agents Involved
${workflow.agents.map((a) => `- **${a.agentType}** (Priority: ${a.priority}): ${a.task}`).join("\n")}
`
    : ""
}

## Token Usage
- **Total Tokens**: ${enhancement.tokenCount || "Not tracked"}
- **Input Tokens**: ${(enhancement as any).tokenUsage?.input || "N/A"}
- **Output Tokens**: ${(enhancement as any).tokenUsage?.output || "N/A"}

---
*This enhanced prompt was generated by the AI Dr. Prompt Enhancer*
*For workflow execution, use the session context file: ${workflow.contextFiles[0]}*
`;

    writeFileSync(outputPath, enhancedPrompt, "utf-8");
  }

  async updateContextSession(sessionId: string, update: string): Promise<void> {
    const contextPath = join(this.contextDir, `context_${sessionId}.md`);

    if (existsSync(contextPath)) {
      const current = readFileSync(contextPath, "utf-8");
      const updated = `${current}\n- [${new Date().toISOString()}] ${update}`;
      writeFileSync(contextPath, updated, "utf-8");
    }
  }

  findAgentFiles(): string[] {
    if (!existsSync(this.agentsDir)) {
      return [];
    }

    try {
      const files = readFileSync(join(this.agentsDir, "*.md"), "utf-8");
      return files.split("\n").filter((f) => f.endsWith(".md"));
    } catch {
      // Use glob pattern matching as fallback
      const pattern = "*.md";
      const files: string[] = [];

      // Simple file listing (would need proper implementation)
      return [
        "ai-dr-workflow-orchestrator.md",
        "ai-dr-challenger.md",
        "nextjs-ui-api-engineer.md",
        "principle-engineer.md",
        "typescript-error-resolver.md",
      ].filter((f) => existsSync(join(this.agentsDir, f)));
    }
  }
}
