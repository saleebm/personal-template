// packages/prompt-enhancer/src/validator.ts

import {
  StructuredPrompt,
  ValidationResult,
  ValidationIssue,
  WorkflowType,
} from "./types";
import { Logger } from "./logger";

export class PromptValidator {
  private readonly MIN_INSTRUCTION_LENGTH = 20;
  private readonly MIN_CONTEXT_FILES = 0;
  private readonly MIN_SUCCESS_CRITERIA = 2;

  constructor(private logger: Logger) {}

  validate(prompt: StructuredPrompt): ValidationResult {
    this.logger.debug("Validating prompt", { id: prompt.id });

    const issues: ValidationIssue[] = [];
    const suggestions: string[] = [];

    // Validate required fields
    this.validateRequiredFields(prompt, issues);

    // Validate instruction quality
    this.validateInstruction(prompt, issues, suggestions);

    // Validate context completeness
    this.validateContext(prompt, issues, suggestions);

    // Validate workflow-specific requirements
    this.validateWorkflowRequirements(prompt, issues, suggestions);

    // Calculate score
    const score = this.calculateScore(prompt, issues);

    const result: ValidationResult = {
      isValid: issues.filter((i) => i.severity === "error").length === 0,
      score,
      issues,
      suggestions,
    };

    this.logger.debug("Validation complete", {
      score,
      issues: issues.length,
      isValid: result.isValid,
    });

    return result;
  }

  private validateRequiredFields(
    prompt: StructuredPrompt,
    issues: ValidationIssue[],
  ): void {
    if (!prompt.id) {
      issues.push({
        severity: "error",
        field: "id",
        message: "Prompt ID is required",
      });
    }

    if (!prompt.instruction || prompt.instruction.trim() === "") {
      issues.push({
        severity: "error",
        field: "instruction",
        message: "Instruction cannot be empty",
      });
    }

    if (!prompt.workflow) {
      issues.push({
        severity: "error",
        field: "workflow",
        message: "Workflow type must be specified",
      });
    }

    if (!prompt.context) {
      issues.push({
        severity: "error",
        field: "context",
        message: "Context is required",
      });
    }
  }

  private validateInstruction(
    prompt: StructuredPrompt,
    issues: ValidationIssue[],
    suggestions: string[],
  ): void {
    const instruction = prompt.instruction || "";

    // Check length
    if (instruction.length < this.MIN_INSTRUCTION_LENGTH) {
      issues.push({
        severity: "warning",
        field: "instruction",
        message: `Instruction is too short (${instruction.length} chars)`,
        fix: "Add more specific details about what needs to be done",
      });
      suggestions.push(
        "Expand the instruction with specific requirements and context",
      );
    }

    // Check for vague language
    const vagueTerms = [
      "something",
      "somehow",
      "stuff",
      "thing",
      "whatever",
      "etc",
    ];
    const foundVagueTerms = vagueTerms.filter((term) =>
      instruction.toLowerCase().includes(term),
    );

    if (foundVagueTerms.length > 0) {
      issues.push({
        severity: "warning",
        field: "instruction",
        message: `Instruction contains vague terms: ${foundVagueTerms.join(", ")}`,
        fix: "Replace vague terms with specific descriptions",
      });
      suggestions.push("Be more specific about what exactly needs to be done");
    }

    // Check for action words
    const actionWords = [
      "create",
      "implement",
      "fix",
      "add",
      "update",
      "refactor",
      "document",
    ];
    const hasActionWord = actionWords.some((word) =>
      instruction.toLowerCase().includes(word),
    );

    if (!hasActionWord) {
      issues.push({
        severity: "info",
        field: "instruction",
        message: "Instruction lacks clear action words",
        fix: "Start with a clear action verb",
      });
    }
  }

  private validateContext(
    prompt: StructuredPrompt,
    issues: ValidationIssue[],
    suggestions: string[],
  ): void {
    if (!prompt.context) return;

    // Check for relevant files
    if (prompt.context.relevantFiles.length === 0) {
      issues.push({
        severity: "info",
        field: "context.relevantFiles",
        message: "No relevant files identified",
        fix: "Consider adding file paths that might be affected",
      });
      suggestions.push("Specify which files or components will be modified");
    }

    // Check technical stack
    if (prompt.context.technicalStack.length === 0) {
      issues.push({
        severity: "warning",
        field: "context.technicalStack",
        message: "Technical stack not identified",
        fix: "Specify the technologies involved",
      });
    }

    // Check dependencies
    if (prompt.context.dependencies.length === 0) {
      issues.push({
        severity: "info",
        field: "context.dependencies",
        message: "No dependencies listed",
        fix: "Consider which libraries or packages are involved",
      });
    }
  }

