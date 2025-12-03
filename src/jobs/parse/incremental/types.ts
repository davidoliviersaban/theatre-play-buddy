import { CharacterSchema } from "@/lib/play/schemas";
import { z } from "zod";
import type { Act } from "@/lib/play/schemas";

export type Character = z.infer<typeof CharacterSchema>;


export interface ParsingContext {
    title?: string;
    author?: string;
    year?: number;
    genre?: string;
    description?: string;
    characters: Character[];
    acts: Act[];
    currentActId?: string;
    currentSceneId?: string;
    lastLineNumber: number;
    lastLineText?: string;
    usedCharacterIds: Set<string>;
    usedActIds: Set<string>;
    usedSceneIds: Set<string>;
    usedLineIds: Set<string>;
}

export const IncrementalParseResultSchema = z.object({
    title: z.string().optional(),
    author: z.string().optional(),
    year: z.number().int().optional(),
    genre: z.string().optional(),
    description: z.string().optional(),
    newCharacters: z.array(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
    })).optional(),
    acts: z.array(z.object({
        id: z.string(),
        title: z.string(),
        isNew: z.boolean().optional(),
        scenes: z.array(z.object({
            id: z.string(),
            title: z.string(),
            isNew: z.boolean().optional(),
            lines: z.array(z.object({
                id: z.string(),
                type: z.enum(["dialogue", "stage_direction"]),
                text: z.string(),
                characterId: z.string().optional(),
                characterIdArray: z.array(z.string()).optional(),
            })),
        })),
    })),
});


export type IncrementalParseResult = z.infer<typeof IncrementalParseResultSchema>;
