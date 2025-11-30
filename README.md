# 🎭 Theatre Play Buddy

A Next.js web application designed to help actors rehearse and memorize their lines through an interactive practice mode.

## ✨ Features

- **📖 Play Import & Management** - Import and store theatre plays in a structured format
- **🎯 Character Selection** - Choose your character and focus on your lines
- **📝 Practice Mode** - Guided rehearsal experience that:
  - Displays other characters' lines and stage directions
  - Pauses at your character's lines for practice
  - Tracks progress as you mark lines as memorized
- **📊 Progress Tracking** - Monitor your memorization progress per scene and character
- **🔄 Resume Practice** - Continue from where you left off in any scene
- **🌍 French Language Support** - Initial support for French scripts with UTF-8 characters

## 🚀 Getting Started

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

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 🏗️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React

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
- [x] Character selection
- [x] Practice mode UI (UI-only, no audio)
- [x] Scene-level progress tracking
- [ ] Audio-based practice with speech recognition
- [ ] Multi-language support beyond French
- [ ] Export/share progress reports

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For questions or issues, please open an issue on GitHub.
