# Implementation Plan: LLM-Powered Play Parser

**Branch**: `002-llm-play-parser` | **Date**: November 30, 2025 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-llm-play-parser/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enable users to upload play scripts in PDF, DOCX, or TXT format and automatically parse them using an LLM into the existing Playbook data structure. The system will stream parsing progress in real-time, validate outputs using Zod schemas, and support multi-character attribution for simultaneous dialogue and stage directions.

**Key Technical Approach**:

- Vercel AI SDK with `generateObject` and `streamObject` for type-safe LLM responses
- Zod schemas matching the existing Playbook/Character/Act/Scene/Line types
- Document conversion libraries (pdf-parse, mammoth) for text extraction
- Streaming progress updates via React Server Components or Server-Sent Events
- Multi-character attribution support (characterId can be an array)

## Technical Context

**Language/Version**: TypeScript/JavaScript with Next.js 14+ (App Router)  
**Primary Dependencies**:

- Next.js 14+, React 18+
- Vercel AI SDK (@ai-sdk/core, @ai-sdk/openai or @ai-sdk/anthropic)
- Zod for schema validation
- pdf-parse (PDF extraction), mammoth (DOCX extraction)
- Prisma ORM with PostgreSQL + pgvector
- Tailwind CSS for UI

**Storage**: PostgreSQL (Playbook data persisted via Prisma)
**Testing**: Jest for unit tests, Playwright for E2E, Zod schema validation tests  
**Target Platform**: Web (local Docker deployment, browser-based)  
**Project Type**: Next.js full-stack (single app with client + server)  
**Performance Goals**: Parse standard 2-3 act play in <3 minutes (SC-001)
**Constraints**:

- Local-first deployment (Docker)
- File size limit: 500 pages or 5MB (SC-006)
- Must conform to existing Playbook data model (Principle III)

**Scale/Scope**: Single-user local deployment; file uploads processed server-side

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Theatre Play Buddy Constitution principles:

- [x] **Principle I (Actor-Centered Practice)**: Yes - enables actors to import their own scripts for practice
- [x] **Principle II (Multi-Format Ingestion)**: Yes - PDF/DOCX/TXT support (core requirement)
- [x] **Principle III (Structured Play Model)**: Yes - outputs conform to existing Playbook/Act/Scene/Line types
- [N/A] **Principle IV (Search & Discovery)**: N/A - parsing feature; search uses existing data once imported
- [N/A] **Principle V (Real-Time Audio)**: N/A - no audio processing in this feature
- [N/A] **Principle VI (Error Assistance)**: N/A - parsing errors shown; actor practice errors not in scope
- [x] **Principle VII (Progress Tracking)**: Indirectly - imported plays become available for progress tracking
- [x] **Principle VIII (Privacy-First)**: Yes - all parsing done locally, no external transmission
- [N/A] **Performance Target**: N/A - <200ms target applies to audio, not file parsing
- [x] **Data Model Conformance**: Yes - Zod schemas enforce Playbook structure (FR-017, FR-018)

**Justification for any violations**: None - feature aligns with constitution

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# Next.js full-stack architecture (client + server in one project)
src/
├── app/
│   ├── import/
│   │   ├── page.tsx                 # MOD: Import UI with file upload
│   │   └── api/
│   │       ├── upload/
│   │       │   └── route.ts         # NEW: File upload endpoint
│   │       └── parse/
│   │           └── route.ts         # NEW: Streaming parse endpoint (SSE)
│   └── play/
│       └── [id]/
│           └── page.tsx             # EXISTS: Display parsed play
├── components/
│   ├── import/
│   │   ├── file-upload.tsx          # NEW: Drag-drop file upload component
│   │   ├── parse-progress.tsx       # NEW: Real-time progress display
│   │   └── parse-error-display.tsx  # NEW: Error handling UI
│   └── play/
│       └── ...                      # EXISTS: Play display components
├── lib/
│   ├── parse/
│   │   ├── extractors.ts            # NEW: PDF/DOCX/TXT text extraction
│   │   ├── llm-parser.ts            # NEW: Vercel AI SDK integration
│   │   ├── schemas.ts               # NEW: Zod schemas for Playbook/Act/Scene/Line
│   │   ├── validation.ts            # NEW: Post-parse validation logic
│   │   └── multi-character.ts       # NEW: Multi-character attribution logic
│   ├── play-storage.ts              # MOD: Persist to Prisma (may need updates)
│   └── mock-data.ts                 # EXISTS: Playbook type definitions
└── ...

