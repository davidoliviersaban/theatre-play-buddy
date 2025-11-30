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
} as const;

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
