# Tasks: LLM-Powered Play Parser

Feature: 002-llm-play-parser
Feature dir: /Users/dsaban/git/perso/theatre-play-buddy/specs/002-llm-play-parser
Tech stack: Next.js 14, React 18, TypeScript, Tailwind CSS, Vercel AI SDK (Anthropic preferred; OpenAI fallback), Zod, pdf-parse, mammoth, Prisma + PostgreSQL
Project structure: As defined in plan.md (api routes under `src/app/import/api`, parsing libs under `src/lib/parse`, UI under `src/components/import`)

## Phase 1: Setup

- [x] T001 Create feature branch `002-llm-play-parser`
- [x] T002 Add environment variables to `.env.local` in repo root (OPENAI_API_KEY/ANTHROPIC_API_KEY, DATABASE_URL)
- [x] T003 Install dependencies in project root (ai SDK, zod, pdf-parse, mammoth, prisma client)
- [x] T004 Initialize `src/lib/parse/` directory per plan.md
- [x] T005 Create `src/app/import/api` folders for `upload` and `parse` endpoints
- [x] T006 Scaffold `src/components/import/` directory for upload and progress UI
- [x] T007 Verify TypeScript paths and Next.js app router build succeeds locally

## Phase 2: Foundational (blocking prerequisites)

- [x] T008 Create Zod schemas in `src/lib/parse/schemas.ts` matching `specs/002-llm-play-parser/data-model.md`
- [x] T009 Implement validation utilities in `src/lib/parse/validation.ts` (schema guards, refinement rules)
- [x] T010 Implement text extractors in `src/lib/parse/extractors.ts` for PDF/DOCX/TXT (pdf-parse, mammoth, fs.readFile)
- [x] T011 Configure Vercel AI SDK provider factory in `src/lib/parse/llm-parser.ts` (Anthropic default, OpenAI fallback)
- [x] T012 Add multi-speaker helpers in `src/lib/parse/multi-character.ts` (normalize characterId vs characterIdArray)
- [x] T013 Update `src/lib/play-storage.ts` with persistence helpers (create/import Playbook) if needed
- [x] T014 Create API error helpers in `src/lib/parse/errors.ts` (typed error responses)

## Phase 3: User Story 1 (P1) — Upload and Extract Basic Play Structure

Goal: Users can upload a file and see parsed title, author, characters, acts/scenes. Independently testable via a simple script upload.
Independent test criteria: After upload, stream shows characters and act/scene structure; final validated object appears; user can save.

- [x] T015 [P] [US1] Implement upload endpoint in `src/app/import/api/upload/route.ts` (validate type/size, return uploadId)
- [x] T016 [P] [US1] Implement server parse SSE endpoint skeleton in `src/app/import/api/parse/route.ts` (SSE headers, event stream)
- [x] T017 [P] [US1] Implement basic LLM-driven structure extraction in `src/lib/parse/llm-parser.ts` (title/author/characters/acts/scenes)
- [x] T018 [P] [US1] Wire Zod validation for structure objects in `src/lib/parse/schemas.ts` and use in `parse/route.ts`
- [x] T019 [P] [US1] Implement client upload UI `src/components/import/file-upload.tsx` (drag-drop + file type checks)
- [x] T020 [P] [US1] Implement client progress UI `src/components/import/parse-progress.tsx` (consumes SSE and renders events)
- [x] T021 [US1] Implement import page `src/app/import/page.tsx` to compose upload + progress components
- [x] T022 [US1] Persist parsed basic play to storage via `src/lib/play-storage.ts`
- [x] T023 [US1] Implement error handling UI `src/components/import/parse-error-display.tsx`
- [x] T024 [US1] Emit SSE events: `progress`, `character_found`, `act_complete`, `scene_complete`, `complete`, `error` from `parse/route.ts`

## Phase 4: User Story 2 (P2) — Line-by-Line Character Attribution

Goal: Every dialogue line is attributed to the correct character(s) with act/scene references. Independently testable by navigating to a parsed scene.
Independent test criteria: Parsed scenes show ordered lines with correct character attribution; consecutive lines grouped properly; simultaneous speech supported.

