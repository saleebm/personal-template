/**
 * Custom matchers for Bun test framework
 */

import { expect } from 'bun:test';

// Custom type-safe matcher functions instead of extending expect
// This avoids conflicts with Bun's built-in type definitions

/**
 * Standalone assertion functions that can be used instead of custom matchers
 */
export function assertValidPrompt(received: any) {
  const requiredFields = ['id', 'instruction', 'workflow', 'validation'];
  const missingFields = requiredFields.filter(field => !(field in received));
  
  expect(missingFields).toEqual([]);
  expect(typeof received.id).toBe('string');
  expect(typeof received.instruction).toBe('string');
  expect(typeof received.workflow).toBe('string');
  expect(typeof received.validation).toBe('object');
}

export function assertValidEnhancement(received: any) {
  const requiredFields = [
    'instruction',
    'workflowType',
    'successCriteria',
    'constraints',
    'confidenceScore'
  ];
  const missingFields = requiredFields.filter(field => !(field in received));
  
  expect(missingFields).toEqual([]);
  expect(typeof received.instruction).toBe('string');
  expect(typeof received.workflowType).toBe('string');
  expect(Array.isArray(received.successCriteria)).toBe(true);
  expect(Array.isArray(received.constraints)).toBe(true);
  expect(typeof received.confidenceScore).toBe('number');
}

export function assertWorkflowType(received: any, expected: string) {
  const actual = received?.workflow || received?.workflowType;
  expect(actual).toBe(expected);
}

export function assertWithinTokenLimit(received: any, limit: number) {
  const tokenCount = received?.tokenCount || 0;
  expect(tokenCount).toBeGreaterThan(0);
  expect(tokenCount).toBeLessThanOrEqual(limit);
}

export function assertContainsSuccessCriteria(received: any) {
  const successCriteria = received?.successCriteria;
  expect(Array.isArray(successCriteria)).toBe(true);
  expect(successCriteria.length).toBeGreaterThan(0);
  successCriteria.forEach((c: any) => {
    expect(typeof c).toBe('string');
    expect(c.length).toBeGreaterThan(0);
  });
}

export function assertValidationScore(received: any, min: number, max: number) {
  const score = received?.validation?.score;
  expect(typeof score).toBe('number');
  expect(score).toBeGreaterThanOrEqual(min);
  expect(score).toBeLessThanOrEqual(max);
}

export function assertIsOneOf(received: any, expected: Array<any>) {
  expect(expected.includes(received)).toBe(true);
}

export function assertMatchesPromptStructure(received: any) {
  const expectedStructure: Record<string, string> = {
    id: 'string',
    instruction: 'string',
    workflow: 'string',
    validation: 'object',
    metadata: 'object'
  };
  
  for (const [key, expectedType] of Object.entries(expectedStructure)) {
    expect(key in received).toBe(true);
    expect(typeof received[key]).toBe(expectedType as any);
  }
  
  // Check nested structures
  if (received.validation && typeof received.validation === 'object') {
    expect('isValid' in received.validation).toBe(true);
    expect('score' in received.validation).toBe(true);
  }
  
  if (received.metadata && typeof received.metadata === 'object') {
    expect('createdAt' in received.metadata).toBe(true);
    expect('updatedAt' in received.metadata).toBe(true);
  }
}

/**
 * Setup all custom matchers (deprecated - use assertion functions above)
 */
