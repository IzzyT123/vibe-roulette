import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'motion/react';
import { Sparkles, Zap } from 'lucide-react';

interface RouletteWheelProps {
  onSpin: () => void;
  disabled?: boolean;
}

const SEGMENTS = 8;
const SEGMENT_LABELS = ['CODE', 'REMIX', 'VIBE', 'BUILD', 'CREATE', 'HACK', 'SPIN', 'GO!'];
const COLORS = [
  '#FF6A00', // Orange
  '#B16BFF', // Purple
  '#FF6B9D', // Pink
  '#51FFC4', // Teal
  '#FF4444', // Red
  '#FFD700', // Yellow
  '#FF00FF', // Magenta
  '#00FF00', // Green
];

export function RouletteWheel({ onSpin, disabled = false }: RouletteWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  const rotation = useMotionValue(0);
  const springRotation = useSpring(rotation, {
    stiffness: 50,
    damping: 30,
    mass: 2,
  });
  const wheelRef = useRef<HTMLDivElement>(null);

  const handleSpin = () => {
    if (disabled || isSpinning) return;
    
    setIsSpinning(true);
    setSelectedSegment(null);
    
    // Generate sparkles
    const newSparkles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 0.5,
    }));
    setSparkles(newSparkles);
    
    // Calculate random final position (multiple full rotations + segment offset)
    const baseRotations = 5 + Math.random() * 3; // 5-8 full rotations
    const segmentAngle = 360 / SEGMENTS;
    const randomSegment = Math.floor(Math.random() * SEGMENTS);
    const finalRotation = baseRotations * 360 + (360 - randomSegment * segmentAngle);
    
    // Set rotation with deceleration
    rotation.set(finalRotation);
    
    // Update selected segment after animation completes
    setTimeout(() => {
      setSelectedSegment(randomSegment);
      setIsSpinning(false);
      setSparkles([]);
      onSpin();
    }, 4000);
  };

  // Reset rotation when not spinning
  useEffect(() => {
    if (!isSpinning && selectedSegment === null) {
      rotation.set(0);
    }
  }, [isSpinning, selectedSegment, rotation]);

  const segmentAngle = 360 / SEGMENTS;

  return (
    <div className="flex flex-col items-center gap-8 relative">
      {/* Wheel Container */}
      <div className="relative w-64 h-64" ref={wheelRef}>
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full -z-10"
          style={{
            boxShadow: isSpinning
              ? '0 0 60px rgba(81, 255, 196, 0.6), 0 0 100px rgba(255, 106, 0, 0.4)'
              : '0 0 40px rgba(81, 255, 196, 0.3)',
          }}
          animate={{
            scale: isSpinning ? [1, 1.05, 1] : 1,
          }}
          transition={{
            duration: 0.5,
            repeat: isSpinning ? Infinity : 0,
          }}
        />
        
        {/* Rotating wheel wrapper */}
        <motion.div
          className="relative w-full h-full rounded-full overflow-hidden cursor-pointer"
          style={{
            rotate: springRotation,
          }}
          onClick={handleSpin}
          whileHover={!disabled && !isSpinning ? { scale: 1.02 } : {}}
          whileTap={!disabled && !isSpinning ? { scale: 0.98 } : {}}
        >
          {/* Wheel base - outer ring */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: '6px solid var(--neon-orange)',
              boxShadow: '0 0 20px rgba(255, 106, 0, 0.5)',
            }}
          />
          
          {/* Segments using SVG for better rendering */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 200 200"
            style={{ transform: 'rotate(-90deg)' }}
          >
            <defs>
              {COLORS.map((color, index) => (
                <radialGradient key={`grad-${index}`} id={`segmentGrad-${index}`}>
                  <stop offset="30%" stopColor={color} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={color} stopOpacity="1" />
                </radialGradient>
              ))}
            </defs>
            <g transform="translate(100, 100)">
              {Array.from({ length: SEGMENTS }).map((_, index) => {
                const startAngle = (index * segmentAngle) * (Math.PI / 180);
                const endAngle = ((index + 1) * segmentAngle) * (Math.PI / 180);
                const outerRadius = 95;
                const innerRadius = 30;
                const isSelected = selectedSegment === index;
                
                const x1 = Math.cos(startAngle) * innerRadius;
                const y1 = Math.sin(startAngle) * innerRadius;
                const x2 = Math.cos(startAngle) * outerRadius;
                const y2 = Math.sin(startAngle) * outerRadius;
                const x3 = Math.cos(endAngle) * outerRadius;
                const y3 = Math.sin(endAngle) * outerRadius;
                const x4 = Math.cos(endAngle) * innerRadius;
                const y4 = Math.sin(endAngle) * innerRadius;
                
                const largeArc = segmentAngle > 180 ? 1 : 0;
                
                const path = [
                  `M ${x1} ${y1}`,
                  `L ${x2} ${y2}`,
                  `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x3} ${y3}`,
                  `L ${x4} ${y4}`,
                  `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1} ${y1}`,
                  'Z'
                ].join(' ');
                
                return (
                  <g key={index}>
                    <motion.path
                      d={path}
                      fill={`url(#segmentGrad-${index})`}
                      stroke="var(--ink-violet)"
                      strokeWidth="2"
                      initial={{
                        scale: 0,
                        opacity: 0,
                      }}
                      animate={{
                        scale: isSelected ? [1, 1.05, 1] : 1,
                        opacity: isSelected ? [1, 0.9, 1] : 1,
                      }}
                      transition={{
                        scale: {
                          duration: 0.3,
                          delay: isSelected ? 3.7 : 0.1 + index * 0.05,
                        },
                        opacity: {
                          duration: 0.3,
                          delay: isSelected ? 3.7 : 0.1 + index * 0.05,
                        },
                      }}
                      style={{
                        filter: isSelected ? 'drop-shadow(0 0 20px rgba(81, 255, 196, 0.8))' : 'none',
                      }}
                    />
                    {/* Segment label inside SVG */}
                    <text
                      x={Math.cos((startAngle + endAngle) / 2) * 65}
                      y={Math.sin((startAngle + endAngle) / 2) * 65}
                      fill="white"
                      fontSize="11"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${index * segmentAngle + segmentAngle / 2}, ${Math.cos((startAngle + endAngle) / 2) * 65}, ${Math.sin((startAngle + endAngle) / 2) * 65})`}
                      style={{ 
                        fontFamily: 'var(--font-display)',
                        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                        pointerEvents: 'none'
                      }}
                    >
                      {SEGMENT_LABELS[index]}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
          
          {/* Center hub - gradient ring only, no covering circle */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full flex items-center justify-center pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, var(--neon-orange) 0%, var(--orchid-electric) 100%)',
              boxShadow: '0 4px 16px rgba(255, 106, 0, 0.6), inset 0 -2px 8px rgba(0,0,0,0.3)'
            }}
          >
            {/* Sparkle icon - no background circle */}
            <motion.div
              className="flex items-center justify-center"
              animate={{
                rotate: isSpinning ? 360 : 0,
                scale: isSpinning ? [1, 1.3, 1] : 1,
              }}
              transition={{
                rotate: {
                  duration: 2,
                  repeat: isSpinning ? Infinity : 0,
                  ease: 'linear'
                },
                scale: {
                  duration: 0.3,
                  repeat: isSpinning ? Infinity : 0
                }
              }}
            >
              <Sparkles 
                size={24} 
                color={isSpinning ? "var(--mint-glow)" : "white"}
                style={{
                  filter: isSpinning ? 'drop-shadow(0 0 12px var(--mint-glow))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                }}
              />
            </motion.div>
          </div>
        </motion.div>
        
        {/* Pointer/Arrow at top - SVG path matching Figma design */}
        <motion.div
          className="absolute -top-4 z-20 pointer-events-none"
          style={{
            left: '50%',
            transform: 'translateX(-50%)', // Center the arrow perfectly in the middle
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
          }}
          animate={{
            y: isSpinning ? [0, -5, 0] : [-8, 0, -8],
          }}
          transition={{
            duration: isSpinning ? 0.2 : 1,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40">
            <path
              d="M20 35 L10 15 L20 20 L30 15 Z"
              fill="var(--neon-orange)"
              stroke="var(--ticket-cream)"
              strokeWidth="2"
            />
          </svg>
        </motion.div>
        
        {/* Decorative rivets around the edge */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const x = Math.cos(angle) * 120;
          const y = Math.sin(angle) * 120;
          
          return (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full pointer-events-none"
              style={{
                background: 'var(--orchid-electric)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.3)',
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
              }}
              initial={{
                scale: 0,
                opacity: 0,
              }}
              animate={{
                scale: isSpinning ? [1, 1.3, 1] : 1,
                opacity: 1,
                boxShadow: isSpinning 
                  ? [
                      '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.3)',
                      `0 2px 4px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.3), 0 0 10px ${COLORS[i % COLORS.length]}`,
                      '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.3)'
                    ]
                  : '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.3)'
              }}
              transition={{
                scale: {
                  duration: 0.2,
                  delay: i * 0.05,
                  repeat: isSpinning ? Infinity : 0
                },
                opacity: {
                  duration: 0.3,
                  delay: 0.1 + i * 0.05,
                },
                boxShadow: {
                  duration: 0.2,
                  delay: i * 0.05,
                  repeat: isSpinning ? Infinity : 0
                }
              }}
            />
          );
        })}
        
        {/* Sparkle particles during spin (fixed position) */}
        <div className="absolute inset-0 pointer-events-none z-30">
          <AnimatePresence>
            {sparkles.map((sparkle) => (
              <motion.div
                key={sparkle.id}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: `${sparkle.x}%`,
                  top: `${sparkle.y}%`,
                  background: COLORS[sparkle.id % COLORS.length],
                  boxShadow: `0 0 8px ${COLORS[sparkle.id % COLORS.length]}`,
                }}
                initial={{
                  scale: 0,
                  opacity: 0,
                }}
                animate={{
                  scale: [0, 1.5, 0],
                  opacity: [0, 1, 0],
                  x: [
                    0,
                    (Math.random() - 0.5) * 100,
                    (Math.random() - 0.5) * 150,
                  ],
                  y: [
                    0,
                    (Math.random() - 0.5) * 100,
                    (Math.random() - 0.5) * 150,
                  ],
                }}
                transition={{
                  duration: 1.5,
                  delay: sparkle.delay,
                  repeat: isSpinning ? Infinity : 0,
                  repeatDelay: 0.5,
                }}
                exit={{
                  scale: 0,
                  opacity: 0,
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Status text */}
      <motion.p
        className="text-2xl m-0"
        style={{ 
          color: 'var(--mint-glow)',
          fontFamily: 'var(--font-display)',
        }}
        animate={{ 
          opacity: isSpinning ? [1, 0.5, 1] : 1,
          scale: isSpinning ? [1, 1.05, 1] : 1,
        }}
        transition={{ 
          duration: 0.6, 
          repeat: isSpinning ? Infinity : 0,
        }}
      >
        {isSpinning ? (
          <>
            <Zap size={24} className="inline" /> SPINNING...
          </>
        ) : disabled ? (
          '🔒 LOCKED'
        ) : selectedSegment !== null ? (
          <>
            <Sparkles size={20} className="inline" /> MATCHED!
          </>
        ) : (
          <>
            <Sparkles size={20} className="inline" /> CLICK TO SPIN
          </>
        )}
      </motion.p>
    </div>
  );
}
