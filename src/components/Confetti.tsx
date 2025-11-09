import { motion } from 'motion/react';
import { useMemo } from 'react';

interface ConfettiProps {
  active: boolean;
}

export function Confetti({ active }: ConfettiProps) {
  const particles = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: ['var(--neon-orange)', 'var(--orchid-electric)', 'var(--mint-glow)'][Math.floor(Math.random() * 3)],
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2
    }));
  }, []);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-3 h-3"
          style={{
            left: `${particle.x}%`,
            top: '-10%',
            background: particle.color,
          }}
          animate={{
            y: ['0vh', '120vh'],
            rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
            opacity: [1, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

