/// <reference types="bun-types" />

declare module "bun:test" {
  interface Matchers<R = void> {
    toBeValidPrompt(): R;
    toBeValidEnhancement(): R;
    toHaveWorkflowType(expected: string): R;
    toBeWithinTokenLimit(limit: number): R;
    toContainSuccessCriteria(): R;
    toHaveValidationScore(min: number, max: number): R;
    toBeOneOf(expected: Array<any>): R;
    toMatchPromptStructure(): R;
  }
}

export {};
