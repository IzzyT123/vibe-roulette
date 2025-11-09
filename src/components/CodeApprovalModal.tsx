import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Eye, Clock, User, Users } from 'lucide-react';
import type { CodeApproval } from '../utils/realtimeSync';

interface CodeApprovalModalProps {
  approval: CodeApproval | null;
  currentUserId: string;
  onApprove: () => void;
  onReject: () => void;
}

export function CodeApprovalModal({ approval, currentUserId, onApprove, onReject }: CodeApprovalModalProps) {
  if (!approval) return null;

  const hasApproved = approval.approvals.includes(currentUserId);
  const isCreator = approval.createdBy === currentUserId;
  const approvalCount = approval.approvals.length;
  const needsApproval = approvalCount < 2;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4"
        style={{ backdropFilter: 'blur(8px)' }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="max-w-2xl w-full rounded-lg overflow-hidden"
          style={{
            background: 'var(--ticket-cream)',
            boxShadow: '0 20px 60px rgba(255, 106, 0, 0.6)',
            border: '2px solid var(--neon-orange)',
          }}
        >
          {/* Header */}
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{
              background: 'var(--neon-orange)',
              borderBottom: '2px solid rgba(15, 10, 31, 0.1)',
            }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Clock size={24} color="var(--ink-violet)" />
              </motion.div>
              <h2
                className="m-0 text-xl"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--ink-violet)',
                }}
              >
                CODE APPROVAL NEEDED
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Users size={18} color="var(--ink-violet)" />
              <span
                className="text-sm font-bold"
                style={{
                  color: 'var(--ink-violet)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                {approvalCount}/2
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div
              className="mb-4 p-3 rounded-lg"
              style={{
                background: 'rgba(255, 106, 0, 0.1)',
                border: '1px solid rgba(255, 106, 0, 0.3)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <User size={16} color="var(--ink-violet)" />
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--ink-violet)' }}
                >
                  {isCreator ? 'You' : 'Your partner'} wants to update:
                </span>
              </div>
              <p
                className="text-lg font-bold m-0"
                style={{
                  color: 'var(--ink-violet)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                {approval.filePath}
              </p>
            </div>

            {/* Code Preview */}
            <div className="mb-4">
              <div
                className="flex items-center gap-2 mb-2 px-2 py-1 rounded-t"
                style={{ background: 'rgba(0, 0, 0, 0.05)' }}
              >
                <Eye size={14} color="var(--ink-violet)" />
                <span
                  className="text-xs opacity-60"
                  style={{ color: 'var(--ink-violet)' }}
                >
                  Preview
                </span>
              </div>
              <pre
                className="p-4 rounded-b overflow-auto max-h-64 text-xs"
                style={{
                  background: 'rgba(0, 0, 0, 0.05)',
                  color: 'var(--ink-violet)',
                  fontFamily: 'monospace',
                  margin: 0,
                }}
              >
                <code>{approval.codeContent.substring(0, 500)}...</code>
              </pre>
            </div>

            {/* Status */}
            {hasApproved && needsApproval && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-lg flex items-center gap-2"
                style={{
                  background: 'rgba(81, 255, 196, 0.1)',
                  border: '1px solid var(--mint-glow)',
                }}
              >
                <Check size={18} color="var(--mint-glow)" />
                <span className="text-sm" style={{ color: 'var(--ink-violet)' }}>
                  ✨ Waiting for your partner's approval...
                </span>
              </motion.div>
            )}

            {/* Actions */}
            {!hasApproved && (
              <div className="flex gap-3">
                <motion.button
                  onClick={onApprove}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-lg font-bold transition-all"
                  style={{
                    background: 'var(--mint-glow)',
                    color: 'var(--ink-violet)',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-display)',
                  }}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: '0 4px 16px rgba(81, 255, 196, 0.5)',
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Check size={20} />
                  APPROVE
                </motion.button>

                <motion.button
                  onClick={onReject}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-lg font-bold transition-all"
                  style={{
                    background: 'rgba(255, 51, 102, 0.2)',
                    color: '#FF3366',
                    border: '2px solid #FF3366',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-display)',
                  }}
                  whileHover={{
                    scale: 1.02,
                    background: 'rgba(255, 51, 102, 0.3)',
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <X size={20} />
                  REJECT
                </motion.button>
              </div>
            )}

            {/* Info */}
            <p
              className="text-xs text-center mt-4 opacity-60 m-0"
              style={{ color: 'var(--ink-violet)' }}
            >
              Both users must approve before the code updates the preview
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

