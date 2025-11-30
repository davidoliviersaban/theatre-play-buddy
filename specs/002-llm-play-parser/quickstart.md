# Quickstart: LLM Play Parser Development

**Date**: November 30, 2025  
**Phase**: 1 (Design & Contracts)  
**Feature**: LLM-powered play script parsing with streaming progress

## Overview

This guide helps you set up your local development environment for implementing and testing the LLM play parser feature.

---

## Prerequisites

- **Node.js**: v18.17.0 or later
- **npm**: v9.0.0 or later
- **PostgreSQL**: v14 or later (with pgvector extension)
- **Docker**: For local PostgreSQL (optional but recommended)
- **LLM API Key**: OpenAI or Anthropic account

---

## Environment Setup

### 1. Install Dependencies

```bash
cd /path/to/theatre-play-buddy

# Install new packages for LLM parsing
npm install @ai-sdk/openai @ai-sdk/anthropic ai zod pdf-parse mammoth
```

**Package Purposes**:

- `@ai-sdk/openai`: OpenAI provider for Vercel AI SDK
- `@ai-sdk/anthropic`: Anthropic provider for Vercel AI SDK
- `ai`: Vercel AI SDK core (`generateObject`, `streamObject`)
- `zod`: Runtime schema validation
- `pdf-parse`: PDF text extraction
- `mammoth`: DOCX text extraction

### 2. Environment Variables

Create or update `.env.local`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/theatre_play_buddy"

# LLM Providers (choose one or both)
# Anthropic Claude (recommended)
ANTHROPIC_API_KEY="sk-ant-..."

# OpenAI (fallback option)
OPENAI_API_KEY="sk-..."

# File Upload Settings
MAX_FILE_SIZE_MB=5
MAX_PAGE_COUNT=500
UPLOAD_DIR="/tmp/theatre-uploads"

# Development
NODE_ENV="development"
```

**Getting API Keys**:

- **Anthropic**: https://console.anthropic.com/
- **OpenAI**: https://platform.openai.com/api-keys

### 3. Database Setup

If Playbook schema needs updates for multi-character support:

```bash
# Generate Prisma migration (if schema changes needed)
npx prisma migrate dev --name add-multi-character-support

# Apply migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

**Prisma Schema Changes** (if needed):

```prisma
// prisma/schema.prisma
model Line {
  id            String   @id @default(uuid())
  sceneId       String
  scene         Scene    @relation(fields: [sceneId], references: [id])

  // Updated: Support multi-character attribution
  characterIds  String[] // Array of character UUIDs

  text          String   @db.Text
  type          LineType
  masteryLevel  MasteryLevel?
  rehearsalCount Int?    @default(0)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum LineType {
  dialogue
  stage_direction
}
```

**Note**: Current schema uses `characterId String?` - may need migration to `characterIds String[]` for multi-character support.

---

## Development Workflow

### 1. Start Development Server

```bash
npm run dev
```

Server runs at `http://localhost:3000`

### 2. File Structure (New Components)

Create the following structure:

```bash
# Create directories
mkdir -p src/lib/parse
mkdir -p src/components/import
mkdir -p src/app/import/api/upload
mkdir -p src/app/import/api/parse
mkdir -p tests/parse

# Verify structure
tree src/lib/parse src/components/import src/app/import/api
```

Expected output:

```
src/lib/parse/
├── extractors.ts      # NEW: PDF/DOCX/TXT text extraction
├── llm-parser.ts      # NEW: Vercel AI SDK integration
├── schemas.ts         # NEW: Zod schemas
├── validation.ts      # NEW: Post-parse validation
└── multi-character.ts # NEW: Multi-character attribution logic

src/components/import/
├── file-upload.tsx         # NEW: Drag-drop upload UI
├── parse-progress.tsx      # NEW: SSE progress display
└── parse-error-display.tsx # NEW: Error handling UI

src/app/import/api/
├── upload/
│   └── route.ts       # NEW: File upload endpoint
└── parse/
    └── route.ts       # NEW: Streaming parse endpoint (SSE)
```

