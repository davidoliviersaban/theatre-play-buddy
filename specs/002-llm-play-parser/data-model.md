# Data Model: LLM Play Parser

**Date**: November 30, 2025  
**Phase**: 1 (Design & Contracts)  
**Status**: Complete

## Overview

This document defines the Zod schemas for validating LLM-parsed play data. All schemas mirror the existing TypeScript types from `src/lib/mock-data.ts` while adding runtime validation and business rules.

---

## Entity Definitions

### Playbook

The root entity representing a complete theatrical play.

**TypeScript Type** (existing):

```typescript
type Playbook = {
  id: string;
  title: string;
  author: string;
  year: number;
  genre: string;
  description: string;
  coverImage?: string;
  characters: Character[];
  acts: Act[];
};
```

**Zod Schema** (new):

```typescript
import { z } from "zod";

export const PlaybookSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  year: z.number().int().min(1000).max(2100).optional(),
  genre: z.string().optional(),
  description: z.string().optional(),
  coverImage: z.string().url().optional(),
  characters: z
    .array(CharacterSchema)
    .min(1, "At least one character required"),
  acts: z.array(ActSchema).min(1, "At least one act required"),
});

export type PlaybookParsed = z.infer<typeof PlaybookSchema>;
```

**Validation Rules**:

- `id`: Must be valid UUID
- `title`: Required, non-empty string
- `author`: Required, non-empty string
- `year`: Optional, but if provided must be 1000-2100
- `characters`: At least 1 character required
- `acts`: At least 1 act required

---

### Character

Represents a character in the play.

**TypeScript Type** (existing):

```typescript
type Character = {
  id: string;
  name: string;
  description: string;
  isFavorite?: boolean;
  lastSelected?: boolean;
  completionRate?: number;
};
```

**Zod Schema** (new):

```typescript
export const CharacterSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Character name is required"),
  description: z.string().optional(),
  // Practice-related fields not set during parsing
  isFavorite: z.boolean().optional(),
  lastSelected: z.boolean().optional(),
  completionRate: z.number().min(0).max(100).optional(),
});

export type CharacterParsed = z.infer<typeof CharacterSchema>;
```

**Validation Rules**:

- `id`: Must be valid UUID
- `name`: Required, non-empty string (character names like "HAMLET", "ROMEO")
- `description`: Optional character description from dramatis personae
- Practice fields (`isFavorite`, `lastSelected`, `completionRate`) optional, not set by LLM

**LLM Parsing Notes**:

- Extract from "Dramatis Personae" or "Characters" section
- Name should be normalized (e.g., "HAMLET" → "Hamlet")
- ID generated as UUID during parsing

---

### Act

Represents a major division of the play.

**TypeScript Type** (existing):

```typescript
type Act = {
  id: string;
  title: string;
  scenes: Scene[];
};
```

**Zod Schema** (new):

```typescript
export const ActSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Act title is required"),
  scenes: z.array(SceneSchema).min(1, "At least one scene required per act"),
});

export type ActParsed = z.infer<typeof ActSchema>;
```

**Validation Rules**:

- `id`: Must be valid UUID
- `title`: Required (e.g., "Act 1", "ACT I", "Acte premier")
- `scenes`: At least 1 scene required per act

**LLM Parsing Notes**:

- Detect act boundaries: "ACT I", "ACT ONE", "Act 1", "Acte I"
- Preserve original numbering style in title
- Generate UUID for id

---

### Scene

Represents a subdivision within an act.

**TypeScript Type** (existing):

```typescript
type Scene = {
  id: string;
  title: string;
  lines: Line[];
};
```

**Zod Schema** (new):

```typescript
export const SceneSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Scene title is required"),
  lines: z.array(LineSchema).min(1, "At least one line required per scene"),
});

export type SceneParsed = z.infer<typeof SceneSchema>;
```

**Validation Rules**:

- `id`: Must be valid UUID
- `title`: Required (e.g., "Scene 1: A public place", "SCENE I", "Scène 1")
- `lines`: At least 1 line required per scene

**LLM Parsing Notes**:

- Detect scene boundaries: "SCENE 1", "Scene i", "Scène première"
- Include location/setting in title if present
- Generate UUID for id

---

### Line

Represents a single line of dialogue or stage direction.

**TypeScript Type** (existing):

```typescript
type Line = {
  id: string;
  characterId?: string; // note: stage directions may not have a characterId
  text: string;
  type: "dialogue" | "stage_direction";
  rehearsalCount?: number;
};
```

**Zod Schema** (new):

```typescript
export const LineSchema = z
  .object({
    id: z.string().uuid(),
    // Single-speaker attribution
    characterId: z.string().uuid().optional(),
    // Multi-speaker attribution
    characterIdArray: z.array(z.string().uuid()).min(1).optional(),
    text: z.string().min(1, "Line text is required"),
    type: z.enum(["dialogue", "stage_direction"]),
    // Practice-related fields not set during parsing
    rehearsalCount: z.number().int().min(0).optional(),
  })
  .refine(
    (line) => {
      // Business rule: dialogue lines MUST have either characterId or characterIdArray
      if (
        line.type === "dialogue" &&
        !line.characterId &&
        !line.characterIdArray
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Dialogue lines must have a characterId or characterIdArray",
      path: ["characterId"],
    }
  );

export type LineParsed = z.infer<typeof LineSchema>;
```

