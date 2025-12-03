import type { Prisma } from "@prisma/client";
import type { ParsingContext } from "@/lib/parse/incremental-parser";

function getCurrentPosition(ctx: ParsingContext) {
    let currentActIndex: number | null = null;
    let currentSceneIndex: number | null = null;
    let currentLineIndex: number | null = null;
    let currentCharacters: string[] = [];

    if (ctx.acts.length > 0) {
        currentActIndex = ctx.acts.length - 1;
        const lastAct = ctx.acts[currentActIndex];

        if (lastAct.scenes.length > 0) {
            currentSceneIndex = lastAct.scenes.length - 1;
            const lastScene = lastAct.scenes[currentSceneIndex];

            if (lastScene.lines.length > 0) {
                currentLineIndex = lastScene.lines.length - 1;
                const lastLine = lastScene.lines[currentLineIndex];

                if (lastLine.characterId) {
                    const char = ctx.characters.find((c) => c.id === lastLine.characterId);
                    if (char) currentCharacters = [char.name];
                } else if (lastLine.characterIdArray) {
                    currentCharacters = lastLine.characterIdArray
                        .map((id) => ctx.characters.find((c) => c.id === id)?.name)
                        .filter((name): name is string => !!name);
                }
            }
        }
    }

    return { currentActIndex, currentSceneIndex, currentLineIndex, currentCharacters };
}

function serializeContext(ctx: ParsingContext): Prisma.InputJsonValue {
    return {
        title: ctx.title,
        author: ctx.author,
        year: ctx.year,
        genre: ctx.genre,
        description: ctx.description,
        characters: ctx.characters,
        acts: ctx.acts,
        currentActId: ctx.currentActId,
        currentSceneId: ctx.currentSceneId,
        lastLineNumber: ctx.lastLineNumber,
        lastLineText: ctx.lastLineText,
        usedCharacterIds: Array.from(ctx.usedCharacterIds),
        usedActIds: Array.from(ctx.usedActIds),
        usedSceneIds: Array.from(ctx.usedSceneIds),
        usedLineIds: Array.from(ctx.usedLineIds),
    };
}

export function buildSessionUpdate(
    ctx: ParsingContext,
    chunk: number,
    baseChunkOffset: number = 0
) {
    const position = getCurrentPosition(ctx);
    const currentState = serializeContext(ctx);

    return {
        completedChunks: baseChunkOffset + chunk,
        status: "running" as const,
        currentState,
        config: {
            title: ctx.title,
            author: ctx.author,
            year: ctx.year,
            genre: ctx.genre,
            description: ctx.description,
            totalCharacters: ctx.characters.length,
            totalActs: ctx.acts.length,
            totalScenes: ctx.acts.reduce((sum, act) => sum + act.scenes.length, 0),
            totalLines: ctx.lastLineNumber,
            ...position,
        },
    };
}
