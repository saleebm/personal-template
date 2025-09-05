import { z } from 'zod';

// Workflow types - expanded for engineering focus
export const WorkflowTypeSchema = z.enum([
  'feature',
  'bug',
  'refactor',
  'documentation',
  'research',
  'pr_review',
  'architecture',
  'testing',
  'optimization',
  'security',
  'deployment',
  'general'
]);

export type WorkflowType = z.infer<typeof WorkflowTypeSchema>;

// File context
export const FileContextSchema = z.object({
  path: z.string(),
  summary: z.string(),
  relevantSections: z.array(z.object({
    startLine: z.number(),
    endLine: z.number(),
    purpose: z.string()
  })).optional()
});

export type FileContext = z.infer<typeof FileContextSchema>;

// Prompt context
export const PromptContextSchema = z.object({
  projectOverview: z.string(),
  relevantFiles: z.array(FileContextSchema),
  dependencies: z.array(z.string()),
  currentState: z.string(),
  technicalStack: z.array(z.string())
});

export type PromptContext = z.infer<typeof PromptContextSchema>;

// Input specification
export const PromptInputSchema = z.object({
  label: z.string(),
  value: z.string(),
  type: z.enum(['text', 'code', 'data', 'reference'])
});

export type PromptInput = z.infer<typeof PromptInputSchema>;

// Output specification
export const OutputSpecificationSchema = z.object({
  format: z.enum(['code', 'documentation', 'analysis', 'structured_data']),
  structure: z.string().optional(),
  constraints: z.array(z.string()).optional(),
  examples: z.array(z.string()).optional()
});

export type OutputSpecification = z.infer<typeof OutputSpecificationSchema>;

// Example
export const ExampleSchema = z.object({
  input: z.string(),
  output: z.string(),
  explanation: z.string().optional()
});

export type Example = z.infer<typeof ExampleSchema>;

// Validation issue
export const ValidationIssueSchema = z.object({
  severity: z.enum(['error', 'warning', 'info']),
  field: z.string(),
  message: z.string(),
  fix: z.string().optional()
});

export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;

// Validation result
export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  score: z.number().min(0).max(100),
  issues: z.array(ValidationIssueSchema),
  suggestions: z.array(z.string())
});

export type ValidationResult = z.infer<typeof ValidationResultSchema>;

// Prompt metadata
export const PromptMetadataSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  usage: z.array(z.object({
    timestamp: z.date(),
    success: z.boolean(),
    feedback: z.string().optional()
  })).optional(),
  performance: z.object({
    avgResponseTime: z.number(),
    successRate: z.number(),
    userRating: z.number().optional()
  }).optional()
});

export type PromptMetadata = z.infer<typeof PromptMetadataSchema>;

// Main structured prompt
export const StructuredPromptSchema = z.object({
  id: z.string(),
  version: z.string(),
  workflow: WorkflowTypeSchema,
  instruction: z.string(),
  context: PromptContextSchema,
  inputs: z.array(PromptInputSchema),
  expectedOutput: OutputSpecificationSchema,
  validation: ValidationResultSchema,
  metadata: PromptMetadataSchema,
  clarifyingQuestions: z.array(z.string()).optional(),
  successCriteria: z.array(z.string()).optional(),
  constraints: z.array(z.string()).optional(),
  examples: z.array(ExampleSchema).optional(),
  // New sections from enhancement request
  handOffGuidance: z.string().optional().describe('Summary for handing off to another developer or agent'),
  openQuestions: z.array(z.string()).optional().describe('Ambiguities or areas needing clarification'),
  constraintsAndNonGoals: z.array(z.string()).optional().describe('Task boundaries and explicit non-goals'),
  // Agent resolution - will be defined after the schemas
  agentResolution: z.any().optional().describe('Information about resolved agent mentions'),
  discoveredReferences: z.array(z.object({
    type: z.enum(['url', 'library', 'package']),
    value: z.string(),
    context: z.string().optional()
  })).optional().describe('URLs and library names found in the prompt')
});

