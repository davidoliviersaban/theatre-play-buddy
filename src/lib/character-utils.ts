import type { Playbook, Character, Line } from "@/lib/mock-data";

// Augmented line type to support multi-speaker lines without breaking existing type imports
type LineWithMulti = Line & { characterIdArray?: string[] };
import { calculateProgress } from "@/components/play/progress-bar";
import { getLineMastery } from "@/lib/play-storage";

/**
 * Get all lines from a playbook
 */
export function getAllLines(play: Playbook): Line[] {
    return play.acts.flatMap((act) => act.scenes.flatMap((scene) => scene.lines));
}

/**
 * Get all dialogue lines for a specific character
 */
export function getCharacterLines(
    lines: Line[],
    characterId: string
): Line[] {
    return (lines as LineWithMulti[]).filter((line) => {
        if (line.type !== "dialogue") return false;
        // Support single-speaker and multi-speaker (characterIdArray)
        if (line.characterId === characterId) return true;
        const multi = line.characterIdArray;
        return Array.isArray(multi) ? multi.includes(characterId) : false;
    });
}

/**
 * Get characters that have completed (100%) all their lines
 */
export function getLearnedCharacters(
    play: Playbook,
    allLines: Line[],
    excludeCharacterId?: string
): Character[] {
    return play.characters
        .map((character) => ({
            character,
            progress: calculateProgress(allLines, play.id, character.id),
        }))
        .filter(
            ({ progress, character }) =>
                progress === 100 && character.id !== excludeCharacterId
        )
        .map(({ character }) => character);
}

/**
 * Get count of learned lines for a character (mastery >= 80%)
 */
export function getLearnedLinesCount(
    playId: string,
    characterId: string,
    lines: Line[]
): number {
    if (typeof window === "undefined") return 0;

    const characterLines = getCharacterLines(lines, characterId);
    return characterLines.filter((line) => {
        const mastery = getLineMastery(playId, characterId, line.id);
        return (mastery?.masteryPercentage ?? 0) >= 80;
    }).length;
}

/**
 * Get total count of dialogue lines for a character
 */
export function getTotalLinesCount(lines: Line[], characterId: string): number {
    return getCharacterLines(lines, characterId).length;
}

/**
 * Helper: return list of speaker IDs for a line (handles single and multi)
 */
export function getSpeakerIds(line: LineWithMulti): string[] {
    const multi = line.characterIdArray;
    if (Array.isArray(multi)) return multi;
    return line.characterId ? [line.characterId] : [];
}
