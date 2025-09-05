# Agent Files Management

Only see the following file if you need to understand how agent files are managed, updated, or generated from the .ruler directory sources or related to mcp server configurations.

## Source of Truth Hierarchy

### Primary Source: .ruler Directory

The `.ruler/` directory contains the **source of truth** for all agent configuration and rules:

- All rule files in `.ruler/` are the canonical source
- Changes MUST be made in `.ruler/` files first
- Agent files are generated from these sources

### Generated Agent Files

The following files are **generated** from `.ruler/` sources and should NOT be edited directly:

- `CLAUDE.md` - Generated for Claude agents
- `AGENTS.md` - Generated for generic agents
- `GEMINI.md` - Generated for Gemini agents
- `opencode.json` - Generated for OpenCode
- `.cursor/rules` - Generated for Cursor

### Update Workflow

#### When Making Rule Changes:

1. **ALWAYS update the `.ruler/` source files ONLY**
2. **Run `bun run ruler:apply`** to regenerate agent files
3. **Never edit agent files directly** - changes will be lost on regeneration

#### Rule Categories and Their Sources:

| Rule Category         | Source File in .ruler/        | Affects               |
| --------------------- | ----------------------------- | --------------------- |
| Behavior              | `behavior.md`                 | All agents            |
| Coding Style          | `coding-style.md`             | All agents            |
| Development           | `development.md`              | All agents            |
| Documentation         | `documentation-management.md` | All agents            |
| Project Architecture  | `project-architecture.md`     | All agents            |
| Repository Navigation | `repository-navigation.md`    | All agents            |
| Security              | `security.md`                 | All agents            |
| TypeScript            | `typescript.md`               | All agents            |
| MCP Servers           | `mcp.json`                    | MCP configuration     |
| Master Agent Rules    | `master-agent-rule.md`        | Master agent behavior |
| Agent File Management | `agent-files-management.md`   | This file             |

### Important Notes

#### MCP Server References

When updating MCP server locations or configurations:

1. Update paths in `repository-navigation.md`
2. Update `mcp.json` with new server locations
3. Run `bun run ruler:apply` to propagate changes

#### Validation

After regenerating agent files, verify:

- All agent files have been updated
- No manual edits were lost
- MCP configurations are correct

### Enforcement

**CRITICAL**: Any agent that modifies rules must:

1. Only edit files in `.ruler/` directory
2. Never directly edit CLAUDE.md, AGENTS.md, GEMINI.md, etc.
3. Run `ruler:apply` after making changes
4. Document why changes were made

### Example Workflow

```bash
# 1. Edit source rules
vim .ruler/repository-navigation.md

# 2. Apply changes to generate agent files
bun run ruler:apply

# 3. Verify changes
git diff CLAUDE.md AGENTS.md GEMINI.md
```

## Remember

> **`.ruler/` is the source of truth. Agent files are generated artifacts.**

Never edit generated files directly. Always work with the source files in `.ruler/`.
