import { promises as fs } from "fs";
import { join, resolve } from "path";
import { type StructuredPrompt, type PromptSearchQuery } from "./types.js";
import {
  generatePromptPath,
  ensurePromptDirectory,
  findProjectRoot,
} from "./utils.js";

export class PromptStorage {
  private storageDir: string;
  private projectPath: string;

  constructor(outputDir: string = ".ai-dr/crafted", projectPath?: string) {
    this.projectPath = projectPath ? resolve(projectPath) : findProjectRoot();
    this.storageDir = outputDir;
    this.ensureDirectory();
  }

  private async ensureDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create storage directory:", error);
    }
  }

  async save(prompt: StructuredPrompt): Promise<string> {
    return this.store(prompt);
  }

  async store(prompt: StructuredPrompt): Promise<string> {
    try {
      // Generate full path with timestamp-based naming
      const filepath = generatePromptPath(this.projectPath, this.storageDir);

      // Ensure directory exists
      await ensurePromptDirectory(filepath);

      // Convert to markdown format
      const markdownContent = this.convertToMarkdown(prompt);

      await fs.writeFile(filepath, markdownContent, "utf-8");

      // Return the full file path instead of just ID
      return filepath;
    } catch (error) {
      console.error("Failed to save prompt:", error);
      throw error;
    }
  }

  async load(id: string): Promise<StructuredPrompt | null> {
    try {
      const filename = `${id}.json`;
      const filepath = join(this.storageDir, filename);

      const content = await fs.readFile(filepath, "utf-8");
      const prompt = JSON.parse(content);

      // Convert date strings back to Date objects
      prompt.metadata.createdAt = new Date(prompt.metadata.createdAt);
      prompt.metadata.updatedAt = new Date(prompt.metadata.updatedAt);

      return prompt;
    } catch (error) {
      console.error("Failed to load prompt:", error);
      return null;
    }
  }

  async search(query: PromptSearchQuery | string): Promise<StructuredPrompt[]> {
    // Handle both string queries and structured queries for backward compatibility
    if (typeof query === "string") {
      return this.searchByText(query);
    }
    return this.searchStructured(query);
  }

  private async searchByText(searchText: string): Promise<StructuredPrompt[]> {
    const results: StructuredPrompt[] = [];

    try {
      await this.ensureDirectory();
      const files = await fs.readdir(this.storageDir);
      const jsonFiles = files.filter((f) => f.endsWith(".json"));

      for (const file of jsonFiles) {
        const filepath = join(this.storageDir, file);
        const content = await fs.readFile(filepath, "utf-8");

        // Simple text search in content
        if (content.toLowerCase().includes(searchText.toLowerCase())) {
          const prompt = JSON.parse(content);

          // Convert date strings
          prompt.metadata.createdAt = new Date(prompt.metadata.createdAt);
          prompt.metadata.updatedAt = new Date(prompt.metadata.updatedAt);

          results.push(prompt);
        }
      }
    } catch (error) {
      console.error("Text search failed:", error);
    }

    return results;
  }

  private async searchStructured(
    query: PromptSearchQuery,
  ): Promise<StructuredPrompt[]> {
    const results: StructuredPrompt[] = [];

    try {
      await this.ensureDirectory();
      const files = await fs.readdir(this.storageDir);
      const jsonFiles = files.filter((f) => f.endsWith(".json"));

      for (const file of jsonFiles) {
        const filepath = join(this.storageDir, file);
        const content = await fs.readFile(filepath, "utf-8");
        const prompt = JSON.parse(content);

        // Convert date strings
        prompt.metadata.createdAt = new Date(prompt.metadata.createdAt);
        prompt.metadata.updatedAt = new Date(prompt.metadata.updatedAt);

        // Apply filters
        if (query.workflow && prompt.workflow !== query.workflow) continue;
        if (query.author && prompt.metadata.author !== query.author) continue;
        if (query.minScore && prompt.validation.score < query.minScore)
          continue;

        if (query.tags && query.tags.length > 0) {
          const promptTags = prompt.metadata.tags || [];
          const hasTag = query.tags.some((tag) => promptTags.includes(tag));
          if (!hasTag) continue;
        }

        if (query.dateRange) {
          const createdAt = prompt.metadata.createdAt;
          if (
            createdAt < query.dateRange.start ||
            createdAt > query.dateRange.end
          ) {
            continue;
          }
        }

        results.push(prompt);
      }
    } catch (error) {
      console.error("Search failed:", error);
    }

    return results;
  }

  /**
   * Converts a structured prompt to markdown format for saving
   */
  private convertToMarkdown(prompt: StructuredPrompt): string {
    const sections = [
      `# Enhanced Prompt`,
      ``,
      `**ID**: ${prompt.id}`,
      `**Version**: ${prompt.version}`,
      `**Workflow Type**: ${prompt.workflow}`,
      `**Score**: ${prompt.validation.score}/100`,
      `**Created**: ${prompt.metadata.createdAt.toISOString()}`,
      `**Updated**: ${prompt.metadata.updatedAt.toISOString()}`,
      ``,
    ];

    // Add author and tags if available
    if (prompt.metadata.author) {
      sections.push(`**Author**: ${prompt.metadata.author}`);
    }
    if (prompt.metadata.tags?.length) {
      sections.push(`**Tags**: ${prompt.metadata.tags.join(", ")}`);
    }
    if (prompt.metadata.author || prompt.metadata.tags?.length) {
      sections.push("");
    }

    // Main instruction
    sections.push("## Instruction");
    sections.push(prompt.instruction);
    sections.push("");

    // Context information
    if (
      prompt.context.relevantFiles.length > 0 ||
      prompt.context.dependencies.length > 0
    ) {
      sections.push("## Context");

      if (prompt.context.projectOverview) {
        sections.push(
          `**Project Overview**: ${prompt.context.projectOverview}`,
        );
      }

      if (prompt.context.technicalStack.length > 0) {
        sections.push(
          `**Technical Stack**: ${prompt.context.technicalStack.join(", ")}`,
        );
      }

      if (prompt.context.relevantFiles.length > 0) {
        sections.push("### Relevant Files");
        prompt.context.relevantFiles.forEach((file) => {
          sections.push(`- \`${file.path}\`: ${file.summary}`);
        });
      }

      if (prompt.context.dependencies.length > 0) {
        sections.push("### Dependencies");
        prompt.context.dependencies.forEach((dep) => {
          sections.push(`- ${dep}`);
        });
      }

      sections.push("");
    }

    // Success criteria
    if (prompt.successCriteria?.length) {
      sections.push("## Success Criteria");
      prompt.successCriteria.forEach((criteria, i) => {
        sections.push(`${i + 1}. ✅ ${criteria}`);
      });
      sections.push("");
    }

    // Constraints
    if (prompt.constraints?.length) {
      sections.push("## Constraints");
      prompt.constraints.forEach((constraint) => {
        sections.push(`- ⚠️ ${constraint}`);
      });
      sections.push("");
    }

    // Clarifying questions
    if (prompt.clarifyingQuestions?.length) {
      sections.push("## Clarifying Questions");
      prompt.clarifyingQuestions.forEach((question, i) => {
        sections.push(`${i + 1}. ❓ ${question}`);
      });
      sections.push("");
    }

    // New sections from enhancement request
    if (prompt.handOffGuidance) {
      sections.push("## Hand-off Guidance");
      sections.push(prompt.handOffGuidance);
      sections.push("");
    }

    if (prompt.openQuestions?.length) {
      sections.push("## Open Questions");
      prompt.openQuestions.forEach((question, i) => {
        sections.push(`${i + 1}. ❓ ${question}`);
      });
      sections.push("");
    }

    if (prompt.constraintsAndNonGoals?.length) {
      sections.push("## Constraints & Non-Goals");
      prompt.constraintsAndNonGoals.forEach((constraint) => {
        sections.push(`- 🚫 ${constraint}`);
      });
      sections.push("");
    }

    if (prompt.discoveredReferences?.length) {
      sections.push("## Discovered References");
      const groupedRefs = prompt.discoveredReferences.reduce(
        (groups, ref) => {
          if (!groups[ref.type]) groups[ref.type] = [];
          groups[ref.type]!.push(ref);
          return groups;
        },
        {} as Record<string, typeof prompt.discoveredReferences>,
      );

      Object.entries(groupedRefs).forEach(([type, refs]) => {
        const icon = type === "url" ? "🔗" : type === "library" ? "📦" : "📋";
        sections.push(`### ${type.charAt(0).toUpperCase() + type.slice(1)}s`);
        refs.forEach((ref) => {
          const context = ref.context ? ` (${ref.context})` : "";
          sections.push(`- ${icon} \`${ref.value}\`${context}`);
        });
      });
      sections.push("");
    }

    // Expected output
    sections.push("## Expected Output");
    sections.push(`**Format**: ${prompt.expectedOutput.format}`);
    if (prompt.expectedOutput.structure) {
      sections.push(`**Structure**: ${prompt.expectedOutput.structure}`);
    }
    sections.push("");

    // Inputs
    if (prompt.inputs.length > 0) {
      sections.push("## Inputs");
      prompt.inputs.forEach((input) => {
        sections.push(`- **${input.label}** (${input.type}): ${input.value}`);
      });
      sections.push("");
    }

    // Validation
    sections.push("## Validation");
    sections.push(
      `**Status**: ${prompt.validation.isValid ? "✅ Valid" : "❌ Invalid"}`,
    );
    sections.push(`**Score**: ${prompt.validation.score}/100`);

    if (prompt.validation.issues.length > 0) {
      sections.push("### Issues");
      prompt.validation.issues.forEach((issue) => {
        const icon =
          issue.severity === "error"
            ? "❌"
            : issue.severity === "warning"
              ? "⚠️"
              : "ℹ️";
        sections.push(`- ${icon} **${issue.field}**: ${issue.message}`);
        if (issue.fix) {
          sections.push(`  - Fix: ${issue.fix}`);
        }
      });
    }

    if (prompt.validation.suggestions.length > 0) {
      sections.push("### Suggestions");
      prompt.validation.suggestions.forEach((suggestion) => {
        sections.push(`- 💡 ${suggestion}`);
      });
    }

    sections.push("");
    sections.push("---");
    sections.push("*Generated by AI Dr. Prompt Enhancer*");
    sections.push(
      "*This prompt includes comprehensive project rules and coding standards for self-contained execution*",
    );

    return sections.join("\n");
  }

  async delete(id: string): Promise<boolean> {
    try {
      const filename = `${id}.json`;
      const filepath = join(this.storageDir, filename);
      await fs.unlink(filepath);
      return true;
    } catch (error) {
      console.error("Failed to delete prompt:", error);
      return false;
    }
  }
}
