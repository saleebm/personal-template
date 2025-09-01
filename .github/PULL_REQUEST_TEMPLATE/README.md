# Pull Request Templates

This directory contains specialized PR templates for different types of changes. GitHub will automatically use the default template, but you can select a specific one when needed.

## Available Templates

### Default Template
**File**: `../.github/PULL_REQUEST_TEMPLATE.md`
- Used automatically for all PRs unless another template is specified
- Comprehensive template suitable for most changes

### Bug Fix Template
**File**: `bug_fix.md`
- Use for bug fixes and patches
- Focuses on root cause analysis and verification

### Feature Template
**File**: `feature.md`
- Use for new features and enhancements
- Includes sections for user stories and acceptance criteria

### Hotfix Template
**File**: `hotfix.md`
- Use for urgent production fixes
- Includes severity assessment and deployment considerations

## How to Use a Specific Template

### Method 1: URL Parameter
When creating a PR, append the template parameter to the URL:
```
https://github.com/[owner]/repo-name/compare/main...your-branch?template=bug_fix.md
https://github.com/[owner]/repo-name/compare/main...your-branch?template=feature.md
https://github.com/[owner]/repo-name/compare/main...your-branch?template=hotfix.md
```

### Method 2: Quick Links
Add these as bookmarks or share with your team:

- [Create Bug Fix PR](../../../compare/main...HEAD?template=bug_fix.md)
- [Create Feature PR](../../../compare/main...HEAD?template=feature.md)  
- [Create Hotfix PR](../../../compare/main...HEAD?template=hotfix.md)

### Method 3: Manual Selection
1. Create a new PR normally
2. Clear the default template
3. Click "Preview" tab
4. Type: `?template=bug_fix.md` (or other template name) in the URL
5. Press Enter to reload with the selected template

## Template Guidelines

- Choose the template that best matches your change type
- Fill out all applicable sections
- Delete sections that aren't relevant
- Be thorough but concise
- Link related issues and PRs

## For Reviewers

See the [Code Review Checklist](../CODE_REVIEW_CHECKLIST.md) for guidelines on reviewing PRs.

## Contributing

To add or modify templates:
1. Create/edit files in this directory
2. Follow the existing format and structure
3. Update this README with the new template information
4. Test that the template loads correctly
