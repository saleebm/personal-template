import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { PromptEnhancerSDK } from '../src/index.js';
import { mockAISDK, verifyNoOutboundCalls } from './utils/ai-mock.js';

describe('Simple Integration Test', () => {
  let aiMock: ReturnType<typeof mockAISDK>;

  beforeEach(() => {
    // Set up mocking to prevent external calls
    aiMock = mockAISDK();
  });

  afterEach(() => {
    // Restore mocks and verify no external calls
    aiMock.restore();
    expect(verifyNoOutboundCalls()).toBe(true);
  });

  it('should create SDK and test basic functionality', () => {
    const sdk = new PromptEnhancerSDK();
    const config = sdk.getConfig();
    
    expect(config).toBeDefined();
    expect(config.model).toMatch(/^gemini-\d+\.\d+-(pro|flash)$/);
    expect(config.enableCodebaseContext).toBe(true);
  });

  it('should validate prompt input correctly', async () => {
    const sdk = new PromptEnhancerSDK({
      apiKeys: {
        googleApiKey: 'test-key'
      }
    });
    
    // Test valid input
    const validInput = 'Write a function to sort an array';
    
    const result = await sdk.enhance(validInput);
    expect(result).toBeDefined();
    expect(result.instruction).toBeDefined();
    expect(result.workflow).toBeDefined();
  }, 10000); // Increase timeout for safety

  it('should handle empty content gracefully', async () => {
    const sdk = new PromptEnhancerSDK({
      apiKeys: {
        googleApiKey: 'test-key'
      }
    });
    
    await expect(sdk.enhance('')).rejects.toThrow('Input content cannot be empty');
  });
});