export type StructuredPrompt = z.infer<typeof StructuredPromptSchema>;

// Raw prompt input
export const RawPromptInputSchema = z.object({
  content: z.string(),
  type: WorkflowTypeSchema.optional(),
  metadata: z.object({
    taskId: z.string().optional(),
    author: z.string().optional(),
    timestamp: z.date().optional(),
    tags: z.array(z.string()).optional(),
    source: z.string().optional()
  }).optional()
});

export type RawPromptInput = z.infer<typeof RawPromptInputSchema>;

// Parsed prompt (internal)
export const ParsedPromptSchema = z.object({
  rawContent: z.string(),
  detectedType: WorkflowTypeSchema,
  extractedRequirements: z.array(z.string()),
  identifiedComponents: z.array(z.string()),
  suggestedTags: z.array(z.string())
});

export type ParsedPrompt = z.infer<typeof ParsedPromptSchema>;

// Codebase context
export const CodebaseContextSchema = z.object({
  files: z.array(FileContextSchema),
  dependencies: z.record(z.string(), z.string()),
  configuration: z.record(z.string(), z.any()),
  recentChanges: z.array(z.string())
});

export type CodebaseContext = z.infer<typeof CodebaseContextSchema>;

// Prompt search query
export const PromptSearchQuerySchema = z.object({
  workflow: WorkflowTypeSchema.optional(),
  tags: z.array(z.string()).optional(),
  author: z.string().optional(),
  dateRange: z.object({
    start: z.date(),
    end: z.date()
  }).optional(),
  minScore: z.number().min(0).max(100).optional()
});

export type PromptSearchQuery = z.infer<typeof PromptSearchQuerySchema>;

// API Key configuration schema
export const APIKeyConfigSchema = z.object({
  googleApiKey: z.string().optional().describe('Google API key for Gemini models'),
  anthropicApiKey: z.string().optional().describe('Anthropic API key for Claude models')
});

export type APIKeyConfig = z.infer<typeof APIKeyConfigSchema>;

// Config schema  
export const PromptEnhancerConfigSchema = z.object({
  projectPath: z.string().describe('Path to the project directory'),
  outputDir: z.string().default('.ai-dr/crafted').describe('Directory to save enhanced prompts'),
  enableCodebaseContext: z.boolean().default(true).describe('Enable automatic codebase context analysis'),
  maxContextTokens: z.number().default(4000).describe('Maximum tokens to use for context'),
  templateLibrary: z.array(z.any()).default([]).describe('Custom prompt templates'),
  debug: z.boolean().default(false).describe('Enable debug logging'),
  logLevel: z.enum(['silent', 'error', 'warn', 'info', 'verbose', 'debug']).default('error').describe('Logging level'),
  model: z.enum([
    'gemini-2.5-pro', 
    'gemini-2.5-flash', 
    'gemini-1.5-pro', 
    'gemini-1.5-flash', 
    'claude-sonnet-4', 
    'claude-3-5-sonnet-20241022', 
    'claude-3-5-haiku-20241022'
  ]).default('gemini-2.5-pro').describe('AI model to use for enhancement'),
  apiKeys: APIKeyConfigSchema.optional().describe('API keys for AI services (overrides environment variables)')
});

export type PromptEnhancerConfig = z.infer<typeof PromptEnhancerConfigSchema>;

