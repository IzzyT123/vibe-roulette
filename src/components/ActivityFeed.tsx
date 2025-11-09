import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Save, 
  FilePlus, 
  Sparkles, 
  Wrench, 
  Eye,
  Clock
} from 'lucide-react';

export interface Activity {
  id: string;
  userId: string;
  actionType: 'file_opened' | 'file_saved' | 'file_created' | 'ai_request' | 'code_generated' | 'error_fixed' | 'tab_switched';
  actionData?: Record<string, any>;
  timestamp: Date;
  isCurrentUser: boolean;
}

interface ActivityFeedProps {
  activities: Activity[];
}

const actionIcons = {
  file_opened: Eye,
  file_saved: Save,
  file_created: FilePlus,
  ai_request: Sparkles,
  code_generated: Sparkles,
  error_fixed: Wrench,
  tab_switched: FileText,
};

const actionColors = {
  file_opened: 'var(--orchid-electric)',
  file_saved: 'var(--mint-glow)',
  file_created: 'var(--neon-orange)',
  ai_request: 'var(--orchid-electric)',
  code_generated: 'var(--mint-glow)',
  error_fixed: 'var(--neon-orange)',
  tab_switched: 'var(--ticket-cream)',
};

const formatActionMessage = (activity: Activity): string => {
  const user = activity.isCurrentUser ? 'You' : 'Partner';
  const data = activity.actionData || {};
  
  switch (activity.actionType) {
    case 'file_opened':
      return `${user} opened ${data.fileName || 'a file'}`;
    case 'file_saved':
      return `${user} saved ${data.fileName || 'a file'}`;
    case 'file_created':
      return `${user} created ${data.fileName || 'a file'}`;
    case 'ai_request':
      return `${user} asked AI: "${data.prompt?.substring(0, 30)}..."`;
    case 'code_generated':
      return `AI generated code for ${user}`;
    case 'error_fixed':
      return `${user} fixed errors`;
    case 'tab_switched':
      return `${user} switched to ${data.fileName || 'another tab'}`;
    default:
      return `${user} performed an action`;
  }
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const feedEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activities]);

  return (
    <div className="h-full flex flex-col">
      <div 
        className="px-3 py-2 border-b flex items-center gap-2"
        style={{
          background: 'rgba(15, 10, 31, 0.3)',
          borderColor: 'var(--border)',
        }}
      >
        <Clock size={14} color="var(--mint-glow)" />
        <span 
          className="text-xs font-bold"
          style={{ 
            color: 'var(--ticket-cream)',
            fontFamily: 'var(--font-display)'
          }}
        >
          ACTIVITY LOG
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <AnimatePresence mode="popLayout">
          {activities.map((activity) => {
            const Icon = actionIcons[activity.actionType];
            const color = actionColors[activity.actionType];
            
            return (
              <motion.div
                key={activity.id}
                layout
                initial={{ x: -20, opacity: 0, scale: 0.95 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: -20, opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="px-2 py-1.5 rounded flex items-start gap-2"
                style={{
                  background: activity.isCurrentUser 
                    ? 'rgba(255, 106, 0, 0.1)' 
                    : 'rgba(177, 107, 255, 0.1)',
                  border: `1px solid ${activity.isCurrentUser ? 'rgba(255, 106, 0, 0.3)' : 'rgba(177, 107, 255, 0.3)'}`,
                }}
              >
                <Icon size={14} color={color} className="mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p 
                    className="text-xs m-0 leading-tight"
                    style={{ color: 'var(--ticket-cream)' }}
                  >
                    {formatActionMessage(activity)}
                  </p>
                  <p 
                    className="text-xs m-0 opacity-50 mt-0.5"
                    style={{ color: 'var(--ticket-cream)' }}
                  >
                    {activity.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {activities.length === 0 && (
          <div 
            className="text-center py-8 text-xs opacity-50"
            style={{ color: 'var(--ticket-cream)' }}
          >
            No activity yet. Start coding!
          </div>
        )}
        
        <div ref={feedEndRef} />
      </div>
    </div>
  );
}