export function setupCustomMatchers() {
  expect.extend({
    /**
     * Check if a value is one of the expected values
     */
    toBeOneOf(received: any, expected: Array<any>) {
      const pass = expected.includes(received);
      return {
        pass,
        message: () =>
          pass
            ? `Expected ${received} not to be one of ${expected.join(', ')}`
            : `Expected ${received} to be one of ${expected.join(', ')}`
      };
    },

    /**
     * Validate that a prompt has all required fields
     */
    toBeValidPrompt(received: any) {
      const requiredFields = ['id', 'instruction', 'workflow', 'validation'];
      const missingFields = requiredFields.filter(field => !(field in received));
      
      const pass = missingFields.length === 0 &&
        typeof received.id === 'string' &&
        typeof received.instruction === 'string' &&
        typeof received.workflow === 'string' &&
        typeof received.validation === 'object';
      
      return {
        pass,
        message: () =>
          pass
            ? 'Expected not to be a valid prompt'
            : `Expected to be a valid prompt. Missing fields: ${missingFields.join(', ')}`
      };
    },

    /**
     * Validate that an enhancement has all required fields
     */
    toBeValidEnhancement(received: any) {
      const requiredFields = [
        'instruction',
        'workflowType',
        'successCriteria',
        'constraints',
        'confidenceScore'
      ];
      const missingFields = requiredFields.filter(field => !(field in received));
      
      const pass = missingFields.length === 0 &&
        typeof received.instruction === 'string' &&
        typeof received.workflowType === 'string' &&
        Array.isArray(received.successCriteria) &&
        Array.isArray(received.constraints) &&
        typeof received.confidenceScore === 'number';
      
      return {
        pass,
        message: () =>
          pass
            ? 'Expected not to be a valid enhancement'
            : `Expected to be a valid enhancement. Missing or invalid fields: ${missingFields.join(', ')}`
      };
    },

    /**
     * Check if prompt has the expected workflow type
     */
    toHaveWorkflowType(received: any, expected: string) {
      const actual = received?.workflow || received?.workflowType;
      const pass = actual === expected;
      
      return {
        pass,
        message: () =>
          pass
            ? `Expected workflow type not to be ${expected}`
            : `Expected workflow type to be ${expected}, but got ${actual}`
      };
    },

    /**
     * Check if token count is within limit
     */
    toBeWithinTokenLimit(received: any, limit: number) {
      const tokenCount = received?.tokenCount || 0;
      const pass = tokenCount > 0 && tokenCount <= limit;
      
      return {
        pass,
        message: () =>
          pass
            ? `Expected token count not to be within limit of ${limit}`
            : `Expected token count (${tokenCount}) to be within limit of ${limit}`
      };
    },

    /**
     * Check if prompt contains success criteria
     */
    toContainSuccessCriteria(received: any) {
      const successCriteria = received?.successCriteria;
      const pass = Array.isArray(successCriteria) && 
        successCriteria.length > 0 &&
        successCriteria.every((c: any) => typeof c === 'string' && c.length > 0);
      
      return {
        pass,
        message: () =>
          pass
            ? 'Expected not to contain valid success criteria'
            : 'Expected to contain valid success criteria (non-empty array of strings)'
      };
    },

    /**
     * Check if validation score is within range
     */
    toHaveValidationScore(received: any, min: number, max: number) {
      const score = received?.validation?.score;
      const pass = typeof score === 'number' && score >= min && score <= max;
      
      return {
        pass,
        message: () =>
          pass
            ? `Expected validation score not to be between ${min} and ${max}`
            : `Expected validation score (${score}) to be between ${min} and ${max}`
      };
    },

    /**
     * Check if object matches expected prompt structure
     */
    toMatchPromptStructure(received: any) {
      const expectedStructure = {
        id: 'string',
        originalPrompt: 'string',
        instruction: 'string',
        workflow: 'string',
        validation: 'object',
        metadata: 'object'
      };
      
      const issues: string[] = [];
      
      for (const [key, expectedType] of Object.entries(expectedStructure)) {
        if (!(key in received)) {
          issues.push(`Missing field: ${key}`);
        } else if (typeof received[key] !== expectedType) {
          issues.push(`Invalid type for ${key}: expected ${expectedType}, got ${typeof received[key]}`);
        }
      }
      
      // Check nested structures
      if (received.validation && typeof received.validation === 'object') {
        if (!('isValid' in received.validation)) {
          issues.push('Missing validation.isValid');
        }
        if (!('score' in received.validation)) {
          issues.push('Missing validation.score');
        }
      }
      
      if (received.metadata && typeof received.metadata === 'object') {
        if (!('timestamp' in received.metadata)) {
          issues.push('Missing metadata.timestamp');
        }
      }
      
      const pass = issues.length === 0;
      
      return {
        pass,
        message: () =>
          pass
            ? 'Expected not to match prompt structure'
            : `Expected to match prompt structure. Issues: ${issues.join(', ')}`
      };
    }
  });
}

/**
 * Helper to validate async operations
 */
export async function expectAsync<T>(
  promise: Promise<T>,
  timeout: number = 5000
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Async operation timed out after ${timeout}ms`)), timeout);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

/**
 * Helper to test error scenarios
 */
export async function expectToThrowAsync(
  fn: () => Promise<any>,
  expectedError?: string | RegExp | Error
): Promise<void> {
  let thrown = false;
  let actualError: any;
  
  try {
    await fn();
  } catch (error) {
    thrown = true;
    actualError = error;
  }
  
  if (!thrown) {
    throw new Error('Expected function to throw, but it did not');
  }
  
  if (expectedError) {
    if (typeof expectedError === 'string') {
      expect(actualError.message).toContain(expectedError);
    } else if (expectedError instanceof RegExp) {
      expect(actualError.message).toMatch(expectedError);
    } else if (expectedError instanceof Error) {
      expect(actualError.message).toBe(expectedError.message);
    }
  }
}