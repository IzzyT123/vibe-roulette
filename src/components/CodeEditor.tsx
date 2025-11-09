import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Copy, Download, Sparkles, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import Editor, { OnMount } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';

interface CodeEditorProps {
  roomId: string;
  role?: 'Driver' | 'Navigator';
  filePath?: string;
  currentCode?: string;
  onCodeChange?: (code: string) => void;
  aiGeneratedCode?: string;
}

const STARTER_CODE = `import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ 
      padding: '2rem', 
      fontFamily: 'system-ui',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <h1>Hello from Vibe Roulette! 🎮</h1>
      <p>Start building something amazing together.</p>
      
      <div style={{ marginTop: '2rem' }}>
        <button 
          onClick={() => setCount(count + 1)}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            background: '#FF6A00',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Clicked {count} times
        </button>
      </div>
    </div>
  );
}`;

export function CodeEditor({ role, filePath, currentCode, onCodeChange, aiGeneratedCode }: CodeEditorProps) {
  const [code, setCode] = useState(currentCode || STARTER_CODE);
  const [showAIIndicator, setShowAIIndicator] = useState(false);
  const [isMinimapEnabled, setIsMinimapEnabled] = useState(true);
  const [currentFile, setCurrentFile] = useState(filePath || '/src/App.tsx');
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const hasConfiguredMonaco = useRef(false);

  // Update editor when file path changes - force reload
  useEffect(() => {
    if (filePath && filePath !== currentFile) {
      console.log('CodeEditor: File path changed from', currentFile, 'to', filePath);
      setCurrentFile(filePath);
      // Force update code when file changes - use currentCode if available
      if (currentCode !== undefined && currentCode !== '') {
        console.log('CodeEditor: Setting code for', filePath, 'length:', currentCode.length);
        setCode(currentCode);
        if (editorRef.current) {
          editorRef.current.setValue(currentCode);
        }
      } else {
        console.warn('CodeEditor: No code content for', filePath);
      }
    }
  }, [filePath, currentFile, currentCode]);

  // Update editor when code content changes (same file)
  useEffect(() => {
    if (currentCode !== undefined && filePath === currentFile && editorRef.current) {
      const editorValue = editorRef.current.getValue();
      if (currentCode !== editorValue) {
        console.log('CodeEditor: Updating code content for', currentFile);
        setCode(currentCode);
        editorRef.current.setValue(currentCode);
      }
    }
  }, [currentCode, filePath, currentFile]);

  // Handle AI-generated code
  useEffect(() => {
    if (aiGeneratedCode && editorRef.current) {
      setCode(aiGeneratedCode);
      editorRef.current.setValue(aiGeneratedCode);
      setShowAIIndicator(true);
      setTimeout(() => setShowAIIndicator(false), 2000);
      onCodeChange?.(aiGeneratedCode);
    }
  }, [aiGeneratedCode, onCodeChange]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Custom theme for retro/CRT aesthetic
    monaco.editor.defineTheme('vibe-roulette', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' },
      ],
      colors: {
        'editor.background': '#1E1E1E',
        'editor.foreground': '#D4D4D4',
        'editor.lineHighlightBackground': '#2A2A2A',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#51FFC4',
        'editor.selectionBackground': '#264F78',
        'editor.inactiveSelectionBackground': '#3A3D41',
        'editorCursor.foreground': '#51FFC4',
        'editor.findMatchBackground': '#515C6A',
        'editor.findMatchHighlightBackground': '#EA5C0055',
        'editorBracketMatch.background': '#0064001a',
        'editorBracketMatch.border': '#888888',
      }
    });
    
    monaco.editor.setTheme('vibe-roulette');

    if (!hasConfiguredMonaco.current) {
      hasConfiguredMonaco.current = true;

      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        target: monaco.languages.typescript.ScriptTarget.ESNext,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        allowJs: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        lib: ['ES2021', 'DOM'],
      });

      const reactLib = `
        declare module 'react' {
          export type ReactNode = any;
          export type FC<P = {}> = (props: P) => ReactNode;
          export function useState<T>(initial: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
          export function useEffect(effect: (...args: any[]) => void | (() => void), deps?: readonly any[]): void;
          export function useRef<T>(initial: T | null): { current: T | null };
          export function useMemo<T>(factory: () => T, deps: readonly any[]): T;
          export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: readonly any[]): T;
          export function useContext<T>(context: any): T;
          export const Fragment: any;
          export default {};
        }

        declare module 'react-dom' {
          const ReactDOM: any;
          export default ReactDOM;
        }

        declare module 'react/jsx-runtime' {
          export const jsx: any;
          export const jsxs: any;
          export const Fragment: any;
        }

        declare module '*.css';

        declare namespace JSX {
          interface IntrinsicElements {
            [elemName: string]: any;
          }
        }
      `;

      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        reactLib,
        'file:///node_modules/react/index.d.ts'
      );
    }
    
    // Enable IntelliSense and auto-completion
    editor.updateOptions({
      suggestOnTriggerCharacters: true,
      quickSuggestions: true,
      wordBasedSuggestions: 'off',
    });
  };

  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    onCodeChange?.(newCode);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'code.tsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetCode = () => {
    if (confirm('Reset to starter code? This cannot be undone.')) {
      setCode(STARTER_CODE);
      if (editorRef.current) {
        editorRef.current.setValue(STARTER_CODE);
      }
      onCodeChange?.(STARTER_CODE);
    }
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* AI Indicator */}
      {showAIIndicator && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="absolute top-14 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-lg flex items-center gap-2"
          style={{
            background: 'var(--mint-glow)',
            color: 'var(--ink-violet)',
            boxShadow: '0 4px 16px rgba(81, 255, 196, 0.3)'
          }}
        >
          <Sparkles size={16} />
          <span className="text-sm">AI code inserted!</span>
        </motion.div>
      )}

      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{
          background: 'var(--ink-violet)',
          borderColor: 'var(--border)'
        }}
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full" style={{ background: '#FF5F56' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#FFBD2E' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#27C93F' }} />
          </div>
          <span className="text-xs ml-3 opacity-60" style={{ color: 'var(--ticket-cream)' }}>
            {(filePath || currentFile).split('/').pop() || 'App.tsx'} • TypeScript React
          </span>
        </div>

        <div className="flex items-center gap-2">
          {role && (
            <div
              className="px-2 py-1 rounded text-xs"
              style={{
                background: role === 'Driver' ? 'var(--neon-orange)' : 'var(--orchid-electric)',
                color: 'var(--ink-violet)'
              }}
            >
              {role}
            </div>
          )}
          
          <button
            onClick={() => setIsMinimapEnabled(!isMinimapEnabled)}
            className="p-1.5 rounded transition-opacity hover:opacity-80"
            style={{ 
              color: 'var(--ticket-cream)',
              background: isMinimapEnabled ? 'rgba(81, 255, 196, 0.1)' : 'transparent'
            }}
            title="Toggle minimap"
          >
            {isMinimapEnabled ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          
          <button
            onClick={copyCode}
            className="p-1.5 rounded transition-opacity hover:opacity-80"
            style={{ color: 'var(--ticket-cream)' }}
            title="Copy code"
          >
            <Copy size={16} />
          </button>
          
          <button
            onClick={downloadCode}
            className="p-1.5 rounded transition-opacity hover:opacity-80"
            style={{ color: 'var(--ticket-cream)' }}
            title="Download code"
          >
            <Download size={16} />
          </button>
          
          <button
            onClick={resetCode}
            className="p-1.5 rounded transition-opacity hover:opacity-80"
            style={{ color: 'var(--ticket-cream)' }}
            title="Reset to starter"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden" style={{ background: '#1E1E1E' }}>
        <Editor
          key={filePath || currentFile}
          defaultLanguage="typescript"
          defaultValue={code}
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorMount}
          theme="vibe-roulette"
          options={{
            fontSize: 14,
            fontFamily: 'Victor Mono, Consolas, Monaco, Courier New, monospace',
            lineHeight: 20,
            tabSize: 2,
            minimap: {
              enabled: isMinimapEnabled,
              side: 'right',
              showSlider: 'mouseover',
              renderCharacters: false,
            },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            formatOnPaste: true,
            formatOnType: true,
            automaticLayout: true,
            wordWrap: 'on',
            wrappingStrategy: 'advanced',
            suggest: {
              showWords: true,
              showSnippets: true,
            },
            quickSuggestions: {
              other: true,
              comments: false,
              strings: true,
            },
            parameterHints: {
              enabled: true,
            },
            acceptSuggestionOnCommitCharacter: true,
            acceptSuggestionOnEnter: 'on',
            snippetSuggestions: 'top',
            bracketPairColorization: {
              enabled: true,
            },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
            renderLineHighlight: 'all',
            renderWhitespace: 'selection',
            folding: true,
            foldingStrategy: 'indentation',
            showFoldingControls: 'mouseover',
            matchBrackets: 'always',
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            autoSurround: 'languageDefined',
            linkedEditing: true,
          }}
        />
      </div>

      {/* Status bar */}
      <div
        className="flex items-center justify-between px-4 py-1 text-xs border-t"
        style={{
          background: '#007ACC',
          color: 'white',
          borderColor: '#005A9E'
        }}
      >
        <div className="flex items-center gap-4">
          <span>TypeScript React</span>
          <span>UTF-8</span>
          <span>LF</span>
          <span>Monaco Editor</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Ln {code.split('\n').length}</span>
          <span>{code.length} chars</span>
        </div>
      </div>
    </div>
  );
}

