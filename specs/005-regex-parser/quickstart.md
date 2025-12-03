# Quick Start: Regex Parser

This guide explains how to use the regex-based parser to convert a play's plain text into the StructuredPlay model.

## Prerequisites

- Repository setup with Docker and local PostgreSQL running
- Plain text input of the play (from PDF/DOC/DOCX extraction pipeline)

## Steps

1. Prepare your input

- Ensure you have the raw text of the play. Save it locally or send it via API.

2. Invoke the API

- Endpoint: `POST /api/parse/regex`
- Body:

```
{
  "text": "...full play text...",
  "preset": "modern", // optional: e.g., "shakespeare"
  "options": {
    "language": "fr",
    "normalization": {
      "trim": true,
      "collapseWhitespace": true,
      "normalizeDashes": true,
      "normalizeQuotes": true,
      "mergeWrappedLines": true
    }
  }
}
```

3. Review output

- Response includes `play` (StructuredPlay) and `metrics` (duration, hits, unmatched).

4. Adjust presets

- Use admin UI or config to select different presets if accuracy falls below targets.

## Notes

- For non-standard formats, the parser flags low-confidence segments.
- Consider adding character aliases in presets for abbreviation-heavy scripts.
