# Feature Specification: LLM Parsing Performance Optimization

**Feature Branch**: `001-llm-perf-optimization`  
**Created**: December 1, 2025  
**Status**: Draft  
**Input**: User description: "Improve LLM parsing performance to reduce 100-page play processing time from 10 minutes"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Fast Initial Feedback (Priority: P1)

Theater practitioners uploading a 100-page play receive meaningful parsing progress within the first 30 seconds, allowing them to verify the upload is working correctly and estimate completion time accurately.

**Why this priority**: Users need immediate feedback to build trust in the system. Without early progress indicators, users may abandon uploads thinking the system has failed. This is the minimum viable improvement that delivers measurable value.

**Independent Test**: Upload a 100-page play script. Verify that within 30 seconds, the progress indicator shows at least 5% completion with specific details (e.g., "Parsed 2/40 pages, found 5 characters"). Success metric: First progress update appears in <30 seconds.

**Acceptance Scenarios**:

1. **Given** a user uploads a 100-page play (approximately 50,000 characters), **When** the parsing begins, **Then** the first progress update appears within 30 seconds showing percentage complete, pages processed, and characters discovered
2. **Given** parsing has started, **When** the user views the progress indicator, **Then** the estimated time remaining updates every 10-15 seconds based on actual processing speed
3. **Given** the system is processing a large play, **When** an error occurs in chunk processing, **Then** the error message specifies which page/section failed and allows retry of that specific chunk

---

### User Story 2 - Reduced Total Processing Time (Priority: P2)

Theater practitioners can upload and fully parse a 100-page play in under 3 minutes (reduced from current 10 minutes), enabling rapid iteration on script uploads and corrections.

**Why this priority**: While initial feedback (P1) addresses user anxiety, actual processing time impacts workflow efficiency. This delivers the core performance improvement requested by users.

**Independent Test**: Upload a 100-page play script and measure total time from upload to completion. Verify completion time is under 3 minutes. Success metric: 70% reduction in processing time (10 min → 3 min).

**Acceptance Scenarios**:

1. **Given** a user uploads a 100-page play, **When** parsing completes, **Then** the total processing time is under 3 minutes
2. **Given** parsing is in progress, **When** the system processes each chunk, **Then** average chunk processing time is under 3 seconds
3. **Given** a play with complex formatting (mixed dialogue, stage directions, multiple characters per line), **When** parsing completes, **Then** processing time remains under 3 minutes and accuracy is maintained at 95%+

---

### User Story 3 - Transparent Progress Visibility (Priority: P3)

Users can see detailed parsing progress including current act/scene being processed, characters discovered so far, and line counts, building confidence that the parser is working correctly and understanding their script.

**Why this priority**: Enhanced visibility improves user experience and trust, but the feature still works with basic progress percentages (delivered in P1). This is a UX enhancement rather than core functionality.

**Independent Test**: Upload a play and observe the progress UI. Verify display shows: current chunk number, act/scene being processed, character count, and line count. Success metric: All four data points visible and updating in real-time.

**Acceptance Scenarios**:

1. **Given** a user uploads a multi-act play, **When** parsing progresses through acts, **Then** the UI displays "Currently parsing: Act 2, Scene 3" with real-time updates
2. **Given** parsing discovers new characters, **When** a character is identified, **Then** the character count increments and the character name is displayed in a "Discovered Characters" list
3. **Given** parsing is processing dialogue-heavy sections, **When** lines are processed, **Then** the UI shows "1,247 lines processed" with updates every chunk
4. **Given** parsing encounters stage directions or multi-character lines, **When** these elements are processed, **Then** the UI indicates "Processing complex formatting" without slowing progress updates

---

### Edge Cases

