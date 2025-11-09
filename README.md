# VIBE ROULETTE

**Arcade pairing for tiny code remixes**

A visually unforgettable collaborative coding platform where users pull a Spin Lever to get matched into anonymous co-coding rooms with constraints, a realtime editor, live preview, and **AI-powered code generation**.

## 🎮 Features

- **Interactive Spin Wheel** - Pull the lever to get matched with a coding partner
- **Anonymous or Revealed Mode** - Choose your identity preference
- **Monaco Editor (VS Code Engine)** - Full VS Code editing experience in the browser
  - IntelliSense & auto-completion
  - Multi-cursor editing
  - Bracket matching & colorization
  - Code folding & minimap
  - All VS Code keyboard shortcuts
  - Full syntax highlighting
- **AI-Powered Assistant** - Cursor-inspired AI that generates, explains, and fixes code
  - Choose your provider (OpenAI, Anthropic, or Mock)
  - Use your own API key (no costs to us!)
  - Direct browser-to-API calls
- **Live Preview** - Instant CRT-style preview of your code
- **Creative Constraints** - Random challenges to spark creativity
- **Session Timer** - Timed coding sessions (10, 30, or 60 minutes)
- **Retro Arcade Theme** - Beautiful CRT effects, neon colors, and arcade vibes

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

## 🎨 Design System

### Colors

- `--ink-violet`: #0F0A1F (Deep base)
- `--neon-orange`: #FF6A00 (Primary accent)
- `--mint-glow`: #51FFC4 (Success/active)
- `--orchid-electric`: #B16BFF (Secondary accent)
- `--ticket-cream`: #F7F4E9 (Paper surfaces)

### Typography

- **Display**: Epilogue Black (900)
- **Body/Code**: Victor Mono (400-600)

## 🏗️ Project Structure

```
src/
├── components/       # Reusable UI components
├── pages/           # Main application screens
├── types/           # TypeScript type definitions
├── utils/           # Utility functions and services
└── styles/          # Global styles and design tokens
```

## 🤖 AI Integration

The AI assistant uses a mock service by default. To integrate with a real LLM:

1. Open `src/utils/aiService.ts`
2. Add your API key
3. Uncomment the `callAPI` method
4. Configure your preferred LLM provider (OpenAI, Anthropic, etc.)

## 🔧 Key Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Monaco Editor** - VS Code's editor engine (same as Cursor uses!)
- **Vite** - Build tool
- **Motion** (Framer Motion) - Animations
- **Lucide React** - Icons
- **Tailwind CSS** - Utility-first CSS

## 📝 License

MIT

---

**Built with ❤️ for collaborative coding**

