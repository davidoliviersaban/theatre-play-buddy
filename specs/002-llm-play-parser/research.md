# Research: LLM Play Parser

**Date**: November 30, 2025  
**Phase**: 0 (Research & Planning)  
**Status**: Complete

## Overview

This document consolidates research findings for the LLM-powered play parser feature. All technical unknowns from the implementation plan have been resolved with specific recommendations.

---

## 1. Document Text Extraction

### Decision

- **PDF**: `pdf-parse` (Node.js)
- **DOCX**: `mammoth` (Node.js)
- **TXT**: Native `fs.readFile` with UTF-8 encoding

### Rationale

**pdf-parse**:

- Pure JavaScript, no external dependencies (no binary compilation)
- Works in Node.js server-side context (Next.js API routes)
- Extracts text with reasonable layout preservation
- 4M+ weekly downloads, actively maintained
- Handles standard text-based PDFs well (not OCR-scanned images)

**mammoth**:

- Converts DOCX to HTML/text with style preservation options
- Can extract raw text while ignoring formatting (perfect for our use case)
- Handles complex DOCX structures (tables, lists, headers)
- 600K+ weekly downloads, stable API
- Better than `docx` package for read-only text extraction

**TXT**:

- No library needed; use Node.js built-in `fs.readFile`
- Handle encoding detection (UTF-8, UTF-16, ISO-8859-1)
- Simple string processing

### Alternatives Considered

- **pdf.js**: More complex, designed for rendering PDFs in browsers; overkill for text extraction
- **pdfplumber** (Python): Excellent but requires Python runtime; adds deployment complexity
- **docx package**: More focused on document creation/manipulation; mammoth better for extraction

### Code Sample

```typescript
// src/lib/parse/extractors.ts
import pdf from "pdf-parse";
import mammoth from "mammoth";
import { readFile } from "fs/promises";

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text;
}

export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function extractTextFromTXT(buffer: Buffer): Promise<string> {
  // Try UTF-8 first, fallback to Latin-1 if needed
  try {
    return buffer.toString("utf-8");
  } catch {
    return buffer.toString("latin1");
  }
}

export async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  switch (mimeType) {
    case "application/pdf":
      return extractTextFromPDF(buffer);
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return extractTextFromDOCX(buffer);
    case "text/plain":
      return extractTextFromTXT(buffer);
    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
}
```

### Edge Cases

- **Scanned PDFs**: pdf-parse returns empty/garbled text. Detect low quality (e.g., <100 chars for multi-page doc) and prompt user to use text version
- **Password-protected PDFs**: pdf-parse throws error; catch and return user-friendly message
- **Large files**: Stream processing not available in pdf-parse; rely on file size limit (5MB) to prevent memory issues

---

## 2. LLM Provider Selection

### Decision

**Anthropic Claude 3.5 Sonnet** via Vercel AI SDK

### Rationale

**Advantages**:

