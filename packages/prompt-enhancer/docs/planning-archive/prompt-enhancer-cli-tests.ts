#!/usr/bin/env bun
// scripts/enhance-prompt.ts

import { PromptEnhancerSDK, WorkflowType } from "@repo/prompt-enhancer";
import { readFile, writeFile } from "fs/promises";
import { parseArgs } from "util";
import chalk from "chalk";
import readline from "readline";

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    file: { type: "string", short: "f" },
    type: { type: "string", short: "t", default: "general" },
    output: { type: "string", short: "o" },
    format: { type: "string", default: "markdown" },
    validate: { type: "boolean", short: "v", default: false },
    interactive: { type: "boolean", short: "i", default: false },
    debug: { type: "boolean", short: "d", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});

function showHelp() {
  console.log(`
${chalk.bold("Prompt Enhancer CLI")}

${chalk.yellow("Usage:")}
  enhance-prompt [options] [prompt text]
  
${chalk.yellow("Options:")}
  -f, --file <path>      Read prompt from file
  -t, --type <type>      Workflow type (feature|bug|refactor|documentation|research|pr_review|general)
  -o, --output <path>    Output file path
  --format <format>      Export format (markdown|json|yaml) [default: markdown]
  -v, --validate         Validate only (don't enhance)
  -i, --interactive      Interactive mode with clarifying questions
  -d, --debug           Enable debug logging
  -h, --help            Show this help message

${chalk.yellow("Examples:")}
  # Enhance from text
  enhance-prompt "Add caching to API endpoints"
  
  # Enhance from file with type
  enhance-prompt -f prompt.txt -t feature -o enhanced.md
  
  # Interactive mode
  enhance-prompt -i -t bug
  
  # Validate existing prompt
  enhance-prompt -f prompt.json --validate
`);
}

async function readFromStdin(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    let input = "";

    console.log(chalk.cyan("Enter your prompt (Ctrl+D when done):"));

    rl.on("line", (line) => {
      input += line + "\n";
    });

    rl.on("close", () => {
      resolve(input.trim());
    });
  });
}

