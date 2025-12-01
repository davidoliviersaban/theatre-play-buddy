# Feature Specification: Companion Text-to-Speech

**Feature Branch**: `003-companion-tts`  
**Created**: December 1, 2025  
**Status**: Draft  
**Input**: User description: "Add text-to-speech functionality so the companion speaks other characters' lines aloud during practice sessions"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Other Character Speech Playback (Priority: P1)

During practice sessions, when the user is rehearsing their character's lines, the companion automatically speaks aloud the lines of other characters (those not assigned to the user), providing realistic dialogue exchange for effective rehearsal.

**Why this priority**: This is the core value proposition - enabling solo actors to practice with realistic dialogue partners. Without this, the feature provides no value. This delivers immediate, tangible benefit for practice sessions.

**Independent Test**: Start a practice session where the user is assigned to one character. When a line from a different character appears, the companion reads it aloud using text-to-speech. Success metric: Non-user character lines are spoken within 1 second of appearing.

**Acceptance Scenarios**:

1. **Given** a user is practicing as "Hamlet" in Act 3, Scene 1, **When** a line from "Ophelia" appears, **Then** the companion speaks Ophelia's line aloud using text-to-speech
2. **Given** the companion is speaking a line, **When** the line contains multiple sentences, **Then** the companion maintains natural pacing with appropriate pauses between sentences
3. **Given** a scene with rapid dialogue exchanges, **When** lines alternate between user and other characters, **Then** the companion speaks only the non-user character lines without reading the user's lines
4. **Given** the companion is speaking a long line (50+ words), **When** the user advances to the next line, **Then** the current speech is interrupted and the new line begins speaking immediately

---

### User Story 2 - Stage Direction Narration (Priority: P2)

During practice sessions, stage directions are narrated aloud by the companion in a distinct voice or tone, helping the user understand blocking, actions, and scene context without breaking focus to read silently.

**Why this priority**: Stage directions provide critical context for performance but aren't dialogue. This enhances the practice experience but the feature still works without it (P1 alone is viable). This adds theatrical context awareness.

**Independent Test**: Start a practice session containing stage directions (e.g., "[Exit Hamlet]" or "[They fight]"). Verify stage directions are spoken in a distinct voice/style from dialogue. Success metric: Stage directions are narrated with clear vocal distinction from character dialogue.

**Acceptance Scenarios**:

1. **Given** a scene contains stage directions between dialogue lines, **When** a stage direction appears (e.g., "[Ophelia enters]"), **Then** the companion narrates it in a neutral, descriptive tone distinct from character voices
2. **Given** a stage direction contains action descriptions (e.g., "[They embrace]"), **When** the direction is narrated, **Then** the companion uses present tense narration style ("They embrace" spoken as direction, not as dialogue)
3. **Given** a scene with inline stage directions (e.g., "HAMLET [aside]: To be or not to be"), **When** the line is spoken, **Then** the companion speaks "aside" as a direction before speaking the dialogue

---

### User Story 3 - Multi-Character Line Handling (Priority: P3)

When a line is assigned to multiple characters speaking in unison (e.g., "ALL: Hail, King!"), the companion speaks the line only if the user's character is not part of the group, ensuring the user still speaks their own lines even in chorus situations.

**Why this priority**: Multi-character lines are less common and the feature works without this edge case handling. This is a polish feature that prevents confusion in ensemble scenes but isn't core functionality.

**Independent Test**: Create a scene with a line marked "ALL" or "GUARDS" where user's character is included. Verify the companion does NOT speak this line. Create another line with "GUARDS" where user is a different character - verify companion DOES speak it. Success metric: Companion correctly identifies whether user is part of multi-character group.

**Acceptance Scenarios**:

1. **Given** the user is practicing as "Guard 1" and a line is marked "GUARDS: Who goes there?", **When** this line appears, **Then** the companion does NOT speak it (user is part of "GUARDS" group)
2. **Given** the user is practicing as "Hamlet" and a line is marked "ALL: Long live the King!", **When** this line appears, **Then** the companion speaks it because Hamlet is part of "ALL"
3. **Given** a line is marked with multiple specific characters "ROSENCRANTZ and GUILDENSTERN: My lord!", **When** the user is playing Hamlet, **Then** the companion speaks the line as it's not the user's character

