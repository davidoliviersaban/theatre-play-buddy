import type { Playbook, Character, Line } from "@/lib/mock-data";
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
    return lines.filter(
        (line) => line.characterId === characterId && line.type === "dialogue"
    );
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
