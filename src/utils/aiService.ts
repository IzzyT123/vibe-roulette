// AI Service for code generation
// Replace with your preferred LLM API (OpenAI, Anthropic, etc.)

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface CodeGenerationRequest {
  prompt: string;
  context?: string;
  language?: string;
  constraints?: string[];
}

export interface CodeGenerationResponse {
  code: string;
  explanation?: string;
}

class AIService {
  private conversationHistory: AIMessage[] = [];

  private getConfig() {
    const savedConfig = localStorage.getItem('vibeRouletteAPIConfig');
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig);
      } catch (e) {
        console.error('Failed to load API config:', e);
      }
    }
    // Default to mock
    return { provider: 'mock', apiKey: '', model: 'mock-gpt' };
  }

  async generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResponse> {
    const { prompt, context, constraints = [] } = request;
    const config = this.getConfig();
    
    // Build Cursor-style system prompt with conversation awareness
    const systemPrompt = `You are an expert React/TypeScript code generator like Cursor and Bolt.new.

CRITICAL RULES:
1. You are IN A CONVERSATION - refer to previous messages and maintain context
2. If user says "change the colors" or "make it bigger", you MUST modify the existing code shown in context
3. NEVER import external npm packages. Use only React, TypeScript, browser APIs, inline CSS, and components/files you define in this response.
4. For new features: Return MULTIPLE FILES with proper structure:

// File: /src/App.tsx
[complete file content]

// File: /src/components/Button.tsx
[complete file content]

5. For modifications: Return the UPDATED version of existing files
6. Always include ALL necessary files (even if unchanged) when making multi-file changes
7. Use inline styles OR CSS files
8. Make everything interactive and production-ready
9. NO explanations, NO tutorials - just code
10. ${constraints.length > 0 ? `Constraints: ${constraints.join(', ')}` : 'Follow any additional constraints provided by the user exactly.'}

CONVERSATION CONTEXT:
- Remember what you previously generated
- If user asks to modify something, update the existing code
- Maintain the project structure
- Be context-aware across multiple turns

Return complete, working code that builds on previous conversation.`;

    // Build user prompt with full conversation history
    let conversationContext = '';
    if (this.conversationHistory.length > 0) {
      conversationContext = '\n\nPREVIOUS CONVERSATION:\n' + 
        this.conversationHistory.map(msg => 
          `${msg.role.toUpperCase()}: ${msg.content.substring(0, 300)}...`
        ).join('\n');
    }

    const userPrompt = context 
      ? `CURRENT PROJECT:\n${context}\n${conversationContext}\n\nUSER REQUEST: ${prompt}\n\nGenerate code that fulfills this request. If user is asking to modify existing code, return updated version of all affected files.`
      : `${conversationContext}\n\nUSER REQUEST: ${prompt}\n\nGenerate complete code.`;

    // Use real API or mock based on config
    if (config.provider === 'mock' || !config.apiKey) {
      return this.mockGenerateCode(userPrompt);
    } else if (config.provider === 'openai') {
      return this.callOpenAI(systemPrompt, userPrompt, config);
    } else if (config.provider === 'anthropic') {
      return this.callAnthropic(systemPrompt, userPrompt, config);
    }

    return this.mockGenerateCode(userPrompt);
  }

  async chat(message: string, codeContext?: string): Promise<string> {
    const config = this.getConfig();
    this.conversationHistory.push({ role: 'user', content: message });
    
    let response: string;
    
    if (config.provider === 'mock' || !config.apiKey) {
      response = await this.mockChat(message);
    } else if (config.provider === 'openai') {
      response = await this.chatOpenAI(message, codeContext, config);
    } else if (config.provider === 'anthropic') {
      response = await this.chatAnthropic(message, codeContext, config);
    } else {
      response = await this.mockChat(message);
    }
    
    this.conversationHistory.push({ role: 'assistant', content: response });
    
    return response;
  }

  async explainCode(code: string): Promise<string> {
    const prompt = `Explain this code:\n\`\`\`\n${code}\n\`\`\``;
    return this.chat(prompt);
  }

  async improveCode(code: string, instruction: string): Promise<CodeGenerationResponse> {
    const prompt = `${instruction}\n\nCurrent code:\n\`\`\`\n${code}\n\`\`\``;
    return this.generateCode({ prompt, context: code });
  }

  async fixCode(code: string, error?: string): Promise<CodeGenerationResponse> {
    const config = this.getConfig();
    
    // Enhanced system prompt for error fixing with GPT-4o/Claude 3.5 Sonnet intelligence
    const systemPrompt = `You are an expert code fixer using advanced AI capabilities. Your job is to intelligently fix syntax errors, runtime errors, and compilation issues.

CRITICAL RULES:
1. ANALYZE the error message carefully - understand what went wrong and why
2. Fix ALL errors in the code - syntax, missing brackets, incomplete statements, type errors, etc.
3. If multiple files are provided, fix ALL files that have errors - check dependencies between files
4. Return COMPLETE, WORKING code - no placeholders, no incomplete code, no "..." or truncated lines
5. Preserve the original functionality and intent while fixing errors
6. For incomplete code (like "setCount(co..."): Infer the intended logic and complete it correctly
7. For missing brackets/parentheses: Count and balance them properly
8. For type errors: Fix type mismatches, add proper type annotations
9. For import errors: Ensure all imports are correct and available
10. Return MULTIPLE FILES if multiple files were provided:

// File: /src/App.tsx
[fixed complete code]

// File: /src/components/Dashboard.tsx
[fixed complete code]

11. Be intelligent - if you see a pattern like "onClick={() => setCount(co...", complete it as "onClick={() => setCount(count + 1)}"
12. Check for common React patterns and complete them correctly
13. NO explanations - just fixed code
14. Ensure all code is syntactically valid and will compile without errors`;

    const userPrompt = error
      ? `ERROR TO FIX:\n${error}\n\nCODE WITH ERRORS:\n${code}\n\nAnalyze the error carefully. Fix ALL issues in the code. Return complete, working code that compiles and runs without errors. If multiple files are provided, fix all affected files.`
      : `Review and fix all issues in this code:\n${code}\n\nReturn complete, working code that compiles and runs without errors.`;
    
    // Use real API or mock based on config
    if (config.provider === 'mock' || !config.apiKey) {
      return this.mockFixCode(code, error);
    } else if (config.provider === 'openai') {
      return this.callOpenAI(systemPrompt, userPrompt, config);
    } else if (config.provider === 'anthropic') {
      return this.callAnthropic(systemPrompt, userPrompt, config);
    }

    return this.mockFixCode(code, error);
  }

  private async mockFixCode(code: string, error?: string): Promise<CodeGenerationResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple auto-fix for common errors
    let fixed = code;
    
    // Fix incomplete onClick handlers
    fixed = fixed.replace(/onClick=\{\(\) => setCount\(co\.\.\./g, 'onClick={() => setCount(count + 1)}');
    fixed = fixed.replace(/onClick=\{\(\) => setCount\(co/g, 'onClick={() => setCount(count + 1)}');
    
    // Fix missing closing brackets/parentheses
    const openBrackets = (fixed.match(/\{/g) || []).length;
    const closeBrackets = (fixed.match(/\}/g) || []).length;
    const openParens = (fixed.match(/\(/g) || []).length;
    const closeParens = (fixed.match(/\)/g) || []).length;
    
    if (openBrackets > closeBrackets) {
      fixed += '\n'.repeat(openBrackets - closeBrackets).split('').map(() => '}').join('');
    }
    if (openParens > closeParens) {
      fixed += ')'.repeat(openParens - closeParens);
    }
    
    // Fix incomplete strings
    fixed = fixed.replace(/['"`]([^'"`]*)$/gm, (match) => {
      if (!match.endsWith("'") && !match.endsWith('"') && !match.endsWith('`')) {
        return match + (match.startsWith("'") ? "'" : match.startsWith('"') ? '"' : '`');
      }
      return match;
    });
    
    // If error mentions specific issues, try to fix them
    if (error) {
      if (error.includes('Unexpected token') || error.includes('expected')) {
        // Try to complete incomplete statements
        const lines = fixed.split('\n');
        const fixedLines = lines.map((line) => {
          if (line.includes('setCount(co') || line.includes('setCount(co...')) {
            return line.replace(/setCount\(co[^)]*/, 'setCount(count + 1)');
          }
          return line;
        });
        fixed = fixedLines.join('\n');
      }
    }
    
    return {
      code: fixed,
      explanation: error ? `Fixed error: ${error}` : 'Fixed code issues'
    };
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  syncConversationHistory(messages: Array<Pick<AIMessage, 'role' | 'content'>>) {
    this.conversationHistory = messages.map((msg) => ({
      role: msg.role,
      content: msg.content
    }));
  }

  // Parse multi-file response (Bolt-style)
  parseMultiFileResponse(code: string, defaultPath = '/src/App.tsx'): Array<{ path: string; content: string }> | null {
    const normalizedDefault = defaultPath.startsWith('/') ? defaultPath : `/${defaultPath}`;

    // Detect file markers
    const markerRegex = /(?:\/\/\s*File:\s*([^\r\n]+)|```[\w]*:([^\r\n]+))/g;
    const markers = Array.from(code.matchAll(markerRegex));

    if (markers.length === 0) {
      // Look for markdown-style headings
      const mdPattern = /###\s+([^\r\n]+)[\r\n]+```[\w]*[\r\n]+([\s\S]*?)```/g;
      const mdMatches = Array.from(code.matchAll(mdPattern));
      if (mdMatches.length > 1) {
        return mdMatches.map(match => ({
          path: match[1].startsWith('/') ? match[1] : `/${match[1]}`,
          content: match[2].trim()
        }));
      }
      return null;
    }

    const files: Array<{ path: string; content: string }> = [];
    let lastIndex = 0;
    let currentPath: string | null = normalizedDefault;

    for (const marker of markers) {
      const markerIndex = marker.index ?? 0;
      const preContent = code.slice(lastIndex, markerIndex);
      if (preContent.trim().length > 0 && currentPath) {
        files.push({
          path: currentPath.startsWith('/') ? currentPath : `/${currentPath}`,
          content: preContent.trim()
        });
      }

      const rawPath = (marker[1] || marker[2] || '').trim();
      currentPath = rawPath.length > 0 ? (rawPath.startsWith('/') ? rawPath : `/${rawPath}`) : normalizedDefault;
      lastIndex = marker.index! + marker[0].length;
    }

    const remaining = code.slice(lastIndex);
    if (remaining.trim().length > 0 && currentPath) {
      files.push({
        path: currentPath.startsWith('/') ? currentPath : `/${currentPath}`,
        content: remaining.trim()
      });
    }

    return files.length > 1 ? files : null;
  }

  // Mock implementations - Production-quality templates like Cursor/Bolt
  private async mockGenerateCode(prompt: string): Promise<CodeGenerationResponse> {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
    
    let code = '';
    let explanation = '';
    
    const lowerPrompt = prompt.toLowerCase();
    
    // Check if this is a MODIFICATION request (Cursor-style iterative coding)
    const isModification = lowerPrompt.includes('change') || lowerPrompt.includes('update') || 
                           lowerPrompt.includes('modify') || lowerPrompt.includes('make it');
    
    // Extract color if mentioned
    const colorMatch = lowerPrompt.match(/\b(blue|red|green|purple|orange|pink|yellow|cyan)\b/);
    const requestedColor = colorMatch ? colorMatch[1] : null;
    
    if (isModification && requestedColor && prompt.includes('CURRENT PROJECT')) {
      // User is asking to modify existing code colors
      const currentCode = prompt.split('CURRENT PROJECT:')[1]?.split('USER REQUEST:')[0] || '';
      let modifiedCode = currentCode;
      
      // Color mapping
      const colorMap: Record<string, string> = {
        blue: '#0066FF',
        red: '#FF0033',
        green: '#00CC66',
        purple: '#9933FF',
        orange: '#FF6600',
        pink: '#FF66CC',
        yellow: '#FFD700',
        cyan: '#00FFFF'
      };
      
      const newColor = colorMap[requestedColor];
      
      // Replace common color patterns
      modifiedCode = modifiedCode.replace(/#FF6A00/g, newColor);
      modifiedCode = modifiedCode.replace(/#FF6600/g, newColor);
      modifiedCode = modifiedCode.replace(/#B16BFF/g, newColor);
      modifiedCode = modifiedCode.replace(/#51FFC4/g, newColor);
      modifiedCode = modifiedCode.replace(/linear-gradient\([^)]+\)/g, `linear-gradient(135deg, ${newColor}, ${newColor}CC)`);
      
      return {
        code: modifiedCode.trim(),
        explanation: `Updated colors to ${requestedColor}!`
      };
    }
    
    // Check if request needs multiple files
    const needsMultipleFiles = lowerPrompt.includes('complete') || lowerPrompt.includes('full') ||
                                lowerPrompt.includes('entire') || lowerPrompt.includes('whole') ||
                                (lowerPrompt.includes('app') && (lowerPrompt.includes('spotify') || 
                                 lowerPrompt.includes('dashboard') || lowerPrompt.includes('landing')));
    
    // SPOTIFY / MUSIC PLAYER (Multi-file if requested as "app" or "project")
    if (lowerPrompt.includes('spotify') || lowerPrompt.includes('music player') || lowerPrompt.includes('audio player')) {
      if (needsMultipleFiles) {
        // Multi-file Spotify project
        console.log('Generating multi-file Spotify project');
        code = `// File: /src/App.tsx
import { useState } from 'react';
import { Player } from './components/Player';
import { Playlist } from './components/Playlist';

export default function App() {
  const [currentSong, setCurrentSong] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const songs = [
    { id: 1, title: 'Neon Dreams', artist: 'Synthwave', duration: '3:24', cover: '🎧' },
    { id: 2, title: 'Digital Pulse', artist: 'Retrowave', duration: '4:12', cover: '🎵' },
    { id: 3, title: 'Arcade Nights', artist: 'Pixel Beats', duration: '2:58', cover: '🎮' },
  ];
  
  return (
    <div style={{ minHeight: '100vh', background: '#0F0A1F', color: 'white', fontFamily: 'system-ui' }}>
      <h1 style={{
        textAlign: 'center',
        padding: '2rem',
        background: 'linear-gradient(90deg, #1DB954, #51FFC4)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontSize: '3rem',
        margin: 0
      }}>
        🎵 Vibe Player
      </h1>
      
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <Player 
          song={songs[currentSong]} 
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
        />
        <Playlist 
          songs={songs}
          currentSong={currentSong}
          onSelect={(index) => {
            setCurrentSong(index);
            setIsPlaying(true);
          }}
        />
      </div>
    </div>
  );
}

// File: /src/components/Player.tsx
import { useState, useEffect } from 'react';

export function Player({ song, isPlaying, onPlayPause }) {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setProgress(p => p >= 100 ? 0 : p + 0.5);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);
  
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '24px',
      padding: '2rem',
      marginBottom: '2rem'
    }}>
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
        <div style={{
          width: '150px',
          height: '150px',
          fontSize: '4rem',
          background: 'linear-gradient(135deg, #FF6A00, #B16BFF)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {song.cover}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>{song.title}</h2>
          <p style={{ margin: 0, opacity: 0.7, fontSize: '1.2rem' }}>{song.artist}</p>
        </div>
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <div style={{
          height: '6px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: \`\${progress}%\`,
            background: 'linear-gradient(90deg, #1DB954, #51FFC4)',
            transition: 'width 0.1s linear'
          }} />
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <button onClick={onPlayPause} style={{
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #1DB954, #51FFC4)',
          border: 'none',
          borderRadius: '50%',
          fontSize: '1.5rem',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(29, 185, 84, 0.4)'
        }}>
          {isPlaying ? '⏸️' : '▶️'}
        </button>
      </div>
    </div>
  );
}

// File: /src/components/Playlist.tsx
export function Playlist({ songs, currentSong, onSelect }) {
  return (
    <div>
      <h3 style={{ marginBottom: '1rem', opacity: 0.7 }}>Playlist</h3>
      {songs.map((song, index) => (
        <div
          key={song.id}
          onClick={() => onSelect(index)}
          style={{
            padding: '1rem',
            background: currentSong === index ? 'rgba(29, 185, 84, 0.2)' : 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            marginBottom: '0.5rem',
            cursor: 'pointer',
            border: currentSong === index ? '1px solid #1DB954' : '1px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ fontWeight: 'bold' }}>{song.title}</div>
          <div style={{ fontSize: '0.9rem', opacity: 0.6 }}>{song.artist} • {song.duration}</div>
        </div>
      ))}
    </div>
  );
}`;
        explanation = 'Complete multi-file Spotify app with Player and Playlist components!';
      } else {
        // Single-file version
      code = `import { useState, useRef, useEffect } from 'react';

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180); // 3 minutes
  const [currentSong, setCurrentSong] = useState(0);
  const audioRef = useRef(null);
  
  const songs = [
    { id: 1, title: 'Neon Dreams', artist: 'Synthwave Collective', duration: '3:24' },
    { id: 2, title: 'Digital Pulse', artist: 'Retrowave', duration: '4:12' },
    { id: 3, title: 'Arcade Nights', artist: 'Pixel Beats', duration: '2:58' },
    { id: 4, title: 'Circuit City', artist: 'Electric Avenue', duration: '3:45' },
  ];
  
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return \`\${mins}:\${secs.toString().padStart(2, '0')}\`;
  };
  
  const progress = (currentTime / duration) * 100;
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F0A1F, #1a1525)',
      color: 'white',
      fontFamily: 'system-ui',
      padding: '2rem'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{
          fontSize: '3rem',
          background: 'linear-gradient(90deg, #1DB954, #51FFC4)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem'
        }}>
          🎵 Vibe Player
        </h1>
        <p style={{ opacity: 0.7 }}>Your personal music experience</p>
      </div>
      
      {/* Main Player Container */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '24px',
        padding: '2rem',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        {/* Album Art & Info */}
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
          <div style={{
            width: '200px',
            height: '200px',
            background: 'linear-gradient(135deg, #FF6A00, #B16BFF)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '4rem',
            boxShadow: '0 8px 32px rgba(177, 107, 255, 0.4)'
          }}>
            🎧
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>
              {songs[currentSong].title}
            </h2>
            <p style={{ opacity: 0.7, fontSize: '1.2rem', margin: 0 }}>
              {songs[currentSong].artist}
            </p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            height: '6px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '3px',
            overflow: 'hidden',
            cursor: 'pointer'
          }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            setCurrentTime(Math.floor(percent * duration));
          }}>
            <div style={{
              height: '100%',
              width: \`\${progress}%\`,
              background: 'linear-gradient(90deg, #1DB954, #51FFC4)',
              transition: 'width 0.3s ease',
              boxShadow: '0 0 10px #51FFC4'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.9rem', opacity: 0.6 }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => setCurrentSong(prev => prev > 0 ? prev - 1 : songs.length - 1)}
            style={{
              padding: '1rem',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            ⏮️
          </button>
          
          <button
            onClick={() => {
              setIsPlaying(!isPlaying);
              if (!isPlaying && currentTime >= duration) {
                setCurrentTime(0);
              }
            }}
            style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #1DB954, #51FFC4)',
              border: 'none',
              borderRadius: '50%',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1.5rem',
              boxShadow: '0 4px 16px rgba(29, 185, 84, 0.4)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          
          <button
            onClick={() => setCurrentSong(prev => (prev + 1) % songs.length)}
            style={{
              padding: '1rem',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            ⏭️
          </button>
        </div>
        
        {/* Playlist */}
        <div>
          <h3 style={{ marginBottom: '1rem', opacity: 0.7 }}>Up Next</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {songs.map((song, index) => (
              <div
                key={song.id}
                onClick={() => {
                  setCurrentSong(index);
                  setCurrentTime(0);
                  setIsPlaying(true);
                }}
                style={{
                  padding: '1rem',
                  background: currentSong === index ? 'rgba(29, 185, 84, 0.2)' : 'rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: currentSong === index ? '1px solid #1DB954' : '1px solid transparent',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = currentSong === index ? 'rgba(29, 185, 84, 0.2)' : 'rgba(255,255,255,0.05)'}
              >
                <div>
                  <div style={{ fontWeight: 'bold' }}>{song.title}</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.6 }}>{song.artist}</div>
                </div>
                <div style={{ opacity: 0.6 }}>{song.duration}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}`;
        explanation = 'Complete Spotify-like music player with play/pause, progress bar, next/previous, and interactive playlist!';
      }
    } else if (lowerPrompt.includes('dashboard') || lowerPrompt.includes('analytics')) {
      code = `import { useState } from 'react';

export default function App() {
  const [timeRange, setTimeRange] = useState('week');
  
  const stats = {
    week: { users: 1234, revenue: 5678, growth: 12.5, sessions: 3456 },
    month: { users: 5234, revenue: 23456, growth: 24.3, sessions: 15678 },
    year: { users: 45678, revenue: 234567, growth: 156.7, sessions: 145678 }
  };
  
  const currentStats = stats[timeRange];
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F0A1F, #1a1525)',
      padding: '2rem',
      fontFamily: 'system-ui'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{
          fontSize: '2.5rem',
          color: 'white',
          margin: 0
        }}>
          📊 Analytics Dashboard
        </h1>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['week', 'month', 'year'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                padding: '0.5rem 1rem',
                background: timeRange === range ? 'linear-gradient(135deg, #FF6A00, #B16BFF)' : 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.2s'
              }}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      
      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {[
          { label: 'Total Users', value: currentStats.users.toLocaleString(), icon: '👥', color: '#FF6A00' },
          { label: 'Revenue', value: \`$\${currentStats.revenue.toLocaleString()}\`, icon: '💰', color: '#1DB954' },
          { label: 'Growth', value: \`+\${currentStats.growth}%\`, icon: '📈', color: '#B16BFF' },
          { label: 'Sessions', value: currentStats.sessions.toLocaleString(), icon: '🎯', color: '#51FFC4' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: \`2px solid \${stat.color}30\`,
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = \`0 8px 24px \${stat.color}40\`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: stat.color, marginBottom: '0.25rem' }}>
              {stat.value}
            </div>
            <div style={{ opacity: 0.6 }}>{stat.label}</div>
          </div>
        ))}
      </div>
      
      {/* Chart */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '16px',
        padding: '2rem',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h2 style={{ marginBottom: '2rem', color: 'white' }}>Revenue Trend</h2>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '200px' }}>
          {[40, 65, 55, 80, 70, 90, 85, 95, 88, 100, 92, 98].map((value, index) => (
            <div
              key={index}
              style={{
                flex: 1,
                height: \`\${value}%\`,
                background: \`linear-gradient(180deg, \${index === 11 ? '#51FFC4' : '#B16BFF'}, \${index === 11 ? '#1DB954' : '#FF6A00'})\`,
                borderRadius: '8px 8px 0 0',
                transition: 'all 0.3s',
                cursor: 'pointer',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
                e.currentTarget.style.transform = 'scaleY(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'scaleY(1)';
              }}
              title={\`Value: \${value}\`}
            />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', opacity: 0.5, fontSize: '0.9rem' }}>
          <span>Jan</span>
          <span>Dec</span>
        </div>
      </div>
    </div>
  );
}`;
      explanation = 'Complete analytics dashboard with stats cards, interactive chart, and time range selector!';
    } else if (lowerPrompt.includes('landing') || lowerPrompt.includes('hero')) {
      code = `import { useState } from 'react';

export default function App() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    }
  };
  
  return (
    <div style={{ fontFamily: 'system-ui' }}>
      {/* Hero Section */}
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0F0A1F, #1a1525)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Floating orbs */}
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: i === 0 ? 'radial-gradient(circle, #FF6A00, transparent)' : 
                           i === 1 ? 'radial-gradient(circle, #B16BFF, transparent)' : 
                           'radial-gradient(circle, #51FFC4, transparent)',
              opacity: 0.2,
              left: \`\${i * 40}%\`,
              top: \`\${i * 30}%\`,
              filter: 'blur(60px)',
              animation: \`float-\${i} 10s ease-in-out infinite\`
            }}
          />
        ))}
        
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '800px' }}>
          <h1 style={{
            fontSize: '4rem',
            marginBottom: '1rem',
            background: 'linear-gradient(90deg, #FF6A00, #B16BFF, #51FFC4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 900
          }}>
            Build Amazing Apps
          </h1>
          
          <p style={{
            fontSize: '1.5rem',
            marginBottom: '3rem',
            opacity: 0.8
          }}>
            The fastest way to ship your ideas. AI-powered development platform trusted by 10,000+ developers.
          </p>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', maxWidth: '500px', margin: '0 auto' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              style={{
                flex: 1,
                padding: '1rem 1.5rem',
                fontSize: '1rem',
                borderRadius: '12px',
                border: '2px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                backdropFilter: 'blur(10px)'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '1rem 2rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #FF6A00, #B16BFF)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(255, 106, 0, 0.4)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Get Started →
            </button>
          </form>
          
          {submitted && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: 'rgba(81, 255, 196, 0.2)',
              borderRadius: '8px',
              border: '1px solid #51FFC4',
              color: '#51FFC4'
            }}>
              ✅ Thanks! We'll be in touch soon.
            </div>
          )}
        </div>
      </div>
      
      {/* Features Section */}
      <div style={{
        padding: '4rem 2rem',
        background: 'white'
      }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: '2.5rem',
          marginBottom: '3rem',
          color: '#0F0A1F'
        }}>
          Why Choose Us?
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {[
            { icon: '⚡', title: 'Lightning Fast', desc: 'Deploy in seconds, not hours' },
            { icon: '🤖', title: 'AI-Powered', desc: 'Smart code generation built-in' },
            { icon: '🔒', title: 'Secure', desc: 'Enterprise-grade security' },
            { icon: '📊', title: 'Analytics', desc: 'Real-time insights' },
          ].map((feature) => (
            <div
              key={feature.title}
              style={{
                padding: '2rem',
                background: 'linear-gradient(135deg, #f8f9fa, #ffffff)',
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{feature.icon}</div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#0F0A1F' }}>
                {feature.title}
              </h3>
              <p style={{ color: '#666', margin: 0 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
      
      <style>{\`
        @keyframes float-0 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, 20px); }
        }
        @keyframes float-1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-15px, 25px); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(18px, -22px); }
        }
      \`}</style>
    </div>
  );
}`;
      explanation = 'Complete landing page with hero section, email signup, features, and animated backgrounds!';
    } else if (lowerPrompt.includes('button') || lowerPrompt.includes('btn')) {
      code = `import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  const buttonStyles = {
    padding: '1rem 2rem',
    fontSize: '1rem',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #FF6A00, #B16BFF)',
    color: 'white',
    boxShadow: '0 4px 16px rgba(255, 106, 0, 0.3)',
    transition: 'all 0.3s ease',
  };

  return (
    <div style={{ 
      padding: '3rem',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0F0A1F, #1a1525)',
      fontFamily: 'system-ui'
    }}>
      <h1 style={{ 
        fontSize: '3rem', 
        marginBottom: '2rem',
        background: 'linear-gradient(90deg, #FF6A00, #B16BFF, #51FFC4)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: 900
      }}>
        Awesome Button! 🎮
      </h1>
      
      <button 
        style={buttonStyles}
        onClick={() => setCount(count + 1)}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 106, 0, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 106, 0, 0.3)';
        }}
      >
        Clicked {count} times! 🚀
      </button>
      
      <p style={{ marginTop: '2rem', color: '#51FFC4', fontSize: '1.2rem' }}>
        Total clicks: {count}
      </p>
    </div>
  );
}`;
      explanation = 'Created an interactive button with gradient styling, hover effects, and click counter. The code will work immediately in your preview!';
    } else if (lowerPrompt.includes('card')) {
      code = `import { useState } from 'react';

export default function App() {
  const [cards] = useState([
    { id: 1, title: 'Card 1', desc: 'This is an awesome card', emoji: '🎮' },
    { id: 2, title: 'Card 2', desc: 'Another great card', emoji: '🚀' },
    { id: 3, title: 'Card 3', desc: 'The best card yet', emoji: '✨' },
  ]);

  return (
    <div style={{ 
      padding: '3rem',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F0A1F, #1a1525)',
    }}>
      <h1 style={{ 
        textAlign: 'center',
        fontSize: '3rem',
        marginBottom: '3rem',
        color: '#51FFC4'
      }}>
        Card Gallery 🎨
      </h1>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {cards.map((card) => (
          <div
            key={card.id}
            style={{
              background: 'linear-gradient(135deg, #FF6A00, #B16BFF)',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 8px 32px rgba(177, 107, 255, 0.3)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 12px 48px rgba(177, 107, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(177, 107, 255, 0.3)';
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              {card.emoji}
            </div>
            <h2 style={{ color: 'white', margin: '0 0 0.5rem 0' }}>
              {card.title}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>
              {card.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}`;
      explanation = 'Created a responsive card gallery with gradient backgrounds, hover animations, and emoji icons. Fully functional and ready to use!';
    } else if (lowerPrompt.includes('gradient') || lowerPrompt.includes('background')) {
      code = `import { useState } from 'react';

export default function App() {
  const [activeGradient, setActiveGradient] = useState(0);
  
  const gradients = [
    'linear-gradient(135deg, #FF6A00, #B16BFF)',
    'linear-gradient(135deg, #B16BFF, #51FFC4)',
    'linear-gradient(135deg, #51FFC4, #FF6A00)',
    'radial-gradient(circle, #FF6A00, #0F0A1F)',
  ];
  
  return (
    <div style={{
      minHeight: '100vh',
      background: gradients[activeGradient],
      transition: 'background 0.5s ease',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <h1 style={{ 
        color: 'white', 
        fontSize: '3rem',
        marginBottom: '2rem',
        textShadow: '0 4px 16px rgba(0,0,0,0.5)'
      }}>
        Gradient Magic ✨
      </h1>
      
      <div style={{ display: 'flex', gap: '1rem' }}>
        {gradients.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveGradient(index)}
            style={{
              padding: '1rem 2rem',
              background: activeGradient === index ? 'white' : 'rgba(255,255,255,0.2)',
              color: activeGradient === index ? '#0F0A1F' : 'white',
              border: '2px solid white',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            Style {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}`;
      explanation = 'Created an interactive gradient switcher with smooth transitions. Try clicking the buttons!';
    } else if (lowerPrompt.includes('todo') || lowerPrompt.includes('list')) {
      code = `import { useState } from 'react';

export default function App() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Build something awesome', done: false },
    { id: 2, text: 'Add more features', done: false },
  ]);
  const [input, setInput] = useState('');

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { id: Date.now(), text: input, done: false }]);
      setInput('');
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, done: !todo.done } : todo
    ));
  };

  return (
    <div style={{ 
      padding: '3rem',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F0A1F, #1a1525)',
      color: 'white',
      fontFamily: 'system-ui'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#51FFC4' }}>
        ✅ Todo List
      </h1>
      
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            placeholder="Add a new todo..."
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '8px',
              border: '2px solid #B16BFF',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              fontSize: '1rem'
            }}
          />
          <button
            onClick={addTodo}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#FF6A00',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            Add
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {todos.map(todo => (
            <div
              key={todo.id}
              onClick={() => toggleTodo(todo.id)}
              style={{
                padding: '1rem',
                background: todo.done 
                  ? 'rgba(81, 255, 196, 0.2)' 
                  : 'rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: \`2px solid \${todo.done ? '#51FFC4' : 'transparent'}\`
              }}
            >
              <span style={{ 
                textDecoration: todo.done ? 'line-through' : 'none',
                opacity: todo.done ? 0.6 : 1
              }}>
                {todo.done ? '✅' : '⭕'} {todo.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}`;
      explanation = 'Created a fully functional todo list with add, toggle, and styling. Try adding and checking off items!';
    } else {
      code = `import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  
  return (
    <div style={{ 
      padding: '3rem',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0F0A1F, #1a1525)',
      fontFamily: 'system-ui'
    }}>
      <h1 style={{ 
        fontSize: '3rem',
        marginBottom: '2rem',
        color: '#51FFC4'
      }}>
        Hello from Vibe Roulette! 🎮
      </h1>
      
      <p style={{ color: '#B16BFF', fontSize: '1.2rem', marginBottom: '2rem' }}>
        Start building something amazing!
      </p>
      
      <button 
        onClick={() => setCount(count + 1)}
        style={{
          padding: '1rem 2rem',
          fontSize: '1.2rem',
          background: 'linear-gradient(135deg, #FF6A00, #B16BFF)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(255, 106, 0, 0.4)',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        Clicked {count} times! 🚀
      </button>
    </div>
  );
}`;
      explanation = 'Created a starter component with interactive button. Tell me what you\'d like to build and I\'ll generate the code!';
    }
    
    return { code, explanation };
  }

  private async mockChat(message: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('explain')) {
      return "This code creates a component that manages state and renders UI. The useEffect hook handles side effects, and the return statement renders the JSX.";
    } else if (lowerMessage.includes('improve') || lowerMessage.includes('optimize')) {
      return "Consider these improvements:\n1. Add error boundaries\n2. Memoize expensive calculations\n3. Use proper TypeScript types\n4. Add loading states";
    } else if (lowerMessage.includes('fix') || lowerMessage.includes('error')) {
      return "The error is likely caused by:\n1. Missing dependency in useEffect\n2. Incorrect prop types\n3. Async operation not handled properly\n\nTry adding proper error handling and type definitions.";
    } else if (lowerMessage.includes('how')) {
      return "To implement this, you should:\n1. Set up the component structure\n2. Add state management\n3. Handle user interactions\n4. Implement the business logic\n5. Add proper styling";
    } else {
      return "I can help you with:\n- Generating code snippets\n- Explaining code functionality\n- Fixing errors and bugs\n- Improving code quality\n- Suggesting best practices\n\nWhat would you like to work on?";
    }
  }

  // Real API implementations
  private async callOpenAI(systemPrompt: string, userPrompt: string, config: any, retryCount = 0): Promise<CodeGenerationResponse> {
    try {
      const modelName = config.model || 'gpt-5';
      const hasRetried = retryCount > 0;
      
      // Validate model name - include all available OpenAI models
      const validModels = [
        // GPT-5 models
        'gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-5-codex', 'gpt-5-pro',
        // GPT-4o models
        'gpt-4o', 'gpt-4o-2024-08-06', 'gpt-4o-2024-05-13', 'gpt-4o-mini', 'gpt-4o-mini-2024-07-18',
        // GPT-4 Turbo models
        'gpt-4-turbo', 'gpt-4-turbo-2024-04-09',
        // GPT-4 models
        'gpt-4', 'gpt-4-0613', 'gpt-4-32k', 'gpt-4-32k-0613',
        // GPT-3.5 models
        'gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'gpt-3.5-turbo-0125', 'gpt-3.5-turbo-1106'
      ];
      const useModel = validModels.includes(modelName) ? modelName : 'gpt-5';
      
      if (modelName !== useModel && !hasRetried) {
        console.warn(`Model ${modelName} not recognized, falling back to ${useModel}`);
      }
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: useModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3, // Lower temperature for more consistent code generation
          max_tokens: 8000 // Increased for better multi-file responses
        })
      });
      
      if (!response.ok) {
        // Try to get detailed error from response body
        let errorMessage = response.statusText;
        let errorDetails = '';
        let errorCode = '';
        try {
          const errorData = await response.json();
          errorDetails = errorData.error?.message || errorData.error?.code || JSON.stringify(errorData);
          errorCode = errorData.error?.code || '';
          errorMessage = errorData.error?.message || errorMessage;
        } catch (e) {
          // If we can't parse error, use status text
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        // If model not found, try falling back to GPT-4o (only once)
        if (!hasRetried && (errorCode === 'model_not_found' || errorMessage.toLowerCase().includes('model') || response.status === 404)) {
          console.warn(`Model ${useModel} not available, falling back to gpt-4o`);
          // Retry with GPT-4o as fallback
          return this.callOpenAI(systemPrompt, userPrompt, { ...config, model: 'gpt-4o' }, retryCount + 1);
        }
        
        throw new Error(`OpenAI API error: ${errorMessage}${errorDetails ? ` (${errorDetails})` : ''}`);
      }
      
      const data = await response.json();
      
      // Check for API errors in response
      if (data.error) {
        throw new Error(`OpenAI API error: ${data.error.message || data.error.code || 'Unknown error'}`);
      }
      
      let content = data.choices[0].message.content;
      
      // Extract ONLY the code, strip all explanations
      const codeBlockMatch = content.match(/```(?:typescript|tsx|javascript|jsx)?\n([\s\S]*?)```/);
      
      if (codeBlockMatch) {
        const code = codeBlockMatch[1].trim();
        return { 
          code, 
          explanation: 'Code generated and ready!' 
        };
      }
      
      // If no code block markers, assume entire response is code
      // Remove any leading/trailing text that looks like explanation
      content = content.trim();
      
      // Try to find where the actual code starts (import statement or export)
      const codeStart = content.search(/^(import |export )/m);
      if (codeStart > 0) {
        content = content.substring(codeStart);
      }
      
      return { 
        code: content.trim(), 
        explanation: 'Code generated and ready!' 
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  private async chatOpenAI(message: string, codeContext: string | undefined, config: any): Promise<string> {
    try {
      const systemPrompt = `You are an expert code generator for React apps. Generate ONLY complete, working code.

RULES:
- Return complete React components that work immediately
- Use export default function App()
- Include all imports
- Use inline styles
- Make it fully functional
- NO explanations unless specifically asked to explain
- NO tutorials or setup instructions`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...this.conversationHistory,
        { role: 'user', content: codeContext ? `Current code:\n\`\`\`\n${codeContext}\n\`\`\`\n\n${message}` : message }
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model || 'gpt-5', // Default to gpt-5
          messages: messages,
          temperature: 0.3,
          max_tokens: 4000
        })
      });
      
      if (!response.ok) {
        // Try to get detailed error from response body
        let errorMessage = response.statusText;
        let errorDetails = '';
        try {
          const errorData = await response.json();
          errorDetails = errorData.error?.message || errorData.error?.code || JSON.stringify(errorData);
          errorMessage = errorData.error?.message || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(`OpenAI API error: ${errorMessage}${errorDetails ? ` (${errorDetails})` : ''}`);
      }
      
      const data = await response.json();
      
      // Check for API errors in response
      if (data.error) {
        throw new Error(`OpenAI API error: ${data.error.message || data.error.code || 'Unknown error'}`);
      }
      
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI chat error:', error);
      return 'Sorry, I encountered an error. Please check your API key and try again.';
    }
  }

  private async callAnthropic(systemPrompt: string, userPrompt: string, config: any): Promise<CodeGenerationResponse> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: config.model || 'claude-3-5-sonnet-20241022',
          max_tokens: 8000, // Increased for better multi-file responses
          system: systemPrompt,
          messages: [
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3 // Lower temperature for more consistent code generation
        })
      });
      
      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      let content = data.content[0].text;
      
      // Extract ONLY the code, strip all explanations
      const codeBlockMatch = content.match(/```(?:typescript|tsx|javascript|jsx)?\n([\s\S]*?)```/);
      
      if (codeBlockMatch) {
        const code = codeBlockMatch[1].trim();
        return { 
          code, 
          explanation: 'Code generated and ready!' 
        };
      }
      
      // If no code block markers, try to extract the code
      content = content.trim();
      
      // Try to find where the actual code starts
      const codeStart = content.search(/^(import |export )/m);
      if (codeStart > 0) {
        content = content.substring(codeStart);
      }
      
      return { 
        code: content.trim(), 
        explanation: 'Code generated and ready!' 
      };
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw error;
    }
  }

  private async chatAnthropic(message: string, codeContext: string | undefined, config: any): Promise<string> {
    try {
      const systemPrompt = `You are an expert code generator for React apps. Generate ONLY complete, working code.

RULES:
- Return complete React components that work immediately
- Use export default function App()
- Include all imports
- Use inline styles
- Make it fully functional
- NO explanations unless specifically asked to explain
- NO tutorials or setup instructions`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: config.model || 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          system: systemPrompt,
          temperature: 0.3,
          messages: [
            ...this.conversationHistory,
            { role: 'user', content: codeContext ? `Current code:\n\`\`\`\n${codeContext}\n\`\`\`\n\n${message}` : message }
          ]
        })
      });
      
      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error('Anthropic chat error:', error);
      return 'Sorry, I encountered an error. Please check your API key and try again.';
    }
  }
}

export const aiService = new AIService();

