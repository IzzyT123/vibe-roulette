import { useState, useEffect } from 'react';
import { Landing } from './pages/Landing';
import { Lobby } from './pages/Lobby';
import { Room } from './pages/Room';
import { SessionEnd } from './pages/SessionEnd';
import { ProjectBrowser } from './pages/ProjectBrowser';
import { FirstRunSetup } from './components/FirstRunSetup';
import { api } from './utils/api';
import { getOrCreateAnonymousUser, getCurrentUserId } from './utils/auth';
import type { Room as RoomType } from './types/contracts';

type AppState = 
  | { screen: 'landing' }
  | { screen: 'lobby'; pendingRoom?: RoomType }
  | { screen: 'room'; room: RoomType }
  | { screen: 'end'; roomId: string }
  | { screen: 'browser' };

export default function App() {
  const [state, setState] = useState<AppState>({ screen: 'landing' });

  // Create anonymous user on mount
  useEffect(() => {
    getOrCreateAnonymousUser().catch(console.error);
  }, []);
  
  const handleSpin = async (anonMode: boolean, sessionLength: number) => {
    console.log('App: handleSpin called');
    
    try {
      const result = await api.spin(anonMode, sessionLength);
      console.log('App: Spin result:', result);
      
      if (result.status === 'matched' && result.room) {
        // Navigator: matched immediately, go to room with animation
        setState({ screen: 'lobby', pendingRoom: result.room });
      } else {
        // Driver: waiting for match, go to lobby
        setState({ screen: 'lobby' });
      }
    } catch (error) {
      console.error('Error spinning:', error);
      setState({ screen: 'landing' });
    }
  };
  
  const handleMatched = async () => {
    console.log('App: handleMatched called');
    
    // If we have a pending room from the spin, use it
    if (state.screen === 'lobby' && state.pendingRoom) {
      console.log('App: Using pending room:', state.pendingRoom.id);
      setState({ screen: 'room', room: state.pendingRoom });
      return;
    }
    
    // Otherwise, get user's current session
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('No user ID found');
      return;
    }

    try {
      console.log('App: Getting current session for user:', userId);
      
      const { supabase } = await import('./utils/supabase');
      
      // Get sessions where user is a participant
      const { data: participants } = await supabase
        .from('session_participants')
        .select('session_id')
        .eq('user_id', userId)
        .order('joined_at', { ascending: false })
        .limit(1)
        .single();

      console.log('App: Participants query result:', participants);

      if (participants) {
        const { room } = await api.getRoom(participants.session_id);
        console.log('App: Got room:', room.id);
        setState({ screen: 'room', room });
      } else {
        console.log('App: No participant found');
        setState({ screen: 'landing' });
      }
    } catch (error) {
      console.error('Error in handleMatched:', error);
      setState({ screen: 'landing' });
    }
  };
  
  const handleSessionEnd = () => {
    if (state.screen === 'room') {
      setState({ screen: 'end', roomId: state.room.id });
    }
  };
  
  const handleRestart = () => {
    setState({ screen: 'landing' });
  };
  
  const handleViewRemix = (noteId: string) => {
    // In a real app, navigate to remix view
    console.log('View remix:', noteId);
    setState({ screen: 'landing' });
  };

  const handleBrowseProjects = () => {
    setState({ screen: 'browser' });
  };

  const handleJoinSession = async (sessionId: string) => {
    try {
      const { room } = await api.joinActiveSession(sessionId);
      setState({ screen: 'room', room });
    } catch (error) {
      console.error('Error joining session:', error);
      alert('Failed to join session. Please try again.');
    }
  };

  const handleCreateNew = () => {
    setState({ screen: 'landing' });
  };
  
  return (
    <>
      {/* First run setup - collects API key BEFORE user starts */}
      <FirstRunSetup onComplete={() => {
        // Setup complete, user can now start
      }} />
      
      {state.screen === 'landing' && (
        <Landing onSpin={handleSpin} />
      )}
      
      {state.screen === 'lobby' && (
        <Lobby onMatched={handleMatched} />
      )}
      
      {state.screen === 'room' && (
        <Room 
          room={state.room} 
          onSessionEnd={handleSessionEnd}
          onBrowseProjects={handleBrowseProjects}
          onSpinAgain={async () => {
            // Leave current session and start new spin
            if (state.screen === 'room') {
              const userId = getCurrentUserId();
              if (userId) {
                try {
                  const { leaveSession } = await import('./utils/sessionService');
                  await leaveSession(state.room.id, userId);
                } catch (error) {
                  console.error('Error leaving session:', error);
                }
              }
            }
            // Go to landing to spin again
            setState({ screen: 'landing' });
          }}
        />
      )}
      
      {state.screen === 'browser' && (
        <ProjectBrowser
          onJoinSession={handleJoinSession}
          onCreateNew={handleCreateNew}
        />
      )}
      
      {state.screen === 'end' && (
        <SessionEnd 
          roomId={state.roomId}
          onRestart={handleRestart}
          onViewRemix={handleViewRemix}
        />
      )}
    </>
  );
}

