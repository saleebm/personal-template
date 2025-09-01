# Repository Navigation Guide

**Version**: 1.0.0  
**Date**: 2025-01-21  
**Purpose**: Quick reference for navigating the AI Dr. codebase

## 🗺️ Quick Navigation Map

### Where to Find Things

| What You're Looking For | Where to Look | File Pattern |
|------------------------|---------------|--------------|
| **API Endpoints** | `apps/web/app/api/` | `*/route.ts` |
| **React Components** | `apps/web/components/` | `*.tsx` |
| **Database Schema** | `packages/database/prisma/` | `schema.prisma` |
| **Shared UI Components** | `packages/ui/src/` | `*.tsx` |
| **MCP Servers** | `packages/mcp-server-*/` | `src/server.ts` |
| **Configuration** | Root and package directories | `*.json`, `*.toml` |
| **Documentation** | `docs/`, `architecture/`, `.ruler/` | `*.md` |
| **Automation Scripts** | `scripts/` | `*.sh` |
| **Types & Interfaces** | Package `src/` directories | `types.ts`, `*.types.ts` |
| **Tests** | Alongside source files | `*.test.ts`, `*.spec.ts` |

## 🎯 Common Tasks & Locations

### "I want to..."

#### Add a New API Endpoint
1. **Location**: `apps/web/app/api/[your-endpoint]/route.ts`
2. **Schema**: Define types in `packages/database/prisma/schema.prisma` if needed
3. **Documentation**: Update `architecture/API_CONTRACTS.md`

#### Create a New React Component
1. **Shared Component**: `packages/ui/src/[component].tsx`
2. **App-Specific**: `apps/web/components/[component].tsx`
3. **Export**: Update `packages/ui/src/index.ts` for shared components

#### Add a Database Table
1. **Schema**: Edit `packages/database/prisma/schema.prisma`
2. **Migration**: Run `bun db:migrate:dev`
3. **Generate Client**: Run `bun db:generate`
4. **Seed Data**: Add to `packages/database/src/seed.ts`

#### Create an MCP Server
1. **Location**: `packages/mcp-server-[name]/`
2. **Structure**:
   ```
   packages/mcp-server-[name]/
   ├── src/
   │   └── server.ts
   ├── package.json
   ├── tsconfig.json
   └── README.md
   ```
3. **Scripts**: Add to root `package.json`:
   - `mcp:[name]`: Run the server
   - `mcp:[name]:dev`: Development mode

#### Add a New Package
1. **Create**: `packages/[package-name]/`
2. **Structure**:
   ```
   packages/[package-name]/
   ├── package.json
   ├── tsconfig.json
   ├── README.md
   └── src/
       └── index.ts
   ```
3. **Register**: Add to workspace in root `package.json`
4. **Documentation**: Update `docs/documentation-links.md` with urls (must be validated urls) for documentation links.

## 📁 Key Directories Explained

### `/apps`
- **Purpose**: Deployable applications
- **Contents**: 
  - `web/` - Main Next.js application

### `/packages`
- **Purpose**: Shared, reusable code
- **Key Packages**:
  - `database` - Prisma client and schema
  - `auth` - Authentication logic
  - `workflow-engine` - XState workflows
  - `ui` - Shared UI components
  - `config-*` - Configuration packages

### `/architecture`
- **Purpose**: System-level documentation
- **Key Files**:
  - `SYSTEM_ARCHITECTURE.md` - Overall system design
  - `API_CONTRACTS.md` - API documentation
  - `CRITICAL_ANALYSIS.md` - Issues and recommendations

### `/docs`
- **Purpose**: Technical documentation and guides
- **Contents**: Library references, implementation guides
- **Rules**:
  - Use folders to separate documentation for different topics regarding detailed implementation, design, etc.

### `/scripts`
- **Purpose**: Automation and setup scripts
- **Naming Convention**:
  - `db-*.sh` - Database operations
  - `docs-*.sh` - Documentation maintenance
  - `setup-*.sh` - Environment setup
  - `start-mcp-*.sh` - MCP server launchers
