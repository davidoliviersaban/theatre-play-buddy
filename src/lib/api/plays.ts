/**
 * Client-side API service for fetching play data
 */

import type { Playbook, PlayListResponse, PlayMetadata } from "@/lib/types";

/**
 * Get the base URL for API requests
 * In server-side rendering (build time), we use localhost
 * In client-side, we use relative URLs
 */
function getBaseUrl(): string {
    // Server-side (during build)
    if (typeof window === 'undefined') {
        return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    }
    // Client-side
    return '';
}

/**
 * Fetch all plays metadata from the API
 * @param includeStats - Whether to include database statistics
 * @returns List of play metadata and optional stats
 */
export async function fetchAllPlays(includeStats = false): Promise<PlayListResponse> {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/api/plays${includeStats ? '?stats=true' : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch plays: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Fetch a single play by ID with full content
 * @param playId - The play ID
 * @returns The complete play data
 */
export async function fetchPlayById(playId: string): Promise<Playbook> {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/plays/${playId}`);

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error(`Play not found: ${playId}`);
        }
        throw new Error(`Failed to fetch play: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
}

/**
 * Fetch a single play plus its persisted metadata in one request
 * Uses query param ?meta=true
 */
export async function fetchPlayWithMetadata(playId: string): Promise<{ play: Playbook; metadata: PlayMetadata | null }> {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/plays/${playId}?meta=true`);
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error(`Play not found: ${playId}`);
        }
        throw new Error(`Failed to fetch play + metadata: ${response.statusText}`);
    }
    const json = await response.json();
    // json shape { play, metadata }
    return json;
}

/**
 * Delete a play by ID
 * @param playId - The play ID
 */
export async function deletePlay(playId: string): Promise<void> {
    const response = await fetch(`/api/plays/${playId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error(`Failed to delete play: ${response.statusText}`);
    }
}

/**
 * Check if a play exists
 * @param playId - The play ID
 * @returns Whether the play exists
 */
export async function playExists(playId: string): Promise<boolean> {
    try {
        await fetchPlayById(playId);
        return true;
    } catch {
        return false;
    }
}