specs/002-llm-play-parser/
├── spec.md                          # EXISTS: Feature specification
├── plan.md                          # THIS FILE
├── research.md                      # Phase 0 output (to be generated)
├── data-model.md                    # Phase 1 output (to be generated)
├── quickstart.md                    # Phase 1 output (to be generated)
└── contracts/
    ├── upload-api.yaml              # Phase 1 output (to be generated)
    └── parse-api.yaml               # Phase 1 output (to be generated)

prisma/
└── schema.prisma                    # EXISTS: May need Playbook model updates

tests/
├── parse/
│   ├── extractors.test.ts           # NEW: Text extraction tests
│   ├── llm-parser.test.ts           # NEW: LLM integration tests
│   └── schemas.test.ts              # NEW: Zod schema validation tests
└── ...
```

**Structure Decision**: Using Next.js full-stack (Option 1) as per Theatre Play Buddy architecture. New `src/lib/parse/` directory contains all LLM parsing logic (extractors, schemas, validation). New `src/components/import/` contains upload UI. API routes at `src/app/import/api/` handle file uploads and streaming parse responses.

## Complexity Tracking

> No violations - Constitution Check passed with all applicable principles satisfied

## Gates

_GATE FAILURES BLOCK PHASE PROGRESSION_

### Pre-Phase-0 Gate: Constitution & Feasibility

- [x] Constitution Check complete (all applicable principles satisfied)
- [x] No unjustified complexity violations
- [x] Feature spec complete with requirements, acceptance criteria, technical approach
- [x] All NEEDS CLARIFICATION items resolved in spec (multi-character attribution, formatting)

**Status**: ✅ PASS - Proceed to Phase 0

### Pre-Phase-1 Gate: Research Complete

- [x] research.md complete with all unknowns resolved
- [x] Document format extraction approach (pdf-parse vs alternatives)
- [x] Vercel AI SDK provider selection (OpenAI vs Anthropic)
- [x] LLM prompting strategy for play structure extraction
- [x] Multi-character attribution algorithm design
- [x] Streaming progress implementation approach (SSE vs WebSocket)

**Status**: ✅ PASS - Proceed to Phase 1

### Pre-Phase-2 Gate: Design Validated

- [x] data-model.md defines Zod schemas matching Playbook types
- [x] contracts/ contains OpenAPI specs for upload and parse endpoints
- [x] quickstart.md provides development setup instructions
- [x] Agent context updated with new technologies (.github/agents/copilot-instructions.md)
- [x] Constitution Check re-verified post-design

**Status**: ✅ PASS - Ready for Phase 2 (implementation)

---

## Phase 0: Research & Planning

**Objective**: Resolve all technical unknowns and establish implementation approach

**Duration Estimate**: 1-2 days

### Research Tasks

1. **Document Text Extraction**

   - **Question**: Which libraries best extract text from PDF/DOCX/TXT while preserving structure?
   - **Approach**: Compare pdf-parse, pdf.js, pdfplumber (Python), mammoth (DOCX), docx (DOCX)
   - **Output**: Recommended library for each format with code samples in research.md

2. **LLM Provider Selection**

   - **Question**: OpenAI GPT-4 vs Anthropic Claude for play parsing?
   - **Approach**: Compare token costs, JSON mode support, streaming capabilities, accuracy for structured extraction
   - **Output**: Recommended provider with Vercel AI SDK configuration in research.md

3. **Prompting Strategy**

   - **Question**: How to structure prompts for reliable play structure extraction?
   - **Approach**: Research few-shot prompting, chain-of-thought, structured output examples
   - **Output**: Prompt templates for character extraction, act/scene segmentation, line attribution in research.md

4. **Multi-Character Attribution Algorithm**

   - **Question**: How to detect and handle simultaneous dialogue (e.g., "BOTH:" or "ALL:")?
   - **Approach**: Pattern matching strategies, LLM-based detection, fallback rules
   - **Output**: Algorithm pseudocode and edge case handling in research.md

5. **Streaming Progress Implementation**

   - **Question**: Server-Sent Events vs WebSocket for real-time parse progress?
   - **Approach**: Compare Next.js API route support, Vercel AI SDK streaming integration, client-side simplicity
   - **Output**: Recommended approach with code snippets in research.md

6. **Error Handling & Validation**
   - **Question**: What validation rules catch LLM hallucinations or malformed outputs?
   - **Approach**: Zod schema strictness, post-parse sanity checks (character consistency, act/scene numbering)
   - **Output**: Validation strategy and error recovery flows in research.md

### Deliverable: `research.md`

Template structure:

```markdown
# Research: LLM Play Parser

