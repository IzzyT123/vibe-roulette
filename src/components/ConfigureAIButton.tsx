import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings, Check, X } from 'lucide-react';

interface ConfigureAIButtonProps {
  onClick: () => void;
}

export function ConfigureAIButton({ onClick }: ConfigureAIButtonProps) {
  const [isConfigured, setIsConfigured] = useState(false);
  const [provider, setProvider] = useState<string>('mock');

  useEffect(() => {
    const config = localStorage.getItem('vibeRouletteAPIConfig');
    if (config) {
      try {
        const parsed = JSON.parse(config);
        setProvider(parsed.provider);
        setIsConfigured(parsed.provider !== 'mock' && parsed.apiKey);
      } catch (e) {
        setIsConfigured(false);
      }
    }
  }, []);

  return (
    <motion.button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-3 rounded-lg"
      style={{
        background: isConfigured ? 'var(--mint-glow)' : 'var(--orchid-electric)',
        color: 'var(--ink-violet)',
        border: '2px solid',
        borderColor: isConfigured ? 'var(--ink-violet)' : 'var(--mint-glow)',
        boxShadow: '0 4px 16px rgba(177, 107, 255, 0.4)',
        cursor: 'pointer',
        fontFamily: 'var(--font-display)'
      }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
    >
      {isConfigured ? <Check size={20} /> : <Settings size={20} />}
      {isConfigured ? `AI: ${provider.toUpperCase()}` : 'Configure AI'}
    </motion.button>
  );
}

