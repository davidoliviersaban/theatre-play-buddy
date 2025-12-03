# Quick Start: Phase 8 Implementation

**Ready to begin?** Follow this guide to start Week 1 of the job architecture redesign.

---

## Day 1: Monday Morning Kickoff

### 1. Create Feature Branch

```bash
cd /Users/dsaban/git/perso/theatre-play-buddy
git checkout main
git pull origin main
git checkout -b 002-llm-play-parser-job-queue
git push -u origin 002-llm-play-parser-job-queue
```

### 2. Verify Phase 7 Complete

```bash
# Run tests
npm test

# Check for TypeScript errors
npm run build

# Verify database state
npx prisma studio
# → Check Playbook, Character, Act, Scene, Line all have llmSourceId
# → Check no duplicate key errors
```

### 3. Set Up Development Environment

```bash
# Ensure Docker running
docker ps

# Start PostgreSQL if not running
docker compose up -d

# Install dependencies (if needed)
npm install pino pino-pretty --save
npm install @types/node --save-dev

# Verify Prisma
npx prisma generate
```

### 4. Open Task List

Open `specs/002-llm-play-parser/tasks.md` and scroll to Phase 8.

Mark T055 as in progress:

```markdown
- [ ] T055 → - [x] T055 (in progress)
```

---

## Your First Task: T055 (30 minutes)

### Create ParseJob Model Schema

Open `prisma/schema.prisma` and add after the `ParsingSession` model:

```prisma
// NEW: Job queue model for reliable parsing
model ParseJob {
  id              String        @id @default(uuid())

  // Job metadata
  type            JobType       @default(PARSE_PLAY)
  priority        Int           @default(0) // Higher = more urgent
  status          JobStatus     @default(queued)

  // Input data
  rawText         String        @db.Text
  filename        String
  config          Json?         // { chunkSize, llmProvider, etc }

  // Output reference
  playbookId      String?       // Set when completed successfully

  // Execution state
  retryCount      Int           @default(0)
  maxRetries      Int           @default(3)
  checkpoints     Json          @default("[]") // Array of checkpoint markers
  currentState    Json?         // ParsingContext snapshot

  // Progress tracking
  totalChunks     Int?
  completedChunks Int           @default(0)
  progress        Float         @default(0) // 0-100

  // Error tracking
  lastError       String?       @db.Text
  failureReason   String?       @db.Text

  // Distributed lock
  workerId        String?       // Which worker is processing
  lockedAt        DateTime?
  lockExpiry      DateTime?

  // Timestamps
  createdAt       DateTime      @default(now())
  startedAt       DateTime?
  completedAt     DateTime?
  updatedAt       DateTime      @updatedAt

  @@index([status, priority, createdAt]) // For efficient queue polling
  @@index([workerId]) // For worker-specific queries
  @@index([playbookId]) // For output lookup
}

enum JobType {
  PARSE_PLAY
  // Future: EXPORT_PLAY, BULK_IMPORT, etc
}

enum JobStatus {
  queued
  running
  paused
  retrying
  completed
  failed
  cancelled
}
```

**Save the file.** ✅ T055 complete!

---

## Continue with Tasks T056-T061 (Monday Afternoon)

Follow the same pattern. Each task is small and focused.

### T056: Add More Fields (if needed)

Already done in T055! Skip.

### T057-T061: Add Remaining Schema Elements

Already included in T055! Skip to T062.

---

## T062: Run Migration (15 minutes)

```bash
npx prisma migrate dev --name add_parse_job_model
```

Expected output:

```
✔ Generated Prisma Client
The following migration(s) have been created and applied:

migrations/
  └─ 20241201XXXXXX_add_parse_job_model/
    └─ migration.sql
```

Verify in Prisma Studio:

```bash
npx prisma studio
```

Navigate to `ParseJob` table → should exist (empty).

✅ T062 complete!

---

## End of Day 1

**Checkpoint**:

- [x] Feature branch created
- [x] Phase 7 validated
- [x] ParseJob schema added
- [x] Migration run successfully
- [x] Tasks T055-T062 complete

**Commit your work**:

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add ParseJob model for job queue (T055-T062)"
git push origin 002-llm-play-parser-job-queue
```

**Update task list**:

Mark T055-T062 as [x] in `specs/002-llm-play-parser/tasks.md`

---

## Day 2: Tuesday - Data Migration Script

Follow `IMPLEMENTATION_GUIDE.md` Week 1 schedule for detailed daily tasks.

**Key file to create**: `scripts/migrate-parsing-session-to-parse-job.ts`

---

## Tips for Success

### 1. One Task at a Time

Don't jump ahead. Each task builds on the previous one.

### 2. Test Frequently

After every few tasks, run:

```bash
npm run build
npm test
```

### 3. Commit Often

Commit after completing each task or at end of day.

### 4. Update Task List

Keep `tasks.md` up to date with your progress.

### 5. Ask for Help

If stuck, refer to:

- [PARSING_JOB_ARCHITECTURE.md](../../PARSING_JOB_ARCHITECTURE.md) - Technical design
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Week-by-week plan
- [plan.md](./plan.md) - Overall project context

---

## Week 1 Checklist

By end of Friday, you should have:

- [x] ParseJob model in schema
- [x] Migration run and tested
- [x] `parse-job-db.ts` created (renamed from parsing-session-db.ts)
- [x] All imports updated
- [x] Zero TypeScript errors
- [x] Staging environment validated
- [x] Code reviewed and merged

---

**Ready?** Start with T055 and follow the guide. You've got this! 🚀
