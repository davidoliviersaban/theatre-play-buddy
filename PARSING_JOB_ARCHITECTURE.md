# Parsing Job Architecture Analysis & Redesign

> **📋 STATUS: DESIGN DOCUMENT - NOT YET IMPLEMENTED**  
> **Last Updated**: December 1, 2024  
> **Implementation**: Phase 8 (Tasks T055-T150 in [tasks.md](specs/002-llm-play-parser/tasks.md))  
> **Current State**: Planning complete, implementation not started  
> **Next Step**: Review design → Approve → Begin Week 1 (Database Migration)

---

## Current Architecture Analysis

### 1. **Job Execution Models**

The system currently uses **two parallel parsing paths**:

#### Path A: Streaming Parse (for short plays < 20KB)

- **Location**: `src/app/import/api/parse/route.ts`
- **Trigger**: HTTP POST request with `uploadId`
- **Execution**: Synchronous SSE stream
- **State**: In-memory only (no database tracking)
- **Lifecycle**:
  - Start: Immediate on HTTP request
  - Progress: SSE events emitted to client
  - Complete: Final event + stream close
  - Error: Error event + stream close
- **Limitations**:
  - No persistence (if client disconnects, all progress lost)
  - No resume capability
  - No job control (pause/stop/restart)
  - Tied to HTTP request lifecycle

#### Path B: Incremental Parse (for long plays > 20KB)

- **Location**: `src/app/import/api/parse/route.ts` + `src/lib/parse/session-runner.ts`
- **Trigger**: HTTP POST request creates `ParsingSession` in database
- **Execution**: Async background job via `runParsingSession()`
- **State**: Persisted in `ParsingSession` table
- **Lifecycle**:
  - Start: `createParsingSession()` → `runParsingSession()` fire-and-forget
  - Progress: Database updates every chunk
  - Complete: Status = 'completed', session deleted
  - Error: Status = 'failed', saved with `failureReason`
- **Capabilities**:
  - ✅ Resume from last chunk
  - ✅ Crash recovery
  - ❌ No pause
  - ❌ No stop/abort
  - ❌ No job queue management
  - ❌ Concurrent execution not controlled

### 2. **Current Components**

```
┌─────────────────────────────────────────────────────────────┐
│                     HTTP Request Layer                       │
│  POST /api/import/api/parse                                  │
│  - Receives upload buffer                                    │
│  - Returns SSE stream                                        │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        │ Decision:       │
   Text < 20KB?      Text > 20KB?
        │                 │
        ▼                 ▼
┌──────────────┐   ┌──────────────────────┐
│  Streaming   │   │ Incremental + Session│
│  Parse       │   │ Tracking             │
│  (in-memory) │   │ (DB-persisted)       │
└──────────────┘   └──────────────────────┘
        │                 │
        │                 ▼
        │          ┌─────────────────┐
        │          │ ParsingSession  │
        │          │ (Database)      │
        │          └─────────────────┘
        │                 │
        │                 ▼
        │          ┌─────────────────┐
        │          │ runParsingSession│
        │          │ (Background)     │
        │          └─────────────────┘
        │                 │
        └────────┬────────┘
                 │
                 ▼
        ┌──────────────────┐
        │ LLM Parser       │
        │ (Anthropic/OpenAI)│
        └──────────────────┘
                 │
                 ▼
        ┌──────────────────┐
        │ savePlay()       │
        │ (Database write) │
        └──────────────────┘
```

### 3. **State Management**

#### In-Memory State (Streaming Path):

```typescript
// Lives only during HTTP request
let lastPlaybook: DeepPartial<Playbook> | null = null;
const charactersSeen = new Set<string>();
let actsSeen = 0;
let scenesSeen = 0;
let linesCompleted = 0;
let chunkCount = 0;
```

#### Persisted State (Incremental Path):

```typescript
// ParsingSession table schema
{
  id: UUID;
  status: "pending" |
    "warming" |
    "parsing" |
    "completed" |
    "failed" |
    "aborted";
  currentChunk: number;
  totalChunks: number;
  currentState: JSON; // Full ParsingContext snapshot
  // ... metadata, progress, timestamps
}
```

#### Concurrency Control:

```typescript
// Simple in-memory Set (not distributed-safe)
const runningSessions = new Set<string>();

// No mechanism to prevent:
// - Multiple servers running same job
// - Stale locks from crashed processes
// - Job throttling/rate limiting
```

### 4. **Job Control APIs**

#### Existing Endpoints:

