#!/bin/bash

echo "🚀 Starting org-code-ai..."

# Step 1: Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Step 2: Check if .env.local exists
if [ ! -f ".env.local" ]; then
  echo "⚙️  Creating .env.local from .env.example..."
  cp .env.example .env.local
  echo "✅ Created .env.local - you may want to edit it with your API keys"
fi

# Step 3: Start Docker services (if Docker is available)
if command -v docker &> /dev/null; then
  echo "🐳 Starting Docker services..."
  docker-compose up -d
else
  echo "⚠️  Docker not found - skipping Docker services"
  echo "   You can still run the app, but database features won't work"
fi

# Step 4: Start development servers
echo "🎯 Starting development servers..."
echo "   Dashboard: http://localhost:3000"
echo "   API: http://localhost:3001"
echo ""
npm run dev
