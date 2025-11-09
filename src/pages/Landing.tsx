import { useState } from 'react';
import { motion } from 'motion/react';
import { RouletteWheel } from '../components/RouletteWheel';
import { ArcadeToggle } from '../components/ArcadeToggle';
import { FloatingParticles } from '../components/FloatingParticles';
import { APIKeySettings } from '../components/APIKeySettings';
import { ConfigureAIButton } from '../components/ConfigureAIButton';
import { Zap, Sparkles } from 'lucide-react';

interface LandingProps {
  onSpin: (anonMode: boolean, sessionLength: number) => void;
}

export function Landing({ onSpin }: LandingProps) {
  const [anonMode, setAnonMode] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const handlePull = () => {
    setIsSpinning(true);
    onSpin(anonMode, 0); // Session length no longer used
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Settings button in top right */}
      <motion.div
        className="fixed top-6 right-6 z-50"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <ConfigureAIButton onClick={() => setShowSettings(true)} />
      </motion.div>
      
      {/* Floating particles background */}
      <FloatingParticles />
      
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{ background: 'var(--grad-arcade)' }}
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, 0]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
      
      <div className="relative z-10 max-w-2xl w-full text-center">
        {/* Logo / Title */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
          className="mb-12"
        >
          <motion.div 
            className="flex items-center justify-center gap-3 mb-4"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <Zap size={48} color="var(--neon-orange)" fill="var(--neon-orange)" />
            
            <h1 
              className="text-6xl m-0 relative"
              style={{
                fontFamily: 'var(--font-display)',
                background: 'var(--grad-arcade)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              VIBE ROULETTE
            </h1>
            
            <Sparkles size={32} color="var(--mint-glow)" />
          </motion.div>
          
          <motion.p 
            className="text-xl opacity-80 m-0" 
            style={{ color: 'var(--ticket-cream)' }}
          >
            Arcade pairing for tiny code remixes ✨
          </motion.p>
        </motion.div>
        
        {/* Roulette Wheel */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ 
            delay: 0.4,
            type: 'spring',
            stiffness: 150,
            damping: 15
          }}
          className="mb-12"
        >
          <RouletteWheel onSpin={handlePull} disabled={isSpinning} />
        </motion.div>
        
        {/* Controls */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 100 }}
          className="space-y-6"
        >
          {/* Anon Toggle */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <ArcadeToggle
              checked={anonMode}
              onCheckedChange={setAnonMode}
              disabled={isSpinning}
            />
          </motion.div>
        </motion.div>
      </div>
      
      {/* API Settings Modal */}
      <APIKeySettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