- [x] T025 [P] [US2] Extend LLM parsing in `src/lib/parse/llm-parser.ts` to produce line-by-line output with `characterId` or `characterIdArray`
- [x] T026 [P] [US2] Add Zod refinements in `src/lib/parse/schemas.ts` ensuring dialogue lines have either `characterId` or `characterIdArray`
- [x] T027 [P] [US2] Emit SSE event `line_parsed` with per-line attribution from `parse/route.ts`
- [x] T028 [US2] Update persistence in `src/lib/play-storage.ts` to save lines with multi-speaker attribution
- [x] T029 [US2] Audit UI components that consume lines and refactor to use `getSpeakerIds` (e.g., `src/components/practice/line-card.tsx`)
- [x] T030 [US2] Ensure existing practice views render multi-speaker lines correctly (book view, line-by-line view)

## Phase 5: User Story 3 (P3) — Stage Direction Attribution

Goal: Directions attributed to characters when applicable or retained as general scene directions. Independently testable by uploading a script with varied directions.
Independent test criteria: Character-specific directions appear adjacent to related dialogue; general directions appear standalone in sequence.

- [x] T031 [P] [US3] Extend extractor to retain direction markers and positioning in `src/lib/parse/extractors.ts`
- [x] T032 [P] [US3] Extend LLM prompts/logic to classify stage directions in `src/lib/parse/llm-parser.ts`
- [x] T033 [P] [US3] Update Zod `LineSchema` to include `type: "stage_direction"` handling with optional attribution
- [x] T034 [US3] Update renderers to display stage directions with correct association `src/components/practice/book-view.tsx`
- [x] T035 [US3] Persist and display direction attribution in scene views `src/components/play/scene-list-item.tsx`

## Phase 6: User Story 4 (P4) — Format Preservation

Goal: Preserve indentation and structural formatting. Independently testable with scripts containing varied indentation and verse.
Independent test criteria: Relative indentation and line breaks are preserved; text styling not retained.

- [x] T036 [P] [US4] Capture formatting metadata during extraction in `src/lib/parse/extractors.ts` (indent level, line breaks)
- [x] T037 [P] [US4] Extend schemas to include optional formatting metadata in `src/lib/parse/schemas.ts`
- [x] T038 [US4] Update UI renderers to visualize indentation `src/components/practice/book-view.tsx`

## Final Phase: Polish & Cross-Cutting Concerns

- [x] T039 Add SSE `unsupported_speaker` telemetry event in `src/app/import/api/parse/route.ts` when crowd/unknown detected
- [x] T040 Add cancellation support for parsing (client abort + server respect) in `src/app/import/api/parse/route.ts`
- [x] T041 Add comprehensive error messages and recovery hints in `src/components/import/parse-error-display.tsx`
- [x] T042 Add unit tests for extractors `tests/parse/extractors.test.ts`
- [x] T043 Add unit tests for schemas and refinements `tests/parse/schemas.test.ts`
- [x] T044 Add unit tests for multi-speaker helpers `tests/parse/multi-character.test.ts`
- [x] T045 Add integration test for upload→parse→persist→render `tests/parse/llm-parser.test.ts`
- [x] T046 Update README with import feature quickstart steps

## Phase 7: ID Generation Refactoring (COMPLETED)

**Goal**: Eliminate duplicate key errors by using database-generated UUIDs as canonical IDs
**Status**: ✅ Completed December 1, 2024
**Documentation**: See implementation notes in `plan.md`

- [x] T047 [P] Make all schema IDs optional in `src/lib/parse/schemas.ts`
- [x] T048 [P] Refactor `savePlay()` to omit manual ID generation in `src/lib/db/plays-db-prisma.ts`
- [x] T049 [P] Update `contextToPlaybook()` to omit playbook ID in `src/lib/parse/incremental-parser.ts`
- [x] T050 [P] Implement character ID mapping using llmSourceId
- [x] T051 Update seed script to use `savePlay()` in `scripts/seed.ts`
- [x] T052 Update init-db to use `savePlay()` in `src/lib/db/init-db.ts`
- [x] T053 Test database with fresh data (TRUNCATE TABLE "Playbook" CASCADE)
- [x] T054 Remove unused imports (crypto.randomUUID) from refactored files

