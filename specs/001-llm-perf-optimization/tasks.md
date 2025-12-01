# Tasks: LLM Parsing Performance Optimization

**Input**: Design documents from `/specs/001-llm-perf-optimization/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Feature Goal**: Reduce 100-page play parsing time from 10 minutes to <3 minutes while maintaining 95%+ accuracy, with first progress update <30 seconds

**Organization**: Tasks organized by user story to enable independent implementation and testing

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1, US2, US3)
- File paths use Next.js App Router structure (`src/app/`, `src/lib/`, `src/components/`)

---

## Phase 1: Setup

**Purpose**: Project infrastructure and database schema

- [x] T001 Create feature branch `001-llm-perf-optimization` from main
- [x] T002 Add ParsingSession model to `prisma/schema.prisma` with fields: id, playbookId, filename, rawText, status (enum), currentChunk, totalChunks, startedAt, completedAt, failureReason
- [x] T003 Run migration `npx prisma migrate dev --name add_parsing_session` and generate client
- [x] T004 [P] Create `src/lib/db/parsing-session-db.ts` with stub functions (empty implementations)
- [x] T005 [P] Create `src/components/import/failed-imports-list.tsx` with stub component
- [x] T006 [P] Create `src/app/api/import/failed/route.ts` with stub endpoint

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST complete before any user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Implement `createParsingSession()` in `src/lib/db/parsing-session-db.ts`
- [x] T008 Implement `updateParsingSession()` in `src/lib/db/parsing-session-db.ts`
- [x] T009 [P] Implement `getFailedSessions()` in `src/lib/db/parsing-session-db.ts`
- [x] T010 [P] Implement `getSessionForResume()` in `src/lib/db/parsing-session-db.ts`
- [x] T011 [P] Implement `deleteCompletedSessions()` in `src/lib/db/parsing-session-db.ts`
- [x] T012 Add timing measurements to `src/lib/parse/incremental-parser.ts` (startTime, chunk timing, avgChunkTime, estimatedRemaining)
- [x] T013 Update `parsePlayIncrementally()` signature in `src/lib/parse/incremental-parser.ts` to accept optional `onSave` callback parameter

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Fast Initial Feedback (Priority: P1) 🎯 MVP

**Goal**: Users receive first parsing progress update within 30 seconds, showing percentage, pages, characters

**Independent Test**: Upload 100-page play, verify first progress update appears in <30 seconds with specific details (2/40 pages, 5 characters found)

### Implementation for User Story 1

- [x] T014 [P] [US1] Modify `src/app/import/api/parse/route.ts` to create ParsingSession on new upload (store filename, rawText, totalChunks)
- [x] T015 [P] [US1] Add session ID emission to SSE stream in `src/app/import/api/parse/route.ts` (emit "session_created" event with sessionId, totalChunks)
- [ ] T016 [US1] Implement `onSave` callback in `src/app/import/api/parse/route.ts` that calls `savePlay()` and `updateParsingSession()` after each chunk
- [ ] T017 [US1] Update progress event emission in `src/app/import/api/parse/route.ts` to send every chunk completion (current chunk, characters, lines)
- [ ] T018 [US1] Add timing logs to show chunk processing time and estimated time remaining in `src/lib/parse/incremental-parser.ts`
- [ ] T019 [US1] Update `src/components/import/parse-progress.tsx` to display chunk progress (X/Y chunks), character count, line count, ETA

**Checkpoint**: User Story 1 complete - users see progress updates within 30 seconds ✅

---

## Phase 4: User Story 2 - Reduced Total Processing Time (Priority: P2)

**Goal**: Complete 100-page play parsing in <3 minutes (currently 10 minutes), 70% reduction

**Independent Test**: Upload 100-page play, measure end-to-end time, verify <3 minutes

**Note**: This story focuses on performance optimizations that don't break existing functionality

### Implementation for User Story 2

- [ ] T020 [P] [US2] Create `src/lib/parse/cache-warmer.ts` with `warmCache()` function using Anthropic prompt caching (max_tokens=1, cachePoint marker)
- [ ] T021 [P] [US2] Create `src/lib/parse/chunk-splitter.ts` with `smartChunkSplit()` function to split on act/scene boundaries
- [ ] T022 [US2] Modify `src/lib/parse/llm-parser.ts` to add `cacheWarmed` parameter and reuse message structure for cache hits
- [ ] T023 [US2] Update `src/app/import/api/parse/route.ts` to call `warmCache()` during file upload (before parsing starts)
- [ ] T024 [US2] Replace `splitIntoChunks()` with `smartChunkSplit()` in `src/lib/parse/incremental-parser.ts`
- [ ] T025 [US2] Add cache metrics logging to `src/lib/parse/llm-parser.ts` (cacheReadTokens, cacheWriteTokens from providerMetadata)
- [ ] T026 [US2] Log total parsing time summary in `src/lib/parse/incremental-parser.ts` (total time, avg chunk time, speedup percentage)

**Checkpoint**: User Story 2 complete - parsing completes in <3 minutes ✅

---

## Phase 5: User Story 3 - Transparent Progress Visibility (Priority: P3)

**Goal**: Display detailed progress including act/scene location, characters discovered, line counts

**Independent Test**: Upload multi-act play, verify UI shows "Currently parsing: Act 2, Scene 3", character list, line count

### Implementation for User Story 3

- [ ] T027 [P] [US3] Create `src/hooks/use-parsing-progress.ts` with EventSource hook for SSE progress updates
- [ ] T028 [P] [US3] Update `src/lib/parse/incremental-parser.ts` to include actSceneLocation in yielded context
- [ ] T029 [US3] Modify `src/app/import/api/parse/route.ts` to emit character_found events when new characters discovered
- [ ] T030 [US3] Modify `src/app/import/api/parse/route.ts` to emit act_complete and scene_complete events
- [ ] T031 [US3] Update `src/components/import/parse-progress.tsx` to use `useParsingProgress` hook and display all details
- [ ] T032 [US3] Add memoized rendering to `src/components/import/parse-progress.tsx` using React.memo for performance
- [ ] T033 [US3] Style progress display in `src/components/import/parse-progress.tsx` with character list, act/scene indicator, progress bar

**Checkpoint**: User Story 3 complete - users see detailed parsing progress ✅

---

## Phase 6: Error Recovery & Failed Imports UI

**Goal**: Display failed imports in UI with restart capability, enable resume from last successful chunk

**Independent Test**: Simulate parsing failure (kill process at chunk 58/60), verify failed import appears in UI, click restart button, verify resumes from chunk 59

### Implementation

- [ ] T034 [P] Implement `FailedImportsList` component in `src/components/import/failed-imports-list.tsx` with loading state, empty state, restart button
- [ ] T035 [P] Implement GET handler in `src/app/api/import/failed/route.ts` that calls `getFailedSessions()`
- [ ] T036 Add failed imports list to `src/app/import/page.tsx` below file upload section
- [ ] T037 Update `src/app/import/api/parse/route.ts` to handle `resumeSessionId` parameter and call `getSessionForResume()`
- [ ] T038 Update `src/app/import/api/parse/route.ts` to mark session as FAILED with failureReason on catch block
- [ ] T039 Update `src/app/import/api/parse/route.ts` to mark session as COMPLETED and call `deleteCompletedSessions()` on success
- [ ] T040 Modify `src/lib/parse/incremental-parser.ts` to accept `startChunk` parameter for resume functionality
- [ ] T041 Add restart click handler in `src/components/import/failed-imports-list.tsx` that POSTs to `/api/import/parse` with resumeSessionId

**Checkpoint**: Failed imports UI complete - users can restart from last state ✅

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements affecting multiple features

- [ ] T042 [P] Add error handling for DB save failures in `src/app/import/api/parse/route.ts` (log but continue parsing)
- [ ] T043 [P] Add validation for resume session (check timestamp <24 hours) in `src/lib/db/parsing-session-db.ts`
- [ ] T044 [P] Add logging for session lifecycle events (created, updated, completed, failed) in `src/lib/db/parsing-session-db.ts`
- [ ] T045 Update quickstart.md with actual implementation details and checkpoint validation steps
- [ ] T046 Add performance metrics collection to track cache hit rate, avg chunk time, total time in `src/app/import/api/parse/route.ts`
- [ ] T047 Test end-to-end workflow: upload → progress → completion → DB save → session cleanup
- [ ] T048 Test resume workflow: upload → partial parse → crash → view failed imports → restart → completion

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001-T006)
- **User Story 1 (Phase 3)**: Depends on Foundational (T007-T013)
- **User Story 2 (Phase 4)**: Depends on Foundational - can run in parallel with US1
- **User Story 3 (Phase 5)**: Depends on Foundational - can run in parallel with US1/US2
- **Error Recovery (Phase 6)**: Depends on Foundational - can run in parallel with other stories
- **Polish (Phase 7)**: Depends on all desired user stories

### Task Dependencies

**Setup Phase**:

- T001 must complete before all other tasks
- T002 must complete before T003
- T003 must complete before T007-T013 (DB code needs generated types)

**Foundational Phase**:

- T007-T011 can run in parallel (different functions in same file)
- T012-T013 can run in parallel with T007-T011 (different files)

**User Story 1**:

- T014-T015 can run in parallel (different parts of same file)
- T016 depends on T013 (needs onSave callback signature)
- T017-T019 can run after T014-T016

**User Story 2**:

- T020-T022 can all run in parallel (different files)
- T023-T024 can run after T020-T022
- T025-T026 can run in parallel with T023-T024

**User Story 3**:

- T027-T028 can run in parallel
- T029-T030 can run in parallel (same file, different events)
- T031-T033 must run sequentially (same file modifications)

**Error Recovery**:

- T034-T035 can run in parallel
- T036-T041 must follow after T034-T035

### Parallel Opportunities

Within each phase, tasks marked [P] can run simultaneously:

**Phase 1**: T004, T005, T006 (3 parallel)
**Phase 2**: T009-T011 parallel, T012-T013 parallel (2 groups)
**Phase 3**: T014-T015 parallel (2 parallel)
**Phase 4**: T020-T022 parallel (3 parallel), T025-T026 parallel (2 parallel)
**Phase 5**: T027-T028 parallel (2 parallel), T029-T030 parallel (2 parallel)
**Phase 6**: T034-T035 parallel (2 parallel)
**Phase 7**: T042-T044 parallel (3 parallel)

---

## Parallel Example: User Story 2

```bash
# Launch all optimization files together:
Developer A: "Create src/lib/parse/cache-warmer.ts with warmCache()"
Developer B: "Create src/lib/parse/chunk-splitter.ts with smartChunkSplit()"
Developer C: "Modify src/lib/parse/llm-parser.ts for cache support"