- ✅ `POST /api/import/api/parse` - Start new parse
- ✅ `POST /api/import/sessions/[id]/continue` - Resume from last chunk
- ✅ `POST /api/import/sessions/[id]/restart` - Restart from beginning
- ❌ No pause endpoint
- ❌ No stop/abort endpoint
- ❌ No priority control
- ❌ No job queue listing

### 5. **Error Handling**

#### Current Approach:

```typescript
// Error handling is scattered across layers:

// Layer 1: HTTP Route (route.ts)
try {
  // extraction, validation
} catch (extractError) {
  sendEvent(controller, "error", { message, code });
  controller.close();
  return;
}

// Layer 2: Session Runner (session-runner.ts)
try {
  for await (const inc of parsePlayIncrementally(...)) {
    // ...
  }
} catch (err) {
  await markSessionFailed(sessionId, (err as Error).message);
  return;
}

// Layer 3: Outer catch-all
} catch (outerErr) {
  console.error(`[Session Runner] Unexpected error...`);
} finally {
  runningSessions.delete(sessionId);
}
```

#### Issues:

- No retry logic for transient failures
- No exponential backoff
- No circuit breaker for LLM API failures
- No dead-letter queue for permanently failed jobs
- Manual intervention required for stuck jobs

---

## Problems with Current Architecture

### P1: **Dual Path Complexity**

- Two completely different execution models
- Code duplication (character fixing, cleanup logic exists in both paths)
- Inconsistent error handling
- Different observability strategies

### P2: **No Job Queue**

- Jobs run immediately on request
- No prioritization
- No rate limiting to protect LLM API quotas
- Concurrent jobs can overwhelm system

### P3: **Weak Concurrency Control**

- In-memory `runningSessions` Set is not distributed-safe
- Multi-instance deployment would allow duplicate job execution
- No lock expiration (crashed process leaves orphan lock)

### P4: **Limited Job Control**

- Can't pause long-running jobs
- Can't abort jobs (e.g., user uploaded wrong file)
- Can't adjust priority mid-execution

### P5: **No Observability**

- No centralized job logs
- No execution time metrics
- No failure rate tracking
- No SLA monitoring

### P6: **Fragile Resume**

- Resume depends on `currentState` JSON being valid
- No checksum validation
- No versioning of serialization format
- What happens if Prisma schema changes?

### P7: **Fire-and-Forget Hazard**

```typescript
void runParsingSession(id); // No await, no error capture
```

- Caller doesn't know if job actually started
- Errors are swallowed silently
- No feedback loop to HTTP client

---

## Proposed Redesign

### Design Principles

1. **Single Execution Model**: All parsing jobs use same infrastructure
2. **Job Queue as Source of Truth**: Every job goes through queue, no direct execution
3. **State Machine**: Explicit states with valid transitions
4. **Distributed-Safe**: Works correctly with multiple instances
5. **Observable**: Comprehensive logging, metrics, and tracing
6. **Resilient**: Retries, circuit breakers, graceful degradation

### New Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   HTTP API Layer                             │
│  POST /api/jobs/parse - Submit new job                       │
│  GET  /api/jobs/:id   - Get job status                       │
│  POST /api/jobs/:id/pause  - Pause job                       │
│  POST /api/jobs/:id/resume - Resume job                      │
│  POST /api/jobs/:id/cancel - Cancel job                      │
│  GET  /api/jobs       - List jobs (filterable)               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│               Job Service (Business Logic)                   │
│  - Validate inputs                                           │
│  - Enqueue job                                               │
│  - Map requests to job commands                              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  Job Queue + State Machine                   │
│  States:                                                     │
│  - queued    → pending worker pickup                         │
│  - running   → actively parsing                              │
│  - paused    → user-initiated pause                          │
│  - cancelled → user-initiated abort                          │
│  - retrying  → transient failure, will retry                 │
│  - completed → success                                       │
│  - failed    → permanent failure                             │
│                                                              │
│  Transitions enforced via state machine validator            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Job Worker Pool (Async Workers)                 │
│  - Poll queue for jobs                                       │
│  - Claim job with distributed lock (Redis/DB)                │
│  - Execute parse pipeline                                    │
│  - Update job state + progress                               │
│  - Release lock on completion/failure                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│            Parse Pipeline (Unified Executor)                 │
│  1. Extract text (PDF/DOCX/TXT)                              │
│  2. Chunk text (always, even for small plays)                │
│  3. Incremental LLM parse                                    │
│  4. Validate & fix                                           │
│  5. Save to DB                                               │
│  - All steps checkpointed                                    │
│  - All steps retryable                                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Persistence Layer (Database)                    │
│  ParseJob table (replaces ParsingSession):                   │
│    - id, status, priority, retryCount, maxRetries            │
│    - createdAt, startedAt, completedAt, updatedAt            │
│    - input (rawText, config), output (playbookId)            │
│    - checkpoints (array of completion markers)               │
│    - error (lastError, failureReason)                        │
│    - lock (workerId, lockedAt, lockExpiry)                   │
└─────────────────────────────────────────────────────────────┘
```

### State Machine

```
                ┌──────┐
                │queued│
                └───┬──┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
   ┌────────┐  ┌────────┐  ┌─────────┐
   │running │  │cancelled│  │ failed  │
   └───┬────┘  └────────┘  └─────────┘
       │
   ┌───┼────┐
   │   │    │
   ▼   ▼    ▼
