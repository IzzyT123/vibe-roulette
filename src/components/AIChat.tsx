import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, Sparkles, Loader2, X, Minimize2, Maximize2 } from 'lucide-react';
import { aiService } from '../utils/aiService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  onCodeGenerated?: (code: string) => void;
  currentCode?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AIChat({ onCodeGenerated, currentCode, isOpen, onClose }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hi! I'm your AI coding assistant. I can help you:\n\n• Generate code from descriptions\n• Explain existing code\n• Fix errors and bugs\n• Improve code quality\n• Answer coding questions\n\nWhat would you like to create?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Check if user is asking for code generation
      const isCodeRequest = 
        input.toLowerCase().includes('create') ||
        input.toLowerCase().includes('generate') ||
        input.toLowerCase().includes('write') ||
        input.toLowerCase().includes('build') ||
        input.toLowerCase().includes('make');

      if (isCodeRequest) {
        const response = await aiService.generateCode({
          prompt: input,
          context: currentCode,
          language: 'typescript'
        });

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.explanation 
            ? `${response.explanation}\n\n\`\`\`typescript\n${response.code}\n\`\`\``
            : `\`\`\`typescript\n${response.code}\n\`\`\``,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // Optionally auto-insert generated code
        if (onCodeGenerated) {
          onCodeGenerated(response.code);
        }
      } else {
        const response = await aiService.chat(input, currentCode);
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('AI Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertCodeBlock = (code: string) => {
    if (onCodeGenerated) {
      onCodeGenerated(code);
    }
  };

  const extractCodeBlocks = (content: string): { text: string; code?: string; language?: string }[] => {
    const parts: { text: string; code?: string; language?: string }[] = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ text: content.slice(lastIndex, match.index) });
      }
      parts.push({
        text: '',
        code: match[2],
        language: match[1] || 'typescript'
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({ text: content.slice(lastIndex) });
    }

    return parts.length > 0 ? parts : [{ text: content }];
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="fixed right-4 bottom-4 z-50 flex flex-col rounded-lg overflow-hidden"
      style={{
        width: isMinimized ? '320px' : '420px',
        height: isMinimized ? '60px' : '600px',
        maxHeight: 'calc(100vh - 100px)',
        background: 'var(--ticket-cream)',
        border: '2px solid var(--orchid-electric)',
        boxShadow: '0 8px 32px rgba(177, 107, 255, 0.3)'
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b cursor-pointer"
        style={{
          background: 'var(--orchid-electric)',
          borderColor: 'rgba(15, 10, 31, 0.1)'
        }}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={20} color="var(--ink-violet)" />
          <h3 className="m-0" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink-violet)' }}>
            AI ASSISTANT
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            className="opacity-70 hover:opacity-100 transition-opacity"
          >
            {isMinimized ? <Maximize2 size={18} color="var(--ink-violet)" /> : <Minimize2 size={18} color="var(--ink-violet)" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="opacity-70 hover:opacity-100 transition-opacity"
          >
            <X size={18} color="var(--ink-violet)" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ background: 'white' }}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[85%] rounded-lg p-3"
                  style={{
                    background: message.role === 'user' ? 'var(--orchid-electric)' : 'var(--ticket-cream)',
                    color: 'var(--ink-violet)',
                    border: message.role === 'assistant' ? '1px solid rgba(15, 10, 31, 0.1)' : 'none'
                  }}
                >
                  {extractCodeBlocks(message.content).map((part, idx) => (
                    <div key={idx}>
                      {part.text && (
                        <p className="m-0 whitespace-pre-wrap text-sm">
                          {part.text}
                        </p>
                      )}
                      {part.code && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs opacity-60">{part.language}</span>
                            <button
                              onClick={() => insertCodeBlock(part.code!)}
                              className="text-xs px-2 py-1 rounded transition-opacity hover:opacity-80"
                              style={{
                                background: 'var(--mint-glow)',
                                color: 'var(--ink-violet)'
                              }}
                            >
                              Insert
                            </button>
                          </div>
                          <pre
                            className="text-xs p-3 rounded overflow-x-auto"
                            style={{
                              background: 'rgba(15, 10, 31, 0.05)',
                              fontFamily: 'var(--font-body)'
                            }}
                          >
                            <code>{part.code}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex justify-start"
              >
                <div
                  className="rounded-lg p-3 flex items-center gap-2"
                  style={{
                    background: 'var(--ticket-cream)',
                    color: 'var(--ink-violet)',
                    border: '1px solid rgba(15, 10, 31, 0.1)'
                  }}
                >
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            className="p-4 border-t"
            style={{
              background: 'var(--ticket-cream)',
              borderColor: 'rgba(15, 10, 31, 0.1)'
            }}
          >
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 rounded-lg border text-sm"
                style={{
                  background: 'white',
                  borderColor: 'rgba(15, 10, 31, 0.2)',
                  color: 'var(--ink-violet)',
                  fontFamily: 'var(--font-body)'
                }}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 rounded-lg transition-opacity disabled:opacity-50"
                style={{
                  background: 'var(--neon-orange)',
                  color: 'var(--ink-violet)'
                }}
              >
                <Send size={18} />
              </button>
            </div>
            
            <div className="flex gap-2 mt-2 flex-wrap">
              {[
                'Create a card component',
                'Add error handling',
                'Explain this code',
                'Make it responsive',
                'Add animations',
                'Optimize performance'
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="text-xs px-2 py-1 rounded transition-opacity hover:opacity-80"
                  style={{
                    background: 'rgba(177, 107, 255, 0.1)',
                    color: 'var(--ink-violet)',
                    border: '1px solid rgba(177, 107, 255, 0.3)'
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