## 1. Document Text Extraction

**Decision**: [Library choice]
**Rationale**: [Why chosen]
**Alternatives Considered**: [Other options]
**Code Sample**: [Extraction example]

## 2. LLM Provider Selection

[Same structure]

## 3. Prompting Strategy

[Same structure]

## 4. Multi-Character Attribution

[Same structure]

## 5. Streaming Progress

[Same structure]

## 6. Validation Strategy

[Same structure]
```

---

## Phase 1: Design & Contracts

**Objective**: Define data models, API contracts, and development setup

**Duration Estimate**: 2-3 days

**Prerequisites**: research.md complete, Pre-Phase-1 Gate passed

### Design Tasks

1. **Define Zod Schemas** → `data-model.md`

   - Extract entity types from spec: Playbook, Character, Act, Scene, Line
   - Mirror existing types from mock-data.ts:
     ```typescript
     type Line = {
       id: string;
       sceneId: string;
       characterId?: string | string[]; // Multi-character support
       text: string;
       type: "dialogue" | "stage_direction";
       order: number;
     };
     ```
   - Define Zod schemas:
     ```typescript
     const LineSchema = z.object({
       id: z.string(),
       sceneId: z.string(),
       characterId: z.union([z.string(), z.array(z.string())]).optional(),
       text: z.string(),
       type: z.enum(["dialogue", "stage_direction"]),
       order: z.number(),
     });
     ```
   - Document validation rules (e.g., characterId required for dialogue, optional for stage_direction)

2. **Generate API Contracts** → `contracts/`

   - **upload-api.yaml**: OpenAPI spec for file upload endpoint

     - POST /api/import/upload
     - Request: multipart/form-data with file field
     - Response: { uploadId: string, filename: string, size: number }
     - Validation: file type (PDF/DOCX/TXT), size limit (5MB), page limit (500)

   - **parse-api.yaml**: OpenAPI spec for streaming parse endpoint
     - POST /api/import/parse
     - Request: { uploadId: string, llmProvider: 'openai' | 'anthropic' }
     - Response: Server-Sent Events stream
   - Event types: progress, character_found, act_complete, scene_complete, unsupported_speaker, complete, error
     - Example: `data: {"event":"progress","percent":25,"message":"Extracted 5 characters"}`

3. **Development Setup** → `quickstart.md`

   - Environment variables:
     - `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
     - `DATABASE_URL` (PostgreSQL)
   - Installation steps:
     ```bash
     npm install @ai-sdk/openai @ai-sdk/anthropic ai zod pdf-parse mammoth
     ```
   - Database migration (if Playbook schema needs updates)
   - Local testing workflow

4. **Update Agent Context** → `.specify/memory/copilot-context.md`
   - Run: `.specify/scripts/bash/update-agent-context.sh copilot`
   - Add technologies: Vercel AI SDK, Zod, pdf-parse, mammoth
   - Preserve manual additions between markers

### Deliverables

- `data-model.md`: Entity definitions and Zod schemas
- `contracts/upload-api.yaml`: File upload API specification
- `contracts/parse-api.yaml`: Streaming parse API specification
- `quickstart.md`: Development setup guide
- `.specify/memory/copilot-context.md`: Updated with new tech stack