┌──────┐ ┌─────┐ ┌──────────┐
│paused│ │retry│ │ completed│
└──────┘ └──┬──┘ └──────────┘
   │        │
   │        ▼
   │   ┌────────┐
   └──►│running │
       └────────┘
```

**Valid Transitions**:

- `queued → running` (worker picks up)
- `queued → cancelled` (user aborts before start)
- `running → paused` (user pauses)
- `running → completed` (success)
- `running → retrying` (transient failure, retries < maxRetries)
- `running → failed` (permanent failure or maxRetries exceeded)
- `running → cancelled` (user aborts mid-execution)
- `paused → running` (user resumes)
- `paused → cancelled` (user aborts while paused)
- `retrying → running` (retry attempt)
- `retrying → failed` (retry exhausted)

**Invalid Transitions** (rejected with error):

- `completed → *` (final state)
- `failed → running` (must explicitly restart as new job)
- `cancelled → running` (must explicitly restart as new job)

---

## Implementation Plan

### Phase 1: Database Migration (Week 1)

**Goal**: Replace `ParsingSession` with robust `ParseJob` schema

#### Tasks:

1. Create new Prisma schema:

```prisma
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

2. Write migration script:

   - Migrate existing `ParsingSession` records to `ParseJob`
   - Map old `status` enum to new `JobStatus`
   - Preserve `currentState` for resume capability

3. Update all references:
   - `parsing-session-db.ts` → `parse-job-db.ts`
   - Update imports across codebase

### Phase 2: Job Queue Infrastructure (Week 2)

**Goal**: Implement reliable job queue with distributed locking

#### Tasks:

1. Create `JobQueue` service (`src/lib/jobs/queue.ts`):

```typescript
export class JobQueue {
  // Submit new job
  async enqueue(input: ParseJobInput): Promise<string> {
    const job = await prisma.parseJob.create({
      data: {
        rawText: input.rawText,
        filename: input.filename,
        config: input.config,
        status: "queued",
        priority: input.priority ?? 0,
      },
    });
    return job.id;
  }

  // Claim next job (with distributed lock)
  async claimNext(workerId: string): Promise<ParseJob | null> {
    const now = new Date();
    const lockDuration = 10 * 60 * 1000; // 10 minutes

    // Find highest priority queued job or expired lock
    const job = await prisma.$transaction(async (tx) => {
      const candidate = await tx.parseJob.findFirst({
        where: {
          OR: [
            { status: "queued" },
            {
              status: "running",
              lockExpiry: { lt: now }, // Expired lock
            },
          ],
        },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      });

      if (!candidate) return null;

      // Claim it
      return tx.parseJob.update({
        where: { id: candidate.id },
        data: {
          status: "running",
          workerId,
          lockedAt: now,
          lockExpiry: new Date(now.getTime() + lockDuration),
          startedAt: candidate.startedAt ?? now,
        },
      });
    });

    return job;
  }

  // Renew lock (heartbeat during long processing)
  async renewLock(jobId: string, workerId: string): Promise<boolean> {
    const result = await prisma.parseJob.updateMany({
      where: {
        id: jobId,
        workerId,
        status: "running",
      },
      data: {
        lockExpiry: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    return result.count > 0;
  }

  // Release lock and update status
  async complete(jobId: string, workerId: string, result: JobResult) {
    await prisma.parseJob.update({
      where: {
        id: jobId,
        workerId,
      },
      data: {
        status: result.status,
        playbookId: result.playbookId,
        completedAt: new Date(),
        failureReason: result.failureReason,
        workerId: null,
        lockExpiry: null,
      },
    });
  }
}
```

