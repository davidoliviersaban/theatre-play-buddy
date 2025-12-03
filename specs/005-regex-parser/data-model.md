# Data Model: StructuredPlay Output for Regex Parser

This feature produces data conforming to the StructuredPlay model.

## Entities

- Playbook

  - id, title, author, year, genre, description, coverImage?
  - characters: Character[]
  - acts: Act[]

- Character

  - id, name, description?, isFavorite?, lastSelected?, completionRate?

- Act

  - id, title, scenes: Scene[]

- Scene

  - id, title, lines: Line[]

- Line
  - id, text, type: "dialogue" | "stage_direction"
  - characterId? (single speaker)
  - characterIdArray? (multi-speaker: e.g., "ALL:")

## Validation Rules

- Acts and scenes must preserve source order.
- Dialogue lines must attribute to a known Character when confidence ≥ threshold; otherwise use Unknown character placeholder with alias resolution.
- Stage directions identified from brackets/parentheses or keywords must be type `stage_direction`.
- Titles for acts/scenes derived from matched headers; default to "Act N"/"Scene M" when absent.
- Characters dictionary built from hints and observed dialogue; alias normalization applied.

## State Transitions

- ParsingSession → ParseResult
  - Session collects metrics during parsing
  - Result persisted to DB aligned with existing parse job models

## Notes

- No schema changes required versus existing LLM parser target.
- Metrics are auxiliary and stored alongside parse jobs/sessions.
