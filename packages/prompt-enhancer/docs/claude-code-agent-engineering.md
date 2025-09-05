# Claude Code Sub-Agent Engineering Guide

Claude Code sub-agents are specialized AI assistants with independent context windows, custom system prompts, and granular tool permissions. Based on comprehensive research of Anthropic's documentation and community best practices, this guide provides the exact format and approach for creating a principal engineer sub-agent optimized for code understanding and workflow integration.

## YAML structure fundamentals

Every Claude Code sub-agent follows a standardized Markdown file format with YAML frontmatter. The structure consists of **two required fields** (name and description) and optional fields for tools and model selection. Sub-agents are stored as `.md` files in either `.claude/agents/` for project-specific agents or `~/.claude/agents/` for user-level agents, with project agents taking precedence when names conflict.

The basic structure requires precise formatting:
```yaml
---
name: principal-engineer
description: High-level architecture decisions and technical leadership
tools: Read, Grep, Glob, Bash, WebSearch  # Optional - inherits all if omitted
model: opus  # Optional - defaults to sonnet
---

System prompt content follows here...
```

The **name field** must use lowercase letters and hyphens only, serving as the unique identifier. The **description field** determines when Claude automatically delegates to this agent and should include trigger phrases like "MUST BE USED" or "use PROACTIVELY" for increased activation likelihood. When the tools field is omitted, the sub-agent inherits all available tools from the main thread, including any configured MCP server tools.

## Model selection strategy

Claude Code supports three models with distinct capability tiers. **Haiku** handles simple, repetitive tasks like documentation updates or basic validation. **Sonnet** serves as the default for most development tasks requiring moderate reasoning. **Opus** excels at complex analysis, architectural reviews, security auditing, and strategic technical decisions—making it ideal for a principal engineer agent that needs sophisticated reasoning capabilities.

## Principal engineer agent implementation

A principal engineer sub-agent requires comprehensive system architecture expertise, technical decision-making capabilities, and strategic technology guidance. The configuration should emphasize high-level thinking, cross-system implications, and long-term sustainability over immediate implementation details.

Here's the optimal configuration for a principal engineer sub-agent with AI Dr. workflow and prompt enhancement SDK integration:

```markdown
---
name: principal-engineer
description: Use PROACTIVELY for architecture reviews, system design, technical risk assessment, AI Dr. workflow integration, and prompt enhancement optimization. MUST BE USED for scalability planning, design pattern validation, and strategic technology decisions.
model: opus
tools: Read, Grep, Glob, Bash, WebSearch, Edit
---

You are a Principal Engineer with deep expertise in system architecture, technical leadership, and AI-driven development workflows. You specialize in maximizing code understanding, workflow optimization, and strategic technical decisions.

## Core Expertise

**System Architecture**: Design patterns, microservices, distributed systems, scalability patterns, performance optimization, and cross-cutting concerns identification.

**Technical Leadership**: Architecture reviews, technology selection, technical debt assessment, risk mitigation strategies, and team capability development.

**AI Dr. Workflow Integration**: Parse diagnostic results, translate findings into actionable improvements, coordinate with other agents based on diagnostic outcomes, and maintain workflow execution status.

**Prompt Enhancement SDK**: Analyze and optimize prompts for maximum effectiveness, implement dynamic prompt adaptation, measure prompt performance metrics, and apply SDK-recommended enhancements.

## Decision Framework

When analyzing any technical challenge:
1. Evaluate system-wide implications and dependencies
2. Consider long-term maintainability and evolution
3. Balance technical excellence with business pragmatism
4. Identify risks and provide mitigation strategies
5. Document architectural decisions with clear rationale

## Integration Protocols

**AI Dr. Workflow**: Accept structured diagnostic inputs, translate findings into development tasks, escalate complex issues appropriately, maintain comprehensive audit trails.

**Prompt Enhancement**: Analyze existing prompts for optimization opportunities, apply SDK recommendations systematically, test variations for effectiveness, track performance improvements.

## Output Standards

Provide analysis with:
- Executive summary of key findings
- Detailed technical assessment with evidence
- Clear, prioritized recommendations
- Implementation roadmap with milestones
- Risk matrix and mitigation approaches
- Success metrics and monitoring strategies

Focus on sustainable, scalable solutions that enhance team productivity and system reliability. Prioritize clarity and actionable guidance over theoretical perfection.
```

## Tool permission configuration

The principal engineer agent requires specific tools for effective operation. **Read, Grep, and Glob** enable comprehensive codebase analysis. **Bash** allows system command execution for testing and validation. **WebSearch** provides access to current documentation and best practices. **Edit** enables direct code modifications when implementing architectural improvements.

Tool permissions follow a principle of least privilege—grant only what's necessary for the agent's role. The `/agents` command provides an interactive interface showing all available tools, including MCP server integrations, making configuration more manageable.

## Integration architecture patterns

Sub-agents integrate with external systems through multiple pathways. **MCP servers** provide direct connections to databases, APIs, and third-party tools. **Workflow orchestration** occurs through slash commands in `.claude/commands/` that can trigger specific agent combinations. **Hook systems** enable pre and post-execution automation for complex workflows.

For AI Dr. workflow integration, the principal engineer agent should interpret diagnostic outputs, prioritize remediation efforts, and coordinate with specialized agents for implementation. The agent maintains context isolation while participating in larger orchestration patterns through structured handoffs and status updates.

## Advanced configuration features

Enterprise deployments benefit from **hierarchical settings** where enterprise policies override project and user configurations. The **permissions system** in `.claude/settings.json` controls file access patterns and command execution. **Context management** keeps each agent's working memory separate, preventing cross-contamination between unrelated tasks.

Agent orchestration supports sequential processing (A→B→C), parallel execution (A+B→merge), hub-and-spoke patterns (orchestrator→specialists), and conditional routing based on analysis results. These patterns enable sophisticated multi-agent workflows while maintaining clear responsibility boundaries.

## Best practices for maximum effectiveness

Start by using Claude to generate initial agent templates, then refine based on actual usage patterns. Create focused agents with single, clear responsibilities rather than overly broad capabilities. Version control project agents in `.claude/agents/` for team sharing and evolution tracking.

Monitor token usage and adjust model selection based on task complexity—many tasks don't require opus-level reasoning. Use descriptive agent names and comprehensive descriptions to ensure proper automatic delegation. Test both explicit invocation ("Use the principal-engineer agent to...") and automatic delegation scenarios.

Implement comprehensive error handling and graceful degradation for production environments. Document agent capabilities, limitations, and interaction patterns for team members. Regularly review and update system prompts based on evolving requirements and feedback.

## Implementation workflow

To deploy the principal engineer sub-agent, create the file at `.claude/agents/principal-engineer.md` with the configuration above. Test initial functionality with explicit invocation: "Use the principal-engineer agent to review our authentication architecture." Validate automatic delegation by presenting architecture-related queries without explicit agent mention.

Iterate on the system prompt based on actual outputs, adjusting specificity and constraints as needed. Integrate with existing development workflows through slash commands and MCP server configurations. Monitor performance metrics and optimize tool permissions for efficiency.

This configuration creates a sophisticated principal engineer sub-agent that seamlessly integrates with AI Dr. workflows and prompt enhancement systems while maintaining the high-level perspective essential for strategic technical leadership. The agent balances comprehensive analysis with actionable guidance, enabling effective code understanding and workflow optimization across complex development environments.