2. Create `JobStateMachine` validator (`src/lib/jobs/state-machine.ts`):

```typescript
const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  queued: ["running", "cancelled"],
  running: ["paused", "completed", "retrying", "failed", "cancelled"],
  paused: ["running", "cancelled"],
  retrying: ["running", "failed"],
  completed: [],
  failed: [],
  cancelled: [],
};

export function canTransition(from: JobStatus, to: JobStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

export function assertTransition(from: JobStatus, to: JobStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid transition: ${from} → ${to}`);
  }
}
```

3. Add retry logic with exponential backoff:

```typescript
async function handleFailure(jobId: string, error: Error) {
  const job = await prisma.parseJob.findUnique({ where: { id: jobId } });
  if (!job) return;

  if (job.retryCount < job.maxRetries) {
    // Retry with exponential backoff
    const delayMs = Math.min(1000 * 2 ** job.retryCount, 60000);
    await prisma.parseJob.update({
      where: { id: jobId },
      data: {
        status: "retrying",
        retryCount: job.retryCount + 1,
        lastError: error.message,
        // Schedule retry (or use job scheduler)
      },
    });
  } else {
    // Permanent failure
    await prisma.parseJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        failureReason: `Max retries (${job.maxRetries}) exceeded. Last error: ${error.message}`,
      },
    });
  }
}
```

### Phase 3: Worker Pool (Week 3)

**Goal**: Replace fire-and-forget execution with managed workers

#### Tasks:

1. Create `JobWorker` class (`src/lib/jobs/worker.ts`):

```typescript
export class JobWorker {
  private workerId: string;
  private queue: JobQueue;
  private running = false;
  private currentJobId: string | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(workerId: string) {
    this.workerId = workerId;
    this.queue = new JobQueue();
  }

  async start() {
    this.running = true;
    console.log(`[Worker ${this.workerId}] Started`);

    while (this.running) {
      try {
        // Claim next job
        const job = await this.queue.claimNext(this.workerId);

        if (!job) {
          // No jobs available, wait before polling again
          await sleep(5000);
          continue;
        }

        this.currentJobId = job.id;
        console.log(`[Worker ${this.workerId}] Processing job ${job.id}`);

        // Start heartbeat to renew lock
        this.startHeartbeat(job.id);

        // Execute job
        await this.executeParseJob(job);
      } catch (error) {
        console.error(`[Worker ${this.workerId}] Error:`, error);
        if (this.currentJobId) {
          await handleFailure(this.currentJobId, error as Error);
        }
      } finally {
        this.stopHeartbeat();
        this.currentJobId = null;
      }
    }

    console.log(`[Worker ${this.workerId}] Stopped`);
  }

  async stop() {
    this.running = false;
  }

  private startHeartbeat(jobId: string) {
    this.heartbeatInterval = setInterval(async () => {
      const renewed = await this.queue.renewLock(jobId, this.workerId);
      if (!renewed) {
        console.warn(
          `[Worker ${this.workerId}] Failed to renew lock for ${jobId}`
        );
        this.stop(); // Lost lock, stop processing
      }
    }, 60000); // Every minute
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private async executeParseJob(job: ParseJob) {
    // Unified parse pipeline
    const result = await parseJobPipeline(job, (progress) => {
      // Update progress
      prisma.parseJob
        .update({
          where: { id: job.id },
          data: { progress, completedChunks: progress.chunksCompleted },
        })
        .catch(console.error);
    });

    // Complete job
    await this.queue.complete(job.id, this.workerId, result);
  }
}
```

2. Create worker bootstrap script (`src/lib/jobs/bootstrap.ts`):

```typescript
// Start workers on app initialization
export function startWorkers(count: number = 2) {
  const workers: JobWorker[] = [];

  for (let i = 0; i < count; i++) {
    const workerId = `worker-${i}-${process.pid}`;
    const worker = new JobWorker(workerId);
    workers.push(worker);
    worker.start().catch(console.error);
  }

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    console.log("SIGTERM received, stopping workers...");
    await Promise.all(workers.map((w) => w.stop()));
    process.exit(0);
  });

  return workers;
}
```

3. Integrate into Next.js app (`src/instrumentation.ts`):

```typescript
import { startWorkers } from "./lib/jobs/bootstrap";