---

### User Story 4 - Voice Customization (Priority: P4)

Users can configure text-to-speech settings including voice selection (male/female/neutral), speech rate (words per minute), and volume level, allowing personalization of the practice experience to match their preferences and acoustic environment.

**Why this priority**: Customization enhances user experience but the feature works with default settings. This is a quality-of-life improvement that doesn't affect core functionality but improves user satisfaction over time.

**Independent Test**: Access TTS settings and change voice to a different option, adjust speech rate to 150% of default, and set volume to 75%. Start practice session and verify changes are applied. Success metric: All settings persist across sessions and are applied to spoken lines.

**Acceptance Scenarios**:

1. **Given** a user opens TTS settings, **When** they select a different voice from the available options, **Then** the companion immediately previews the selected voice and applies it to all subsequent lines
2. **Given** a user adjusts speech rate to 1.5x normal speed, **When** the companion speaks a line, **Then** the line is spoken 50% faster while maintaining natural intonation
3. **Given** a user sets volume to 50%, **When** the companion speaks, **Then** the audio output is at half the system volume level
4. **Given** a user enables "Auto-pause after companion line" setting, **When** the companion finishes speaking a line, **Then** the practice session automatically pauses until the user advances manually

---

### User Story 5 - Accessibility Features (Priority: P5)

The companion provides visual indicators during speech (e.g., highlighting spoken text, showing speaker name) and allows users to replay the last spoken line, supporting users with hearing difficulties or those in noisy environments who need both audio and visual feedback.

**Why this priority**: Accessibility is important but the feature functions without these enhancements. This extends reach to users with specific needs and improves usability in challenging environments, but isn't required for core functionality.

**Independent Test**: Enable visual indicators in settings. During practice, verify that spoken text is highlighted while being read. Press "replay last line" button and verify the previous line is spoken again. Success metric: Visual highlighting syncs with speech, replay button works 100% of time.

**Acceptance Scenarios**:

1. **Given** visual indicators are enabled, **When** the companion speaks a line, **Then** the currently spoken word or phrase is highlighted in the UI in real-time
2. **Given** the companion has just finished speaking a line, **When** the user presses the "replay" button (or keyboard shortcut R), **Then** the companion speaks the same line again with identical settings
3. **Given** a user has hearing difficulties, **When** the companion speaks, **Then** a visual waveform or speaking indicator is displayed showing audio activity
4. **Given** the companion is speaking a long line, **When** the user enables closed captions, **Then** the text of the line appears as scrolling captions synchronized with the speech

---

### Edge Cases

