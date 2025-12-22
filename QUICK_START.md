# 🚀 Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- Docker Desktop installed (for PostgreSQL & Redis)
- Git installed

## Step 1: Install Dependencies

```bash
# From project root
npm install
```

This installs dependencies for all workspaces (dashboard, api, packages).

## Step 2: Start Docker Services

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify they're running
docker-compose ps
```

## Step 3: Set Up Environment Variables

```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local and add your keys (optional for demo mode)
# At minimum, you need:
# - SESSION_SECRET (any random string)
# - DATABASE_URL (already set for local Docker)
```

**Minimum required for demo mode:**
```env
SESSION_SECRET=your-random-secret-here
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/orgcodeai
```

**For full features (optional):**
- `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET` - For GitHub OAuth
- `OPENAI_API_KEY` - For AI analysis features
- `GITHUB_TOKEN` - For real GitHub API access

## Step 4: Start Development Servers

### Option A: Start Everything (Recommended)

```bash
# From project root - starts both dashboard and API
npm run dev
```

This uses Turborepo to start both:
- **Dashboard**: http://localhost:3000
- **API**: http://localhost:3001

### Option B: Start Individually

**Terminal 1 - Dashboard:**
```bash
cd apps/dashboard
npm run dev
# Dashboard runs on http://localhost:3000
```

**Terminal 2 - API:**
```bash
cd apps/api
npm run dev
# API runs on http://localhost:3001
```

## Step 5: Test the Application

1. **Open Dashboard**: http://localhost:3000
2. **Click "Start Scanning"**
3. **Enter organization name**: `stephdl` (or any org name)
4. **See repositories** (uses mock data if GitHub not configured)

## 🎯 What You'll See

- **Landing Page** (`/`) - Hero section with features
- **Scan Page** (`/scan`) - Enter org name to scan
- **Repo View** (`/scan/[owner]/[repo]`) - View repository files
- **AI Analysis** (`/scan/[owner]/[repo]/analyze`) - AI vulnerability detection

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Docker Not Running
```bash
# Start Docker Desktop, then:
docker-compose up -d
```

### Dependencies Not Installing
```bash
# Clean install
rm -rf node_modules apps/*/node_modules packages/*/node_modules
npm install
```

### Database Connection Error
```bash
# Restart Docker services
docker-compose down
docker-compose up -d

# Check if PostgreSQL is running
docker-compose ps
```

## 📝 Next Steps

- **Connect GitHub App**: See `apps/api/GITHUB_APP_SETUP.md`
- **Add OpenAI Key**: For AI analysis features
- **Deploy to Vercel**: See `DEPLOYMENT.md`

## 🎉 You're Ready!

Everything should be running. Visit http://localhost:3000 to see your dashboard!
