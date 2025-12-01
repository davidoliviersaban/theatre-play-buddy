import type { Playbook, Character } from "../types";
import { getLineMastery } from "../play-storage";

/**
 * Get all lines from a play for a specific character
 */
export function getAllLines(play: Playbook, characterId: string) {
  return play.acts.flatMap((act) =>
    act.scenes.flatMap((scene) =>
      scene.lines.filter(
        (line) =>
          line.type === "dialogue" &&
          (line.characterId === characterId ||
            line.characterIdArray?.includes(characterId))
      )
    )
  );
}

/**
 * Get total number of lines for a character
 */
export function getTotalLinesCount(play: Playbook, characterId: string): number {
  return getAllLines(play, characterId).length;
}

/**
 * Get number of learned lines for a character (mastery >= 80%)
 */
export function getLearnedLinesCount(
  play: Playbook,
  characterId: string
): number {
  const lines = getAllLines(play, characterId);
  return lines.filter((line) => {
    const mastery = getLineMastery(play.id, characterId, line.id);
    return mastery && mastery.masteryPercentage >= 80;
  }).length;
}

/**
 * Get characters that have been learned (all lines >= 80% mastery)
 */
export function getLearnedCharacters(play: Playbook): Character[] {
  return play.characters.filter((character) => {
    const totalLines = getTotalLinesCount(play, character.id);
    if (totalLines === 0) return false;
    const learnedLines = getLearnedLinesCount(play, character.id);
    return learnedLines === totalLines;
  });
}

/**
 * Get number of characters that have been mastered
 */
export function getMasteredCharacterCount(play: Playbook): number {
  return getLearnedCharacters(play).length;
}

/**
 * Check if all characters in a play have been mastered
 */
export function areAllCharactersMastered(play: Playbook): boolean {
  const totalCharacters = play.characters.length;
  if (totalCharacters === 0) return false;
  return getMasteredCharacterCount(play) === totalCharacters;
}
