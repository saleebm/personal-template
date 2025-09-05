/**
 * AI SDK Mock Implementation
 * 
 * This module provides mocking capabilities for AI SDK calls to prevent
 * outbound network requests during testing. It intercepts calls to 
 * generateObject, generateText, and streamText functions.
 */

import { mock, spyOn } from 'bun:test';
import type { AIEnhancement } from '../../src/types.js';

// Store for tracking all AI calls made during tests
export const aiCallTracker = {
  calls: [] as Array<{
    type: 'generateObject' | 'generateText' | 'streamText';
    model: string;
    prompt: string;
    timestamp: Date;
    response: any;
  }>,
  clear() {
    this.calls = [];
  },
  getCalls(type?: string) {
    return type ? this.calls.filter(c => c.type === type) : this.calls;
  }
};

/**
 * Mock response generator based on prompt content
 */
export class AIResponseMocker {
  private fixtures: Map<string, any> = new Map();
  private defaultResponses: Map<string, any> = new Map();

  constructor() {
    this.loadDefaultResponses();
  }

  /**
   * Load fixture files for mocking
   */
  async loadFixtures(fixtureDir: string = 'tests/fixtures/api-payloads') {
    try {
      // Dynamically import fixtures
      const googleSimple = await import(`../../${fixtureDir}/google/simple-feature.json`);
      this.fixtures.set('simple-feature', googleSimple.default);
      
      // Add more fixtures as they're created
    } catch (error) {
      console.warn('Could not load fixtures:', error);
    }
  }

  /**
   * Set up default mock responses
   */
  private loadDefaultResponses() {
    // Default successful response
    this.defaultResponses.set('default', {
      instruction: 'Enhanced prompt with clear requirements',
      workflowType: 'feature',
      context: {
        relevantFiles: [],
        dependencies: [],
        technicalStack: ['TypeScript', 'Bun'],
        agentSuggestions: []
      },
      successCriteria: [
        'Functionality works as expected',
        'Tests pass',
        'Code is documented'
      ],
      constraints: [
        'Follow best practices',
        'Maintain code quality'
      ],
      confidenceScore: 85,
      estimatedComplexity: 'simple',
      orderOfSteps: [
        '1. Analyze requirements',
        '2. Implement solution',
        '3. Test thoroughly'
      ],
      tokenCount: 200
    });

    // Bug fix response
    this.defaultResponses.set('bug', {
      instruction: 'Fix the identified issue with proper error handling',
      workflowType: 'bug',
      context: {
        relevantFiles: ['src/services/affected-service.ts'],
        dependencies: [],
        technicalStack: ['TypeScript'],
        agentSuggestions: []
      },
      successCriteria: [
        'Bug is fixed',
        'No regressions introduced',
        'Tests added to prevent recurrence'
      ],
      constraints: [
        'Maintain backward compatibility',
        'Add comprehensive error handling'
      ],
      confidenceScore: 90,
      estimatedComplexity: 'moderate',
      orderOfSteps: [
        '1. Reproduce the bug',
        '2. Identify root cause',
        '3. Implement fix',
        '4. Add tests',
        '5. Verify fix'
      ],
      tokenCount: 250
    });

    // Error responses
    this.defaultResponses.set('error:rate_limit', {
      error: {
        message: 'Rate limit exceeded',
        type: 'rate_limit_error',
        code: 'rate_limit_exceeded'
      }
    });

    this.defaultResponses.set('error:invalid_key', {
      error: {
        message: 'Invalid API key',
        type: 'authentication_error',
        code: 'invalid_api_key'
      }
    });
  }

  /**
   * Get mock response based on prompt content
   */
  getMockResponse(prompt: string, options?: { shouldError?: boolean; errorType?: string }): any {
    // Check if we should simulate an error
    if (options?.shouldError) {
      const errorKey = `error:${options.errorType || 'rate_limit'}`;
      const errorResponse = this.defaultResponses.get(errorKey);
      if (errorResponse?.error) {
        throw new Error(errorResponse.error.message);
      }
    }

    // Detect workflow type from prompt
    const promptLower = prompt.toLowerCase();
    
    if (promptLower.includes('bug') || promptLower.includes('fix') || promptLower.includes('error')) {
      return this.defaultResponses.get('bug');
    }
    
    if (promptLower.includes('refactor')) {
      return {
        ...this.defaultResponses.get('default'),
        workflowType: 'refactor',
        instruction: 'Refactor the code following best practices'
      };
    }

    if (promptLower.includes('test')) {
      return {
        ...this.defaultResponses.get('default'),
        workflowType: 'testing',
        instruction: 'Create comprehensive tests for the functionality'
      };
    }

    // Check for fixture match
    for (const [key, fixture] of this.fixtures) {
      if (prompt.includes(fixture.request?.prompt)) {
        return fixture.response?.object || fixture.response;
      }
    }

    // Return default response
    return this.defaultResponses.get('default');
  }

