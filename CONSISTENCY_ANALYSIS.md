# Project Consistency Analysis Report

**Date**: December 1, 2024  
**Scope**: Theatre Play Buddy - LLM Play Parser Feature (002-llm-play-parser)  
**Analysis Type**: Cross-artifact validation (spec.md, plan.md, tasks.md, architecture, implementation)

---

## Executive Summary

### Overall Status: ⚠️ **INCONSISTENT** - Planning vs Implementation Gap

**Critical Finding**: The project has completed Phase 7 (ID generation refactoring) but **Phase 8 (Job Architecture Redesign) exists only in planning documents**. No actual implementation has begun.

**Key Inconsistencies**:

1. ✅ **Specifications are aligned** - spec.md, plan.md, tasks.md all consistent
2. ❌ **Implementation lags planning** - New job architecture (ParseJob, JobQueue, Workers) not implemented
3. ⚠️ **Database schema mismatch** - `ParsingSession` exists in DB, `ParseJob` planned but not created
4. ⚠️ **Code still uses old patterns** - Dual-path execution, no job queue, fire-and-forget workers

---

## Detailed Findings

### 1. Database Schema Consistency

#### Current State (Prisma Schema):

```prisma
✅ IMPLEMENTED:
- Playbook model with llmSourceId
- Character model with llmSourceId
- Act model with llmSourceId
- Scene model with llmSourceId
- Line model with llmSourceId
- ParsingSession model (OLD ARCHITECTURE)

❌ NOT IMPLEMENTED:
- ParseJob model (planned in tasks.md T055-T062)
- JobStatus enum
- JobType enum
- JobEvent audit trail model (planned in tasks.md T124)
```

**Inconsistency**: PARSING_JOB_ARCHITECTURE.md and tasks.md describe `ParseJob` model, but `prisma/schema.prisma` still contains `ParsingSession`.

**Status**: Tasks T055-T062 (Week 1) not started.

---

### 2. Source Code Structure Consistency

#### Planned Architecture (plan.md, PARSING_JOB_ARCHITECTURE.md):

```
src/lib/jobs/          # NEW - Job queue infrastructure
├── queue.ts           # JobQueue service
├── worker.ts          # JobWorker class
├── state-machine.ts   # State transitions
├── parse-pipeline.ts  # Unified parse executor
├── bootstrap.ts       # Worker initialization
├── logger.ts          # Structured logging
├── metrics.ts         # Performance metrics
├── health.ts          # Health checks
└── audit.ts           # Job event logging

src/app/api/jobs/      # NEW - Job control APIs
├── route.ts           # POST create, GET list
└── [id]/
    ├── route.ts       # GET status
    ├── pause/route.ts
    ├── resume/route.ts
    └── cancel/route.ts
```

#### Actual Implementation:

```
✅ EXISTS:
src/lib/db/parsing-session-db.ts  # Old session tracking
src/lib/parse/session-runner.ts   # Old background runner
src/app/import/api/parse/route.ts # Dual-path execution

❌ MISSING:
src/lib/jobs/                      # Entire directory doesn't exist
src/app/api/jobs/                  # Entire directory doesn't exist
src/instrumentation.ts             # Worker bootstrap integration (planned T087)
```

**File Search Results**:

- `src/lib/jobs/**` → **No files found**
- `src/app/api/jobs/**` → **No files found**

**Inconsistency**: All Phase 8 code (150 tasks) exists only in planning documents.

---

### 3. Import Statement Consistency

#### Current Imports (Active Code):

```typescript
✅ ACTIVE IMPORTS:
- src/app/import/api/parse/route.ts:
  import { createParsingSession, updateParsingSession, deleteCompletedSessions }
    from "../../../../lib/db/parsing-session-db";

- src/app/api/import/sessions/route.ts:
  import { getActiveSessions, getFailedSessions }
    from "@/lib/db/parsing-session-db";

❌ PLANNED IMPORTS (not yet created):
- import { JobQueue } from "@/lib/jobs/queue";
- import { JobWorker } from "@/lib/jobs/worker";
- import { parseJobPipeline } from "@/lib/jobs/parse-pipeline";
```

