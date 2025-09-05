# GitHub Actions Setup for AI Dr.

This repository includes comprehensive GitHub Actions workflows for CI/CD, security auditing, documentation management, and Claude Code integration.

## 🚀 Workflows Overview

### Core Workflows

1. **CI (`ci.yml`)** - Main continuous integration pipeline
   - TypeScript type checking
   - Linting with ESLint
   - Unit tests
   - Build verification
   - E2E tests with Playwright
   - Ignores changes in `.ai-dr/`, `musings/`, `logs/` directories

2. **Path-Based CI (`path-based-ci.yml`)** - Optimized CI for specific components
   - Runs only relevant tests based on changed files
   - Separate jobs for web app, core app, packages, database
   - Significantly faster execution for focused changes

3. **Claude Code Actions (`claude-actions.yml`)** - AI-powered automation
   - Responds to `@claude` mentions in issues and PRs
   - Automatically creates PRs and implements features
   - Follows project coding standards in `CLAUDE.md`

4. **Claude Code (`claude.yml`)** - Interactive AI assistance
   - Responds to `@claude` in comments, reviews, and issues
   - Supports all GitHub events for comprehensive AI assistance

5. **Claude Code Review (`claude-code-review.yml`)** - Automated PR reviews
   - Automatically reviews all opened and updated pull requests
   - Provides feedback on code quality, security, and best practices

6. **Claude Code Dispatch (`claude-dispatch.yml`)** - Remote AI agent
   - Handles repository dispatch events for external triggers
   - Enables programmatic AI assistance via API calls

### Specialized Workflows

7. **Security & Audit (`security.yml`)** - Security monitoring
   - Dependency vulnerability scanning
   - Secret detection with TruffleHog
   - CodeQL static analysis
   - Weekly automated security audits

8. **Documentation (`docs.yml`)** - Documentation management
   - Markdown linting and validation
   - Link checking
   - Automated documentation updates
   - Documentation drift detection

9. **MCP Servers (`mcp-servers.yml`)** - MCP server testing
   - Validates all MCP server configurations
   - Integration testing with database
   - Script validation
   - Security checks for hardcoded secrets

10. **Release (`release.yml`)** - Automated releases
    - Version bumping (major/minor/patch/prerelease)
    - Changelog generation
    - Production deployment
    - GitHub release creation

## 🔧 Setup Instructions

### 1. Required Secrets

Configure these secrets in your GitHub repository settings:

#### Essential Secrets

```bash
# Claude Code Integration (Required for @claude functionality)
CLAUDE_CODE_OAUTH_TOKEN=your_claude_oauth_token_here
```

**Getting your Claude OAuth Token:**