## Phase 8: Job Architecture Redesign (PLANNED)

**Goal**: Replace dual-path execution with unified job queue system  
**Status**: 🔄 Architecture analysis completed, design approved, implementation pending  
**Documentation**: See [PARSING_JOB_ARCHITECTURE.md](../../PARSING_JOB_ARCHITECTURE.md)  
**Independent Test Criteria**: Each week produces testable increment - W1: migration, W2: job enqueue/claim, W3: worker execution, W4: unified pipeline, W5: job control, W6: monitoring

---

### Week 1: Database Migration & Schema Design

**Goal**: Replace `ParsingSession` with robust `ParseJob` model supporting distributed job queue

**Independent Test**: Create job, verify status transitions, test distributed lock acquisition/release

- [x] T055 [P] Create `ParseJob` model in `prisma/schema.prisma` with fields: id, type (enum: PARSE_PLAY), priority (Int), status (enum: queued/running/paused/retrying/completed/failed/cancelled)
- [x] T056 [P] Add job input/output fields to `ParseJob`: rawText, filename, config (Json), playbookId, retryCount, maxRetries, checkpoints (Json array), currentState (Json)
- [x] T057 [P] Add distributed lock fields to `ParseJob`: workerId, lockedAt, lockExpiry
- [x] T058 [P] Add progress tracking fields to `ParseJob`: totalChunks, completedChunks, progress (Float 0-100)
- [x] T059 [P] Add error tracking fields to `ParseJob`: lastError, failureReason
- [x] T060 [P] Add timestamp fields to `ParseJob`: createdAt, startedAt, completedAt, updatedAt
- [x] T061 Add indexes to `ParseJob`: (status, priority, createdAt), (workerId), (playbookId)
- [x] T062 Create migration `npx prisma migrate dev --name add_parse_job_model`
- [x] T063 Write data migration script `scripts/migrate-parsing-session-to-parse-job.ts` to convert existing `ParsingSession` records
- [x] T064 Test migration script on local database copy, verify all fields mapped correctly
- [x] T065 [P] Rename `src/lib/db/parsing-session-db.ts` to `src/lib/db/parse-job-db.ts`
- [x] T066 Update all imports across codebase: `parsing-session-db` → `parse-job-db`

**Checkpoint Week 1**: ParseJob model exists, migration tested, no compilation errors ✅

---

### Week 2: Job Queue Infrastructure

**Goal**: Implement reliable job queue with distributed locking and retry logic

**Independent Test**: Enqueue 10 jobs, verify FIFO+priority ordering, test lock expiration and reclaim

- [x] T067 [P] Create `src/lib/jobs/queue.ts` with `JobQueue` class skeleton
- [x] T068 [P] Create `src/lib/jobs/state-machine.ts` with `VALID_TRANSITIONS` map and `canTransition()` validator
- [x] T069 [P] Create `src/lib/jobs/types.ts` with TypeScript interfaces (ParseJobInput, JobResult, JobStatus enum)
- [x] T070 Implement `JobQueue.enqueue()` in `src/lib/jobs/queue.ts`: create ParseJob with status=queued, priority, config
- [x] T071 Implement `JobQueue.claimNext()` in `src/lib/jobs/queue.ts`: atomic transaction to find highest-priority queued job or expired lock, set workerId/lockExpiry
- [x] T072 Implement `JobQueue.renewLock()` in `src/lib/jobs/queue.ts`: extend lockExpiry for active job, return false if lock lost
- [x] T073 Implement `JobQueue.complete()` in `src/lib/jobs/queue.ts`: set status=completed/failed, clear lock, set completedAt
- [x] T074 Implement `JobQueue.updateProgress()` in `src/lib/jobs/queue.ts`: update completedChunks, progress, currentState
- [x] T075 Add `assertTransition()` function to `src/lib/jobs/state-machine.ts` that throws on invalid state change
- [x] T076 Create `handleFailure()` function in `src/lib/jobs/queue.ts`: check retryCount < maxRetries, set status=retrying or failed, exponential backoff calculation
- [x] T077 Add unit tests for state machine in `tests/jobs/state-machine.test.ts`: valid transitions, invalid transitions throw
- [x] T078 Add unit tests for queue in `tests/jobs/queue.test.ts`: enqueue, claim, renewLock, complete

