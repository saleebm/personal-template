# Environment

## Required Variables
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/lesswhelmed
REDIS_URL=redis://localhost:6379
AUTH_HEADER=your-secure-api-key
GEMINI_API_KEY=your-gemini-api-key
GITHUB_TOKEN=your-github-token
```

## Setup
1. Copy `.env.example` to `.env`
2. Fill in required variables
3. Create separate test database

---

**For complete environment configuration, external services, and security requirements, see [docs/environment.md](docs/environment.md)**

*Read when: Setting up development environment, configuring external services, or troubleshooting auth issues*