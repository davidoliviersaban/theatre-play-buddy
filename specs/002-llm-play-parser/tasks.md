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

- [ ] T036 [P] [US4] Capture formatting metadata during extraction in `src/lib/parse/extractors.ts` (indent level, line breaks)
- [ ] T037 [P] [US4] Extend schemas to include optional formatting metadata in `src/lib/parse/schemas.ts`
- [ ] T038 [US4] Update UI renderers to visualize indentation `src/components/practice/book-view.tsx`

## Final Phase: Polish & Cross-Cutting Concerns

- [ ] T039 Add SSE `unsupported_speaker` telemetry event in `src/app/import/api/parse/route.ts` when crowd/unknown detected
- [x] T040 Add cancellation support for parsing (client abort + server respect) in `src/app/import/api/parse/route.ts`
- [x] T041 Add comprehensive error messages and recovery hints in `src/components/import/parse-error-display.tsx`
- [ ] T042 Add unit tests for extractors `tests/parse/extractors.test.ts`
- [ ] T043 Add unit tests for schemas and refinements `tests/parse/schemas.test.ts`
- [ ] T044 Add unit tests for multi-speaker helpers `tests/parse/multi-character.test.ts`
- [ ] T045 Add integration test for upload→parse→persist→render `tests/parse/llm-parser.test.ts`
- [ ] T046 Update README with import feature quickstart steps

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
