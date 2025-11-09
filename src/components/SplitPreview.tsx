import { motion } from 'motion/react';
import { Monitor, User, Users } from 'lucide-react';
import { LivePreview } from './LivePreview';

interface SplitPreviewProps {
  yourCode: string;
  partnerCode: string;
  yourFiles: Map<string, string>;
  partnerFiles: Map<string, string>;
  onErrorDetected?: (error: string) => void;
  onFixRequested?: (error: string, files: Map<string, string>) => void;
}

export function SplitPreview({
  yourCode,
  partnerCode,
  yourFiles,
  partnerFiles,
  onErrorDetected,
  onFixRequested,
}: SplitPreviewProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div
        className="flex items-center justify-center gap-2 px-4 py-2 border-b"
        style={{
          background: 'var(--ink-violet)',
          borderColor: 'var(--border)',
        }}
      >
        <Users size={18} color="var(--mint-glow)" />
        <span className="text-sm font-bold" style={{ color: 'var(--ticket-cream)', fontFamily: 'var(--font-display)' }}>
          SPLIT VIEW
        </span>
      </div>

      {/* Split previews */}
      <div className="flex-1 flex overflow-hidden">
        {/* Your preview */}
        <div className="flex-1 flex flex-col border-r" style={{ borderColor: 'var(--border)' }}>
          <div
            className="px-3 py-2 border-b flex items-center gap-2"
            style={{
              background: 'rgba(255, 106, 0, 0.1)',
              borderColor: 'var(--border)',
            }}
          >
            <User size={14} color="var(--neon-orange)" />
            <span className="text-xs font-bold" style={{ color: 'var(--neon-orange)', fontFamily: 'var(--font-display)' }}>
              YOUR VIEW
            </span>
          </div>
          <div className="flex-1">
            <LivePreview
              code={yourCode}
              allFiles={yourFiles}
              onErrorDetected={onErrorDetected}
              onFixRequested={onFixRequested}
            />
          </div>
        </div>

        {/* Partner preview */}
        <div className="flex-1 flex flex-col">
          <div
            className="px-3 py-2 border-b flex items-center gap-2"
            style={{
              background: 'rgba(177, 107, 255, 0.1)',
              borderColor: 'var(--border)',
            }}
          >
            <User size={14} color="var(--orchid-electric)" />
            <span className="text-xs font-bold" style={{ color: 'var(--orchid-electric)', fontFamily: 'var(--font-display)' }}>
              PARTNER VIEW
            </span>
          </div>
          <div className="flex-1">
            <LivePreview
              code={partnerCode}
              allFiles={partnerFiles}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