  private validateWorkflowRequirements(
    prompt: StructuredPrompt,
    issues: ValidationIssue[],
    suggestions: string[],
  ): void {
    switch (prompt.workflow) {
      case WorkflowType.BUG:
        if (!prompt.successCriteria || prompt.successCriteria.length < 2) {
          issues.push({
            severity: "warning",
            field: "successCriteria",
            message: "Bug fixes should have clear success criteria",
            fix: "Add criteria for verifying the fix",
          });
          suggestions.push("Include steps to verify the bug is fixed");
        }
        break;

      case WorkflowType.FEATURE:
        if (!prompt.successCriteria || prompt.successCriteria.length < 3) {
          issues.push({
            severity: "warning",
            field: "successCriteria",
            message: "Features should have comprehensive success criteria",
            fix: "Add acceptance criteria for the feature",
          });
        }
        if (!prompt.examples || prompt.examples.length === 0) {
          suggestions.push(
            "Consider adding usage examples for the new feature",
          );
        }
        break;

      case WorkflowType.REFACTOR:
        if (!prompt.constraints || prompt.constraints.length === 0) {
          issues.push({
            severity: "warning",
            field: "constraints",
            message: "Refactoring should specify constraints",
            fix: "Add constraints like maintaining backward compatibility",
          });
        }
        break;

      case WorkflowType.DOCUMENTATION:
        if (!prompt.expectedOutput.structure) {
          issues.push({
            severity: "info",
            field: "expectedOutput.structure",
            message: "Documentation should specify format",
            fix: "Specify the documentation structure expected",
          });
        }
        break;
    }
  }

  private calculateScore(
    prompt: StructuredPrompt,
    issues: ValidationIssue[],
  ): number {
    let score = 100;

    // Deduct points for issues
    for (const issue of issues) {
      switch (issue.severity) {
        case "error":
          score -= 20;
          break;
        case "warning":
          score -= 10;
          break;
        case "info":
          score -= 5;
          break;
      }
    }

    // Bonus points for quality features
    if (prompt.successCriteria && prompt.successCriteria.length >= 3) {
      score += 5;
    }
    if (prompt.examples && prompt.examples.length > 0) {
      score += 5;
    }
    if (prompt.constraints && prompt.constraints.length > 0) {
      score += 5;
    }
    if (prompt.context.relevantFiles.length > 3) {
      score += 5;
    }

    // Instruction quality bonus
    const instruction = prompt.instruction || "";
    if (instruction.length > 100) {
      score += 5;
    }
    if (instruction.length > 200) {
      score += 5;
    }

    // Ensure score is within bounds
    return Math.max(0, Math.min(100, score));
  }
}

// packages/prompt-enhancer/src/optimizer.ts

import { StructuredPrompt, Example } from "./types";
import { Logger } from "./logger";

export class PromptOptimizer {
  constructor(
    private maxTokens: number,
    private logger: Logger,
  ) {}

  async optimize(prompt: StructuredPrompt): Promise<StructuredPrompt> {
    this.logger.debug("Optimizing prompt", { id: prompt.id });

    // Create a copy to avoid mutations
    const optimized = JSON.parse(JSON.stringify(prompt)) as StructuredPrompt;

    // Optimize instruction clarity
    optimized.instruction = this.optimizeInstruction(optimized.instruction);

    // Trim context to fit token limits
    this.optimizeContext(optimized);

    // Add examples if missing
    if (!optimized.examples || optimized.examples.length === 0) {
      optimized.examples = this.generateExamples(optimized);
    }

    // Optimize success criteria
    if (optimized.successCriteria) {
      optimized.successCriteria = this.optimizeSuccessCriteria(
        optimized.successCriteria,
      );
    }

    // Ensure constraints are actionable
    if (optimized.constraints) {
      optimized.constraints = this.optimizeConstraints(optimized.constraints);
    }

    // Final token count check
    this.enforceTokenLimit(optimized);

    this.logger.debug("Optimization complete");
    return optimized;
  }

