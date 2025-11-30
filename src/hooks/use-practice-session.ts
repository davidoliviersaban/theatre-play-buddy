import { useState, useEffect, useMemo, useRef } from "react";
import type { Play, Line } from "@/lib/mock-data";

type LineWithMetadata = Line & {
    __actId: string;
    __actTitle: string;
    __sceneId: string;
    __sceneTitle: string;
};

export function usePracticeSession(play: Play, characterId: string) {
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

    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [sessionStats, setSessionStats] = useState({
        linesRehearsed: 0,
        correctLines: 0,
        hintsUsed: 0,
    });

    const currentLine = allLines[currentLineIndex];
    const isMyLine = currentLine?.characterId === characterId;

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

    // Simulate "Reading" other lines
    useEffect(() => {
        if (!isPaused && !isMyLine && currentLineIndex < allLines.length) {
            const timeout = setTimeout(() => {
                setCurrentLineIndex((prev) => prev + 1);
            }, 2000);
            return () => clearTimeout(timeout);
        }
    }, [currentLineIndex, isPaused, isMyLine, allLines.length]);

    // Simulate completing my line
    useEffect(() => {
        if (!isPaused && isMyLine) {
            const timeout = setTimeout(() => {
                setSessionStats((prev) => ({
                    ...prev,
                    linesRehearsed: prev.linesRehearsed + 1,
                    correctLines: prev.correctLines + 1,
                }));
                setCurrentLineIndex((prev) => prev + 1);
            }, 3000);
            return () => clearTimeout(timeout);
        }
    }, [currentLineIndex, isPaused, isMyLine]);

    const goToPrevious = () => setCurrentLineIndex(Math.max(0, currentLineIndex - 1));
    const goToNext = () => setCurrentLineIndex(Math.min(allLines.length - 1, currentLineIndex + 1));
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
                return;
            }
        }
        // If no previous scene found, go to very beginning
        setCurrentLineIndex(0);
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