- What happens when a chunk fails to parse due to LLM timeout? System should retry the specific chunk (max 3 attempts) and report which chunk failed if all retries are exhausted
- How does the system handle extremely long acts (10,000+ lines in one act)? Chunk splitting should remain consistent regardless of act structure, avoiding memory overflow
- What if parsing is interrupted (user closes tab, network failure)? System should cache successfully parsed chunks in localStorage and allow resume from last completed chunk
- How does the system handle plays with unusual formatting (poetry, songs, mixed languages)? Parser should maintain accuracy above 90% regardless of formatting style, with clear error messages for unparseable sections
- What happens when character identification is ambiguous (multiple characters with similar names)? System should flag ambiguous characters for user review post-parsing rather than blocking the entire parse

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST reduce total parsing time for 100-page plays from 10 minutes to under 3 minutes (70% improvement)
- **FR-002**: System MUST provide first progress update within 30 seconds of parsing initiation
- **FR-003**: System MUST update progress indicators every 10-15 seconds during parsing
- **FR-004**: System MUST process individual chunks in under 3 seconds average time
- **FR-005**: System MUST display real-time parsing details including chunk number, act/scene location, character count, and line count
- **FR-006**: System MUST maintain parsing accuracy at 95% or higher for character attribution, act/scene structure, and dialogue extraction
- **FR-007**: System MUST retry failed chunks up to 3 times before reporting failure
- **FR-008**: System MUST provide specific error messages indicating which page/chunk failed when parsing errors occur
- **FR-009**: System MUST cache successfully parsed chunks to enable resume on interruption
- **FR-010**: System MUST support chunk sizes optimized for the selected parser's processing limits
- **FR-011**: System MUST automatically adjust chunk sizes based on text complexity and parser capability
- **FR-012**: System MUST parallelize chunk processing when possible without sacrificing context continuity
- **FR-013**: System MUST use appropriate parsing strategies that balance speed and accuracy requirements
- **FR-014**: System MUST provide incremental progress rather than waiting for full chunk completion
- **FR-015**: System MUST pre-process play text to identify act/scene boundaries and use these as natural chunk split points

### Key Entities

- **ParsingProgress**: Represents real-time parsing state including chunk number (current/total), percentage complete, current act/scene, characters discovered count, lines processed count, estimated time remaining, last update timestamp
- **ChunkResult**: Represents the outcome of parsing a single chunk including chunk ID, success/failure status, retry count, characters discovered in chunk, lines parsed in chunk, processing duration, error message if failed
- **ParseCache**: Represents cached parsing state for resume capability including play ID, successfully parsed chunks, last chunk processed, total chunks, timestamp, context snapshot (characters, acts, scenes)

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users receive first parsing progress update in under 30 seconds for 100-page plays (measurable via timestamp tracking)
- **SC-002**: Total parsing time for 100-page plays is reduced from 10 minutes to under 3 minutes (70% reduction, measurable via start/end timestamps)
- **SC-003**: Average chunk processing time is under 3 seconds (measurable via per-chunk timing metrics)
- **SC-004**: Progress updates occur at minimum every 15 seconds during parsing (measurable via UI update frequency tracking)
- **SC-005**: Parsing accuracy maintains 95% or higher for character attribution and structural elements (measurable via test suite with known-good play scripts)
- **SC-006**: Users can identify specific failed chunks and retry them without re-parsing the entire play (measurable via error handling workflow tests)
- **SC-007**: System successfully resumes parsing from interruption point for 90% of interrupted sessions (measurable via cache recovery success rate)
- **SC-008**: User satisfaction with parsing speed increases from current baseline to 80% positive feedback (measurable via post-upload survey)

## State-of-the-Art Research _(performance optimization)_

### Prompt Caching Strategies

**Source**: Anthropic Cookbook - Speculative Prompt Caching

**Key Findings**:

- **Speculative Caching**: Warm the cache proactively by sampling a single token from the context while user is typing/uploading
- **Performance Gains**: 40-60% reduction in Time To First Token (TTFT) when cache is warmed before actual query
- **Implementation Pattern**:
  1. Start cache warming in background during file upload/processing
  2. Use `max_tokens: 1` to sample one token from large context with caching enabled
  3. Reuse exact same message structure for actual parsing to ensure cache hit
  4. Monitor cache read/write token usage in `providerMetadata`

**Application to Play Parsing**:

```typescript
// While file is uploading, warm cache with play context
const cacheWarmTask = asyncio.create_task(
  anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1,
    messages: [
      {
        role: "assistant",
        content: [
          { type: "text", text: "You are an expert play parser." },
          { type: "text", text: playTextExtract },
        ],
        // Cache point marks this content for reuse
        providerOptions: { anthropic: { cachePoint: { type: "default" } } },
      },
    ],
  })
);

// When parsing starts, cache is already warm - reduces TTFT by ~50%
```

**Estimated Impact**: 2-3 minute reduction in total parsing time for 100-page plays

---

### Batch Processing API

