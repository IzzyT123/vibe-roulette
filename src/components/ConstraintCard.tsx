import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Target, Timer, Sparkles } from 'lucide-react';
import type { Constraint } from '../types/contracts';

interface ConstraintCardProps {
  constraint: Constraint;
  index?: number;
}

const iconMap = {
  Style: Palette,
  Goal: Target,
  Time: Timer
};

const colorMap = {
  Style: 'var(--orchid-electric)',
  Goal: 'var(--neon-orange)',
  Time: 'var(--mint-glow)'
};

const emojiMap = {
  Style: '🎨',
  Goal: '🎯',
  Time: '⏱️'
};

export function ConstraintCard({ constraint, index = 0 }: ConstraintCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const Icon = iconMap[constraint.kind];
  const accentColor = colorMap[constraint.kind];
  
  const handleClick = () => {
    setShowSparkles(true);
    setTimeout(() => setShowSparkles(false), 600);
  };
  
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.15,
        duration: 0.4,
        type: 'spring',
        stiffness: 200,
        damping: 20
      }}
      className="relative cursor-pointer"
      style={{
        background: 'var(--ticket-cream)',
        boxShadow: isHovered 
          ? `0 8px 32px ${accentColor}80, 0 4px 16px rgba(0,0,0,0.2)`
          : `0 4px 24px rgba(177, 107, 255, 0.25)`,
        transition: 'box-shadow 0.3s ease',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      whileHover={{ 
        scale: 1.02,
        y: -4,
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Animated border shimmer */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${accentColor}40 50%, transparent 100%)`,
          }}
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
      
      {/* Die-cut corners */}
      <motion.div 
        className="absolute top-0 right-0 w-3 h-3"
        style={{
          background: 'var(--ink-violet)',
          clipPath: 'polygon(100% 0, 100% 100%, 0 0)'
        }}
        animate={{
          scale: isHovered ? 1.2 : 1,
        }}
        transition={{ duration: 0.2 }}
      />
      <motion.div 
        className="absolute bottom-0 left-0 w-3 h-3"
        style={{
          background: 'var(--ink-violet)',
          clipPath: 'polygon(0 100%, 100% 100%, 0 0)'
        }}
        animate={{
          scale: isHovered ? 1.2 : 1,
        }}
        transition={{ duration: 0.2 }}
      />
      
      {/* Letterpress texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />
      
      {/* Sparkle burst effect */}
      <AnimatePresence>
        {showSparkles && (
          <>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 pointer-events-none"
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: Math.cos((i / 8) * Math.PI * 2) * 60,
                  y: Math.sin((i / 8) * Math.PI * 2) * 60,
                  opacity: 0,
                  scale: 0,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <Sparkles size={12} color={accentColor} />
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>
      
      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <motion.div
            className="w-10 h-10 rounded-lg flex items-center justify-center relative overflow-hidden"
            style={{
              background: accentColor,
              boxShadow: 'inset 0 2px 4px rgba(15, 10, 31, 0.15)'
            }}
            animate={{
              boxShadow: isHovered 
                ? [`inset 0 2px 4px rgba(15, 10, 31, 0.15)`, `inset 0 2px 4px rgba(15, 10, 31, 0.15), 0 0 20px ${accentColor}`]
                : 'inset 0 2px 4px rgba(15, 10, 31, 0.15)',
            }}
            transition={{ duration: 0.3 }}
          >
            {/* Pulsing background */}
            {isHovered && (
              <motion.div
                className="absolute inset-0"
                style={{ background: 'rgba(255, 255, 255, 0.3)' }}
                animate={{
                  scale: [1, 1.5],
                  opacity: [0.5, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                }}
              />
            )}
            
            <motion.div
              animate={{
                rotate: isHovered ? [0, 10, -10, 0] : 0,
                scale: isHovered ? 1.1 : 1,
              }}
              transition={{
                duration: 0.5,
              }}
            >
              <Icon size={20} color="var(--ink-violet)" strokeWidth={2.5} />
            </motion.div>
          </motion.div>
          
          <div className="flex-1">
            <motion.div 
              className="text-xs uppercase tracking-wide mb-1 opacity-60 flex items-center gap-1"
              style={{ color: 'var(--ink-violet)' }}
              animate={{
                opacity: isHovered ? 0.8 : 0.6,
              }}
            >
              <span>{constraint.kind}</span>
              <motion.span
                animate={{
                  scale: isHovered ? [1, 1.3, 1] : 1,
                }}
                transition={{
                  duration: 0.5,
                  repeat: isHovered ? Infinity : 0,
                  repeatDelay: 1,
                }}
              >
                {emojiMap[constraint.kind]}
              </motion.span>
            </motion.div>
            <motion.h3 
              className="m-0"
              style={{ 
                color: 'var(--ink-violet)',
                fontFamily: 'var(--font-display)'
              }}
              animate={{
                x: isHovered ? 2 : 0,
              }}
              transition={{ duration: 0.2 }}
            >
              {constraint.label}
            </motion.h3>
          </div>
          
          {/* Hover indicator */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: isHovered ? 1 : 0,
              scale: isHovered ? 1 : 0,
              rotate: isHovered ? 360 : 0,
            }}
            transition={{ duration: 0.3 }}
          >
            <Sparkles size={16} color={accentColor} />
          </motion.div>
        </div>
        
        {/* Details */}
        {constraint.details && (
          <motion.p 
            className="m-0 text-sm opacity-70"
            style={{ color: 'var(--ink-violet)' }}
            animate={{
              opacity: isHovered ? 0.9 : 0.7,
            }}
            transition={{ duration: 0.2 }}
          >
            {constraint.details}
          </motion.p>
        )}
        
        {/* Decorative dots */}
        <div className="absolute bottom-3 right-3 flex gap-1">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 h-1 rounded-full"
              style={{ background: accentColor }}
              animate={{
                opacity: isHovered ? [0.3, 1, 0.3] : 0.3,
                scale: isHovered ? [1, 1.5, 1] : 1,
              }}
              transition={{
                duration: 0.8,
                delay: i * 0.1,
                repeat: isHovered ? Infinity : 0,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