**Checkpoint Week 2**: Job queue operational, distributed locking works, retry logic tested ✅

---

### Week 3: Worker Pool Implementation

**Goal**: Create managed worker pool with heartbeat, graceful shutdown, and job execution

**Independent Test**: Start 2 workers, enqueue 5 jobs, verify each claimed by different worker, heartbeat renews locks, graceful shutdown waits for completion

- [x] T079 [P] Create `src/lib/jobs/worker.ts` with `JobWorker` class skeleton (workerId, queue, running flag)
- [x] T080 [P] Create `src/lib/jobs/bootstrap.ts` with `startWorkers()` function skeleton
- [x] T081 Implement `JobWorker.start()` in `src/lib/jobs/worker.ts`: poll loop calling `queue.claimNext()`, execute job, handle errors
- [x] T082 Implement `JobWorker.stop()` in `src/lib/jobs/worker.ts`: set running=false, wait for current job completion
- [x] T083 Implement heartbeat mechanism in `JobWorker`: setInterval every 60s calling `queue.renewLock()`, stop if renewal fails
- [x] T084 Implement `JobWorker.executeParseJob()` in `src/lib/jobs/worker.ts`: call parse pipeline, update progress callback, handle success/failure
- [x] T085 Implement `startWorkers()` in `src/lib/jobs/bootstrap.ts`: create N workers with unique IDs, start polling, register SIGTERM handler
- [x] T086 Add graceful shutdown to `src/lib/jobs/bootstrap.ts`: on SIGTERM, call worker.stop() on all workers, await completion
- [x] T087 Integrate worker bootstrap into `src/instrumentation.ts`: call `startWorkers(2)` when NEXT_RUNTIME === 'nodejs'
- [x] T088 Add environment variable `WORKER_COUNT` to `.env.local`, default to 2
- [x] T089 Add logging to worker lifecycle events: worker started, job claimed, job completed, job failed, worker stopped
- [x] T090 Test worker pool locally: start server, verify 2 workers log startup, enqueue job, verify claim and execution

**Checkpoint Week 3**: Worker pool executing jobs, heartbeat working, graceful shutdown tested ✅

---

### Week 4: Unified Parse Pipeline

**Goal**: Consolidate streaming and incremental paths into single pipeline, always use job queue

**Independent Test**: Upload short play (<20KB) and long play (>100KB), verify both go through job queue, progress updates work, final playbook saved

- [ ] T091 [P] Create `src/lib/jobs/parse-pipeline.ts` with `parseJobPipeline()` function signature
- [ ] T092 Implement text extraction step in `parseJobPipeline()`: use job.rawText directly (already extracted)
- [ ] T093 Implement chunking step in `parseJobPipeline()`: always chunk (no streaming path), use config.chunkSize or default 2500
- [ ] T094 Implement context restoration in `parseJobPipeline()`: call `restoreContext(job.currentState)` if resuming
- [ ] T095 Implement incremental parse loop in `parseJobPipeline()`: call `parsePlayIncrementally()`, checkpoint after each chunk via `queue.updateProgress()`
- [ ] T096 Implement progress callback in `parseJobPipeline()`: emit progress object (chunksCompleted, totalChunks, linesCompleted)
- [ ] T097 Implement error handling in `parseJobPipeline()`: checkpoint currentState on error for resume, throw error up to worker
- [ ] T098 Implement validation step in `parseJobPipeline()`: convert context to playbook, validate with PlaybookSchema
- [ ] T099 Implement persistence step in `parseJobPipeline()`: call `savePlay()`, return JobResult with status=completed, playbookId
- [ ] T100 Remove streaming path logic from `src/app/import/api/parse/route.ts` (delete <20KB branch)
- [ ] T101 Simplify `src/app/import/api/parse/route.ts` to just enqueue job: call `queue.enqueue()`, return JSON with jobId
- [ ] T102 Update route to accept `resumeJobId` parameter for restart functionality
- [ ] T103 Test unified pipeline: upload 10KB play, verify enqueued and parsed correctly
- [ ] T104 Test unified pipeline: upload 200KB play, verify chunked, progress updates, completion