  private optimizeInstruction(instruction: string): string {
    // Remove redundant words
    let optimized = instruction
      .replace(/\b(basically|actually|really|very|just)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    // Ensure it starts with an action word
    const actionWords = [
      "implement",
      "create",
      "fix",
      "add",
      "update",
      "refactor",
      "build",
    ];
    const startsWithAction = actionWords.some((word) =>
      optimized.toLowerCase().startsWith(word),
    );

    if (!startsWithAction && optimized.length < 100) {
      // Try to infer the action from the content
      if (optimized.includes("not working") || optimized.includes("broken")) {
        optimized = `Fix the issue where ${optimized}`;
      } else if (optimized.includes("need") || optimized.includes("want")) {
        optimized = `Implement functionality to ${optimized}`;
      }
    }

    // Capitalize first letter
    optimized = optimized.charAt(0).toUpperCase() + optimized.slice(1);

    // Ensure it ends with proper punctuation
    if (!/[.!?]$/.test(optimized)) {
      optimized += ".";
    }

    return optimized;
  }

  private optimizeContext(prompt: StructuredPrompt): void {
    // Limit number of relevant files
    if (prompt.context.relevantFiles.length > 10) {
      // Sort by relevance (simplified - in production you'd use better scoring)
      prompt.context.relevantFiles = prompt.context.relevantFiles
        .slice(0, 10)
        .map((file) => ({
          ...file,
          summary: this.truncateString(file.summary, 100),
        }));
    }

    // Limit dependencies list
    if (prompt.context.dependencies.length > 15) {
      prompt.context.dependencies = [
        ...prompt.context.dependencies.slice(0, 10),
        `... and ${prompt.context.dependencies.length - 10} more`,
      ];
    }

    // Ensure project overview is concise
    prompt.context.projectOverview = this.truncateString(
      prompt.context.projectOverview,
      200,
    );
  }

  private generateExamples(prompt: StructuredPrompt): Example[] {
    const examples: Example[] = [];

    switch (prompt.workflow) {
      case "bug":
        examples.push({
          input: 'User reports: "Cannot login after password reset"',
          output: "Fixed token validation in password reset flow",
          explanation: "The issue was caused by incorrect token expiry check",
        });
        break;

      case "feature":
        examples.push({
          input: "Add user profile page",
          output:
            "Created /profile route with user data display and edit functionality",
          explanation:
            "Implemented using existing auth context and form components",
        });
        break;

      case "refactor":
        examples.push({
          input: "Improve database query performance",
          output: "Optimized queries using indexes and batch operations",
          explanation: "Reduced query time by 60% through proper indexing",
        });
        break;
    }

    return examples;
  }

  private optimizeSuccessCriteria(criteria: string[]): string[] {
    return criteria
      .filter((c) => c.trim().length > 0)
      .map((c) => {
        // Ensure each criterion starts with a verb
        const trimmed = c.trim();
        const startsWithVerb = /^[A-Z][a-z]+/.test(trimmed);

        if (!startsWithVerb) {
          return `Ensure ${trimmed.toLowerCase()}`;
        }
        return trimmed;
      })
      .slice(0, 5); // Limit to 5 criteria
  }

  private optimizeConstraints(constraints: string[]): string[] {
    return constraints
      .filter((c) => c.trim().length > 0)
      .map((c) => {
        const trimmed = c.trim();
        // Make constraints actionable
        if (!trimmed.includes("must") && !trimmed.includes("should")) {
          return `Must ${trimmed.toLowerCase()}`;
        }
        return trimmed;
      })
      .slice(0, 5); // Limit to 5 constraints
  }

  private enforceTokenLimit(prompt: StructuredPrompt): void {
    // Rough token estimation (1 token ≈ 4 characters)
    const estimatedTokens = JSON.stringify(prompt).length / 4;

    if (estimatedTokens > this.maxTokens) {
      this.logger.warn("Prompt exceeds token limit, trimming content", {
        estimated: estimatedTokens,
        limit: this.maxTokens,
      });

      // Progressive trimming
      if (prompt.examples && prompt.examples.length > 1) {
        prompt.examples = prompt.examples.slice(0, 1);
      }

      if (prompt.context.relevantFiles.length > 5) {
        prompt.context.relevantFiles = prompt.context.relevantFiles.slice(0, 5);
      }

      if (prompt.clarifyingQuestions && prompt.clarifyingQuestions.length > 2) {
        prompt.clarifyingQuestions = prompt.clarifyingQuestions.slice(0, 2);
      }
    }
  }

  private truncateString(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - 3) + "...";
  }
}

// packages/prompt-enhancer/src/storage.ts

import { mkdir, readFile, writeFile, readdir } from "fs/promises";
import { join } from "path";
import { StructuredPrompt, PromptSearchQuery } from "./types";
import { Logger } from "./logger";

export class PromptStorage {
  private indexPath: string;
  private index: Map<string, PromptIndexEntry> = new Map();

