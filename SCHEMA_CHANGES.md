# Database Schema Update - User Progress Tracking

**Date**: December 1, 2024  
**Migration**: `20251130233042_add_user_progress_tracking`

## Summary

Refactored the database schema to separate user practice progress tracking from the core play content. This enables multi-user support and cleaner data architecture.

## Schema Changes

### Removed Fields

#### From `Line` model:

- ❌ `rehearsalCount` (Int) - Moved to UserLineProgress

#### From `Character` model:

- No changes to database fields (isFavorite, lastSelected, completionRate remain for backward compatibility)

### New Tables

#### `UserLineProgress`

Tracks individual line practice progress per user and character.

```prisma
model UserLineProgress {
  id             String       @id @default(uuid())
  userId         String       @default("default-user")
  lineId         String
  characterId    String
  playbookId     String

  rehearsalCount Int          @default(0)
  hintCount      Int          @default(0)
  progressPercent Int         @default(0)

  firstPracticedAt DateTime   @default(now())
  lastPracticedAt  DateTime   @updatedAt

  @@unique([userId, lineId, characterId])
}
```

**Fields**:

- `userId`: User identifier (default: "default-user" for single-user mode)
- `lineId`: Reference to the Line being practiced
- `characterId`: Character being practiced for this line
- `playbookId`: Play reference for efficient querying
- `rehearsalCount`: Number of times the line was rehearsed
- `hintCount`: Number of times user asked for a hint (NEW metric)
- `progressPercent`: Progress percentage 0-100 (INT instead of MasteryLevel enum)
- `firstPracticedAt`: When the user first practiced this line
- `lastPracticedAt`: Most recent practice timestamp

**Indexes**:

- Unique constraint on `[userId, lineId, characterId]`
- Indexes on: `userId`, `lineId`, `characterId`, `playbookId`, `[userId, playbookId]`, `[userId, characterId]`

#### `UserCharacterProgress`

Tracks overall character progress summary per user.

```prisma
model UserCharacterProgress {
  id             String       @id @default(uuid())
  userId         String       @default("default-user")
  characterId    String
  playbookId     String

  totalLines     Int          @default(0)
  masteredLines  Int          @default(0)

  firstPracticedAt DateTime   @default(now())
  lastPracticedAt  DateTime   @updatedAt

  @@unique([userId, characterId])
}
```

**Fields**:

- `userId`: User identifier
- `characterId`: Character being tracked
- `playbookId`: Play reference
- `totalLines`: Total number of lines for this character
- `masteredLines`: Number of lines with high mastery
- `firstPracticedAt`: When the user first practiced this character
- `lastPracticedAt`: Most recent practice timestamp

**Indexes**:

- Unique constraint on `[userId, characterId]`
- Indexes on: `userId`, `characterId`, `playbookId`, `[userId, playbookId]`

## Code Changes

### New Files Created

#### `/src/lib/db/user-progress.ts`

Comprehensive user progress tracking API with functions:

**Line Progress**:

