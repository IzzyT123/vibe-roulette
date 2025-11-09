import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Monitor, RefreshCw, AlertCircle } from 'lucide-react';
import { generatePreviewHTML } from '../utils/multiFileBundler';

interface LivePreviewProps {
  code: string;
  loading?: boolean;
  allFiles?: Map<string, string>;
  onErrorDetected?: (error: string, filePath?: string) => void;
  onFixRequested?: (error: string, allFiles: Map<string, string>) => void;
}

export function LivePreview({ code, loading = false, allFiles, onErrorDetected, onFixRequested }: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<{ message: string; stack?: string } | null>(null);
  const [scanlinesEnabled, setScanlinesEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isFixing, setIsFixing] = useState(false);

  useEffect(() => {
    if (!iframeRef.current) return;

    try {
      setError(null);
      setErrorDetails(null);
      
      // Create a stable key from file contents to detect changes
      const filesKey = allFiles && allFiles.size > 0
        ? Array.from(allFiles.entries())
            .map(([path, content]) => `${path}:${content.length}`)
            .join('|')
        : `code:${code.length}`;
      
      console.log('LivePreview rendering with:', {
        codeLength: code.length,
        fileCount: allFiles?.size || 0,
        files: allFiles ? Array.from(allFiles.keys()) : [],
        filesKey: filesKey.substring(0, 100) // Log first 100 chars
      });
      
      // Use multi-file bundler if we have multiple files
      const html = (allFiles && allFiles.size > 0)
        ? generatePreviewHTML(allFiles)
        : generatePreviewHTML(new Map([['/src/App.tsx', code]]));

      console.log('Generated HTML length:', html.length);

      // Use srcdoc instead of contentDocument to avoid CORS issues
      const iframe = iframeRef.current;
      // Force update by setting to empty first, then new content
      // This ensures the iframe reloads even if HTML is similar
      iframe.srcdoc = '';
      // Use requestAnimationFrame to ensure the empty state is processed
      requestAnimationFrame(() => {
        if (iframeRef.current) {
          iframeRef.current.srcdoc = html;
          setLastUpdate(Date.now());
        }
      });

      // Listen for errors from iframe
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'preview-error') {
          const errorMsg = event.data.error || 'Unknown error';
          const errorStack = event.data.stack;
          setError(errorMsg);
          setErrorDetails({ message: errorMsg, stack: errorStack });
          if (onErrorDetected) {
            onErrorDetected(errorMsg);
          }
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    } catch (err) {
      console.error('Preview error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to render preview';
      setError(errorMsg);
      setErrorDetails({ message: errorMsg });
      if (onErrorDetected) {
        onErrorDetected(errorMsg);
      }
    }
  }, [code, allFiles, onErrorDetected]);

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
    setError(null);
    setErrorDetails(null);
  };

  const handleFixErrors = async () => {
    if (!allFiles || allFiles.size === 0 || !onFixRequested) return;
    setIsFixing(true);
    try {
      if (errorDetails) {
        await onFixRequested(errorDetails.message, allFiles);
      }
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* CRT Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{
          background: 'var(--ink-violet)',
          borderColor: 'var(--border)'
        }}
      >
        <div className="flex items-center gap-2">
          <Monitor size={18} color="var(--mint-glow)" />
          <span className="text-sm" style={{ color: 'var(--ticket-cream)' }}>
            LIVE PREVIEW
          </span>
          {lastUpdate && (
            <span className="text-xs opacity-50" style={{ color: 'var(--ticket-cream)' }}>
              Updated {new Date(lastUpdate).toLocaleTimeString()}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded transition-opacity hover:opacity-80"
            style={{ color: 'var(--ticket-cream)' }}
            title="Refresh preview"
          >
            <RefreshCw size={16} />
          </button>
          
          <button
            onClick={() => setScanlinesEnabled(!scanlinesEnabled)}
            className="px-2 py-1 rounded text-xs transition-opacity hover:opacity-80"
            style={{
              background: scanlinesEnabled ? 'var(--mint-glow)' : 'rgba(255,255,255,0.1)',
              color: scanlinesEnabled ? 'var(--ink-violet)' : 'var(--ticket-cream)'
            }}
          >
            CRT {scanlinesEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
      
      {/* CRT Screen */}
      <div 
        className="flex-1 relative overflow-hidden"
        style={{
          background: '#000',
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)'
        }}
      >
        {/* Scanlines overlay */}
        {scanlinesEnabled && (
          <div 
            className="absolute inset-0 pointer-events-none z-20 opacity-30"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
              animation: 'flicker 0.15s infinite'
            }}
          />
        )}
        
        {/* Vignette */}
        <div 
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: 'radial-gradient(circle at center, transparent 60%, rgba(0,0,0,0.5) 100%)'
          }}
        />
        
        {/* Loading state */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-30">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="mb-4"
              >
                <RefreshCw size={32} color="var(--mint-glow)" />
              </motion.div>
              <p className="text-sm" style={{ color: 'var(--mint-glow)' }}>
                Building preview...
              </p>
            </div>
          </div>
        )}
        
        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-30 p-4 overflow-auto">
            <div 
              className="max-w-2xl p-6 rounded-lg"
              style={{
                background: 'var(--ticket-cream)',
                border: '2px solid var(--neon-orange)'
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle size={24} color="var(--neon-orange)" />
                <h3 className="m-0" style={{ color: 'var(--ink-violet)' }}>
                  ⚠️ Preview Error
                </h3>
              </div>
              <p className="text-sm mb-3 font-mono" style={{ color: 'var(--ink-violet)' }}>
                {error}
              </p>
              {errorDetails?.stack && (
                <details className="mb-3">
                  <summary className="text-xs cursor-pointer mb-2" style={{ color: 'var(--ink-violet)', opacity: 0.7 }}>
                    Show stack trace
                  </summary>
                  <pre className="text-xs p-3 rounded overflow-auto max-h-40" style={{ 
                    background: 'rgba(0,0,0,0.1)', 
                    color: 'var(--ink-violet)',
                    fontFamily: 'monospace'
                  }}>
                    {errorDetails.stack}
                  </pre>
                </details>
              )}
              {onFixRequested && allFiles && allFiles.size > 0 && (
                <button
                  onClick={handleFixErrors}
                  disabled={isFixing}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                  style={{
                    background: isFixing ? 'rgba(255,106,0,0.5)' : 'var(--neon-orange)',
                    color: 'var(--ink-violet)',
                    border: 'none',
                    cursor: isFixing ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isFixing ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Fixing...
                    </>
                  ) : (
                    <>
                      <AlertCircle size={16} />
                      Auto-Fix with AI
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Preview iframe */}
        {!loading && (
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            title="Live Preview"
            sandbox="allow-scripts"
            style={{ background: 'white' }}
          />
        )}
      </div>
      
      <style>{`
        @keyframes flicker {
          0% { opacity: 0.27; }
          50% { opacity: 0.30; }
          100% { opacity: 0.28; }
        }
      `}</style>
    </div>
  );
}

