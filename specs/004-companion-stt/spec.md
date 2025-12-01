# Feature Specification: Companion Speech-to-Text Evaluation

**Feature Branch**: `004-companion-stt`  
**Created**: December 1, 2025  
**Status**: Draft  
**Input**: User description: "Speech-to-text so application can evaluate correctness of the sentence said out loud vs the one expected. It computes a matching score and makes the progress evolve depending on the correctness"

## User Scenarios & Testing *(mandatory)*

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

### User Story 1 - Real-time Pronunciation Check (Priority: P1)

When the user speaks their line during practice, the app transcribes the audio in real time, compares it to the expected text, computes a matching score, and immediately updates progress based on correctness, providing instant feedback to improve memorization and delivery.

**Why this priority**: This is the core value—turning spoken practice into measurable, actionable feedback. Without real-time scoring and progress updates, the feature doesn’t deliver its intended learning impact.

**Independent Test**: Select a line in practice mode, press “Speak”, read the line aloud. Verify a transcript appears, a matching score is computed, and the progress bar updates accordingly without relying on any other features. Success metric: Transcript, score, and progress update appear within 2 seconds of line completion.

**Acceptance Scenarios**:

1. **Given** a user is on a specific line in practice mode, **When** they speak the line aloud, **Then** the system displays a transcript, a correctness score (0–100), and updates the progress for that line immediately
2. **Given** a user mispronounces or omits words, **When** scoring completes, **Then** the correctness score reflects the deviations and progress increases proportionally to the score
3. **Given** background noise, **When** the system detects low confidence transcription, **Then** it indicates “low confidence” and suggests retry without penalizing progress
4. **Given** the user pauses mid-line, **When** silence exceeds a threshold, **Then** the system ends capture gracefully and computes a score based on spoken portion

---

### User Story 2 - Guided Retry and Coaching (Priority: P2)

After scoring, the app highlights mismatched words/phrases and offers a focused retry option that replays the expected line visually, enabling targeted practice until the user reaches a satisfactory score.

**Why this priority**: Feedback without guidance is less effective. Targeted retry accelerates learning and motivates improvement.

**Independent Test**: Speak a line with deliberate mistakes. Verify that the UI highlights mismatches and provides a “Retry” action focused on the problematic segments. Success metric: User can improve score by at least 20 points within two retries.

**Acceptance Scenarios**:

1. **Given** a computed score below the user’s target threshold, **When** the result is shown, **Then** the UI highlights words that were missing, wrong order, or mispronounced
2. **Given** highlighted mismatches, **When** the user taps “Retry”, **Then** the app starts a new capture and evaluates only the current line again
3. **Given** a second attempt, **When** the user speaks more accurately, **Then** the score increases accordingly and the UI shows improvement deltas

---

### User Story 3 - Progress Integration (Priority: P3)

Speech-based scores contribute to the user’s overall practice progress for the play, act, and scene. Each evaluated line updates completion metrics, streaks, and daily stats.

**Why this priority**: Converts momentary feedback into durable progress, keeping users engaged and accountable.

**Independent Test**: Complete five lines with varied scores. Verify per-line progress, aggregate scene/act completion, and daily stats update. Success metric: Aggregates reflect the weighted contribution of each line’s score.

**Acceptance Scenarios**:

1. **Given** a line score is computed, **When** progress updates, **Then** the line’s completion rate is set to that score (or mapped via thresholds)
2. **Given** multiple lines are evaluated, **When** the user opens daily stats, **Then** the total practiced time, lines attempted, and average score are correctly displayed
3. **Given** a previously practiced line, **When** the user improves their score, **Then** the line’s completion rate increases and is reflected in scene and act progress

---

### User Story 4 - Accessibility and Environment Controls (Priority: P4)

Users can adjust capture sensitivity (e.g., noise suppression level) and enable captions of the expected line during speaking, improving usability in noisy spaces and for users with hearing or speech differences.

**Why this priority**: Removes environmental and accessibility barriers, broadening feature usefulness.

**Independent Test**: Enable noise suppression and captions, speak a line in a noisy environment. Success metric: Transcription confidence increases by ≥15% compared to baseline.

**Acceptance Scenarios**:

