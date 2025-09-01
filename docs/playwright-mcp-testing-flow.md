# Playwright MCP Server Assisted Testing Flow

**Version**: 1.0.0  
**Date**: 2025-01-28  
**Purpose**: Document the workflow for using Playwright MCP server to generate and execute comprehensive tests

## Overview

This document outlines our approach to using the Playwright MCP (Model Context Protocol) server for generative automation testing. The MCP server enables AI-assisted test generation, execution, and validation for our web applications.

## Prerequisites

### Required Tools
- **Playwright**: Latest version (1.41.0+ for Bun compatibility)
- **Playwright MCP Server**: Configured in Claude Code settings
- **Bun**: Our package manager and runtime
- **Claude Code**: With Playwright MCP server enabled

### Configuration Verification
Ensure the following is configured in `.claude/settings.json`:
```json
{
  "enabledMcpjsonServers": [
    "playwright"
  ]
}
```

## MCP-Assisted Testing Workflow

### Phase 1: Interactive Exploration

#### 1.1 Application Discovery
Using the Playwright MCP server tools:
- **Start Development Server**: `bun dev`
- **Launch Interactive Session**: Use MCP tools to open browser and navigate application
- **Explore User Flows**: Manually navigate through critical user journeys
- **Document Interactions**: Record key elements, actions, and expected behaviors

#### 1.2 Element Identification
- Identify stable selectors for interactive elements
- Note dynamic content and loading states
- Document form fields, buttons, and navigation elements
- Capture error states and edge cases

### Phase 2: Test Generation

#### 2.1 Scenario Definition
Convert exploration findings into test scenarios:
```typescript
// Example scenario structure
interface TestScenario {
  name: string;
  description: string;
  preconditions: string[];
  steps: TestStep[];
  expectedResults: string[];
  accessibility: AccessibilityCheck[];
}
```

#### 2.2 Automated Test Creation
Using MCP tools to generate tests:
1. **Generate Base Test**: Create test file structure with imports and setup
2. **Add User Actions**: Convert interaction steps into Playwright commands
3. **Include Assertions**: Add appropriate expectations based on exploration
4. **Handle Async Operations**: Add proper waits and loading state handling

#### 2.3 Page Object Generation
Create reusable page objects:
```typescript
// Generated page object example
export class HomePage {
  constructor(private page: Page) {}
  
  async goto() {
    await this.page.goto('/');
  }
  
  async expectVisible() {
    await expect(this.page.locator('[data-testid="main-content"]')).toBeVisible();
  }
  
  async clickNavigation(section: string) {
    await this.page.click(`[data-testid="nav-${section}"]`);
  }
}
```

### Phase 3: Test Execution & Validation

#### 3.1 Initial Test Execution
```bash
# Run generated tests
bun test:e2e

# Run specific test file
bun playwright test tests/generated/user-flow.spec.ts
```

#### 3.2 Result Analysis
Using MCP tools to analyze test results:
- **Success Validation**: Verify tests pass and cover expected scenarios
- **Failure Investigation**: Use MCP to debug failing tests interactively
- **Coverage Assessment**: Identify gaps in test coverage
- **Performance Review**: Check test execution times and stability

#### 3.3 Test Refinement
Iterate on tests based on execution results:
- **Fix Flaky Tests**: Add proper waits and stable selectors
- **Enhance Assertions**: Add more specific and meaningful expectations
- **Improve Error Handling**: Handle edge cases and error states
- **Optimize Performance**: Reduce test execution time where possible

### Phase 4: Comprehensive Testing

#### 4.1 Cross-Browser Validation
```typescript
// playwright.config.ts projects configuration
export default defineConfig({
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

#### 4.2 Accessibility Testing Integration
```typescript
import { injectAxe, checkA11y } from '@axe-core/playwright';

test('accessibility validation', async ({ page }) => {
  await page.goto('/');
  await injectAxe(page);
  await checkA11y(page);
});
```

#### 4.3 Responsive Design Testing
```typescript
test.describe('Mobile responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });
  
  test('should work on mobile devices', async ({ page }) => {
    // Mobile-specific test logic
  });
});
```

## Best Practices for MCP-Assisted Testing

### Test Generation Guidelines
1. **Start Simple**: Begin with basic navigation and interaction tests
2. **Build Incrementally**: Add complexity gradually as base tests pass
3. **Use Stable Selectors**: Prefer `data-testid` attributes over CSS selectors
4. **Handle Async Operations**: Always use appropriate waiting strategies
5. **Test User Perspective**: Focus on what users actually do, not internal implementation

### MCP Tool Usage Patterns
1. **Interactive Debugging**: Use MCP to step through failing tests
2. **Element Discovery**: Leverage MCP to find robust selectors
3. **Flow Validation**: Use MCP to verify complete user journeys
4. **Edge Case Discovery**: Explore error conditions and boundary cases

### Code Organization
```
tests/
├── e2e/
│   ├── user-flows/
│   │   ├── authentication.spec.ts
│   │   ├── navigation.spec.ts
│   │   └── form-submission.spec.ts
│   └── accessibility/
│       ├── home-page-a11y.spec.ts
│       └── form-a11y.spec.ts
├── page-objects/
│   ├── home-page.ts
│   ├── auth-page.ts
│   └── base-page.ts
└── fixtures/
    ├── test-data.ts
    └── custom-fixtures.ts
```

## Integration with Development Workflow

### Pre-Development Testing
- Generate tests for new features before implementation
- Use tests as specification validation
- Ensure accessibility requirements are testable

### Development Phase Testing
- Run tests during feature development
- Use MCP to validate implementation against tests
- Iterate on both code and tests together

### Post-Development Validation
- Execute comprehensive test suite
- Validate across all browsers and devices
- Ensure no regressions in existing functionality

## Troubleshooting Common Issues

### Bun Compatibility Issues
- **Problem**: Configuration files causing hanging or segfaults
- **Solution**: Use simple configuration, avoid complex watch modes

### Test Flakiness
- **Problem**: Tests pass inconsistently
- **Solution**: Use proper waiting strategies, stable selectors, and retry mechanisms

### MCP Server Connection Issues
- **Problem**: Cannot connect to Playwright MCP server
- **Solution**: Verify server configuration in Claude Code settings

## Success Metrics

### Test Coverage Metrics
- **Critical Path Coverage**: 100% of critical user journeys tested
- **Feature Coverage**: All interactive features have corresponding tests
- **Accessibility Coverage**: WCAG 2.1 compliance validated for all pages

### Quality Metrics
- **Test Reliability**: >99% pass rate in CI environment
- **Execution Speed**: Full test suite completes in <10 minutes
- **Maintenance Overhead**: New tests can be added with minimal setup

### User Experience Metrics
- **Bug Prevention**: Tests catch issues before reaching production
- **Regression Prevention**: Changes don't break existing functionality
- **Accessibility Compliance**: All pages meet accessibility standards

## References

- [Playwright Official Documentation](https://playwright.dev/docs/intro)
- [Generative Automation Testing with Playwright MCP Server](https://adequatica.medium.com/generative-automation-testing-with-playwright-mcp-server-45e9b8f6f92a)
- [Claude Code Sub-agents Documentation](https://docs.anthropic.com/en/docs/claude-code/sub-agents)
- [Playwright Test Best Practices](https://playwright.dev/docs/intro/best-practices)

---

**Next Steps**: Use the `playwright-test-engineer` subagent to implement this workflow for your specific testing needs.
