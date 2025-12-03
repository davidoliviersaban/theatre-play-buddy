# Phase 8 Implementation Guide

**Feature**: Job Architecture Redesign  
**Duration**: 6 weeks  
**Tasks**: T055-T150 (96 tasks)  
**Start Date**: TBD  
**Status**: Ready to begin

---

## Pre-Implementation Checklist

Before starting Phase 8, verify all Phase 7 work is complete and stable:

### ✅ Phase 7 Validation

- [ ] All ID generation changes deployed to production
- [ ] Database has no duplicate key errors in last 7 days
- [ ] `llmSourceId` fields populated correctly in all tables
- [ ] `savePlay()` function tested with 100+ plays
- [ ] Seed scripts (`seed.ts`, `init-db.ts`) working correctly
- [ ] No orphaned `ParsingSession` records in database
- [ ] Git branch clean, all Phase 7 commits merged
- [ ] Code review completed for Phase 7 changes

### 📋 Team Readiness

- [ ] Team capacity confirmed for 6-week sprint
- [ ] Stakeholders reviewed and approved architecture design
- [ ] Database backup strategy confirmed (can rollback if needed)
- [ ] Feature flag strategy agreed upon (shadow mode → gradual rollout)
- [ ] Monitoring tools ready (logging, metrics dashboards)

### 🔧 Environment Setup

- [ ] Development environment: Docker PostgreSQL 17 running
- [ ] Staging environment: Available for parallel run testing
- [ ] Production environment: Feature flag infrastructure ready
- [ ] CI/CD pipeline: Automated tests for job queue functionality
- [ ] Dependencies installed: pino (logging), latest Prisma

---

## Week-by-Week Implementation Plan

### Week 1: Database Migration (Dec 2-8, 2024)

**Goal**: Replace `ParsingSession` with `ParseJob` model

**Tasks**: T055-T066 (12 tasks)  
**Deliverable**: New schema deployed, migration script tested, zero compilation errors

#### Daily Breakdown:

**Monday (Dec 2)**:

- Morning: T055-T061 - Create `ParseJob` model schema
  - Define all fields in `prisma/schema.prisma`
  - Add `JobType` and `JobStatus` enums
  - Add indexes for efficient querying
- Afternoon: T062 - Run migration
  - `npx prisma migrate dev --name add_parse_job_model`
  - Verify schema in database
  - Generate Prisma client

**Tuesday (Dec 3)**:

- Morning: T063 - Write data migration script
  - Create `scripts/migrate-parsing-session-to-parse-job.ts`
  - Map old `ParsingStatus` to new `JobStatus`
  - Preserve `currentState` JSON for resume
- Afternoon: T064 - Test migration
  - Create database backup
  - Run migration on copy
  - Verify all fields mapped correctly
  - Check for data loss

**Wednesday (Dec 4)**:

- Morning: T065 - Rename `parsing-session-db.ts` → `parse-job-db.ts`
  - Copy file to new name
  - Update function signatures (ParsingSession → ParseJob)
  - Keep old file for reference
- Afternoon: T066 - Update all imports
  - Search: `import.*parsing-session-db`
  - Replace with: `parse-job-db`
  - Fix TypeScript errors

**Thursday (Dec 5)**:

- Full day: Testing & validation
  - Run full test suite
  - Verify no TypeScript errors
  - Test CRUD operations on ParseJob
  - Ensure backward compatibility (old endpoints still work)

**Friday (Dec 6)**:

- Morning: Code review
  - Submit PR for Week 1 changes
  - Address review comments
- Afternoon: Deploy to staging
  - Run migration on staging DB
  - Smoke test all endpoints

**Checkpoint Week 1**:

- ✅ `ParseJob` model exists in schema
- ✅ Migration tested and documented
- ✅ All imports updated
- ✅ Zero compilation errors
- ✅ Staging environment validated

---

### Week 2: Job Queue Infrastructure (Dec 9-15, 2024)

**Goal**: Implement job queue with distributed locking and retry logic

**Tasks**: T067-T078 (12 tasks)  
**Deliverable**: `JobQueue` service operational, state machine validated, unit tests passing

#### Daily Breakdown:

**Monday (Dec 9)**:

- Morning: T067-T069 - Create foundational files
  - `src/lib/jobs/queue.ts` - JobQueue class skeleton
  - `src/lib/jobs/state-machine.ts` - VALID_TRANSITIONS map
  - `src/lib/jobs/types.ts` - TypeScript interfaces
