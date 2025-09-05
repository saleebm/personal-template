# @repo/prompt-enhancer

AI-powered prompt enhancement SDK that transforms vague, unstructured prompts into clear, actionable, world-class prompts with workflow orchestration capabilities for complex engineering tasks.

> **Build System**: This package is built with [bunchee](https://github.com/huozhi/bunchee) for zero-config bundling with TypeScript support, ESM/CJS dual output, and optimized builds.

## Features

- 🤖 **AI-Powered Enhancement** - Transforms vague prompts into structured engineering tasks
- 🔀 **Workflow Orchestration** - Handles complex multi-step tasks with agent coordination
- 🎯 **Agent Resolution** - Automatically resolves agent mentions (e.g., `@nextjs-ui-api-engineer`) from `.claude/agents/`
- 📊 **Quality Scoring** - 0-100 scoring with detailed feedback and suggestions
- 🔍 **Context Awareness** - Analyzes your codebase to add relevant context
- 🎯 **Workflow Detection** - Supports 12 workflow types (bug, feature, refactor, optimization, security, etc.)
- 🤝 **Agent Integration** - Suggests appropriate sub-agents for complex tasks
- ✅ **Zod Validation** - Type-safe with comprehensive schema validation
- 💾 **Persistent Storage** - Save, retrieve, and search enhanced prompts
- 📤 **Multiple Formats** - Export to JSON, YAML, or Markdown
- 🔄 **Fallback Resilience** - Works even when AI service is unavailable

## Installation

### From this repository (Local Installation)

This package is designed to be easily installed from any local repository on your computer:

```bash
# From any project on your computer:
bun add file:/path/to/ai-doctore/packages/prompt-enhancer

# Or using npm/yarn:
npm install /path/to/ai-doctore/packages/prompt-enhancer
yarn add file:/path/to/ai-doctore/packages/prompt-enhancer

# Or in your package.json:
"dependencies": {
  "@repo/prompt-enhancer": "file:../path/to/ai-doctore/packages/prompt-enhancer"
}
```

### Using the CLI globally

```bash
# Install globally from this package
cd packages/prompt-enhancer
bun link

# Now use from anywhere
enhance-prompt "Your prompt here"
```

### Building from source

```bash
# Clone and build
cd packages/prompt-enhancer
bun install
bun run build  # Uses bunchee to create optimized bundles

# The package is now ready to use with:
# - ESM: dist/index.mjs
# - CJS: dist/index.cjs
# - Types: dist/index.d.ts
# - CLI: bin/enhance-prompt
```

## API Key Configuration

You can provide API keys in three ways (in order of precedence):

### 1. Via Configuration Object (Recommended)

```typescript
import { PromptEnhancerSDK } from "@repo/prompt-enhancer";

const sdk = new PromptEnhancerSDK({
  apiKeys: {
    googleApiKey: "your-google-api-key",
    anthropicApiKey: "your-anthropic-api-key", // optional
  },
  model: "gemini-2.5-pro",
});
```

### 2. Via CLI Parameters

```bash
npx @repo/prompt-enhancer --google-key "your-key" "your prompt here"
npx @repo/prompt-enhancer --anthropic-key "your-key" --model claude-sonnet-4 "prompt"
```

### 3. Via Environment Variables (Fallback)

```env
# For Gemini models
GOOGLE_API_KEY=your-google-api-key-here

# For Claude models
ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

Get your Google API key from: https://makersuite.google.com/app/apikey

## Quick Start

### Basic Usage

```typescript
import { PromptEnhancerSDK } from "@repo/prompt-enhancer";

const enhancer = new PromptEnhancerSDK({
  projectPath: process.cwd(),
  model: "gemini-2.5-pro", // Available: gemini-2.5-pro, gemini-2.5-flash, claude-sonnet-4, etc.
  apiKeys: {
    googleApiKey: "your-google-api-key",
    anthropicApiKey: "your-anthropic-api-key", // optional
  },
});

// Enhance a simple prompt
const enhanced = await enhancer.enhance("Fix the login bug");

console.log(enhanced.instruction); // Clear, specific instruction
console.log(enhanced.successCriteria); // How to verify completion
console.log(enhanced.validation.score); // Quality score 0-100
```

### With Google Search Grounding

```typescript
// Enhance with real-time web search results
const enhanced = await enhancer.enhanceWithSearch(
  "How to implement OAuth 2.0",
  "OAuth 2.0 implementation best practices 2024",
);
```

### With Workflow Type

```typescript
const enhanced = await enhancer.enhance({
  content: "Add user profile page",
  type: "feature",
  metadata: {
    author: "john.doe",
    tags: ["ui", "frontend"],
  },
});
```

### Agent Resolution

The prompt enhancer automatically detects and resolves agent mentions in your prompts:

```typescript
// Direct agent mention resolution
const resolution = await enhancer.resolveAgentMentions(
  "I need help with nextjs-ui-api-engineer to create a modern component",
);

console.log(resolution.processedPrompt);
// Output: "I need help @agent-nextjs-ui-api-engineer to create a modern component"

console.log(resolution.resolvedAgents);
// Output: [{ name: 'nextjs-ui-api-engineer', description: '...', filePath: '...' }]

// Get all available agents
const agents = await enhancer.getAvailableAgents();
console.log(agents.map((a) => a.name));
// Output: ['nextjs-ui-api-engineer', 'typescript-error-resolver', ...]
```

**Supported Agent Mention Patterns:**

- Direct names: `nextjs-ui-api-engineer`, `typescript-error-resolver`
- With prefixes: `use nextjs-ui-api-engineer`, `with typescript-error-resolver`
- At-mentions: `@nextjs-ui-api-engineer`
- Partial matches: `nextjs engineer` → `nextjs-ui-api-engineer`

The agent resolution reads from your `.claude/agents/` directory and parses frontmatter to extract agent names and descriptions.

### Interactive Mode (CLI)

```bash
# Run the CLI tool
bun run enhance "Your prompt here"

# With file input
bun run enhance -f prompt.txt -o result.md

# Interactive mode with questions
bun run enhance -i
```

## API Reference

### PromptEnhancerSDK

#### Constructor

```typescript
new PromptEnhancerSDK(config?: {
  projectPath?: string;      // Project root (default: cwd)
  outputDir?: string;        // Storage directory (default: .prompts)
  enableCodebaseContext?: boolean; // Analyze codebase (default: true)
  maxContextTokens?: number; // Token limit (default: 4000)
  model?: string;            // AI model (default: 'gemini-2.5-pro')
  debug?: boolean;           // Debug logging (default: false)
  logLevel?: 'silent' | 'error' | 'warn' | 'info' | 'verbose' | 'debug';
  apiKey?: string;           // Optional API key override
})
```

#### Methods

##### enhance(input: string | RawPromptInput): Promise<StructuredPrompt>

Enhances a raw prompt into a structured, actionable prompt.

##### enhanceWithSearch(input: string | RawPromptInput, searchQuery?: string): Promise<StructuredPrompt>

Enhances a prompt with Google Search grounding for real-time information.

##### enhanceWithWorkflow(input: string | RawPromptInput): Promise<EnhancedPromptResult>

Orchestrates complex multi-step workflows with agent coordination.

##### store(prompt: StructuredPrompt): Promise<string>

Saves an enhanced prompt for later retrieval.

##### retrieve(id: string): Promise<StructuredPrompt | null>

Loads a previously saved prompt by ID.

##### search(query: PromptSearchQuery): Promise<StructuredPrompt[]>

Searches stored prompts by criteria.

##### validate(prompt: StructuredPrompt): ValidationResult

Validates a prompt and returns quality score.

##### export(prompt: StructuredPrompt, format: 'json' | 'yaml' | 'markdown'): string

Exports a prompt in the specified format.

##### getAvailableAgents(): Promise<AgentInfo[]>

Returns all agents found in the `.claude/agents/` directory.

##### resolveAgentMentions(prompt: string): Promise<AgentResolutionResult>

Detects and resolves agent mentions in a prompt, returning the processed prompt and resolved agents.

## Workflow Types

The SDK automatically detects and optimizes for different workflow types:

- **bug** - Issue fixes and debugging
- **feature** - New functionality
- **refactor** - Code improvements
- **documentation** - Docs and comments
- **research** - Investigation and analysis
- **pr_review** - Code review
- **general** - Default type

## Output Structure

Enhanced prompts include:

```typescript
{
  id: string;                    // Unique identifier
  workflow: WorkflowType;        // Detected workflow
  instruction: string;           // Enhanced instruction
  context: {                    // Project context
    relevantFiles: FileContext[];
    dependencies: string[];
    technicalStack: string[];
  };
  successCriteria: string[];     // Completion verification
  constraints: string[];         // Limitations
  clarifyingQuestions?: string[]; // For vague prompts
  validation: {                  // Quality metrics
    score: number;
    issues: ValidationIssue[];
    suggestions: string[];
  };
}
```

## Examples

### Bug Fix Enhancement

```typescript
const prompt = await enhancer.enhance("Users cant login after password reset");

// Result includes:
// - Clear instruction: "Fix the authentication failure that occurs when..."
// - Success criteria: ["Issue no longer reproducible", "Tests pass", ...]
// - Relevant files: ["auth.service.ts", "password-reset.ts", ...]
// - Constraints: ["Maintain backward compatibility", ...]
```

### Feature Development

```typescript
const prompt = await enhancer.enhance({
  content: "Add dark mode toggle",
  type: "feature",
});

// Includes examples, UI considerations, and implementation steps
```

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Type checking
bun run typecheck

# Build with bunchee (creates ESM, CJS, and TypeScript definitions)
bun run build

# Build everything (library + CLI)
bun run build:full

# Development mode
bun run dev
```

### Build Output

The package uses bunchee to generate:

- **ESM build**: `dist/index.mjs` - For modern Node.js and bundlers
- **CJS build**: `dist/index.cjs` - For compatibility with older Node.js
- **TypeScript definitions**: `dist/index.d.ts` and `dist/index.d.mts`
- **CLI binary**: `bin/enhance-prompt` - Executable CLI tool

## Configuration Options

```typescript
import {
  PromptEnhancerSDK,
  type PromptEnhancerConfig,
} from "@repo/prompt-enhancer";

const config: PromptEnhancerConfig = {
  projectPath: process.cwd(), // Project directory path
  outputDir: ".ai-dr/crafted", // Where to save enhanced prompts
  enableCodebaseContext: true, // Analyze codebase for context
  maxContextTokens: 4000, // Max tokens for context analysis
  debug: false, // Enable debug logging
  model: "gemini-2.5-pro", // AI model selection
  apiKeys: {
    // API keys (overrides env vars)
    googleApiKey: "your-google-key",
    anthropicApiKey: "your-anthropic-key",
  },
};

const enhancer = new PromptEnhancerSDK(config);
```

### Supported Models

| Model                        | Provider  | Description             |
| ---------------------------- | --------- | ----------------------- |
| `gemini-2.5-pro`             | Google    | Most capable (default)  |
| `gemini-2.5-flash`           | Google    | Faster, good for search |
| `gemini-1.5-pro`             | Google    | Previous generation     |
| `claude-sonnet-4`            | Anthropic | Claude 4 Sonnet         |
| `claude-3-5-sonnet-20241022` | Anthropic | Claude 3.5 Sonnet       |

## Contributing

See [CLAUDE.md](./CLAUDE.md) for agent-specific development instructions.

## Documentation

- [Technical Documentation](./docs/technical-documentation.md) - Detailed SDK guide
- [Agent Engineering](./docs/claude-code-agent-engineering.md) - Claude integration patterns
- [Planning Archives](./docs/planning-archive/) - Design decisions

## License

MIT
