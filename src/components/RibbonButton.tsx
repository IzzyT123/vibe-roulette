import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface RibbonButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function RibbonButton({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false,
  size = 'md'
}: RibbonButtonProps) {
  const variantStyles = {
    primary: {
      bg: 'var(--neon-orange)',
      color: 'var(--ink-violet)',
      shadow: 'var(--orchid-electric)'
    },
    secondary: {
      bg: 'var(--orchid-electric)',
      color: 'var(--ink-violet)',
      shadow: 'var(--mint-glow)'
    },
    accent: {
      bg: 'var(--mint-glow)',
      color: 'var(--ink-violet)',
      shadow: 'var(--neon-orange)'
    }
  };
  
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3',
    lg: 'px-8 py-4 text-lg'
  };
  
  const style = variantStyles[variant];
  
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={`relative overflow-hidden ${sizeStyles[size]} disabled:opacity-50 disabled:cursor-not-allowed`}
      style={{
        background: style.bg,
        color: style.color,
        clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
        boxShadow: disabled ? 'none' : `0 4px 0 ${style.shadow}, 0 8px 16px rgba(0,0,0,0.2)`,
        transition: 'all 220ms var(--ease-arcade)',
        fontFamily: 'var(--font-display)'
      }}
    >
      {/* Shine effect */}
      {!disabled && (
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, white 50%, transparent 100%)',
          }}
          animate={{
            x: ['-100%', '200%']
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3
          }}
        />
      )}
      
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}