### 3. Testing LLM Integration

#### Test Anthropic Connection

```bash
# Create test script: test-llm.ts
cat > test-llm.ts << 'EOF'
import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';

const TestSchema = z.object({
  message: z.string(),
});

async function testAnthropic() {
  const result = await generateObject({
    model: anthropic('claude-3-5-sonnet-20241022'),
    schema: TestSchema,
    prompt: 'Say hello',
  });

  console.log('Anthropic response:', result.object);
}

testAnthropic();
EOF

# Run test
npx tsx test-llm.ts
```

Expected output:

```
Anthropic response: { message: 'Hello! How can I help you today?' }
```

#### Test PDF Extraction

```bash
# Create test script: test-pdf.ts
cat > test-pdf.ts << 'EOF'
import pdf from 'pdf-parse';
import { readFile } from 'fs/promises';

async function testPDF() {
  const buffer = await readFile('./test-files/sample-play.pdf');
  const data = await pdf(buffer);

  console.log('Pages:', data.numpages);
  console.log('First 200 chars:', data.text.slice(0, 200));
}

testPDF();
EOF

# Run test
npx tsx test-pdf.ts
```

### 4. Test File Samples

Download test play scripts:

```bash
mkdir -p test-files

# Public domain plays for testing
curl -o test-files/hamlet.txt "https://www.gutenberg.org/files/1524/1524-0.txt"
curl -o test-files/romeo-juliet.txt "https://www.gutenberg.org/files/1513/1513-0.txt"

# Or create minimal test file
cat > test-files/test-play.txt << 'EOF'
The Test Play
by John Doe

Characters:
ALICE - A curious character
BOB - Alice's friend

ACT I

SCENE 1: A park

ALICE: What a beautiful day!
BOB: Indeed it is.
[They sit on a bench]
ALICE: Shall we have a picnic?
BOB: Wonderful idea!

END
EOF
```

---

## API Testing

### Upload Endpoint Test

```bash
# Upload test file
curl -X POST http://localhost:3000/api/import/upload \
  -F "file=@test-files/test-play.txt" \
  | jq

# Expected response:
# {
#   "uploadId": "550e8400-...",
#   "filename": "test-play.txt",
#   "mimeType": "text/plain",
#   "size": 234
# }
```

### Parse Endpoint Test (SSE Stream)

```bash
# Start parse with SSE stream
curl -X POST http://localhost:3000/api/import/parse \
  -H "Content-Type: application/json" \
  -d '{"uploadId":"<UPLOAD_ID>","llmProvider":"anthropic"}' \
  --no-buffer

# Expected output (streaming):
# data: {"event":"progress","percent":10,"message":"Extracting text..."}
#
# data: {"event":"character_found","character":{"name":"ALICE"}}
#
# data: {"event":"complete","playbookId":"...","title":"The Test Play"}
```

### Client-Side SSE Test

```javascript
// In browser console or React component
const eventSource = new EventSource(
  "/api/import/parse?uploadId=<UPLOAD_ID>&provider=anthropic"
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(`[${data.event}] ${data.percent}% - ${data.message}`);

  if (data.event === "complete") {
    console.log("Parsing complete!", data);
    eventSource.close();
  }
  if (data.event === 'unsupported_speaker') {
    // Telemetry: crowd or unknown speaker detected (currently unsupported)
    console.warn('Unsupported speaker detected:', data.kind, data.sample);
};

eventSource.onerror = (error) => {
  console.error("SSE error:", error);
  eventSource.close();
};
```

---

## Debugging Tips

### Enable Verbose Logging

```typescript
// src/lib/parse/llm-parser.ts
export const DEBUG = process.env.DEBUG_LLM === "true";

if (DEBUG) {
  console.log("LLM Prompt:", prompt);
  console.log("LLM Response:", response);
}
```

```bash
# Run with debug logging
DEBUG_LLM=true npm run dev
```