export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Start background workers
    startWorkers(parseInt(process.env.WORKER_COUNT || "2"));
  }
}
```

### Phase 4: Unified Parse Pipeline (Week 4)

**Goal**: Consolidate streaming + incremental paths into single pipeline

#### Tasks:

1. Extract common parse logic (`src/lib/jobs/parse-pipeline.ts`):

```typescript
export async function parseJobPipeline(
  job: ParseJob,
  onProgress: (progress: Progress) => void
): Promise<JobResult> {
  // Step 1: Extract text (already done, in rawText)
  const text = job.rawText;

  // Step 2: Always chunk (no more streaming path)
  const chunkSize = job.config?.chunkSize ?? 2500;

  // Step 3: Incremental parse with checkpointing
  const context = await restoreContext(job.currentState);

  try {
    for await (const inc of parsePlayIncrementally(
      text,
      job.config?.llmProvider ?? "anthropic",
      chunkSize,
      async (ctx, chunk) => {
        // Checkpoint: save context
        await prisma.parseJob.update({
          where: { id: job.id },
          data: {
            currentState: serializeContext(ctx),
            completedChunks: chunk,
            progress: (chunk / inc.total) * 100,
          },
        });

        onProgress({
          chunksCompleted: chunk,
          totalChunks: inc.total,
          linesCompleted: ctx.lastLineNumber,
        });
      },
      context ?? undefined
    )) {
      context = inc.context;
    }
  } catch (error) {
    // Checkpoint on error for resume
    if (context) {
      await prisma.parseJob.update({
        where: { id: job.id },
        data: { currentState: serializeContext(context) },
      });
    }
    throw error;
  }

  // Step 4: Validate & fix
  const playbook = contextToPlaybook(context);
  const fixed = fixCharacterIdMismatches(playbook);
  const cleaned = cleanupPlaybook(fixed);

  const parsed = PlaybookSchema.safeParse(cleaned);
  if (!parsed.success) {
    throw new Error(`Validation failed: ${parsed.error.message}`);
  }

  // Step 5: Save to DB
  await savePlay(parsed.data);

  return {
    status: "completed",
    playbookId: parsed.data.id,
  };
}
```

2. Remove dual-path logic from `route.ts`
3. Simplify to just enqueue job + return job ID:

```typescript
export async function POST(req: NextRequest) {
  const { uploadId, llmProvider } = await req.json();
  const buffer = getUploadBuffer(uploadId);
  const text = await extractText(buffer);

  // Enqueue job
  const queue = new JobQueue();
  const jobId = await queue.enqueue({
    rawText: text,
    filename: uploadId,
    config: { llmProvider },
  });

  return NextResponse.json({ jobId });
}
```

### Phase 5: Job Control APIs (Week 5)

**Goal**: Build REST APIs for job management

#### Endpoints:

```typescript
// GET /api/jobs/:id - Get job status
export async function GET(req, { params }) {
  const job = await prisma.parseJob.findUnique({ where: { id: params.id } });
  return NextResponse.json(job);
}

// POST /api/jobs/:id/pause - Pause job
export async function POST(req, { params }) {
  const job = await prisma.parseJob.findUnique({ where: { id: params.id } });
  assertTransition(job.status, "paused");

  await prisma.parseJob.update({
    where: { id: params.id },
    data: { status: "paused" },
  });

  // Signal worker to stop (via lock expiry or status poll)
  return NextResponse.json({ success: true });
}

// POST /api/jobs/:id/resume - Resume paused job
export async function POST(req, { params }) {
  const job = await prisma.parseJob.findUnique({ where: { id: params.id } });
  assertTransition(job.status, "running");

  await prisma.parseJob.update({
    where: { id: params.id },
    data: { status: "queued" }, // Re-queue for pickup
  });

  return NextResponse.json({ success: true });
}

