# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process. For Theatre Play Buddy, many of these are defined in the
  constitution.
-->

**Language/Version**: TypeScript/JavaScript with Next.js (latest stable)  
**Primary Dependencies**: Next.js, Prisma (ORM), Whisper (STT), Local TTS, Tailwind CSS  
**Storage**: PostgreSQL with pgvector extension  
**Testing**: [e.g., Jest, Playwright, or NEEDS CLARIFICATION]  
**Target Platform**: Web (local Docker deployment)  
**Project Type**: Next.js full-stack (single app with client + server)  
**Performance Goals**: <200ms end-of-sentence detection latency (CONSTITUTIONAL REQUIREMENT)  
**Constraints**: Local-first (no external data transmission), Docker-based deployment  
**Scale/Scope**: Single-user local deployment initially; multi-user support TBD

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Theatre Play Buddy Constitution principles:

- [ ] **Principle I (Actor-Centered Practice)**: Does feature support actor learning flow?
- [ ] **Principle II (Multi-Format Ingestion)**: If ingestion feature, supports PDF/TXT/DOC/DOCX?
- [ ] **Principle III (Structured Play Model)**: Adheres to StructuredPlay data model?
- [ ] **Principle IV (Search & Discovery)**: Search by scene/character/instruction/author/title?
- [ ] **Principle V (Real-Time Audio)**: Audio processing meets <200ms latency target?
- [ ] **Principle VI (Error Assistance)**: Provides divergence detection and hints?
- [ ] **Principle VII (Progress Tracking)**: Tracks per user-character per scene?
- [ ] **Principle VIII (Privacy-First)**: Data stays local, no external transmission?
- [ ] **Performance Target**: End-of-sentence detection <200ms?
- [ ] **Data Model Conformance**: All play data uses StructuredPlay schema?

_Mark N/A if principle not applicable to this feature_

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
# [REMOVE IF UNUSED] Option 1: Single Next.js project (DEFAULT for Theatre Play Buddy)
# Next.js full-stack architecture (client + server in one project)
app/                     # Next.js 13+ App Router
├── (auth)/             # Route groups for authenticated pages
├── api/                # API routes
└── components/         # React components

src/
├── lib/                # Shared utilities
├── models/             # Prisma models & StructuredPlay schema
├── services/           # Business logic (audio, RAG, play processing)
└── audio/              # Whisper + TTS integration

prisma/
├── schema.prisma       # Database schema (PostgreSQL + pgvector)
└── migrations/

tests/
├── contract/           # StructuredPlay model conformance tests
├── integration/        # Audio pipeline, practice flow tests
└── unit/

# [REMOVE IF UNUSED] Option 2: Monorepo with separate Next.js app + packages
apps/
└── web/                # Next.js application
    ├── app/
    ├── src/
    └── tests/

packages/
├── audio/              # Whisper + TTS package
├── models/             # StructuredPlay schema
└── rag/                # RAG knowledge base

# [REMOVE IF UNUSED] Option 3: Separate frontend/backend (NOT RECOMMENDED for this project)
# Theatre Play Buddy uses Next.js full-stack, so frontend/backend split not needed
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 4: Mobile + API (future consideration for Theatre Play Buddy)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
