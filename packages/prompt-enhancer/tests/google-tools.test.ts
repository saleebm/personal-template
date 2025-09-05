import { describe, it, expect, beforeAll } from "bun:test";
import { AIService } from "../src/ai-service.js";

describe("Google Tools Enhancement", () => {
  let aiService: AIService;

  beforeAll(() => {
    // Initialize AI service
    // Note: This requires GOOGLE_API_KEY to be set
    const hasGoogleKey = !!process.env["GOOGLE_API_KEY"];

    if (hasGoogleKey) {
      aiService = new AIService("gemini-2.5-flash");
    }
  });

  it("should enhance prompt with Google tools", async () => {
    if (!aiService) {
      console.log("Skipping test - GOOGLE_API_KEY not set");
      return;
    }

    const result = await aiService.enhanceWithGoogleTools(
      "Create a login form",
      {
        urls: ["https://ai-sdk.dev/docs"],
        searchQueries: ["best practices login form 2025"],
        useMCP: false,
      },
    );

    expect(result).toHaveProperty("instruction");
    expect(result).toHaveProperty("workflowType");
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("metadata");

    if (result.metadata) {
      expect(result.metadata).toHaveProperty("toolsUsed");
      expect(Array.isArray(result.metadata.toolsUsed)).toBe(true);
    }
  }, 30000); // 30 second timeout for API call

  it("should handle missing tools gracefully", async () => {
    if (!aiService) {
      console.log("Skipping test - GOOGLE_API_KEY not set");
      return;
    }

    const result = await aiService.enhanceWithGoogleTools(
      "Simple prompt",
      {}, // No tools specified
    );

    expect(result).toHaveProperty("instruction");
    expect(result.metadata?.toolsUsed).toEqual([]);
  });

  it("should load custom MCP configuration", () => {
    if (!aiService) {
      aiService = new AIService("gemini-2.5-flash", {
        googleApiKey: "test-key",
      });
    }

    // Should not throw
    expect(() => {
      aiService.loadMCPConfig("./test-mcp.json");
    }).not.toThrow();
  });

  it("should get available MCP servers", () => {
    if (!aiService) {
      aiService = new AIService("gemini-2.5-flash", {
        googleApiKey: "test-key",
      });
    }

    const servers = aiService.getAvailableMCPServers();
    expect(Array.isArray(servers)).toBe(true);
  });
});

describe("Search Grounding", () => {
  it("should enhance with search grounding", async () => {
    const hasGoogleKey = !!process.env["GOOGLE_API_KEY"];

    if (!hasGoogleKey) {
      console.log("Skipping test - GOOGLE_API_KEY not set");
      return;
    }

    const aiService = new AIService("gemini-2.5-flash");
    const result = await aiService.enhanceWithSearchGrounding(
      "How to implement authentication",
      "authentication best practices 2025",
    );

    expect(result).toHaveProperty("instruction");
    expect(result).toHaveProperty("searchResults", true);
  }, 30000);
});

describe("Fallback Enhancement", () => {
  it("should fallback when API fails", async () => {
    // Create service with invalid API key
    const aiService = new AIService("gemini-2.5-flash", {
      googleApiKey: "invalid-key",
    });

    const result = await aiService.enhancePrompt("Test prompt");

    // Should return fallback enhancement
    expect(result).toHaveProperty("instruction");
    expect(result).toHaveProperty("workflowType");
  });
});
