# org-code-ai
AI-powered multi-repo intelligence for GitHub organizations.

## Tech Stack
Next.js 15 + GitHub GraphQL + CrewAI + Supabase + OpenAI

## Quick Start Demo

```bash
# Install dependencies
pnpm install

# Start Docker services (PostgreSQL & Redis)
docker-compose up -d

# Start development servers
pnpm turbo dev
```

Then:
1. Visit http://localhost:3000
2. Click **"Start Scanning"**
3. Enter organization name: `stephdl`
4. See repositories instantly!

**Dashboard**: http://localhost:3000 | **API**: http://localhost:3001

## GitHub App Setup (Optional)

For production OAuth authentication, see [apps/api/GITHUB_APP_SETUP.md](./apps/api/GITHUB_APP_SETUP.md)

**Demo Mode**: The app works without GitHub OAuth setup using mock data. Perfect for testing the UI!

## Features

- ✅ **Multi-Repo Scanner**: Scan entire GitHub organizations
- ✅ **GraphQL Integration**: Fast, efficient repository queries
- ✅ **File Tree Viewer**: Browse repository structure
- ✅ **Demo Mode**: Works without authentication
- ✅ **AI Vulnerability Detection**: Scans code for SQL injection, XSS, secrets, auth bypasses
- ✅ **Cross-Repo Patterns**: Finds duplicated code and shared vulnerabilities
- ✅ **Auto-Fix PRs**: AI generates secure code fixes and creates GitHub Pull Requests
- ✅ **Real-Time Analysis**: Streams vulnerability detection progress

## Project Structure

```
org-code-ai/
├── apps/
│   ├── dashboard/          # Next.js 15 frontend
│   └── api/               # Express API server
├── packages/
│   ├── ai-agents/         # CrewAI agents (Phase 2)
│   ├── graphql-client/    # GitHub GraphQL client
│   └── types/             # Shared TypeScript types
└── docker-compose.yml      # PostgreSQL & Redis
```

## Development

```bash
# Run all apps in development mode
pnpm turbo dev

# Build all apps
pnpm turbo build

# Lint all apps
pnpm turbo lint
```

## 🤖 AI Features (Phase 2)

### Vulnerability Detection
Scans code for:
- SQL injection risks
- XSS vulnerabilities
- Hardcoded secrets/API keys
- Insecure dependencies
- Authentication bypasses
- CSRF vulnerabilities
- Path traversal issues

### Cross-Repo Patterns
Finds:
- Duplicated logic across repositories
- Similar vulnerability patterns
- Inconsistent implementations
- Shared dependencies with vulnerabilities

### Auto-Fix PRs
AI generates:
- Secure code fixes for detected vulnerabilities
- GitHub Pull Requests with fixes
- Detailed PR descriptions and commit messages

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

- `GITHUB_CLIENT_ID` - GitHub App Client ID (optional for demo)
- `GITHUB_CLIENT_SECRET` - GitHub App Client Secret (optional for demo)
- `SESSION_SECRET` - Random secret for sessions
- `OPENAI_API_KEY` - **Required for AI analysis** (get from https://platform.openai.com/api-keys)
- `ANTHROPIC_API_KEY` - Optional, for Claude models
- `DATABASE_URL` - PostgreSQL connection string

See `.env.example` for all available variables.

## Demo

1. Visit http://localhost:3000
2. Click **"Start Scanning"**
3. Enter organization: `stephdl`
4. Click any repo → **"Analyze with AI"**
5. See vulnerabilities detected in seconds
6. Click **"Auto-Generate Fix PR"** → PR content generated automatically

## License

MIT

# CI Fix
