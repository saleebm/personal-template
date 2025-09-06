# Claude Code Review Setup Instructions

## Prerequisites

To enable Claude AI code reviews on your pull requests, you need to configure the Anthropic API key as a GitHub secret.

## Setup Steps

### 1. Get Your Anthropic API Key

1. Sign up or log in to [Anthropic Console](https://console.anthropic.com/)
2. Navigate to API Keys section
3. Create a new API key or use an existing one
4. Copy the API key (starts with `sk-ant-api...`)

### 2. Add the API Key to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secret:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: Your Anthropic API key
5. Click **Add secret**

### 3. Verify Permissions

The workflow requires these permissions (already configured in the workflow):
- `contents: read` - To read the repository code
- `pull-requests: write` - To post review comments
- `id-token: write` - For authentication

## How It Works

When a pull request is opened or updated, the workflow will:

1. **Run Quality Checks** - TypeScript, linting, tests, and build
2. **Claude Review** - Claude AI performs comprehensive code review
3. **Progress Tracking** - Visual progress indicators during review
4. **Inline Comments** - Specific feedback on code lines
5. **Summary Comments** - General observations and recommendations

## Review Focus Areas

Claude will review your code for:

- **Monorepo Structure** - Proper package organization
- **TypeScript Quality** - No `any` types, strict mode compliance
- **Bun Patterns** - Correct Bun command usage
- **Security** - No hardcoded secrets, proper validation
- **Performance** - Efficient queries and imports
- **Testing** - Adequate test coverage
- **Documentation** - Updated READMEs and inline docs
- **Database** - Proper Prisma schema and migrations

## Customization

To customize the review behavior, edit `.github/workflows/claude-code-review.yml`:

- Modify the `prompt` section to adjust review focus
- Update `paths-ignore` to exclude certain files
- Adjust `claude_args` to change available tools

## Troubleshooting

### API Key Issues
- Ensure the secret name is exactly `ANTHROPIC_API_KEY`
- Verify the API key is valid and has sufficient credits

### Review Not Triggering
- Check that the PR is not in draft mode
- Ensure the changed files aren't in `paths-ignore`

### Quality Checks Failing
- The review will still run even if checks fail
- Fix issues locally with:
  ```bash
  bun typecheck
  bun lint
  bun test
  bun build
  ```

## Cost Considerations

- Each PR review uses Claude API tokens
- Review length depends on PR size
- Consider setting up spending limits in Anthropic Console

## Support

For issues with:
- **Workflow**: Check GitHub Actions logs
- **Claude Action**: See [anthropics/claude-code-action](https://github.com/anthropics/claude-code-action)
- **API**: Contact Anthropic support