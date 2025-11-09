import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { ArrowDown } from 'lucide-react';

interface SpinLeverProps {
  onPull: () => void;
  disabled?: boolean;
  maxPull?: number;
}

export function SpinLever({ onPull, disabled = false, maxPull = 120 }: SpinLeverProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [hasReleased, setHasReleased] = useState(false);
  const y = useMotionValue(0);
  const springY = useSpring(y, {
    stiffness: 300,
    damping: 25,
    mass: 0.5,
  });
  const leverRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  
  // Transform pull distance to scale/rotation
  const pullProgress = useTransform(y, [0, maxPull], [0, 1]);
  const leverScale = useTransform(pullProgress, [0, 1], [1, 1.1]);
  const glowIntensity = useTransform(pullProgress, [0, 1], [0, 1]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsPulling(true);
    startYRef.current = e.clientY;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setIsPulling(true);
    startYRef.current = e.touches[0].clientY;
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isPulling) return;
    const deltaY = e.clientY - startYRef.current;
    const newY = Math.max(0, Math.min(maxPull, deltaY));
    y.set(newY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isPulling || !e.touches[0]) return;
    const deltaY = e.touches[0].clientY - startYRef.current;
    const newY = Math.max(0, Math.min(maxPull, deltaY));
    y.set(newY);
  };

  const handleMouseUp = () => {
    if (!isPulling) return;
    releaseLever();
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleTouchEnd = () => {
    if (!isPulling) return;
    releaseLever();
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  };

  const releaseLever = () => {
    setIsPulling(false);
    const currentY = y.get();
    
    // If pulled far enough, trigger spin
    if (currentY > maxPull * 0.6) {
      setHasReleased(true);
      onPull();
      
      // Reset after animation
      setTimeout(() => {
        setHasReleased(false);
        y.set(0);
      }, 1000);
    } else {
      // Spring back if not pulled enough
      y.set(0);
    }
  };

  // Cleanup listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Pull indicator */}
      <motion.div
        className="text-sm mb-2"
        style={{
          color: 'var(--mint-glow)',
          fontFamily: 'var(--font-display)',
        }}
        animate={{
          opacity: isPulling ? 1 : 0.5,
        }}
      >
        {isPulling ? 'PULL DOWN...' : 'PULL TO SPIN'}
      </motion.div>

      {/* Lever base */}
      <div className="relative">
        {/* Progress bar */}
        <motion.div
          className="absolute -top-8 left-1/2 -translate-x-1/2 w-2 h-20 rounded-full overflow-hidden"
          style={{
            background: 'rgba(81, 255, 196, 0.2)',
            border: '1px solid var(--mint-glow)',
          }}
        >
          <motion.div
            className="w-full rounded-full"
            style={{
              background: 'linear-gradient(180deg, var(--mint-glow) 0%, var(--neon-orange) 100%)',
              height: useTransform(pullProgress, [0, 1], ['0%', '100%']),
            }}
          />
        </motion.div>

        {/* Lever */}
        <motion.div
          ref={leverRef}
          className="relative cursor-grab active:cursor-grabbing"
          style={{
            y: springY,
            scale: leverScale,
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          whileHover={!disabled && !isPulling ? { scale: 1.05 } : {}}
        >
          {/* Glow effect when pulling */}
          <motion.div
            className="absolute inset-0 rounded-lg"
            style={{
              background: 'radial-gradient(circle, var(--mint-glow) 0%, transparent 70%)',
              opacity: glowIntensity,
              filter: 'blur(20px)',
            }}
          />

          {/* Lever body */}
          <motion.div
            className="relative px-6 py-8 rounded-lg"
            style={{
              background: disabled
                ? 'rgba(247, 244, 233, 0.1)'
                : 'linear-gradient(135deg, var(--neon-orange) 0%, var(--orchid-electric) 100%)',
              border: `3px solid ${disabled ? 'var(--border)' : 'var(--mint-glow)'}`,
              boxShadow: disabled
                ? 'none'
                : '0 0 30px rgba(81, 255, 196, 0.4), 0 4px 0 rgba(81, 255, 196, 0.2)',
              cursor: disabled ? 'not-allowed' : 'grab',
            }}
            animate={{
              boxShadow: isPulling
                ? [
                    '0 0 30px rgba(81, 255, 196, 0.4)',
                    '0 0 50px rgba(81, 255, 196, 0.8)',
                    '0 0 30px rgba(81, 255, 196, 0.4)',
                  ]
                : disabled
                ? 'none'
                : '0 0 30px rgba(81, 255, 196, 0.4)',
            }}
            transition={{
              duration: 0.5,
              repeat: isPulling ? Infinity : 0,
            }}
          >
            {/* Lever handle */}
            <motion.div
              className="flex flex-col items-center gap-2"
              animate={{
                y: isPulling ? [0, -2, 0] : 0,
              }}
              transition={{
                duration: 0.3,
                repeat: isPulling ? Infinity : 0,
              }}
            >
              <ArrowDown
                size={32}
                color={disabled ? 'var(--border)' : 'var(--ink-violet)'}
                style={{
                  filter: isPulling ? 'drop-shadow(0 0 8px var(--mint-glow))' : 'none',
                }}
              />
              <div
                className="text-xs font-bold"
                style={{
                  color: disabled ? 'var(--border)' : 'var(--ink-violet)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                PULL
              </div>
            </motion.div>

            {/* Release animation */}
            {hasReleased && (
              <motion.div
                className="absolute inset-0 rounded-lg"
                style={{
                  background: 'radial-gradient(circle, var(--mint-glow) 0%, transparent 70%)',
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 1.5] }}
                transition={{ duration: 0.5 }}
              />
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

