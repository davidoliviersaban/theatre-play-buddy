/**
 * Frontend Types for Theatre Play Buddy
 * 
 * This file contains all the TypeScript types used in the frontend application.
 * These types extend the base schema types with additional UI-specific properties
 * for practice mode, user preferences, and progress tracking.
 */

// ============================================================================
// Core Play Structure Types
// ============================================================================

/**
 * Represents a complete playbook with all acts, scenes, and characters
 */
export type Playbook = {
    id: string;
    title: string;
    author: string;
    year: number;
    genre: string;
    description: string;
    coverImage?: string;
    characters: Character[];
    acts: Act[];
};

/**
 * Represents a character in the play
 */
export type Character = {
    id: string;
    name: string;
    description?: string;
    /** Whether this character is marked as favorite by the user */
    isFavorite?: boolean;
    /** Whether this character was the last selected for practice */
    lastSelected?: boolean;
    /** User's completion rate for this character's lines (0-100) */
    completionRate?: number;
};

/**
 * Represents an act within a play
 */
export type Act = {
    id: string;
    title: string;
    scenes: Scene[];
};

/**
 * Represents a scene within an act
 */
export type Scene = {
    id: string;
    title: string;
    lines: Line[];
};

/**
 * Represents a single line of dialogue or stage direction
 */
export type Line = {
    id: string;
    /** Single character speaking this line (used for single-speaker dialogue) */
    characterId?: string;
    /** Multiple characters speaking simultaneously (e.g., "BOTH:", "ALL:") */
    characterIdArray?: string[];
    /** The actual text content of the line */
    text: string;
    /** Type of line: dialogue or stage direction */
    type: "dialogue" | "stage_direction";
};

// ============================================================================
// Practice Mode Types
// ============================================================================

/**
 * User practice progress for a specific line
 */
export type UserLineProgress = {
    id: string;
    userId: string;
    lineId: string;
    characterId: string;
    playbookId: string;
    rehearsalCount: number;
    hintCount: number;
    progressPercent: number;
    firstPracticedAt: Date;
    lastPracticedAt: Date;
};

/**
 * User practice progress for a character
 */
export type UserCharacterProgress = {
    id: string;
    userId: string;
    characterId: string;
    playbookId: string;
    totalLines: number;
    masteredLines: number;
    firstPracticedAt: Date;
    lastPracticedAt: Date;
};

/**
 * Practice session configuration
 */
export type PracticeSession = {
    playId: string;
    characterIds: string[];
    startTime: Date;
    endTime?: Date;
    linesRehearsed: number;
    linesMastered: number;
};

/**
 * Practice statistics for a character
 */
export type CharacterPracticeStats = {
    characterId: string;
    totalLines: number;
    rehearsedLines: number;
    completionRate: number;
    lastPracticed?: Date;
};

// ============================================================================
// UI State Types
// ============================================================================

/**
 * Selection state for character practice mode
 */
export type CharacterSelection = {
    characterId: string;
    isSelected: boolean;
};

/**
 * View mode for practice session
 */
export type PracticeViewMode = "line-by-line" | "book";

/**
 * Filter options for line display
 */
export type LineFilter = {
    characterIds?: string[];
    includeStageDirections?: boolean;
    minRehearsalCount?: number;
    maxRehearsalCount?: number;
};

// ============================================================================
// Database & API Types
// ============================================================================

/**
 * Metadata for a play stored in the database
 */
export type PlayMetadata = {
    id: string;
    title: string;
    author: string;
    genre: string;
    year: number;
    createdAt: string;
    updatedAt: string;
    characterCount: number;
    actCount: number;
    lineCount: number;
};

/**
 * Database statistics
 */
export type DbStats = {
    totalPlays: number;
    totalCharacters: number;
    totalLines: number;
};

/**
 * API response for play list
 */
export type PlayListResponse = {
    plays: PlayMetadata[];
    stats?: DbStats;
};

/**
 * API response for single play
 */
export type PlayResponse = {
    play: Playbook;
};

// ============================================================================
// Parser Types
// ============================================================================

/**
 * SSE events emitted during play parsing
 */
export type ParseEvent =
    | { type: "ready" }
    | { type: "token_estimate"; estimatedTokens: number }
    | { type: "llm_provider"; provider: string }
    | { type: "llm_started" }
    | { type: "keepalive" }
    | { type: "progress"; percentage: number; message?: string }
    | { type: "character_found"; character: Character }
    | { type: "act_complete"; actNumber: number; actTitle: string }
    | { type: "scene_complete"; sceneNumber: number; sceneTitle: string }
    | { type: "complete"; play: Playbook }
    | { type: "error"; error: string };

/**
 * Parse error details
 */
export type ParseError = {
    message: string;
    code?: string;
    details?: unknown;
};

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Generic loading state
 */
export type LoadingState = "idle" | "loading" | "success" | "error";

/**
 * Generic async result
 */
export type AsyncResult<T> = {
    state: LoadingState;
    data?: T;
    error?: string;
};

/**
 * Pagination parameters
 */
export type PaginationParams = {
    page: number;
    pageSize: number;
    totalItems?: number;
};

/**
 * Sort parameters
 */
export type SortParams = {
    field: string;
    direction: "asc" | "desc";
};
