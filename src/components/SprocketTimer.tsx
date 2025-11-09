import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock } from 'lucide-react';

interface SprocketTimerProps {
  totalSec: number;
  remainingSec: number;
  onTick?: (remaining: number) => void;
}

export function SprocketTimer({ totalSec, remainingSec, onTick }: SprocketTimerProps) {
  const [seconds, setSeconds] = useState(remainingSec);
  
  useEffect(() => {
    if (seconds <= 0) return;
    
    const timer = setInterval(() => {
      setSeconds(prev => {
        const next = Math.max(0, prev - 1);
        onTick?.(next);
        return next;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [seconds, onTick]);
  
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const progress = (seconds / totalSec) * 100;
  
  const isWarning = seconds <= 60 && seconds > 30;
  const isCritical = seconds <= 30;
  
  const displayColor = isCritical 
    ? 'var(--neon-orange)' 
    : isWarning 
    ? 'var(--orchid-electric)' 
    : 'var(--mint-glow)';
  
  return (
    <div className="relative">
      {/* Sprocket holes background */}
      <div className="flex gap-1 mb-2 opacity-20">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ background: 'var(--ticket-cream)' }}
          />
        ))}
      </div>
      
      <div 
        className="relative p-4 rounded-lg overflow-hidden"
        style={{
          background: 'rgba(15, 10, 31, 0.6)',
          border: '2px solid',
          borderColor: displayColor,
          boxShadow: `0 0 20px ${displayColor}40`
        }}
      >
        {/* Progress bar background */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-1 opacity-20"
          style={{ background: displayColor }}
        />
        <motion.div
          className="absolute bottom-0 left-0 h-1"
          style={{ background: displayColor }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <Clock size={20} color={displayColor} />
            <span className="text-xs opacity-60" style={{ color: 'var(--ticket-cream)' }}>
              TIME REMAINING
            </span>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={seconds}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="tabular-nums"
              style={{ 
                color: displayColor,
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem'
              }}
            >
              {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {isCritical && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute top-2 right-2 px-2 py-1 rounded text-xs"
            style={{
              background: 'var(--neon-orange)',
              color: 'var(--ink-violet)'
            }}
          >
            LAST CALL
          </motion.div>
        )}
      </div>
      
      {/* Sprocket holes bottom */}
      <div className="flex gap-1 mt-2 opacity-20">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ background: 'var(--ticket-cream)' }}
          />
        ))}
      </div>
    </div>
  );
}