- Afternoon: T070 - Implement `enqueue()`
  - Create ParseJob with status=queued
  - Set priority, config, timestamps
  - Return jobId

**Tuesday (Dec 10)**:

- Morning: T071 - Implement `claimNext()`
  - Transaction to find highest-priority job
  - Atomic lock acquisition (set workerId, lockExpiry)
  - Handle expired locks (reclaim)
- Afternoon: Test `claimNext()` edge cases
  - No jobs available → return null
  - Multiple workers → no duplicate claims
  - Lock expiration → automatic reclaim

**Wednesday (Dec 11)**:

- Morning: T072-T073 - Implement lock management
  - `renewLock()` - Extend lockExpiry for heartbeat
  - `complete()` - Update status, clear lock
- Afternoon: T074 - Implement `updateProgress()`
  - Update completedChunks, progress, currentState
  - Test checkpoint saving

**Thursday (Dec 12)**:

- Morning: T075-T076 - State machine and retry logic
  - `assertTransition()` - Validate state changes
  - `handleFailure()` - Exponential backoff calculation
- Afternoon: Test retry scenarios
  - Transient failure → retry
  - Max retries exceeded → permanent failure
  - Backoff delays calculated correctly

**Friday (Dec 13)**:

- Morning: T077-T078 - Unit tests
  - `tests/jobs/state-machine.test.ts`
  - `tests/jobs/queue.test.ts`
  - Coverage > 90%
- Afternoon: Code review and deploy to staging

**Checkpoint Week 2**:

- ✅ JobQueue service operational
- ✅ Distributed locking works
- ✅ Retry logic with exponential backoff tested
- ✅ Unit tests passing (>90% coverage)
- ✅ State transitions validated

---

### Week 3: Worker Pool (Dec 16-22, 2024)

**Goal**: Create managed worker pool with heartbeat and graceful shutdown

**Tasks**: T079-T090 (12 tasks)  
**Deliverable**: Workers executing jobs, heartbeat renewing locks, graceful shutdown working

#### Daily Breakdown:

**Monday (Dec 16)**:

- Morning: T079-T080 - Create worker infrastructure
  - `src/lib/jobs/worker.ts` - JobWorker class
  - `src/lib/jobs/bootstrap.ts` - startWorkers() function
- Afternoon: T081 - Implement `start()` polling loop
  - While loop calling `queue.claimNext()`
  - Sleep 5s if no jobs available
  - Execute job when claimed

**Tuesday (Dec 17)**:

- Morning: T082-T083 - Implement lifecycle management
  - `stop()` - Set running=false, wait for current job
  - `startHeartbeat()` - setInterval every 60s
  - Test heartbeat renews lock
- Afternoon: T084 - Implement `executeParseJob()`
  - Call parse pipeline (stub for now)
  - Update progress callback
  - Handle success/failure

**Wednesday (Dec 18)**:

- Morning: T085-T086 - Worker bootstrap
  - `startWorkers(count)` - Create N workers
  - SIGTERM handler - Graceful shutdown
  - Test multiple workers don't claim same job
- Afternoon: T087-T088 - Next.js integration
  - Add `src/instrumentation.ts`
  - Call `startWorkers()` on app start
  - Add `WORKER_COUNT` environment variable

**Thursday (Dec 19)**:

- Morning: T089 - Add structured logging
  - Log worker lifecycle: started, job claimed, completed, stopped
  - Use consistent log format
- Afternoon: T090 - Local testing
  - Start server, verify 2 workers log startup
  - Enqueue test job, verify claim and execution
  - Test graceful shutdown with SIGTERM

**Friday (Dec 20)**:

- Full day: Integration testing
  - Test worker pool with multiple concurrent jobs
  - Test lock renewal (long-running job)
  - Test worker crash recovery (kill process mid-job)
  - Code review and staging deployment

**Checkpoint Week 3**:

- ✅ Worker pool executing jobs
- ✅ Heartbeat mechanism working
- ✅ Graceful shutdown tested
- ✅ Multiple workers no duplicate claims
- ✅ Lock expiration and reclaim working

---

### Week 4: Unified Parse Pipeline (Dec 23-29, 2024)

**Goal**: Consolidate dual-path execution into single pipeline, remove streaming path

**Tasks**: T091-T104 (14 tasks)  
**Deliverable**: All parses use job queue, dual-path eliminated, short and long plays tested

#### Daily Breakdown:

**Monday (Dec 23)**:

- Morning: T091-T093 - Parse pipeline foundation
  - Create `src/lib/jobs/parse-pipeline.ts`
  - Implement text extraction step (use job.rawText)
  - Implement chunking step (always chunk, no streaming)
- Afternoon: T094-T095 - Incremental parsing integration
  - Restore context from `job.currentState`
  - Call `parsePlayIncrementally()` with checkpoint callback

**Tuesday (Dec 24)** - Holiday (if applicable, shift schedule):

- T096-T097 - Progress and error handling
  - Emit progress callback with chunksCompleted
  - Checkpoint currentState on error for resume

**Wednesday (Dec 25)** - Holiday (if applicable):

- (No work or catch-up day)

**Thursday (Dec 26)**:

- Morning: T098-T099 - Validation and persistence
  - Convert context to playbook
  - Validate with PlaybookSchema
  - Call `savePlay()` on success
- Afternoon: T100-T101 - Remove dual-path
  - Delete streaming path logic from `parse/route.ts`
  - Simplify to: enqueue job → return jobId

**Friday (Dec 27)**:

- Morning: T102 - Add resume support
  - Accept `resumeJobId` parameter
  - Load existing job, verify status
- Afternoon: T103-T104 - Testing
  - Test short play (<20KB) through job queue
  - Test long play (>100KB) with chunking
  - Verify progress updates work

**Checkpoint Week 4**:

- ✅ Dual-path eliminated
- ✅ All parses use job queue
- ✅ Unified pipeline tested with short and long plays
- ✅ Progress updates working
- ✅ Resume capability maintained

---

### Week 5: Job Control APIs (Dec 30-Jan 5, 2025)

**Goal**: Build REST APIs for job management, integrate frontend

**Tasks**: T105-T121 (17 tasks)  
**Deliverable**: Pause/resume/cancel working, frontend polling job status

#### Daily Breakdown:

**Monday (Dec 30)**:

- Morning: T105-T109 - Create API routes
  - `src/app/api/jobs/route.ts` (POST create, GET list)
  - `src/app/api/jobs/[id]/route.ts` (GET status)
  - `src/app/api/jobs/[id]/pause/route.ts`
  - `src/app/api/jobs/[id]/resume/route.ts`
  - `src/app/api/jobs/[id]/cancel/route.ts`
- Afternoon: T110 - Implement GET /api/jobs/:id
  - Find job by ID
  - Return status, progress, timestamps

**Tuesday (Dec 31)**:

- Morning: T111-T113 - Implement job control
  - POST /pause - Validate transition, update status
  - POST /resume - Re-queue job (status=queued)
  - POST /cancel - Set status=cancelled, completedAt
- Afternoon: T114 - Implement GET /api/jobs
  - Filter by status query param
  - Order by createdAt desc
  - Limit 50 results

**Wednesday (Jan 1)** - Holiday:

- (No work or testing/documentation catch-up)

**Thursday (Jan 2)**:

- Morning: T115-T116 - Frontend integration
  - Create `src/hooks/use-job-status.ts`
  - Poll job status every 2s
  - Update `parse-progress.tsx` to use polling (remove SSE)
- Afternoon: T117-T118 - UI controls
  - Add pause/resume/cancel buttons
  - Wire up API calls
  - Update import page to handle jobId response

**Friday (Jan 3)**:

- Morning: T119-T121 - End-to-end testing
  - Test pause: upload play, click pause, verify worker stops
  - Test resume: paused job, click resume, verify continues from checkpoint
  - Test cancel: running job, click cancel, verify aborted

**Checkpoint Week 5**:

- ✅ Job control APIs operational
- ✅ Frontend integrated with polling
- ✅ Pause/resume/cancel tested end-to-end
- ✅ UI shows real-time job status

---

### Week 6: Monitoring & Observability (Jan 6-12, 2025)

**Goal**: Add structured logging, metrics, health checks, audit trail

**Tasks**: T122-T140 (19 tasks)  
**Deliverable**: Production-ready observability, metrics endpoint, health checks

#### Daily Breakdown:

**Monday (Jan 6)**:

- Morning: T122-T124 - Logging infrastructure
  - Install `pino` and `pino-pretty`
  - Create `src/lib/jobs/logger.ts`
  - Create `JobEvent` audit trail model
  - Run migration for JobEvent table
- Afternoon: T126-T127 - Add structured logging
  - Log job lifecycle in worker
  - Log queue operations
  - Use JSON format in production, pretty in dev