**Validation Rules**:

- `id`: Must be valid UUID
- `characterId`:
  - Optional for `stage_direction` type
  - **Required** for `dialogue` type: at least one of `characterId` or `characterIdArray` must be present
  - Use `characterId` for single speaker; use `characterIdArray` for multiple speakers
- `text`: Required, non-empty string
- `type`: Must be either `'dialogue'` or `'stage_direction'`

**Multi-Character Support**:

```typescript
// Single character dialogue
{
  characterId: "uuid-123",
  type: "dialogue",
  text: "To be or not to be"
}

// Multi-character dialogue (both characters speak together)
{
  characterIdArray: ["uuid-123", "uuid-456"],
  type: "dialogue",
  text: "We agree!"
}

// Stage direction (no characterId)
{
  type: "stage_direction",
  text: "Thunder and lightning"
}

// Stage direction (on single character)
{
  characterId: "uuid-123",
  type: "stage_direction",
  text: "Thunder and lightning"
}

// Stage direction (both characters)
{
  characterIdArray: ["uuid-123", "uuid-456"],
  type: "stage_direction",
  text: "Thunder and lightning"
}
```

**LLM Parsing Notes**:

- Detect character speaker prefix: "HAMLET:", "Romeo.", "UN:"
- Multi-character indicators: "BOTH:", "ALL:", "CROWD:", "ENSEMBLE:"
- Stage directions often in:
  - Parentheses: "(Exit)"
  - Italics: "_He draws his sword_"
  - Brackets: "[Thunder]"
  - All caps with no speaker: "THUNDER AND LIGHTNING"
- Generate UUID for id

---

## Schema Composition

### Full Schema Hierarchy

```
PlaybookSchema
├── id: UUID
├── title: string (required)
├── author: string (required)
├── year: number (optional)
├── genre: string (optional)
├── description: string (optional)
├── coverImage: URL (optional)
├── characters: Character[] (min 1)
│   └── CharacterSchema
│       ├── id: UUID
│       ├── name: string (required)
│       └── description: string (optional)
└── acts: Act[] (min 1)
    └── ActSchema
        ├── id: UUID
        ├── title: string (required)
        └── scenes: Scene[] (min 1)
            └── SceneSchema
                ├── id: UUID
                ├── title: string (required)
                └── lines: Line[] (min 1)
                    └── LineSchema
                        ├── id: UUID
                        ├── characterId: UUID | UUID[] (optional, required for dialogue)
                        ├── text: string (required)
                        └── type: "dialogue" | "stage_direction"
```

---

## Validation Examples

### Valid Playbook

```typescript
const validPlay: PlaybookParsed = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  title: "Hamlet",
  author: "William Shakespeare",
  year: 1600,
  genre: "Tragedy",
  description: "The Prince of Denmark seeks revenge",
  characters: [
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      name: "Hamlet",
      description: "Prince of Denmark",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440002",
      name: "Ophelia",
      description: "Daughter of Polonius",
    },
  ],
  acts: [
    {
      id: "550e8400-e29b-41d4-a716-446655440010",
      title: "Act I",
      scenes: [
        {
          id: "550e8400-e29b-41d4-a716-446655440011",
          title: "Scene 1: Elsinore Castle",
          lines: [
            {
              id: "550e8400-e29b-41d4-a716-446655440100",
              text: "Enter two sentinels",
              type: "stage_direction",
            },
            {
              id: "550e8400-e29b-41d4-a716-446655440101",
              characterId: "550e8400-e29b-41d4-a716-446655440001",
              text: "To be or not to be, that is the question",
              type: "dialogue",
            },
            {
              id: "550e8400-e29b-41d4-a716-446655440102",
              characterId: [
                "550e8400-e29b-41d4-a716-446655440001",
                "550e8400-e29b-41d4-a716-446655440002",
              ],
              text: "Good night!",
              type: "dialogue",
            },
          ],
        },
      ],
    },
  ],
};

// Validation
const result = PlaybookSchema.safeParse(validPlay);
if (result.success) {
  console.log("Valid play!", result.data);
} else {
  console.error("Validation errors:", result.error.errors);
}
```

### Invalid Examples

```typescript
// Missing required field (author)
const invalid1 = {
  id: "uuid",
  title: "Hamlet",
  // author missing!
  characters: [],
  acts: [],
};
// Error: "Author is required"

// Dialogue without characterId
const invalid2 = {
  ...validPlay,
  acts: [
    {
      ...validPlay.acts[0],
      scenes: [
        {
          ...validPlay.acts[0].scenes[0],
          lines: [
            {
              id: "uuid",
              text: "To be or not to be",
              type: "dialogue",
              // characterId missing for dialogue!
            },
          ],
        },
      ],
    },
  ],
};
// Error: "Dialogue lines must have a characterId"

// Empty character array
const invalid3 = {
  ...validPlay,
  characters: [], // Must have at least 1
};
// Error: "At least one character required"
```

