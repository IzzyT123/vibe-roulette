import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, Sparkles, Users, Rocket } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import { getCurrentUserId } from '../utils/auth';
import { getSession } from '../utils/sessionService';

interface LobbyProps {
  onMatched: () => void;
}

export function Lobby({ onMatched }: LobbyProps) {
  const [status, setStatus] = useState<'searching' | 'matched'>('searching');
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Get user's waiting session and subscribe to status changes
  useEffect(() => {
    const findAndSubscribe = async () => {
      const userId = getCurrentUserId();
      if (!userId || !isSupabaseConfigured()) {
        // Fallback: auto-match after delay
        setTimeout(() => {
          setStatus('matched');
          setTimeout(onMatched, 500);
        }, 2000);
        return;
      }

      console.log('Lobby: Finding user session');

      // Find user's session (should be waiting)
      const { data: participants } = await supabase
        .from('session_participants')
        .select('session_id, sessions!inner(status)')
        .eq('user_id', userId)
        .order('joined_at', { ascending: false })
        .limit(1);

      if (participants && participants.length > 0) {
        const userSessionId = participants[0].session_id;
        const sessionStatus = (participants[0] as any).sessions.status;
        
        console.log('Lobby: Found session:', userSessionId, 'status:', sessionStatus);
        setSessionId(userSessionId);

        // If already active, match immediately
        if (sessionStatus === 'active') {
          setStatus('matched');
          setTimeout(onMatched, 500);
          return;
        }

        // Subscribe to session status changes
        const channel = supabase
          .channel(`lobby:${userSessionId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'sessions',
              filter: `id=eq.${userSessionId}`,
            },
            (payload) => {
              console.log('Lobby: Session update received:', payload.new);
              const session = payload.new as any;
              if (session.status === 'active') {
                console.log('Lobby: Session became active, matching!');
                setStatus('matched');
                setTimeout(onMatched, 500);
              }
            }
          )
          .subscribe((subscriptionStatus) => {
            console.log('Lobby: Subscription status:', subscriptionStatus);
            if (subscriptionStatus === 'CHANNEL_ERROR') {
              console.error('Lobby: Subscription failed - will rely on polling');
            }
          });

        // Poll as backup (critical for when realtime fails)
        let hasMatched = false;
        const pollInterval = setInterval(async () => {
          if (hasMatched) return;
          
          const { data: session } = await supabase
            .from('sessions')
            .select('status')
            .eq('id', userSessionId)
            .single();
          
          console.log('Lobby: Polling session status:', session?.status);
          
          if (session && session.status === 'active') {
            console.log('Lobby: Poll detected active session!');
            hasMatched = true;
            setStatus('matched');
            setTimeout(onMatched, 500);
          }
        }, 500); // Poll every 500ms

        return () => {
          console.log('Lobby: Cleaning up');
          supabase.removeChannel(channel);
          clearInterval(pollInterval);
        };
      }
    };

    findAndSubscribe();
  }, [onMatched]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <div className="max-w-xl w-full space-y-8 relative z-10">
        <motion.div
          className="overflow-hidden rounded-lg p-6"
          style={{
            background: 'var(--ticket-cream)',
            border: '3px solid var(--neon-orange)',
            boxShadow: '0 8px 32px rgba(255, 106, 0, 0.4)',
          }}
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              {status === 'matched' ? (
                <Sparkles size={32} color="var(--mint-glow)" fill="var(--mint-glow)" />
              ) : (
                <Loader2 size={32} color="var(--neon-orange)" />
              )}
            </motion.div>
            
            <h2 
              className="m-0"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--ink-violet)'
              }}
            >
              {status === 'matched' ? '🎯 MATCH FOUND!' : 'SEEKING PARTNER...'}
            </h2>
          </div>
        </motion.div>
        
        <motion.div className="text-center">
          {status === 'searching' && (
            <div className="flex items-center justify-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 size={24} color="var(--mint-glow)" />
              </motion.div>
              <p className="m-0" style={{ color: 'var(--ticket-cream)', fontFamily: 'var(--font-display)' }}>
                Scanning the arcade for collaborators...
              </p>
            </div>
          )}
          {status === 'matched' && (
            <div className="flex items-center justify-center gap-3">
              <Sparkles size={24} color="var(--mint-glow)" />
              <p className="m-0" style={{ color: 'var(--mint-glow)', fontFamily: 'var(--font-display)' }}>
                Match found! Starting session...
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

