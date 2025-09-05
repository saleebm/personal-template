import { promises as fs } from "fs";
import { join, relative } from "path";
import { findProjectRoot } from "./utils.js";

export interface CodebaseContext {
  files: Array<{ path: string; summary: string }>;
  dependencies: Record<string, string>;
  technicalStack: string[];
  projectRules?: string;
  agentInstructions?: string;
}

export class ContextAnalyzer {
  private projectPath: string;
  private cache: Map<string, CodebaseContext> = new Map();
  private readonly IGNORE_PATTERNS = [
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    "coverage",
    ".turbo",
    "*.log",
  ];

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  async analyze(prompt: string): Promise<CodebaseContext> {
    // Check cache
    const cacheKey = prompt.slice(0, 50);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const context: CodebaseContext = {
      files: [],
      dependencies: {},
      technicalStack: [],
    };

    try {
      // Load project rules and agent instructions
      await this.loadProjectRules(context);

      // Analyze package.json
      await this.analyzePackageJson(context);

      // Find relevant files based on prompt keywords
      const keywords = this.extractKeywords(prompt);
      const relevantFiles = await this.findRelevantFiles(keywords);

      context.files = relevantFiles.slice(0, 10).map((path) => ({
        path: relative(this.projectPath, path),
        summary: `File: ${relative(this.projectPath, path)}`,
      }));

      // Cache result
      this.cache.set(cacheKey, context);
    } catch (error) {
      console.error("Context analysis failed:", error);
    }

    return context;
  }

  private async loadProjectRules(context: CodebaseContext): Promise<void> {
    try {
      // Find the project root (in case we're running from a subdirectory)
      const projectRoot = findProjectRoot(this.projectPath);

      // Load AGENTS.md (comprehensive project rules)
      const agentsPath = join(projectRoot, "AGENTS.md");
      try {
        const agentsContent = await fs.readFile(agentsPath, "utf-8");
        // If content is very long, include full content but add note about it being comprehensive
        if (agentsContent.length > 10000) {
          context.agentInstructions = `${agentsContent}

NOTE: This is a comprehensive rule set. The enhanced prompt should incorporate the most relevant rules for the specific task while maintaining the core principles of code quality, architecture, and development practices.`;
        } else {
          context.agentInstructions = agentsContent;
        }
      } catch (error) {
        // Try CLAUDE.md as fallback
        const claudePath = join(projectRoot, "CLAUDE.md");
        try {
          const claudeContent = await fs.readFile(claudePath, "utf-8");
          context.agentInstructions = claudeContent;
        } catch (error) {
          // No agent instructions found
        }
      }

      // Load additional project-specific rule files
      const ruleFiles = [
        ".ai-dr/rules.md",
        "docs/rules.md",
        "PROJECT_GUIDELINES.md",
        "CONTRIBUTING.md",
      ];

      let projectRulesContent = "";
      for (const ruleFile of ruleFiles) {
        try {
          const rulePath = join(projectRoot, ruleFile);
          const content = await fs.readFile(rulePath, "utf-8");
          projectRulesContent += `\n\n## Rules from ${ruleFile}\n\n${content}`;
        } catch (error) {
          // Rule file doesn't exist, continue
        }
      }

      if (projectRulesContent.trim()) {
        context.projectRules = projectRulesContent.trim();
      }
    } catch (error) {
      console.error("Failed to load project rules:", error);
    }
  }

  private async analyzePackageJson(context: CodebaseContext): Promise<void> {
    try {
      const packagePath = join(this.projectPath, "package.json");
      const content = await fs.readFile(packagePath, "utf-8");
      const pkg = JSON.parse(content);

      context.dependencies = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };

      // Detect technical stack
      const deps = Object.keys(context.dependencies);
      if (deps.some((d) => d.includes("next")))
        context.technicalStack.push("Next.js");
      if (deps.some((d) => d.includes("react")))
        context.technicalStack.push("React");
      if (deps.some((d) => d.includes("express")))
        context.technicalStack.push("Express");
      if (deps.some((d) => d.includes("prisma")))
        context.technicalStack.push("Prisma");
      if (deps.some((d) => d.includes("typescript")))
        context.technicalStack.push("TypeScript");

      // Always add Bun for this project
      context.technicalStack.push("Bun");
    } catch (error) {
      // Package.json not found or invalid
    }
  }

  private extractKeywords(prompt: string): string[] {
    const words = prompt
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .filter(
        (w) => !/^(the|and|for|with|from|that|this|have|will|been)$/.test(w),
      );

    return [...new Set(words)];
  }

  private async findRelevantFiles(keywords: string[]): Promise<string[]> {
    const files: string[] = [];

    try {
      await this.searchDirectory(this.projectPath, (filePath) => {
        const relativePath = relative(this.projectPath, filePath).toLowerCase();

        // Check if path contains any keywords
        for (const keyword of keywords) {
          if (relativePath.includes(keyword)) {
            files.push(filePath);
            return files.length < 20; // Limit results
          }
        }

        return true; // Continue searching
      });
    } catch (error) {
      console.error("File search failed:", error);
    }

    return files;
  }

  private async searchDirectory(
    dir: string,
    callback: (path: string) => boolean,
  ): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        // Skip ignored patterns
        if (
          this.IGNORE_PATTERNS.some((pattern) => entry.name.includes(pattern))
        ) {
          continue;
        }

        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          await this.searchDirectory(fullPath, callback);
        } else if (entry.isFile() && this.isSourceFile(entry.name)) {
          const shouldContinue = callback(fullPath);
          if (!shouldContinue) return;
        }
      }
    } catch (error) {
      // Directory not accessible
    }
  }

  private isSourceFile(filename: string): boolean {
    const extensions = [
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      ".json",
      ".yaml",
      ".yml",
      ".md",
    ];
    return extensions.some((ext) => filename.endsWith(ext));
  }
}
