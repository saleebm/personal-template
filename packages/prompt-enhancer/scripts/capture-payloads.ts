#!/usr/bin/env bun

/**
 * Payload Capture Script
 *
 * This script captures actual API responses from external services
 * and saves them as fixtures for testing. Run this script when:
 * - The prompt-enhancer code changes
 * - External API contracts might have changed
 * - You need to update test fixtures
 *
 * Usage:
 *   bun run scripts/capture-payloads.ts [--service=all|google|anthropic] [--output=path]
 *
 * Environment Variables Required:
 *   GOOGLE_API_KEY - For Google Generative AI
 *   ANTHROPIC_API_KEY - For Anthropic Claude (optional)
 */

import { generateObject, generateText, streamText } from "ai";
import { google, createGoogleGenerativeAI } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { existsSync } from "fs";
import chalk from "chalk";
import { AIEnhancementSchema } from "../src/types.js";

interface CaptureOptions {
  service: "all" | "google" | "anthropic";
  outputDir: string;
  verbose: boolean;
}

interface TestPrompt {
  name: string;
  prompt: string;
  context?: string;
  options?: {
    urls?: string[];
    searchQueries?: string[];
  };
}

const TEST_PROMPTS: TestPrompt[] = [
  {
    name: "simple-feature",
    prompt: "Write a function to sort an array",
    context: "TypeScript project using Bun runtime",
  },
  {
    name: "complex-feature",
    prompt:
      "Implement a complete authentication system with OAuth2, JWT tokens, and multi-factor authentication",
    context: "Next.js application with TypeScript and Prisma",
  },
  {
    name: "bug-fix",
    prompt: "Fix the memory leak in the user service causing server crashes",
    context: "Node.js backend service with high traffic",
  },
  {
    name: "refactor-task",
    prompt: "Refactor the database access layer to use repository pattern",
    context: "Express API with MongoDB",
  },
  {
    name: "optimization",
    prompt: "Optimize the search algorithm to reduce query time by 50%",
    context: "Elasticsearch integration with millions of records",
  },
  {
    name: "documentation",
    prompt: "Document the REST API endpoints with OpenAPI specification",
    context: "Existing Express API with 50+ endpoints",
  },
  {
    name: "testing",
    prompt:
      "Create comprehensive unit and integration tests for the payment service",
    context: "Stripe integration with complex business logic",
  },
  {
    name: "security",
    prompt: "Implement security best practices for user data protection",
    context: "Healthcare application with HIPAA requirements",
  },
  {
    name: "with-google-tools",
    prompt: "Create a modern login form with best practices",
    options: {
      urls: ["https://ai-sdk.dev/docs"],
      searchQueries: ["login form best practices 2025"],
    },
  },
];

class PayloadCapture {
  private options: CaptureOptions;
  private googleModel: any;
  private anthropicModel: any;

  constructor(options: CaptureOptions) {
    this.options = options;
    this.initializeModels();
  }

  private initializeModels() {
    // Initialize Google model if API key is available
    const googleKey = process.env["GOOGLE_API_KEY"];
    if (googleKey) {
      this.googleModel = google("gemini-2.5-pro");
      console.log(chalk.green("✓ Google Generative AI initialized"));
    } else {
      console.log(
        chalk.yellow("⚠ GOOGLE_API_KEY not found - skipping Google captures"),
      );
    }

    // Initialize Anthropic model if API key is available
    const anthropicKey = process.env["ANTHROPIC_API_KEY"];
    if (anthropicKey) {
      this.anthropicModel = anthropic("claude-3-5-sonnet-latest");
      console.log(chalk.green("✓ Anthropic Claude initialized"));
    } else {
      console.log(
        chalk.yellow(
          "⚠ ANTHROPIC_API_KEY not found - skipping Anthropic captures",
        ),
      );
    }
  }

  async captureAll() {
    console.log(chalk.blue("\n📸 Starting payload capture...\n"));

    // Ensure output directory exists
    await this.ensureDirectory(this.options.outputDir);

    // Capture from each service based on options
    if (this.options.service === "all" || this.options.service === "google") {
      await this.captureGooglePayloads();
    }

    if (
      this.options.service === "all" ||
      this.options.service === "anthropic"
    ) {
      await this.captureAnthropicPayloads();
    }

    // Generate index file
    await this.generateIndexFile();

    console.log(chalk.green("\n✅ Payload capture complete!\n"));
    console.log(chalk.cyan(`📁 Fixtures saved to: ${this.options.outputDir}`));
  }