1. Visit [Claude Code](https://claude.ai/code) and sign in
2. Go to your account settings
3. Generate an OAuth token for GitHub Actions
4. Add it as `CLAUDE_CODE_OAUTH_TOKEN` in your repository secrets

#### Optional Secrets (for enhanced functionality)

```bash
# For production deployment
DEPLOY_TOKEN=ghp_...
PRODUCTION_DATABASE_URL=postgresql://...

# For notification webhooks
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### 2. Quick Setup (Current Implementation)

The workflows are configured with the simple OAuth token approach, which provides:

- ✅ Responds to `@claude` mentions in issues and PRs
- ✅ Creates issue and PR comments
- ✅ Performs automated code reviews
- ✅ Handles repository dispatch events
- ✅ No complex setup required

### 3. Future Enhancement: GitHub App Integration

For advanced functionality, you can later upgrade to a GitHub App setup which provides additional benefits:

**GitHub App Benefits:**

- ✅ Higher rate limits
- ✅ More granular permissions
- ✅ Can create PRs from forks
- ✅ Can trigger other workflows
- ✅ Better security isolation
- ✅ Organization-wide installation

**How to Add GitHub App Later:**

1. Go to https://github.com/settings/apps/new
2. Configure basic app information
3. Set repository permissions:
   - Contents: Read & Write
   - Issues: Read & Write
   - Pull requests: Read & Write
   - Actions: Read (for CI status)
4. Generate and save private key
5. Install app to your repositories
6. Update workflow files to use GitHub App tokens instead of OAuth
7. Add these secrets:
   - `CLAUDE_APP_ID`: The App ID
   - `CLAUDE_APP_PRIVATE_KEY`: Content of the `.pem` file

The current OAuth setup works great for most use cases - upgrade only if you need the advanced features!

### 4. Environment Variables

The workflows respect the project's environment variable patterns:

```typescript
// Always use bracket notation (enforced by workflows)
process.env['NODE_ENV'] ✅
process.env.NODE_ENV   ❌

// Client vs Server variables
process.env['DATABASE_URL']           // Server-only
process.env['NEXT_PUBLIC_API_URL']    // Client-exposed
```

## 📋 Workflow Features

### CI Pipeline Features

- **Smart Path Detection**: Only runs relevant jobs based on changed files
- **Caching**: Aggressive caching for Bun dependencies and Prisma
- **Parallel Execution**: Jobs run in parallel where possible
- **Matrix Testing**: Tests packages independently
- **Artifact Storage**: Saves test reports and build artifacts

### Claude Code Features

- **Context Awareness**: Includes repository context in prompts
- **Coding Standards**: Follows guidelines from `CLAUDE.md`
- **Error Handling**: Provides helpful error messages on failures
- **Permission Management**: Works with both GitHub Apps and tokens
- **Timeout Protection**: Prevents runaway executions

### Security Features

- **Dependency Scanning**: Weekly vulnerability checks
- **Secret Detection**: Prevents accidental secret commits
- **Static Analysis**: CodeQL security analysis
- **Environment Validation**: Ensures proper environment variable usage

## 🎯 Usage Examples

### Using Claude Code Actions

Simply mention `@claude` in any issue or PR comment:

```markdown
@claude implement user authentication for this API endpoint

@claude fix the TypeScript errors in the UserProfile component

@claude add comprehensive tests for the payment processing workflow
```

### Triggering Releases

Use the GitHub Actions interface to trigger a release:

1. Go to Actions → Release
2. Click "Run workflow"
3. Choose release type (major/minor/patch/prerelease)
4. Optionally skip tests for hotfixes

### Manual Workflow Triggers

Most workflows can be triggered manually via the Actions tab:

- Security audits
- Documentation updates
- MCP server testing
- Full CI pipeline

## 🔍 Monitoring and Debugging

### Workflow Status

All workflows provide detailed step summaries in the GitHub Actions interface:

- ✅ Successful steps with timing
- ❌ Failed steps with error details
- ⚠️ Warnings and non-blocking issues
- 📊 Test coverage and metrics

### Common Issues

1. **Claude not responding**: Check `CLAUDE_CODE_OAUTH_TOKEN` secret
2. **Permission errors**: Verify repository access permissions
3. **Build failures**: Check for environment variable issues
4. **Test timeouts**: Review resource-intensive tests

### Logs and Artifacts

- Workflow logs: Available for 90 days
- Test reports: Stored as artifacts for 7 days
- Build artifacts: Available for download
- Security reports: Automatically created as issues

## 🚧 Troubleshooting

### Permission Issues

```bash
# Check repository access permissions
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/OWNER/REPO

# Verify Claude Code OAuth token is valid
# (Check in repository settings → Secrets → Actions)
# Ensure CLAUDE_CODE_OAUTH_TOKEN is properly set
```

### Workflow Debugging

Add debug output to workflows:

```yaml
- name: Debug Environment
  run: |
    echo "Event: ${{ github.event_name }}"
    echo "Ref: ${{ github.ref }}"
    echo "Actor: ${{ github.actor }}"
    echo "Has Claude token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN != '' }}"
    env | grep -E "GITHUB_" | sort
```

## 📚 Additional Resources

- [Anthropic Claude Code Actions](https://docs.anthropic.com/en/docs/claude-code/github-actions)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Turborepo with GitHub Actions](https://turborepo.com/docs/ci/github-actions)
- [Bun in CI/CD](https://bun.sh/guides/ecosystem/github-actions)

---

For questions or issues with the GitHub Actions setup, please:

1. Check the [workflow logs](../../actions) for specific errors
2. Review this documentation for configuration issues
3. Create an issue with the `ci/cd` label for help
