import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SmilePlus } from 'lucide-react';

const AVAILABLE_EMOJIS = ['🔥', '👍', '😍', '💯', '🎉', '✨', '🚀', '💪'];

interface EmojiReactionProps {
  messageId: string;
  reactions: Record<string, number>; // emoji -> count
  onReact: (emoji: string) => void;
  compact?: boolean;
}

export function EmojiReaction({ messageId, reactions, onReact, compact = false }: EmojiReactionProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<Array<{ id: number; emoji: string; x: number }>>([]);
  
  const handleReact = (emoji: string) => {
    onReact(emoji);
    setShowPicker(false);
    
    // Add floating emoji animation
    const id = Date.now();
    setFloatingEmojis(prev => [...prev, { id, emoji, x: Math.random() * 40 - 20 }]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    }, 1000);
  };
  
  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);
  
  return (
    <div className="relative inline-flex items-center gap-1">
      {/* Existing reactions */}
      {Object.entries(reactions).map(([emoji, count]) => (
        <motion.button
          key={emoji}
          onClick={() => handleReact(emoji)}
          className="px-2 py-1 rounded-full text-sm flex items-center gap-1"
          style={{
            background: 'rgba(81, 255, 196, 0.1)',
            border: '1px solid rgba(81, 255, 196, 0.3)',
            cursor: 'pointer',
          }}
          whileHover={{ scale: 1.1, background: 'rgba(81, 255, 196, 0.2)' }}
          whileTap={{ scale: 0.9 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <span>{emoji}</span>
          {count > 1 && (
            <span
              className="text-xs font-bold"
              style={{
                color: 'var(--mint-glow)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {count}
            </span>
          )}
        </motion.button>
      ))}
      
      {/* Add reaction button */}
      <motion.button
        onClick={() => setShowPicker(!showPicker)}
        className="p-1 rounded-full"
        style={{
          background: showPicker ? 'rgba(177, 107, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          cursor: 'pointer',
        }}
        whileHover={{ scale: 1.1, background: 'rgba(177, 107, 255, 0.2)' }}
        whileTap={{ scale: 0.9 }}
      >
        <SmilePlus size={14} color="var(--ticket-cream)" />
      </motion.button>
      
      {/* Emoji picker */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 10 }}
            className="absolute bottom-full mb-2 left-0 p-2 rounded-lg flex gap-1 flex-wrap"
            style={{
              background: 'var(--ticket-cream)',
              border: '2px solid var(--orchid-electric)',
              boxShadow: '0 4px 16px rgba(177, 107, 255, 0.4)',
              width: '180px',
            }}
          >
            {AVAILABLE_EMOJIS.map((emoji) => (
              <motion.button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="w-8 h-8 rounded flex items-center justify-center text-lg"
                style={{
                  background: 'transparent',
                  cursor: 'pointer',
                  border: 'none',
                }}
                whileHover={{ scale: 1.3, background: 'rgba(177, 107, 255, 0.1)' }}
                whileTap={{ scale: 0.8 }}
              >
                {emoji}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Floating emoji animations */}
      <div className="absolute inset-0 pointer-events-none">
        <AnimatePresence>
          {floatingEmojis.map((floater) => (
            <motion.div
              key={floater.id}
              className="absolute bottom-0 left-1/2 text-2xl"
              initial={{ y: 0, x: floater.x, opacity: 1, scale: 1 }}
              animate={{ y: -80, x: floater.x, opacity: 0, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              {floater.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