### Inspect Zod Validation Errors

```typescript
import { PlaybookSchema } from "@/lib/parse/schemas";

const result = PlaybookSchema.safeParse(data);

if (!result.success) {
  console.error("Validation failed:");
  result.error.errors.forEach((err) => {
    console.error(`  ${err.path.join(".")}: ${err.message}`);
  });
}
```

### Test Individual Extraction Functions

```typescript
// test-extractors.ts
import { extractText } from "@/lib/parse/extractors";
import { readFile } from "fs/promises";

const buffer = await readFile("./test-files/hamlet.pdf");
const text = await extractText(buffer, "application/pdf");

console.log(`Extracted ${text.length} characters`);
console.log("First 500 chars:", text.slice(0, 500));
```

---

## Common Issues

### Issue: "API key not found"

**Solution**: Verify environment variable is set:

```bash
echo $ANTHROPIC_API_KEY  # Should print your key
# If empty, check .env.local and restart dev server
```

### Issue: "pdf-parse fails to extract text"

**Cause**: Scanned PDFs (images) without OCR text layer

**Solution**:

1. Check page count vs character count ratio
2. If ratio suggests scanned PDF, return user-friendly error
3. Suggest user upload text version

```typescript
const MIN_CHARS_PER_PAGE = 100;
if (data.text.length / data.numpages < MIN_CHARS_PER_PAGE) {
  throw new Error(
    "This appears to be a scanned PDF. Please upload a text-based version."
  );
}
```

### Issue: "Zod validation fails for dialogue without characterId"

**Cause**: LLM didn't attribute some dialogue lines

**Solution**: Post-processing cleanup:

```typescript
lines.forEach((line) => {
  if (line.type === "dialogue" && !line.characterId) {
    // Fallback: convert to stage direction
    line.type = "stage_direction";
  }
});
```

### Issue: "SSE connection drops"

**Cause**: Vercel serverless timeout (30s default)

**Solution**: For large files, implement chunked parsing:

1. Parse metadata first (quick)
2. Parse each act separately
3. Send progress updates between acts

---

## Performance Benchmarks

**Target**: Parse standard 2-3 act play in <3 minutes (SC-001)

**Measurement Script**:

```typescript
// benchmark-parse.ts
import { parsePlay } from "@/lib/parse/llm-parser";
import { readFile } from "fs/promises";

async function benchmark() {
  const start = Date.now();

  const buffer = await readFile("./test-files/romeo-juliet.pdf");
  const text = await extractText(buffer, "application/pdf");

  const playbook = await parsePlay(text, "anthropic");

  const elapsed = (Date.now() - start) / 1000;
  console.log(`Parsed "${playbook.title}" in ${elapsed}s`);
  console.log(`  Acts: ${playbook.acts.length}`);
  console.log(
    `  Scenes: ${playbook.acts.reduce((sum, a) => sum + a.scenes.length, 0)}`
  );
  console.log(
    `  Lines: ${playbook.acts.reduce(
      (sum, a) => sum + a.scenes.reduce((s, sc) => s + sc.lines.length, 0),
      0
    )}`
  );
}

benchmark();
```

**Expected Output**:

```
Parsed "Romeo and Juliet" in 127s
  Acts: 5
  Scenes: 24
  Lines: 2834
```

---

## Next Steps

1. ✅ Environment configured
2. ✅ Dependencies installed
3. ✅ API keys set up
4. ⏳ Implement extractors (`src/lib/parse/extractors.ts`)
5. ⏳ Implement Zod schemas (`src/lib/parse/schemas.ts`)
6. ⏳ Implement LLM parser (`src/lib/parse/llm-parser.ts`)
7. ⏳ Implement API routes (`src/app/import/api/*/route.ts`)
8. ⏳ Implement UI components (`src/components/import/*`)
9. ⏳ Write tests (`tests/parse/*`)

**Ready to start implementation!**

For detailed implementation tasks, run: `/speckit.task`
