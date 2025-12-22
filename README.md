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
- 🚧 **AI Agents**: Coming in Phase 2
- 🚧 **Auto PRs**: Coming in Phase 2

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

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

- `GITHUB_CLIENT_ID` - GitHub App Client ID (optional for demo)
- `GITHUB_CLIENT_SECRET` - GitHub App Client Secret (optional for demo)
- `SESSION_SECRET` - Random secret for sessions
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - For AI analysis (Phase 2)

See `.env.example` for all available variables.

## License

MIT

