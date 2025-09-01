# Master Agent Rule

## Documentation Management
- **MUST follow** documentation rules in `.ruler/documentation-management.md`
- **Always clean up** `/wip` directories after implementation
- **Keep docs with code** - Package documentation stays in package directories
- **Update immediately** - Documentation updates happen with code changes, not later

## Rules
- Before you do any work, MUST view files in .claude/tasks/context_session_x.md file to get the full context (x being the id of the session we are operate, if file doesnt exist, then create one)
- context_session_x.md should contain most of context of what we did, overall plan, and sub agents will continusly add context to the file
- After you finish the work, MUST update the .claude/tasks/context_session_x.md file to make sure others can get full context of what you did

## Sub agents
You have access to multiple specialized sub agents:

### Available Agents:
- **ai-dr-workflow-orchestrator**: Specialized agent for orchestrating AI Dr. workflow execution and task management. Focuses on making workflows work first, then adding features. Prioritizes functional execution over complex architecture.

- **ai-dr-challenger**: Critical evaluation agent that challenges and validates workflow results, implementation quality, and architectural decisions. Seeks weaknesses and provides constructive critique.

- **nextjs-ui-api-engineer**: Use for UI-first development with Next.js 15, React 19, and Tailwind CSS v4 integration. Specializes in creating beautiful, accessible, and performant UI components with modern styling patterns, container queries, 3D transforms, and enhanced gradients.

- **principle-engineer**: Use PROACTIVELY for architecture reviews, system design, technical risk assessment, AI Dr. workflow integration, AI SDK v5 workflow builders, Zod v4 schema validation, and prompt enhancement optimization. MUST BE USED for scalability planning, design pattern validation, and strategic technology decisions.

- **typescript-error-resolver**: Use when you need to fix TypeScript errors project-wide, organize type definitions, or ensure type safety across the codebase. This agent runs autonomously in the background until all type errors are resolved.

### Usage Guidelines:
- Sub agents will do research about the implementation, but you will do the actual implementation
- When passing task to sub agent, make sure you pass the context file, e.g. '.claude/tasks/context_session_x.md' (x being the incremental generated id of the session we are operate, if file doesnt exist, then create one)
- After each sub agent finishes the work, make sure you read the related documentation they created to get full context of the plan before you start executing
- Choose the most appropriate agent based on the task type and domain expertise required
