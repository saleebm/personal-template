/**
 * Integration Test: Verify No Outbound Calls
 * 
 * This test suite ensures that all external API calls are properly mocked
 * and no actual network requests are made during testing.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import { PromptEnhancerSDK } from '../../src/index.js';
import { AIService } from '../../src/ai-service.js';
import { mockAISDK, blockAllNetworkCalls, verifyNoOutboundCalls, aiCallTracker } from '../utils/ai-mock.js';

describe('No Outbound Calls Integration', () => {
  let networkBlocker: ReturnType<typeof blockAllNetworkCalls>;
  let aiMock: ReturnType<typeof mockAISDK>;
  let networkCallAttempts: string[] = [];

  beforeAll(() => {
    // Block all network calls and track attempts
    const originalFetch = globalThis.fetch;
    const mockedFetch = async (url: any, options?: any) => {
      networkCallAttempts.push(typeof url === 'string' ? url : url.toString());
      throw new Error(`Network call blocked: ${url}`);
    };
    // Add preconnect property to match fetch interface
    (mockedFetch as any).preconnect = () => { };
    globalThis.fetch = mockedFetch as unknown as typeof fetch;

    // Mock AI SDK
    aiMock = mockAISDK();
  });

  afterAll(() => {
    // Verify no network calls were attempted
    expect(networkCallAttempts).toEqual([]);

    if (networkCallAttempts.length > 0) {
      console.error('Attempted network calls:', networkCallAttempts);
    }

    // Restore
    aiMock.restore();
  });

  beforeEach(() => {
    networkCallAttempts = [];
    aiCallTracker.clear();
  });

  describe('PromptEnhancerSDK', () => {
    it('should enhance prompts without making external calls', async () => {
      const sdk = new PromptEnhancerSDK({
        apiKeys: {
          googleApiKey: 'test-key'
        }
      });

      const result = await sdk.enhance('Create a user authentication system');

      expect(result).toBeDefined();
      expect(result.instruction).toBeDefined();
      expect(networkCallAttempts).toEqual([]);
      expect(verifyNoOutboundCalls()).toBe(true);
    });

    it('should batch enhance without external calls', async () => {
      const sdk = new PromptEnhancerSDK({
        apiKeys: {
          googleApiKey: 'test-key'
        }
      });

      const prompts = [
        'Create a login form',
        'Fix memory leak',
        'Refactor database layer'
      ];

      const results = await Promise.all(
        prompts.map(prompt => sdk.enhance(prompt))
      );

      expect(results).toHaveLength(3);
      results.forEach((result: any) => {
        expect(result).toBeDefined();
        expect(result.instruction).toBeDefined();
      });

      expect(networkCallAttempts).toEqual([]);
      expect(verifyNoOutboundCalls()).toBe(true);
    });

    it('should validate prompts without external calls', async () => {
      const sdk = new PromptEnhancerSDK({
        apiKeys: {
          googleApiKey: 'test-key'
        }
      });

      const enhancedPrompt = await sdk.enhance('Test prompt');
      const validation = sdk.validate(enhancedPrompt);

      expect(validation).toBeDefined();
      expect(validation.isValid).toBeDefined();
      expect(validation.score).toBeGreaterThanOrEqual(0);
      expect(networkCallAttempts).toEqual([]);
    });

    it('should check readiness without external calls', async () => {
      const sdk = new PromptEnhancerSDK({
        apiKeys: {
          googleApiKey: 'test-key'
        }
      });

      const ready = await sdk.isReady();

      expect(typeof ready).toBe('boolean');
      expect(networkCallAttempts).toEqual([]);
    });

    it('should export enhanced prompts without external calls', async () => {
      const sdk = new PromptEnhancerSDK({
        apiKeys: {
          googleApiKey: 'test-key'
        }
      });

      const enhanced = await sdk.enhance('Test prompt');

      const markdown = sdk.export(enhanced, 'markdown');
      const json = sdk.export(enhanced, 'json');

      expect(markdown).toContain('# Enhanced Prompt');
      expect(JSON.parse(json)).toHaveProperty('instruction');
      expect(networkCallAttempts).toEqual([]);
    });
  });

  describe('AIService Direct Usage', () => {
    it('should enhance with all options without external calls', async () => {
      const aiService = new AIService('gemini-2.5-pro', {
        googleApiKey: 'test-key'
      });

      // Test basic enhancement
      const basic = await aiService.enhancePrompt('Basic prompt');
      expect(basic).toBeDefined();
      expect(networkCallAttempts).toEqual([]);

      // Test with search grounding
      const withSearch = await aiService.enhanceWithSearchGrounding(
        'Search enhanced prompt',
        'search query'
      );
      expect(withSearch).toBeDefined();
      expect(networkCallAttempts).toEqual([]);

      // Test with Google tools
      const withTools = await aiService.enhanceWithGoogleTools(
        'Tools enhanced prompt',
        {
          urls: ['https://example.com'],
          searchQueries: ['test query'],
          useMCP: true
        }
      );
      expect(withTools).toBeDefined();
      expect(networkCallAttempts).toEqual([]);

      // Verify all calls were mocked
      expect(verifyNoOutboundCalls()).toBe(true);
    });

    it('should generate clarifying questions without external calls', async () => {
      const aiService = new AIService('gemini-2.5-pro', {
        googleApiKey: 'test-key'
      });

      const questions = await aiService.generateClarifyingQuestions('Vague prompt');

      expect(questions).toBeArray();
      expect(questions.length).toBeGreaterThan(0);
      expect(networkCallAttempts).toEqual([]);
    });

    it('should analyze complexity without external calls', async () => {
      const aiService = new AIService('gemini-2.5-pro', {
        googleApiKey: 'test-key'
      });

      const complexity = await aiService.analyzeComplexity('Complex task');

      expect(complexity).toBeOneOf(['simple', 'moderate', 'complex']);
      expect(networkCallAttempts).toEqual([]);
    });

    it('should suggest agents without external calls', async () => {
      const aiService = new AIService('gemini-2.5-pro', {
        googleApiKey: 'test-key'
      });

      const agents = await aiService.suggestAgents('Complex architecture task', 'complex');

      expect(agents).toBeArray();
      expect(networkCallAttempts).toEqual([]);
    });

    it('should stream enhancement without external calls', async () => {
      const aiService = new AIService('gemini-2.5-pro', {
        googleApiKey: 'test-key'
      });

      const chunks: string[] = [];
      const stream = aiService.streamEnhancement('Stream this prompt');

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(networkCallAttempts).toEqual([]);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle API errors without making actual calls', async () => {
      // Temporarily set mock to fail
      aiMock.restore();
      aiMock = mockAISDK({ shouldFail: true, errorType: 'rate_limit' });

      const sdk = new PromptEnhancerSDK({
        apiKeys: {
          googleApiKey: 'test-key'
        }
      });

      const result = await sdk.enhance('Test prompt');

      // Should fallback gracefully
      expect(result).toBeDefined();
      expect(result.instruction).toBeDefined();
      expect(networkCallAttempts).toEqual([]);

      // Restore normal mock
      aiMock.restore();
      aiMock = mockAISDK();
    });

    it('should handle missing API keys without external calls', async () => {
      const sdk = new PromptEnhancerSDK({
        // No API keys provided
      });

      const result = await sdk.enhance('Test prompt');

      // Should use fallback
      expect(result).toBeDefined();
      expect(networkCallAttempts).toEqual([]);
    });
  });

  describe('Workflow Integration', () => {
    it('should handle complex workflow without external calls', async () => {
      const sdk = new PromptEnhancerSDK({
        apiKeys: {
          googleApiKey: 'test-key'
        }
      });

      // Simulate a complete workflow
      const originalPrompt = 'Build a complete e-commerce platform';

      // Step 1: Enhance the prompt
      const enhanced = await sdk.enhance(originalPrompt);
      expect(enhanced).toBeDefined();

      // Step 2: Validate the enhancement
      const validation = sdk.validate(enhanced);
      expect(validation.isValid).toBeDefined();

      // Step 3: Export for documentation
      const markdown = sdk.export(enhanced, 'markdown');
      expect(markdown).toContain(enhanced.instruction);

      // Step 4: Store the enhanced prompt
      const stored = await sdk.store(enhanced);
      expect(stored).toBeDefined();

      // Verify no external calls throughout the workflow
      expect(networkCallAttempts).toEqual([]);
      expect(verifyNoOutboundCalls()).toBe(true);
    });

    it('should handle parallel operations without external calls', async () => {
      const sdk = new PromptEnhancerSDK({
        apiKeys: {
          googleApiKey: 'test-key'
        }
      });

      // Run multiple operations in parallel
      const [enhanced1, enhanced2, enhanced3] = await Promise.all([
        sdk.enhance('Prompt 1'),
        sdk.enhance('Prompt 2'),
        sdk.enhance('Prompt 3')
      ]);

      const operations = await Promise.all([
        Promise.resolve(enhanced1),
        Promise.resolve(enhanced2),
        Promise.resolve(enhanced3),
        Promise.resolve(sdk.validate(enhanced1)),
        sdk.isReady()
      ]);

      expect(operations).toHaveLength(5);
      expect(networkCallAttempts).toEqual([]);
      expect(verifyNoOutboundCalls()).toBe(true);
    });
  });

  describe('Mock Verification', () => {
    it('should track all AI SDK calls', async () => {
      const sdk = new PromptEnhancerSDK({
        apiKeys: {
          googleApiKey: 'test-key'
        }
      });

      // Clear tracker
      aiCallTracker.clear();

      // Make various calls
      await sdk.enhance('Test 1');
      await sdk.enhance('Test 2');

      // Verify calls were tracked
      const calls = aiCallTracker.getCalls();
      expect(calls.length).toBeGreaterThan(0);

      // Each call should have been mocked
      calls.forEach(call => {
        expect(call.response).toBeDefined();
        expect(call.type).toBeOneOf(['generateObject', 'generateText', 'streamText']);
      });

      expect(networkCallAttempts).toEqual([]);
    });

    it('should verify mocking prevents all network activity', () => {
      // This is a meta-test to ensure our mocking is complete
      expect(verifyNoOutboundCalls()).toBe(true);
      expect(networkCallAttempts).toEqual([]);

      // Verify that fetch is mocked
      expect(async () => {
        await fetch('https://api.example.com');
      }).toThrow();
    });
  });
});

// Custom matchers
if (!(expect as any).toBeArray) {
  expect.extend({
    toBeArray(received: any) {
      const pass = Array.isArray(received);
      return {
        pass,
        message: () =>
          pass
            ? `Expected ${received} not to be an array`
            : `Expected ${received} to be an array`
      };
    }
  });
}

if (!(expect as any).toBeOneOf) {
  expect.extend({
    toBeOneOf(received: any, expected: Array<any>) {
      const pass = expected.includes(received);
      return {
        pass,
        message: () =>
          pass
            ? `Expected ${received} not to be one of ${expected.join(', ')}`
            : `Expected ${received} to be one of ${expected.join(', ')}`
      };
    }
  });
}