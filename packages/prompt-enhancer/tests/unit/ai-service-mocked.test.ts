/**
 * AI Service Tests with Complete Mocking
 *
 * These tests verify AI service functionality without making any external API calls.
 * All external dependencies are mocked using captured payloads.
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from "bun:test";
import { AIService } from "../../src/ai-service.js";
import {
  mockAISDK,
  expectAICalls,
  blockAllNetworkCalls,
  verifyNoOutboundCalls,
} from "../utils/ai-mock.js";
import type { APIKeyConfig } from "../../src/types.js";

describe("AI Service - Mocked Tests", () => {
  let aiMock: ReturnType<typeof mockAISDK>;
  let networkBlocker: ReturnType<typeof blockAllNetworkCalls>;
  let aiService: AIService;

  beforeAll(() => {
    // Block all network calls globally
    networkBlocker = blockAllNetworkCalls();
  });

  beforeEach(() => {
    // Set up AI SDK mocking
    aiMock = mockAISDK();

    // Create AI service with test API key
    aiService = new AIService("gemini-2.5-pro", {
      googleApiKey: "test-api-key",
    } as APIKeyConfig);
  });

  afterEach(() => {
    // Restore mocks and clear tracker
    aiMock.restore();

    // Verify no real network calls were made
    const noOutboundCalls = verifyNoOutboundCalls();
    expect(noOutboundCalls).toBe(true);
  });

  afterAll(() => {
    // Restore network
    networkBlocker.restore();
  });

  describe("enhancePrompt", () => {
    it("should enhance a simple prompt without external calls", async () => {
      const input = "Write a function to sort an array";
      const context = "TypeScript project using Bun runtime";

      const result = await aiService.enhancePrompt(input, context);

      // Verify the enhancement
      expect(result).toBeDefined();
      expect(result.instruction).toBeDefined();
      expect(result.instruction).not.toBe(input);
      expect(result.workflowType).toBeDefined();
      expect(result.successCriteria).toBeArray();
      expect(result.successCriteria?.length).toBeGreaterThan(0);
      expect(result.constraints).toBeArray();
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(100);
      expect(result.tokenCount).toBeGreaterThan(0);

      // Verify exactly one generateObject call was made
      expectAICalls({ generateObject: 1 });
    });

    it("should detect bug workflow type correctly", async () => {
      const input = "Fix the memory leak in user service";

      const result = await aiService.enhancePrompt(input);

      expect(result.workflowType).toBe("bug");
      expect(result.instruction).toContain("fix");
      expectAICalls({ generateObject: 1 });
    });

    it("should handle complex prompts with proper structure", async () => {
      const complexPrompt = `
        Implement a comprehensive authentication system with the following requirements:
        - OAuth2 support for Google and GitHub
        - JWT token management with refresh tokens
        - Multi-factor authentication (TOTP and SMS)
        - Session management with Redis
        - Rate limiting per IP and user
        - Audit logging for security events
      `;

      const result = await aiService.enhancePrompt(complexPrompt);

      expect(result.workflowType).toBe("feature");
      expect(result.estimatedComplexity).toBeOneOf(["moderate", "complex"]);
      expect(result.orderOfSteps).toBeArray();
      expect(result.orderOfSteps?.length).toBeGreaterThan(3);
      expectAICalls({ generateObject: 1 });
    });

    it("should provide fallback enhancement when API fails", async () => {
      // Configure mock to simulate API failure
      aiMock.restore();
      aiMock = mockAISDK({ shouldFail: true, errorType: "rate_limit" });

      const input = "Test prompt for fallback";
      const result = await aiService.enhancePrompt(input);

      // Should still return valid enhancement via fallback
      expect(result).toBeDefined();
      expect(result.instruction).toBeDefined();
      expect(result.workflowType).toBeDefined();
      expect(result.confidenceScore).toBe(50); // Fallback confidence
    });

    it("should include token usage information", async () => {
      const result = await aiService.enhancePrompt("Create a login form");

      expect(result.tokenUsage).toBeDefined();
      expect(result.tokenUsage?.input).toBeGreaterThanOrEqual(0);
      expect(result.tokenUsage?.output).toBeGreaterThanOrEqual(0);
      expect(result.tokenCount).toBe(
        (result.tokenUsage?.input || 0) + (result.tokenUsage?.output || 0),
      );
    });
  });

  describe("enhanceWithSearchGrounding", () => {
    it("should enhance with search grounding (mocked)", async () => {
      const prompt = "How to implement authentication";
      const searchQuery = "authentication best practices 2025";

      const result = await aiService.enhanceWithSearchGrounding(
        prompt,
        searchQuery,
      );

      expect(result).toBeDefined();
      expect(result.instruction).toBeDefined();
      expect(result.searchResults).toBeDefined();

      // Should make one generateObject call
      expectAICalls({ generateObject: 1 });
    });

    it("should fallback to regular enhancement on search failure", async () => {
      // Mock search grounding to fail
      aiMock.restore();
      aiMock = mockAISDK({ shouldFail: true, errorType: "network" });

      const result = await aiService.enhanceWithSearchGrounding(
        "Test prompt",
        "search query",
      );

      // Should still work via fallback
      expect(result).toBeDefined();
      expect(result.instruction).toBeDefined();
    });
  });

  describe("enhanceWithGoogleTools", () => {
    it("should enhance with Google tools without making external calls", async () => {
      const result = await aiService.enhanceWithGoogleTools(
        "Create a login form",
        {
          urls: ["https://example.com/docs"],
          searchQueries: ["login best practices"],
          useMCP: false,
        },
      );

      expect(result).toBeDefined();
      expect(result.instruction).toBeDefined();
      expect(result.sources).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.toolsUsed).toBeArray();

      // Verify AI SDK calls
      const tracker = aiMock.getTracker();
      expect(tracker.calls.length).toBeGreaterThan(0);
    });

    it("should handle missing tools gracefully", async () => {
      const result = await aiService.enhanceWithGoogleTools(
        "Simple prompt",
        {}, // No tools specified
      );

      expect(result).toBeDefined();
      expect(result.metadata?.toolsUsed).toEqual([]);
      expectAICalls({ generateObject: 1 });
    });

    it("should integrate MCP tools when requested", async () => {
      const result = await aiService.enhanceWithGoogleTools(
        "Create API endpoint",
        {
          useMCP: true,
          mcpConfig: "./test-mcp.json",
        },
      );

      expect(result).toBeDefined();
      expect(result.metadata?.mcpServers).toBeArray();
    });
  });

  describe("generateClarifyingQuestions", () => {
    it("should generate clarifying questions without external calls", async () => {
      const prompt = "Build a dashboard";

      const questions = await aiService.generateClarifyingQuestions(prompt);

      expect(questions).toBeArray();
      expect(questions.length).toBeGreaterThan(0);
      expect(questions.length).toBeLessThanOrEqual(6);

      // Each question should be a string
      questions.forEach((q) => {
        expect(typeof q).toBe("string");
        expect(q.length).toBeGreaterThan(10);
      });

      expectAICalls({ generateText: 1 });
    });

    it("should provide default questions on API failure", async () => {
      aiMock.restore();
      aiMock = mockAISDK({ shouldFail: true });

      const questions = await aiService.generateClarifyingQuestions("Test");

      expect(questions).toBeArray();
      expect(questions.length).toBe(6); // Default questions count
      expect(questions[0]).toContain("technical goal");
    });
  });

  describe("analyzeComplexity", () => {
    it("should analyze prompt complexity correctly", async () => {
      const simplePrompt = "Fix a typo in the README";
      const complexPrompt =
        "Redesign the entire authentication system with OAuth2, SAML, and MFA";

      const simpleResult = await aiService.analyzeComplexity(simplePrompt);
      const complexResult = await aiService.analyzeComplexity(complexPrompt);

      expect(simpleResult).toBeOneOf(["simple", "moderate"]);
      expect(complexResult).toBeOneOf(["moderate", "complex"]);

      // Should make 2 generateText calls
      expectAICalls({ generateText: 2 });
    });

    it("should default to moderate on analysis failure", async () => {
      aiMock.restore();
      aiMock = mockAISDK({ shouldFail: true });

      const result = await aiService.analyzeComplexity("Any prompt");
      expect(result).toBe("moderate");
    });
  });

  describe("suggestAgents", () => {
    it("should suggest appropriate agents for complex tasks", async () => {
      const prompt = "Refactor the entire codebase to microservices";
      const complexity = "complex" as const;

      const agents = await aiService.suggestAgents(prompt, complexity);

      expect(agents).toBeArray();
      // Complex tasks should suggest agents
      expect(agents.length).toBeGreaterThan(0);

      // Verify suggested agents are valid
      const validAgents = [
        "ai-dr-workflow-orchestrator",
        "ai-dr-challenger",
        "nextjs-ui-api-engineer",
        "principle-engineer",
        "typescript-error-resolver",
      ];

      agents.forEach((agent) => {
        expect(validAgents).toContain(agent);
      });

      expectAICalls({ generateText: 1 });
    });

    it("should return empty array for simple tasks", async () => {
      const agents = await aiService.suggestAgents("Fix typo", "simple");

      expect(agents).toEqual([]);
      // No API call for simple tasks
      expectAICalls({});
    });

    it("should provide fallback suggestions on API failure", async () => {
      aiMock.restore();
      aiMock = mockAISDK({ shouldFail: true });

      const agents = await aiService.suggestAgents(
        "Complex architecture task",
        "complex",
      );

      // Should return at least the orchestrator for complex tasks
      expect(agents).toContain("ai-dr-workflow-orchestrator");
    });
  });

  describe("streamEnhancement", () => {
    it("should stream enhancement without external calls", async () => {
      const prompt = "Create a React component";
      const chunks: string[] = [];

      const stream = aiService.streamEnhancement(prompt);

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.join("")).toBeDefined();

      expectAICalls({ streamText: 1 });
    });

    it("should handle stream errors gracefully", async () => {
      aiMock.restore();
      aiMock = mockAISDK({ shouldFail: true });

      const chunks: string[] = [];
      const stream = aiService.streamEnhancement("Test");

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      // Should return error message
      expect(chunks.join("")).toContain("failed");
    });
  });

  describe("Model Configuration", () => {
    it("should handle Gemini model configuration", () => {
      const service = new AIService("gemini-2.5-flash", {
        googleApiKey: "test-key",
      });

      expect(service).toBeDefined();
      // Service should be initialized with Gemini
      expect(service["modelName"]).toBe("gemini-2.5-flash");
    });

    it("should handle Claude model with fallback to Gemini", () => {
      // No Anthropic key, but has Google key
      const service = new AIService("claude-3-5-sonnet", {
        googleApiKey: "test-google-key",
      });

      expect(service).toBeDefined();
      // Should fallback to Gemini
      expect(service["modelName"]).toBe("gemini-2.5-pro");
    });

    it("should throw error when no API keys are provided", () => {
      // Clear any environment variables
      const originalGoogleKey = process.env["GOOGLE_API_KEY"];
      const originalAnthropicKey = process.env["ANTHROPIC_API_KEY"];

      delete process.env["GOOGLE_API_KEY"];
      delete process.env["ANTHROPIC_API_KEY"];

      expect(() => {
        new AIService("gemini-2.5-pro");
      }).toThrow("No valid API keys found");

      // Restore env vars
      if (originalGoogleKey) process.env["GOOGLE_API_KEY"] = originalGoogleKey;
      if (originalAnthropicKey)
        process.env["ANTHROPIC_API_KEY"] = originalAnthropicKey;
    });
  });

  describe("MCP Integration", () => {
    it("should load MCP configuration", () => {
      expect(() => {
        aiService.loadMCPConfig("./test-mcp.json");
      }).not.toThrow();
    });

    it("should get available MCP servers", () => {
      const servers = aiService.getAvailableMCPServers();
      expect(servers).toBeArray();
    });
  });
});

// Custom matcher for array validation
if (!(expect as any).toBeArray) {
  expect.extend({
    toBeArray(received: any) {
      const pass = Array.isArray(received);
      return {
        pass,
        message: () =>
          pass
            ? `Expected ${received} not to be an array`
            : `Expected ${received} to be an array`,
      };
    },
  });
}

// Custom matcher for one-of validation
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
