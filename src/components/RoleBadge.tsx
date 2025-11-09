import { motion } from 'motion/react';
import { Zap, Eye, Sparkles } from 'lucide-react';

interface RoleBadgeProps {
  role: 'Driver' | 'Navigator';
  size?: 'sm' | 'md' | 'lg';
}

export function RoleBadge({ role, size = 'md' }: RoleBadgeProps) {
  const isDriver = role === 'Driver';
  
  const sizeClasses = {
    sm: { icon: 12, text: 'text-xs', padding: 'px-2 py-1' },
    md: { icon: 14, text: 'text-sm', padding: 'px-3 py-1' },
    lg: { icon: 18, text: 'text-base', padding: 'px-4 py-2' },
  };
  
  const config = sizeClasses[size];
  
  const roleInfo = {
    Driver: {
      icon: Zap,
      color: 'var(--neon-orange)',
      bgGradient: 'linear-gradient(135deg, var(--neon-orange), rgba(255, 106, 0, 0.7))',
      shadowColor: 'rgba(255, 106, 0, 0.5)',
      description: 'Write & Navigate',
    },
    Navigator: {
      icon: Eye,
      color: 'var(--orchid-electric)',
      bgGradient: 'linear-gradient(135deg, var(--orchid-electric), rgba(177, 107, 255, 0.7))',
      shadowColor: 'rgba(177, 107, 255, 0.5)',
      description: 'Guide & Review',
    },
  };
  
  const info = roleInfo[role];
  const Icon = info.icon;
  
  return (
    <motion.div
      className={`${config.padding} rounded-full ${config.text} flex items-center gap-2 relative overflow-hidden`}
      style={{
        background: info.bgGradient,
        color: 'var(--ink-violet)',
        fontFamily: 'var(--font-display)',
        fontWeight: 'bold',
        boxShadow: `0 0 20px ${info.shadowColor}`,
      }}
      whileHover={{ scale: 1.05, boxShadow: `0 0 30px ${info.shadowColor}` }}
      animate={{
        boxShadow: [
          `0 0 20px ${info.shadowColor}`,
          `0 0 30px ${info.shadowColor}`,
          `0 0 20px ${info.shadowColor}`,
        ],
      }}
      transition={{
        boxShadow: {
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      }}
    >
      {/* Animated background particles */}
      <motion.div
        className="absolute inset-0 opacity-20"
        animate={{
          background: [
            `radial-gradient(circle at 0% 50%, ${info.color}, transparent 50%)`,
            `radial-gradient(circle at 100% 50%, ${info.color}, transparent 50%)`,
            `radial-gradient(circle at 50% 0%, ${info.color}, transparent 50%)`,
            `radial-gradient(circle at 50% 100%, ${info.color}, transparent 50%)`,
            `radial-gradient(circle at 0% 50%, ${info.color}, transparent 50%)`,
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Icon with pulse animation */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: isDriver ? [0, 5, -5, 0] : [0, 0, 0, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Icon size={config.icon} />
      </motion.div>
      
      {/* Role text */}
      <span className="relative z-10">{role}</span>
      
      {/* Sparkles for extra flair */}
      <motion.div
        className="absolute -right-1 -top-1"
        animate={{
          rotate: 360,
          scale: [1, 1.3, 1],
        }}
        transition={{
          rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
          scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <Sparkles size={config.icon * 0.6} color="var(--mint-glow)" />
      </motion.div>
    </motion.div>
  );
}

