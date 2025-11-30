# theatre-play-buddy Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-11-30

## Active Technologies

- TypeScript/JavaScript with Next.js 14+ (App Router) (002-llm-play-parser)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript/JavaScript with Next.js 14+ (App Router): Follow standard conventions

## Recent Changes

- 002-llm-play-parser: Added TypeScript/JavaScript with Next.js 14+ (App Router)

<!-- MANUAL ADDITIONS START -->

## LLM Play Parser (Feature 002)

**New Dependencies**:

- **Vercel AI SDK**: `@ai-sdk/core`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `ai`
  - Use `generateObject` for type-safe LLM responses
  - Use `streamObject` for streaming progress updates
- **Zod**: Runtime schema validation for LLM outputs
  - Define schemas in `src/lib/parse/schemas.ts`
  - Mirror existing Playbook/Character/Act/Scene/Line types
- **pdf-parse**: PDF text extraction (Node.js, server-side only)
- **mammoth**: DOCX text extraction (Node.js, server-side only)

**Architecture Patterns**:

- Multi-stage LLM parsing: metadata → structure → lines
- Server-Sent Events (SSE) for streaming progress via Next.js API routes
- Zod schema validation at each parsing stage
- Multi-character attribution support: use `characterId` for single speaker and `characterIdArray` for multiple speakers

**File Locations**:

- Schemas: `src/lib/parse/schemas.ts`
- LLM integration: `src/lib/parse/llm-parser.ts`
- Extractors: `src/lib/parse/extractors.ts`
- API routes: `src/app/import/api/upload/route.ts`, `src/app/import/api/parse/route.ts`

<!-- MANUAL ADDITIONS END -->