**Inconsistency**: Code still references `parsing-session-db.ts` (old pattern). Plan calls for migration to `parse-job-db.ts` (Task T065).

---

### 4. API Endpoint Consistency

#### Current Endpoints (Implemented):

```
✅ IMPLEMENTED:
POST /api/import/api/parse            # Dual-path parse (streaming + incremental)
POST /api/import/sessions/[id]/continue  # Resume incremental parse
POST /api/import/sessions/[id]/restart   # Restart failed parse
GET  /api/import/sessions             # List active/failed sessions

❌ PLANNED (not implemented):
POST /api/jobs/parse                  # Submit new job (Task T105)
GET  /api/jobs/:id                    # Get job status (Task T106)
POST /api/jobs/:id/pause              # Pause job (Task T107)
POST /api/jobs/:id/resume             # Resume job (Task T108)
POST /api/jobs/:id/cancel             # Cancel job (Task T109)
GET  /api/jobs                        # List jobs (Task T114)
GET  /api/metrics                     # Job metrics (Task T130)
GET  /api/health                      # Worker health (Task T133)
```

**Inconsistency**: Old session-based APIs operational, new job-based APIs not created.

---

### 5. State Management Consistency

#### Current Implementation (parse/route.ts):

```typescript
✅ DUAL-PATH EXECUTION:
- If text.length < 20KB → Streaming path (in-memory only)
- If text.length > 20KB → Incremental path (ParsingSession DB tracking)

// In-memory state (streaming):
let lastPlaybook: DeepPartial<Playbook> | null = null;
const charactersSeen = new Set<string>();

// Persisted state (incremental):
ParsingSession {
  status: 'pending' | 'warming' | 'parsing' | 'completed' | 'failed' | 'aborted'
  currentChunk, totalChunks, currentState (JSON)
}
```

#### Planned Architecture (PARSING_JOB_ARCHITECTURE.md):

```typescript
❌ UNIFIED JOB QUEUE (not implemented):
- All parses go through job queue (no dual path)
- ParseJob model with status machine
- Distributed lock with workerId, lockExpiry
- Retry logic with exponential backoff

Status enum (planned):
'queued' | 'running' | 'paused' | 'retrying' | 'completed' | 'failed' | 'cancelled'
```

**Inconsistency**: Current code uses `ParsingStatus` enum with 6 states. Plan defines `JobStatus` with 7 states (adds `retrying`). Neither `paused` nor `retrying` are implemented.

---

### 6. Concurrency Control Consistency

#### Current Implementation (session-runner.ts):

```typescript
✅ IN-MEMORY LOCK (not distributed-safe):
const runningSessions = new Set<string>();

// Before starting:
if (runningSessions.has(sessionId)) {
  console.warn(`Session ${sessionId} already running`);
  return;
}
runningSessions.add(sessionId);

// After completion:
runningSessions.delete(sessionId);
```

**Problem**: Multi-instance deployment would allow duplicate execution.

#### Planned Implementation (queue.ts Task T071):

```typescript
❌ DISTRIBUTED LOCK (not implemented):
async claimNext(workerId: string) {
  const job = await prisma.$transaction(async (tx) => {
    // Find queued job or expired lock
    // Atomically set workerId, lockedAt, lockExpiry
  });
}

async renewLock(jobId: string, workerId: string) {
  // Heartbeat: extend lockExpiry every 60s
}
```

**Inconsistency**: Architecture document describes distributed locking, but implementation uses simple Set.

---

### 7. Error Handling & Retry Consistency

#### Current Implementation:

```typescript
✅ SIMPLE ERROR CAPTURE:
try {
  for await (const inc of parsePlayIncrementally(...)) {
    // Parse chunks
  }
} catch (err) {
  await markSessionFailed(sessionId, (err as Error).message);
  return; // NO RETRY
}
```

**No retry logic**: Failures are permanent, require manual restart.

