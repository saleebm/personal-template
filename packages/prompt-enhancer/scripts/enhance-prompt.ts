#!/usr/bin/env bun
import { PromptEnhancerSDK } from "../src/index.js";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import chalk from "chalk";

// Enhanced CLI for prompt enhancement with workflow support
const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help")) {
  console.log(
    chalk.blue("🚀 AI Dr. Prompt Enhancer CLI - Engineering Edition"),
  );
  console.log(chalk.gray("Usage:"));
  console.log('  bun run enhance "your prompt here"');
  console.log("  bun run enhance -f input.txt"); // or --file
  console.log("  bun run enhance -f input.txt --output enhanced.md");
  console.log('  bun run enhance --workflow "complex engineering task"');
  console.log("");
  console.log(chalk.gray("Options:"));
  console.log(
    "  --workflow    Enable workflow orchestration for complex tasks",
  );
  console.log("  --agents      Show suggested sub-agents for the task");
  console.log("  --complexity  Show task complexity analysis");
  console.log("  --tokens      Show token usage statistics");
  console.log("");
  console.log(chalk.gray("Examples:"));
  console.log('  bun run enhance "Fix the login bug"');
  console.log('  bun run enhance --workflow "Redesign authentication system"');
  console.log("  bun run enhance -f task.txt --workflow --output result.md");
  process.exit(0);
}

