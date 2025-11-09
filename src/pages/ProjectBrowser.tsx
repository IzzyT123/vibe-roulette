import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Code, Clock, ArrowRight, Plus, Search } from 'lucide-react';
import { api } from '../utils/api';
import type { Room } from '../types/contracts';

interface ProjectBrowserProps {
  onJoinSession: (sessionId: string) => void;
  onCreateNew: () => void;
}

export function ProjectBrowser({ onJoinSession, onCreateNew }: ProjectBrowserProps) {
  const [sessions, setSessions] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadActiveSessions();
    // Refresh every 5 seconds
    const interval = setInterval(loadActiveSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadActiveSessions = async () => {
    try {
      setIsLoading(true);
      const activeSessions = await api.browseActiveSessions();
      setSessions(activeSessions);
    } catch (error) {
      console.error('Error loading active sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      session.id.toLowerCase().includes(query) ||
      session.constraints.some(c => 
        c.label.toLowerCase().includes(query) ||
        c.details?.toLowerCase().includes(query)
      )
    );
  });

  return (
    <div className="min-h-screen p-8" style={{ background: 'var(--ink-violet)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 
                className="text-4xl m-0 mb-2"
                style={{ 
                  fontFamily: 'var(--font-display)', 
                  color: 'var(--ticket-cream)',
                  background: 'var(--grad-arcade)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Browse Projects
              </h1>
              <p className="text-lg m-0 opacity-70" style={{ color: 'var(--ticket-cream)' }}>
                Join active sessions or start a new one
              </p>
            </div>
            <motion.button
              onClick={onCreateNew}
              className="flex items-center gap-2 px-6 py-3 rounded-lg"
              style={{
                background: 'var(--neon-orange)',
                color: 'var(--ink-violet)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={20} />
              New Session
            </motion.button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search 
              size={20} 
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--ticket-cream)', opacity: 0.5 }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-12 pr-4 py-3 rounded-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid var(--border)',
                color: 'var(--ticket-cream)',
                fontFamily: 'var(--font-body)',
              }}
            />
          </div>
        </motion.div>

        {/* Sessions Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="inline-block"
            >
              <Code size={48} color="var(--mint-glow)" />
            </motion.div>
            <p className="mt-4" style={{ color: 'var(--ticket-cream)' }}>
              Loading projects...
            </p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-12">
            <Users size={64} color="var(--ticket-cream)" style={{ opacity: 0.3 }} />
            <p className="mt-4 text-lg" style={{ color: 'var(--ticket-cream)', opacity: 0.7 }}>
              {searchQuery ? 'No projects match your search' : 'No active projects yet'}
            </p>
            {!searchQuery && (
              <motion.button
                onClick={onCreateNew}
                className="mt-6 px-6 py-3 rounded-lg"
                style={{
                  background: 'var(--mint-glow)',
                  color: 'var(--ink-violet)',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Create First Project
              </motion.button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredSessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-lg p-6 cursor-pointer"
                  style={{
                    background: 'var(--ticket-cream)',
                    border: '2px solid var(--border)',
                  }}
                  whileHover={{ 
                    scale: 1.02,
                    borderColor: 'var(--mint-glow)',
                    boxShadow: '0 8px 24px rgba(81, 255, 196, 0.2)'
                  }}
                  onClick={() => onJoinSession(session.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Code size={20} color="var(--ink-violet)" />
                      <h3 
                        className="m-0 text-lg"
                        style={{ 
                          fontFamily: 'var(--font-display)', 
                          color: 'var(--ink-violet)' 
                        }}
                      >
                        {session.id.slice(0, 8)}...
                      </h3>
                    </div>
                    <motion.div
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <ArrowRight size={20} color="var(--neon-orange)" />
                    </motion.div>
                  </div>

                  {session.constraints.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {session.constraints.slice(0, 2).map((constraint) => (
                          <span
                            key={constraint.id}
                            className="px-2 py-1 rounded text-xs"
                            style={{
                              background: 'rgba(177, 107, 255, 0.1)',
                              color: 'var(--orchid-electric)',
                              border: '1px solid var(--orchid-electric)',
                            }}
                          >
                            {constraint.label}
                          </span>
                        ))}
                        {session.constraints.length > 2 && (
                          <span
                            className="px-2 py-1 rounded text-xs"
                            style={{
                              background: 'rgba(0, 0, 0, 0.1)',
                              color: 'var(--ink-violet)',
                              opacity: 0.6,
                            }}
                          >
                            +{session.constraints.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--ink-violet)', opacity: 0.6 }}>
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      <span>Active</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

