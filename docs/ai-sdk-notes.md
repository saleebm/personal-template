# AI SDK Notes

## AI SDK Configuration

### Claude 4 Models (Latest)

- **Correct Import**: `import { anthropic } from '@ai-sdk/anthropic'`
- **Current Models** (Use these!):
  - `claude-opus-4-1-20250805` - Most capable Claude 4
  - `claude-sonnet-4-20250514` - Balanced Claude 4
  - `claude-3-7-sonnet-20250219` - Claude 3.7 Sonnet
  - `claude-3-5-sonnet-20241022` - Claude 3.5 Sonnet (latest)
  - `claude-3-5-haiku-20241022` - Claude 3.5 Haiku (fast)
- **Documentation**: [Anthropic Models](https://docs.anthropic.com/en/docs/about-claude/models)

### Google Gemini with AI SDK v5

- **Correct Import**: `import { google } from '@ai-sdk/google'`
- **Model Usage**: `google('gemini-2.5-pro')` or `google('gemini-2.5-flash')`
- **Version Required**: `@ai-sdk/google` v2.0+ for AI SDK v5 compatibility
- **Search Grounding**: Available with Gemini models
- **Current Models** (Use these!):
  - `gemini-2.5-pro` - Most capable, use as default
  - `gemini-2.5-flash` - Faster, good for search grounding
- **Previous Generation**:
  - `gemini-1.5-pro` - Older but stable
  - `gemini-1.5-flash` - Older fast model
- **Documentation**: [Google Generative AI Models](https://ai.google.dev/gemini-api/docs/models/)

### Common Issues

- If you see `AI_UnsupportedModelVersionError`, update `@ai-sdk/google` to v2.0+ (should not happen if you follow my instruction to be latest and greatest, using npm-search to find the latest version)
- Type errors such as `maxTokens` in `generateObject` calls or `options` object as second parameter to `google()` function which are not supported, always research api docs, either looking at type definitions, context7, or llms.txt which should be in [documentation-links.md](./documentation-links.md)