**Tuesday (Jan 7)**:

- Morning: T128-T129 - Audit trail
  - Create `src/lib/jobs/audit.ts`
  - Implement `logJobEvent()` helper
  - Call on key transitions (enqueued, claimed, paused, etc.)
- Afternoon: Test audit trail
  - Execute full job lifecycle
  - Query JobEvent table
  - Verify all transitions logged

**Wednesday (Jan 8)**:

- Morning: T130-T132 - Metrics endpoint
  - Create `GET /api/metrics`
  - Implement `getAvgProcessingTime()`
  - Implement `getP95ProcessingTime()`
  - Return queue depth, running jobs, completed, failed
- Afternoon: Test metrics
  - Enqueue 10 jobs
  - Verify counts accurate
  - Check processing time calculations

**Thursday (Jan 9)**:

- Morning: T133-T135 - Health check
  - Create `GET /api/health`
  - Implement `src/lib/jobs/health.ts`
  - Check active workers, oldest queued job, stuck jobs
  - Return 503 if unhealthy
- Afternoon: Test health checks
  - Stop workers → verify unhealthy
  - Long queue → verify unhealthy
  - Stuck job → verify unhealthy

**Friday (Jan 10)**:

- Morning: T136-T137 - Optional monitoring
  - Create Grafana dashboard config (optional)
  - Document monitoring setup
- Afternoon: T138-T140 - Final validation
  - Test metrics endpoint
  - Test health endpoint
  - Verify audit trail complete

**Checkpoint Week 6**:

- ✅ Structured logging operational
- ✅ Metrics endpoint returning accurate data
- ✅ Health checks functional
- ✅ Audit trail complete
- ✅ Production-ready observability

---

### Rollout Phase: Parallel Run & Cutover (Jan 13-26, 2025)

**Goal**: Deploy to production safely with gradual rollout

**Tasks**: T141-T150 (10 tasks)  
**Duration**: 2 weeks  
**Deliverable**: New job system live in production, old code removed

#### Week 7: Shadow Mode (Jan 13-19)

**Monday (Jan 13)**:

- T141-T142 - Feature flag setup
  - Add `USE_JOB_QUEUE` env variable
  - Implement shadow mode (enqueue job but still use old path)
  - Deploy to staging

**Tuesday (Jan 14)**:

- T143-T144 - Shadow mode validation
  - Run for 24 hours
  - Compare job results with old path
  - Check for any errors

**Wednesday-Friday (Jan 15-17)**:

- Monitor shadow mode
  - Verify all uploads processed by both paths
  - Results match 100%
  - Fix any discrepancies

#### Week 8: Gradual Rollout (Jan 20-26)

**Monday (Jan 20)**:

- T145 - Enable 10% rollout
  - Set `USE_JOB_QUEUE=10`
  - Deploy to production
  - Monitor error rates every hour

**Tuesday (Jan 21)**:

- Monitor 10% traffic
  - Error rate < 1%
  - Processing time comparable
  - No stuck jobs

**Wednesday (Jan 22)**:

- T146 - Increase to 50% rollout
  - Set `USE_JOB_QUEUE=50`
  - Deploy
  - Monitor for 48 hours

**Thursday-Friday (Jan 23-24)**:

- Monitor 50% traffic
  - Verify metrics stable
  - Check queue depth manageable
  - Worker utilization 60-80%

**Monday (Jan 27)**:

- T147 - Full cutover
  - Set `USE_JOB_QUEUE=true` (100%)
  - Deploy
  - Monitor closely for 1 week

**Week 9: Cleanup (Feb 3-7)**

**Monday (Feb 3)**:

- T148-T150 - Remove old code
  - Delete dual-path logic from parse/route.ts
  - Remove ParsingSession model
  - Delete session-runner.ts
  - Create deprecation migration

**Checkpoint Rollout**:

- ✅ Shadow mode validated (100% match)
- ✅ Gradual rollout successful (10% → 50% → 100%)
- ✅ New job system live in production
- ✅ Old code removed
- ✅ Zero regressions

---

## Success Criteria

Track these metrics throughout rollout:

### Reliability

- [ ] Job success rate > 99%
- [ ] Failed jobs auto-retry < 5% of cases
- [ ] Zero jobs stuck > 1 hour

### Performance

- [ ] P95 job processing time < 5 minutes (no regression)
- [ ] Queue depth < 10 jobs during normal operation
- [ ] Worker utilization 60-80%