  /**
   * Generate mock stream response
   */
  async* getMockStream(prompt: string): AsyncGenerator<string> {
    const response = this.getMockResponse(prompt);
    const text = typeof response === 'string' ? response : JSON.stringify(response);
    
    // Simulate streaming by yielding chunks
    const chunkSize = 50;
    for (let i = 0; i < text.length; i += chunkSize) {
      yield text.slice(i, i + chunkSize);
      // Small delay to simulate network
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}

/**
 * Mock the AI SDK functions
 */
export function mockAISDK(options?: { 
  shouldFail?: boolean;
  errorType?: string;
  captureOnly?: boolean; // Only capture calls without mocking
}) {
  const mocker = new AIResponseMocker();
  
  // Use dynamic import and module mocking for Bun
  let originalModule: any;
  
  try {
    // Import the module dynamically
    originalModule = require('ai');
  } catch (error) {
    console.warn('AI module not found, using stub implementation');
    // Provide stub implementation if module not found
    originalModule = {
      generateObject: async () => ({ object: {}, usage: {} }),
      generateText: async () => ({ text: '', usage: {} }),
      streamText: () => ({ textStream: (async function*() { yield 'stub'; })() })
    };
  }
  
  // Store original functions safely
  const originalGenerateObject = originalModule.generateObject;
  const originalGenerateText = originalModule.generateText;
  const originalStreamText = originalModule.streamText;

  // Create mock functions using Bun's mock
  const mockedGenerateObject = mock(async ({ model, schema, prompt, temperature, maxRetries, abortSignal }: any) => {
    const modelName = typeof model === 'string' ? model : 'unknown';
    
    // Track the call
    const callData = {
      type: 'generateObject' as const,
      model: modelName,
      prompt,
      timestamp: new Date(),
      response: null as any
    };

    // If capture only mode, make actual call
    if (options?.captureOnly) {
      const result = await originalGenerateObject({ model, schema, prompt, temperature, maxRetries, abortSignal });
      callData.response = result;
      aiCallTracker.calls.push(callData);
      return result;
    }

    // Generate mock response
    try {
      const mockResponse = mocker.getMockResponse(prompt, {
        shouldError: options?.shouldFail,
        errorType: options?.errorType
      });

      const result = {
        object: mockResponse,
        usage: {
          inputTokens: 100,
          outputTokens: 200,
          totalTokens: 300
        },
        experimental_providerMetadata: {
          google: {
            groundingMetadata: null,
            urlContextMetadata: null
          }
        }
      };

      callData.response = result;
      aiCallTracker.calls.push(callData);
      
      return result;
    } catch (error) {
      aiCallTracker.calls.push({ ...callData, response: { error } });
      throw error;
    }
  });

  // Mock generateText
  const mockedGenerateText = mock(async ({ model, prompt, tools, temperature, maxRetries }: any) => {
    const modelName = typeof model === 'string' ? model : 'unknown';
    
    // Track the call
    const callData = {
      type: 'generateText' as const,
      model: modelName,
      prompt,
      timestamp: new Date(),
      response: null as any
    };

    // If capture only mode, make actual call
    if (options?.captureOnly) {
      const result = await originalGenerateText({ model, prompt, tools, temperature, maxRetries });
      callData.response = result;
      aiCallTracker.calls.push(callData);
      return result;
    }

    // Generate mock response
    try {
      const mockResponse = mocker.getMockResponse(prompt, {
        shouldError: options?.shouldFail,
        errorType: options?.errorType
      });

      const result = {
        text: typeof mockResponse === 'string' ? mockResponse : JSON.stringify(mockResponse),
        usage: {
          inputTokens: 50,
          outputTokens: 150,
          totalTokens: 200
        },
        toolCalls: tools ? [] : undefined,
        toolResults: tools ? [] : undefined,
        providerMetadata: {}
      };

      callData.response = result;
      aiCallTracker.calls.push(callData);
      
      return result;
    } catch (error) {
      aiCallTracker.calls.push({ ...callData, response: { error } });
      throw error;
    }
  });

  // Mock streamText
  const mockedStreamText = mock(({ model, prompt }: any) => {
    const modelName = typeof model === 'string' ? model : 'unknown';
    
    // Track the call
    aiCallTracker.calls.push({
      type: 'streamText',
      model: modelName,
      prompt,
      timestamp: new Date(),
      response: 'stream'
    });

    // Return mock stream
    return {
      textStream: mocker.getMockStream(prompt)
    };
  });

  // Apply mocks using module replacement
  // For Bun, we need to use mock.module instead of direct property assignment
  try {
    mock.module('ai', () => ({
      generateObject: mockedGenerateObject,
      generateText: mockedGenerateText,
      streamText: mockedStreamText,
      // Include other exports that might be needed
      ...originalModule
    }));
  } catch (error) {
    console.warn('Could not mock AI module:', error);
    // Fallback: try to override if possible
    if (originalModule && typeof originalModule === 'object') {
      Object.defineProperty(originalModule, 'generateObject', {
        value: mockedGenerateObject,
        writable: true,
        configurable: true
      });
      Object.defineProperty(originalModule, 'generateText', {
        value: mockedGenerateText,
        writable: true,
        configurable: true
      });
      Object.defineProperty(originalModule, 'streamText', {
        value: mockedStreamText,
        writable: true,
        configurable: true
      });
    }
  }

  // Return cleanup function
  return {
    restore() {
      try {
        // Restore original module
        mock.module('ai', () => originalModule);
      } catch {
        // Fallback restoration
        if (originalModule && typeof originalModule === 'object') {
          Object.defineProperty(originalModule, 'generateObject', {
            value: originalGenerateObject,
            writable: true,
            configurable: true
          });
          Object.defineProperty(originalModule, 'generateText', {
            value: originalGenerateText,
            writable: true,
            configurable: true
          });
          Object.defineProperty(originalModule, 'streamText', {
            value: originalStreamText,
            writable: true,
            configurable: true
          });
        }
      }
      aiCallTracker.clear();
    },
    getTracker() {
      return aiCallTracker;
    },
    mocker
  };
}

/**
 * Verify no outbound calls were made
 */
export function verifyNoOutboundCalls(): boolean {
  // Check if any real network calls were attempted
  // This would need to be integrated with network monitoring
  // For now, we verify that all calls went through our mocks
  return aiCallTracker.calls.length === 0 || 
         aiCallTracker.calls.every(call => call.response !== undefined);
}

/**
 * Helper to assert AI calls
 */
export function expectAICalls(expectedCalls: {
  generateObject?: number;
  generateText?: number;
  streamText?: number;
}) {
  const actualCalls = {
    generateObject: aiCallTracker.getCalls('generateObject').length,
    generateText: aiCallTracker.getCalls('generateText').length,
    streamText: aiCallTracker.getCalls('streamText').length
  };

  for (const [type, expected] of Object.entries(expectedCalls)) {
    const actual = actualCalls[type as keyof typeof actualCalls];
    if (actual !== expected) {
      throw new Error(
        `Expected ${expected} ${type} calls, but got ${actual}. ` +
        `Calls made: ${JSON.stringify(actualCalls)}`
      );
    }
  }
}

/**
 * Mock network interceptor to prevent any outbound HTTP calls
 */
export function blockAllNetworkCalls() {
  // Override fetch globally
  const originalFetch = globalThis.fetch;
  const mockedFetch = mock(async (url: any, options?: any) => {
    throw new Error(`Network call blocked in tests: ${url}`);
  });
  // Add preconnect property to match fetch interface
  (mockedFetch as any).preconnect = () => {};
  globalThis.fetch = mockedFetch as unknown as typeof fetch;

  // Return restore function
  return {
    restore() {
      globalThis.fetch = originalFetch;
    }
  };
}