#### Planned Implementation (Tasks T076, T096-T097):

```typescript
❌ RETRY WITH BACKOFF (not implemented):
async function handleFailure(jobId: string, error: Error) {
  if (job.retryCount < job.maxRetries) {
    const delayMs = Math.min(1000 * 2 ** job.retryCount, 60000);
    await updateJob({ status: 'retrying', retryCount: +1 });
  } else {
    await updateJob({ status: 'failed', failureReason: '...' });
  }
}
```

**Inconsistency**: Spec requires resilience with retries, but current code has no automatic retry.

---

### 8. Monitoring & Observability Consistency

#### Current Implementation:

```typescript
✅ BASIC CONSOLE LOGGING:
console.log(`[Session Runner] Starting session ${sessionId}`);
console.error(`[Session Runner] Unexpected error...`);

❌ NO STRUCTURED LOGGING
❌ NO METRICS ENDPOINT
❌ NO HEALTH CHECKS
❌ NO AUDIT TRAIL
```

#### Planned Implementation (Week 6, Tasks T122-T140):

```typescript
❌ COMPREHENSIVE MONITORING (not implemented):
- Structured logging with pino/winston
- GET /api/metrics (queue depth, processing time, p95)
- GET /api/health (worker count, stuck jobs)
- JobEvent audit trail table
- Optional Grafana dashboards
```

**Inconsistency**: Architecture document emphasizes observability, but implementation has minimal logging.

---

### 9. ID Generation Consistency

#### ✅ **FULLY CONSISTENT** (Phase 7 completed)

All components correctly use database-generated IDs:

**Schema**:

```prisma
✅ All models have: id String @id @default(uuid())
✅ All models have: llmSourceId String? (for LLM debugging)
```

**Code**:

```typescript
✅ savePlay() omits manual IDs (plays-db-prisma.ts)
✅ Schema IDs all optional (parse/schemas.ts)
✅ contextToPlaybook() doesn't generate IDs (incremental-parser.ts)
✅ Character mapping uses llmSourceId → dbId
✅ Seed scripts use savePlay() (seed.ts, init-db.ts)
```

**Status**: Requirements FR-021 through FR-025 **COMPLETED** ✅

---

### 10. Documentation Consistency

#### Specification Documents:

**spec.md**:

- ✅ Lists FR-021 to FR-025 as **COMPLETED**
- ✅ Documents Future Enhancements (Job Management)
- ✅ Links to PARSING_JOB_ARCHITECTURE.md

**plan.md**:

- ✅ Documents completed ID refactoring
- ✅ Lists job redesign as "In Progress"
- ✅ Constitution check with privacy exception
- ✅ Complete project structure (current + planned)

**tasks.md**:

- ✅ Phases 1-7 marked complete
- ✅ Phase 8 broken down into 150 tasks (T055-T150)
- ✅ Weekly checkpoints defined
- ✅ Parallel opportunities identified

**PARSING_JOB_ARCHITECTURE.md**:

- ✅ Current architecture analysis complete
- ✅ Problems identified (7 major issues)
- ✅ Proposed redesign with diagrams
- ✅ 6-week implementation plan
- ✅ Success metrics defined

**Consistency**: ✅ **Documentation is internally consistent**

**Problem**: ⚠️ **Documentation describes future state, not current state**

---

## Inconsistency Summary Table

| Component        | Spec/Plan               | Implementation                      | Status      | Gap                         |
| ---------------- | ----------------------- | ----------------------------------- | ----------- | --------------------------- |
| ID Generation    | FR-021 to FR-025        | savePlay(), llmSourceId pattern     | ✅ ALIGNED  | None                        |
| Database Schema  | ParseJob model          | ParsingSession model                | ❌ MISMATCH | 150 lines schema missing    |
| Job Queue        | JobQueue service        | Direct execution                    | ❌ MISSING  | src/lib/jobs/ doesn't exist |
| Worker Pool      | JobWorker class         | Fire-and-forget async               | ❌ MISSING  | No worker management        |
| State Machine    | 7-state JobStatus       | 6-state ParsingStatus               | ❌ MISMATCH | Missing paused, retrying    |
| Distributed Lock | workerId + lockExpiry   | In-memory Set                       | ❌ MISSING  | Not multi-instance safe     |
| Retry Logic      | Exponential backoff     | None                                | ❌ MISSING  | Manual restart only         |
| Job Control APIs | 8 new endpoints         | 0 implemented                       | ❌ MISSING  | src/app/api/jobs/ empty     |
| Monitoring       | Metrics + health checks | Console logs only                   | ❌ MISSING  | No observability            |
| Parse Pipeline   | Unified pipeline        | Dual-path (streaming + incremental) | ❌ MISMATCH | Code duplication            |

