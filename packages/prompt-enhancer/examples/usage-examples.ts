#!/usr/bin/env bun
/**
 * @repo/prompt-enhancer Usage Examples
 *
 * These examples demonstrate all major features of the prompt enhancer SDK.
 * Run with: bun run examples/usage-examples.ts
 */

import { PromptEnhancerSDK } from "../src/index.js";
import type {
  StructuredPrompt,
  RawPromptInput,
  PromptSearchQuery,
  EnhancedPromptResult,
} from "../src/types.js";
import chalk from "chalk";

// Helper to display results
function displayResult(title: string, data: any) {
  console.log(chalk.blue(`\n${"=".repeat(60)}`));
  console.log(chalk.bold(`📘 ${title}`));
  console.log(chalk.blue("=".repeat(60)));
  console.log(JSON.stringify(data, null, 2));
}

async function runExamples() {
  console.log(chalk.green("🚀 Prompt Enhancer SDK - Usage Examples\n"));

  // Initialize the SDK
  const enhancer = new PromptEnhancerSDK({
    projectPath: process.cwd(),
    model: "gemini-2.0-pro",
    enableCodebaseContext: true,
    debug: false,
    outputDir: "./.prompts-examples",
  });

  // Example 1: Basic String Enhancement
  console.log(chalk.yellow("\n📌 Example 1: Basic String Enhancement"));
  try {
    const basicPrompt = await enhancer.enhance("Fix the login bug");
    displayResult("Basic Enhancement", {
      workflow: basicPrompt.workflow,
      score: basicPrompt.validation.score,
      instruction: basicPrompt.instruction.substring(0, 200) + "...",
    });
  } catch (error) {
    console.log(chalk.red("Note: Basic enhancement using fallback mode"));
  }

  // Example 2: Structured Input with Metadata
  console.log(chalk.yellow("\n📌 Example 2: Structured Input with Metadata"));
  const structuredInput: RawPromptInput = {
    content:
      "Implement a caching layer for the API endpoints to improve performance",
    type: "optimization",
    metadata: {
      taskId: "PERF-001",
      author: "engineering-team",
      tags: ["performance", "backend", "cache"],
      source: "github-issue-42",
    },
  };

  try {
    const structuredPrompt = await enhancer.enhance(structuredInput);
    displayResult("Structured Enhancement", {
      id: structuredPrompt.id,
      workflow: structuredPrompt.workflow,
      metadata: structuredPrompt.metadata,
      successCriteria: structuredPrompt.successCriteria,
    });

    // Save the enhanced prompt
    const savedId = await enhancer.store(structuredPrompt);
    console.log(chalk.green(`✅ Saved with ID: ${savedId}`));
  } catch (error) {
    console.log(chalk.red("Note: Using fallback enhancement"));
  }

  // Example 3: Workflow Enhancement (Complex Tasks)
  console.log(
    chalk.yellow("\n📌 Example 3: Workflow Enhancement for Complex Tasks"),
  );
  try {
    const workflowResult: EnhancedPromptResult =
      await enhancer.enhanceWithWorkflow(
        "Redesign the authentication system to support OAuth 2.0, SAML, and social logins",
      );

    displayResult("Workflow Enhancement", {
      sessionId: workflowResult.workflow?.sessionId,
      complexity: workflowResult.metadata.complexity,
      agentsRequired: workflowResult.metadata.agentsRequired,
      executionSteps: workflowResult.workflow?.executionPlan.length,
      outputFile: workflowResult.outputFile,
    });
  } catch (error) {
    console.log(chalk.red("Note: Workflow enhancement requires AI service"));
  }

  // Example 4: Different Workflow Types
  console.log(chalk.yellow("\n📌 Example 4: Different Workflow Types"));
  const workflowExamples = [
    { content: "Users cant login after password reset", type: "bug" as const },
    { content: "Add dark mode toggle to settings", type: "feature" as const },
    {
      content: "Clean up the authentication service",
      type: "refactor" as const,
    },
    { content: "Document the API endpoints", type: "documentation" as const },
    {
      content: "Investigate memory leak in production",
      type: "research" as const,
    },
    { content: "Review PR #123", type: "pr_review" as const },
  ];

  for (const example of workflowExamples) {
    try {
      const enhanced = await enhancer.enhance({
        content: example.content,
        type: example.type,
      });

      console.log(
        chalk.cyan(`\n  ${example.type.toUpperCase()}: ${enhanced.workflow}`),
      );
      console.log(chalk.gray(`  Score: ${enhanced.validation.score}/100`));
      console.log(
        chalk.gray(
          `  Success Criteria: ${enhanced.successCriteria?.length || 0} items`,
        ),
      );
    } catch (error) {
      console.log(chalk.gray(`  ${example.type}: Fallback mode`));
    }
  }

  // Example 5: Search and Retrieve
  console.log(
    chalk.yellow("\n📌 Example 5: Search and Retrieve Stored Prompts"),
  );
  const searchQuery: PromptSearchQuery = {
    workflow: "feature",
    tags: ["frontend"],
    minScore: 80,
  };

  try {
    const searchResults = await enhancer.search(searchQuery);
    displayResult("Search Results", {
      found: searchResults.length,
      query: searchQuery,
    });
  } catch (error) {
    console.log(chalk.gray("No stored prompts found"));
  }

  // Example 6: Export Formats
  console.log(chalk.yellow("\n📌 Example 6: Export Formats"));
  const samplePrompt: StructuredPrompt = {
    id: "example-123",
    version: "1.0.0",
    workflow: "feature",
    instruction: "Add user profile management functionality",
    context: {
      projectOverview: "AI Dr. workflow system",
      relevantFiles: [{ path: "/src/user.ts", summary: "User model" }],
      dependencies: ["@prisma/client", "zod"],
      currentState: "Basic user CRUD exists",
      technicalStack: ["TypeScript", "Next.js", "Prisma"],
    },
    inputs: [
      {
        label: "Requirements",
        value: "Users should be able to update their profiles",
        type: "text",
      },
    ],
    expectedOutput: {
      format: "code",
      structure: "React components with API routes",
    },
    validation: {
      isValid: true,
      score: 95,
      issues: [],
      suggestions: [],
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      author: "dev-team",
      tags: ["user", "profile"],
    },
    successCriteria: [
      "Profile update functionality works",
      "Data validation implemented",
      "Tests pass",
    ],
    constraints: [
      "Must be mobile responsive",
      "Follow existing design patterns",
    ],
  };

  // JSON Export
  const jsonExport = enhancer.export(samplePrompt, "json");
  console.log(
    chalk.cyan("\n  JSON Export:"),
    jsonExport.substring(0, 100) + "...",
  );

  // Markdown Export
  const markdownExport = enhancer.export(samplePrompt, "markdown");
  console.log(chalk.cyan("\n  Markdown Export:"));
  console.log(chalk.gray(markdownExport.substring(0, 300) + "..."));

  // YAML Export
  const yamlExport = enhancer.export(samplePrompt, "yaml");
  console.log(chalk.cyan("\n  YAML Export:"));
  console.log(chalk.gray(yamlExport.substring(0, 200) + "..."));

  // Example 7: Update Existing Prompt
  console.log(chalk.yellow("\n📌 Example 7: Update Existing Prompt"));
  try {
    // First store a prompt
    const promptToUpdate = await enhancer.enhance("Create API documentation");
    const storedId = await enhancer.store(promptToUpdate);

    // Update it
    const updated = await enhancer.update(storedId, {
      instruction:
        promptToUpdate.instruction + "\n\nInclude OpenAPI specification.",
      successCriteria: [
        ...(promptToUpdate.successCriteria || []),
        "OpenAPI spec validates successfully",
      ],
    });

    displayResult("Updated Prompt", {
      id: updated.id,
      updatedAt: updated.metadata.updatedAt,
      newScore: updated.validation.score,
    });
  } catch (error) {
    console.log(chalk.gray("Update example skipped"));
  }

  // Example 8: Validation
  console.log(chalk.yellow("\n📌 Example 8: Prompt Validation"));
  const validation = enhancer.validate(samplePrompt);
  displayResult("Validation Result", validation);

  // Example 9: Check AI Service Status
  console.log(chalk.yellow("\n📌 Example 9: Check AI Service Status"));
  const isReady = await enhancer.isReady();
  console.log(
    chalk.cyan(
      `  AI Service Status: ${isReady ? "✅ Ready" : "⚠️ Using Fallback"}`,
    ),
  );

  // Example 10: Get Configuration
  console.log(chalk.yellow("\n📌 Example 10: SDK Configuration"));
  const config = enhancer.getConfig();
  displayResult("Current Configuration", {
    projectPath: config.projectPath,
    outputDir: config.outputDir,
    model: config.model,
    enableCodebaseContext: config.enableCodebaseContext,
    maxContextTokens: config.maxContextTokens,
  });

  console.log(chalk.green("\n✨ All examples completed!\n"));
}

// Run all examples
runExamples().catch((error) => {
  console.error(chalk.red("Error running examples:"), error);
  process.exit(1);
});
