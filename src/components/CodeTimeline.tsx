import { motion } from 'motion/react';
import { GitCommit, RotateCcw, Save, Sparkles } from 'lucide-react';

interface TimelineSnapshot {
  id: string;
  timestamp: Date;
  type: 'manual' | 'auto' | 'milestone';
  label?: string;
}

interface CodeTimelineProps {
  snapshots: TimelineSnapshot[];
  currentIndex: number;
  onJumpTo: (index: number) => void;
  onCreateSnapshot: () => void;
}

export function CodeTimeline({ snapshots, currentIndex, onJumpTo, onCreateSnapshot }: CodeTimelineProps) {
  if (snapshots.length === 0) return null;
  
  const typeIcons = {
    manual: Save,
    auto: GitCommit,
    milestone: Sparkles,
  };
  
  const typeColors = {
    manual: 'var(--neon-orange)',
    auto: 'var(--ticket-cream)',
    milestone: 'var(--mint-glow)',
  };

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-10 px-4 py-3"
      style={{
        background: 'rgba(15, 10, 31, 0.95)',
        borderTop: '2px solid var(--border)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="flex items-center gap-4">
        {/* Create snapshot button */}
        <motion.button
          onClick={onCreateSnapshot}
          className="px-3 py-2 rounded-lg flex items-center gap-2 flex-shrink-0"
          style={{
            background: 'var(--neon-orange)',
            color: 'var(--ink-violet)',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-display)',
            fontWeight: 'bold',
            fontSize: '0.75rem',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Save size={14} />
          SAVE POINT
        </motion.button>

        {/* Timeline */}
        <div className="flex-1 relative">
          {/* Timeline bar */}
          <div
            className="h-2 rounded-full relative"
            style={{
              background: 'rgba(247, 244, 233, 0.1)',
            }}
          >
            {/* Progress indicator */}
            <motion.div
              className="absolute top-0 left-0 h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, var(--neon-orange), var(--mint-glow))',
                width: `${(currentIndex / (snapshots.length - 1)) * 100}%`,
              }}
              initial={false}
              animate={{ width: `${(currentIndex / Math.max(snapshots.length - 1, 1)) * 100}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />

            {/* Snapshot markers */}
            {snapshots.map((snapshot, index) => {
              const position = (index / Math.max(snapshots.length - 1, 1)) * 100;
              const Icon = typeIcons[snapshot.type];
              const color = typeColors[snapshot.type];
              const isActive = index === currentIndex;

              return (
                <motion.button
                  key={snapshot.id}
                  onClick={() => onJumpTo(index)}
                  className="absolute top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center"
                  style={{
                    left: `${position}%`,
                    width: isActive ? '24px' : '16px',
                    height: isActive ? '24px' : '16px',
                    background: color,
                    border: isActive ? '3px solid var(--ticket-cream)' : '2px solid var(--ink-violet)',
                    cursor: 'pointer',
                    boxShadow: isActive ? `0 0 16px ${color}` : 'none',
                  }}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.9 }}
                  title={snapshot.label || snapshot.timestamp.toLocaleTimeString()}
                >
                  {isActive && <Icon size={12} color="var(--ink-violet)" />}
                </motion.button>
              );
            })}
          </div>

          {/* Timeline labels */}
          <div className="flex justify-between mt-2 text-xs" style={{ color: 'var(--ticket-cream)', opacity: 0.5 }}>
            <span>{snapshots[0]?.timestamp.toLocaleTimeString()}</span>
            <span className="flex items-center gap-1">
              <RotateCcw size={10} />
              {snapshots.length} snapshots
            </span>
            <span>{snapshots[snapshots.length - 1]?.timestamp.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