- `getUserLineProgress(lineId, characterId, userId?)` - Get or create progress
- `updateLineProgress(lineId, characterId, updates, userId?)` - Update after practice
- `getCharacterLineProgress(characterId, userId?)` - Get all lines for a character
- `getPlayLineProgress(playbookId, userId?)` - Get all lines for a play
- `resetLineProgress(lineId, characterId, userId?)` - Reset line progress
  -calculateMasteryLevel(rehearsalCount, progressPercent)` - Calculate mastery from metrics

**Character Progress**:

- `getCharacterProgress(characterId, userId?)` - Get or create character summary
- `updateCharacterProgress(characterId, userId?)` - Update character summary
- `resetCharacterProgress(characterId, userId?)` - Reset all character progress

**Statistics**:

- `getPlayPracticeStats(playbookId, userId?)` - Comprehensive practice statistics

### Updated Files

#### `/Users/dsaban/git/perso/theatre-play-buddy/src/lib/types.ts`

**Removed from `Line` type**:

```typescript
// REMOVED:
masteryLevel?: MasteryLevel;
rehearsalCount?: number;
```

**Added new types**:

```typescript
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
```

#### `/Users/dsaban/git/perso/theatre-play-buddy/src/lib/db/init-db.ts`

**Removed from line creation**:

```typescript
// REMOVED:
masteryLevel: line.masteryLevel,
rehearsalCount: line.rehearsalCount ?? 0,
```

#### `/Users/dsaban/git/perso/theatre-play-buddy/prisma/schema.prisma`

- Removed `masteryLevel` and `rehearsalCount` from `Line` model
- Added `userProgress` relation to `Line` model
- Added `userCharacterProgress` and `userLineProgress` relations to `Playbook` model
- Added `userCharacterProgress` and `userLineProgress` relations to `Character` model
- Added `UserLineProgress` model
- Added `UserCharacterProgress` model

## Files That Need Manual Update

⚠️ **The following files still reference old fields and need to be updated**:

### `/Users/dsaban/git/perso/theatre-play-buddy/src/lib/mock-data.ts`

**Action Required**: Remove `masteryLevel` and `rehearsalCount` from all line objects.

**Before**:

```typescript
{ id: "l1-1-1", characterId: "c1", text: "Is the day so young?", type: "dialogue", masteryLevel: "high", rehearsalCount: 12 }
```

**After**:

```typescript
{ id: "l1-1-1", characterId: "c1", text: "Is the day so young?", type: "dialogue" }
```

Also remove `isFavorite`, `lastSelected`, `completionRate` from character objects in mock data as these are now user-specific.

### `/Users/dsaban/git/perso/theatre-play-buddy/src/lib/play-storage.ts`

**Action Required**: Review and update to remove references to practice tracking fields if present.

### `/Users/dsaban/git/perso/theatre-play-buddy/src/lib/parse/schemas.ts`

**Note**: This file has commented-out practice tracking fields. These can remain commented or be removed.

## Migration Impact

### Breaking Changes

1. **Line model no longer has practice tracking fields**

   - `masteryLevel` removed
   - `rehearsalCount` removed
   - Existing data in these fields was dropped during migration

2. **Practice progress now requires userId**
   - Default user ID: `"default-user"`
   - Future-proof for multi-user authentication

### Data Migration

- ⚠️ **Lost data**: Any existing `masteryLevel` and `rehearsalCount` values were dropped
- New practice sessions will start fresh in `UserLineProgress` table
- To preserve old practice data, would need a custom migration script

## Benefits

### Architectural Improvements

1. **Separation of Concerns**

   - Play content (immutable) separate from user progress (mutable)
   - Cleaner data model

2. **Multi-User Ready**

   - Built-in userId field
   - Unique constraints prevent conflicts
   - Ready for authentication integration

3. **Richer Metrics**

   - `hintCount` - new metric for tracking help requests
   - `progressPercent` - finer granularity than 3-level mastery
   - `firstPracticedAt` / `lastPracticedAt` - temporal tracking
   - Character-level summaries

4. **Better Querying**

   - Dedicated indexes for common queries
   - `playbookId` denormalization for efficient filtering
   - Separate character summary table

5. **Flexible Progress Calculation**
   - `calculateMasteryLevel()` function derives mastery from multiple metrics
   - Can easily add new calculation algorithms
   - Progress percent allows for gradual improvement tracking

## Usage Examples

### Recording Practice Activity

```typescript
import { updateLineProgress } from "@/lib/db/user-progress";

// After user rehearses a line
await updateLineProgress("line-123", "character-456", {
  incrementRehearsalCount: true,
  progressPercent: 75,
});

// After user asks for a hint
await updateLineProgress("line-123", "character-456", {
  incrementHintCount: true,
});
```

### Getting Progress Statistics

```typescript
import { getPlayPracticeStats } from "@/lib/db/user-progress";

const stats = await getPlayPracticeStats("play-id");
// Returns:
// {
//   playbookId: 'play-id',
//   totalLines: 150,
//   totalRehearsals: 450,
//   totalHints: 23,
//   averageProgress: 67.5,
//   masteryDistribution: { low: 50, medium: 60, high: 40 },
//   characterProgress: [...]
// }
```

### Checking Character Progress

```typescript
import { getCharacterProgress } from "@/lib/db/user-progress";

const progress = await getCharacterProgress("character-id");
// Returns:
// {
//   totalLines: 50,
//   masteredLines: 15,
//   lastPracticedAt: Date
// }
```

## Next Steps

### Immediate

1. ✅ Schema updated and migrated
2. ✅ New user-progress.ts API created
3. ⏭️ Update mock-data.ts to remove old fields
4. ⏭️ Update play-storage.ts if needed
5. ⏭️ Test API endpoints with new schema

### Integration

1. Update practice mode components to use new API
2. Create UI for hint tracking
3. Display progress percentage instead of/alongside mastery levels
4. Add character progress summaries to UI
5. Implement practice statistics dashboard

### Future Enhancements

1. Add user authentication
2. Replace "default-user" with actual user IDs
3. Add practice session tracking (groups of lines practiced together)
4. Add spaced repetition algorithm
5. Export/import user progress
6. Practice history timeline
7. Achievement system based on progress

## Database Commands

```bash
# View migration
cat prisma/migrations/20251130233042_add_user_progress_tracking/migration.sql

# Open Prisma Studio to view new tables
npm run db:studio

# Reset database (WARNING: loses all data)
npx prisma migrate reset

# Generate Prisma Client with new models
npx prisma generate
```

## Testing Checklist

- [ ] Prisma Client regenerated
- [ ] TypeScript server restarted (VS Code)
- [ ] Mock data updated
- [ ] API endpoints tested
- [ ] Practice mode UI updated
- [ ] User progress functions tested
- [ ] Statistics calculations verified
- [ ] Multi-user isolation tested (different userIds)
