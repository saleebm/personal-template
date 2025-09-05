/**
 * Mock API responses for testing
 */

import type {
  StructuredPrompt,
  AIEnhancement,
  ValidationResult,
  WorkflowType,
} from "../../src/types.js";

/**
 * Create a mock enhanced prompt
 */
export function createMockEnhancedPrompt(
  overrides: Partial<StructuredPrompt> = {},
): StructuredPrompt {
  return {
    id: "test-id-" + Date.now(),
    version: "1.0.0",
    workflow: "feature" as WorkflowType,
    instruction: "Enhanced instruction with clear requirements and context",
    context: {
      projectOverview: "Test project overview",
      relevantFiles: [
        { path: "src/test.ts", summary: "Test utilities" },
        { path: "src/utils.ts", summary: "Helper functions" },
      ],
      dependencies: ["typescript", "bun"],
      currentState: "Active development",
      technicalStack: ["TypeScript", "Bun"],
    },
    inputs: [],
    expectedOutput: {
      format: "code",
      structure: "TypeScript module",
      constraints: ["Follow existing patterns"],
      examples: ["interface Example { }"],
    },
    validation: {
      isValid: true,
      score: 85,
      issues: [],
      suggestions: ["Consider adding error handling"],
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      author: "test-user",
      tags: ["feature", "api", "typescript"],
    },
    clarifyingQuestions: [
      "What is the expected behavior?",
      "Are there any specific requirements?",
    ],
    successCriteria: [
      "Functionality works as expected",
      "Tests are passing",
      "Code is documented",
    ],
    constraints: [
      "Must be backward compatible",
      "Should not break existing tests",
      "Performance must not degrade",
    ],
    examples: [
      {
        input: "Sample input",
        output: "Expected output",
        explanation: "This demonstrates the expected behavior",
      },
    ],
    ...overrides,
  };
}

/**
 * Create a mock AI enhancement response
 */
export function createMockAIEnhancement(
  overrides: Partial<AIEnhancement> = {},
): AIEnhancement {
  return {
    instruction: "AI-enhanced instruction with comprehensive details",
    workflowType: "feature",
    context: {
      relevantFiles: ["src/services/auth.ts", "src/models/user.ts"],
      dependencies: ["express", "typescript"],
      technicalStack: ["Node.js", "TypeScript"],
      agentSuggestions: ["Consider using existing auth patterns"],
    },
    successCriteria: [
      "Feature is implemented correctly",
      "All tests pass",
      "Documentation is updated",
    ],
    constraints: [
      "Follow existing code patterns",
      "Maintain backward compatibility",
    ],
    clarifyingQuestions: [
      "Should this integrate with existing systems?",
      "What are the performance requirements?",
    ],
    confidenceScore: 90,
    estimatedComplexity: "moderate",
    orderOfSteps: [
      "Analyze requirements",
      "Design implementation",
      "Write tests",
      "Implement features",
    ],
    tokenCount: 200,
    ...overrides,
  };
}

/**
 * Create a mock validation result
 */
export function createMockValidationResult(
  overrides: Partial<ValidationResult> = {},
): ValidationResult {
  return {
    isValid: true,
    score: 75,
    issues: [],
    suggestions: ["Add more specific success criteria"],
    ...overrides,
  };
}

/**
 * Mock API error responses
 */
export const MOCK_API_ERRORS = {
  rateLimitExceeded: {
    error: {
      message: "Rate limit exceeded",
      type: "rate_limit_error",
      code: "rate_limit_exceeded",
    },
  },

  invalidApiKey: {
    error: {
      message: "Invalid API key provided",
      type: "authentication_error",
      code: "invalid_api_key",
    },
  },

  modelNotAvailable: {
    error: {
      message: "The model `gemini-2.5-pro` is not available",
      type: "model_error",
      code: "model_not_found",
    },
  },

  networkTimeout: {
    error: {
      message: "Request timeout",
      type: "network_error",
      code: "timeout",
    },
  },

  serverError: {
    error: {
      message: "Internal server error",
      type: "server_error",
      code: "internal_error",
    },
  },

  invalidRequest: {
    error: {
      message: "Invalid request parameters",
      type: "validation_error",
      code: "invalid_parameters",
    },
  },

  quotaExceeded: {
    error: {
      message: "Quota exceeded for this API key",
      type: "quota_error",
      code: "quota_exceeded",
    },
  },
};

