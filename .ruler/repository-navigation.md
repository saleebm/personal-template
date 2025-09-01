# Repository Navigation Guide

**Version**: 1.0.0  
**Purpose**: Quick reference for navigating the monorepo codebase

## 🗺️ Quick Navigation Map

### Where to Find Things

| What You're Looking For | Where to Look | File Pattern |
|------------------------|---------------|--------------|
| **API Endpoints** | `apps/web/app/api/` | `*/route.ts` |
| **React Components** | `apps/web/components/` | `*.tsx` |
| **Database Schema** | `packages/database/prisma/` | `schema.prisma` |
| **Shared UI Components** | `packages/ui/src/` | `*.tsx` |
| **Configuration** | Root and package directories | `*.json`, `*.toml` |
| **Documentation** | `docs/`, `.ruler/` | `*.md` |
| **Automation Scripts** | `scripts/` | `*.sh` |
| **Types & Interfaces** | Package `src/` directories | `types.ts`, `*.types.ts` |
| **Tests** | Alongside source files | `*.test.ts`, `*.spec.ts` |

## 🎯 Common Tasks & Locations

### "I want to..."

#### Add a New API Endpoint
1. **Location**: `apps/web/app/api/[your-endpoint]/route.ts`
2. **Schema**: Define types in `packages/database/prisma/schema.prisma` if needed
3. **Documentation**: Update relevant docs

#### Create a New React Component
1. **Shared Component**: `packages/ui/src/[component].tsx`
2. **App-Specific**: `apps/web/components/[component].tsx`
3. **Export**: Update `packages/ui/src/index.ts` for shared components

#### Add a Database Table
1. **Schema**: Edit `packages/database/prisma/schema.prisma`
2. **Migration**: Run `bun db:migrate:dev`
3. **Generate Client**: Run `bun db:generate`
4. **Seed Data**: Add to `packages/database/src/seed.ts`

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

## 📁 Key Directories Explained

### `/apps`
- **Purpose**: Deployable applications
- **Contents**: 
  - `web/` - Main Next.js application

### `/packages`
- **Purpose**: Shared, reusable code
- **Key Packages**:
  - `database` - Prisma client and schema
  - `ui` - Shared UI components
  - `logger` - Logging utilities
  - `eslint-config` - Shared ESLint configuration
  - `typescript-config` - Shared TypeScript configuration

### `/docs`
- **Purpose**: Technical documentation and guides
- **Contents**: Project documentation, guides, references

### `/scripts`
- **Purpose**: Automation and setup scripts
- **Naming Convention**:
  - `setup-*.sh` - Environment setup
  - Other utility scripts as needed