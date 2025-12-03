# Feature Specification: Regex-Based Play File Parsing

Feature Branch: `005-regex-parser`
Created: December 3, 2025
Status: Draft
Input: "LLM parser is slow (~30 min). Define an alternative parsing strategy using regex in 3 phases."

## Summary

Introduce a deterministic, regex-driven parsing pipeline as an alternative to the LLM parser to significantly reduce parsing time and improve predictability for common play formats. The approach is split into three phases:

1. Extract acts, characters, and structural hints from the raw text (header scanning, TOC-like patterns, known prefixes).
2. Learn/assemble separators between scenes/acts and character lines and stage directions to generate robust, configurable regex patterns.
3. Apply the regex patterns to parse the full file into the StructuredPlay model.

This path prioritizes speed and reproducibility, trading off flexibility for convention-driven formats. It will be complemented by fallback heuristics for non-standard layouts.

## User Scenarios & Testing

- Fast parsing without LLM

  - Given a play in a conventional format (acts, scenes, character lines prefixed by names), when the user uploads it, then parsing completes under 30 seconds for 100 pages.
  - Test: Measure parsing time and verify structure extraction (acts, scenes, characters) is correct.

- Accurate structure identification

  - Given the file contains explicit markers ("ACT I", "SCENE 2", character names in caps), when regex parsing runs, then the parsed model includes correct act/scene boundaries, character attribution, and stage directions.
  - Test: Use fixtures with varied formats; assert boundaries and line types.

- Configurable patterns
  - Given different play formats, when an admin adjusts pattern presets (e.g., Shakespeare vs modern plays), then the parser uses those to correctly parse with minimal code changes.
  - Test: Pattern presets table-driven; verify parsing across multiple presets.

## Functional Requirements

- FR-001: Provide a regex-based parser that completes parsing of 100-page plays in under 30 seconds on typical hardware.
- FR-002: Identify acts/scenes, characters, and line types (dialogue vs stage directions) without external model calls.
- FR-003: Support configurable pattern presets and per-file overrides (metadata or detected heuristics).
- FR-004: Handle common formatting variations (caps names, colon separators, bracketed stage directions, indented directions).
- FR-005: Produce a StructuredPlay-compatible output identical to the LLM parser’s target schema.
- FR-006: Log parsing metrics (duration, lines processed, unmatched rates, regex hit rates).
- FR-007: Provide fallbacks for ambiguous lines (mark unknown character, attach to nearest speaker or scene).
- FR-008: Support pluggable normalization (trim whitespace, normalize em dashes, collapse multiple spaces, unify quotes).

## Success Criteria

- SC-001: Parsing time under 30 seconds for 100 pages (baseline text fixtures).
- SC-002: ≥95% accuracy in boundary detection (acts/scenes) on standard-formatted scripts.
- SC-003: ≥95% accuracy in character attribution when names are clearly marked.
- SC-004: ≤5% unmatched lines logged; unmatched lines are still included in output as stage directions or generic lines.
- SC-005: Configurable presets enable successful parsing across at least 3 distinct formatting conventions.

## Key Entities

- PatternPreset: Named collection of regex rules for acts, scenes, characters, and stage directions.
- ParsingHints: Extracted from headers/TOC or preamble; includes candidate character names, likely separators, capitalization style.
- ParseResult: StructuredPlay model with detailed metrics and unmatched-line registry.

## State of the Art & Strategies

- Rule-based text structuring

  - Use multi-pass regex: first pass for coarse boundaries (acts/scenes), second pass for in-scene lines, third pass for stage directions.
  - Benefits: Deterministic, fast; Drawbacks: brittle for unusual formats.

- Heuristic name detection

  - Extract candidate character names from preamble: lines in ALL CAPS, colon-separated names ("HAMLET:"), or bold/underscored markers.
  - Maintain a dictionary of names (normalized), support aliases (e.g., "HAM." → "HAMLET").

- Separator inference

  - Learn likely scene separators (e.g., "SCENE [IVX]+" or "SCENE \d+"), act separators ("ACT [IVX]+"), and character line separators ("NAME:\s" or "^NAME\s") via pattern votes.
  - Stage direction detection via brackets/italics markers: "[Aside]", "(Enter)".

- Robustness techniques

  - Use anchored regex (start-of-line) where helpful; allow optional whitespace; tolerate punctuation.
  - Prioritize longest match and prefer explicit markers over ambiguous patterns.
  - Employ post-process normalization: dedent, wrap long lines, merge broken lines.

- Hybrid fallback
  - If regex confidence drops (high unmatched rates), fallback to lightweight heuristics (e.g., dictionary of characters + colon lines), and mark low-confidence segments.

## Three-Phase Implementation Plan

### Phase 1: Extraction of Acts, Characters, Etc.

- Detect acts/scenes via coarse regex:
  - Acts: `/^\s*ACT\s+([IVX]+|\d+)/i`
  - Scenes: `/^\s*SCENE\s+([IVX]+|\d+)/i`
- Identify candidate character names:
  - ALL CAPS lines: `/^[A-Z][A-Z\s\-']{2,}$/`
  - Name followed by colon: `/^([A-Z][A-Za-z\-']{1,})\s*:\s/`
- Collect stage direction markers:
  - Bracketed: `/\[(.*?)\]/`, Parenthetical: `/\((.*?)\)/`, conventional words: `Enter|Exit|Aside` (case-insensitive)
- Produce ParsingHints: { actsFound, scenesFound, candidateCharacters, separators }

### Phase 2: Build Separators & Regexes

- From hints, assemble PatternPreset:
  - actSeparator, sceneSeparator regex
  - characterLine: anchored at line start with candidate names or dictionary
  - stageDirection: bracket/parenthesis markers and keywords
- Normalize text: trim, unify whitespace, fix broken lines (merge lines ending with hyphen/continuation).
- Validate patterns on small samples; compute hit rates.

### Phase 3: Parse the File

- Split text into acts and scenes using separators (retain overlapping context if needed).
- Within each scene, parse lines:
  - If line matches characterLine: create dialogue line with speaker
  - Else if matches stageDirection: mark as stage_direction
  - Else: mark as narration or stage_direction depending on punctuation/format
- Assemble StructuredPlay output:
  - Characters (dictionary from hints + observed lines)
  - Acts → Scenes → Lines structure
- Collect metrics: total lines, matched dialogue, matched stage directions, unmatched lines, parse time

## Assumptions

- Plays use conventional markers for acts/scenes and character lines in a significant subset of cases.
- Bracketed/parenthetical stage directions are common enough to detect reliably.
- Configurable presets can be curated for common formats (e.g., Shakespeare, modern script layout).

## Risks & Mitigations

- Non-standard formats may reduce accuracy
  - Mitigation: Fallback heuristics and low-confidence flags; user review tools.
- Character aliasing and abbreviations
  - Mitigation: Alias table and normalization; learn from header lists.
- Line breaks and wrapped text
  - Mitigation: Pre-normalization to merge wrapped lines via heuristics.

## Deliverables

- Regex parser module with presets and heuristics
- Unit tests for pattern detection and phase outputs
- Integration tests on representative fixtures (at least 3 formats)
- Metrics collection and logging
- Optional admin UI for preset selection and overrides
