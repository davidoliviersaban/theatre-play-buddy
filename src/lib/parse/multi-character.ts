import type { Line } from "./schemas";

export function getSpeakerIds(line: Line): string[] {
    if (line.characterIdArray && line.characterIdArray.length > 0) return line.characterIdArray;
    return line.characterId ? [line.characterId] : [];
}