  constructor(
    private storageDir: string,
    private logger: Logger,
  ) {
    this.indexPath = join(storageDir, "index.json");
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Ensure storage directory exists
      await mkdir(this.storageDir, { recursive: true });

      // Load existing index
      await this.loadIndex();
    } catch (error) {
      this.logger.error("Failed to initialize storage", error);
    }
  }

  private async loadIndex(): Promise<void> {
    try {
      const content = await readFile(this.indexPath, "utf-8");
      const entries = JSON.parse(content) as PromptIndexEntry[];

      for (const entry of entries) {
        this.index.set(entry.id, entry);
      }

      this.logger.debug("Loaded prompt index", { count: this.index.size });
    } catch {
      // Index doesn't exist yet
      this.logger.debug("No existing index found");
    }
  }

  private async saveIndex(): Promise<void> {
    const entries = Array.from(this.index.values());
    await writeFile(this.indexPath, JSON.stringify(entries, null, 2));
  }

  async save(prompt: StructuredPrompt): Promise<string> {
    const filename = `${prompt.id}.json`;
    const filepath = join(this.storageDir, filename);

    // Save prompt file
    await writeFile(filepath, JSON.stringify(prompt, null, 2));

    // Update index
    const indexEntry: PromptIndexEntry = {
      id: prompt.id,
      workflow: prompt.workflow,
      score: prompt.validation.score,
      createdAt: prompt.metadata.createdAt,
      updatedAt: prompt.metadata.updatedAt,
      author: prompt.metadata.author,
      tags: prompt.metadata.tags || [],
      summary: prompt.instruction.slice(0, 100),
    };

    this.index.set(prompt.id, indexEntry);
    await this.saveIndex();

    this.logger.info("Prompt saved", { id: prompt.id, path: filepath });
    return prompt.id;
  }

  async load(id: string): Promise<StructuredPrompt> {
    const filename = `${id}.json`;
    const filepath = join(this.storageDir, filename);

    try {
      const content = await readFile(filepath, "utf-8");
      const prompt = JSON.parse(content) as StructuredPrompt;

      // Convert date strings back to Date objects
      prompt.metadata.createdAt = new Date(prompt.metadata.createdAt);
      prompt.metadata.updatedAt = new Date(prompt.metadata.updatedAt);

      return prompt;
    } catch (error) {
      this.logger.error("Failed to load prompt", { id, error });
      throw new Error(`Prompt not found: ${id}`);
    }
  }

  async search(query: PromptSearchQuery): Promise<StructuredPrompt[]> {
    const results: StructuredPrompt[] = [];

    for (const entry of this.index.values()) {
      // Check workflow type
      if (query.workflow && entry.workflow !== query.workflow) {
        continue;
      }

      // Check tags
      if (query.tags && query.tags.length > 0) {
        const hasTag = query.tags.some((tag) => entry.tags.includes(tag));
        if (!hasTag) continue;
      }

      // Check author
      if (query.author && entry.author !== query.author) {
        continue;
      }

      // Check date range
      if (query.dateRange) {
        const createdAt = new Date(entry.createdAt);
        if (
          createdAt < query.dateRange.start ||
          createdAt > query.dateRange.end
        ) {
          continue;
        }
      }

      // Check minimum score
      if (query.minScore && entry.score < query.minScore) {
        continue;
      }

      // Load the full prompt
      try {
        const prompt = await this.load(entry.id);
        results.push(prompt);
      } catch {
        // Skip if prompt file is missing
      }
    }

    return results;
  }
}

interface PromptIndexEntry {
  id: string;
  workflow: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
  author?: string;
  tags: string[];
  summary: string;
}

// packages/prompt-enhancer/src/logger.ts

export type LogLevel =
  | "silent"
  | "error"
  | "warn"
  | "info"
  | "verbose"
  | "debug";

export class Logger {
  private levels: Record<LogLevel, number> = {
    silent: 0,
    error: 1,
    warn: 2,
    info: 3,
    verbose: 4,
    debug: 5,
  };

  private currentLevel: number;

  constructor(level: LogLevel = "error") {
    this.currentLevel = this.levels[level];
  }

  error(message: string, error?: any): void {
    if (this.currentLevel >= this.levels.error) {
      console.error(`[ERROR] ${message}`, error || "");
    }
  }

  warn(message: string, data?: any): void {
    if (this.currentLevel >= this.levels.warn) {
      console.warn(`[WARN] ${message}`, data || "");
    }
  }

  info(message: string, data?: any): void {
    if (this.currentLevel >= this.levels.info) {
      console.info(`[INFO] ${message}`, data || "");
    }
  }

  verbose(message: string, data?: any): void {
    if (this.currentLevel >= this.levels.verbose) {
      console.log(`[VERBOSE] ${message}`, data || "");
    }
  }

  debug(message: string, data?: any): void {
    if (this.currentLevel >= this.levels.debug) {
      console.log(`[DEBUG] ${message}`, data || "");
    }
  }
}
