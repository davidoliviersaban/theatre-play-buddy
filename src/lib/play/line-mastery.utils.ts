/**
 * Line mastery utilities - DB-backed progress fetching
 * 
 * These utilities provide standalone functions to fetch line mastery data
 * without depending on React hooks or component state.
 */

export interface LineMastery {
    rehearsalCount: number;
    masteryPercentage: number;
    lastPracticed: string; // ISO date string
}

/**
 * Fetch line mastery from API for a specific line
 */
export async function fetchLineMastery(
    playId: string,
    characterId: string,
    lineId: string
): Promise<LineMastery | null> {
    try {
        const response = await fetch(
            `/api/progress/line?playId=${playId}&characterId=${characterId}&lineId=${lineId}`
        );

        if (!response.ok) {
            console.warn(`[fetchLineMastery] API error: ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        return data.mastery || null;
    } catch (error) {
        console.error("[fetchLineMastery] Error fetching line mastery:", error);
        return null;
    }
}

/**
 * Create a getLineMastery function backed by progress data
 * This is used in server components to create a function from fetched data
 */
export function createLineMasteryGetterFromData(
    progressData: Record<string, {
        rehearsalCount: number;
        progressPercent: number;
        lastPracticedAt: Date | string;
    }>
): (lineId: string) => LineMastery | null {
    return (lineId: string) => {
        const progress = progressData[lineId];
        if (!progress) return null;

        const lastPracticed = progress.lastPracticedAt;
        const iso = typeof lastPracticed === 'string' 
            ? lastPracticed 
            : lastPracticed instanceof Date 
                ? lastPracticed.toISOString() 
                : new Date().toISOString();

        return {
            rehearsalCount: progress.rehearsalCount,
            masteryPercentage: progress.progressPercent,
            lastPracticed: iso,
        };
    };
}

/**
 * Default factory for server components without character context
 * Returns a function that always returns null (no mastery data)
 */
export function getLineMastery(): (lineId: string) => LineMastery | null {
    return () => null;
}