  private async captureGooglePayloads() {
    if (!this.googleModel) {
      console.log(chalk.red("✗ Skipping Google captures - no API key"));
      return;
    }

    console.log(chalk.blue("\n🔷 Capturing Google AI payloads...\n"));

    for (const testPrompt of TEST_PROMPTS) {
      try {
        console.log(chalk.gray(`  Capturing: ${testPrompt.name}...`));

        const enhancementPrompt = this.buildEnhancementPrompt(
          testPrompt.prompt,
          testPrompt.context,
        );

        // Capture generateObject response
        const { object, usage, providerMetadata } = await generateObject({
          model: this.googleModel,
          schema: AIEnhancementSchema,
          prompt: enhancementPrompt,
          temperature: 0.7,
          maxRetries: 3,
        });

        const payload = {
          request: {
            prompt: testPrompt.prompt,
            context: testPrompt.context,
            model: "gemini-2.5-pro",
          },
          response: {
            object,
            usage,
            providerMetadata: providerMetadata,
          },
          metadata: {
            captured: new Date().toISOString(),
            service: "google",
            testCase: testPrompt.name,
          },
        };

        await this.savePayload(`google/${testPrompt.name}.json`, payload);

        console.log(chalk.green(`    ✓ ${testPrompt.name} captured`));

        // Add delay to avoid rate limiting
        await this.delay(1000);
      } catch (error) {
        console.log(chalk.red(`    ✗ ${testPrompt.name} failed: ${error}`));
      }
    }

    // Capture specific Google Tools responses
    await this.captureGoogleToolsPayloads();
  }

  private async captureGoogleToolsPayloads() {
    console.log(chalk.blue("\n  📍 Capturing Google Tools payloads...\n"));

    const toolPrompt = TEST_PROMPTS.find((p) => p.name === "with-google-tools");
    if (!toolPrompt || !toolPrompt.options) return;

    try {
      // Note: Google Tools might require additional setup
      // For now, we'll capture a mock structure
      const mockToolsResponse = {
        request: {
          prompt: toolPrompt.prompt,
          urls: toolPrompt.options.urls,
          searchQueries: toolPrompt.options.searchQueries,
        },
        response: {
          groundingMetadata: {
            searchQueries: toolPrompt.options.searchQueries,
            groundingChunks: [],
            groundingSupports: [],
            webSearchQueries: toolPrompt.options.searchQueries,
          },
          urlContextMetadata: {
            urls: toolPrompt.options.urls,
            contexts: [],
          },
        },
        metadata: {
          captured: new Date().toISOString(),
          service: "google-tools",
          note: "Mock structure - actual response requires live API",
        },
      };

      await this.savePayload("google/tools-response.json", mockToolsResponse);
      console.log(chalk.green("    ✓ Google Tools structure captured"));
    } catch (error) {
      console.log(chalk.red(`    ✗ Google Tools capture failed: ${error}`));
    }
  }

  private async captureAnthropicPayloads() {
    if (!this.anthropicModel) {
      console.log(chalk.red("✗ Skipping Anthropic captures - no API key"));
      return;
    }

    console.log(chalk.blue("\n🔶 Capturing Anthropic payloads...\n"));

    for (const testPrompt of TEST_PROMPTS.slice(0, 3)) {
      // Limit to avoid high costs
      try {
        console.log(chalk.gray(`  Capturing: ${testPrompt.name}...`));

        const enhancementPrompt = this.buildEnhancementPrompt(
          testPrompt.prompt,
          testPrompt.context,
        );

        const { object, usage } = await generateObject({
          model: this.anthropicModel,
          schema: AIEnhancementSchema,
          prompt: enhancementPrompt,
          temperature: 0.7,
          maxRetries: 3,
        });

        const payload = {
          request: {
            prompt: testPrompt.prompt,
            context: testPrompt.context,
            model: "claude-3-5-sonnet-latest",
          },
          response: {
            object,
            usage,
          },
          metadata: {
            captured: new Date().toISOString(),
            service: "anthropic",
            testCase: testPrompt.name,
          },
        };

        await this.savePayload(`anthropic/${testPrompt.name}.json`, payload);

        console.log(chalk.green(`    ✓ ${testPrompt.name} captured`));

        // Add delay to avoid rate limiting
        await this.delay(1000);
      } catch (error) {
        console.log(chalk.red(`    ✗ ${testPrompt.name} failed: ${error}`));
      }
    }
  }

  private async savePayload(filename: string, data: any) {
    const filepath = join(this.options.outputDir, filename);
    const dir = dirname(filepath);

    await this.ensureDirectory(dir);
    await writeFile(filepath, JSON.stringify(data, null, 2));

    if (this.options.verbose) {
      console.log(chalk.gray(`      Saved to: ${filepath}`));
    }
  }