**Checkpoint Week 4**: Dual-path eliminated, all parses use job queue, pipeline tested ✅

---

### Week 5: Job Control APIs & Frontend Integration

**Goal**: Build REST APIs for pause/resume/cancel, update frontend to poll job status

**Independent Test**: Upload play, pause via API, verify status=paused, resume via API, verify completion. Cancel mid-parse, verify status=cancelled.

- [ ] T105 [P] Create `src/app/api/jobs/route.ts` for POST (create) and GET (list) endpoints
- [ ] T106 [P] Create `src/app/api/jobs/[id]/route.ts` for GET (status) endpoint
- [ ] T107 [P] Create `src/app/api/jobs/[id]/pause/route.ts` for POST endpoint
- [ ] T108 [P] Create `src/app/api/jobs/[id]/resume/route.ts` for POST endpoint
- [ ] T109 [P] Create `src/app/api/jobs/[id]/cancel/route.ts` for POST endpoint
- [ ] T110 Implement GET `/api/jobs/:id` in `src/app/api/jobs/[id]/route.ts`: find job, return JSON with status, progress, timestamps
- [ ] T111 Implement POST `/api/jobs/:id/pause` in `src/app/api/jobs/[id]/pause/route.ts`: validate transition, update status=paused
- [ ] T112 Implement POST `/api/jobs/:id/resume` in `src/app/api/jobs/[id]/resume/route.ts`: validate transition, update status=queued (re-queue)
- [ ] T113 Implement POST `/api/jobs/:id/cancel` in `src/app/api/jobs/[id]/cancel/route.ts`: validate transition, update status=cancelled, set completedAt
- [ ] T114 Implement GET `/api/jobs` in `src/app/api/jobs/route.ts`: filter by status query param, order by createdAt desc, limit 50
- [ ] T115 Create `src/hooks/use-job-status.ts` with polling hook: fetch job status every 2s, return { job, loading, error }
- [ ] T116 Update `src/components/import/parse-progress.tsx` to use `useJobStatus()` instead of SSE (remove EventSource)
- [ ] T117 Add pause/resume/cancel buttons to `src/components/import/parse-progress.tsx` with handlers calling respective APIs
- [ ] T118 Update `src/app/import/page.tsx` to handle jobId from upload response, pass to parse-progress component
- [ ] T119 Test pause functionality: upload play, click pause, verify status changes to paused, worker stops processing
- [ ] T120 Test resume functionality: paused job, click resume, verify re-queued and worker picks up from checkpoint
- [ ] T121 Test cancel functionality: running job, click cancel, verify status=cancelled, worker aborts

**Checkpoint Week 5**: Job control working, frontend integrated, pause/resume/cancel tested ✅

---

### Week 6: Monitoring, Observability & Production Readiness

**Goal**: Add comprehensive logging, metrics, health checks, and audit trail

**Independent Test**: Query metrics endpoint, verify queue depth accurate. Check health endpoint, verify worker count. View job audit trail.

