/**
 * Progressive word removal utility for memorization practice.
 * Removes words randomly while maintaining readability.
 */

/**
 * Remove a percentage of words from text, replacing them with underscores.
 * Punctuation is preserved until stage 5 (100% complete).
 * Stage 0 = 0% removed (full text)
 * Stage 1 = ~20% removed
 * Stage 2 = ~40% removed
 * Stage 3 = ~60% removed
 * Stage 4 = ~80% removed
 * Stage 5 = 100% removed (all hidden including punctuation)
 */
export function removeWords(text: string, stage: number): string {
    if (stage === 0) return text;

    // Stage 5: hide everything
    if (stage === 5) {
        return '_'.repeat(Math.max(1, Math.floor(text.length / 3)));
    }

    // Split into tokens while preserving whitespace and punctuation
    const tokens = text.split(/(\s+)/);
    const wordTokens: Array<{ index: number; word: string; punctuation: string }> = [];

    // Identify word tokens (separate words from their trailing punctuation)
    tokens.forEach((token, i) => {
        const trimmed = token.trim();
        if (trimmed.length > 0 && !/^\s+$/.test(token)) {
            // Extract word and trailing punctuation
            // Use Unicode property to match any letter (including accented characters) plus numbers and apostrophes
            const match = trimmed.match(/^([\p{L}\p{N}''-]+)([\s\S]*)$/u);
            if (match) {
                const [, word, punctuation] = match;
                if (word) {
                    wordTokens.push({ index: i, word, punctuation });
                }
            } else {
                // Token is only punctuation, skip it
            }
        }
    });

    if (wordTokens.length === 0) return text;

    // For short phrases (less than 3 words), remove all words at once from stage 1 onwards
    if (wordTokens.length < 3 && stage >= 1 && stage < 5) {
        const result = [...tokens];
        wordTokens.forEach((wordToken) => {
            const tokenIndex = wordToken.index;
            const underscores = '_'.repeat(Math.max(1, Math.floor(wordToken.word.length / 2)));
            result[tokenIndex] = underscores + wordToken.punctuation;
        });
        return result.join('');
    }

    // Calculate percentage to remove based on stage (goes directly to 100%)
    const removalPercentage = stage / 5; // 0.2, 0.4, 0.6, 0.8, 1.0
    const wordsToRemove = Math.ceil(wordTokens.length * removalPercentage);

    // Use seeded random based on text to ensure consistency
    const seed = hashString(text);
    const selectedIndices = seededShuffle([...Array(wordTokens.length).keys()], seed).slice(0, wordsToRemove);
    const removeSet = new Set(selectedIndices);

    // Build result: replace selected words with underscores, keep punctuation
    const result = [...tokens];
    wordTokens.forEach((wordToken, wtIndex) => {
        if (removeSet.has(wtIndex)) {
            const tokenIndex = wordToken.index;
            const underscores = '_'.repeat(Math.max(1, Math.floor(wordToken.word.length / 2)));
            // Replace word but keep punctuation
            result[tokenIndex] = underscores + wordToken.punctuation;
        }
    });

    return result.join('');
}

/**
 * Simple string hash function for seeding
 */
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

/**
 * Seeded shuffle using a simple LCG (Linear Congruential Generator)
 */
function seededShuffle<T>(array: T[], seed: number): T[] {
    const result = [...array];
    let currentSeed = seed;

    const random = () => {
        currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
        return currentSeed / 4294967296;
    };

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}
