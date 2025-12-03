# Feature Specification: LLM-Powered Play Parser

**Feature Branch**: `002-llm-play-parser`  
**Created**: November 30, 2025  
**Status**: Draft  
**Input**: User description: "I want to be able to upload a play and parse it using an LLM. The play will be a word or pdf or simple text file. the LLM should stream the file and parse it and make sure that it can return for the play proper data structure such as: 1. all the characters of the play 2. each act and scenes can be named if they have one. 3. the line by line split per character with proper act, scene and character reference 4. directions should be attributed to characters when they are referring to it or unattributed when it is a stage direction. (nice to have) 5. keep track of the paragraphs indents if possible."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Upload and Extract Basic Play Structure (Priority: P1)

A user uploads a script file (PDF, Word, or text) and the system extracts the fundamental structure: play title, author, characters list, and a basic breakdown of acts and scenes. This provides immediate value by giving users a structured view of their play without manual data entry.

**Why this priority**: This is the foundation - users need to see their play imported before any other features matter. It proves the concept works and delivers immediate value.

**Independent Test**: Can be fully tested by uploading a simple play script file and verifying the system correctly identifies the title, author, character names, and act/scene structure. Delivers value by eliminating manual entry of play metadata.

**Acceptance Scenarios**:

1. **Given** I am on the import page, **When** I upload a valid script file (PDF/DOCX/TXT), **Then** the system displays upload progress and begins parsing
2. **Given** the file is being parsed, **When** the LLM identifies characters, **Then** I see a live-updating list of detected characters streaming in real-time
3. **Given** parsing is complete, **When** I review the results, **Then** I see the play title, author, list of all characters, and act/scene structure
4. **Given** the LLM returns structured data, **When** the system receives it, **Then** the data is validated against expected schemas before being displayed
5. **Given** the play has been parsed, **When** I choose to save it, **Then** the play is added to my library with all extracted metadata
6. **Given** a parsing error occurs, **When** the system cannot process the file, **Then** I see a clear error message explaining what went wrong and suggestions to fix it

---

### User Story 2 - Line-by-Line Character Attribution (Priority: P2)

After basic structure is extracted, the system parses every line of dialogue and correctly attributes it to the speaking character, including proper act and scene references. This enables the core rehearsal functionality to work with uploaded plays.

**Why this priority**: This is essential for the app's main purpose (line rehearsal), but requires Story 1's foundation. Once complete, users can rehearse imported plays just like pre-loaded ones.

**Independent Test**: Can be tested by uploading a play, navigating to an act/scene, and verifying each dialogue line is attributed to the correct character and appears in the proper sequence.

**Acceptance Scenarios**:

1. **Given** a play has been parsed for structure, **When** I navigate to a specific scene, **Then** I see all dialogue lines in order with correct character attribution
2. **Given** I am viewing parsed lines, **When** dialogue switches between characters, **Then** each line shows the correct speaker name
3. **Given** a character has multiple consecutive lines, **When** viewing the scene, **Then** all lines are properly grouped under that character
4. **Given** the play has overlapping or simultaneous dialogue, **When** viewing the parsed result, **Then** the line is attributed to all characters speaking simultaneously, allowing multiple speakers per line

---

### User Story 3 - Stage Direction Attribution (Priority: P3)

The system intelligently categorizes stage directions as either character-specific actions or general scene directions, preserving their relationship to dialogue and characters.

**Why this priority**: Enhances rehearsal quality by showing actors their blocking/actions, but the app is usable without this level of detail.

**Independent Test**: Can be tested by uploading a play with various stage directions and verifying they are correctly categorized as character-specific or general, and appear in the right context.

**Acceptance Scenarios**:

1. **Given** a scene contains character-specific directions (e.g., "[exits]"), **When** viewing the scene, **Then** the direction appears associated with that character's dialogue
2. **Given** a scene contains general stage directions (e.g., "[Thunder and lightning]"), **When** viewing the scene, **Then** the direction appears as a standalone element in sequence
3. **Given** a direction appears mid-dialogue, **When** parsing completes, **Then** the direction is positioned correctly in the line sequence
4. **Given** directions contain character names, **When** parsing, **Then** the system correctly associates the direction with the mentioned character

---

### User Story 4 - Format Preservation (Priority: P4)

The system preserves paragraph indentation and formatting clues from the original script, maintaining visual structure that helps with rehearsal.

**Why this priority**: Nice-to-have feature that improves user experience but isn't essential for core functionality. Mainly beneficial for preserving author's original formatting intentions.

**Independent Test**: Can be tested by uploading a script with varied indentation patterns and verifying the visual hierarchy is maintained in the parsed output.

**Acceptance Scenarios**:

1. **Given** the original script uses indentation for character cues, **When** viewing parsed dialogue, **Then** relative indentation is preserved
2. **Given** the script has formatted verse or poetry, **When** parsing completes, **Then** line breaks and spacing match the original
3. **Given** the script uses special formatting for emphasis, **When** viewing the play, **Then** structural indentation is preserved while text styling (bold/italic/underline) is not retained

---

### Edge Cases

- What happens when the uploaded file is corrupted or in an unsupported format?
- How does the system handle plays without clearly marked act/scene divisions?
- What if character names are inconsistent (e.g., "HAMLET" vs "Ham." vs "Prince")?
- How should the system handle plays with chorus, narrators, or multiple simultaneous speakers?
- What happens when multiple characters speak the exact same words simultaneously?
- How are stage directions affecting multiple characters (e.g., "[They all exit]") attributed?
- What happens if the LLM parsing fails or times out midway through a large file?
- How should non-English plays or plays with mixed languages be handled?
- What if the file is too large (e.g., complete works of Shakespeare)?
- How are unnamed characters (e.g., "First Guard", "Messenger") handled consistently?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST accept file uploads in PDF, DOCX, and TXT formats up to a reasonable size limit
- **FR-002**: System MUST stream the parsing process to provide real-time progress feedback to users
- **FR-003**: System MUST extract and identify all character names from the script
- **FR-004**: System MUST identify and label acts and scenes when present in the script
- **FR-005**: System MUST parse dialogue line-by-line and attribute each line to the correct character(s), supporting multiple speakers for simultaneous dialogue
- **FR-006**: System MUST include act and scene references for each parsed line
- **FR-007**: System MUST distinguish between character-specific stage directions and general stage directions, supporting attribution to multiple characters when applicable
- **FR-008**: System MUST handle character name variations (abbreviations, nicknames) and normalize them to consistent identifiers
- **FR-009**: System MUST preserve the sequential order of all dialogue and directions
- **FR-010**: System MUST allow users to review and correct parsing results before finalizing the import
- **FR-011**: System MUST save successfully parsed plays in the same data structure as pre-loaded plays
- **FR-012**: System MUST provide clear error messages when files cannot be parsed
- **FR-013**: System MUST handle plays without explicit act/scene markers by creating default groupings
- **FR-014**: System SHOULD preserve structural indentation (paragraph/verse spacing) but MAY ignore text styling such as bold, italic, or underline
- **FR-015**: System MUST allow users to cancel ongoing parsing operations
- **FR-016**: System MUST validate that extracted data meets minimum requirements (title, at least one character, at least one line)
- **FR-017**: System MUST use structured object generation to ensure LLM outputs conform to predefined schemas
- **FR-018**: System MUST validate all LLM-generated data against type-safe schemas before processing
- **FR-019**: System MUST handle validation failures gracefully and retry or prompt for correction when schema validation fails
- **FR-020**: System MUST support attributing a single line or direction to multiple characters when they speak or act simultaneously
- **FR-021**: System MUST use database-generated UUIDs as the canonical primary keys for all entities (Playbook, Character, Act, Scene, Line) ✅ **COMPLETED**
- **FR-022**: System MAY store LLM-generated IDs as supplementary `llmSourceId` fields for debugging and audit purposes only ✅ **COMPLETED**
- **FR-023**: System MUST NOT use LLM-generated IDs as primary keys or foreign keys in the database ✅ **COMPLETED**
- **FR-024**: System MUST create a mapping table during parsing to translate LLM-generated character IDs to database-generated character IDs before persisting line attributions ✅ **COMPLETED**
- **FR-025**: System MUST handle potential duplicate LLM-generated IDs gracefully, as the LLM cannot guarantee uniqueness or database consistency ✅ **COMPLETED**

### Key Entities

- **Upload Session**: Represents a single file upload attempt, tracking status (uploading, parsing, complete, failed), progress percentage, and any error messages
- **Parse Result**: The intermediate output from LLM parsing, containing raw extracted data before validation and user review
- **Character Mapping**: Links character name variations found in the script to normalized character identities, allowing for corrections
- **Stage Direction**: Categorized as either character-specific or general, with positioning information relative to dialogue; may be attributed to multiple characters when applicable
- **Dialogue Line**: A single line of text that may be spoken by one or more characters simultaneously
- **Formatting Metadata**: Preservation of structural indentation levels and spacing; text styling (bold/italic/underline) is not retained

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can successfully upload and parse a standard-length play (2-3 acts, 10-20 characters) in under 3 minutes
- **SC-002**: System correctly identifies at least 95% of character names without user correction for well-formatted scripts
- **SC-003**: Parsed plays are immediately usable for rehearsal without requiring manual data entry
- **SC-004**: Users can see parsing progress update at least every 5 seconds during processing
- **SC-005**: At least 90% of stage directions are correctly categorized as character-specific or general
- **SC-006**: System successfully handles files up to 500 pages or 5MB in size
- **SC-007**: Parsing errors provide actionable feedback that allows users to successfully re-upload with corrections in 80% of cases
- **SC-008**: Imported plays maintain the same line order and character attribution as the source document
- **SC-009**: Schema validation catches at least 99% of malformed LLM outputs before they reach the user