async function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(chalk.cyan(`\n${question}\n> `), (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  // Show help if requested
  if (values.help) {
    showHelp();
    process.exit(0);
  }

  try {
    // Initialize SDK
    const enhancer = new PromptEnhancerSDK({
      projectPath: process.cwd(),
      outputDir: ".prompts/",
      enableCodebaseContext: true,
      debug: values.debug,
      logLevel: values.debug ? "debug" : "error",
    });

    // Get input prompt
    let rawPrompt: string;

    if (values.file) {
      console.log(chalk.blue(`📄 Reading from ${values.file}...`));
      rawPrompt = await readFile(values.file as string, "utf-8");
    } else if (positionals.length > 0) {
      rawPrompt = positionals.join(" ");
    } else {
      rawPrompt = await readFromStdin();
    }

    if (!rawPrompt || rawPrompt.trim() === "") {
      console.error(chalk.red("❌ No prompt provided"));
      process.exit(1);
    }

    // Validate only mode
    if (values.validate) {
      console.log(chalk.blue("🔍 Validating prompt..."));

      // Try to parse as JSON first
      try {
        const prompt = JSON.parse(rawPrompt);
        const validation = enhancer.validate(prompt);

        console.log(chalk.bold("\nValidation Results:"));
        console.log(`Score: ${validation.score}/100`);
        console.log(`Valid: ${validation.isValid ? "✅" : "❌"}`);

        if (validation.issues.length > 0) {
          console.log(chalk.yellow("\nIssues:"));
          validation.issues.forEach((issue) => {
            const icon =
              issue.severity === "error"
                ? "❌"
                : issue.severity === "warning"
                  ? "⚠️"
                  : "ℹ️";
            console.log(`  ${icon} ${issue.field}: ${issue.message}`);
            if (issue.fix) {
              console.log(`     Fix: ${issue.fix}`);
            }
          });
        }

        if (validation.suggestions.length > 0) {
          console.log(chalk.cyan("\nSuggestions:"));
          validation.suggestions.forEach((suggestion) => {
            console.log(`  • ${suggestion}`);
          });
        }
      } catch {
        console.error(chalk.red("❌ Invalid JSON format for validation"));
        process.exit(1);
      }

      process.exit(0);
    }

    // Enhancement mode
    console.log(chalk.blue("🚀 Enhancing prompt..."));
    console.log(chalk.gray(`Type: ${values.type}`));

    // Enhance the prompt
    let enhanced = await enhancer.enhance({
      content: rawPrompt,
      type: values.type as WorkflowType,
      metadata: {
        author: process.env["USER"] || "unknown",
        timestamp: new Date(),
        tags: [],
      },
    });

    // Interactive mode - handle clarifying questions
    if (
      values.interactive &&
      enhanced.clarifyingQuestions &&
      enhanced.clarifyingQuestions.length > 0
    ) {
      console.log(
        chalk.yellow("\n📝 I need some clarification to enhance your prompt:"),
      );

      const answers: string[] = [];
      for (const question of enhanced.clarifyingQuestions) {
        const answer = await askQuestion(question);
        answers.push(answer);
      }

      // Re-enhance with additional context
      const updatedContent = `${rawPrompt}\n\nAdditional context:\n${answers.join("\n")}`;
      enhanced = await enhancer.enhance({
        content: updatedContent,
        type: values.type as WorkflowType,
        metadata: {
          author: process.env["USER"] || "unknown",
          timestamp: new Date(),
          tags: [],
        },
      });
    }

    // Display validation results
    console.log(chalk.bold("\n📊 Enhancement Results:"));
    console.log(`ID: ${enhanced.id}`);
    console.log(`Workflow: ${enhanced.workflow}`);
    console.log(`Score: ${getScoreColor(enhanced.validation.score)}`);
    console.log(
      `Valid: ${enhanced.validation.isValid ? chalk.green("✅") : chalk.red("❌")}`,
    );

    if (enhanced.validation.issues.length > 0) {
      console.log(chalk.yellow("\n⚠️  Issues:"));
      enhanced.validation.issues.forEach((issue) => {
        const icon =
          issue.severity === "error"
            ? "❌"
            : issue.severity === "warning"
              ? "⚠️"
              : "ℹ️";
        console.log(`  ${icon} ${issue.message}`);
      });
    }

    if (enhanced.validation.suggestions.length > 0) {
      console.log(chalk.cyan("\n💡 Suggestions:"));
      enhanced.validation.suggestions.forEach((suggestion) => {
        console.log(`  • ${suggestion}`);
      });
    }

    // Store the prompt
    const promptId = await enhancer.store(enhanced);
    console.log(
      chalk.green(`\n✅ Enhanced prompt saved: .prompts/${promptId}.json`),
    );

    // Export if requested
    if (values.output) {
      const format = values.format as "json" | "yaml" | "markdown";
      const exported = enhancer.export(enhanced, format);
      await writeFile(values.output as string, exported);
      console.log(chalk.green(`📄 Exported to: ${values.output}`));
    }

    // Display summary
    console.log(chalk.bold("\n📋 Enhanced Prompt Summary:"));
    console.log(
      `Instruction: ${chalk.white(enhanced.instruction.slice(0, 100))}...`,
    );
    console.log(`Context files: ${enhanced.context.relevantFiles.length}`);
    console.log(`Success criteria: ${enhanced.successCriteria?.length || 0}`);
    console.log(`Constraints: ${enhanced.constraints?.length || 0}`);

    // Show a sample of the enhanced prompt in the terminal
    if (!values.output) {
      console.log(chalk.bold("\n📝 Enhanced Prompt Preview:"));
      console.log(chalk.gray("─".repeat(60)));
      const preview = enhancer
        .export(enhanced, "markdown")
        .split("\n")
        .slice(0, 20)
        .join("\n");
      console.log(preview);
      console.log(chalk.gray("─".repeat(60)));
      console.log(chalk.gray("(Use -o flag to save full enhanced prompt)"));
    }
  } catch (error) {
    console.error(chalk.red("❌ Error:"), error.message);
    if (values.debug) {
      console.error(error);
    }
    process.exit(1);
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return chalk.green(`${score}/100`);
  if (score >= 60) return chalk.yellow(`${score}/100`);
  return chalk.red(`${score}/100`);
}

// Run main function
main().catch(console.error);

// packages/prompt-enhancer/tests/e2e/enhancer.test.ts

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "bun:test";
import { PromptEnhancerSDK, WorkflowType } from "../../src";
import { mkdtemp, rm, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

describe("PromptEnhancer E2E Tests", () => {
  let enhancer: PromptEnhancerSDK;
  let testDir: string;

  beforeAll(async () => {
    testDir = await mkdtemp(join(tmpdir(), "prompt-test-"));
    enhancer = new PromptEnhancerSDK({
      projectPath: testDir,
      outputDir: join(testDir, ".prompts"),
      enableCodebaseContext: true,
      logLevel: "silent",
    });
  });

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe("Core Enhancement Flow", () => {
    it("should enhance a simple bug fix prompt", async () => {
      const raw = `Fix the logger in our app to include process IDs 
                   for better tracking in multithreaded environment`;

      const enhanced = await enhancer.enhance(raw);

      expect(enhanced.workflow).toBe(WorkflowType.BUG);
      expect(enhanced.instruction).toContain("process");
      expect(enhanced.instruction).toContain("ID");
      expect(enhanced.validation.isValid).toBe(true);
      expect(enhanced.validation.score).toBeGreaterThan(50);
    });

    it("should detect and enhance feature development prompts", async () => {
      const raw = `Create a new API endpoint for user profile management
                   with proper authentication and validation`;

      const enhanced = await enhancer.enhance({
        content: raw,
        type: WorkflowType.FEATURE,
      });

      expect(enhanced.workflow).toBe(WorkflowType.FEATURE);
      expect(enhanced.successCriteria).toBeDefined();
      expect(enhanced.successCriteria?.length).toBeGreaterThan(0);
      expect(enhanced.context.technicalStack).toBeDefined();
    });

    it("should generate clarifying questions for ambiguous prompts", async () => {
      const raw = "Improve performance";

      const enhanced = await enhancer.enhance(raw);

      expect(enhanced.clarifyingQuestions).toBeDefined();
      expect(enhanced.clarifyingQuestions?.length).toBeGreaterThan(0);
      expect(enhanced.clarifyingQuestions?.[0]).toContain("specific");
    });

    it("should handle complex multi-line prompts", async () => {
      const raw = `
        We need to refactor our authentication system to support OAuth2.
        The current implementation uses basic JWT tokens but we need to
        integrate with Google and GitHub providers. 
        
        Requirements:
        - Maintain backward compatibility
        - Support multiple providers
        - Add proper error handling
        - Update documentation
      `;

      const enhanced = await enhancer.enhance(raw);

      expect(enhanced.workflow).toBe(WorkflowType.REFACTOR);
      expect(enhanced.extractedRequirements).toBeDefined();
      expect(enhanced.constraints).toBeDefined();
      expect(enhanced.validation.score).toBeGreaterThan(70);
    });
  });

  describe("Validation", () => {
    it("should validate required fields", async () => {
      const prompt = {
        id: "test",
        version: "1.0.0",
        workflow: WorkflowType.GENERAL,
        instruction: "",
        context: null as any,
        inputs: [],
        expectedOutput: {} as any,
        validation: {} as any,
        metadata: {} as any,
      };

      const validation = enhancer.validate(prompt);

      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.issues).toContainEqual(
        expect.objectContaining({
          severity: "error",
          field: "instruction",
        }),
      );
    });

    it("should score prompt quality accurately", async () => {
      const highQuality = await enhancer.enhance(`
        As a developer, I need to implement a caching layer for our database queries
        to reduce latency. The cache should use Redis, have TTL support, and 
        integrate with our existing Prisma setup. Include proper error handling
        and monitoring hooks. Performance target is sub-100ms response time.
      `);

      const lowQuality = await enhancer.enhance("make it faster");

      expect(highQuality.validation.score).toBeGreaterThan(75);
      expect(lowQuality.validation.score).toBeLessThan(50);
      expect(highQuality.validation.score).toBeGreaterThan(
        lowQuality.validation.score,
      );
    });

    it("should identify vague language", async () => {
      const vague = await enhancer.enhance(
        "Do something to fix the thing somehow",
      );

      expect(vague.validation.issues).toContainEqual(
        expect.objectContaining({
          field: "instruction",
          message: expect.stringContaining("vague"),
        }),
      );
      expect(vague.validation.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe("Storage and Retrieval", () => {
    it("should store and retrieve enhanced prompts", async () => {
      const enhanced = await enhancer.enhance("Test prompt for storage");
      const id = await enhancer.store(enhanced);

      expect(id).toBeDefined();
      expect(typeof id).toBe("string");

      const retrieved = await enhancer.retrieve(id);
      expect(retrieved.id).toBe(id);
      expect(retrieved.instruction).toBe(enhanced.instruction);
      expect(retrieved.validation.score).toBe(enhanced.validation.score);
    });

    it("should update existing prompts", async () => {
      const enhanced = await enhancer.enhance("Original prompt");
      const id = await enhancer.store(enhanced);

      const updated = await enhancer.update(id, {
        instruction: "Updated instruction with more details",
      });

      expect(updated.instruction).toBe("Updated instruction with more details");
      expect(updated.id).toBe(id);
      expect(updated.metadata.updatedAt.getTime()).toBeGreaterThan(
        enhanced.metadata.createdAt.getTime(),
      );
    });

    it("should search prompts by criteria", async () => {
      // Clear any existing prompts
      const testEnhancer = new PromptEnhancerSDK({
        projectPath: testDir,
        outputDir: join(testDir, ".search-test"),
        logLevel: "silent",
      });

      // Store multiple prompts
      const bug1 = await testEnhancer.enhance({
        content: "Fix critical login bug",
        type: WorkflowType.BUG,
        metadata: {
          tags: ["auth", "critical"],
          author: "test-user",
        },
      });
      await testEnhancer.store(bug1);

      const feature1 = await testEnhancer.enhance({
        content: "Add user dashboard",
        type: WorkflowType.FEATURE,
        metadata: {
          tags: ["ui", "dashboard"],
          author: "test-user",
        },
      });
      await testEnhancer.store(feature1);

      // Search by workflow type
      const bugPrompts = await testEnhancer.search({
        workflow: WorkflowType.BUG,
      });
      expect(bugPrompts.length).toBe(1);
      expect(bugPrompts[0].workflow).toBe(WorkflowType.BUG);

      // Search by author
      const userPrompts = await testEnhancer.search({
        author: "test-user",
      });
      expect(userPrompts.length).toBe(2);

      // Search by minimum score
      const highScorePrompts = await testEnhancer.search({
        minScore: 90,
      });
      expect(highScorePrompts.length).toBeLessThanOrEqual(2);
    });
  });

  describe("Context Analysis", () => {
    beforeEach(async () => {
      // Create mock project structure
      await writeFile(
        join(testDir, "package.json"),
        JSON.stringify({
          name: "test-project",
          version: "1.0.0",
          dependencies: {
            express: "^4.18.0",
            prisma: "^5.0.0",
            "@prisma/client": "^5.0.0",
          },
          devDependencies: {
            typescript: "^5.0.0",
            "bun-types": "latest",
          },
        }),
      );

      await mkdir(join(testDir, "src"), { recursive: true });
      await writeFile(
        join(testDir, "src", "logger.ts"),
        `
        // Logger utility for application
        export class Logger {
          constructor(private context: string) {}
          
          log(message: string) {
            console.log(\`[\${this.context}] \${message}\`);
          }
          
          error(message: string, error?: Error) {
            console.error(\`[\${this.context}] \${message}\`, error);
          }
        }
      `,
      );

      await writeFile(
        join(testDir, "src", "auth.service.ts"),
        `
        // Authentication service
        export class AuthService {
          async login(email: string, password: string) {
            // Login implementation
          }
          
          async logout() {
            // Logout implementation
          }
        }
      `,
      );
    });

    it("should extract relevant codebase context", async () => {
      const enhanced = await enhancer.enhance(
        "Add process ID to logger output for better debugging",
      );

      expect(enhanced.context.relevantFiles.length).toBeGreaterThan(0);
      expect(enhanced.context.relevantFiles).toContainEqual(
        expect.objectContaining({
          path: expect.stringContaining("logger"),
        }),
      );
      expect(enhanced.context.dependencies).toContain("express");
      expect(enhanced.context.technicalStack).toContain("TypeScript");
    });

    it("should identify project dependencies", async () => {
      const enhanced = await enhancer.enhance("Optimize database queries");

      expect(enhanced.context.dependencies).toContain("prisma");
      expect(enhanced.context.dependencies).toContain("@prisma/client");
      expect(enhanced.context.technicalStack).toContain("Prisma");
    });
  });

  describe("Export Formats", () => {
    it("should export to markdown format", async () => {
      const enhanced = await enhancer.enhance(
        "Create user authentication system",
      );
      const markdown = enhancer.export(enhanced, "markdown");

      expect(markdown).toContain("# Enhanced Prompt");
      expect(markdown).toContain("## Instruction");
      expect(markdown).toContain("## Context");
      expect(markdown).toContain("## Expected Output");
      expect(markdown).toContain(enhanced.id);
      expect(markdown).toContain(enhanced.workflow);
    });

    it("should export to JSON format", async () => {
      const enhanced = await enhancer.enhance("Test JSON export");
      const json = enhancer.export(enhanced, "json");

      const parsed = JSON.parse(json);
      expect(parsed.id).toBe(enhanced.id);
      expect(parsed.workflow).toBe(enhanced.workflow);
      expect(parsed.instruction).toBe(enhanced.instruction);
      expect(parsed.validation).toBeDefined();
    });

    it("should export to YAML format", async () => {
      const enhanced = await enhancer.enhance("Test YAML export");
      const yaml = enhancer.export(enhanced, "yaml");

      expect(yaml).toContain(`id: ${enhanced.id}`);
      expect(yaml).toContain(`workflow: ${enhanced.workflow}`);
      expect(yaml).toContain("instruction:");
      expect(yaml).toContain("context:");
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid input gracefully", async () => {
      await expect(enhancer.enhance("")).rejects.toThrow(
        "Input cannot be empty",
      );
      await expect(enhancer.enhance(null as any)).rejects.toThrow(
        "Input cannot be empty",
      );
    });

    it("should handle storage errors", async () => {
      const invalidEnhancer = new PromptEnhancerSDK({
        projectPath: "/invalid/path/that/does/not/exist",
        outputDir: "/invalid/output/path",
        logLevel: "silent",
      });

      const enhanced = await enhancer.enhance("Test storage error");
      await expect(invalidEnhancer.store(enhanced)).rejects.toThrow();
    });

    it("should handle missing prompts gracefully", async () => {
      await expect(enhancer.retrieve("non-existent-id")).rejects.toThrow(
        "Prompt not found",
      );
    });
  });

  describe("Performance", () => {
    it("should enhance prompts within reasonable time", async () => {
      const start = Date.now();
      await enhancer.enhance("Performance test prompt for measuring speed");
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000); // 5 seconds max
    });

    it("should handle large prompts efficiently", async () => {
      const largePrompt =
        "Create a comprehensive system that " +
        "handles multiple operations including ".repeat(100);

      const enhanced = await enhancer.enhance(largePrompt);

      expect(enhanced).toBeDefined();
      expect(enhanced.validation.isValid).toBe(true);
      expect(enhanced.instruction.length).toBeGreaterThan(0);
    });

    it("should enforce token limits", async () => {
      const veryLargePrompt =
        "Implement ".repeat(1000) + "with detailed requirements ".repeat(1000);

      const enhanced = await enhancer.enhance(veryLargePrompt);

      // Should be truncated to fit token limit
      const exportedLength = JSON.stringify(enhanced).length;
      expect(exportedLength).toBeLessThan(20000); // Roughly 5000 tokens * 4 chars
    });
  });

  describe("Workflow-Specific Enhancement", () => {
    it("should enhance bug fix prompts with appropriate sections", async () => {
      const enhanced = await enhancer.enhance({
        content: "Users cannot reset their passwords after token expires",
        type: WorkflowType.BUG,
      });

      expect(enhanced.workflow).toBe(WorkflowType.BUG);
      expect(enhanced.successCriteria).toBeDefined();
      expect(enhanced.successCriteria).toContainEqual(
        expect.stringContaining("reproducible"),
      );
      expect(enhanced.constraints).toBeDefined();
    });

    it("should enhance feature prompts with examples", async () => {
      const enhanced = await enhancer.enhance({
        content: "Add dark mode toggle to user settings",
        type: WorkflowType.FEATURE,
      });

      expect(enhanced.workflow).toBe(WorkflowType.FEATURE);
      expect(enhanced.examples).toBeDefined();
      expect(enhanced.examples?.length).toBeGreaterThan(0);
      expect(enhanced.successCriteria).toContainEqual(
        expect.stringContaining("test"),
      );
    });

    it("should enhance refactor prompts with constraints", async () => {
      const enhanced = await enhancer.enhance({
        content: "Refactor authentication module to use async/await",
        type: WorkflowType.REFACTOR,
      });

      expect(enhanced.workflow).toBe(WorkflowType.REFACTOR);
      expect(enhanced.constraints).toBeDefined();
      expect(enhanced.constraints).toContainEqual(
        expect.stringMatching(/backward|compatibility|api/i),
      );
    });
  });
});
