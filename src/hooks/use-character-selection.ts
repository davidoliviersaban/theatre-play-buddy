"use client";

import * as React from "react";
import type { Playbook } from "@/lib/types";
import { getCurrentCharacterId, setCurrentCharacterId } from "@/lib/play-storage";

export function useCharacterSelection(play: Playbook | null | undefined) {
    // Initialize from sessionStorage first, fallback to default character
    const [selectedCharacterId, setSelectedCharacterId] = React.useState<
        string | undefined
    >(() => {
        if (!play) return undefined;
        const saved = getCurrentCharacterId(play.id);
        if (saved && play.characters.some((c) => c.id === saved)) {
            return saved;
        }
        return play.characters.find((c) => c.isFavorite)?.id;
    });

    const activeCharacter = React.useMemo(
        () => play?.characters.find((c) => c.id === selectedCharacterId),
        [play?.characters, selectedCharacterId]
    );

    // Persist selected character and last play to sessionStorage
    React.useEffect(() => {
        if (selectedCharacterId && play?.id) {
            setCurrentCharacterId(play.id, selectedCharacterId);
        }
    }, [selectedCharacterId, play?.id]);

    return {
        selectedCharacterId,
        activeCharacter,
        setSelectedCharacterId,
    };
}
