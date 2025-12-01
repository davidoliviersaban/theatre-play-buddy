# LLM Parser Database Integration

## Overview

This document describes how the LLM play parser integrates with the PostgreSQL database to persist imported plays.

## Architecture

### Parse Workflow

1. **Upload**: User uploads a play file (PDF, DOCX, or TXT) via `/import` page
2. **Extract**: Server extracts text from the uploaded file
3. **Parse**: LLM (Claude 3.5 Sonnet or GPT-4) parses the text into structured data
4. **Validate**: Zod schemas validate the parsed data structure
5. **Save**: Prisma adapter saves the validated play to PostgreSQL
6. **Display**: UI shows success message with link to view the imported play

### Database Storage

Imported plays are stored across multiple tables:

- `Playbook` - Main play metadata (title, author, year, genre)
- `Character` - Character definitions
- `Act` - Act structure with ordering
- `Scene` - Scene structure with ordering
- `Line` - Individual lines with speaker attribution

### Session Storage

The `play-storage.ts` module now only handles session-specific data:

- Character selection
- Line progress (last practiced line)
- Session statistics (lines rehearsed, hints used, accuracy)
- Line mastery tracking

**Note**: Play data is NO LONGER stored in sessionStorage. All play persistence is handled by the database.

## Key Components

### Parse Route (`src/app/import/api/parse/route.ts`)

- **Endpoint**: `POST /import/api/parse`
- **Input**: `{ uploadId: string }`
- **Output**: Server-Sent Events (SSE) stream with parsing progress
- **Database**: Uses `plays-db-prisma.ts` adapter to save parsed plays
- **Events**:
  - `progress` - Parsing progress updates
  - `complete` - Parsing complete with full play data
  - `error` - Parsing error with details

### Parse Progress Component (`src/components/import/parse-progress.tsx`)

- Displays real-time parsing progress via SSE
- Shows success message with play metadata on completion
- Provides "View Play" button to navigate to the imported play
- **No longer saves to sessionStorage** - play is already in database

### Database Adapter (`src/lib/db/plays-db-prisma.ts`)

- `savePlay(play: Playbook)` - Saves complete play with all nested data
- `getPlayById(id: string)` - Retrieves complete play structure
- `getAllPlays()` - Lists all plays with metadata
- `deletePlay(id: string)` - Removes play and all related data

## Changes from File-Based Storage

### Before (File-Based)

```typescript
// Parse route saved to JSON files
import { savePlay } from "../../../../lib/db/plays-db";

// UI saved to sessionStorage
import { saveImportedPlay } from "../../lib/play-storage";
saveImportedPlay(data);
```

### After (Database)

```typescript
// Parse route saves to PostgreSQL
import { savePlay } from "../../../../lib/db/plays-db-prisma";

// UI does NOT save - play already in database
// Removed sessionStorage play persistence
```

## User Flow

### Import a Play

1. Navigate to `/import`
2. Upload a play file (PDF, DOCX, or TXT)
3. Wait for LLM parsing (progress shown in real-time)
4. Click "View Play" button when complete
5. Play is now available at `/play/[id]` and in the home page grid

### View Imported Plays

- Home page (`/`) shows all plays from database via `/api/plays`
- Each play card displays metadata and statistics
- Click any play to view details at `/play/[id]`

## API Endpoints

### `GET /api/plays`

Returns all plays with metadata:

```json
[
  {
    "id": "romeo-and-juliet",
    "title": "Romeo and Juliet",
    "author": "William Shakespeare",
    "genre": "Tragedy",
    "year": 1597,
    "characterCount": 25,
    "actCount": 5,
    "lineCount": 2458
  }
]
```

### `GET /api/plays/[id]`

Returns complete play structure with all acts, scenes, characters, and lines.

### `DELETE /api/plays/[id]`

Removes play and all related data from database.

## Testing

### Unit Tests

All existing tests pass (86 tests):

- `tests/parse/extractors.test.ts` - Text extraction
- `tests/parse/schemas.test.ts` - Zod validation
- `tests/parse/multi-character.test.ts` - Multi-character attribution
- `tests/parse/llm-parser.test.ts` - LLM parsing logic

### Manual Testing

1. Start database: `docker-compose up -d`
2. Run migrations: `npx prisma migrate dev`
3. Start dev server: `npm run dev`
4. Navigate to `http://localhost:3000/import`
5. Upload a play file
6. Verify parsing completes successfully
7. Click "View Play" and verify all data is present
8. Check home page shows the imported play

## Database Schema

### Playbook Table

```prisma
model Playbook {
  id          String      @id
  title       String
  author      String
  year        Int?
  genre       String?
  description String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  characters  Character[]
  acts        Act[]
}
```

### Character Table

```prisma
model Character {
  id          String    @id
  name        String
  description String?
  playbookId  String
  playbook    Playbook  @relation(fields: [playbookId], references: [id], onDelete: Cascade)
}
```

### Act Table

```prisma
model Act {
  id         String   @id
  title      String
  order      Int
  playbookId String
  playbook   Playbook @relation(fields: [playbookId], references: [id], onDelete: Cascade)
  scenes     Scene[]
}
```

### Scene Table

```prisma
model Scene {
  id    String @id
  title String
  order Int
  actId String
  act   Act    @relation(fields: [actId], references: [id], onDelete: Cascade)
  lines Line[]
}
```

### Line Table

```prisma
model Line {
  id          String  @id
  text        String
  characterId String?
  order       Int
  sceneId     String
  scene       Scene   @relation(fields: [sceneId], references: [id], onDelete: Cascade)
}
```

## Troubleshooting

### Play not appearing after import

1. Check browser console for errors
2. Verify database is running: `docker ps`
3. Check parse route logs for save errors
4. Verify play exists in database: `npx prisma studio`

### Parse errors

1. Check file format is supported (PDF, DOCX, TXT)
2. Verify LLM API key is set in `.env.local`
3. Check parse route logs for validation errors
4. Try different file or smaller play

### Database errors

1. Reset database: `npx prisma migrate reset`
2. Reseed data: `npm run db:seed`
3. Check PostgreSQL logs: `docker-compose logs postgres`

## Next Steps

### Potential Enhancements

- [ ] Add progress tracking integration (update UserLineProgress during practice)
- [ ] Add play editing capabilities via UI
- [ ] Add bulk import for multiple plays
- [ ] Add export functionality (download play as JSON/PDF)
- [ ] Add search/filter for imported plays
- [ ] Add play version history tracking

## References

- [Prisma Schema](../prisma/schema.prisma)
- [Database Status](../DATABASE_STATUS.md)
- [Migration Summary](../MIGRATION_SUMMARY.md)
- [Parse API Spec](../specs/002-llm-play-parser/contracts/parse-api.yaml)
