import { useState, useEffect, useMemo, useRef } from "react";
import type { Play, Line } from "@/lib/mock-data";
import { getLastLineIndex, setLastLineIndex, setSessionStats as persistSessionStats, getSessionStats } from "@/lib/play-storage";

type LineWithMetadata = Line & {
    __actId: string;
    __actTitle: string;
    __sceneId: string;
    __sceneTitle: string;
};

export function usePracticeSession(play: Play, characterId: string, startId?: string) {
    // Flatten lines with act/scene metadata
    const allLines = useMemo<LineWithMetadata[]>(() => {
        return play.acts.flatMap((act) =>
            act.scenes.flatMap((scene) =>
                scene.lines.map((line) => ({
                    ...line,
                    __actId: act.id,
                    __actTitle: act.title,
                    __sceneId: scene.id,
                    __sceneTitle: scene.title,
                }))
            )
        );
    }, [play]);

    // Determine initial index: priority order -> explicit startId (act/scene) > resume from sessionStorage > 0
    const initialIndex = useMemo(() => {
        if (startId) {
            let sceneMatchIndex: number | null = null;
            let actFirstIndex: number | null = null;
            for (let i = 0; i < allLines.length; i++) {
                const line = allLines[i];
                if (line.__sceneId === startId) {
                    if (sceneMatchIndex === null) sceneMatchIndex = i;
                    if (line.characterId === characterId) {
                        sceneMatchIndex = i;
                        break;
                    }
                }
                if (line.__actId === startId) {
                    if (actFirstIndex === null) actFirstIndex = i;
                    if (line.characterId === characterId && actFirstIndex !== null) {
                        actFirstIndex = i;
                        break;
                    }
                }
            }
            if (sceneMatchIndex !== null) return sceneMatchIndex;
            if (actFirstIndex !== null) return actFirstIndex;
            return 0;
        }
        if (characterId) {
            const stored = getLastLineIndex(play.id, characterId);
            if (stored !== null && stored >= 0 && stored < allLines.length) {
                return stored;
            }
        }
        return 0;
    }, [allLines, startId, characterId, play.id]);

    const [currentLineIndex, setCurrentLineIndex] = useState(initialIndex);
    const [isPaused, setIsPaused] = useState(true);
    const [sessionStats, setSessionStats] = useState(() => {
        // Load existing stats or start fresh
        if (characterId) {
            const stored = getSessionStats(play.id, characterId);
            if (stored) return stored;
        }
        return {
            linesRehearsed: 0,
            correctLines: 0,
            hintsUsed: 0,
            totalSessions: 1,
        };
    });

    const currentLine = allLines[currentLineIndex];
    const isMyLine = currentLine?.characterId === characterId;

    // Track which line ids have been counted toward stats to avoid double counting on manual navigation
    const countedLineIdsRef = useRef<Set<string>>(new Set());

    // Auto-scroll to current line
    const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        if (lineRefs.current[currentLineIndex]) {
            lineRefs.current[currentLineIndex]?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    }, [currentLineIndex]);

    // If startId changes during the session (unlikely but defensive), reposition
    // We intentionally avoid a follow-up effect to reset currentLineIndex when startId changes.
    // In normal navigation, the hook is re-mounted with a new initialIndex.

    // Simulate "Reading" other lines
    // Removed automatic progression: user advances manually.

    const persistLineIndex = (index: number) => {
        if (characterId) {
            setLastLineIndex(play.id, characterId, index);
        }
    };

    // Persist session stats when they change
    useEffect(() => {
        if (characterId) {
            persistSessionStats(play.id, characterId, sessionStats);
        }
    }, [sessionStats, play.id, characterId]);

    const goToPrevious = () => setCurrentLineIndex(prev => {
        const next = Math.max(0, prev - 1);
        persistLineIndex(next);
        return next;
    });
    const goToNext = () => {
        // If this is the user's line and not yet counted, increment stats before moving
        if (currentLine && isMyLine && !countedLineIdsRef.current.has(currentLine.id)) {
            countedLineIdsRef.current.add(currentLine.id);
            setSessionStats((prev) => ({
                ...prev,
                linesRehearsed: prev.linesRehearsed + 1,
                correctLines: prev.correctLines + 1,
            }));
        }
        setCurrentLineIndex(prev => {
            const next = Math.min(allLines.length - 1, prev + 1);
            persistLineIndex(next);
            return next;
        });
    };
    const skipToNextScene = () => {
        const current = allLines[currentLineIndex];
        if (!current) return;
        const sceneId = current.__sceneId;
        let nextIndex = currentLineIndex;
        for (let i = currentLineIndex + 1; i < allLines.length; i++) {
            if (allLines[i].__sceneId !== sceneId) {
                nextIndex = i;
                break;
            }
        }
        setCurrentLineIndex(nextIndex);
        persistLineIndex(nextIndex);
    };

    const skipToPreviousScene = () => {
        const current = allLines[currentLineIndex];
        if (!current) {
            setCurrentLineIndex(0);
            return;
        }
        const currentSceneId = current.__sceneId;
        // Walk backwards to find a line whose scene differs
        for (let i = currentLineIndex - 1; i >= 0; i--) {
            if (allLines[i].__sceneId !== currentSceneId) {
                // We are in previous scene; find its first line
                const prevSceneId = allLines[i].__sceneId;
                let firstIndex = i;
                for (let j = i; j >= 0; j--) {
                    if (allLines[j].__sceneId === prevSceneId) {
                        firstIndex = j;
                    } else {
                        break;
                    }
                }
                setCurrentLineIndex(firstIndex);
                persistLineIndex(firstIndex);
                return;
            }
        }
        // If no previous scene found, go to very beginning
        setCurrentLineIndex(0);
        persistLineIndex(0);
    };

    const togglePause = () => setIsPaused(!isPaused);

    return {
        allLines,
        currentLineIndex,
        currentLine,
        isMyLine,
        isPaused,
        sessionStats,
        lineRefs,
        goToPrevious,
        goToNext,
        skipToNextScene,
        skipToPreviousScene,
        togglePause,
    };
}
