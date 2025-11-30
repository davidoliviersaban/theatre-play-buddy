<!--
Sync Impact Report (2025-11-30)
================================
Version Change: Template → 1.0.0
Change Type: Initial Constitution Ratification
Modified Principles: All (initial creation)

Added Sections:
  - Core Principles (8 principles defined)
  - Application Domain & Features
  - Technical Architecture
  - Data Model Requirements
  - Quality Standards
  - Development Environment
  - Privacy & Security
  - Governance

Principles Summary:
  I.   Actor-Centered Practice - Training flow prioritizes actor learning
  II.  Multi-Format Play Ingestion - PDF/TXT/DOC/DOCX support
  III. Structured Play Model (NON-NEGOTIABLE) - StructuredPlay schema
  IV.  Search & Discovery - Multi-dimensional search capabilities
  V.   Real-Time Audio Processing - <200ms latency target
  VI.  Intelligent Error Assistance - Divergence detection with hints
  VII. Progress Tracking & Resumption - Per user-character per scene
  VIII. Privacy-First Local Deployment - No external data transmission

Templates Requiring Updates:
  ✅ plan-template.md - Updated with:
     • Constitution Check section with all 8 principles + performance/data model checks
     • Technical Context defaults reflecting Next.js, PostgreSQL, Prisma, Whisper, TTS
     • Project structure options updated for Next.js full-stack architecture
     • StructuredPlay model references in test sections

  ✅ spec-template.md - Already aligned:
     • User stories structure supports actor-centered scenarios
     • Requirements section supports functional requirements
     • Independent testability aligns with quality standards

  ✅ tasks-template.md - Already aligned:
     • Test-first guidance (optional, as constitution doesn't mandate TDD)
     • User story grouping enables incremental delivery
     • Contract/integration test structure supports StructuredPlay conformance

Follow-up TODOs: None - All principles fully defined and templates updated
-->

# Theatre Play Buddy Constitution

## Core Principles

### I. Actor-Centered Practice

**Purpose**: Training actors to memorize stage play roles through structured rehearsal.

The application MUST prioritize the actor's learning experience:

- Selected character lines are paused for actor recitation
- Non-selected character lines and stage directions are read aloud automatically
- The system auto-advances when the actor completes a sentence
- Progress is tracked per user-character per scene

**Rationale**: Actors need focused, distraction-free practice with immediate feedback to effectively memorize lines and understand character context within the full play.

### II. Multi-Format Play Ingestion

**Supported Formats**: PDF, TXT, DOC, DOCX

The system MUST accept play scripts in multiple document formats and automatically extract:

- Play metadata (title, author, year, language)
- Characters list
- Scenes and acts structure
- Stage directions (action, setting, sound, lighting, other)

**Rationale**: Theatre scripts are distributed in various formats; actors should not be forced to manually convert or re-type plays.

### III. Structured Play Model (NON-NEGOTIABLE)

**Conformance Required**: All play data MUST conform to the StructuredPlay model.

Data model requirements:

- **PlayMetadata**: title, author, year (optional), language, characters
- **Acts** contain scenes; scenes contain dialogue and stage directions
- **Stage Direction Types**: action, setting, sound, lighting, other

**Rationale**: A consistent data schema ensures reliable retrieval, search, and playback across all features. This is the contract between ingestion, storage, and practice modes.

### IV. Search & Discovery

**Search Capabilities**: Users MUST be able to search by scene, character, instruction/stage direction, author, and play title.

The system MUST display play listings with:

- Author name
- Play title
- Number of scenes
- Number of characters
- Number of instructions/stage directions

**Rationale**: Actors need efficient navigation to find specific moments in plays, select training material, and manage their repertoire.

### V. Real-Time Audio Processing

**Performance Target**: End-of-sentence detection and turn handling MUST aim for <200ms processing latency.

Audio stack:

- **Speech-to-Text**: Whisper
- **Text-to-Speech**: Local TTS engine
- **Processing**: Local API

**Rationale**: Natural conversational flow during practice requires near-instantaneous detection of sentence completion; delays disrupt immersion and learning.

### VI. Intelligent Error Assistance

**Feedback Loop**: If the actor's spoken line diverges from the script, the system MUST identify the error and provide a hint.

The system MUST:

- Compare spoken input to expected script text
- Detect divergence points
- Provide constructive hints without breaking practice flow

**Rationale**: Immediate corrective feedback accelerates memorization and prevents actors from ingraining incorrect lines.

### VII. Progress Tracking & Resumption

**Persistence**: Progress MUST be tracked per user-character per scene.

Requirements:

- Progress measured as percentage of lines memorized per scene
- Training sessions can be resumed at the last position
- Progress displayed at scene level

**Rationale**: Actors rehearse over multiple sessions; the system must remember where they left off and show measurable improvement to motivate continued practice.

### VIII. Privacy-First Local Deployment

**Data Sovereignty**: All data remains local and is NOT transmitted to external services unless explicitly configured by the operator.

Default deployment mode:

- Local environment via Docker
- Mobile deployment and cloud hosting considered future work

**Rationale**: Play scripts may be under copyright; actors' practice data is personal; privacy and control are paramount.

## Application Domain & Features

### Role Selection & Multi-Character Support

- Actors select ONE character for training per session
- Multiple characters from the same play are supported (for different training sessions)

### Practice Mode Behavior

- Application reads lines for non-selected characters and instructions
- Application pauses for selected character lines
- Auto-advance when actor finishes a sentence

### Language Support

- **Initial Language**: French
- Extensibility for additional languages planned

### Progress Export

- Progress reports are NOT exported in the initial version

## Technical Architecture

### Framework & Platform

- **Architecture**: Client/server model built on Next.js (both client and server)
- **Language**: JavaScript/TypeScript (Next.js)
- **Database**: PostgreSQL with pgvector extension
- **ORM**: Prisma
- **Knowledge Retrieval**: Retrieval Augmented Generation (RAG) for knowledge base functionalities
- **UI Framework**: Tailwind CSS

### Authentication

- Email and password authentication supported
- Role-based access control (RBAC) is NOT required

### Browser & Concurrency

- No specific browser compatibility constraints
- Concurrent user requirements limited to meeting the <200ms performance target

## Data Model Requirements

All features MUST adhere to the StructuredPlay model defined in Principle III:

- PlayMetadata with title, author, year (optional), language, characters
- Acts contain scenes; scenes contain dialogue content and stage directions
- Stage directions categorized as: action, setting, sound, lighting, other

## Quality Standards

### Performance

- **Latency Target**: <200ms for end-of-sentence detection and turn handling
- This is a HARD requirement for practice mode usability

### Testing

- Contract tests for StructuredPlay model conformance
- Integration tests for audio pipeline (Whisper → logic → TTS)
- User journey tests for practice flow and error handling

### Observability

- Structured logging for audio processing latency
- Progress tracking metrics per session
- Error hint accuracy metrics

## Development Environment

### Local Development Stack

- **Containerization**: Docker + docker-compose
- **Database**: PostgreSQL (dockerized) with pgvector
- **Audio Processing**: Local API (containerized)

### Source Control

- **Platform**: GitHub for code hosting and version control
- Branching strategy per Speckit conventions

## Privacy & Security

### Data Locality

- All play data and user progress stored locally (PostgreSQL)
- No external transmission unless operator explicitly configures it
- Whisper and TTS run locally (no cloud API dependencies)

### Copyright Considerations

- Play scripts may be copyrighted material; system does NOT enforce copyright checks
- Responsibility for legal use rests with the operator/user

## Governance

### Constitution Authority

This constitution supersedes all other development practices and design decisions. Any feature, architecture choice, or implementation that conflicts with these principles MUST be either:

- Rejected, OR
- Documented as a constitutional amendment (see Versioning below)

### Amendment Process

Amendments require:

1. Documentation of the proposed change and justification
2. Approval from project maintainers
3. Update to constitution version following semantic versioning
4. Migration plan for any affected features or data

### Compliance Verification

- All pull requests MUST verify alignment with constitution principles
- Spec documents MUST reference applicable constitutional articles
- Implementation plans MUST include Constitution Check section

### Versioning

- **Semantic Versioning**: MAJOR.MINOR.PATCH
  - **MAJOR**: Backward-incompatible governance changes or principle removals/redefinitions
  - **MINOR**: New principles added or material expansions to existing guidance
  - **PATCH**: Clarifications, wording improvements, typo fixes

**Version**: 1.0.0 | **Ratified**: 2025-11-30 | **Last Amended**: 2025-11-30
