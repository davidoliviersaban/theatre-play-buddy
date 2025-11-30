#!/bin/bash

# Theatre Play Buddy - Quick Setup Script

echo "🎭 Theatre Play Buddy - Database Setup"
echo "======================================"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found. Creating from .env.example..."
    cp .env.example .env.local
    echo "✅ Created .env.local"
    echo "📝 Please edit .env.local and add your API keys"
    echo ""
fi

# Check if docker is running
if ! docker info > /dev/null 2>&1; then
    echo "⚠️  Docker is not running. Please start Docker first."
    echo ""
    echo "Alternatives:"
    echo "  1. Start Docker Desktop"
    echo "  2. Use existing PostgreSQL: createdb theatre_play_buddy"
    echo "  3. Use cloud PostgreSQL provider (Neon, Supabase, etc.)"
    exit 1
fi

echo "🐳 Starting PostgreSQL with Docker Compose..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Check if connection works
if docker exec theatre-postgres pg_isready -U theatre > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready!"
else
    echo "⚠️  PostgreSQL might not be ready yet. Waiting a bit more..."
    sleep 5
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔧 Generating Prisma Client..."
npx prisma generate

echo ""
echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Next steps:"
echo "  1. Edit .env.local and add your LLM API key:"
echo "     - ANTHROPIC_API_KEY (recommended) or"
echo "     - OPENAI_API_KEY"
echo ""
echo "  2. Start the development server:"
echo "     npm run dev"
echo ""
echo "  3. Open http://localhost:3000"
echo ""
echo "📊 To view your database:"
echo "     npm run db:studio"
echo ""
