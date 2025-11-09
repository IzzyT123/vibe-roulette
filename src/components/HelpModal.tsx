import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Code, Play, Zap } from 'lucide-react';
import { RibbonButton } from './RibbonButton';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const features = [
    {
      icon: Code,
      title: 'Live Code Editor',
      description: 'Write code and see it update in real-time in the preview panel.',
      color: 'var(--neon-orange)'
    },
    {
      icon: Sparkles,
      title: 'AI Assistant',
      description: 'Ask AI to generate, explain, or fix code. Just describe what you want!',
      color: 'var(--orchid-electric)'
    },
    {
      icon: Play,
      title: 'Instant Preview',
      description: 'Your code runs live with CRT effects. Changes appear instantly.',
      color: 'var(--mint-glow)'
    },
    {
      icon: Zap,
      title: 'Constraints',
      description: 'Follow the session constraints for creative challenge!',
      color: 'var(--neon-orange)'
    }
  ];

  const tips = [
    'Click "AI Assistant" to open the AI chat',
    'Try asking: "Create a button component"',
    'Code updates appear instantly in preview',
    'Use the constraints in your left sidebar for inspiration',
    'Download your code when done with the download button'
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[100]"
            onClick={onClose}
            style={{
              backdropFilter: 'blur(8px)'
            }}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg pointer-events-auto"
              style={{
                background: 'var(--ticket-cream)',
                boxShadow: '0 20px 60px rgba(177, 107, 255, 0.6)',
              }}
            >
            {/* Die-cut corners */}
            <div 
              className="absolute top-0 right-0 w-4 h-4"
              style={{
                background: 'var(--ink-violet)',
                clipPath: 'polygon(100% 0, 100% 100%, 0 0)'
              }}
            />
            <div 
              className="absolute bottom-0 left-0 w-4 h-4"
              style={{
                background: 'var(--ink-violet)',
                clipPath: 'polygon(0 100%, 100% 100%, 0 0)'
              }}
            />

            {/* Header */}
            <div
              className="sticky top-0 flex items-center justify-between p-6 border-b z-10"
              style={{
                background: 'var(--orchid-electric)',
                borderColor: 'rgba(15, 10, 31, 0.1)'
              }}
            >
              <h2 
                className="m-0"
                style={{ 
                  fontFamily: 'var(--font-display)', 
                  color: 'var(--ink-violet)' 
                }}
              >
                🎮 How to Use Vibe Roulette
              </h2>
              <button
                onClick={onClose}
                className="opacity-70 hover:opacity-100 transition-opacity"
              >
                <X size={24} color="var(--ink-violet)" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-lg"
                    style={{
                      background: 'white',
                      border: '2px solid',
                      borderColor: feature.color
                    }}
                  >
                    <feature.icon size={24} color={feature.color} className="mb-3" />
                    <h3 
                      className="m-0 mb-2"
                      style={{ 
                        color: 'var(--ink-violet)',
                        fontFamily: 'var(--font-display)'
                      }}
                    >
                      {feature.title}
                    </h3>
                    <p className="text-sm m-0 opacity-70" style={{ color: 'var(--ink-violet)' }}>
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Quick Tips */}
              <div
                className="p-5 rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 106, 0, 0.1), rgba(177, 107, 255, 0.1))',
                  border: '1px solid rgba(177, 107, 255, 0.3)'
                }}
              >
                <h3 
                  className="mb-3"
                  style={{ 
                    color: 'var(--ink-violet)',
                    fontFamily: 'var(--font-display)'
                  }}
                >
                  💡 Quick Tips
                </h3>
                <ul className="space-y-2 m-0 pl-5" style={{ color: 'var(--ink-violet)' }}>
                  {tips.map((tip, index) => (
                    <li key={index} className="text-sm">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* AI Examples */}
              <div>
                <h3 
                  className="mb-3"
                  style={{ 
                    color: 'var(--ink-violet)',
                    fontFamily: 'var(--font-display)'
                  }}
                >
                  ✨ Try These AI Prompts
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Create a card component',
                    'Add a gradient background',
                    'Make it responsive',
                    'Add hover animations',
                    'Create a contact form',
                    'Add error handling'
                  ].map((prompt, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 rounded text-sm"
                      style={{
                        background: 'rgba(177, 107, 255, 0.1)',
                        color: 'var(--ink-violet)',
                        border: '1px solid rgba(177, 107, 255, 0.2)',
                        fontFamily: 'var(--font-body)'
                      }}
                    >
                      "{prompt}"
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="text-center pt-4">
                <RibbonButton onClick={onClose} variant="primary" size="lg">
                  Got it! Let's Code 🚀
                </RibbonButton>
              </div>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