- **Larger context window**: 200K tokens (vs GPT-4 Turbo's 128K)
  - Critical for large plays (500 pages ≈ 150K tokens)
- **JSON mode support**: Native structured outputs with schema enforcement
- **Streaming**: Full support via Vercel AI SDK `streamObject`
- **Cost-effective**: $3/M input tokens, $15/M output tokens (vs GPT-4 Turbo $10/$30)
- **Accuracy**: Excellent for structured extraction tasks per benchmarks
- **Constitution compliance**: Local deployment with API key (Principle VIII)

**OpenAI GPT-4 Turbo as fallback**:

- Provide option for users with existing OpenAI credits
- Similar capabilities, slightly higher cost
- Both providers supported via unified Vercel AI SDK interface

### Alternatives Considered

- **GPT-4o**: Faster but smaller context (128K); may struggle with full plays
- **Local models (Ollama)**: Limited structured output support; slower on CPU; accuracy concerns

### Code Sample

```typescript
// src/lib/parse/llm-parser.ts
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { generateObject, streamObject } from "ai";
import { z } from "zod";

export function getLLMProvider(provider: "anthropic" | "openai") {
  switch (provider) {
    case "anthropic":
      return anthropic("claude-3-5-sonnet-20241022");
    case "openai":
      return openai("gpt-4-turbo");
  }
}

export async function parsePlayStructure(
  text: string,
  schema: z.ZodSchema,
  provider: "anthropic" | "openai" = "openai"
) {
  const model = getLLMProvider(provider);

  return generateObject({
    model,
    schema,
    prompt: `Extract the play structure from the following text...`,
  });
}
```

---

## 3. Prompting Strategy

### Decision

**Multi-stage extraction with structured outputs**:

1. **Stage 1**: Extract metadata (title, author, characters)
2. **Stage 2**: Identify act/scene boundaries
3. **Stage 3**: Attribute lines to characters with stage directions

### Rationale

- **Incremental complexity**: Easier for LLM to handle in stages vs. one massive parse
- **Early validation**: Catch metadata errors before processing all lines
- **Streaming-friendly**: Can show progress between stages
- **Zod schema per stage**: Type-safe outputs at each step

### Prompt Templates

```typescript
// Stage 1: Metadata extraction
const metadataPrompt = `
You are a theatrical script parser. Extract the play metadata from the following text.

Rules:
- Title: The play's title (usually at the top)
- Author: Playwright name(s)
- Characters: All character names with descriptions (if provided)
- Ignore copyright notices, publication info, page numbers

Text:
${text.slice(0, 5000)} // First 5K chars usually contain metadata

Return a structured JSON matching the schema.
`;

// Stage 2: Structure segmentation
const structurePrompt = `
You are a theatrical script parser. Identify all acts and scenes in this play.

Rules:
- Acts: Major divisions (e.g., "ACT I", "ACT ONE", "Act 1")
- Scenes: Subdivisions within acts (e.g., "SCENE 1", "Scene i")
- Include start character position for each act/scene
- Preserve original numbering (Roman numerals, Arabic, etc.)

Text:
${text}

Return a structured JSON matching the schema.
`;

// Stage 3: Line attribution
const lineAttributionPrompt = `
You are a theatrical script parser. Extract all dialogue and stage directions.

Rules:
- Character dialogue: Lines spoken by characters (e.g., "HAMLET: To be or not to be")
- Stage directions: Action/setting descriptions (often in italics/parentheses)
- Multi-character lines: If multiple characters speak together (e.g., "BOTH:", "ALL:"), set characterId as array
- Preserve line order exactly as written
- Type: "dialogue" for spoken lines, "stage_direction" for actions

Scene text (Scene ${sceneId}):
${sceneText}

Characters in this play:
${characters.map((c) => c.name).join(", ")}

Return a structured JSON matching the schema.
`;
```

### Few-Shot Examples

Include 2-3 examples in each prompt:

```typescript
const fewShotExample = `
Example input:
"HAMLET: To be, or not to be, that is the question.
[He draws his sword]
OPHELIA: My lord!"

Example output:
{
  "lines": [
    {
      "characterId": "hamlet",
      "text": "To be, or not to be, that is the question.",
      "type": "dialogue",
      "order": 1
    },
    {
      "text": "He draws his sword",
      "type": "stage_direction",
      "order": 2
    },
    {
      "characterIdArray": ["ophelia", "hamlet"],
      "text": "My lord!",
      "type": "dialogue",
      "order": 3
    }
  ]
}
`;
```

### Alternatives Considered

- **Single-pass parsing**: Simpler but harder for LLM, lower accuracy
- **Chain-of-thought**: Adds verbosity; structured outputs sufficient

---

## 4. Multi-Character Attribution Algorithm

### Decision

**LLM-based detection (no language-specific pattern fallback)**

### Algorithm Pseudocode

```typescript
// Step 1: LLM detects multi-character lines during parsing
// Prompt includes instruction:
"If multiple characters speak the same line together (e.g., any locale-specific equivalent of 'BOTH', 'ALL'),
set characterIdArray as an array of character IDs. Use characterId for single speaker. You may introduce supplementary
group characters (e.g., Chorus, Crowd) when the text semantically implies a group voice and such characters don't
already exist in the dramatis personae."

// Step 2: Post-processing validation
function validateMultiCharacterLine(line: ParsedLine, characters: Character[]) {
  // Single character or stage direction - no action needed
  if (!line.characterIdArray || line.characterIdArray.length === 0) {
    return line;
  }

  // Multi-character attribution
  const charIds = line.characterIdArray;

  // Validate all IDs exist
  const validIds = charIds.filter(id =>
    characters.some(c => c.id === id)
  );

  if (validIds.length === 0) {
    // Fallback: mark as stage direction if all IDs invalid
    return { ...line, characterId: undefined, characterIdArray: undefined, type: 'stage_direction' };
  }

  return { ...line, characterIdArray: validIds };
}

// Note: We avoid language-specific pattern matching to remain locale-agnostic.
// For now, we do not support crowd or unknown speakers (without explicit character mapping).
// When such a case is detected by the LLM or during validation, raise an event for telemetry:
//   { event: 'unsupported_speaker', kind: 'crowd' | 'unknown', sample: line.text }
// This lets us measure frequency and prioritize future support.
```

### Edge Cases

1. **"ALL:" vs specific characters**: LLM should use array of all character IDs present in scene
2. **"BOTH:" with >2 characters in scene**: Require manual review (future feature)
3. **Chorus characters**: Treat as single character entity, not multi-attribution
4. **Overlapping dialogue**: Not supported in Phase 1; mark as sequential lines

### Data Model Update

```typescript
// Existing Line type already supports this:
type Line = {
  characterId?: string | string[]; // ✅ Already supports array
};

// Zod schema:
const LineSchema = z.object({
  characterId: z.union([z.string(), z.array(z.string())]).optional(),
});
```

---

## 5. Streaming Progress Implementation

### Decision

**Server-Sent Events (SSE)** via Next.js API route

### Rationale

**Advantages over WebSocket**:

- Simpler implementation (one-way server→client)
- Native Next.js support (no external server needed)
- Automatic reconnection in browsers
- Works with Vercel AI SDK `streamObject` out of the box
- No additional libraries required

**Vercel AI SDK integration**:

- `streamObject` returns async iterator
- Convert to SSE stream in Next.js route handler

### Code Sample

```typescript
// src/app/import/api/parse/route.ts
import { NextRequest } from "next/server";
import { streamObject } from "ai";
import { getLLMProvider } from "@/lib/parse/llm-parser";
import { PlaybookSchema } from "@/lib/parse/schemas";

export async function POST(req: NextRequest) {
  const { uploadId, llmProvider } = await req.json();

  // Retrieve uploaded file text
  const text = await getUploadedText(uploadId);

  const model = getLLMProvider(llmProvider);

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        // Stream object parsing
        const { partialObjectStream } = await streamObject({
          model,
          schema: PlaybookSchema,
          prompt: `Parse this play: ${text}`,
        });

        for await (const partialObject of partialObjectStream) {
          // Send progress updates
          const event = {
            type: "progress",
            data: partialObject,
            percent: calculateProgress(partialObject),
          };

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "complete" })}\n\n`)
        );
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              message: error.message,
            })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

