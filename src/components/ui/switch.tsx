import { motion } from 'motion/react';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function Switch({ checked, onCheckedChange }: SwitchProps) {
  return (
    <button
      onClick={() => onCheckedChange(!checked)}
      className="relative w-12 h-6 rounded-full transition-colors"
      style={{
        background: checked ? 'var(--mint-glow)' : 'rgba(247, 244, 233, 0.2)',
      }}
    >
      <motion.div
        className="absolute top-0.5 rounded-full"
        style={{
          width: 20,
          height: 20,
          background: checked ? 'var(--ink-violet)' : 'var(--ticket-cream)',
        }}
        animate={{
          x: checked ? 24 : 2,
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30,
        }}
      />
    </button>
  );
}

