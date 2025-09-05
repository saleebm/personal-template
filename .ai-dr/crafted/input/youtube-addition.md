# Building GitHub Actions Workflows with Claude Code

> A Complete Guide Based on Simon Willison's Tutorial

## Overview

This document provides a comprehensive guide to creating automated GitHub Actions workflows using Claude Code, based on the YouTube tutorial by Simon Willison ([Video Link](https://www.youtube.com/watch?v=VC6dmPcin2E)).

**Tutorial Duration**: 7 minutes 2 seconds  
**Published**: July 1, 2025  
**Channel**: Simon Willison

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Workflow Purpose](#workflow-purpose)
3. [Step-by-Step Implementation](#step-by-step-implementation)
4. [Generated Files](#generated-files)
5. [Troubleshooting](#troubleshooting)
6. [Best Practices](#best-practices)
7. [Timeline Reference](#timeline-reference)

## Prerequisites

- **Claude Code CLI** installed and configured
- **Git repository** with push access
- **Python** installed locally for testing
- **GitHub repository** with Actions enabled

## Workflow Purpose

Create an automated system that:

- Triggers on every commit to the `main` branch
- Scans for all Markdown files in the repository
- Updates README.md with a formatted list of files
- Commits changes back to the repository automatically

## Step-by-Step Implementation

### Step 1: Initialize Claude Code [00:11]

Launch Claude Code with permission bypass flag for streamlined execution:

```bash
claude --dangerously-skip-permissions
```

**Note**: The `--dangerously-skip-permissions` flag prevents Claude from requesting confirmation for each file operation.

### Step 2: Provide Natural Language Instructions [00:20]

Give Claude a comprehensive prompt:

```text
Add github actions workflow to this repo, it should run on every commit to main
and update the README file to include a Markdown list of the other .md files here,
showing the date in a nice way. Use Python.
```

### Step 3: Review Generated Python Script [01:35]

Claude creates `update_readme.py` with the following functionality:

**Script Features**:

- Finds all `.md` files (excluding README.md)
- Parses dates from filename patterns (e.g., `2025-06-june.md`)
- Formats as Markdown links: `[June 2025](2025-06-june.md)`
- Updates or creates an `## Archive` section in README.md

**Example Output**:

```markdown
## Archive

- [June 2025](2025-06-june.md)
- [May 2025](2025-05-may.md)
- [April 2025](2025-04-april.md)
```

### Step 4: Local Testing [02:30]

Test the script before deployment:

```bash
# Run the script
python update_readme.py

# Verify changes
cat README.md
```

### Step 5: Generate GitHub Actions Workflow [03:46]

If Claude pauses, prompt continuation:

```text
The python script is good, now do the workflow
```

Claude creates `.github/workflows/update-readme.yml`

### Step 6: Initial Deployment [04:08]

Commit and push the changes:

```bash
git add .
git commit -m "Add GitHub Actions workflow to update README"
git push
```

**Handling Push Conflicts** [04:31]:
If push is rejected due to remote changes:

```bash
git pull --rebase
git push
```

### Step 7: Fix Permission Issues [05:21 - 06:08]

When the workflow fails with "Write access to repository not granted":

1. Copy the error message from GitHub Actions logs
2. Paste error to Claude Code
3. Claude adds permissions block to workflow:

```yaml
permissions:
  contents: write
```

### Step 8: Deploy the Fix [06:22]

```bash
git add .github/workflows/update-readme.yml
git commit -m "Fix workflow permissions for repository write access"
git push
```

### Step 9: Verify Success [06:42]

Check GitHub repository for:

- ✅ Successful workflow run
- ✅ New commit by `actions-user`
- ✅ Updated README.md with archive list

## Generated Files

### 1. Python Script: `update_readme.py`

**Key Components**:

```python
# File discovery pattern
files = glob.glob("*.md")
files = [f for f in files if f != "README.md"]

# Date parsing regex
pattern = r"(\d{4})-(\d{2})-(\w+)\.md"

# Markdown generation
formatted_links = [f"- [{month.title()} {year}]({filename})"]
```

### 2. Workflow File: `.github/workflows/update-readme.yml`

**Complete Structure**:

```yaml
name: Update README

on:
  push:
    branches: [main]

jobs:
  update-readme:
    runs-on: ubuntu-latest

    permissions:
      contents: write

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v4
        with:
          python-version: "3.x"

      - name: Update README
        run: python update_readme.py

      - name: Commit changes
        run: |
          git config --global user.name 'github-actions[bot]'
          git config --global user.email 'github-actions[bot]@users.noreply.github.com'
          git add README.md
          git diff --staged --quiet || git commit -m "Update README archive list"
          git push
```

## Troubleshooting

### Common Issues and Solutions

| Issue                        | Symptom                                  | Solution                                                            |
| ---------------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| **Permission Denied**        | "Write access to repository not granted" | Add `permissions: contents: write` to workflow                      |
| **Push Rejected**            | "Updates were rejected"                  | Run `git pull --rebase` before pushing                              |
| **Workflow Not Triggered**   | No action runs on push                   | Verify branch name matches workflow trigger                         |
| **Script Not Finding Files** | Empty archive list                       | Check file naming pattern matches regex                             |
| **Commit Fails**             | "Nothing to commit"                      | Use conditional commit: `git diff --staged --quiet \|\| git commit` |

### Debugging Steps

1. **Check Workflow Logs**:
   - Navigate to Actions tab in GitHub
   - Click on failed workflow run
   - Expand failed step for error details

2. **Test Locally First**:

   ```bash
   python update_readme.py
   echo $?  # Check exit code
   ```

3. **Validate YAML Syntax**:
   ```bash
   # Use yamllint or online validator
   yamllint .github/workflows/update-readme.yml
   ```

## Best Practices

### 1. Development Workflow

- ✅ Test scripts locally before deployment
- ✅ Use descriptive commit messages
- ✅ Review generated code before pushing
- ✅ Keep backups of working configurations

### 2. Claude Code Usage

- ✅ Provide clear, detailed prompts
- ✅ Include error messages for debugging
- ✅ Use `--dangerously-skip-permissions` for faster iteration
- ✅ Interrupt and redirect if Claude stalls

### 3. GitHub Actions

- ✅ Always set appropriate permissions
- ✅ Use latest action versions (e.g., `@v4`)
- ✅ Include conditional logic to prevent empty commits
- ✅ Configure git user for automated commits

### 4. Security Considerations

- ⚠️ Review permissions carefully
- ⚠️ Use `GITHUB_TOKEN` default permissions when possible
- ⚠️ Avoid hardcoding sensitive information
- ⚠️ Limit workflow triggers to protected branches

## Timeline Reference

Quick reference for video navigation:

| Time      | Event                               |
| --------- | ----------------------------------- |
| **00:11** | Launch Claude Code CLI              |
| **00:20** | Provide natural language prompt     |
| **00:48** | Claude creates todo list            |
| **01:15** | Create workflow directory structure |
| **01:35** | Generate Python script              |
| **02:30** | Manual script verification          |
| **03:30** | User prompts for workflow creation  |
| **03:46** | Generate GitHub Actions YAML        |
| **04:08** | Initial commit and push             |
| **04:31** | Resolve push conflicts              |
| **05:04** | Test live workflow                  |
| **05:21** | Workflow fails (permissions)        |
| **05:37** | Debug with error message            |
| **06:08** | Add permissions fix                 |
| **06:22** | Push the fix                        |
| **06:42** | Verify successful execution         |

## Additional Resources

- **Original Video**: [YouTube - Using Claude Code to build a GitHub Actions workflow](https://www.youtube.com/watch?v=VC6dmPcin2E)
- **Code Gist**: [Simon's GitHub Gist](https://gist.github.com/simonw/f6e07ed253e183b33144f077d0d28aaa)
- **GitHub Actions Docs**: [GitHub Actions Documentation](https://docs.github.com/en/actions)
- **Claude Code**: [Anthropic's Claude Code](https://claude.ai/code)

## Summary

This workflow demonstrates how Claude Code can rapidly prototype and deploy automation solutions, transforming natural language descriptions into working GitHub Actions in under 7 minutes. The key to success is providing clear instructions, testing locally, and being ready to debug permission issues that commonly occur with automated repository modifications.

---

_Document generated from video analysis on 2025-09-05_  
_Video published by Simon Willison on 2025-07-01_