**Source**: Anthropic SDK TypeScript - Message Batches API

**Key Findings**:

- **Batch API**: Process multiple independent requests in a single API call
- **Cost Savings**: 50% reduction in API costs for batch requests vs individual calls
- **Processing Time**: Batches complete within 24 hours (typically faster for small batches)
- **Use Cases**: Perfect for chunked parsing where chunks are independent

**Implementation Pattern**:

```typescript
// Create batch with all chunks at once
const batch = await anthropic.messages.batches.create({
  requests: chunks.map((chunk, idx) => ({
    custom_id: `chunk-${idx}`,
    params: {
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Parse this play excerpt: ${chunk.text}`,
        },
      ],
    },
  })),
});

// Poll for results
const results = await anthropic.messages.batches.results(batch.id);
for await (const entry of results) {
  if (entry.result.type === "succeeded") {
    processChunk(entry.result.message.content);
  }
}
```

**Trade-offs**:

- ❌ Not suitable for real-time progress updates (batch processes asynchronously)
- ❌ 24-hour completion window may be too slow for user experience
- ✅ Ideal for background re-processing or bulk imports
- ✅ Significant cost savings for large-scale operations

**Recommendation**: Use batch API for background optimization passes, not initial user-facing parsing

---

### Streaming Optimization with Vercel AI SDK

**Source**: Vercel AI SDK - Stream Text Performance Patterns

**Key Findings**:

- **Incremental Streaming**: Process chunks as they arrive using `onChunk` callback
- **Memoized Rendering**: Cache unchanged content blocks to prevent redundant re-renders
- **Abort Handling**: Clean up partial results and persist progress on stream abort

**Implementation Patterns**:

#### 1. Chunk-Level Processing

```typescript
const result = streamText({
  model: anthropic("claude-sonnet-4-5"),
  prompt: chunkPrompt,
  onChunk({ chunk }) {
    if (chunk.type === "text") {
      // Process incrementally without waiting for completion
      partialResults.push(chunk.text);
      updateProgress({ currentChunk: chunkIndex, partialText: chunk.text });
    }
  },
});
```

#### 2. Memoized Content Rendering

```typescript
// Parse streamed markdown into blocks for efficient re-rendering
function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}

const MemoizedBlock = memo(
  ({ content }: { content: string }) => {
    return <ReactMarkdown>{content}</ReactMarkdown>;
  },
  (prev, next) => prev.content === next.content
);

// Only changed blocks re-render during streaming
export const MemoizedMarkdown = memo(({ content, id }) => {
  const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);
  return blocks.map((block, index) => (
    <MemoizedBlock content={block} key={`${id}-${index}`} />
  ));
});
```

#### 3. Abort Signal Handling

```typescript
const result = streamText({
  model: anthropic("claude-sonnet-4-5"),
  prompt: chunkPrompt,
  abortSignal: controller.signal,
  onAbort: async ({ steps }) => {
    // Persist partial results when user cancels
    await savePartialParse({
      playbookId,
      completedChunks: steps.length,
      partialData: steps,
    });
    await logAbortEvent({ reason: "user_cancelled", progress: steps.length });
  },
});
```

**Estimated Impact**:

- 30-40% reduction in perceived latency (users see progress immediately)
- 20-30% CPU reduction from memoized rendering
- Graceful degradation on interruption

---

### Parallel Chunk Processing

**Source**: Vercel AI SDK - Multi-Stream Handling

**Key Findings**:

- **Concurrent Requests**: Process multiple chunks simultaneously with rate limiting
- **Context Continuity**: Use shared character context across parallel streams
- **Error Isolation**: Failed chunks don't block entire parse

**Implementation Pattern**:

```typescript
// Process 3 chunks in parallel with rate limiting
const PARALLEL_LIMIT = 3;
const chunkQueue = [...allChunks];
const results = [];

async function processChunkBatch() {
  const batch = chunkQueue.splice(0, PARALLEL_LIMIT);
  const promises = batch.map(async (chunk) => {
    try {
      const result = await streamText({
        model: anthropic("claude-sonnet-4-5"),
        prompt: buildChunkPrompt(chunk, sharedCharacterContext),
      });
      return { success: true, data: await result.text };
    } catch (error) {
      return { success: false, error, chunkId: chunk.id };
    }
  });

  results.push(...(await Promise.all(promises)));

  if (chunkQueue.length > 0) {
    await processChunkBatch(); // Process next batch
  }
}