- [ ] T122 [P] Install structured logging library: `npm install pino pino-pretty` (or winston)
- [ ] T123 [P] Create `src/lib/jobs/logger.ts` with configured logger instance (JSON in prod, pretty in dev)
- [ ] T124 [P] Create `JobEvent` model in `prisma/schema.prisma` with fields: id, jobId, event (string), details (Json), createdAt
- [ ] T125 Create migration `npx prisma migrate dev --name add_job_event_audit_trail`
- [ ] T126 Add structured logging to job lifecycle in `src/lib/jobs/worker.ts`: log job.started, job.completed, job.failed with jobId, workerId, duration
- [ ] T127 Add structured logging to queue operations in `src/lib/jobs/queue.ts`: log job.enqueued, job.claimed, lock.renewed, lock.expired
- [ ] T128 Create audit trail helper in `src/lib/jobs/audit.ts`: `logJobEvent(jobId, event, details)` that inserts JobEvent record
- [ ] T129 Call `logJobEvent()` on key transitions: enqueued, claimed, paused, resumed, cancelled, completed, failed
- [ ] T130 Implement `GET /api/metrics` in `src/app/api/metrics/route.ts`: return queueDepth, runningJobs, completedJobs, failedJobs, avgProcessingTime, p95ProcessingTime
- [ ] T131 Implement helper `getAvgProcessingTime()` in `src/lib/jobs/metrics.ts`: query completed jobs, calculate avg(completedAt - startedAt)
- [ ] T132 Implement helper `getP95ProcessingTime()` in `src/lib/jobs/metrics.ts`: query completed jobs, calculate 95th percentile duration
- [ ] T133 Implement `GET /api/health` in `src/app/api/health/route.ts`: return workers (active count), oldestQueuedJob (age in ms), stuckJobs (running >30 min)
- [ ] T134 Add health check logic in `src/lib/jobs/health.ts`: query active workers (distinct workerId where lockedAt recent), oldest queued job timestamp
- [ ] T135 Return 503 status from `/api/health` if unhealthy: workers=0 OR oldestQueuedJob >5min OR stuckJobs >0
- [ ] T136 Add optional Grafana dashboard config in `monitoring/grafana/job-queue-dashboard.json` (time-series of queue depth, processing time)
- [ ] T137 Document monitoring setup in `specs/002-llm-play-parser/monitoring.md`: how to query metrics, interpret health checks, view audit trail
- [ ] T138 Test metrics endpoint: enqueue jobs, verify counts accurate
- [ ] T139 Test health endpoint: stop workers, verify unhealthy response
- [ ] T140 Test audit trail: execute job lifecycle, query JobEvent records, verify all transitions logged

**Checkpoint Week 6**: Monitoring complete, production-ready observability ✅

---

### Phase 8 Rollout: Parallel Run & Cutover

**Goal**: Safely deploy new job system with validation before full cutover

**Independent Test**: Shadow mode processes jobs without writing results, compare with old system. Gradual rollout routes traffic to new system, monitor error rates.

- [ ] T141 Add feature flag `USE_JOB_QUEUE` to `.env.local`, default false
- [ ] T142 Create parallel run mode in `src/app/import/api/parse/route.ts`: if `USE_JOB_QUEUE=shadow`, enqueue job but still use old path, log comparison
- [ ] T143 Deploy to staging with `USE_JOB_QUEUE=shadow`, run for 24 hours, compare job results with old path
- [ ] T144 Validate shadow mode: verify job queue processes all uploads, results match old system, no errors
- [ ] T145 Enable gradual rollout: set `USE_JOB_QUEUE=10` (10% traffic to new system), monitor error rates
- [ ] T146 Increase rollout to 50%: set `USE_JOB_QUEUE=50`, monitor for 48 hours
- [ ] T147 Full cutover: set `USE_JOB_QUEUE=true` (100% traffic), monitor for 1 week
- [ ] T148 Remove old dual-path code from `src/app/import/api/parse/route.ts` once stable
- [ ] T149 Remove `ParsingSession` model from `prisma/schema.prisma`, create migration
- [ ] T150 Remove old session-runner code from `src/lib/parse/session-runner.ts`

**Checkpoint Rollout**: New job system live in production, old code removed ✅

---

## Dependencies & Execution Order (Phase 8)

### Week Dependencies