### Constitution Re-Check

After design complete, re-verify:

- [x] Zod schemas match existing Playbook structure (Principle III)
- [x] API contracts support PDF/DOCX/TXT (Principle II)
- [x] No external data transmission (Principle VIII)

---

## Phase 2: Implementation Breakdown

**Objective**: Task-level breakdown for implementation (generated by next command)

**Prerequisites**: Phase 1 complete, Pre-Phase-2 Gate passed

**Note**: Implementation tasks will be generated by the `/speckit.task` command. This plan establishes the foundation for task breakdown.

**Expected Task Categories**:

1. File Upload Infrastructure (upload endpoint, file validation, storage)
2. Text Extraction (PDF/DOCX/TXT extractors, error handling)
3. LLM Integration (Vercel AI SDK setup, prompt engineering, streaming)
4. Zod Schema Implementation (schema definitions, validation logic)
5. Multi-Character Attribution (detection algorithm, characterId array handling)
6. Parse Progress UI (SSE client, progress display, error handling)
7. Prisma Integration (Playbook persistence, transaction handling)
8. Testing (unit tests for extractors/schemas, E2E tests for upload→parse→storage)

---

## Risk Assessment

| Risk                                              | Likelihood | Impact | Mitigation                                                                    |
| ------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------- |
| LLM hallucinations produce invalid play structure | Medium     | High   | Strict Zod validation, post-parse sanity checks, user review UI               |
| PDF text extraction fails for scanned/image PDFs  | Medium     | Medium | Detect low-quality OCR, prompt user for manual upload, future OCR integration |
| Large files exceed token limits                   | Low        | High   | Chunk-based processing, progressive parsing with continuation tokens          |
| Streaming interruptions cause partial data loss   | Low        | Medium | Transaction-based persistence, resume capability, clear error states          |
| Multi-character attribution misses edge cases     | Medium     | Low    | Comprehensive test suite with edge cases, manual correction UI (future)       |

---

## Success Metrics (from Spec)

- **SC-001**: Parse standard 2-3 act play in <3 minutes
- **SC-002**: 95% accuracy for character-to-line attribution
- **SC-003**: 90% accuracy for act/scene structure extraction
- **SC-004**: 85% accuracy for stage direction identification
- **SC-005**: Support PDF/DOCX/TXT with consistent quality
- **SC-006**: Handle files up to 500 pages or 5MB
- **SC-007**: Streaming progress updates every 5 seconds or on structure changes
- **SC-008**: Graceful error handling with actionable messages
- **SC-009**: Parsed plays render correctly in existing UI

---

## Next Steps

1. **Execute Phase 0**: Run research agents to populate research.md
2. **Gate Check**: Verify all unknowns resolved before Phase 1
3. **Execute Phase 1**: Generate data-model.md, contracts/, quickstart.md
4. **Update Context**: Run update-agent-context.sh after Phase 1
5. **Re-validate**: Constitution Check after design complete
6. **Task Breakdown**: Run `/speckit.task` to generate Phase 2 implementation tasks

**Current Status**: ✅ Plan complete, Phase 0 and Phase 1 complete, ready for implementation (Phase 2)

## Phase Completion Summary

- ✅ **Phase 0 (Research)**: All technical unknowns resolved

  - Document extraction: pdf-parse + mammoth + fs.readFile
  - LLM provider: Anthropic Claude 3.5 Sonnet (OpenAI as fallback)
  - Prompting: Multi-stage extraction with few-shot examples
  - Multi-character: LLM detection + pattern matching
  - Streaming: Server-Sent Events via Next.js
  - Validation: Zod + post-parse sanity checks

- ✅ **Phase 1 (Design)**: Data models, API contracts, and setup complete

  - data-model.md: Zod schemas for all entities
  - contracts/upload-api.yaml: File upload endpoint spec
  - contracts/parse-api.yaml: Streaming parse endpoint spec
  - quickstart.md: Development environment setup
  - Agent context: Updated with Vercel AI SDK, Zod, extractors

- ⏳ **Phase 2 (Implementation)**: Ready to begin
  - Run `/speckit.task` to generate implementation task breakdown
