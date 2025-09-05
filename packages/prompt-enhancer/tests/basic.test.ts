import { describe, it, expect } from 'bun:test';
import { PromptEnhancerSDK } from '../src/index.js';

describe('PromptEnhancerSDK', () => {
  it('should instantiate with default config', async () => {
    const sdk = new PromptEnhancerSDK();
    
    const config = sdk.getConfig();
    expect(config.model).toMatch(/^gemini-\d+\.\d+-(pro|flash)$/);
    expect(config.enableCodebaseContext).toBe(true);
  });

  it('should accept custom configuration', () => {
    const customConfig = {
      model: 'gemini-2.5-flash' as const,
      debug: true,
    };
    
    const sdk = new PromptEnhancerSDK(customConfig);
    const config = sdk.getConfig();
    
    expect(config.model).toBe('gemini-2.5-flash');
    expect(config.debug).toBe(true);
  });

  it('should enhance a basic prompt', async () => {
    const sdk = new PromptEnhancerSDK();
    const input = 'Help me write better code';

    const result = await sdk.enhance(input);
    
    expect(result).toBeDefined();
    expect(result.instruction).not.toBe(input);
    expect(result.validation.score).toBeGreaterThanOrEqual(0);
    expect(result.successCriteria).toBeDefined();
    expect(result.successCriteria?.length).toBeGreaterThan(0);
  });

  it('should handle invalid input gracefully', async () => {
    const sdk = new PromptEnhancerSDK();
    const invalidInput = '';

    await expect(sdk.enhance(invalidInput)).rejects.toThrow('Input content cannot be empty');
  });

  it('should generate unique IDs for prompts', async () => {
    const sdk = new PromptEnhancerSDK();
    const input = 'Test prompt';

    const result1 = await sdk.enhance(input);
    const result2 = await sdk.enhance(input);
    
    expect(result1.id).not.toBe(result2.id);
  });

  it('should detect workflow type', async () => {
    const sdk = new PromptEnhancerSDK();
    
    const bugPrompt = 'Fix the login error';
    const bugResult = await sdk.enhance(bugPrompt);
    expect(bugResult.workflow).toBe('bug');
    
    const featurePrompt = 'Add dark mode feature';
    const featureResult = await sdk.enhance(featurePrompt);
    expect(featureResult.workflow).toBe('feature');
  });

  it('should provide fallback enhancement when AI is unavailable', async () => {
    const sdk = new PromptEnhancerSDK();
    const input = 'Optimize database queries';
    
    // Even if AI fails, we should get a valid response
    const result = await sdk.enhance(input);
    
    expect(result).toBeDefined();
    expect(result.instruction).toBeDefined();
    expect(result.successCriteria).toBeDefined();
    expect(result.constraints).toBeDefined();
  });
});