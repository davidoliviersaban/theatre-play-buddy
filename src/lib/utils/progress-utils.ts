import type { Line } from "@/lib/types";

/**
 * Compute progress percentage based on line mastery
 * Returns the percentage of dialogue lines with mastery >= 80%
 */
export function computeProgressPct(
    targetLines: Line[],
    getLineMastery?: (lineId: string) => {
        rehearsalCount: number;
        masteryPercentage: number;
        lastPracticed: string;
    } | null
): number {
    const dialogueLines = targetLines.filter((l) => l.type === "dialogue");
    if (dialogueLines.length === 0) return 0;
    if (typeof getLineMastery !== "function") return 0;

    const mastered = dialogueLines.reduce((acc, l) => {
        const m = getLineMastery(l.id)?.masteryPercentage ?? 0;
        return acc + (m >= 80 ? 1 : 0);
    }, 0);

    return Math.round((mastered / dialogueLines.length) * 100);
}
