# Incremental Parsing Implementation

## Problem Statement

Long plays (>20,000 characters) were timing out during LLM parsing because:

1. Single-shot parsing required the entire play to be processed in one request
2. LLM token limits and processing time caused failures on lengthy texts
3. No context retention between chunks led to inconsistent parsing

## Solution

Implemented **incremental parsing with context retention** that processes plays in manageable chunks while maintaining continuity.

### Key Features

1. **Automatic Mode Selection**

   - Plays <20,000 characters: Use existing streaming parser (fast)
   - Plays >20,000 characters: Use incremental parser (reliable)

2. **Context Retention**

   - Characters discovered are tracked and reused across chunks
   - Act/scene structure maintained between chunks
   - Line numbering continues sequentially
   - Unique IDs tracked to prevent duplicates

3. **Chunk Processing**
   - Text split into ~2,500 character chunks
   - Each chunk parsed with context from previous chunks
   - Progress reported after each chunk (real-time UI updates)
   - Results merged incrementally into final playbook

### Architecture

```
┌─────────────────┐
│  Upload Play    │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ Extract Text    │
└────────┬────────┘
         │
         v
┌─────────────────────────────┐
│ Is text > 20,000 chars?     │
└────────┬───────────┬────────┘
         │           │
    YES  │           │  NO
         │           │
         v           v
┌─────────────┐  ┌──────────────┐
│ Incremental │  │  Streaming   │
│   Parser    │  │    Parser    │
│             │  │              │
│ Split→Chunk │  │  Single LLM  │
│  by Chunk   │  │    Stream    │
│             │  │              │
│ Context     │  │              │
│ Retention   │  │              │
└──────┬──────┘  └──────┬───────┘
       │                │
       └────────┬───────┘
                v
       ┌─────────────────┐
       │  Validate &     │
       │  Save to DB     │
       └─────────────────┘
```

### Implementation Files

1. **`src/lib/parse/incremental-parser.ts`** (NEW)

   - Core incremental parsing logic
   - Context management
   - Chunk splitting and merging

2. **`src/app/import/api/parse/route.ts`** (MODIFIED)
   - Added threshold detection
   - Dual-path parsing (streaming vs incremental)
   - Progress reporting for both modes

### Context Structure

```typescript
interface ParsingContext {
  // Metadata
  title?: string;
  author?: string;
  year?: number;
  genre?: string;
  description?: string;

  // Characters discovered so far
  characters: Character[];

  // Current structure state
  acts: Act[];
  currentActId?: string;
  currentSceneId?: string;

  // Last line processed
  lastLineNumber: number;

  // IDs used (for uniqueness)
  usedCharacterIds: Set<string>;
  usedActIds: Set<string>;
  usedSceneIds: Set<string>;
  usedLineIds: Set<string>;
}
```

### How It Works

1. **Chunk Splitting**

   ```typescript
   splitIntoChunks(text, chunkSize: 2500)
   // Splits at line boundaries to preserve context
   ```

2. **Parse with Context**

   ```typescript
   parseChunkWithContext(chunk, context, chunkIndex, totalChunks, provider);
   // LLM receives:
   // - Current chunk text
   // - Known characters from previous chunks
   // - Current act/scene state
   // - Last line number
   // - All IDs used so far
   ```

3. **Merge Results**

   ```typescript
   mergeIntoContext(result, context);
   // - Add new characters
   // - Append to existing acts/scenes or create new ones
   // - Track all new IDs
   // - Maintain line numbering
   ```

4. **Convert to Playbook**
   ```typescript
   contextToPlaybook(context);
   // Final validation and formatting
   ```

### Benefits

✅ **Reliability**: Long plays no longer timeout  
✅ **Progress**: Real-time chunk-by-chunk updates  
✅ **Continuity**: Characters and structure preserved across chunks  
✅ **Scalability**: Can handle plays of any length  
✅ **Backward Compatible**: Short plays use faster streaming parser

### Configuration

The threshold can be adjusted in `route.ts`:

```typescript
const INCREMENTAL_PARSE_THRESHOLD = 20000; // characters
```

Chunk size can be adjusted in the parser call:

```typescript
parsePlayIncrementally(text, llmProvider, chunkSize: 2500)
```

### Testing

1. **Short Play** (<20,000 chars)

   - Uses streaming parser
   - Fast single-pass processing
   - Example: One-act plays

2. **Long Play** (>20,000 chars)
   - Uses incremental parser
   - Progress shows "Processing chunk X/Y"
   - Example: Full-length three-act plays

### Performance

- **Streaming Parser**: ~30-60 seconds for typical play
- **Incremental Parser**: ~2-5 minutes for long play (multiple chunks)
- **UI Responsiveness**: Updates every chunk (~10-15 seconds)

### Future Improvements

- [ ] Adjust chunk size based on LLM provider token limits
- [ ] Implement retry logic for failed chunks
- [ ] Add parallel chunk processing (requires careful context management)
- [ ] Cache parsed chunks for resume on failure
- [ ] Smarter chunk splitting (by act/scene boundaries)

### Example Output

```
Parse Mode: incremental (text length: 146,757)
Processing chunk 1/59: 45 lines, 3 characters
Processing chunk 2/59: 89 lines, 5 characters
Processing chunk 3/59: 134 lines, 7 characters
...
Processing chunk 59/59: 1,247 lines, 15 characters
✅ Complete: "De l'une à l'autre" by Jacky Goupil
```

### Error Handling

- **Chunk Failure**: Error message specifies which chunk failed
- **Validation**: Final playbook validated against schema
- **Context Loss**: Each chunk includes full context summary
- **Timeout**: Longer maxDuration allows completion

## Related Files

- [LLM Parser Integration](./LLM_PARSER_DB_INTEGRATION.md)
- [Database Status](./DATABASE_STATUS.md)
- [Parse Route](./src/app/import/api/parse/route.ts)
- [Incremental Parser](./src/lib/parse/incremental-parser.ts)
