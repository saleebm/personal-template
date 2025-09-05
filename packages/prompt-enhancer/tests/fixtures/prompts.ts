/**
 * Test fixtures for prompt-enhancer tests
 */

export const TEST_PROMPTS = {
  // Simple prompts
  simple: {
    bugFix: "Fix the login error",
    feature: "Add dark mode",
    refactor: "Refactor the user service",
    research: "How does OAuth work?",
  },

  // Complex prompts
  complex: {
    authentication:
      "Redesign the entire authentication system with OAuth2, SAML, and multi-factor authentication including biometrics",
    dataArchitecture:
      "Build a scalable data pipeline that processes 1TB of data daily with real-time streaming and batch processing",
    microservices:
      "Convert monolithic application to microservices with service mesh, circuit breakers, and distributed tracing",
  },

  // Edge cases
  edgeCases: {
    empty: "",
    whitespace: "   \n   \t   ",
    unicode: "🚀 Build a rocket ship 🚀",
    specialChars: 'Handle <script>alert("XSS")</script> in inputs',
    veryLong: "A".repeat(10000), // 10KB prompt
    multiline: `
      Create a comprehensive system that:
      1. Handles user authentication
      2. Manages permissions
      3. Logs all activities
      4. Sends notifications
      5. Generates reports
    `,
    withCode:
      "Fix this function:\n```js\nfunction add(a, b) { return a + b }\n```",
    sqlInjection: "'; DROP TABLE users; --",
    pathTraversal: "../../../etc/passwd",
    nullBytes: "test\x00hidden",
    controlChars: "test\r\ninjection",
  },

  // Workflow-specific
  workflows: {
    bug: "There is a memory leak in the user service causing crashes",
    feature: "Add a new payment gateway integration with Stripe",
    refactor: "Improve the performance of the search algorithm",
    research: "What are the best practices for implementing WebSockets?",
    documentation: "Document the API endpoints for the user service",
    testing: "Write unit tests for the authentication module",
  },

  // Language-specific
  languages: {
    english: "Build a REST API",
    spanish: "Construir una API REST",
    chinese: "构建REST API",
    arabic: "بناء واجهة برمجة تطبيقات REST",
    emoji: "🔨 Build 🌐 API 🚀",
  },

  // Context-dependent
  contextual: {
    withReferences:
      "Update the function in @user-service.ts to handle the new requirements",
    withLinks: "Implement the design from https://example.com/design-doc",
    withFiles:
      "Refactor the code in src/services/auth.ts and src/controllers/user.ts",
    withVariables: "Fix the ${ERROR_TYPE} in ${FILE_NAME}",
  },

  // Invalid inputs
  invalid: {
    null: null as any,
    undefined: undefined as any,
    number: 123 as any,
    object: { prompt: "test" } as any,
    array: ["test", "prompt"] as any,
    boolean: true as any,
  },

  // Performance test prompts
  performance: {
    small: "Fix bug",
    medium: "A".repeat(1000),
    large: "A".repeat(10000),
    veryLarge: "A".repeat(100000),
    withManyTokens: Array(1000).fill("word").join(" "),
    deeplyNested: JSON.stringify(
      { a: { b: { c: { d: { e: "value" } } } } },
      null,
      2,
    ),
  },
};

/**
 * Generate random test prompt
 */
export function generateRandomPrompt(): string {
  const templates = [
    "Fix the ${issue} in ${component}",
    "Add ${feature} to ${service}",
    "Refactor ${module} for better ${quality}",
    "Implement ${pattern} in ${layer}",
    "Debug ${problem} occurring in ${environment}",
  ];

  const issues = ["bug", "error", "crash", "memory leak", "performance issue"];
  const components = ["auth service", "database", "API", "frontend", "cache"];
  const features = [
    "logging",
    "monitoring",
    "caching",
    "validation",
    "encryption",
  ];
  const services = [
    "user service",
    "payment gateway",
    "notification system",
    "search engine",
  ];
  const modules = [
    "authentication",
    "authorization",
    "data processing",
    "file handling",
  ];
  const qualities = [
    "performance",
    "maintainability",
    "scalability",
    "security",
  ];
  const patterns = [
    "singleton",
    "factory",
    "observer",
    "strategy",
    "decorator",
  ];
  const layers = ["controller", "service", "repository", "middleware"];
  const problems = ["timeout", "deadlock", "race condition", "memory overflow"];
  const environments = ["production", "staging", "development", "testing"];

  const template = templates[Math.floor(Math.random() * templates.length)];

  if (!template) {
    return "Fix the bug in auth service"; // Fallback template
  }

  return template
    .replace(
      "${issue}",
      issues[Math.floor(Math.random() * issues.length)] || "bug",
    )
    .replace(
      "${component}",
      components[Math.floor(Math.random() * components.length)] || "component",
    )
    .replace(
      "${feature}",
      features[Math.floor(Math.random() * features.length)] || "feature",
    )
    .replace(
      "${service}",
      services[Math.floor(Math.random() * services.length)] || "service",
    )
    .replace(
      "${module}",
      modules[Math.floor(Math.random() * modules.length)] || "module",
    )
    .replace(
      "${quality}",
      qualities[Math.floor(Math.random() * qualities.length)] || "quality",
    )
    .replace(
      "${pattern}",
      patterns[Math.floor(Math.random() * patterns.length)] || "pattern",
    )
    .replace(
      "${layer}",
      layers[Math.floor(Math.random() * layers.length)] || "layer",
    )
    .replace(
      "${problem}",
      problems[Math.floor(Math.random() * problems.length)] || "problem",
    )
    .replace(
      "${environment}",
      environments[Math.floor(Math.random() * environments.length)] ||
        "environment",
    );
}

/**
 * Get prompts by workflow type
 */
export function getPromptsByWorkflow(workflow: string): string[] {
  switch (workflow) {
    case "bug":
      return [
        TEST_PROMPTS.workflows.bug,
        TEST_PROMPTS.simple.bugFix,
        "Fix the null pointer exception",
        "Debug the infinite loop in processing",
      ];
    case "feature":
      return [
        TEST_PROMPTS.workflows.feature,
        TEST_PROMPTS.simple.feature,
        "Add user profile management",
        "Implement real-time notifications",
      ];
    case "refactor":
      return [
        TEST_PROMPTS.workflows.refactor,
        TEST_PROMPTS.simple.refactor,
        "Optimize database queries",
        "Improve code organization",
      ];
    default:
      return [TEST_PROMPTS.simple.research];
  }
}
