# Documentation Links

Just a list of links that may or may not be useful.

- Git Diff View
  - [git-diff-view Documentation](https://github.com/MrWangJustToDo/git-diff-view)
  - Package: `@git-diff-view/react` for React components
  - Usage: Professional diff visualization with split/unified views

- LangGraph.js
  - [LangGraph.js Official Documentation](https://langchain-ai.github.io/langgraphjs)
  - [LangGraph.js API Reference](https://langchain-ai.github.io/langgraphjs/llms.txt)

- Base UI
  - [Base UI Documentation](https://base-ui.com/llms.txt)
  - [Context7 Base UI Documentation](https://context7.com/mui/base-ui/llms.txt)

- X-State
  - [X-State Documentation](https://stately.ai/docs)
  - [API Specifics](https://www.jsdocs.io/package/xstate)

- GH CLI (installed locally for ai to use in limited capacity for research and read access only to code examples and documentation)
  - [GH CLI Documentation](https://cli.github.com/manual/gh)
  - Scopes given by command: `gh auth refresh --scopes "repo,public_repo,read:user,workflow,read:packages,read:org"`

- Shopify/Roast (Gem: `roast-ai`)
  - [Roast GitHub](https://github.com/Shopify/roast)

- `better-auth`
  - [Better Auth Full Docs](https://www.better-auth.com/llms.txt)
  - [Better Auth Documentation](https://better-auth.com/docs)

- Playwright
  - [Playwright Official Documentation](https://playwright.dev/docs/intro)
  - [Context7 Playwright Documentation](https://context7.com/microsoft/playwright/llms.txt)
  - [Writing Tests Guide](https://playwright.dev/docs/intro/writing-tests)
  - [Test Configuration](https://playwright.dev/docs/intro/test-configuration)
  - [Best Practices](https://playwright.dev/docs/intro/best-practices)
  - [API Reference](https://playwright.dev/docs/intro/api/class-test)
  - [Fixtures and Test Organization](https://playwright.dev/docs/intro/test-fixtures)
  - [Assertions](https://playwright.dev/docs/intro/test-assertions)
  - [Browser Emulation](https://playwright.dev/docs/intro/emulation)
  - [Accessibility Testing](https://playwright.dev/docs/intro/accessibility-testing)
  - [CI/CD Integration](https://playwright.dev/docs/intro/ci)
  - [Page Object Model](https://playwright.dev/docs/pom)
  - [Test Parallel Execution](https://playwright.dev/docs/intro/test-parallel)
  - [Test Retries](https://playwright.dev/docs/intro/test-retries)
  - [Playwright Library API](https://playwright.dev/docs/library) - Core library documentation
  - [Generative Automation Testing with Playwright MCP Server](https://adequatica.medium.com/generative-automation-testing-with-playwright-mcp-server-45e9b8f6f92a)
  - **Bun Compatibility**: Playwright 1.41.0+ works with Bun with limitations:
    - Configuration files (playwright.config.ts) may cause hanging or segfaults
    - Component testing and watch mode are unsupported
    - Basic test execution works, advanced features may not
    - Use simple configuration or avoid config files when possible
  - **MCP Integration**:
    - [Playwright MCP Testing Flow](../docs/playwright-mcp-testing-flow.md) - Our internal MCP-assisted testing workflow
    - [Playwright Test Engineer Subagent](../.claude/agents/playwright-test-engineer.md) - Specialized testing agent

- AI Dr. Created Templates
  - **Agents**: `.claude/agents/` - [Sub-agents Documentation](https://docs.anthropic.com/en/docs/claude-code/sub-agents)
    - `ai-dr-workflow-orchestrator.md` - Workflow execution and task management
    - `ai-dr-challenger.md` - Critical evaluation and validation
  - **Output Styles**: `.claude/output-styles/` - [Output Styles Documentation](https://docs.anthropic.com/en/docs/claude-code/output-styles)
    - `ai-dr-workflow-style.md` - Structured progress tracking and context sharing
  - **Hooks**: `.claude/hooks/` - [Hooks Guide](https://docs.anthropic.com/en/docs/claude-code/hooks-guide) and [Hooks reference](https://docs.anthropic.com/en/docs/claude-code/hooks)
    - `prompt-storage-hook.sh` - Automatic prompt storage with context

- AI SDK
  - [AI SDK v5 Documentation](https://ai-sdk.dev/llms.txt)
  - [Claude Code Provider](https://ai-sdk.dev/providers/community-providers/claude-code)
  - [Claude Code Templates Repository](https://github.com/ben-vargas/ai-sdk-provider-claude-code)
  - [Gemini Provider](https://ai-sdk.dev/cookbook/guides/gemini-2-5#gemini-25)
  - [Google Generative AI Models](https://ai.google.dev/gemini-api/docs/models/) - Full list of available Gemini models
  - [Anthropic Models Documentation](https://docs.anthropic.com/en/docs/about-claude/models) - Full list of available Claude models
  - [Providers Documentation](https://ai-sdk.dev/docs/providers)
  - [Streaming Documentation](https://ai-sdk.dev/docs/concepts/streaming)
  - [Next.js Route Streaming with AI SDK](https://nextjs.org/docs/app/api-reference/file-conventions/route#streaming)
  - [Claude Code Provider GitHub](https://github.com/ben-vargas/ai-sdk-provider-claude-code)
  - [Claude Code Streaming Example](https://github.com/ben-vargas/ai-sdk-provider-claude-code/blob/main/examples/streaming.ts)
  - [Smooth Text Streaming UI](../docs/smooth-text-streaming-nextjs.md)

- Milkdown (Markdown Editor)
  - [Milkdown Documentation](https://milkdown.dev/llms.txt)
  - [Milkdown React Integration](https://milkdown.dev/docs/integrations/react)
  - [Milkdown Plugins](https://milkdown.dev/docs/plugins)

- AI SDK Elements (Chat UI Components)
  - [AI SDK Elements Overview](https://ai-sdk.dev/elements/overview)
  - [AI SDK Elements Components](https://ai-sdk.dev/elements/components)
  - [Installation via shadcn](https://registry.ai-sdk.dev/all.json)
  - Components: conversation, message, prompt-input, response, tool, reasoning, etc.

- Bunchee (Zero-config bundler)
  - [Bunchee Documentation](https://github.com/huozhi/bunchee) - Zero-config bundler for JS/TS packages
  - Features: ESM/CJS dual output, TypeScript support, CLI bundling, powered by Rollup & SWC
  - Used in: `packages/prompt-enhancer` for seamless package bundling and distribution

- AI Dr. Internal Documentation
  - [Authentication Patterns](../docs/auth-patterns.md) - New simplified auth architecture
  - [Security Implementation](../docs/SECURITY_IMPLEMENTATION.md)
  - [Tools Documentation](../docs/TOOLS_DOCUMENTATION.md)
  - [API Contracts](../architecture/API_CONTRACTS.md)
  - [System Architecture](../architecture/SYSTEM_ARCHITECTURE.md)
  - [Critical Analysis](../architecture/CRITICAL_ANALYSIS.md)