---

## Usage in LLM Parser

### Multi-Stage Parsing with Schemas

```typescript
// src/lib/parse/llm-parser.ts
import { generateObject } from 'ai';
import {
  PlaybookSchema,
  CharacterSchema,
  ActSchema,
  LineSchema
} from './schemas';

// Stage 1: Extract metadata and characters
const MetadataSchema = z.object({
  title: z.string(),
  author: z.string(),
  year: z.number().optional(),
  genre: z.string().optional(),
  description: z.string().optional(),
  characters: z.array(CharacterSchema),
});

const metadata = await generateObject({
  model,
  schema: MetadataSchema,
  prompt: metadataPrompt,
});

// Stage 2: Extract act/scene structure
const StructureSchema = z.object({
  acts: z.array(z.object({
    title: z.string(),
    scenes: z.array(z.object({
      title: z.string(),
      startPosition: z.number(),
      endPosition: z.number(),
    })),
  })),
});

const structure = await generateObject({
  model,
  schema: StructureSchema,
  prompt: structurePrompt,
});

// Stage 3: Extract lines for each scene
const LinesSchema = z.object({
  lines: z.array(LineSchema),
});

for (const act of structure.object.acts) {
  for (const scene of act.scenes) {
    const sceneText = fullText.slice(scene.startPosition, scene.endPosition);

    const sceneLines = await generateObject({
      model,
      schema: LinesSchema,
      prompt: lineAttributionPrompt(sceneText, metadata.object.characters),
    });

    // Validate each line
    sceneLines.object.lines.forEach(line => {
      const validation = LineSchema.safeParse(line);
      if (!validation.success) {
        console.error('Line validation failed:', validation.error);
      }
    });
  }
}

// Final: Assemble and validate complete playbook
const completePlay = {
  id: uuid(),
  ...metadata.object,
  acts: structure.object.acts.map(act => ({
    id: uuid(),
    ...act,
    scenes: act.scenes.map(scene => ({
      id: uuid(),
      ...scene,
      lines: /* scene lines from Stage 3 */
    }))
  }))
};

const finalValidation = PlaybookSchema.safeParse(completePlay);
if (!finalValidation.success) {
  throw new Error(`Playbook validation failed: ${finalValidation.error.message}`);
}
```

---

## Schema File Structure

### src/lib/parse/schemas.ts

```typescript
import { z } from "zod";

// Character Schema
export const CharacterSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Character name is required"),
  description: z.string().optional(),
  isFavorite: z.boolean().optional(),
  lastSelected: z.boolean().optional(),
  completionRate: z.number().min(0).max(100).optional(),
});

export type CharacterParsed = z.infer<typeof CharacterSchema>;

// Line Schema with multi-character support
export const LineSchema = z
  .object({
    id: z.string().uuid(),
    characterId: z
      .union([z.string().uuid(), z.array(z.string().uuid()).min(1)])
      .optional(),
    text: z.string().min(1, "Line text is required"),
    type: z.enum(["dialogue", "stage_direction"]),
    rehearsalCount: z.number().int().min(0).optional(),
  })
  .refine(
    (line) => {
      if (line.type === "dialogue" && !line.characterId) {
        return false;
      }
      return true;
    },
    {
      message: "Dialogue lines must have a characterId",
      path: ["characterId"],
    }
  );

export type LineParsed = z.infer<typeof LineSchema>;

// Scene Schema
export const SceneSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Scene title is required"),
  lines: z.array(LineSchema).min(1, "At least one line required per scene"),
});

export type SceneParsed = z.infer<typeof SceneSchema>;

// Act Schema
export const ActSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Act title is required"),
  scenes: z.array(SceneSchema).min(1, "At least one scene required per act"),
});

export type ActParsed = z.infer<typeof ActSchema>;

// Playbook Schema (root)
export const PlaybookSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  year: z.number().int().min(1000).max(2100).optional(),
  genre: z.string().optional(),
  description: z.string().optional(),
  coverImage: z.string().url().optional(),
  characters: z
    .array(CharacterSchema)
    .min(1, "At least one character required"),
  acts: z.array(ActSchema).min(1, "At least one act required"),
});

export type PlaybookParsed = z.infer<typeof PlaybookSchema>;

// Intermediate schemas for multi-stage parsing
export const MetadataSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  year: z.number().int().min(1000).max(2100).optional(),
  genre: z.string().optional(),
  description: z.string().optional(),
  characters: z.array(CharacterSchema).min(1),
});

export const StructureSchema = z.object({
  acts: z.array(
    z.object({
      title: z.string(),
      scenes: z.array(
        z.object({
          title: z.string(),
          startPosition: z.number().int().min(0),
          endPosition: z.number().int().min(0),
        })
      ),
    })
  ),
});

export const LinesSchema = z.object({
  lines: z.array(LineSchema),
});
```

---

## Next Steps

1. ✅ Schemas defined matching existing types
2. ⏳ Generate API contracts (upload-api.yaml, parse-api.yaml)
3. ⏳ Create quickstart.md with development setup
4. ⏳ Update agent context with Zod + Vercel AI SDK