// POST /api/jobs/:id/cancel - Cancel job
export async function POST(req, { params }) {
  const job = await prisma.parseJob.findUnique({ where: { id: params.id } });
  assertTransition(job.status, "cancelled");

  await prisma.parseJob.update({
    where: { id: params.id },
    data: {
      status: "cancelled",
      completedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}

// GET /api/jobs - List jobs
export async function GET(req) {
  const { status, limit = 50 } = parseQuery(req.url);

  const jobs = await prisma.parseJob.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ jobs });
}
```

### Phase 6: Monitoring & Observability (Week 6)

**Goal**: Add comprehensive monitoring

#### Tasks:

1. **Structured Logging**:

```typescript
// Use pino or winston
logger.info({
  event: "job.started",
  jobId: job.id,
  workerId: this.workerId,
  priority: job.priority,
});

logger.error({
  event: "job.failed",
  jobId: job.id,
  error: error.message,
  stack: error.stack,
  retryCount: job.retryCount,
});
```

2. **Metrics Endpoint** (`/api/metrics`):

```typescript
export async function GET() {
  const metrics = {
    queueDepth: await prisma.parseJob.count({ where: { status: "queued" } }),
    runningJobs: await prisma.parseJob.count({ where: { status: "running" } }),
    failedJobs: await prisma.parseJob.count({ where: { status: "failed" } }),
    completedJobs: await prisma.parseJob.count({
      where: { status: "completed" },
    }),
    avgProcessingTime: await getAvgProcessingTime(),
    p95ProcessingTime: await getP95ProcessingTime(),
  };

  return NextResponse.json(metrics);
}
```

3. **Health Check** (`/api/health`):

```typescript
export async function GET() {
  const health = {
    workers: await getActiveWorkerCount(),
    oldestQueuedJob: await getOldestQueuedJob(),
    stuckJobs: await getStuckJobs(), // running > 30min
  };

  const isHealthy =
    health.workers > 0 &&
    health.oldestQueuedJob < 5 * 60 * 1000 && // < 5 min wait
    health.stuckJobs === 0;

  return NextResponse.json(
    { status: isHealthy ? "healthy" : "degraded", ...health },
    { status: isHealthy ? 200 : 503 }
  );
}
```

4. **Job Audit Trail**:

```prisma
model JobEvent {
  id        String   @id @default(uuid())
  jobId     String
  event     String   // started, paused, resumed, failed, completed
  details   Json?
  createdAt DateTime @default(now())

  @@index([jobId, createdAt])
}
```

---

## Migration Strategy

### Rollout Plan

**Week 1-2**: Build new infrastructure (no production impact)

- Database migration
- Job queue implementation
- Workers (disabled)

**Week 3**: Parallel run (shadow mode)

- Enqueue jobs but still use old execution path
- Workers process jobs but don't write results
- Compare outputs for validation

**Week 4**: Gradual rollout

- Route 10% of traffic to new system
- Monitor error rates, latency
- Increase to 50%, then 100%

**Week 5**: Deprecation

- Remove old streaming path
- Remove `ParsingSession` table
- Clean up code

**Week 6**: Optimization

- Tune worker count
- Optimize checkpoint frequency
- Add advanced features (priority boost, dead-letter queue)

### Rollback Plan

If critical issues arise:

1. Feature flag to disable new system
2. Route all traffic back to old path
3. Keep both systems running for 1 week
4. Fix issues, re-deploy

---

## Success Metrics

### Reliability

- Job success rate > 99%
- Failed jobs automatically retried < 5% of cases
- Zero jobs stuck > 1 hour

### Performance

- P95 job processing time < 5 minutes
- Queue depth < 10 jobs during normal operation
- Worker utilization 60-80%

### Operability

- Mean time to detect (MTTD) job failures < 1 minute
- Mean time to resolve (MTTR) stuck jobs < 5 minutes
- Zero manual interventions required per day

---

## Future Enhancements

### Phase 7+

1. **Job Scheduling**

   - Cron-like scheduled jobs
   - Retry with backoff schedule

2. **Job Dependencies**

   - Chain jobs (parse → validate → publish)
   - Parallel job execution with barrier

3. **Priority Lanes**

   - Express lane for small plays
   - Bulk lane for batch imports

4. **Cost Optimization**

   - LLM API quota management
   - Dynamic worker scaling based on queue depth

5. **Multi-tenancy**

   - Per-user job quotas
   - Fair scheduling across users

6. **Advanced Observability**
   - OpenTelemetry tracing
   - Prometheus metrics export
   - Grafana dashboards

---

## Conclusion

The current parsing job architecture suffers from:

- Dual execution paths creating complexity
- No job queue leading to poor resource management
- Weak concurrency control unsafe for distributed systems
- Limited observability and error handling

The proposed redesign introduces:

- ✅ Unified job queue for all parsing tasks
- ✅ Robust state machine with explicit transitions
- ✅ Distributed-safe locking for multi-instance deployment
- ✅ Comprehensive job control (pause/resume/cancel)
- ✅ Retry logic with exponential backoff
- ✅ Worker pool for controlled concurrency
- ✅ Checkpointing for resume capability
- ✅ Observable metrics and logging

Implementation can be done incrementally over 6 weeks with minimal production risk via parallel run and gradual rollout strategy.
