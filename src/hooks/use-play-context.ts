/**
 * Hook to get current play and character context from storage or query params.
 * Provides a unified interface for accessing play/character state across pages.
 */

"use client";

import { useMemo } from "react";
import { MOCK_PLAYS, type Play, type Character } from "@/lib/mock-data";
import { getCurrentPlayId, getCurrentCharacterId } from "@/lib/play-storage";

interface UsePlayContextOptions {
    searchParams?: URLSearchParams | { get: (key: string) => string | null };
    playId?: string;
    characterId?: string;
}

interface PlayContextResult {
    play: Play | null;
    character: Character | null;
    playId: string | null;
    characterId: string | null;
}

/**
 * Get current play and character from multiple sources with priority:
 * 1. Explicit props (playId, characterId)
 * 2. Query params
 * 3. SessionStorage
 * 
 * @example
 * // In a page component
 * const { play, character } = usePlayContext({ searchParams });
 * 
 * // With explicit IDs
 * const { play, character } = usePlayContext({ playId: "1", characterId: "c1" });
 */
export function usePlayContext(options: UsePlayContextOptions = {}): PlayContextResult {
    const { searchParams, playId: propPlayId, characterId: propCharacterId } = options;

    return useMemo(() => {
        // Determine play ID with priority
        const playId = propPlayId || getCurrentPlayId(searchParams);

        if (!playId) {
            return { play: null, character: null, playId: null, characterId: null };
        }

        // Find the play
        const play = MOCK_PLAYS.find(p => p.id === playId) || null;

        if (!play) {
            return { play: null, character: null, playId, characterId: null };
        }

        // Determine character ID with priority
        const characterId = propCharacterId || getCurrentCharacterId(playId, searchParams);

        if (!characterId) {
            return { play, character: null, playId, characterId: null };
        }

        // Find the character
        const character = play.characters.find(c => c.id === characterId) || null;

        return { play, character, playId, characterId };
    }, [propPlayId, propCharacterId, searchParams]);
}

/**
 * Get all available plays.
 */
export function useAllPlays(): Play[] {
    return MOCK_PLAYS;
}

/**
 * Get a specific play by ID.
 */
export function usePlay(playId: string | null | undefined): Play | null {
    return useMemo(() => {
        if (!playId) return null;
        return MOCK_PLAYS.find(p => p.id === playId) || null;
    }, [playId]);
}
