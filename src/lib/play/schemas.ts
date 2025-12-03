import { z } from "zod";

export const CharacterSchema = z.object({
    id: z.string().optional().describe("Identifier generated for the character by the database"),
    name: z.string().describe("Character's name as it appears in the play"),
    description: z.string().optional().describe("Optional character description or role information"),
});

export const FormattingMetadataSchema = z.object({
    indentLevel: z.number().int().min(0).max(5).optional().describe("Relative indentation level (0=none, 1-5=increasing indent). Preserves structural spacing in verse/poetry."),
    preserveLineBreaks: z.boolean().optional().describe("Whether to preserve line breaks after this line (for paragraph/verse spacing)"),
}).optional();

export const LineSchema = z.object({
    id: z.string().optional().describe("Identifier generated for the line by the database"),
    characterId: z.string().optional().describe("ID of the single character speaking this line. Use for single-speaker dialogue. Must be provided for type='dialogue' if characterIdArray is not used."),
    characterIdArray: z.array(z.string()).optional().describe("Array of character IDs for multi-speaker lines (e.g., when multiple characters speak simultaneously like 'BOTH:', 'ALL:'). Use for multi-speaker dialogue. Must be provided for type='dialogue' if characterId is not used."),
    text: z.string().describe("REQUIRED: The actual text content of the line or stage direction. This field must NEVER be omitted or empty."),
    type: z.enum(["dialogue", "stage_direction"]).describe("REQUIRED: Type of line. Must be 'dialogue' for spoken lines or 'stage_direction' for stage directions, entrances, exits, etc. This field must NEVER be omitted."),
    formatting: FormattingMetadataSchema.describe("Optional formatting metadata for preserving structural indentation and line breaks. Only captures structural formatting (indentation, paragraph spacing), not text styling (bold/italic)."),
}).refine((l) => {
    if (l.type === "dialogue") {
        return !!(l.characterId || (l.characterIdArray && l.characterIdArray.length));
    }
    return true;
}, {
    message: "Dialogue must have characterId or characterIdArray",
    path: ["characterId"],
});

export const SceneSchema = z.object({
    id: z.string().optional().describe("Identifier generated for the scene by the database"),
    title: z.string().describe("Scene title or description (e.g., 'Scene 1', 'The Castle')"),
    lines: z.array(LineSchema).describe("Ordered array of dialogue lines and stage directions in this scene"),
});

export const ActSchema = z.object({
    id: z.string().optional().describe("Identifier generated for the act by the database"),
    title: z.string().describe("Act title (e.g., 'Act I', 'Prologue')"),
    scenes: z.array(SceneSchema).describe("Ordered array of scenes within this act"),
});

export const PlaybookSchema = z.object({
    id: z.string().optional().describe("Identifier generated for the playbook by the database"),
    title: z.string().describe("Full title of the play"),
    author: z.string().describe("Playwright's name"),
    year: z.number().optional().nullable().describe("Year of publication or first performance"),
    genre: z.string().describe("Genre classification (e.g., 'Tragedy', 'Comedy', 'Drama')"),
    description: z.string().describe("Brief synopsis or description of the play"),
    // coverImage: z.string().optional().describe("Optional URL or path to cover image"),
    characters: z.array(CharacterSchema).describe("Complete list of characters in the play"),
    acts: z.array(ActSchema).describe("Ordered array of acts comprising the play"),
});

export type Playbook = z.infer<typeof PlaybookSchema>;
export type Act = z.infer<typeof ActSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type Line = z.infer<typeof LineSchema>;
