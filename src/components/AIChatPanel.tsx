import { useState, useRef, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, Loader2, Copy, Check } from 'lucide-react';
import { aiService } from '../utils/aiService';
import { sendChatMessage } from '../utils/realtimeSync';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatPanelProps {
  onCodeGenerated?: (code: string) => void;
  onProjectGenerated?: (files: Array<{ path: string; content: string }>) => void;
  currentCode?: string;
  allFiles?: Map<string, string>;
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  activeFilePath?: string;
  sessionId?: string; // For real-time chat sync
}

export function AIChatPanel({ 
  onCodeGenerated, 
  onProjectGenerated, 
  currentCode, 
  allFiles,
  messages,
  setMessages,
  activeFilePath,
  sessionId
}: AIChatPanelProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    aiService.syncConversationHistory(
      messages.map(({ role, content }) => ({ role, content }))
    );
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Send to Supabase for real-time sync
    if (sessionId) {
      try {
        await sendChatMessage(sessionId, input);
      } catch (error) {
        console.error('Error sending chat message:', error);
      }
    }
    
    setInput('');
    setIsLoading(true);

    try {
      const lowerInput = input.toLowerCase();
      const isCodeRequest = 
        lowerInput.includes('create') ||
        lowerInput.includes('generate') ||
        lowerInput.includes('write') ||
        lowerInput.includes('build') ||
        lowerInput.includes('make') ||
        lowerInput.includes('add') ||
        lowerInput.includes('change') ||
        lowerInput.includes('update') ||
        lowerInput.includes('modify') ||
        lowerInput.includes('color') ||
        lowerInput.includes('style');

      if (isCodeRequest) {
        // Pass ALL files AND conversation history for full context
        const filesContext = allFiles && allFiles.size > 0
          ? Array.from(allFiles.entries()).map(([path, content]) => 
              `// File: ${path}\n${content}`
            ).join('\n\n---\n\n')
          : currentCode || '';
        
        // Add conversation history to context
        const conversationContext = messages.map(m => 
          `${m.role === 'user' ? 'USER' : 'ASSISTANT'}: ${m.content.substring(0, 200)}`
        ).join('\n');
        
        const response = await aiService.generateCode({
          prompt: `${conversationContext}\n\nNEW REQUEST: ${input}`,
          context: filesContext,
          language: 'typescript'
        });

        // Check if response contains multiple files (Bolt-style)
        const multiFileProject = aiService.parseMultiFileResponse(
          response.code,
          activeFilePath || '/src/App.tsx'
        );
        console.log('Parsed multi-file response:', multiFileProject);
        
        if (multiFileProject && multiFileProject.length > 1) {
          // Multi-file project generated!
          const explanation = `✨ Generated ${multiFileProject.length} files!`;
          const fileList = multiFileProject.map(f => `- ${f.path}`).join('\n');
          
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `${explanation}\n\n${fileList}\n\n\`\`\`typescript\n// Main file:\n${multiFileProject[0].content.substring(0, 500)}...\n\`\`\``,
            timestamp: new Date()
          };

          setMessages(prev => [...prev, assistantMessage]);
          
          // Sync assistant response to Supabase with 'assistant' role
          if (sessionId) {
            try {
              await sendChatMessage(sessionId, assistantMessage.content, 'assistant');
            } catch (error) {
              console.error('Error sending assistant message:', error);
            }
          }
          
          // Notify parent to create all files
          if (onProjectGenerated) {
            onProjectGenerated(multiFileProject);
          }
        } else {
          // Single file response
          const explanation = response.explanation || '✨ Generated!';
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `${explanation}\n\n\`\`\`typescript\n${response.code}\n\`\`\``,
            timestamp: new Date()
          };

          setMessages(prev => [...prev, assistantMessage]);
          
          // Sync assistant response to Supabase with 'assistant' role
          if (sessionId) {
            try {
              await sendChatMessage(sessionId, assistantMessage.content, 'assistant');
            } catch (error) {
              console.error('Error sending assistant message:', error);
            }
          }
          
          // Auto-insert code into editor immediately
          if (onCodeGenerated) {
            onCodeGenerated(response.code);
          }
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
        
        // Sync assistant response to Supabase
        if (sessionId) {
          try {
            await sendChatMessage(sessionId, assistantMessage.content);
          } catch (error) {
            console.error('Error sending assistant message:', error);
          }
        }
      }
    } catch (error) {
      console.error('AI Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '⚠️ Oops! Something went wrong. Try again?',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Sync error message to Supabase with 'assistant' role
      if (sessionId) {
        try {
          await sendChatMessage(sessionId, errorMessage.content, 'assistant');
        } catch (err) {
          console.error('Error sending error message:', err);
        }
      }
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

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
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

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--ink-violet)' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              layout
              initial={{ y: 20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-[90%] rounded-lg p-3 relative"
                style={{
                  background: message.role === 'user' 
                    ? 'var(--neon-orange)' 
                    : 'rgba(247, 244, 233, 0.05)',
                  color: message.role === 'user' 
                    ? 'var(--ink-violet)' 
                    : 'var(--ticket-cream)',
                  border: message.role === 'assistant' 
                    ? '1px solid rgba(247, 244, 233, 0.1)' 
                    : 'none',
                }}
              >
                {message.role === 'assistant' && (
                  <motion.div
                    className="absolute -left-2 -top-2"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles size={14} color="var(--mint-glow)" />
                  </motion.div>
                )}
                
                {extractCodeBlocks(message.content).map((part, idx) => (
                  <div key={idx}>
                    {part.text && (
                      <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed">
                        {part.text}
                      </p>
                    )}
                    {part.code && (
                      <div className="mt-2">
                        <div 
                          className="flex items-center justify-between mb-1 px-2 py-1 rounded-t"
                          style={{ background: 'rgba(0, 0, 0, 0.2)' }}
                        >
                          <span className="text-xs opacity-60 font-mono">{part.language}</span>
                          <div className="flex gap-1">
                            <motion.button
                              onClick={() => copyCode(part.code!)}
                              className="text-xs px-2 py-1 rounded transition-all flex items-center gap-1"
                              style={{
                                background: copiedCode === part.code 
                                  ? 'var(--mint-glow)' 
                                  : 'rgba(255, 255, 255, 0.1)',
                                color: copiedCode === part.code 
                                  ? 'var(--ink-violet)' 
                                  : 'var(--ticket-cream)',
                              }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {copiedCode === part.code ? (
                                <>
                                  <Check size={12} />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy size={12} />
                                  Copy
                                </>
                              )}
                            </motion.button>
                            <motion.button
                              onClick={() => insertCodeBlock(part.code!)}
                              className="text-xs px-2 py-1 rounded transition-all"
                              style={{
                                background: 'var(--orchid-electric)',
                                color: 'var(--ink-violet)',
                              }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Insert →
                            </motion.button>
                          </div>
                        </div>
                        <pre
                          className="text-xs p-3 rounded-b overflow-x-auto"
                          style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            fontFamily: 'var(--font-body)',
                            margin: 0,
                          }}
                        >
                          <code style={{ color: 'var(--mint-glow)' }}>{part.code}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex justify-start"
          >
            <div
              className="rounded-lg p-3 flex items-center gap-2"
              style={{
                background: 'rgba(247, 244, 233, 0.05)',
                color: 'var(--ticket-cream)',
                border: '1px solid rgba(247, 244, 233, 0.1)',
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 size={16} />
              </motion.div>
              <span className="text-sm">Thinking...</span>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggestions */}
      <AnimatePresence>
        {messages.length <= 1 && !isLoading && (
          <motion.div 
            className="px-4 pb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="text-xs mb-2 opacity-50" style={{ color: 'var(--ticket-cream)' }}>
              Quick start:
            </div>
            <div className="flex gap-1 flex-wrap">
              {[
                { text: 'Add styling', icon: '🎨', color: 'var(--orchid-electric)' },
                { text: 'Fix bugs', icon: '🐛', color: 'var(--neon-orange)' },
                { text: 'Add feature', icon: '✨', color: 'var(--mint-glow)' },
                { text: 'Optimize', icon: '⚡', color: 'var(--mint-glow)' },
              ].map((suggestion, idx) => (
                <motion.button
                  key={suggestion.text}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => {
                    setInput(suggestion.text);
                    inputRef.current?.focus();
                  }}
                  className="text-xs px-2 py-1 rounded transition-all flex items-center gap-1"
                  style={{
                    background: 'rgba(177, 107, 255, 0.15)',
                    color: 'var(--ticket-cream)',
                    border: '1px solid rgba(177, 107, 255, 0.3)',
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    background: 'rgba(177, 107, 255, 0.25)',
                    borderColor: suggestion.color,
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>{suggestion.icon}</span>
                  <span>{suggestion.text}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div
        className="p-4 border-t"
        style={{
          background: 'rgba(15, 10, 31, 0.5)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask me anything... (Enter to send)"
            disabled={isLoading}
            rows={2}
            className="flex-1 px-3 py-2 rounded-lg border text-sm resize-none"
            style={{
              background: 'rgba(247, 244, 233, 0.05)',
              borderColor: 'rgba(247, 244, 233, 0.2)',
              color: 'var(--ticket-cream)',
              fontFamily: 'var(--font-body)',
            }}
          />
          <motion.button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{
              background: isLoading || !input.trim() 
                ? 'rgba(255, 106, 0, 0.5)' 
                : 'var(--neon-orange)',
              color: 'var(--ink-violet)',
              border: 'none',
              cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
              height: '100%',
            }}
            whileHover={!isLoading && input.trim() ? { 
              scale: 1.05,
              boxShadow: '0 0 20px rgba(255, 106, 0, 0.5)',
            } : {}}
            whileTap={!isLoading && input.trim() ? { scale: 0.95 } : {}}
          >
            <Send size={18} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