```typescript
// Client-side consumption (src/components/import/parse-progress.tsx)
useEffect(() => {
  const eventSource = new EventSource("/api/import/parse");

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
      case "progress":
        setProgress(data.percent);
        setPartialData(data.data);
        break;
      case "complete":
        setComplete(true);
        eventSource.close();
        break;
      case "error":
        setError(data.message);
        eventSource.close();
        break;
    }
  };

  return () => eventSource.close();
}, []);
```

### Progress Calculation

```typescript
function calculateProgress(partial: Partial<Playbook>): number {
  const weights = {
    metadata: 10, // Title, author, characters
    acts: 30, // Act boundaries
    scenes: 30, // Scene boundaries
    lines: 30, // Line attribution
  };

  let progress = 0;

  if (partial.title && partial.author) progress += weights.metadata;
  if (partial.characters?.length > 0) progress += weights.metadata;
  if (partial.acts?.length > 0) progress += weights.acts;

  const expectedScenes =
    partial.acts?.reduce((sum, act) => sum + (act.expectedScenes || 0), 0) || 0;

  const actualScenes =
    partial.acts?.reduce((sum, act) => sum + (act.scenes?.length || 0), 0) || 0;

  if (expectedScenes > 0) {
    progress += (actualScenes / expectedScenes) * weights.scenes;
  }

  return Math.min(100, Math.round(progress));
}
```

### Alternatives Considered

- **WebSocket**: Overkill for one-way streaming; adds complexity
- **Polling**: Higher latency, more server load, worse UX

---

## 6. Validation Strategy

### Decision

**Multi-layer validation**:

1. **Zod schema enforcement** (runtime type safety)
2. **Post-parse sanity checks** (business logic validation)
3. **User review UI** (manual correction for edge cases)

### Zod Schema Strictness