  private async generateIndexFile() {
    const indexContent = `/**
 * Auto-generated fixture index
 * Generated: ${new Date().toISOString()}
 * 
 * This file provides easy access to all captured API payloads.
 * Re-run 'bun run scripts/capture-payloads.ts' to update.
 */

import type { AIEnhancement } from '../../src/types.js';

// Google AI Payloads
${TEST_PROMPTS.map(
  (p) =>
    `export { default as google_${p.name.replace(/-/g, "_")} } from './google/${p.name}.json';`,
).join("\n")}

// Google Tools Payloads
export { default as google_tools_response } from './google/tools-response.json';

// Anthropic AI Payloads (if available)
${TEST_PROMPTS.slice(0, 3)
  .map(
    (p) =>
      `// export { default as anthropic_${p.name.replace(/-/g, "_")} } from './anthropic/${p.name}.json';`,
  )
  .join("\n")}

// Helper to get payload by name
export function getPayload(service: 'google' | 'anthropic', testCase: string): any {
  const payloadMap: Record<string, any> = {
${TEST_PROMPTS.map(
  (p) => `    'google.${p.name}': google_${p.name.replace(/-/g, "_")},`,
).join("\n")}
  };
  
  const key = \`\${service}.\${testCase}\`;
  return payloadMap[key];
}

// Error response fixtures
export const ERROR_RESPONSES = {
  rateLimitExceeded: {
    error: {
      message: 'Rate limit exceeded. Please retry after some time.',
      type: 'rate_limit_error',
      code: 'rate_limit_exceeded'
    }
  },
  
  invalidApiKey: {
    error: {
      message: 'Invalid API key provided',
      type: 'authentication_error',
      code: 'invalid_api_key'
    }
  },
  
  modelNotAvailable: {
    error: {
      message: 'The model is not available',
      type: 'model_error',
      code: 'model_not_found'
    }
  },
  
  networkTimeout: {
    error: {
      message: 'Request timeout',
      type: 'network_error',
      code: 'timeout'
    }
  }
};
`;

    await this.savePayload("index.ts", indexContent);
    console.log(chalk.green("\n✓ Generated index file"));
  }

  private buildEnhancementPrompt(rawPrompt: string, context?: string): string {
    return `You are an expert software engineering prompt engineer specializing in creating detailed, actionable prompts for AI coding assistants.

Original Engineering Task:
${rawPrompt}

${
  context
    ? `Project Context:
${context}

`
    : ""
}

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

Return the enhanced prompt following the exact schema provided.`;
  }

  private async ensureDirectory(dir: string) {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Parse command line arguments
function parseArgs(): CaptureOptions {
  const args = process.argv.slice(2);
  const options: CaptureOptions = {
    service: "all",
    outputDir: join(process.cwd(), "tests/fixtures/api-payloads"),
    verbose: false,
  };

  for (const arg of args) {
    if (arg.startsWith("--service=")) {
      const service = arg.split("=")[1] as CaptureOptions["service"];
      if (["all", "google", "anthropic"].includes(service)) {
        options.service = service;
      }
    } else if (arg.startsWith("--output=")) {
      options.outputDir = arg.split("=")[1]!;
    } else if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
${chalk.bold("Payload Capture Script")}

Captures actual API responses from external services for testing.

${chalk.bold("Usage:")}
  bun run scripts/capture-payloads.ts [options]

${chalk.bold("Options:")}
  --service=all|google|anthropic  Service to capture from (default: all)
  --output=path                   Output directory for fixtures (default: tests/fixtures/api-payloads)
  --verbose, -v                   Show verbose output
  --help, -h                      Show this help message

${chalk.bold("Environment Variables:")}
  GOOGLE_API_KEY      API key for Google Generative AI
  ANTHROPIC_API_KEY   API key for Anthropic Claude

${chalk.bold("Examples:")}
  bun run scripts/capture-payloads.ts
  bun run scripts/capture-payloads.ts --service=google
  bun run scripts/capture-payloads.ts --output=./fixtures --verbose
      `);
      process.exit(0);
    }
  }

  return options;
}

// Main execution
async function main() {
  const options = parseArgs();
  const capture = new PayloadCapture(options);

  try {
    await capture.captureAll();
  } catch (error) {
    console.error(chalk.red("\n❌ Capture failed:"), error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.main) {
  main();
}

export { PayloadCapture, type CaptureOptions };
