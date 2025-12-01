# 🎭 Theatre Play Buddy

A Next.js web application designed to help actors rehearse and memorize their lines through an interactive practice mode.

## ✨ Features

- **📖 Play Import & Management** - Import and store theatre plays in a structured format
  - **🤖 LLM-Powered Parser** - Automatically parse PDF, DOCX, or TXT play scripts using AI
  - **📊 Real-time Progress** - Watch as characters, acts, and scenes are extracted
  - **✅ Multi-character Support** - Handles simultaneous dialogue and stage directions
  - **🎨 Format Preservation** - Maintains structural indentation for verse and poetry
- **🎯 Character Selection** - Choose your character and focus on your lines
- **📝 Practice Mode** - Guided rehearsal experience that:
  - Displays other characters' lines and stage directions
  - Pauses at your character's lines for practice
  - Tracks progress as you mark lines as memorized
- **📊 Progress Tracking** - Monitor your memorization progress per scene and character
- **🔄 Resume Practice** - Continue from where you left off in any scene
- **🌍 Multi-language Support** - Works with plays in any language (no regex fallback)

## 🚀 Getting Started

### Quick Setup (Recommended)

For the fastest setup with Docker:

```bash
# Clone and setup
git clone https://github.com/yourusername/theatre-play-buddy.git
cd theatre-play-buddy

# Run automated setup script
./setup.sh

# Edit .env.local and add your API key
# Then start the dev server
npm run dev
```

The setup script will:

1. Create `.env.local` from template
2. Start PostgreSQL with Docker Compose
3. Install dependencies
4. Generate Prisma Client
5. Run database migrations

### Manual Setup

If you prefer manual setup or don't use Docker:

### Prerequisites

- Node.js 20.x or higher
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/theatre-play-buddy.git
cd theatre-play-buddy
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables (create `.env.local` in the project root):

```bash
# LLM API Key (choose one)
ANTHROPIC_API_KEY="sk-ant-..."  # Recommended
# OR
OPENAI_API_KEY="sk-..."

# PostgreSQL Database (required for persistence)
DATABASE_URL="postgresql://username:password@localhost:5432/theatre_play_buddy?schema=public"
```

**Getting API Keys**:

- **Anthropic Claude** (recommended): https://console.anthropic.com/
- **OpenAI GPT-4**: https://platform.openai.com/api-keys

**Setting up PostgreSQL Database**:

Option 1 - Docker Compose (Easiest):

```bash
# Start PostgreSQL with docker-compose
docker-compose up -d

# Database will be available at:
# DATABASE_URL="postgresql://theatre:theatre123@localhost:5432/theatre_play_buddy?schema=public"
```

Option 2 - Docker CLI:

```bash
# Run PostgreSQL in Docker
docker run --name theatre-postgres \
  -e POSTGRES_USER=theatre \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=theatre_play_buddy \
  -p 5432:5432 \
  -d postgres:16

# Update DATABASE_URL in .env.local
DATABASE_URL="postgresql://theatre:your_password@localhost:5432/theatre_play_buddy?schema=public"
```

Option 3 - Use existing PostgreSQL installation:

```bash
# If PostgreSQL is installed locally
createdb theatre_play_buddy

# OR if using existing Docker container
docker exec -it theatre-postgres createdb -U theatre theatre_play_buddy

# Update DATABASE_URL in .env.local with your credentials
```

Option 4 - Use a cloud PostgreSQL provider (Neon, Supabase, Railway, etc.):

```bash
# Copy connection string from your provider and set in .env.local
DATABASE_URL="postgresql://user:pass@provider.host:5432/db?sslmode=require"
```

4. Initialize the database schema:

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view your data
npx prisma studio
```

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Importing Your First Play

1. Navigate to the **Import** page from the home screen
2. Upload a play script in PDF, DOCX, or TXT format
3. Click **Parse with AI** and watch the real-time progress
4. Once complete, your play will be available for practice!

**Supported Formats**:

- PDF (text-based, not scanned images)
- DOCX (Microsoft Word)
- TXT (UTF-8 encoded)

**File Limits**:

- Maximum file size: 5MB
- Maximum pages: 500

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

**Database Management:**

- `npm run db:generate` - Generate Prisma Client
- `npm run db:migrate` - Create and run new migration
- `npm run db:push` - Push schema changes (dev only)
- `npm run db:studio` - Open Prisma Studio GUI
- `npm run db:migrate:deploy` - Deploy migrations (production)

**Docker Commands:**

- `docker-compose up -d` - Start PostgreSQL
- `docker-compose down` - Stop PostgreSQL
- `docker-compose logs -f postgres` - View PostgreSQL logs

## 🏗️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **AI/LLM**: Vercel AI SDK with Anthropic Claude or OpenAI GPT-4
- **Validation**: Zod for runtime type safety
- **Document Parsing**: pdf-parse, mammoth (DOCX)
- **Database**: PostgreSQL with Prisma ORM (file-based storage also available)

## 📁 Project Structure

```
src/
├── app/              # Next.js app router pages
│   ├── import/       # Play import functionality
│   ├── play/         # Play viewing and reading
│   └── practice/     # Practice mode and sessions
├── components/       # React components
│   ├── play/         # Play-related components
│   ├── practice/     # Practice mode components
│   └── ui/           # Reusable UI components
├── hooks/            # Custom React hooks
└── lib/              # Utilities and data management
```

## 🎯 Roadmap

- [x] Basic play import and storage
- [x] LLM-powered automatic play parsing (PDF/DOCX/TXT)
- [x] Real-time parsing progress with streaming
- [x] Multi-character dialogue support
- [x] Stage direction attribution
- [x] Format preservation (indentation, verse spacing)
- [x] Character selection
- [x] Practice mode UI (UI-only, no audio)
- [x] Scene-level progress tracking
- [ ] Audio-based practice with speech recognition
- [ ] Manual play editing and correction
- [ ] Batch import multiple plays
- [ ] Export/share progress reports

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For questions or issues, please open an issue on GitHub.
