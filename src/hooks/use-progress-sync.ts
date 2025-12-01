import { useState, useEffect, useCallback, useRef } from "react";

interface LineProgress {
    rehearsalCount: number;
    hintCount: number;
    progressPercent: number;
    lastPracticedAt: Date;
}

interface CharacterProgress {
    totalLines: number;
    masteredLines: number;
    lastPracticedAt?: Date;
}

interface SessionStats {
    linesRehearsed: number;
    totalRehearsals: number;
    totalHints: number;
    masteredLines: number;
}

interface ProgressData {
    characterProgress: CharacterProgress;
    sessionStats: SessionStats;
    lineProgress: Record<string, LineProgress>;
}

interface UseProgressOptions {
    playId: string;
    characterId: string;
    syncInterval?: number; // milliseconds, default 20000 (20s)
    enabled?: boolean;
}

const CACHE_PREFIX = "progress_cache:";
const PENDING_PREFIX = "progress_pending:";

/**
 * Hook for managing practice progress with DB persistence and localStorage caching
 * 
 * Features:
 * - Fetches progress from API on mount
 * - Caches data in localStorage for fast reads
 * - Queues updates locally and syncs to DB periodically
 * - Automatic background sync every 10-30 seconds
 * - Optimistic updates for immediate UI feedback
 */
