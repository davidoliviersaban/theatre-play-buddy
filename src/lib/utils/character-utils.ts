import type { Playbook, Character } from "../types";

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
export function countLearnedLines(
  play: Playbook,
  characterId: string,
  getLineMastery?: (lineId: string) => { masteryPercentage: number } | null
): number {
  if (!getLineMastery) return 0; // No mastery data available
  return getAllLines(play, characterId).filter((line) => {
    const mastery = getLineMastery(line.id);
    return mastery && mastery.masteryPercentage >= 80;
  }).length;
}

/**
 * Get characters that have been learned (all lines >= 80% mastery)
 */
export function getLearnedCharacters(
  play: Playbook,
  learnedLinesCount?: (characterId: string) => number
): Character[] {
  if (!learnedLinesCount) return []; // No mastery data available
  return play.characters.filter((character) => {
    const totalLines = getTotalLinesCount(play, character.id);
    if (totalLines === 0) return false;
    const learnedLines = learnedLinesCount(character.id);
    return learnedLines === totalLines;
  });
}

/**
 * Get number of characters that have been mastered
 */
export function getMasteredCharacterCount(
  play: Playbook,
  getLineMastery?: (lineId: string) => { masteryPercentage: number } | null
): number {
  if (!getLineMastery) return 0; // No mastery data available
  return getLearnedCharacters(play, (characterId) => 
    countLearnedLines(play, characterId, getLineMastery)
  ).length;
}

/**
 * Check if all characters in a play have been mastered
 */
export function areAllCharactersMastered(
  play: Playbook,
  getLineMastery?: (lineId: string) => { masteryPercentage: number } | null
): boolean {
  if (!getLineMastery) return false; // No mastery data available
  
  // Only consider characters that actually have lines
  const charactersWithLines = play.characters.filter(
    (character) => getTotalLinesCount(play, character.id) > 0
  );
  
  if (charactersWithLines.length === 0) return false;
  
  const masteredCount = getMasteredCharacterCount(play, getLineMastery);
  return masteredCount === charactersWithLines.length;
}
