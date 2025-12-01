import { useState, useEffect, useMemo, useRef } from "react";
import type { Playbook, Line } from "@/lib/types";
import { getLastLineIndex, setLastLineIndex } from "@/lib/play-storage";
import { useProgress } from "./use-progress-sync";

type LineWithMetadata = Line & {
    __actId: string;
    __actTitle: string;
    __sceneId: string;
    __sceneTitle: string;
};

// Word removal stages: 0 = full text, 1-4 = progressive removal, 5 = all hidden
type LineStageMap = Record<string, number>; // lineId -> stage (0-5)

export function usePracticeSession(play: Playbook, characterId: string, startId?: string) {
    // Initialize database-backed progress tracking
    const {
        progress: dbProgress,
        updateLineProgress: updateDbProgress,
        isLoading: isProgressLoading,
    } = useProgress({
        playId: play.id,
        characterId,
        syncInterval: 20000, // Sync every 20 seconds
        enabled: !!characterId,
    });

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
        // Only access sessionStorage on client-side
        if (typeof window !== 'undefined' && characterId) {
            const stored = getLastLineIndex(play.id, characterId);
            if (stored !== null && stored >= 0 && stored < allLines.length) {
                return stored;
            }
        }
        return 0;
    }, [allLines, startId, characterId, play.id]);

    const [currentLineIndex, setCurrentLineIndex] = useState(initialIndex);
    const [isPaused, setIsPaused] = useState(true);
    const [lineStages, setLineStages] = useState<LineStageMap>({});
    const [showHint, setShowHint] = useState(false);
    const [masteryUpdateTrigger, setMasteryUpdateTrigger] = useState(0);
    
    // Use database stats if available, otherwise use local state
    const sessionStats = useMemo(() => {
        if (dbProgress) {
            return {
                linesRehearsed: dbProgress.sessionStats.linesRehearsed,
                correctLines: 0, // Not tracked in DB yet
                hintsUsed: dbProgress.sessionStats.totalHints,
            };
        }
        return {
            linesRehearsed: 0,
            correctLines: 0,
            hintsUsed: 0,
        };
    }, [dbProgress]);

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

    // Auto-advance for non-user lines when not paused
    useEffect(() => {
        if (isPaused) {
            return;
        }

        const currentLine = allLines[currentLineIndex];
        const isMyLine = currentLine?.characterId === characterId;

        if (isMyLine) {
            // console.log('[Auto-advance] IS MY LINE - waiting for manual advance');
            // return; // Don't auto-advance on user's lines
        }

        // console.log('[Auto-advance] NOT MY LINE - setting 2s timer');
        const timer = setTimeout(() => {
            setCurrentLineIndex(prev => {
                const next = Math.min(allLines.length - 1, prev + 1);
                if (characterId) {
                    setLastLineIndex(play.id, characterId, next);
                }
                return next;
            });
        }, 2000); // 2 seconds per line

        return () => {
            clearTimeout(timer);
        };
    }, [currentLineIndex, isPaused, allLines, characterId, play.id]);

    const persistLineIndex = (index: number) => {
        if (characterId) {
            setLastLineIndex(play.id, characterId, index);
        }
    };

    const goToPrevious = () => setCurrentLineIndex(prev => {
        const next = Math.max(0, prev - 1);
        persistLineIndex(next);
        return next;
    });
    const goToNext = () => {
        // If this is the user's dialogue line and not yet counted, increment stats before moving
        if (
            currentLine &&
            currentLine.type === 'dialogue' &&
            isMyLine &&
            !countedLineIdsRef.current.has(currentLine.id)
        ) {
            countedLineIdsRef.current.add(currentLine.id);
            
            // Update database with rehearsal count
            updateDbProgress(currentLine.id, {
                rehearsalDelta: 1,
            });
        }

        // Update line mastery when moving to next line (only for my dialogue lines)
        if (currentLine && currentLine.type === 'dialogue' && isMyLine) {
            updateLineMastery(currentLine.id);
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

    const togglePause = () => {
        console.log('[togglePause] Current isPaused:', isPaused, 'Setting to:', !isPaused);
        setIsPaused(!isPaused);
    };

    const toggleHint = () => {
        if (!showHint && currentLine && isMyLine) {
            // Update database with hint count
            updateDbProgress(currentLine.id, {
                hintDelta: 1,
            });

            // Update line mastery: decrease mastery by 25%
            const currentProgress = dbProgress?.lineProgress[currentLine.id];
            const currentMastery = currentProgress?.progressPercent || 0;
            const newMastery = Math.max(0, currentMastery - 25);

            updateDbProgress(currentLine.id, {
                progressPercent: newMastery,
            });

            // Force re-render
            setMasteryUpdateTrigger(prev => prev + 1);
        }
        setShowHint(!showHint);
    };

    const updateLineMastery = (lineId: string) => {
        if (typeof window === 'undefined') return;

        const currentProgress = dbProgress?.lineProgress[lineId];
        const currentMastery = currentProgress?.progressPercent || 0;
        const newPercentage = Math.min(100, currentMastery + 20);

        updateDbProgress(lineId, {
            progressPercent: newPercentage,
        });

        // Force re-render
        setMasteryUpdateTrigger(prev => prev + 1);
    };

    const markLineAsKnown = () => {
        if (!currentLine || !isMyLine) return;

        const currentStage = lineStages[currentLine.id] || 0;

        // Count words in the line
        const wordCount = currentLine.text.trim().split(/\s+/).filter(w => w.length > 0).length;

        // For lines with less than 3 words, jump directly to stage 5
        const nextStage = wordCount < 3 ? 5 : currentStage + 1;

        // Update line mastery and rehearsal count (only for dialogue lines)
        if (currentLine.type === 'dialogue') {
            updateLineMastery(currentLine.id);
        }

        // If moving to stage 5 or beyond, we're at the final stage
        if (nextStage >= 5) {
            // Set to stage 5 to show fully hidden text
            setLineStages((prev) => ({
                ...prev,
                [currentLine.id]: 5,
            }));
            setShowHint(false);

            // If we were already at stage 5, move to next line
            if (currentStage === 5) {
                if (!countedLineIdsRef.current.has(currentLine.id)) {
                    countedLineIdsRef.current.add(currentLine.id);
                    // Stats are now tracked in DB via updateLineMastery
                }
                goToNext();
            }
        } else {
            // Advance to next stage (1-4)
            setLineStages((prev) => ({
                ...prev,
                [currentLine.id]: nextStage,
            }));
            setShowHint(false);
        }
    };


    return {
        allLines,
        currentLineIndex,
        currentLine,
        isMyLine,
        isPaused,
        sessionStats,
        isProgressLoading,
        lineRefs,
        goToPrevious,
        goToNext,
        skipToNextScene,
        skipToPreviousScene,
        togglePause,
        lineStages,
        showHint,
        toggleHint,
        markLineAsKnown,
        getLineMastery: (lineId: string) => {
            const progress = dbProgress?.lineProgress[lineId];
            if (!progress) return null;
            return {
                rehearsalCount: progress.rehearsalCount,
                masteryPercentage: progress.progressPercent,
                lastPracticed: progress.lastPracticedAt.toISOString(),
            };
        },
        masteryUpdateTrigger,
    };
}
