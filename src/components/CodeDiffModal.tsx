import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ArrowRight, GitCompare } from 'lucide-react';
import { useState } from 'react';

interface CodeDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  oldCode: string;
  newCode: string;
  fileName: string;
}

function calculateDiff(oldCode: string, newCode: string): Array<{ type: 'add' | 'remove' | 'same'; line: string; lineNumber: number }> {
  const oldLines = oldCode.split('\n');
  const newLines = newCode.split('\n');
  const result: Array<{ type: 'add' | 'remove' | 'same'; line: string; lineNumber: number }> = [];
  
  // Simple line-by-line diff
  const maxLines = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLines; i++) {
    if (i >= oldLines.length) {
      result.push({ type: 'add', line: newLines[i], lineNumber: i + 1 });
    } else if (i >= newLines.length) {
      result.push({ type: 'remove', line: oldLines[i], lineNumber: i + 1 });
    } else if (oldLines[i] !== newLines[i]) {
      result.push({ type: 'remove', line: oldLines[i], lineNumber: i + 1 });
      result.push({ type: 'add', line: newLines[i], lineNumber: i + 1 });
    } else {
      result.push({ type: 'same', line: oldLines[i], lineNumber: i + 1 });
    }
  }
  
  return result;
}

export function CodeDiffModal({ isOpen, onClose, onAccept, onReject, oldCode, newCode, fileName }: CodeDiffModalProps) {
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');
  const diff = calculateDiff(oldCode, newCode);
  
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[150]"
            onClick={onClose}
            style={{ backdropFilter: 'blur(8px)' }}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg pointer-events-auto flex flex-col"
              style={{
                background: 'var(--ticket-cream)',
                boxShadow: '0 20px 60px rgba(81, 255, 196, 0.6)',
              }}
            >
              {/* Header */}
              <div
                className="px-6 py-4 flex items-center justify-between border-b"
                style={{
                  background: 'var(--mint-glow)',
                  borderColor: 'rgba(15, 10, 31, 0.1)',
                }}
              >
                <div className="flex items-center gap-3">
                  <GitCompare size={24} color="var(--ink-violet)" />
                  <div>
                    <h2 className="m-0 text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink-violet)' }}>
                      CODE CHANGES
                    </h2>
                    <p className="text-xs m-0 opacity-70" style={{ color: 'var(--ink-violet)' }}>
                      {fileName}
                    </p>
                  </div>
                </div>
                <button onClick={onClose} className="opacity-70 hover:opacity-100">
                  <X size={24} color="var(--ink-violet)" />
                </button>
              </div>

              {/* Diff content */}
              <div className="flex-1 overflow-y-auto p-4" style={{ background: '#1E1E1E' }}>
                <pre className="m-0 text-xs font-mono" style={{ fontFamily: 'monospace', lineHeight: '1.5' }}>
                  {diff.map((line, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: line.type === 'add' ? 10 : line.type === 'remove' ? -10 : 0 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.01 }}
                      className="px-2"
                      style={{
                        background:
                          line.type === 'add' ? 'rgba(81, 255, 196, 0.2)' :
                          line.type === 'remove' ? 'rgba(255, 51, 102, 0.2)' :
                          'transparent',
                        color:
                          line.type === 'add' ? '#51FFC4' :
                          line.type === 'remove' ? '#FF3366' :
                          '#D4D4D4',
                      }}
                    >
                      <span className="opacity-50 mr-4">{line.lineNumber}</span>
                      <span>{line.type === 'add' ? '+ ' : line.type === 'remove' ? '- ' : '  '}</span>
                      {line.line}
                    </motion.div>
                  ))}
                </pre>
              </div>

              {/* Actions */}
              <div
                className="px-6 py-4 flex gap-3 border-t"
                style={{
                  background: 'rgba(15, 10, 31, 0.05)',
                  borderColor: 'rgba(15, 10, 31, 0.1)',
                }}
              >
                <motion.button
                  onClick={onReject}
                  className="flex-1 px-4 py-3 rounded-lg flex items-center justify-center gap-2"
                  style={{
                    background: 'rgba(255, 51, 102, 0.1)',
                    border: '2px solid #FF3366',
                    color: '#FF3366',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                  whileHover={{ scale: 1.02, background: 'rgba(255, 51, 102, 0.2)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <X size={18} />
                  REJECT
                </motion.button>

                <motion.button
                  onClick={onAccept}
                  className="flex-1 px-4 py-3 rounded-lg flex items-center justify-center gap-2"
                  style={{
                    background: 'var(--mint-glow)',
                    border: 'none',
                    color: 'var(--ink-violet)',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                  whileHover={{ scale: 1.02, boxShadow: '0 4px 16px rgba(81, 255, 196, 0.5)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Check size={18} />
                  ACCEPT CHANGES
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