async function main() {
  const debugMode = args.includes("--debug");
  const sdk = new PromptEnhancerSDK({
    projectPath: process.cwd(),
    model: "gemini-2.5-flash", // Use flash for better performance, pro times out
    enableCodebaseContext: true,
    debug: debugMode,
    maxContextTokens: 8000, // Increase token limit for better rule inclusion
  });

  if (debugMode) {
    console.log(chalk.cyan("🐛 Debug mode enabled"));
    console.log("Arguments:", args);
  }

  try {
    let prompt = "";
    let outputPath = "";
    const useWorkflow = args.includes("--workflow");
    const showAgents = args.includes("--agents");
    const showComplexity = args.includes("--complexity");
    const showTokens = args.includes("--tokens");

    // Parse arguments - support both -f and --file
    const fileFlag = args.includes("--file")
      ? "--file"
      : args.includes("-f")
        ? "-f"
        : null;
    if (fileFlag) {
      const fileIndex = args.indexOf(fileFlag);
      const fileName = args[fileIndex + 1];
      if (!fileName) {
        console.error(chalk.red("❌ File path required after file flag"));
        process.exit(1);
      }
      const filePath = resolve(process.cwd(), fileName);
      try {
        prompt = readFileSync(filePath, "utf-8");
        console.log(chalk.green(`📁 Loaded prompt from: ${filePath}`));
        if (debugMode) {
          console.log(
            chalk.gray(`📄 File content length: ${prompt.length} characters`),
          );
          console.log(
            chalk.gray(`📄 First 100 chars: ${prompt.substring(0, 100)}...`),
          );
        }
      } catch (error) {
        console.error(chalk.red(`❌ Error reading file: ${filePath}`));
        process.exit(1);
      }
    } else {
      // Extract prompt from args (exclude flags)
      prompt = args.filter((arg) => !arg.startsWith("--")).join(" ");
    }

    // Check for output flag
    const outputIndex = args.indexOf("--output");
    if (outputIndex !== -1) {
      const outputFileName = args[outputIndex + 1];
      if (!outputFileName) {
        console.error(chalk.red("❌ Output path required after --output flag"));
        process.exit(1);
      }
      outputPath = resolve(process.cwd(), outputFileName);
    }

    if (!prompt.trim()) {
      console.error(chalk.red("❌ No prompt provided"));
      process.exit(1);
    }

    if (debugMode) {
      console.log(chalk.cyan("🔍 Final prompt to be enhanced:"));
      console.log(
        chalk.gray(
          `"${prompt.substring(0, 200)}${prompt.length > 200 ? "..." : ""}"`,
        ),
      );
    }

    console.log(chalk.blue("🔄 Enhancing prompt..."));
    console.log(
      chalk.gray(
        `Original: ${prompt.substring(0, 100)}${prompt.length > 100 ? "..." : ""}`,
      ),
    );
    console.log("");

    // Test if AI is ready
    const isReady = await sdk.isReady();
    if (!isReady) {
      console.log(
        chalk.yellow(
          "⚠️  AI service not available, using fallback enhancement",
        ),
      );
    }

    if (useWorkflow) {
      // Use workflow enhancement for complex tasks
      console.log(chalk.cyan("🔀 Using Workflow Orchestration Mode"));

      const result = await sdk.enhanceWithWorkflow(prompt);

      console.log(chalk.green("✅ Workflow Enhancement Complete!"));
      console.log("");
      console.log(
        chalk.bold("📋 Session ID:"),
        result.workflow?.sessionId || "N/A",
      );
      console.log(
        chalk.bold("📊 Complexity:"),
        chalk.cyan(result.metadata.complexity),
      );
      console.log(
        chalk.bold("🤖 Agents Required:"),
        result.metadata.agentsRequired ? chalk.green("Yes") : chalk.gray("No"),
      );

      if (result.workflow?.agents && result.workflow.agents.length > 0) {
        console.log("");
        console.log(chalk.bold("🤖 Suggested Agents:"));
        result.workflow.agents.forEach((agent) => {
          console.log(
            chalk.yellow(
              `  • ${agent.agentType} (Priority: ${agent.priority})`,
            ),
          );
          console.log(chalk.gray(`    Task: ${agent.task}`));
        });
      }

      console.log("");
      console.log(chalk.bold("📝 Execution Plan:"));
      result.workflow?.executionPlan.forEach((step) => {
        const deps = step.dependencies
          ? ` [depends on: ${step.dependencies.join(", ")}]`
          : "";
        const agent = step.agent ? ` (${chalk.yellow(step.agent)})` : "";
        console.log(
          chalk.white(`  ${step.step}. ${step.description}${agent}${deps}`),
        );
      });

      if (showTokens && result.metadata.tokenCount) {
        console.log("");
        console.log(
          chalk.bold("🔢 Token Usage:"),
          chalk.cyan(`${result.metadata.tokenCount} tokens`),
        );
      }

      console.log("");
      console.log(chalk.bold("📄 Enhanced prompt automatically saved to:"));
      console.log(chalk.green(`📁 ${result.outputFile}`));

      // Save additional output if requested (for custom paths)
      if (outputPath && outputPath !== result.outputFile) {
        const content = readFileSync(result.outputFile, "utf-8");
        writeFileSync(outputPath, content);
        console.log(chalk.green(`💾 Also saved copy to: ${outputPath}`));
      }
    } else {
      // Standard enhancement
      const result = await sdk.enhance(prompt);

      console.log(chalk.green("✅ Enhancement Complete!"));
      console.log("");
      console.log(
        chalk.bold("📈 Quality Score:"),
        chalk.cyan(`${result.validation.score}/100`),
      );
      console.log(chalk.bold("🎯 Workflow Type:"), chalk.cyan(result.workflow));
      console.log("");

      console.log(chalk.bold("✨ Enhanced Prompt:"));
      console.log(chalk.white(result.instruction));
      console.log("");

      if (result.successCriteria && result.successCriteria.length > 0) {
        console.log(chalk.bold("✅ Success Criteria:"));
        result.successCriteria.forEach((criteria, i) => {
          console.log(chalk.gray(`  ${i + 1}. ${criteria}`));
        });
        console.log("");
      }

      if (result.constraints && result.constraints.length > 0) {
        console.log(chalk.bold("⚠️  Constraints:"));
        result.constraints.forEach((constraint) => {
          console.log(chalk.yellow(`  • ${constraint}`));
        });
        console.log("");
      }

      if (result.clarifyingQuestions && result.clarifyingQuestions.length > 0) {
        console.log(chalk.bold("❓ Clarifying Questions:"));
        result.clarifyingQuestions.forEach((q, i) => {
          console.log(chalk.yellow(`  ${i + 1}. ${q}`));
        });
        console.log("");
      }

      // Automatically save the enhanced prompt
      const savedPath = await sdk.store(result);
      console.log("");
      console.log(chalk.bold("📄 Enhanced prompt automatically saved to:"));
      console.log(chalk.green(`📁 ${savedPath}`));

      // Save additional copy if custom path requested
      if (outputPath) {
        const exported = sdk.export(
          result,
          outputPath.endsWith(".md") ? "markdown" : "json",
        );
        writeFileSync(outputPath, exported);
        console.log(chalk.green(`💾 Also saved copy to: ${outputPath}`));
      }
    }

    if (showComplexity) {
      const aiService = sdk["aiService"] as any;
      const complexity = await aiService.analyzeComplexity(prompt);
      console.log("");
      console.log(
        chalk.bold("🎚️  Complexity Analysis:"),
        chalk.cyan(complexity),
      );
    }

    if (showAgents) {
      const aiService = sdk["aiService"] as any;
      const complexity = await aiService.analyzeComplexity(prompt);
      const agents = await aiService.suggestAgents(prompt, complexity);
      console.log("");
      console.log(chalk.bold("🤖 Recommended Agents:"));
      if (agents.length > 0) {
        agents.forEach((agent: string) =>
          console.log(chalk.yellow(`  • ${agent}`)),
        );
      } else {
        console.log(chalk.gray("  No agents needed for this task"));
      }
    }
  } catch (error) {
    console.error(
      chalk.red(
        `❌ Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
      ),
    );
    if (error instanceof Error && error.stack) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  }
}

main().catch(console.error);