export function useProgress({ playId, characterId, syncInterval = 20000, enabled = true }: UseProgressOptions) {
    const [progress, setProgress] = useState<ProgressData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const syncTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const pendingUpdatesRef = useRef<Map<string, Partial<LineProgress>>>(new Map());

    const cacheKey = `${CACHE_PREFIX}${playId}:${characterId}`;
    const pendingKey = `${PENDING_PREFIX}${playId}:${characterId}`;

    // Load from localStorage cache
    const loadFromCache = useCallback(() => {
        if (typeof window === "undefined") return null;
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const data = JSON.parse(cached);
                // Convert date strings back to Date objects
                if (data.characterProgress?.lastPracticedAt) {
                    data.characterProgress.lastPracticedAt = new Date(data.characterProgress.lastPracticedAt);
                }
                Object.values(data.lineProgress || {}).forEach((lp: unknown) => {
                    const lineProgress = lp as Partial<LineProgress>;
                    if (lineProgress.lastPracticedAt && typeof lineProgress.lastPracticedAt === 'string') {
                        lineProgress.lastPracticedAt = new Date(lineProgress.lastPracticedAt) as unknown as Date;
                    }
                });
                return data;
            }
        } catch (err) {
            console.error("[useProgress] Failed to load from cache:", err);
        }
        return null;
    }, [cacheKey]);

    // Save to localStorage cache
    const saveToCache = useCallback((data: ProgressData) => {
        if (typeof window === "undefined") return;
        try {
            localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (err) {
            console.error("[useProgress] Failed to save to cache:", err);
        }
    }, [cacheKey]);

    // Load pending updates from localStorage
    const loadPendingUpdates = useCallback(() => {
        if (typeof window === "undefined") return;
        try {
            const pending = localStorage.getItem(pendingKey);
            if (pending) {
                const updates = JSON.parse(pending);
                pendingUpdatesRef.current = new Map(Object.entries(updates));
            }
        } catch (err) {
            console.error("[useProgress] Failed to load pending updates:", err);
        }
    }, [pendingKey]);

    // Save pending updates to localStorage
    const savePendingUpdates = useCallback(() => {
        if (typeof window === "undefined") return;
        try {
            const updates = Object.fromEntries(pendingUpdatesRef.current);
            if (Object.keys(updates).length > 0) {
                localStorage.setItem(pendingKey, JSON.stringify(updates));
            } else {
                localStorage.removeItem(pendingKey);
            }
        } catch (err) {
            console.error("[useProgress] Failed to save pending updates:", err);
        }
    }, [pendingKey]);

    // Fetch progress from API
    const fetchProgress = useCallback(async () => {
        if (!enabled) return;

        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch(`/api/progress?playId=${playId}&characterId=${characterId}`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch progress: ${response.statusText}`);
            }

            const data = await response.json();
            setProgress(data);
            saveToCache(data);
        } catch (err) {
            console.error("[useProgress] Error fetching progress:", err);
            setError((err as Error).message);
            
            // Try to load from cache if API fails
            const cached = loadFromCache();
            if (cached) {
                setProgress(cached);
            }
        } finally {
            setIsLoading(false);
        }
    }, [playId, characterId, enabled, saveToCache, loadFromCache]);

    // Sync pending updates to database
    const syncToDatabase = useCallback(async () => {
        if (pendingUpdatesRef.current.size === 0) return;

        setIsSyncing(true);

        try {
            const updates = Array.from(pendingUpdatesRef.current.entries()).map(([lineId, update]) => ({
                lineId,
                ...update,
            }));

            const response = await fetch("/api/progress", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    playId,
                    characterId,
                    updates,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to sync progress: ${response.statusText}`);
            }

            // Clear pending updates after successful sync
            pendingUpdatesRef.current.clear();
            savePendingUpdates();

            // Refresh from API to get updated stats
            await fetchProgress();
        } catch (err) {
            console.error("[useProgress] Error syncing to database:", err);
            // Keep pending updates for next sync attempt
        } finally {
            setIsSyncing(false);
        }
    }, [playId, characterId, savePendingUpdates, fetchProgress]);

    // Update line progress (optimistic update + queue for sync)
    const updateLineProgress = useCallback((
        lineId: string,
        updates: { rehearsalDelta?: number; hintDelta?: number; progressPercent?: number }
    ) => {
        setProgress((prev) => {
            if (!prev) return prev;

            const currentLine = prev.lineProgress[lineId] || {
                rehearsalCount: 0,
                hintCount: 0,
                progressPercent: 0,
                lastPracticedAt: new Date(),
            };

            const updatedLine = {
                ...currentLine,
                rehearsalCount: currentLine.rehearsalCount + (updates.rehearsalDelta ?? 0),
                hintCount: currentLine.hintCount + (updates.hintDelta ?? 0),
                progressPercent: updates.progressPercent ?? currentLine.progressPercent,
                lastPracticedAt: new Date(),
            };

            const newProgress = {
                ...prev,
                lineProgress: {
                    ...prev.lineProgress,
                    [lineId]: updatedLine,
                },
                sessionStats: {
                    ...prev.sessionStats,
                    totalRehearsals: prev.sessionStats.totalRehearsals + (updates.rehearsalDelta ?? 0),
                    totalHints: prev.sessionStats.totalHints + (updates.hintDelta ?? 0),
                    linesRehearsed: Object.keys(prev.lineProgress).filter(
                        id => id === lineId || prev.lineProgress[id].rehearsalCount > 0
                    ).length,
                },
            };

            saveToCache(newProgress);
            return newProgress;
        });

        // Queue update for database sync
        const pending = pendingUpdatesRef.current.get(lineId) || { rehearsalCount: 0, hintCount: 0 };
        pendingUpdatesRef.current.set(lineId, {
            rehearsalCount: (pending.rehearsalCount ?? 0) + (updates.rehearsalDelta ?? 0),
            hintCount: (pending.hintCount ?? 0) + (updates.hintDelta ?? 0),
            progressPercent: updates.progressPercent ?? pending.progressPercent,
        });
        savePendingUpdates();
    }, [saveToCache, savePendingUpdates]);

    // Initial load
    useEffect(() => {
        if (!enabled) return;

        // Load from cache first for instant display
        const cached = loadFromCache();
        if (cached) {
            setProgress(cached);
            setIsLoading(false);
        }

        // Load pending updates
        loadPendingUpdates();

        // Then fetch from API
        fetchProgress();
    }, [playId, characterId, enabled, fetchProgress, loadFromCache, loadPendingUpdates]);

    // Setup periodic sync
    useEffect(() => {
        if (!enabled) return;

        syncTimerRef.current = setInterval(() => {
            syncToDatabase();
        }, syncInterval);

        return () => {
            if (syncTimerRef.current) {
                clearInterval(syncTimerRef.current);
            }
        };
    }, [enabled, syncInterval, syncToDatabase]);

    // Sync on unmount
    useEffect(() => {
        return () => {
            if (pendingUpdatesRef.current.size > 0) {
                syncToDatabase();
            }
        };
    }, [syncToDatabase]);

    return {
        progress,
        isLoading,
        isSyncing,
        error,
        updateLineProgress,
        syncNow: syncToDatabase,
        refresh: fetchProgress,
    };
}
