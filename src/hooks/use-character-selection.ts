"use client";

import * as React from "react";
import type { Play } from "@/lib/mock-data";

export function useCharacterSelection(play: Play) {
    const defaultCharacter =
        play.characters.find((c) => c.isFavorite) || undefined;

    const [selectedCharacterId, setSelectedCharacterId] = React.useState<
        string | undefined
    >(defaultCharacter?.id);

    const activeCharacter = React.useMemo(
        () => play.characters.find((c) => c.id === selectedCharacterId),
        [play.characters, selectedCharacterId]
    );

    // Persist selected character to localStorage
    React.useEffect(() => {
        if (selectedCharacterId) {
            localStorage.setItem(`selectedCharacter_${play.id}`, selectedCharacterId);
        }
    }, [selectedCharacterId, play.id]);

    // Load selected character from localStorage on mount
    React.useEffect(() => {
        const saved = localStorage.getItem(`selectedCharacter_${play.id}`);
        if (saved && play.characters.some((c) => c.id === saved)) {
            setSelectedCharacterId(saved);
        }
    }, [play.id, play.characters]);

    return {
        selectedCharacterId,
        activeCharacter,
        setSelectedCharacterId,
    };
}
