import { readFileSync, readdirSync, existsSync } from "fs";
import { join, basename } from "path";

export interface ProjectRule {
  source: string;
  fileName: string;
  content: string;
}

export interface LoadedRules {
  rules: ProjectRule[];
  rulesText: string;
  count: number;
}

/**
 * Loads all rule files from the .ruler directory
 */
export class RuleLoader {
  private rulerPath: string;
  private cachedRules: LoadedRules | null = null;
  private cacheTimestamp: number = 0;
  private cacheDuration: number = 60000; // 1 minute cache

  constructor(projectPath: string = process.cwd()) {
    this.rulerPath = join(projectPath, ".ruler");
  }

  /**
   * Load all rules from the .ruler directory
   * @param forceReload - Force reload even if cached
   * @returns Structured object containing all rules
   */
  async loadRules(forceReload = false): Promise<LoadedRules> {
    const now = Date.now();

    // Return cached rules if still valid
    if (
      !forceReload &&
      this.cachedRules &&
      now - this.cacheTimestamp < this.cacheDuration
    ) {
      return this.cachedRules;
    }

    // Check if .ruler directory exists
    if (!existsSync(this.rulerPath)) {
      console.warn(`⚠️  .ruler directory not found at ${this.rulerPath}`);
      return {
        rules: [],
        rulesText: "",
        count: 0,
      };
    }

    const rules: ProjectRule[] = [];

    try {
      // Read all .md and .json files from .ruler directory
      const files = readdirSync(this.rulerPath)
        .filter((file) => file.endsWith(".md") || file.endsWith(".json"))
        .sort(); // Sort for consistent ordering

      for (const file of files) {
        const filePath = join(this.rulerPath, file);
        try {
          const content = readFileSync(filePath, "utf-8");
          rules.push({
            source: `.ruler/${file}`,
            fileName: basename(file, file.endsWith(".md") ? ".md" : ".json"),
            content: content.trim(),
          });
        } catch (error) {
          console.error(`Error reading rule file ${filePath}:`, error);
        }
      }

      // Format rules as text for inclusion in prompts
      const rulesText = this.formatRulesAsText(rules);

      this.cachedRules = {
        rules,
        rulesText,
        count: rules.length,
      };
      this.cacheTimestamp = now;

      return this.cachedRules;
    } catch (error) {
      console.error("Error loading rules:", error);
      return {
        rules: [],
        rulesText: "",
        count: 0,
      };
    }
  }

  /**
   * Format rules as structured text for inclusion in prompts
   */
  private formatRulesAsText(rules: ProjectRule[]): string {
    if (rules.length === 0) return "";

    const sections: string[] = [
      "### PROJECT RULES AND STANDARDS (MUST BE FOLLOWED)",
      "",
    ];

    for (const rule of rules) {
      sections.push("---");
      sections.push(`#### Source: ${rule.source}`);
      sections.push("---");
      sections.push(rule.content);
      sections.push("");
    }

    return sections.join("\n");
  }

  /**
   * Get specific rule by filename
   */
  async getRule(fileName: string): Promise<ProjectRule | null> {
    const rules = await this.loadRules();
    return rules.rules.find((r) => r.fileName === fileName) || null;
  }

  /**
   * Check if rules are available
   */
  async hasRules(): Promise<boolean> {
    const rules = await this.loadRules();
    return rules.count > 0;
  }

  /**
   * Clear the cache to force reload on next access
   */
  clearCache(): void {
    this.cachedRules = null;
    this.cacheTimestamp = 0;
  }
}
