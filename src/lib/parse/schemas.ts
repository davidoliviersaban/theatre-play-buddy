import { z } from "zod";

export const CharacterSchema = z.object({
    id: z.string().describe("Unique identifier for the character"),
    name: z.string().describe("Character's name as it appears in the play"),
    description: z.string().optional().describe("Optional character description or role information"),
});

export const LineSchema = z.object({
    id: z.string().describe("Unique identifier for the line (e.g., 'act1-scene1-line5')"),
    characterId: z.string().optional().describe("ID of the single character speaking this line. Use for single-speaker dialogue. Must be provided for type='dialogue' if characterIdArray is not used."),
    characterIdArray: z.array(z.string()).optional().describe("Array of character IDs for multi-speaker lines (e.g., when multiple characters speak simultaneously like 'BOTH:', 'ALL:'). Use for multi-speaker dialogue. Must be provided for type='dialogue' if characterId is not used."),
    text: z.string().describe("REQUIRED: The actual text content of the line or stage direction. This field must NEVER be omitted or empty."),
    type: z.enum(["dialogue", "stage_direction"]).describe("REQUIRED: Type of line. Must be 'dialogue' for spoken lines or 'stage_direction' for stage directions, entrances, exits, etc. This field must NEVER be omitted."),
    //    masteryLevel: z.enum(["low", "medium", "high"]).optional().describe("User's mastery level for this line during practice"), // the model doesn't need this info
    //    rehearsalCount: z.number().int().nonnegative().optional().describe("Number of times this line has been rehearsed"), // the model doesn't need this info
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
    id: z.string().describe("Unique identifier for the scene"),
    title: z.string().describe("Scene title or description (e.g., 'Scene 1', 'The Castle')"),
    lines: z.array(LineSchema).describe("Ordered array of dialogue lines and stage directions in this scene"),
});

export const ActSchema = z.object({
    id: z.string().describe("Unique identifier for the act"),
    title: z.string().describe("Act title (e.g., 'Act I', 'Prologue')"),
    scenes: z.array(SceneSchema).describe("Ordered array of scenes within this act"),
});

export const PlaybookSchema = z.object({
    id: z.string().describe("Unique identifier for the play"),
    title: z.string().describe("Full title of the play"),
    author: z.string().describe("Playwright's name"),
    year: z.number().describe("Year of publication or first performance"),
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
