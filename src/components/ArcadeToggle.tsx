import { motion } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';

interface ArcadeToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function ArcadeToggle({ checked, onCheckedChange, disabled = false }: ArcadeToggleProps) {
  return (
    <motion.button
      onClick={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      className="relative inline-flex items-center gap-3 px-6 py-4 rounded-lg overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: checked 
          ? 'linear-gradient(135deg, rgba(177, 107, 255, 0.2) 0%, rgba(81, 255, 196, 0.2) 100%)'
          : 'rgba(247, 244, 233, 0.05)',
        border: `2px solid ${checked ? 'var(--mint-glow)' : 'var(--border)'}`,
        boxShadow: checked ? '0 0 20px rgba(81, 255, 196, 0.3)' : 'none',
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
      whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      {/* Animated background shimmer */}
      {checked && (
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(81, 255, 196, 0.1) 50%, transparent 100%)',
          }}
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
      
      <div className="relative flex items-center gap-3">
        <motion.div
          animate={{
            rotate: checked ? 0 : 180,
            scale: checked ? [1, 1.2, 1] : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          {checked ? (
            <Eye size={20} color="var(--mint-glow)" />
          ) : (
            <EyeOff size={20} color="var(--ticket-cream)" />
          )}
        </motion.div>
        
        <span style={{ color: 'var(--ticket-cream)', position: 'relative', zIndex: 1 }}>
          {checked ? 'ANONYMOUS MODE' : 'SHOW IDENTITY'}
        </span>
        
        {/* Toggle switch */}
        <div 
          className="relative w-14 h-7 rounded-full transition-all"
          style={{
            background: checked ? 'var(--mint-glow)' : 'rgba(247, 244, 233, 0.2)',
          }}
        >
          <motion.div
            className="absolute top-1 rounded-full"
            style={{
              width: 20,
              height: 20,
              background: checked ? 'var(--ink-violet)' : 'var(--ticket-cream)',
              boxShadow: checked ? '0 0 10px rgba(81, 255, 196, 0.5)' : 'none',
            }}
            animate={{
              x: checked ? 28 : 4,
            }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 30,
            }}
          />
        </div>
      </div>
    </motion.button>
  );
}

