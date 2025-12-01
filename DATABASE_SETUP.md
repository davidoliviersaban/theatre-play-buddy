# Database Setup Guide

This guide will help you set up PostgreSQL for Theatre Play Buddy.

## Quick Start

### Option 1: Docker (Recommended for Development)

The fastest way to get started is using Docker:

```bash
# Start PostgreSQL container
docker run --name theatre-postgres \
  -e POSTGRES_USER=theatre \
  -e POSTGRES_PASSWORD=theatre123 \
  -e POSTGRES_DB=theatre_play_buddy \
  -p 5432:5432 \
  -d postgres:16

# Update .env.local
echo 'DATABASE_URL="postgresql://theatre:theatre123@localhost:5432/theatre_play_buddy?schema=public"' >> .env.local

# Generate Prisma client and run migrations
npm run db:generate
npm run db:migrate
```

### Option 2: Local PostgreSQL Installation

If you have PostgreSQL installed locally:

```bash
# Create database using local PostgreSQL
createdb theatre_play_buddy

# Or if you want to use Docker container's psql
docker exec -it theatre-postgres createdb -U theatre theatre_play_buddy

# Or using psql
psql -U postgres
CREATE DATABASE theatre_play_buddy;
\q

# Update .env.local with your credentials
echo 'DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/theatre_play_buddy?schema=public"' >> .env.local

# Generate Prisma client and run migrations
npm run db:generate
npm run db:migrate
```

### Option 3: Cloud PostgreSQL

You can use any cloud PostgreSQL provider:

- **Neon** (https://neon.tech) - Free tier available
- **Supabase** (https://supabase.com) - Free tier available
- **Railway** (https://railway.app) - Free tier available
- **Vercel Postgres** (https://vercel.com/postgres) - Paid
- **AWS RDS** - Paid
- **Google Cloud SQL** - Paid

After creating your database:

```bash
# Copy connection string from your provider
# Update .env.local
DATABASE_URL="postgresql://user:pass@provider.host:5432/db?sslmode=require"

# Generate Prisma client and run migrations
npm run db:generate
npm run db:migrate
```

## Database Schema

The database consists of the following tables:

- **Playbook** - Theatre plays (title, author, year, etc.)
- **Character** - Characters in each play
- **Act** - Major divisions of a play
- **Scene** - Subdivisions within acts
- **Line** - Individual dialogue lines and stage directions
- **LineCharacter** - Join table for multi-character attribution

## Useful Commands

```bash
# Generate Prisma Client (after schema changes)
npm run db:generate

# Create a new migration
npm run db:migrate

# Deploy migrations to production
npm run db:migrate:deploy

# Push schema changes without creating migration (development only)
npm run db:push

# Open Prisma Studio (GUI for database)
npm run db:studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Prisma Studio

Prisma Studio is a visual database browser:

```bash
npm run db:studio
```

Opens at http://localhost:5555

## Migration from File-Based Storage

If you have existing plays in the file-based storage (`data/plays/`), you can migrate them:

1. Ensure PostgreSQL is set up and migrations are run
2. Update your code to use the new database adapter
3. Run a migration script to import existing plays

Migration script (create as `scripts/migrate-to-postgres.ts`):

```typescript
import { prisma } from "../src/lib/db/prisma";
import { savePlay } from "../src/lib/db/plays-db-prisma";
import fs from "fs/promises";
import path from "path";

async function migrate() {
  const dataDir = path.join(process.cwd(), "data", "plays");
  const files = await fs.readdir(dataDir);

  for (const file of files) {
    if (file === "_index.json" || !file.endsWith(".json")) continue;

    const content = await fs.readFile(path.join(dataDir, file), "utf-8");
    const play = JSON.parse(content);

    console.log(`Migrating ${play.title}...`);
    await savePlay(play);
  }

  console.log("Migration complete!");
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## Troubleshooting

### Wrong Port in DATABASE_URL

```
Error: Can't reach database server at `localhost:XXXXX`
```

**Solution**: Make sure DATABASE_URL uses port 5432:

```bash
# Check your .env.local file - it should be:
DATABASE_URL="postgresql://theatre:theatre123@localhost:5432/theatre_play_buddy?schema=public"

# NOT some random port like 51213 or 51214
# Also check for duplicate DATABASE_URL entries on the same line
```

### Connection Refused

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**: Make sure PostgreSQL is running:

```bash
# Check if Docker container is running
docker ps | grep theatre-postgres

# Should show:
# theatre-postgres ... 0.0.0.0:5432->5432/tcp

# Start stopped container
docker start theatre-postgres

# Or start with docker-compose
docker-compose up -d

# Verify it's listening on port 5432
docker port theatre-postgres
# Should output: 5432/tcp -> 0.0.0.0:5432
```

### Authentication Failed

```
Error: password authentication failed for user "..."
```

**Solution**: Check your DATABASE_URL credentials match your PostgreSQL setup.

### Database Does Not Exist

```
Error: database "theatre_play_buddy" does not exist
```

**Solution**: Create the database:

```bash
# If using Docker Compose
docker exec -it theatre-postgres createdb -U theatre theatre_play_buddy

# OR if PostgreSQL is installed locally
createdb theatre_play_buddy

# OR using psql in Docker
docker exec -it theatre-postgres psql -U theatre -c "CREATE DATABASE theatre_play_buddy;"
```

### SSL Required

If using a cloud provider requiring SSL:

```bash
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

## Environment Variables

Create `.env.local` in the project root:

```bash
# PostgreSQL Database
DATABASE_URL="postgresql://username:password@localhost:5432/theatre_play_buddy?schema=public"

# LLM API Keys
ANTHROPIC_API_KEY="sk-ant-..."
# OR
OPENAI_API_KEY="sk-..."
```

## Production Deployment

For production:

1. Use a managed PostgreSQL service (not Docker)
2. Set `DATABASE_URL` environment variable on your hosting platform
3. Run migrations: `npm run db:migrate:deploy`
4. Ensure connection pooling is configured (Prisma handles this automatically)

## Backup and Restore

### Backup

```bash
# Using pg_dump
pg_dump -U theatre -d theatre_play_buddy > backup.sql

# Using Docker
docker exec theatre-postgres pg_dump -U theatre theatre_play_buddy > backup.sql
```

### Restore

```bash
# Using psql
psql -U theatre -d theatre_play_buddy < backup.sql

# Using Docker
docker exec -i theatre-postgres psql -U theatre theatre_play_buddy < backup.sql
```

## Performance Optimization

The schema includes indexes on:

- Playbook: `title`, `author`
- Character: `playbookId`, `name`
- Act: `playbookId`, `(playbookId, order)`
- Scene: `actId`, `(actId, order)`
- Line: `sceneId`, `(sceneId, order)`, `type`

These indexes optimize common queries for listing, searching, and displaying plays.