1. **Given** a noisy setting, **When** the user increases noise suppression, **Then** transcription confidence improves and fewer words are marked mismatched
2. **Given** captions enabled, **When** the user speaks, **Then** the expected line is displayed as a visual aid without affecting scoring fairness

---

### Edge Cases

- What happens when the microphone permission is denied? The app shows a clear prompt to enable mic access and disables STT evaluation until granted
- How does the system handle extremely long lines (>200 words)? The app suggests segmenting into phrases and evaluates each segment separately, aggregating scores
- What if transcription confidence is very low (<50%)? The app labels the attempt as “uncertain” and does not update progress, recommending a retry
- How does the system handle accents and dialects? Scoring tolerates pronunciation variants by focusing on word presence/order over phonetic exactness
- What happens when the user speaks additional words not in the line? Extra words are ignored for correctness unless they change the order or omit required words
- How does the system handle partial attempts (user stops halfway)? Score reflects spoken portion; progress updates only if minimum coverage threshold is met (e.g., ≥70% of words attempted)
- What happens if the user is practicing multi-character lines? The expected text corresponds only to the user’s assigned character portion; the rest is excluded from scoring

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST capture user speech for the currently selected line during practice
- **FR-002**: System MUST transcribe captured audio into text and provide a confidence score
- **FR-003**: System MUST compute a correctness score (0–100) by comparing transcript vs expected text using word-level alignment and tolerance for minor variations
- **FR-004**: System MUST visually display the transcript, correctness score, and confidence indicators
- **FR-005**: System MUST update the line’s completion/progress based on the correctness score (e.g., direct mapping or threshold-based)
- **FR-006**: System MUST support immediate retry and recalculation without leaving the current line
- **FR-007**: System MUST highlight mismatches (missing, extra, wrong order) to guide improvement
- **FR-008**: System MUST handle low-confidence transcriptions by recommending retry without penalizing progress
- **FR-009**: System MUST respect microphone permissions and provide clear guidance when access is denied
- **FR-010**: System MUST provide accessibility controls (noise suppression level, expected line captions)
- **FR-011**: System MUST store per-line attempt history (timestamp, score, confidence, duration) for daily stats
- **FR-012**: System MUST aggregate per-line scores into scene/act/play progress metrics
- **FR-013**: System MUST support segmentation for long lines and aggregate segment scores
- **FR-014**: System MUST allow user-configurable target score thresholds (e.g., 80 to mark “mastered”)
- **FR-015**: System MUST handle partial attempts and set minimum coverage threshold before updating progress
- **FR-016**: System MUST exclude non-user portions of multi-character lines from expected text during scoring
- **FR-017**: System MUST provide clear error messaging for mic failures, STT failures, and timeouts
- **FR-018**: System MUST operate within practice mode without affecting import or parsing features

### Key Entities *(include if feature involves data)*

- **STTAttempt**: Represents a single evaluation attempt including lineId, transcript text, correctness score (0–100), confidence score (0–100), duration (ms), mismatches (list of word indices and reasons), createdAt timestamp
- **STTSettings**: User preferences for speech evaluation including noise suppression level (0–3), captions enabled (boolean), target score threshold (default 80), minimum coverage threshold (default 70%), language preference (optional)
- **PracticeProgressUpdate**: A progress delta generated from STT results including lineId, previousCompletion, newCompletion, aggregates affected (sceneId, actId), and computed stats (avgScore, attempts)

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: Transcript, correctness score, and progress update appear within 2 seconds of line completion in 95% of attempts
- **SC-002**: Matching score correlates with word-level accuracy at ≥90% agreement in validation tests
- **SC-003**: Users improve average correctness score by ≥20 points after two guided retries (coaching effectiveness)
- **SC-004**: Daily stats reflect accurate aggregation of attempts (lines attempted, average score, total practice time) with ≤2% variance in audits
- **SC-005**: Low-confidence transcription detection (<50%) correctly avoids progress updates in ≥95% cases
- **SC-006**: Accessibility controls reduce mismatch rate in noisy settings by ≥15% compared to baseline
- **SC-007**: Partial attempts only update progress when coverage ≥70% of expected words, enforced in ≥99% cases
