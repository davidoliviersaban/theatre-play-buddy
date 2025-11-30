# Feature Specification: Practice Mode (UI-only)

**Feature Branch**: `001-practice-mode`  
**Created**: 2025-11-30  
**Status**: Draft  
**Input**: User description: "Practice mode without audio: UI-only rehearsal experience where the app displays non-selected character lines and stage directions, pauses for the actor's chosen character, auto-advances on sentence completion (simulated without audio), tracks progress per user-character per scene, shows scene-level progress as % lines memorized, supports resume from last position, initial language French."

## User Scenarios & Testing _(mandatory)_

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Rehearse Selected Character (Priority: P1)

An actor selects a character in a play and rehearses their lines. The app shows non-selected characters' lines and stage directions, pauses at the actor's lines, and simulates auto-advance when the actor indicates sentence completion (no audio processing).

**Why this priority**: This is the MVP delivering core value—guided rehearsal flow—without audio stack complexity.

**Independent Test**: Can be fully tested by selecting a character, entering practice mode, stepping through a scene, and confirming pause/advance behavior and script visibility.

**Acceptance Scenarios**:

1. **Given** a play loaded that conforms to StructuredPlay and a selected character, **When** practice mode starts for a scene, **Then** the app displays other characters' lines and stage directions, and pauses on the selected character's line.
2. **Given** the actor is paused on their line, **When** the actor clicks "Line completed" or presses Enter, **Then** the app advances to the next sentence, with a visual indicator of progression.

---

### User Story 2 - Progress Tracking per Scene (Priority: P2)

Progress is tracked per user-character per scene as percentage of lines marked memorized. The actor can view progress at the scene level.

**Why this priority**: Progress visibility motivates practice and aligns with Constitution Article 10.

**Independent Test**: Practice a scene and mark lines as memorized; verify progress percentage updates and is displayed on the scene overview.

**Acceptance Scenarios**:

1. **Given** a scene with N lines for the selected character, **When** the actor marks k lines as memorized, **Then** the scene progress shows floor(k/N \* 100)% and persists.

---

### User Story 3 - Resume from Last Position (Priority: P3)

The actor can resume practice from the last position within a scene for the selected character.

**Why this priority**: Supports real-world rehearsal patterns and aligns with Article 9.

**Independent Test**: Exit practice mid-scene, re-enter practice later, and verify that the scene resumes at the last line/sentence position.

**Acceptance Scenarios**:

1. **Given** an actor practiced a scene and stopped at line L, **When** the actor returns to the same scene and character, **Then** the practice mode opens at line L (and sentence S if tracked).

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- Scene has zero lines for selected character → practice mode shows a notice and allows navigating to another scene.
- Mixed stage directions and dialogue formatting → renderer preserves structure; directions are visually distinct.
- Very long lines → UI supports line wrapping and scroll with sticky current line.
- Ambiguous sentence boundaries (no punctuation) → simulated advance works per line instead of sentence.
- Multiple characters selected across sessions → progress tracked independently per user-character per scene.

## Requirements _(mandatory)_

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST render practice mode with non-selected characters' lines and stage directions, pausing at the selected character's lines.
- **FR-002**: System MUST simulate end-of-sentence completion via explicit user action (button click or Enter) to auto-advance without audio.
- **FR-003**: System MUST track progress per user-character per scene as percentage of lines marked memorized.
- **FR-004**: System MUST persist resume position per user-character per scene (line index and optional sentence offset).
- **FR-005**: System MUST display scene-level progress summaries in the play listing and scene view.
- **FR-006**: System MUST support French language scripts (initial language) with UTF-8 characters.
- **FR-007**: System MUST conform to the StructuredPlay model for all practice content.

_Unclear or deferred requirements (within constitutional bounds):_

- **FR-008**: Error assistance via spoken line divergence is OUT OF SCOPE for this UI-only feature; will be covered in audio-enabled practice.
- **FR-009**: Performance <200ms applies to audio detection; for UI-only simulation, responsiveness SHOULD be instant, but no audio latency target applies.

### Key Entities

- **PracticeSession**: userId, playId, characterId, sceneId, currentLineIndex, currentSentenceIndex (optional), updatedAt
- **SceneProgress**: userId, playId, characterId, sceneId, totalLines, memorizedLines, percentage
- **StructuredPlay.Scene**: id, sequence, content[] where content items include dialogue (character, text) and stage directions (type, text)

## Success Criteria _(mandatory)_

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: Actors can complete rehearsal of a scene (≥ 20 lines) in under 10 minutes using UI-only advancement.
- **SC-002**: 95% of practice interactions (advance, mark memorized) complete in under 100ms as perceived by the user.
- **SC-003**: 90% of users can resume from the exact last position within a scene without manual navigation.
- **SC-004**: Scene progress percentage matches the ratio of memorized lines to total lines with ±0% error.
