# LLM Play Parser - Environment Setup

## Required Environment Variables

Create a `.env.local` file in the project root with one of the following API keys:

```bash
# Option 1: Anthropic (recommended)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Option 2: OpenAI (fallback)
OPENAI_API_KEY=your_openai_api_key_here
```

## Getting API Keys

### Anthropic Claude (Recommended)

1. Visit https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys
4. Create a new key and copy it to `.env.local`

### OpenAI (Alternative)

1. Visit https://platform.openai.com/
2. Sign up or log in
3. Navigate to API Keys
4. Create a new key and copy it to `.env.local`

## Testing the Parser

1. Start the dev server:

   ```bash
   npm run dev
   ```

2. Visit http://localhost:3000/import

3. Upload a play script (PDF, DOCX, or TXT)

4. Watch the real-time streaming progress

5. The parsed play will be saved to sessionStorage and available in your library

## Features

- **Real-time streaming**: See characters, acts, and scenes as they're parsed
- **Multi-format support**: PDF, DOCX, TXT
- **Multi-speaker attribution**: Handles simultaneous dialogue
- **Validation**: Zod schema validation ensures data integrity
- **Progress tracking**: Live SSE events for transparency
- **Persistence**: Imported plays saved to sessionStorage

## Next Steps

- Add error recovery UI
- Implement cancellation
- Add unit tests
- Integrate with Prisma for persistent storage
- Add manual correction interface
