# Frontend Types Documentation

This document describes the TypeScript types used throughout the Theatre Play Buddy frontend application.

## Overview

The types are organized into several categories:

### Core Play Structure Types

- **`Playbook`** - Complete playbook with all acts, scenes, and characters
- **`Character`** - Character with UI-specific properties (favorites, completion rate)
- **`Act`** - Act within a play
- **`Scene`** - Scene within an act
- **`Line`** - Single line of dialogue or stage direction with practice tracking

### Practice Mode Types

- **`PracticeSession`** - Configuration for a practice session
- **`CharacterPracticeStats`** - Statistics for character practice progress

### UI State Types

- **`CharacterSelection`** - Character selection state
- **`PracticeViewMode`** - View mode: "line-by-line" | "book"
- **`LineFilter`** - Filtering options for line display

### Database & API Types

- **`PlayMetadata`** - Lightweight play metadata for listings
- **`DbStats`** - Database statistics
- **`PlayListResponse`** - API response for play lists
- **`PlayResponse`** - API response for single play

### Parser Types

- **`ParseEvent`** - SSE events during play parsing
- **`ParseError`** - Parse error details

### Utility Types

- **`LoadingState`** - Generic loading state
- **`AsyncResult<T>`** - Generic async operation result
- **`PaginationParams`** - Pagination parameters
- **`SortParams`** - Sort parameters

## Usage

Import types from `@/lib/types`:

```typescript
import type { Playbook, Character, Line } from "@/lib/types";
```

## Relationship to Backend Types

The backend uses Zod schemas (`src/lib/parse/schemas.ts`) that define the core structure without UI-specific properties. The frontend types extend these with additional fields for:

- User preferences (favorites, last selected)
- Practice tracking (mastery level, rehearsal count, completion rate)
- UI state management

## Type Safety

All types are strictly typed to ensure:

- Consistent data structures across components
- Type-safe API responses
- Compile-time validation of prop types
- IntelliSense support in editors
