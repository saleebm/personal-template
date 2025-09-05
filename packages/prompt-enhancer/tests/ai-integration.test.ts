import { describe, it, expect } from "bun:test";
import { PromptEnhancerSDK } from "../src/index.js";

describe("AI Integration", () => {
  // Skip AI tests if no API key is available
  const hasApiKey =
    !!process.env["GOOGLE_API_KEY"] ||
    !!process.env["GOOGLE_GENERATIVE_AI_API_KEY"];
  const skipTest = hasApiKey ? it : it.skip;

  skipTest(
    "should connect to AI service",
    async () => {
      const sdk = new PromptEnhancerSDK();
      const ready = await sdk.isReady();
      expect(ready).toBe(true);
    },
    10000,
  );

  skipTest(
    "should enhance prompt with AI",
    async () => {
      const sdk = new PromptEnhancerSDK();
      const input = "Write a function to sort an array";

      const result = await sdk.enhance(input);

      expect(result).toBeDefined();
      expect(result.instruction).not.toBe(input);
      expect(result.instruction.length).toBeGreaterThan(input.length);
      expect(result.validation.score).toBeGreaterThan(0);
      expect(result.successCriteria).toBeDefined();
      expect(result.successCriteria?.length).toBeGreaterThan(0);
    },
    15000,
  );

  skipTest(
    "should provide quality scoring",
    async () => {
      const sdk = new PromptEnhancerSDK();
      const input = "Help me";

      const result = await sdk.enhance(input);

      expect(result).toBeDefined();
      expect(result.validation.score).toBeGreaterThanOrEqual(0);
      expect(result.validation.score).toBeLessThanOrEqual(100);
      expect(result.clarifyingQuestions).toBeDefined();
      // Vague prompt should have clarifying questions
      if (result.clarifyingQuestions) {
        expect(result.clarifyingQuestions.length).toBeGreaterThan(0);
      }
    },
    15000,
  );

  it("should work with fallback when AI is not available", async () => {
    // Test without API key to trigger fallback
    const sdk = new PromptEnhancerSDK();
    const input = "Test prompt for fallback";

    const result = await sdk.enhance(input);

    // Should still succeed with fallback enhancement
    expect(result).toBeDefined();
    expect(result.instruction).not.toBe(input);
  });

  it("should test AI integration method", async () => {
    const sdk = new PromptEnhancerSDK();
    const testResult = await sdk.isReady();

    // Should return boolean (true with API key, might be false without)
    expect(typeof testResult).toBe("boolean");
  }, 10000);

  // Always run this test to ensure fallback works
  it("should handle AI service errors gracefully", async () => {
    const sdk = new PromptEnhancerSDK({
      model: "gemini-2.5-pro" as const,
    });

    const input = "This should trigger an error";

    const result = await sdk.enhance(input);

    // Should still work with fallback
    expect(result).toBeDefined();
    expect(result.instruction).toBeDefined();
  });

  skipTest(
    "should track token usage",
    async () => {
      const sdk = new PromptEnhancerSDK();
      const aiService = sdk["aiService"] as any; // Access private member for testing

      const enhancement = await aiService.enhancePrompt(
        "Create a user authentication system",
        "Context: Next.js application with TypeScript",
      );

      expect(enhancement.tokenCount).toBeDefined();
      expect(enhancement.tokenCount).toBeGreaterThan(0);
      expect(enhancement.tokenUsage).toBeDefined();
      expect(enhancement.tokenUsage.input).toBeGreaterThanOrEqual(0);
      expect(enhancement.tokenUsage.output).toBeGreaterThanOrEqual(0);
    },
    15000,
  );

  skipTest(
    "should detect task complexity",
    async () => {
      const sdk = new PromptEnhancerSDK();
      const aiService = sdk["aiService"] as any; // Access private member for testing

      const simpleComplexity = await aiService.analyzeComplexity("Fix typo");
      expect(simpleComplexity).toBe("simple");

      const complexComplexity = await aiService.analyzeComplexity(
        "Redesign the entire authentication system with OAuth2, SAML, and multi-factor authentication",
      );
      expect(complexComplexity).toBeOneOf(["moderate", "complex"]);
    },
    15000,
  );
});

// Custom matcher - extend if not already defined
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