- **What happens when the companion is speaking and the user skips ahead multiple lines?** The current speech should be immediately interrupted and the companion should speak the line for the new current position (if it's a non-user character line)
- **How does the system handle lines with no clear character attribution?** Narrator lines or unclear attribution should be treated as stage directions and narrated in neutral tone
- **What happens when the user's character has dialogue with themselves (internal monologue marked as separate character)?** The companion should NOT speak internal monologue variations of the user's assigned character (e.g., if user is "Hamlet", don't speak "Hamlet's Thoughts")
- **How does the system behave when TTS service is unavailable or fails?** Display visual-only mode with clear error message, allow user to continue practice without audio, and retry TTS on next line
- **What happens in scenes where the user is assigned to multiple characters (covering multiple roles)?** The companion should NOT speak any lines assigned to any of the user's selected characters
- **How are non-English plays or special characters (accents, symbols) handled?** TTS should support Unicode text and detect language where possible; if language detection fails, default to English pronunciation with graceful degradation
- **What happens when a line contains only stage directions (no dialogue)?** The companion should narrate the stage direction in neutral tone without character voice
- **How does the system handle very long lines (100+ words) that might cause TTS latency?** Display line immediately, begin TTS as soon as possible, show loading indicator if TTS takes >500ms, allow user to skip even during loading

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST speak aloud all lines assigned to characters other than the user's selected character(s) during practice sessions
- **FR-002**: System MUST NOT speak aloud lines assigned to the user's selected character(s)
- **FR-003**: System MUST begin text-to-speech playback within 1 second of a non-user character line appearing on screen
- **FR-004**: System MUST immediately interrupt current speech playback when the user advances to a different line
- **FR-005**: System MUST narrate stage directions in a distinct voice or tone from character dialogue
- **FR-006**: System MUST distinguish between dialogue lines and stage directions for appropriate speech styling
- **FR-007**: System MUST handle multi-character lines (e.g., "ALL:", "GUARDS:") by determining if user's character is part of the group
- **FR-008**: System MUST NOT speak multi-character lines when the user's character is included in the speaking group
- **FR-009**: System MUST speak multi-character lines when the user's character is NOT included in the speaking group
- **FR-010**: System MUST provide user-configurable settings for voice selection, speech rate, and volume
- **FR-011**: System MUST persist TTS settings across practice sessions
- **FR-012**: System MUST provide visual preview of voice settings when user changes configuration
- **FR-013**: System MUST provide a "replay last line" function accessible via button or keyboard shortcut
- **FR-014**: System MUST provide visual indicators showing when the companion is speaking (optional feature, enabled via settings)
- **FR-015**: System MUST highlight currently spoken text in real-time when visual indicators are enabled
- **FR-016**: System MUST gracefully degrade to visual-only mode when TTS service fails, with clear error messaging
- **FR-017**: System MUST support text containing Unicode characters, accents, and special symbols
- **FR-018**: System MUST handle TTS latency >500ms by showing loading indicator while maintaining UI responsiveness
- **FR-019**: System MUST allow users to enable/disable TTS globally for practice sessions
- **FR-020**: System MUST allow users to enable/disable stage direction narration independently from character dialogue

### Key Entities

- **TTSConfiguration**: Represents user's text-to-speech preferences including voice ID/name (string identifier for selected voice), speech rate (multiplier, 0.5-2.0, default 1.0), volume level (percentage, 0-100, default 100), stage directions enabled (boolean, default true), visual indicators enabled (boolean, default false), auto-pause after speech (boolean, default false)
- **SpeechEvent**: Represents a single text-to-speech utterance including line ID being spoken, character name (or "STAGE_DIRECTION"), spoken text content, speech start timestamp, speech end timestamp, interrupted flag (boolean), replay count (number of times replayed)
- **VoiceOption**: Represents an available TTS voice including voice ID, display name, language code (e.g., "en-US"), gender/style descriptor (e.g., "male", "female", "neutral"), sample text for preview

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Non-user character lines are spoken aloud within 1 second of appearing on screen in 95% of cases (measurable via timestamp tracking)
- **SC-002**: Users report improved practice session quality with TTS enabled vs. disabled (measurable via A/B testing and user feedback surveys, target 70% preference for TTS-enabled sessions)
- **SC-003**: TTS service availability and success rate exceeds 98% (measurable via error rate monitoring)
- **SC-004**: Users can complete full practice sessions without manually disabling TTS due to frustration or errors (measurable via session completion rate and TTS disable events, target <10% disable rate)
- **SC-005**: Stage directions are clearly distinguishable from character dialogue in user perception tests (measurable via user surveys, target 85% of users correctly identify stage directions vs. dialogue when listening)
- **SC-006**: Multi-character line handling accuracy is 100% for explicit character lists (e.g., "HAMLET and OPHELIA") (measurable via automated test suite)
- **SC-007**: Speech interruption when user skips lines occurs within 200ms (measurable via audio stream monitoring)
- **SC-008**: TTS settings changes are applied immediately with <500ms preview latency (measurable via UI interaction timing)
- **SC-009**: Users with hearing difficulties report improved practice accessibility with visual indicators enabled (measurable via accessibility survey, target 60% positive feedback from users who identify as having hearing challenges)
- **SC-010**: Replay function works successfully in 100% of attempts (measurable via error tracking and automated testing)