# Then integrate:
Developer A: "Update src/app/import/api/parse/route.ts to call warmCache()"
Developer B: "Replace splitIntoChunks() in incremental-parser.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. ✅ Complete Phase 1: Setup
2. ✅ Complete Phase 2: Foundational
3. ✅ Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Upload 100-page play, verify first progress <30 seconds
5. Demo to stakeholders - working progress updates!

### Incremental Delivery

1. Foundation (Setup + Foundational) → 48 tasks total
2. Add US1 (Fast Initial Feedback) → Users see progress in <30s ✅ MVP!
3. Add US2 (Performance) → Parsing completes <3 min ✅
4. Add US3 (Detailed Progress) → Rich progress UI ✅
5. Add Error Recovery → Restart failed imports ✅
6. Polish → Production ready ✅

Each phase adds value without breaking previous work.

### Parallel Team Strategy

With 3 developers after Foundational phase completes:

- **Developer A**: User Story 1 (T014-T019)
- **Developer B**: User Story 2 (T020-T026)
- **Developer C**: Error Recovery (T034-T041)

Then merge and tackle User Story 3 together.

---

## Testing Strategy

### Manual Testing Checkpoints

After each user story phase:

**US1 Test**: Upload 100-page play, verify progress appears <30 seconds
**US2 Test**: Upload 100-page play, measure total time <3 minutes
**US3 Test**: Upload multi-act play, verify act/scene/character details shown
**Error Recovery Test**: Kill process mid-parse, verify restart from last chunk

### Performance Validation

Run against known 100-page play scripts:

- [ ] Hamlet (29,551 lines) - verify <3 min total, first update <30s
- [ ] Romeo and Juliet (24,545 lines) - verify <2.5 min total
- [ ] Macbeth (17,121 lines) - verify <2 min total

### Accuracy Validation

Verify 95%+ accuracy for character attribution:

- [ ] Upload test plays with known character counts
- [ ] Compare parsed output to expected structure
- [ ] Verify no character misattributions

---

## Success Metrics

Track these metrics throughout implementation:

- **SC-001**: First progress update timestamp <30 seconds ✅
- **SC-002**: Total parsing time <3 minutes (70% reduction) ✅
- **SC-003**: Average chunk processing time <3 seconds ✅
- **SC-004**: Progress update frequency every 10-15 seconds ✅
- **SC-005**: Parsing accuracy ≥95% for character attribution ✅

---

## Notes

- Commit after each completed task
- Use feature branch `001-llm-perf-optimization`
- Mark session as FAILED on any unhandled exception
- Delete COMPLETED sessions immediately to save DB space
- Raw text stored in DB enables resume without re-upload
- Each user story should work independently - test in isolation
- Parallel tasks marked [P] touch different files or independent sections
