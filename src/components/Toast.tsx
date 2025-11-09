import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { ReactNode } from 'react';

export type ToastType = 'success' | 'warn' | 'info' | 'error';

interface ToastProps {
  id: string;
  type: ToastType;
  message: ReactNode;
  onClose: () => void;
}

const iconMap = {
  success: CheckCircle,
  warn: AlertCircle,
  info: Info,
  error: AlertCircle
};

const colorMap = {
  success: 'var(--mint-glow)',
  warn: 'var(--neon-orange)',
  info: 'var(--orchid-electric)',
  error: '#FF3366'
};

export function Toast({ id, type, message, onClose }: ToastProps) {
  const Icon = iconMap[type];
  const color = colorMap[type];
  
  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="relative flex items-center gap-3 p-4 rounded-lg min-w-80 max-w-md"
      style={{
        background: 'var(--ticket-cream)',
        border: '2px solid',
        borderColor: color,
        boxShadow: `0 4px 16px ${color}40`
      }}
    >
      {/* Die-cut corner */}
      <div 
        className="absolute top-0 right-0 w-3 h-3"
        style={{
          background: 'var(--ink-violet)',
          clipPath: 'polygon(100% 0, 100% 100%, 0 0)'
        }}
      />
      
      <Icon size={20} color={color} strokeWidth={2.5} />
      
      <div className="flex-1" style={{ color: 'var(--ink-violet)' }}>
        {message}
      </div>
      
      <button
        onClick={onClose}
        className="opacity-50 hover:opacity-100 transition-opacity"
        style={{ color: 'var(--ink-violet)' }}
      >
        <X size={18} />
      </button>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: Array<{ id: string; type: ToastType; message: ReactNode }>;
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => onDismiss(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

