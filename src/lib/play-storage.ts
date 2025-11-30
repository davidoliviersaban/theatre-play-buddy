/**
 * Centralized storage utilities for persisting play and character state.
 * Uses sessionStorage for within-session persistence and falls back to query params.
 */

const STORAGE_PREFIX = 'tpc:';

export const StorageKeys = {
  LAST_PLAY_ID: `${STORAGE_PREFIX}lastPlayId`,
  playCharacter: (playId: string) => `${STORAGE_PREFIX}play:${playId}:character`,
  playCharacterLine: (playId: string, characterId: string) =>
    `${STORAGE_PREFIX}play:${playId}:char:${characterId}:lineIndex`,
  playLastRehearsalDate: (playId: string) => `${STORAGE_PREFIX}play:${playId}:lastRehearsalDate`,
  playSessionStats: (playId: string, characterId: string) =>
    `${STORAGE_PREFIX}play:${playId}:char:${characterId}:stats`,
} as const;

export interface SessionStats {
  linesRehearsed: number;
  correctLines: number;
  hintsUsed: number;
  totalSessions: number;
}

/**
 * Get current play ID from sessionStorage or query params.
 * Priority: query param > sessionStorage
 */
export function getCurrentPlayId(searchParams?: URLSearchParams | { get: (key: string) => string | null }): string | null {
  if (typeof window === 'undefined') return null;

  // Check query params first
  if (searchParams) {
    const playParam = searchParams.get('play');
    if (playParam) return playParam;
  }

  // Fallback to sessionStorage
  return sessionStorage.getItem(StorageKeys.LAST_PLAY_ID);
}

/**
 * Get current character ID for a given play from sessionStorage or query params.
 * Priority: query param > sessionStorage
 */
export function getCurrentCharacterId(
  playId: string,
  searchParams?: URLSearchParams | { get: (key: string) => string | null }
): string | null {
  if (typeof window === 'undefined') return null;

  // Check query params first
  if (searchParams) {
    const charParam = searchParams.get('character');
    if (charParam) return charParam;
  }

  // Fallback to sessionStorage
  return sessionStorage.getItem(StorageKeys.playCharacter(playId));
}

/**
 * Save current play ID to sessionStorage.
 */
export function setCurrentPlayId(playId: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(StorageKeys.LAST_PLAY_ID, playId);
}

/**
 * Save current character ID for a play to sessionStorage.
 */
export function setCurrentCharacterId(playId: string, characterId: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(StorageKeys.playCharacter(playId), characterId);
  setCurrentPlayId(playId); // Also update last play
}

/**
 * Get last practiced line index for a play/character combo.
 */
export function getLastLineIndex(playId: string, characterId: string): number | null {
  if (typeof window === 'undefined') return null;

  const stored = sessionStorage.getItem(StorageKeys.playCharacterLine(playId, characterId));
  if (stored) {
    const parsed = parseInt(stored, 10);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return null;
}

/**
 * Save last practiced line index for a play/character combo.
 */
export function setLastLineIndex(playId: string, characterId: string, lineIndex: number): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(StorageKeys.playCharacterLine(playId, characterId), lineIndex.toString());
  // Update last rehearsal timestamp
  sessionStorage.setItem(StorageKeys.playLastRehearsalDate(playId), new Date().toISOString());
}

/**
 * Get last rehearsal date for a play.
 */
export function getLastRehearsalDate(playId: string): Date | null {
  if (typeof window === 'undefined') return null;

  const stored = sessionStorage.getItem(StorageKeys.playLastRehearsalDate(playId));
  if (stored) {
    const date = new Date(stored);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

/**
 * Get session statistics for a play/character combo.
 */
export function getSessionStats(playId: string, characterId: string): SessionStats | null {
  if (typeof window === 'undefined') return null;

  const stored = sessionStorage.getItem(StorageKeys.playSessionStats(playId, characterId));
  if (stored) {
    try {
      return JSON.parse(stored) as SessionStats;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Save session statistics for a play/character combo.
 */
export function setSessionStats(playId: string, characterId: string, stats: SessionStats): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(StorageKeys.playSessionStats(playId, characterId), JSON.stringify(stats));
  // Update last rehearsal timestamp
  sessionStorage.setItem(StorageKeys.playLastRehearsalDate(playId), new Date().toISOString());
}

/**
 * Get aggregated session statistics across all characters for a play.
 */
export function getPlayAggregatedStats(playId: string): {
  totalCharacters: number;
  totalLinesRehearsed: number;
  activeCharacterName: string | null;
} | null {
  if (typeof window === 'undefined') return null;
  
  let totalLinesRehearsed = 0;
  let charactersWithActivity = 0;
  
  // Iterate through sessionStorage to find all character stats for this play
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key?.startsWith(`${STORAGE_PREFIX}play:${playId}:char:`) && key.endsWith(':stats')) {
      try {
        const stored = sessionStorage.getItem(key);
        if (stored) {
          const stats = JSON.parse(stored) as SessionStats;
          totalLinesRehearsed += stats.linesRehearsed || 0;
          if (stats.linesRehearsed > 0) charactersWithActivity++;
        }
      } catch {
        // Skip invalid entries
      }
    }
  }
  
  // Get currently selected character name
  const currentCharacterId = getCurrentCharacterId(playId);
  let activeCharacterName: string | null = null;
  
  if (currentCharacterId && typeof window !== 'undefined') {
    // We need to pass the full play object to get character name
    // For now, return the character ID and let the component resolve the name
    activeCharacterName = currentCharacterId;
  }
  
  return {
    totalCharacters: charactersWithActivity,
    totalLinesRehearsed,
    activeCharacterName,
  };
}

/**
 * Get session statistics for the currently selected character in a play.
 * Returns stats specific to the active character, not aggregated.
 */
export function getCurrentCharacterStats(playId: string): {
  characterId: string | null;
  stats: SessionStats | null;
} {
  if (typeof window === 'undefined') return { characterId: null, stats: null };
  
  const characterId = getCurrentCharacterId(playId);
  if (!characterId) {
    return { characterId: null, stats: null };
  }
  
  const stats = getSessionStats(playId, characterId);
  return { characterId, stats };
}

/**
 * Clear all stored data for a specific play.
 */
export function clearPlayData(playId: string): void {
  if (typeof window === 'undefined') return;

  // Clear character selection
  sessionStorage.removeItem(StorageKeys.playCharacter(playId));

  // Clear all character line indices (requires iteration)
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key?.startsWith(`${STORAGE_PREFIX}play:${playId}:char:`)) {
      sessionStorage.removeItem(key);
    }
  }
}

/**
 * Clear all app storage data.
 */
export function clearAllData(): void {
  if (typeof window === 'undefined') return;

  const keys: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      keys.push(key);
    }
  }
  keys.forEach(key => sessionStorage.removeItem(key));
}
