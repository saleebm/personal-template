# Prompt Enhancer - Claude Agent Instructions

## Overview
The Prompt Enhancer SDK is an AI-powered tool for transforming vague, unstructured prompts into clear, actionable, and world-class prompts. Currently uses Gemini 2.5 Pro with fallback support.

## 🧪 Testing Strategy & Mocking

### Overview
All tests are designed to run **without any external API calls**. The package includes comprehensive mocking infrastructure to ensure tests are fast, reliable, and cost-free.

### Test Structure
```
tests/
├── fixtures/
│   ├── api-payloads/       # Captured real API responses
│   │   ├── google/         # Google AI responses
│   │   └── anthropic/      # Anthropic responses
│   ├── mock-responses.ts   # Mock data generators
│   └── prompts.ts          # Test prompt fixtures
├── utils/
│   ├── ai-mock.ts          # AI SDK mocking utilities
│   ├── setup.ts            # Test environment setup
│   └── custom-matchers.ts  # Custom test matchers
├── unit/                   # Unit tests
│   ├── ai-service-mocked.test.ts
│   └── storage.test.ts
├── integration/            # Integration tests
│   └── no-outbound-calls.test.ts
└── e2e/                    # End-to-end tests
```

### Mocking Strategy

#### 1. **Preventing External Calls**
All external API calls are intercepted and mocked:
- `ai` SDK functions (`generateObject`, `generateText`, `streamText`)
- Network fetch calls (blocked globally in tests)
- File system operations (mocked when needed)

#### 2. **Using Captured Payloads**
Real API responses are captured and stored as fixtures:
```bash
# Capture actual API responses (requires API keys)
bun run scripts/capture-payloads.ts

# Options:
# --service=google|anthropic|all
# --output=path/to/fixtures
# --verbose
```

#### 3. **Mock Implementation**
```typescript
import { mockAISDK, blockAllNetworkCalls } from '../utils/ai-mock.js';

// In your test
const aiMock = mockAISDK();
const networkBlocker = blockAllNetworkCalls();

// Test code here...

// Cleanup
aiMock.restore();
networkBlocker.restore();
```

### Running Tests

```bash
# Run all tests (no external calls)
bun test

# Run specific test file
bun test tests/unit/ai-service-mocked.test.ts

# Run with coverage
bun test --coverage

# Verify no outbound calls
bun test tests/integration/no-outbound-calls.test.ts
```

### Updating Test Fixtures

When the prompt-enhancer code changes or external APIs update:

1. **Capture Fresh Payloads**:
   ```bash
   # Set API keys (temporarily)
   export GOOGLE_API_KEY=your-key
   export ANTHROPIC_API_KEY=your-key  # Optional
   
   # Run capture script
   bun run scripts/capture-payloads.ts
   ```

2. **Review Captured Data**:
   - Check `tests/fixtures/api-payloads/` for new files
   - Ensure no sensitive data is included
   - Verify response structures match expectations

3. **Update Tests**:
   - Run tests to ensure they work with new fixtures
   - Update mock responses if API contract changed

### Test Categories

#### Unit Tests
- Test individual functions in isolation
- Mock all dependencies
- Focus on logic and edge cases
- Location: `tests/unit/`

#### Integration Tests  
- Test module interactions
- Verify mocking prevents external calls
- Test complete workflows
- Location: `tests/integration/`

#### E2E Tests
- Test full SDK usage scenarios
- Simulate real-world usage (still mocked)
- Verify public API contracts
- Location: `tests/e2e/`

### Key Testing Utilities

#### `ai-mock.ts`
- `mockAISDK()`: Mocks all AI SDK functions
- `blockAllNetworkCalls()`: Prevents any fetch calls
- `verifyNoOutboundCalls()`: Ensures mocking worked
- `aiCallTracker`: Tracks all AI SDK calls for assertions

#### `setup.ts`
- `setupTestEnvironment()`: Creates isolated test env
- `FileSystemErrorSimulator`: Simulates FS errors
- `PerformanceMonitor`: Measures test performance
- `MockClock`: Controls time in tests

### Testing Guidelines

1. **Always Mock External Calls**
   - Never make real API calls in tests
   - Use captured payloads for realistic responses
   - Block network at global level

2. **Test Error Scenarios**
   - API failures (rate limits, auth errors)
   - Network timeouts
   - Invalid responses
   - File system errors

3. **Verify No Outbound Calls**
   - Every test should verify no external calls
   - Use `verifyNoOutboundCalls()` helper
   - Track attempted calls for debugging

4. **Maintain Test Fixtures**
   - Keep fixtures up-to-date
   - Document fixture structure
   - Version control all fixtures