// AI Enhancement schema for structured generation - expanded for engineering
export const AIEnhancementSchema = z.object({
  instruction: z.string().describe('Clear, specific instruction for the task'),
  context: z.object({
    relevantFiles: z.array(z.string()).describe('Files that might need modification'),
    dependencies: z.array(z.string()).describe('Libraries or packages involved'),
    technicalStack: z.array(z.string()).describe('Technologies used in the project'),
    agentSuggestions: z.array(z.string()).optional().describe('Suggested sub-agents for complex tasks')
  }),
  clarifyingQuestions: z.array(z.string()).optional().describe('Questions to ask if prompt is vague'),
  successCriteria: z.array(z.string()).describe('How to verify task completion'),
  constraints: z.array(z.string()).optional().describe('Limitations or requirements'),
  workflowType: WorkflowTypeSchema.describe('Type of work being requested'),
  confidenceScore: z.number().min(0).max(100).describe('How confident the AI is about this enhancement'),
  estimatedComplexity: z.enum(['simple', 'moderate', 'complex']).describe('Task complexity estimation'),
  orderOfSteps: z.array(z.string()).optional().describe('Suggested order of execution steps'),
  tokenCount: z.number().optional().describe('Estimated token count for the enhanced prompt')
});

export type AIEnhancement = z.infer<typeof AIEnhancementSchema>;

// Agent coordination schema
export const AgentCoordinationSchema = z.object({
  agentType: z.enum([
    'ai-dr-workflow-orchestrator',
    'ai-dr-challenger',
    'nextjs-ui-api-engineer',
    'principle-engineer',
    'typescript-error-resolver'
  ]),
  agentPath: z.string().describe('Dynamic path to agent configuration'),
  contextFile: z.string().describe('Path to context session file'),
  task: z.string().describe('Specific task for the agent'),
  priority: z.number().min(1).max(10).default(5)
});

export type AgentCoordination = z.infer<typeof AgentCoordinationSchema>;

// Workflow execution schema
export const WorkflowExecutionSchema = z.object({
  id: z.string(),
  sessionId: z.string().describe('Session ID for context tracking'),
  prompt: StructuredPromptSchema,
  agents: z.array(AgentCoordinationSchema).optional(),
  contextFiles: z.array(z.string()).describe('Relevant context files for the workflow'),
  executionPlan: z.array(z.object({
    step: z.number(),
    description: z.string(),
    agent: z.string().optional(),
    dependencies: z.array(z.number()).optional()
  })),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']),
  results: z.object({
    outputPath: z.string().optional(),
    logs: z.array(z.string()).optional(),
    metrics: z.object({
      totalTokens: z.number(),
      executionTime: z.number(),
      stepsCompleted: z.number()
    }).optional()
  }).optional()
});

export type WorkflowExecution = z.infer<typeof WorkflowExecutionSchema>;

// Engineering-focused prompt enhancement result
export const EnhancedPromptResultSchema = z.object({
  id: z.string(),
  original: z.string(),
  enhanced: z.string(),
  workflow: WorkflowExecutionSchema.optional(),
  metadata: z.object({
    createdAt: z.date(),
    tokenCount: z.number(),
    complexity: z.enum(['simple', 'moderate', 'complex']),
    agentsRequired: z.boolean(),
    contextFilesUsed: z.array(z.string())
  }),
  outputFile: z.string().describe('Path to the complete enhanced prompt file')
});

export type EnhancedPromptResult = z.infer<typeof EnhancedPromptResultSchema>;

// Export EnhancedPrompt type alias for backward compatibility
// Use StructuredPrompt directly instead of alias

// Agent resolution schemas (defined after other schemas to avoid circular dependencies)
export const AgentInfoSchema = z.object({
  name: z.string().describe('Agent name (e.g., nextjs-ui-api-engineer)'),
  description: z.string().describe('Agent description and capabilities'),
  filePath: z.string().describe('Path to the agent file')
});

export const AgentResolutionResultSchema = z.object({
  originalPrompt: z.string().describe('Original user prompt'),
  processedPrompt: z.string().describe('Prompt with resolved agent mentions'),
  resolvedAgents: z.array(AgentInfoSchema).describe('Agents found and resolved in the prompt')
});

export type AgentInfo = z.infer<typeof AgentInfoSchema>;
export type AgentResolutionResult = z.infer<typeof AgentResolutionResultSchema>;