## Technical Approach _(for context)_

### ID Management Strategy

**Database Authority**: All primary IDs are generated by the database using `@default(uuid())` in the Prisma schema. LLM-generated IDs serve only as temporary references during parsing and are stored as supplementary `llmSourceId` fields for debugging purposes.

**Key Principles**:

1. **DB-Generated IDs**: Database generates all canonical `id` fields via `@default(uuid())`
2. **LLM IDs as References**: During parsing, LLM generates temporary IDs to link entities (e.g., character to their lines)
3. **Mapping Phase**: Parser creates a mapping table (`Map<llmSourceId, dbId>`) after inserting entities
4. **Foreign Key Resolution**: Before persisting relationships (LineCharacter records), map LLM IDs to DB IDs
5. **No Uniqueness Guarantee**: LLM cannot ensure ID uniqueness; duplicates are possible and must be handled
6. **Audit Trail**: Original `llmSourceId` values retained in database for debugging character attribution and duplicate detection

**Implementation Flow**:

```
1. LLM generates play structure with temporary llmSourceIds
2. Insert entities → DB generates canonical UUIDs (id field)
3. Build mapping: { characterLlmId → characterDbId }
4. Resolve line attributions using mapping
5. Create LineCharacter records with DB-generated IDs
6. Store llmSourceId for debugging only
```

### LLM Integration Strategy

While this specification focuses on user outcomes, the following technical approach provides context for implementation:

- **Vercel AI SDK**: Utilize the `generateObject` and `streamObject` functions from Vercel AI SDK to ensure type-safe, streaming responses from the LLM
- **Schema Validation**: Define Zod schemas that mirror the existing play data structure (Playbook, Character, Act, Scene, Line types)
- **Structured Output**: Use `generateObject` to force the LLM to return data conforming to predefined schemas, eliminating parsing ambiguity
- **Progressive Streaming**: Stream partial results to the UI as acts/scenes are parsed, providing real-time feedback
- **Validation Pipeline**: Each LLM response passes through Zod validation before being accepted, with automatic retry on validation failures

### Data Flow

1. User uploads file → Extract text → Chunk by sections (metadata, acts, scenes)
2. Send chunks to LLM via Vercel AI SDK with appropriate Zod schema
3. Stream validated objects back to client as they're generated
4. Accumulate and merge results into final play structure
5. Present for user review before persisting

This approach ensures type safety, reduces parsing errors, and provides a smooth streaming experience.

## Assumptions

- Users will primarily upload professionally formatted play scripts rather than raw transcripts or amateur formats
- Vercel AI SDK is used for LLM integration, providing streaming and structured output capabilities
- An LLM API compatible with Vercel AI SDK (e.g., OpenAI, Anthropic) is available with sufficient context window to process act/scene sections
- Zod schemas can accurately represent all play data structures for validation
- Standard play formatting conventions (ALL CAPS character names, stage directions in brackets/italics) are generally followed
- File conversion libraries (for PDF/DOCX to text) are available and reliable
- Users have internet connectivity during the upload and parsing process
- The existing play data structure can accommodate all necessary metadata without changes

## Dependencies

- Vercel AI SDK for LLM integration with streaming and structured output
- Zod schema validation library for type-safe data validation
- LLM API compatible with Vercel AI SDK (OpenAI, Anthropic, etc.)
- File upload and parsing service (backend)
- Document conversion libraries (PDF/DOCX extraction)
- Progress tracking and real-time updates (React streaming)
- Existing play data model and storage system

## Future Enhancements

### Job Management System

The current parsing implementation uses a dual-path approach (streaming for short plays, incremental for long plays) with limited job control. A comprehensive job management system redesign is planned to address:

- Unified job queue for all parsing tasks
- Robust state machine with pause/resume/cancel capabilities
- Distributed-safe locking for multi-instance deployment
- Retry logic with exponential backoff
- Worker pool for controlled concurrency
- Comprehensive observability (metrics, logs, health checks)

**Status**: Architecture analysis completed. See [PARSING_JOB_ARCHITECTURE.md](../../PARSING_JOB_ARCHITECTURE.md) for detailed design and implementation plan.

## Out of Scope

- Editing or modifying uploaded scripts beyond parsing correction
- OCR for scanned/image-based PDFs (requires text-based PDFs only)
- Automatic translation of non-English plays
- Analysis of play themes, sentiment, or literary elements
- Support for screenplays, musical scores, or non-theatrical scripts
- Collaboration features for shared script editing
- Version control for multiple uploads of the same play