5. **Performance Testing**
   - Test with large inputs
   - Verify timeout handling
   - Check memory usage

### Common Test Patterns

```typescript
// Basic test with mocking
it('should enhance prompt without external calls', async () => {
  const aiMock = mockAISDK();
  const sdk = new PromptEnhancerSDK({ apiKeys: { googleApiKey: 'test' }});
  
  const result = await sdk.enhance('Test prompt');
  
  expect(result).toBeDefined();
  expect(verifyNoOutboundCalls()).toBe(true);
  
  aiMock.restore();
});

// Test with error simulation
it('should handle API errors gracefully', async () => {
  const aiMock = mockAISDK({ shouldFail: true, errorType: 'rate_limit' });
  
  const result = await sdk.enhance('Test');
  
  expect(result).toBeDefined(); // Should fallback
  aiMock.restore();
});
```

### Security Considerations

- Never commit real API keys
- Sanitize captured payloads
- Remove any PII from fixtures
- Use test-only API keys in CI/CD

## ✅ Configuration Requirements

### 1. AI SDK v5 Configuration (FIXED)
**Solution**: Updated to `@ai-sdk/google` v2.0+ which is compatible with AI SDK v5
```typescript
// Correct usage in ai-service.ts
import { google } from '@ai-sdk/google';
this.model = google('gemini-2.0-flash-latest');
```

### 2. Environment Variables
Create `.env` file:
```env
GOOGLE_API_KEY=your-gemini-api-key-here
# Optional fallback
ANTHROPIC_API_KEY=your-claude-api-key-here
```

## Key Implementation Details

### Current AI Provider (WORKING)
- **Provider**: `@ai-sdk/google` v2.0+
- **Model**: Gemini 2.5 Pro (default)
- **Available Models**: 
  - `gemini-2.5-pro` - Most capable, default
  - `gemini-2.5-flash` - Faster, for search grounding
  - `gemini-1.5-pro`, `gemini-1.5-flash` - Previous generation
- **Integration**: Vercel AI SDK v5 with structured generation
- **Search Grounding**: Available via `enhanceWithSearchGrounding` method

### Architecture
- **Zod Validation**: All data structures use Zod schemas for type safety
- **Modular Design**: Separate modules for parsing, context, validation, storage
- **Fallback Strategy**: Graceful degradation when AI service unavailable
- **Token Management**: 4000 token limit with smart truncation

## Documentation References

### Primary Documentation
- **Technical Documentation**: `docs/technical-documentation.md` - Comprehensive SDK guide
- **Agent Engineering Guide**: `docs/claude-code-agent-engineering.md` - Sub-agent patterns
- **Original Specification**: `docs/prompt-creator-init.pdf` - Initial requirements

### Planning Archives
- **Location**: `docs/planning-archive/` - Contains original planning files
- **Purpose**: Historical reference for design decisions

## Development Guidelines

### When Working on This Package
1. **Always update documentation** after making changes
2. **Maintain Zod schemas** for any new data structures
3. **Test fallback paths** to ensure resilience
4. **Keep token limits in mind** when processing prompts

### Testing
```bash
# Run tests
bun test

# Type checking
bun run typecheck

# Test CLI
bun run enhance "Your prompt here"
```

### Common Tasks

#### Adding New Workflow Types
1. Update `WorkflowTypeSchema` in `src/types.ts`
2. Add detection logic in `ai-service.ts`
3. Update success criteria and constraints
4. Add tests for the new type

#### Modifying AI Enhancement
1. Edit prompt in `ai-service.ts` → `buildEnhancementPrompt()`
2. Update `AIEnhancementSchema` if structure changes
3. Test with various prompt complexities

#### Improving Context Analysis
1. Enhance `context.ts` for better file discovery
2. Consider caching strategies for large codebases
3. Add project-specific patterns

## Integration Points

### CLI Tool
- **Location**: `scripts/enhance-prompt.ts` (to be created)
- **Features**: Interactive mode, file I/O, multiple formats

### Web Integration
- **API Endpoint**: `/api/enhance-prompt` (to be created)
- **React Hook**: `usePromptEnhancer` (to be created)

## Important Notes

### Security
- Never expose API keys in code
- Sanitize user inputs before AI processing
- Validate all external data with Zod

### Performance
- Cache AI responses for identical prompts
- Implement request deduplication
- Monitor token usage

### Maintenance
- Review fallback enhancements monthly
- Update workflow patterns based on usage
- Keep documentation synchronized with code

## Contact & Support
For questions or improvements, reference:
- Session context: `.claude/tasks/context_session_prompt_enhancer.md`
- Agent feedback in planning archives
- Original requirements in PDF documentation