import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, FileCode, Sparkles, Clock, X, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface SessionStatsProps {
  linesWritten: number;
  filesCreated: number;
  aiRequests: number;
  timeElapsed: number; // in seconds
  isOpen: boolean;
  onToggle: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function SessionStats({ linesWritten, filesCreated, aiRequests, timeElapsed, isOpen, onToggle }: SessionStatsProps) {
  const [showMilestone, setShowMilestone] = useState<string | null>(null);
  
  // Check for milestones
  const checkMilestone = (stat: string, value: number) => {
    const milestones = {
      linesWritten: [50, 100, 200, 500],
      filesCreated: [3, 5, 10],
      aiRequests: [5, 10, 20],
    };
    
    const thresholds = milestones[stat as keyof typeof milestones] || [];
    const milestone = thresholds.find(t => value === t);
    
    if (milestone) {
      const messages = {
        linesWritten: `🔥 ${milestone} Lines Milestone!`,
        filesCreated: `🎨 ${milestone} Files Created!`,
        aiRequests: `⚡ ${milestone} AI Requests!`,
      };
      return messages[stat as keyof typeof messages];
    }
    return null;
  };

  return (
    <motion.div
      className="fixed top-20 right-6 z-40"
      initial={{ x: 400 }}
      animate={{ x: isOpen ? 0 : 320 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Toggle button */}
      <motion.button
        onClick={onToggle}
        className="absolute -left-10 top-4 p-2 rounded-l-lg"
        style={{
          background: 'var(--neon-orange)',
          border: '2px solid var(--mint-glow)',
          borderRight: 'none',
          cursor: 'pointer',
        }}
        whileHover={{ x: -5 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronRight
          size={20}
          color="var(--ink-violet)"
          style={{
            transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 0.3s',
          }}
        />
      </motion.button>

      {/* Stats panel */}
      <div
        className="w-80 rounded-lg overflow-hidden"
        style={{
          background: 'var(--ticket-cream)',
          border: '3px solid var(--neon-orange)',
          boxShadow: '0 8px 32px rgba(255, 106, 0, 0.6)',
        }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{
            background: 'var(--neon-orange)',
          }}
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={20} color="var(--ink-violet)" />
            <h3
              className="m-0 text-sm font-bold"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--ink-violet)',
              }}
            >
              SESSION STATS
            </h3>
          </div>
        </div>

        {/* Stats grid */}
        <div className="p-4 space-y-3">
          {/* Lines Written */}
          <motion.div
            className="p-3 rounded-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 106, 0, 0.1), rgba(177, 107, 255, 0.1))',
              border: '1px solid rgba(255, 106, 0, 0.3)',
            }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode size={16} color="var(--neon-orange)" />
                <span className="text-xs" style={{ color: 'var(--ink-violet)', opacity: 0.7 }}>
                  Lines Written
                </span>
              </div>
              <motion.div
                key={linesWritten}
                initial={{ scale: 1.5, color: '#FF6A00' }}
                animate={{ scale: 1, color: '#0F0A1F' }}
                className="text-xl font-bold"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--ink-violet)',
                }}
              >
                {linesWritten}
              </motion.div>
            </div>
          </motion.div>

          {/* Files Created */}
          <motion.div
            className="p-3 rounded-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(177, 107, 255, 0.1), rgba(81, 255, 196, 0.1))',
              border: '1px solid rgba(177, 107, 255, 0.3)',
            }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} color="var(--orchid-electric)" />
                <span className="text-xs" style={{ color: 'var(--ink-violet)', opacity: 0.7 }}>
                  Files Created
                </span>
              </div>
              <motion.div
                key={filesCreated}
                initial={{ scale: 1.5, color: '#B16BFF' }}
                animate={{ scale: 1, color: '#0F0A1F' }}
                className="text-xl font-bold"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--ink-violet)',
                }}
              >
                {filesCreated}
              </motion.div>
            </div>
          </motion.div>

          {/* AI Requests */}
          <motion.div
            className="p-3 rounded-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(81, 255, 196, 0.1), rgba(255, 106, 0, 0.1))',
              border: '1px solid rgba(81, 255, 196, 0.3)',
            }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} color="var(--mint-glow)" />
                <span className="text-xs" style={{ color: 'var(--ink-violet)', opacity: 0.7 }}>
                  AI Requests
                </span>
              </div>
              <motion.div
                key={aiRequests}
                initial={{ scale: 1.5, color: '#51FFC4' }}
                animate={{ scale: 1, color: '#0F0A1F' }}
                className="text-xl font-bold"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--ink-violet)',
                }}
              >
                {aiRequests}
              </motion.div>
            </div>
          </motion.div>

          {/* Time Elapsed */}
          <motion.div
            className="p-3 rounded-lg"
            style={{
              background: 'rgba(15, 10, 31, 0.05)',
              border: '1px solid rgba(15, 10, 31, 0.2)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} color="var(--ink-violet)" />
                <span className="text-xs" style={{ color: 'var(--ink-violet)', opacity: 0.7 }}>
                  Time Elapsed
                </span>
              </div>
              <div
                className="text-xl font-bold tabular-nums"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--ink-violet)',
                }}
              >
                {formatTime(timeElapsed)}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Milestone popup */}
      <AnimatePresence>
        {showMilestone && (
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10 }}
            className="absolute -top-20 left-0 right-0 p-4 rounded-lg text-center"
            style={{
              background: 'var(--mint-glow)',
              color: 'var(--ink-violet)',
              fontFamily: 'var(--font-display)',
              fontWeight: 'bold',
              boxShadow: '0 4px 16px rgba(81, 255, 196, 0.6)',
            }}
          >
            {showMilestone}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