- **Week 1** (Database): No dependencies - can start immediately
- **Week 2** (Queue): Depends on Week 1 (needs ParseJob model)
- **Week 3** (Workers): Depends on Week 2 (needs JobQueue service)
- **Week 4** (Pipeline): Depends on Week 2 (needs JobQueue), can run parallel with Week 3
- **Week 5** (APIs): Depends on Week 3 (needs workers executing jobs)
- **Week 6** (Monitoring): Depends on Week 5 (needs full system operational)
- **Rollout**: Depends on Week 6 (needs monitoring for validation)

### Parallel Opportunities by Week

**Week 1**: T055-T060 all parallel (different schema fields), T065-T066 parallel (file operations)

**Week 2**: T067-T069 all parallel (different files), T077-T078 parallel (different test files)

**Week 3**: T079-T080 parallel (different files)

**Week 4**: T091 parallel with any, remove-old-code tasks (T100-T101) can batch

**Week 5**: T105-T109 all parallel (different API routes), T115-T118 parallel (different components)

**Week 6**: T122-T124 all parallel (different files/concerns)

---

## Success Metrics (Phase 8)

Track these metrics to validate job architecture redesign:

- **Reliability**: Job success rate >99% (failed jobs auto-retry <5%)
- **Resilience**: Zero jobs stuck >1 hour (lock expiration + reclaim working)
- **Performance**: P95 job processing time <5 minutes (no regression from current system)
- **Observability**: MTTD (Mean Time To Detect) job failures <1 minute via health checks
- **Operability**: Zero manual interventions required per day (automatic retry + recovery)
- **Concurrency**: Queue depth <10 jobs during normal operation (workers keeping up)
- **Worker Health**: Worker utilization 60-80% (not idle, not overloaded)

---

## Testing Strategy (Phase 8)

### Unit Tests

- State machine transitions (valid/invalid)
- Queue operations (enqueue, claim, renewLock, complete)
- Retry logic with exponential backoff

### Integration Tests

- Worker lifecycle (start, claim, execute, stop)
- Distributed locking (multiple workers, no duplicate claims)
- Graceful shutdown (workers finish current job)

### End-to-End Tests

- Upload → enqueue → worker claim → parse → complete → playbook saved
- Pause → resume from checkpoint
- Cancel → job aborted, no playbook saved
- Failure → retry → eventual success or max retries

### Performance Tests

- 10 concurrent uploads, verify all complete <5 min
- 100 jobs in queue, verify FIFO+priority ordering
- Lock expiration, verify reclaim by different worker

### Production Validation

- Shadow mode: 100% jobs processed correctly
- Gradual rollout: error rates <1% at 10%, 50%, 100%
- Monitoring: metrics accurate, health checks functional

## Dependencies (story completion order)

1. Story 1 (P1) → Story 2 (P2) → Story 3 (P3) → Story 4 (P4)
2. Foundational Phase must be complete before any story implementation
3. Persistence updates (T013, T028) required before UI renders lines/directions reliably

## Parallel Execution Examples

- T015, T016, T019, T020 can proceed in parallel (different files)
- T025, T026, T027 can proceed in parallel after Phase 2 completes
- T031, T032, T033 can proceed in parallel once Story 2 finishes
- Testing tasks (T042–T045) can run in parallel once core APIs stabilize

## Implementation Strategy

- MVP: Deliver Story 1 (upload + basic structure) end-to-end with streaming and validation, persistence, and minimal UI.
- Incremental: Add line-by-line attribution (Story 2), then stage directions (Story 3), and finally formatting preservation (Story 4).
- Validation-first: All LLM responses pass through Zod schemas with strict refinements; emit telemetry on `unsupported_speaker` to measure gaps.

## Notes

- Line attribution model: `characterId?: string` for single-speaker; `characterIdArray?: string[]` for multi-speaker.
- SSE events include: progress, character_found, act_complete, scene_complete, line_parsed, unsupported_speaker, complete, error.
- Non-English plays supported; no regex fallback. Crowd/unknown speakers are not supported; emit telemetry via `unsupported_speaker`.