/**
 * Mock successful API responses
 */
export const MOCK_API_RESPONSES = {
  simple: createMockAIEnhancement({
    instruction: "Implement a simple function to add two numbers",
    workflowType: "feature",
    confidenceScore: 95,
    tokenCount: 50,
  }),

  complex: createMockAIEnhancement({
    instruction:
      "Design and implement a comprehensive authentication system with OAuth2, JWT, and MFA support",
    workflowType: "feature",
    confidenceScore: 85,
    tokenCount: 500,
    successCriteria: [
      "OAuth2 flow implemented correctly",
      "JWT tokens are secure and properly validated",
      "MFA supports TOTP and SMS",
      "Session management is secure",
      "Rate limiting is in place",
    ],
    constraints: [
      "Must be OWASP compliant",
      "Support horizontal scaling",
      "Backward compatible with existing auth",
    ],
  }),

  bug: createMockAIEnhancement({
    instruction:
      "Fix the memory leak in the user service causing server crashes",
    workflowType: "bug",
    confidenceScore: 88,
    tokenCount: 150,
    successCriteria: [
      "Memory leak is identified and fixed",
      "Server remains stable under load",
      "Memory usage stays within limits",
    ],
  }),

  refactor: createMockAIEnhancement({
    instruction: "Refactor the database access layer to use repository pattern",
    workflowType: "refactor",
    confidenceScore: 92,
    tokenCount: 200,
    successCriteria: [
      "Repository pattern implemented correctly",
      "All database operations use repositories",
      "Tests are updated and passing",
    ],
  }),
};

/**
 * Mock storage data
 */
export const MOCK_STORAGE_DATA = {
  validPrompt: {
    id: "stored-prompt-1",
    instruction: "Test prompt from storage",
    enhancedPrompt: createMockEnhancedPrompt({
      id: "stored-prompt-1",
      instruction: "Test prompt from storage",
    }),
    timestamp: new Date().toISOString(),
    metadata: {
      source: "test",
      version: "1.0.0",
    },
  },

  corruptedPrompt: {
    id: "corrupted-prompt",
    // Missing required fields to simulate corruption
    timestamp: "invalid-date",
  },

  largePrompt: {
    id: "large-prompt",
    instruction: "A".repeat(1000000), // 1MB of text
    enhancedPrompt: createMockEnhancedPrompt({
      instruction: "B".repeat(1000000),
    }),
  },
};

/**
 * Mock context data
 */
export const MOCK_CONTEXT_DATA = {
  projectFiles: [
    "src/index.ts",
    "src/services/user.ts",
    "src/models/user.ts",
    "tests/user.test.ts",
    "package.json",
    "README.md",
  ],

  projectStructure: {
    src: {
      services: ["user.ts", "auth.ts", "payment.ts"],
      models: ["user.ts", "order.ts", "product.ts"],
      controllers: ["userController.ts", "authController.ts"],
    },
    tests: ["user.test.ts", "auth.test.ts"],
    docs: ["API.md", "README.md"],
  },

  dependencies: {
    express: "^4.18.0",
    typescript: "^5.0.0",
    prisma: "^5.0.0",
  },

  gitInfo: {
    branch: "main",
    lastCommit: "feat: add user authentication",
    uncommittedChanges: ["src/services/user.ts"],
  },
};

/**
 * Create a mock workflow execution result
 */
export function createMockWorkflowResult(workflow: WorkflowType) {
  const baseResult = {
    id: `workflow-${Date.now()}`,
    workflow,
    status: "completed" as const,
    startTime: new Date(Date.now() - 5000).toISOString(),
    endTime: new Date().toISOString(),
    duration: 5000,
    steps: [
      { name: "analyze", status: "completed", duration: 1000 },
      { name: "enhance", status: "completed", duration: 2000 },
      { name: "validate", status: "completed", duration: 2000 },
    ],
  };

  switch (workflow) {
    case "bug":
      return {
        ...baseResult,
        result: "Bug identified and fix implemented",
        artifacts: ["fix.patch", "test-results.json"],
      };
    case "feature":
      return {
        ...baseResult,
        result: "Feature implemented successfully",
        artifacts: ["feature.ts", "feature.test.ts", "docs.md"],
      };
    case "refactor":
      return {
        ...baseResult,
        result: "Code refactored successfully",
        artifacts: ["refactored-files.json", "performance-report.json"],
      };
    default:
      return baseResult;
  }
}
