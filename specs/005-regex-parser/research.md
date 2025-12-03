# Research: Regex-Based Play File Parsing

Date: 2025-12-03
Branch: 005-regex-parser
Spec: /specs/005-regex-parser/spec.md

## Unknowns Resolved

1. Testing stack

- Decision: Use Jest for unit/integration. Optional Playwright for admin UI presets.
- Rationale: Project already uses Jest; fast feedback. UI presets are secondary.
- Alternatives: Vitest (similar), Playwright only (overkill for parser).

2. Hardware baseline for performance (<30s for ~100 pages)

- Decision: Target Apple M1/M2 or equivalent desktop; single-threaded Node regex.
- Rationale: Aligns with local dev machines.
- Alternatives: Parallel chunking (future optimization), WebAssembly engines.

3. PatternPreset scope and configurability

- Decision: Include act, scene, characterLine, stageDirection regexes; normalization rules (trim, whitespace collapse, dash/quote normalization, merge wrapped lines).
- Rationale: Covers key line types and common formatting variance.
- Alternatives: Full grammar parser (higher complexity, lower speed).

4. Fallback strategy for low confidence

- Decision: If unmatched >5% or dialogue hit rate <95%, enable lightweight heuristics: colon-based attribution, ALL CAPS names, nearest-speaker attachment; mark low-confidence segments.
- Rationale: Keeps output usable while flagging uncertainty.
- Alternatives: Invoke LLM (violates performance/privacy goals).

5. Alias handling for character abbreviations

- Decision: Maintain alias table from hints (e.g., HAM., KING → HAMLET, KING CLAUDIUS). Normalized dictionary used in characterLine regex.
- Rationale: Common in scripts; improves attribution.
- Alternatives: Levenshtein matching (slower), manual-only mapping.

6. Metrics collection and storage

- Decision: Log to structured app logs; persist per file in DB (parse_sessions/parse_jobs exist). Store: duration, totalLines, dialogueHits, stageDirectionHits, unmatchedLines.
- Rationale: Aligns with existing job models under `src/lib/db/jobs`.
- Alternatives: File-only logs (less queryable).

7. Integration point with ingestion

- Decision: Regex parser operates on plain text extracted upstream (existing PDF/DOC/TXT pipeline). API endpoint accepts raw text + optional preset.
- Rationale: Keeps parser orthogonal to document extraction.
- Alternatives: Direct PDF token scanning (format-specific complexity).

## Best Practices Gathered

- Use anchored patterns (`^`), allow optional whitespace, ignore case where applicable.
- Prefer explicit markers over heuristics; longest-match priority.
- Two-pass approach: boundaries first, then lines; avoid catastrophic backtracking.
- Normalize before parsing; dedent and merge broken lines.
- Table-driven presets with per-file overrides.

## Decisions Summary

- Decision: Regex-first, three-phase pipeline with presets and normalization.
- Rationale: Deterministic, fast, local.
- Alternatives considered: LLM-enhanced parsing (slow), grammar parsers (complex), heuristic-only (less robust).