---

## Priority Recommendations

### Critical (Fix Immediately)

1. **Update plan.md status**: Change "In Progress" to "Planned - Not Started" for Phase 8
2. **Add implementation status header** to PARSING_JOB_ARCHITECTURE.md clarifying it's a design doc, not reality

### High (Before Starting Phase 8)

3. **Create Phase 8 kickoff checklist** in tasks.md with prerequisites validation
4. **Document rollback plan** in case Phase 8 implementation needs to revert
5. **Validate test coverage** for Phase 7 (ID generation) before proceeding

### Medium (During Phase 8)

6. **Add weekly status updates** to plan.md tracking actual vs planned progress
7. **Create migration validation script** to verify ParsingSession → ParseJob data integrity
8. **Document breaking changes** that will affect existing users with in-progress parses

### Low (Post-Phase 8)

9. **Archive old code** (session-runner.ts, ParsingSession) in separate branch before deletion
10. **Update quickstart.md** with new job queue architecture examples

---

## Validation Checklist

Before starting Phase 8 implementation, verify:

- [ ] All Phase 7 tasks (T047-T054) marked complete and tested
- [ ] Database has no orphaned ParsingSession records
- [ ] All imports reference `plays-db-prisma` (not old patterns)
- [ ] ID generation pattern tested with >100 plays
- [ ] No duplicate key errors in last 7 days
- [ ] Seed scripts working correctly with savePlay()
- [ ] Git branch clean (no uncommitted Phase 7 changes)
- [ ] Phase 8 design approved by stakeholders
- [ ] Team capacity confirmed for 6-week sprint

---

## Next Actions

1. **Update Documentation**:

   - Add "Status: Design Only" banner to PARSING_JOB_ARCHITECTURE.md
   - Change plan.md Phase 8 from "In Progress" to "Planned"
   - Add Phase 7 completion date to tasks.md

2. **Validate Phase 7**:

   - Run integration tests on ID generation
   - Check for any remaining UUID collision issues
   - Verify llmSourceId fields populated correctly

3. **Prepare for Phase 8**:

   - Review tasks.md with team
   - Estimate effort for each week
   - Set up feature branch `002-llm-play-parser-job-queue`
   - Create Week 1 sprint board

4. **Risk Assessment**:
   - Test current dual-path execution under load
   - Document failure scenarios (what happens if server crashes during parse?)
   - Plan data migration strategy (preserve in-progress ParsingSession data)

---

## Conclusion

The project has **strong internal documentation consistency** but a **significant gap between planned and implemented architecture**.

Phase 7 (ID Generation) is ✅ **COMPLETE and CONSISTENT** across all artifacts.

Phase 8 (Job Architecture Redesign) is 📝 **WELL-PLANNED but NOT STARTED**. All 150 tasks exist only in planning documents. No database migrations, no new code, no API endpoints created.

**Recommendation**: Update documentation to clearly distinguish between "completed work" (Phases 1-7) and "planned work" (Phase 8) to avoid confusion about project state.

**Risk Level**: 🟡 **MEDIUM** - Current system functional but lacks reliability/observability features described in architecture docs. Users may assume features exist when they're only planned.

**Action Required**: Before external communication, clarify that job management features (pause/resume/cancel, retry logic, distributed locking, monitoring) are **roadmap items, not current capabilities**.
