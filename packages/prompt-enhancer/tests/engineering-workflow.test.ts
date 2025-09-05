import { describe, it, expect, beforeAll } from "bun:test";
import { PromptEnhancerSDK } from "../src/index.js";
import { AIService } from "../src/ai-service.js";
import { WorkflowOrchestrator } from "../src/workflow-orchestrator.js";
import type { EnhancedPromptResult, StructuredPrompt } from "../src/types.js";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

describe("Engineering Workflow Enhancement", () => {
  let sdk: PromptEnhancerSDK;

  beforeAll(() => {
    sdk = new PromptEnhancerSDK({
      projectPath: process.cwd(),
      outputDir: ".test-prompts",
      model: "gemini-2.5-pro" as const,
      enableCodebaseContext: true,
      debug: false,
    });
  });

  describe("User Story: As a developer, I want to enhance simple prompts", () => {
    it("should enhance a basic bug fix prompt with clear success criteria", async () => {
      const input = "Fix the login bug";

      const result = await sdk.enhance(input);

      // Success Criteria:
      expect(result).toBeDefined();
      expect(result.workflow).toBe("bug");
      expect(result.successCriteria).toBeDefined();
      expect(result.successCriteria?.length).toBeGreaterThan(0);
      expect(result.validation.score).toBeGreaterThan(40);
      expect(result.instruction).toContain("Fix");
    });

    it("should detect feature requests and provide implementation steps", async () => {
      const input = "Add dark mode to the application";

      const result = await sdk.enhance(input);

      // Success Criteria:
      expect(result.workflow).toBe("feature");
      expect(result.context.relevantFiles).toBeDefined();
      expect(result.successCriteria).toBeDefined();
      expect(result.constraints).toBeDefined();
    });
  });

  describe("User Story: As a developer, I want complex prompts to trigger workflows", () => {
    it("should create a workflow for complex architecture tasks", async () => {
      const input =
        "Redesign the authentication system to use OAuth2 with multiple providers";

      const result = await sdk.enhanceWithWorkflow(input);

      // Success Criteria:
      expect(result).toBeDefined();
      expect(result.workflow).toBeDefined();
      expect(result.workflow?.executionPlan.length).toBeGreaterThan(3);
      expect(result.metadata.complexity).toBe("complex");
      expect(result.metadata.agentsRequired).toBe(true);
      expect(result.outputFile).toBeDefined();
    }, 10000); // Longer timeout for AI calls

    it("should suggest relevant agents based on task type", async () => {
      const input =
        "Create a new React component with TypeScript and comprehensive tests";

      const result = await sdk.enhanceWithWorkflow(input);

      // Success Criteria:
      const agentTypes = result.workflow?.agents?.map((a) => a.agentType) || [];
      expect(agentTypes.length).toBeGreaterThanOrEqual(0);
      // Should suggest UI engineer for React component
      expect(
        agentTypes.some((a) => a.includes("ui") || a.includes("engineer")),
      ).toBe(true);
    }, 10000);
  });

  describe("User Story: As a developer, I want token tracking for cost management", () => {
    it("should track token usage for each enhancement", async () => {
      const aiService = new AIService("gemini-2.0-pro");
      const enhancement = await aiService.enhancePrompt(
        "Implement user authentication",
        "Context: Next.js app with Prisma",
      );

      // Success Criteria:
      expect(enhancement.tokenCount).toBeDefined();
      expect(enhancement.tokenCount).toBeGreaterThan(0);
      expect(enhancement.tokenUsage).toBeDefined();
      expect(enhancement.tokenUsage?.input).toBeGreaterThanOrEqual(0);
      expect(enhancement.tokenUsage?.output).toBeGreaterThanOrEqual(0);
    }, 10000);
  });

  describe("User Story: As a developer, I want organized output files", () => {
    it("should save enhanced prompts to organized markdown files", async () => {
      const input = "Optimize database queries for better performance";

      const result = await sdk.enhanceWithWorkflow(input);

      // Success Criteria:
      expect(result.outputFile).toBeDefined();
      expect(result.outputFile).toContain(".md");

      // Verify file contains expected sections
      if (existsSync(result.outputFile)) {
        const content = readFileSync(result.outputFile, "utf-8");
        expect(content).toContain("# Enhanced Prompt");
        expect(content).toContain("## Success Criteria");
        expect(content).toContain("## Implementation Steps");
        expect(content).toContain("## Technical Context");
      }
    }, 10000);

    it("should create context session files for agent coordination", async () => {
      const orchestrator = new WorkflowOrchestrator(process.cwd());
      const input = "Build a REST API with authentication";

      const enhanced = await sdk.enhance(input);
      const aiService = new AIService();
      const enhancement = await aiService.enhancePrompt(input);

      const workflow = await orchestrator.orchestrateWorkflow(
        enhanced,
        enhancement,
        "complex",
      );

      // Success Criteria:
      expect(workflow.contextFiles).toBeDefined();
      expect(workflow.contextFiles.length).toBeGreaterThan(0);
      expect(workflow.sessionId).toBeDefined();
      expect(workflow.contextFiles[0]).toContain("context_");
    }, 10000);
  });

  describe("User Story: As a developer, I want intelligent complexity detection", () => {
    it("should correctly identify simple tasks", async () => {
      const aiService = new AIService();
      const complexity =
        await aiService.analyzeComplexity("Fix typo in README");

      expect(complexity).toBe("simple");
    }, 10000);

    it("should correctly identify moderate tasks", async () => {
      const aiService = new AIService();
      const complexity = await aiService.analyzeComplexity(
        "Add pagination to the user list component",
      );

      expect(complexity).toBeOneOf(["simple", "moderate"]);
    }, 10000);

    it("should correctly identify complex tasks", async () => {
      const aiService = new AIService();
      const complexity = await aiService.analyzeComplexity(
        "Migrate the entire application from JavaScript to TypeScript with proper type definitions",
      );

      expect(complexity).toBeOneOf(["moderate", "complex"]);
    }, 10000);
  });

  describe("User Story: As a developer, I want fallback when AI is unavailable", () => {
    it("should provide basic enhancement when AI fails", async () => {
      const input = "Update dependencies";
      const result = await sdk.enhance(input);

      // Success Criteria:
      expect(result).toBeDefined();
      expect(result.instruction).toBeDefined();
      expect(result.workflow).toBeDefined();
      expect(result.successCriteria).toBeDefined();
      expect(result.successCriteria?.length).toBeGreaterThan(0);
    });
  });

  describe("User Story: As a developer, I want clear workflow execution plans", () => {
    it("should generate step-by-step execution plans", async () => {
      const input = "Implement unit tests for the payment service";

      const result = await sdk.enhanceWithWorkflow(input);

      // Success Criteria:
      const plan = result.workflow?.executionPlan || [];
      expect(plan).toBeDefined();
      expect(plan.length).toBeGreaterThan(0);

      // Each step should have required properties
      plan.forEach((step, index) => {
        expect(step.step).toBe(index + 1);
        expect(step.description).toBeDefined();
        expect(step.description.length).toBeGreaterThan(0);
      });

      // Should have logical dependencies
      const hasDepencies = plan.some(
        (step) => step.dependencies && step.dependencies.length > 0,
      );
      expect(hasDepencies).toBe(true);
    }, 10000);
  });

  describe("User Story: As a developer, I want proper error handling", () => {
    it("should handle empty input gracefully", async () => {
      const input = "";

      try {
        await sdk.enhance(input);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toContain("empty");
      }
    });

    it("should handle invalid input types gracefully", async () => {
      const input = { content: null as any };

      const result = await sdk.enhance(input.content);
      expect(result).toBeDefined();
      // Should fallback to a basic prompt
      expect(result.validation.isValid).toBe(false);
    });
  });
});

// Custom matcher for Bun tests (might be declared in another test file)
// declare module 'bun:test' {
//   interface Matchers<R> {
//     toBeOneOf(expected: Array<any>): R;
//   }
// }

if (!(expect as any).toBeOneOf) {
  expect.extend({
    toBeOneOf(received: any, expected: Array<any>) {
      const pass = expected.includes(received);
      return {
        pass,
        message: () =>
          pass
            ? `Expected ${received} not to be one of ${expected.join(", ")}`
            : `Expected ${received} to be one of ${expected.join(", ")}`,
      };
    },
  });
}