```typescript
// src/lib/parse/schemas.ts
import { z } from "zod";

export const CharacterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
});

export const LineSchema = z
  .object({
    id: z.string().uuid(),
    sceneId: z.string().uuid(),
    characterId: z
      .union([z.string().uuid(), z.array(z.string().uuid())])
      .optional(),
    text: z.string().min(1),
    type: z.enum(["dialogue", "stage_direction"]),
    order: z.number().int().min(0),
  })
  .refine(
    (line) => {
      // Business rule: dialogue lines must have characterId
      if (line.type === "dialogue" && !line.characterId) {
        return false;
      }
      return true;
    },
    { message: "Dialogue lines must have a characterId" }
  );

export const SceneSchema = z.object({
  id: z.string().uuid(),
  actId: z.string().uuid(),
  title: z.string(),
  number: z.number().int().min(1),
  lines: z.array(LineSchema),
});

export const ActSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  number: z.number().int().min(1),
  scenes: z.array(SceneSchema).min(1),
});

export const PlaybookSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  author: z.string().min(1),
  year: z.number().int().optional(),
  characters: z.array(CharacterSchema).min(1),
  acts: z.array(ActSchema).min(1),
});
```

### Post-Parse Sanity Checks

```typescript
// src/lib/parse/validation.ts
export function validatePlaybook(playbook: Playbook): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check 1: All characterIds reference existing characters
  const charIds = new Set(playbook.characters.map((c) => c.id));

  playbook.acts.forEach((act) => {
    act.scenes.forEach((scene) => {
      scene.lines.forEach((line) => {
        if (line.characterId) {
          const ids = Array.isArray(line.characterId)
            ? line.characterId
            : [line.characterId];

          ids.forEach((id) => {
            if (!charIds.has(id)) {
              errors.push(
                `Line "${line.text.slice(
                  0,
                  50
                )}" references unknown character ID: ${id}`
              );
            }
          });
        }
      });
    });
  });

  // Check 2: Act/scene numbering is sequential
  playbook.acts.forEach((act, i) => {
    if (act.number !== i + 1) {
      warnings.push(
        `Act ${act.title} has number ${act.number}, expected ${i + 1}`
      );
    }

    act.scenes.forEach((scene, j) => {
      if (scene.number !== j + 1) {
        warnings.push(
          `Scene ${scene.title} in ${act.title} has number ${
            scene.number
          }, expected ${j + 1}`
        );
      }
    });
  });

  // Check 3: Minimum content thresholds
  const totalLines = playbook.acts.reduce(
    (sum, act) =>
      sum +
      act.scenes.reduce((sceneSum, scene) => sceneSum + scene.lines.length, 0),
    0
  );

  if (totalLines < 10) {
    errors.push(
      `Only ${totalLines} lines extracted - possible parsing failure`
    );
  }

  const dialogueLines = playbook.acts.reduce(
    (sum, act) =>
      sum +
      act.scenes.reduce(
        (sceneSum, scene) =>
          sceneSum + scene.lines.filter((l) => l.type === "dialogue").length,
        0
      ),
    0
  );

  if (dialogueLines < totalLines * 0.5) {
    warnings.push(
      `Only ${Math.round(
        (dialogueLines / totalLines) * 100
      )}% of lines are dialogue - verify parsing quality`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};
```

### Error Recovery Flows

1. **Zod validation failure**:

   - Show specific field errors to user
   - Offer "retry with different LLM provider" option
   - Allow manual correction in Phase 2 (future)

2. **Sanity check failures**:

   - Display warnings but allow save
   - Highlight problematic sections in review UI
   - Log errors for debugging

3. **LLM hallucinations**:
   - Detect via character consistency (unknown names)
   - Flag duplicate character names (case-insensitive)
   - Warn if acts/scenes out of order

---

## Summary

All technical unknowns resolved:

✅ **Document extraction**: pdf-parse + mammoth + fs.readFile  
✅ **LLM provider**: Anthropic Claude 3.5 Sonnet (OpenAI as fallback)  
✅ **Prompting**: Multi-stage extraction with few-shot examples  
✅ **Multi-character**: LLM detection (no pattern fallback; telemetry for unsupported cases)  
✅ **Streaming**: Server-Sent Events via Next.js API route  
✅ **Validation**: Zod schemas + post-parse sanity checks

**Next Phase**: Generate data-model.md, API contracts, quickstart.md
