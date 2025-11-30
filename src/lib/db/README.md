# File-Based Play Database

A lightweight, file-based database system for storing and managing theatrical play data.

## Architecture

### Directory Structure

```
data/
└── plays/
    ├── _index.json          # Metadata index for fast queries
    ├── romeo-and-juliet.json
    ├── hamlet.json
    └── macbeth.json
```

### Features

- **Automatic persistence**: Plays are automatically saved after successful parsing
- **Fast metadata queries**: Index file allows quick listing without loading full plays
- **Full-text search**: Search by title or author
- **Statistics tracking**: Track total plays, characters, and lines
- **Atomic operations**: Safe concurrent access with file-level operations

## API Endpoints

### GET /api/plays

Get all plays metadata (lightweight)

```bash
curl http://localhost:3000/api/plays
```

Response:

```json
{
  "plays": [
    {
      "id": "romeo-and-juliet",
      "title": "Romeo and Juliet",
      "author": "William Shakespeare",
      "genre": "Tragedy",
      "year": 1597,
      "createdAt": "2024-11-30T...",
      "updatedAt": "2024-11-30T...",
      "characterCount": 12,
      "actCount": 5,
      "lineCount": 2456
    }
  ]
}
```

With statistics:

```bash
curl http://localhost:3000/api/plays?stats=true
```

### GET /api/plays/[id]

Get full play data by ID

```bash
curl http://localhost:3000/api/plays/romeo-and-juliet
```

Returns complete Playbook object with all acts, scenes, and lines.

### DELETE /api/plays/[id]

Delete a play

```bash
curl -X DELETE http://localhost:3000/api/plays/romeo-and-juliet
```

## Database Functions

### Core Operations

```typescript
import {
  savePlay,
  getPlayById,
  getAllPlays,
  deletePlay,
} from "@/lib/db/plays-db";

// Save or update a play
await savePlay(playbookData);

// Retrieve a play
const play = await getPlayById("romeo-and-juliet");

// List all plays (metadata only)
const plays = await getAllPlays();

// Delete a play
await deletePlay("romeo-and-juliet");
```

### Utility Functions

```typescript
// Search plays
const results = await searchPlays("shakespeare");

// Get database statistics
const stats = await getDbStats();
// Returns: { totalPlays, totalCharacters, totalLines, lastUpdated }

// Check if play exists
const exists = await playExists("hamlet");
```

## Data Flow

```
PDF/DOCX Upload
    ↓
Text Extraction
    ↓
LLM Parsing (streaming)
    ↓
Schema Validation
    ↓
[NEW] Save to Database ✨
    ↓
Return to Client
```

## Storage Format

### Index File (\_index.json)

```json
{
  "plays": [
    {
      "id": "play-id",
      "title": "...",
      "author": "...",
      "genre": "...",
      "year": 1597,
      "createdAt": "ISO timestamp",
      "updatedAt": "ISO timestamp",
      "characterCount": 12,
      "actCount": 5,
      "lineCount": 2456
    }
  ],
  "lastUpdated": "ISO timestamp"
}
```

### Play Files (\*.json)

Full Playbook schema including all acts, scenes, lines, and metadata.

## Benefits

✅ **No external database required** - Simple filesystem-based storage
✅ **Automatic backups** - Easy to backup with standard file tools
✅ **Version control friendly** - Can track changes in git (if desired)
✅ **Fast reads** - Index file enables efficient metadata queries
✅ **Portable** - Copy the data directory to move the entire database
✅ **Debuggable** - Human-readable JSON files

## Migration from SessionStorage

The existing `play-storage.ts` (sessionStorage-based) remains for client-side session state (current character, line position, practice stats). The new file-based database handles persistent play data storage on the server.

## Future Enhancements

- [ ] Full-text search across play content
- [ ] Backup/restore functionality
- [ ] Export plays to various formats (PDF, DOCX, HTML)
- [ ] Play versioning (track edits over time)
- [ ] User-specific play collections
- [ ] Performance metrics and analytics
