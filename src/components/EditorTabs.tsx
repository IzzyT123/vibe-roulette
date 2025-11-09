import { motion, AnimatePresence } from 'motion/react';
import { X, FileCode, Circle } from 'lucide-react';

export interface EditorTab {
  path: string;
  name: string;
  isDirty?: boolean;
}

interface EditorTabsProps {
  tabs: EditorTab[];
  activeTab: string;
  onTabClick: (path: string) => void;
  onTabClose: (path: string) => void;
}

const getFileColor = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'tsx':
    case 'jsx':
      return 'var(--neon-orange)';
    case 'ts':
    case 'js':
      return 'var(--mint-glow)';
    case 'json':
      return 'var(--orchid-electric)';
    case 'css':
      return '#3B82F6';
    default:
      return 'var(--ticket-cream)';
  }
};

export function EditorTabs({ tabs, activeTab, onTabClick, onTabClose }: EditorTabsProps) {
  return (
    <div 
      className="flex items-center gap-1 px-2 overflow-x-auto border-b"
      style={{
        background: 'rgba(15, 10, 31, 0.5)',
        borderColor: 'var(--border)',
        minHeight: '40px'
      }}
    >
      <AnimatePresence mode="popLayout">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.path;
          const fileColor = getFileColor(tab.name);
          
          return (
            <motion.div
              key={tab.path}
              layout
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative flex items-center gap-2 px-3 py-2 rounded-t cursor-pointer group"
              style={{
                background: isActive 
                  ? 'var(--ink-violet)' 
                  : 'transparent',
                borderBottom: isActive ? '2px solid var(--mint-glow)' : '2px solid transparent',
                minWidth: '120px',
                maxWidth: '200px',
              }}
              onClick={() => onTabClick(tab.path)}
              whileHover={{ 
                background: isActive ? 'var(--ink-violet)' : 'rgba(255, 255, 255, 0.05)',
                y: -1
              }}
            >
              {/* Active tab glow */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 pointer-events-none rounded-t"
                  style={{
                    boxShadow: '0 0 20px rgba(81, 255, 196, 0.2)',
                  }}
                  animate={{
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                />
              )}
              
              <motion.div
                animate={{
                  rotate: isActive ? [0, 5, -5, 0] : 0,
                }}
                transition={{
                  duration: 0.5,
                  repeat: isActive ? Infinity : 0,
                  repeatDelay: 3,
                }}
              >
                <FileCode 
                  size={14} 
                  color={isActive ? fileColor : 'var(--ticket-cream)'} 
                  opacity={isActive ? 1 : 0.6}
                />
              </motion.div>
              
              <span 
                className="text-sm truncate flex-1"
                style={{ 
                  color: isActive ? 'var(--ticket-cream)' : 'var(--ticket-cream)',
                  opacity: isActive ? 1 : 0.7
                }}
              >
                {tab.name}
              </span>
              
              {tab.isDirty && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Circle 
                    size={8} 
                    fill="var(--mint-glow)" 
                    color="var(--mint-glow)"
                  />
                </motion.div>
              )}
              
              <motion.button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.path);
                }}
                whileHover={{ 
                  background: 'rgba(255, 0, 0, 0.2)',
                  scale: 1.1 
                }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={14} color="var(--ticket-cream)" />
              </motion.button>
            </motion.div>
          );
        })}
      </AnimatePresence>
      
      {tabs.length === 0 && (
        <div 
          className="text-sm opacity-50 px-3 py-2"
          style={{ color: 'var(--ticket-cream)' }}
        >
          No files open
        </div>
      )}
    </div>
  );
}