await processChunkBatch();
```

**Trade-offs**:

- ✅ 50-70% reduction in total processing time (3 chunks in parallel)
- ❌ Higher memory usage (3x concurrent streams)
- ❌ Risk of rate limiting if PARALLEL_LIMIT too high
- ✅ Better error isolation (one failed chunk doesn't fail all)

**Recommendation**: Use parallel processing with PARALLEL_LIMIT=3 for optimal speed/reliability balance

---

### Smart Chunk Splitting Strategies

**Source**: OpenAI/Anthropic API Best Practices

**Key Findings**:

- **Natural Boundaries**: Split on act/scene boundaries rather than character count
- **Context Overlap**: Include 200-500 tokens of overlap between chunks for continuity
- **Adaptive Sizing**: Adjust chunk size based on text complexity (dialogue-heavy vs stage directions)

**Implementation Algorithm**:

```typescript
function smartChunkSplit(playText: string): Chunk[] {
  // 1. Identify act/scene boundaries using regex
  const boundaries = findStructuralBoundaries(playText);

  // 2. Group scenes into chunks targeting 8,000-10,000 tokens
  const chunks = [];
  let currentChunk = { text: "", tokenCount: 0, scenes: [] };

  for (const scene of boundaries.scenes) {
    const sceneTokens = estimateTokenCount(scene.text);

    if (currentChunk.tokenCount + sceneTokens > 10000) {
      // Chunk is full, start new one with overlap
      const overlap = getLastNTokens(currentChunk.text, 500);
      chunks.push(currentChunk);
      currentChunk = {
        text: overlap + scene.text,
        tokenCount: 500 + sceneTokens,
        scenes: [scene],
      };
    } else {
      currentChunk.text += scene.text;
      currentChunk.tokenCount += sceneTokens;
      currentChunk.scenes.push(scene);
    }
  }

  if (currentChunk.scenes.length > 0) chunks.push(currentChunk);
  return chunks;
}
```

**Estimated Impact**:

- 25-30% improvement in parsing accuracy (preserves context at boundaries)
- 15-20% reduction in total chunks (better alignment with natural structure)

---

### Performance Metrics & Monitoring

**Source**: Vercel AI SDK - Provider Metadata

**Key Metrics to Track**:

```typescript
interface ParsingMetrics {
  // Cache performance
  cacheReadTokens: number;
  cacheWriteTokens: number;
  cacheHitRate: number; // Read / (Read + Write)

  // Timing metrics
  ttft: number; // Time to first token
  totalParseTime: number;
  avgChunkTime: number;

  // Throughput
  tokensPerSecond: number;
  chunksPerMinute: number;

  // Error tracking
  retryCount: number;
  failedChunks: number;
  errorRate: number; // Failed / Total
}

// Collect from providerMetadata
const metrics = {
  cacheReadTokens:
    (await result.providerMetadata)?.anthropic?.usage?.cacheReadInputTokens ||
    0,
  cacheWriteTokens:
    (await result.providerMetadata)?.anthropic?.usage?.cacheWriteInputTokens ||
    0,
  // ... other metrics
};
```

---

### Recommended Implementation Strategy

**Phase 1: Quick Wins (Week 1)**

1. ✅ Implement speculative prompt caching - 50% TTFT reduction
2. ✅ Add streaming progress with `onChunk` callbacks - immediate user feedback
3. ✅ Smart chunk splitting on act/scene boundaries - 25% accuracy improvement

**Phase 2: Parallel Processing (Week 2)**

1. ✅ Parallel chunk processing with PARALLEL_LIMIT=3 - 60% total time reduction
2. ✅ Abort handling and partial result persistence
3. ✅ Memoized rendering for UI performance

**Phase 3: Advanced Optimization (Week 3)**

1. ✅ Cache hit rate monitoring and optimization
2. ✅ Adaptive chunk sizing based on complexity
3. ✅ Background batch API for re-processing/refinement

**Expected Total Impact**:

- **TTFT**: 30 seconds → 10 seconds (67% improvement)
- **Total Time**: 10 minutes → 2.5 minutes (75% improvement)
- **Accuracy**: Maintained at 95%+
- **Cost**: 30-40% reduction via caching and batch API

---

## Technical Approach _(implementation details)_