### Observability

- [ ] MTTD job failures < 1 minute
- [ ] MTTR stuck jobs < 5 minutes
- [ ] Zero manual interventions per day

### User Experience

- [ ] Pause/resume works reliably
- [ ] Cancel immediately stops processing
- [ ] Progress updates accurate within 5 seconds

---

## Risk Mitigation

### High-Risk Areas

1. **Database Migration (Week 1)**

   - Risk: Data loss during ParsingSession → ParseJob migration
   - Mitigation: Test on copy, backup before migration, keep old table for 1 week

2. **Distributed Locking (Week 2)**

   - Risk: Duplicate job execution with multiple workers
   - Mitigation: Extensive unit tests, manual testing with 5+ concurrent workers

3. **Dual-Path Removal (Week 4)**

   - Risk: Short plays fail when moved to job queue
   - Mitigation: Comprehensive testing with plays <1KB to >1MB

4. **Production Cutover (Week 7-8)**
   - Risk: New system has unknown bugs
   - Mitigation: Shadow mode for 1 week, gradual rollout with immediate rollback capability

### Rollback Procedure

If critical issues occur during rollout:

1. **Immediate**: Set `USE_JOB_QUEUE=false` in environment
2. **Within 1 hour**: Deploy previous version
3. **Within 24 hours**: Root cause analysis
4. **Within 1 week**: Fix and re-deploy

---

## Testing Strategy

### Unit Tests (Throughout Implementation)

- State machine transitions (Week 2)
- Queue operations (enqueue, claim, renew, complete) (Week 2)
- Worker lifecycle (start, stop, heartbeat) (Week 3)
- Parse pipeline steps (Week 4)

**Target**: >90% code coverage on new files

### Integration Tests (Week 4-5)

- End-to-end: upload → enqueue → worker claim → parse → complete
- Pause/resume from checkpoint
- Cancel mid-execution
- Failure → retry → success

**Target**: All user flows tested

### Performance Tests (Week 6)

- 10 concurrent uploads
- 100 jobs in queue
- Lock expiration and reclaim
- Worker pool under load

**Target**: P95 < 5 minutes, queue depth < 10

### Production Validation (Week 7-9)

- Shadow mode: 100% jobs processed correctly
- Gradual rollout: error rates <1%
- Full cutover: no regressions

**Target**: Zero production incidents

---

## Communication Plan

### Stakeholder Updates

**Weekly Status Email** (Every Friday):

- Tasks completed this week
- Blockers encountered
- Next week's goals
- Risk assessment

**Demo Sessions**:

- Week 2: Job queue demo (enqueue, claim, complete)
- Week 4: Unified pipeline demo (short + long plays)
- Week 5: Job control UI demo (pause/resume/cancel)
- Week 8: Production cutover celebration 🎉

### Documentation Updates

- [ ] Update README with new job queue architecture
- [ ] Add monitoring runbook (how to interpret metrics)
- [ ] Create troubleshooting guide (stuck jobs, failed retries)
- [ ] Update API documentation with new /api/jobs endpoints

---

## Resource Requirements

### Team Allocation

**Backend Engineer** (6 weeks full-time):

- Weeks 1-3: Database, queue, workers
- Weeks 4-5: Pipeline, APIs
- Week 6: Monitoring

**Frontend Engineer** (2 weeks part-time):

- Week 5: Job status polling, UI controls
- Week 6: Testing

**DevOps** (1 week part-time):

- Week 6: Monitoring setup
- Weeks 7-8: Rollout support

### Infrastructure

- Staging environment: 2 workers, PostgreSQL
- Production environment: 2-4 workers (scale based on load)
- Monitoring: Pino logs, custom metrics endpoint

---

## Next Steps

1. **Review this guide** with team
2. **Set start date** for Week 1
3. **Create sprint board** with all 96 tasks
4. **Set up daily standup** (15 min sync)
5. **Schedule stakeholder demos** (Weeks 2, 4, 5, 8)
6. **Prepare development environment** (Docker, PostgreSQL, latest dependencies)
7. **Begin Week 1** when ready! 🚀

---

**Questions or concerns?** Review [PARSING_JOB_ARCHITECTURE.md](../../PARSING_JOB_ARCHITECTURE.md) for technical details or [CONSISTENCY_ANALYSIS.md](../../CONSISTENCY_ANALYSIS.md) for current state validation.
