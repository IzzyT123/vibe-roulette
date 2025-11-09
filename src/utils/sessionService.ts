import { supabase, isSupabaseConfigured } from './supabase';
import type { Constraint } from '../types/contracts';

export interface Session {
  id: string;
  creator_id: string;
  status: 'waiting' | 'active' | 'completed';
  constraints: Constraint[];
  created_at: string;
  updated_at: string;
}

export interface SessionParticipant {
  session_id: string;
  user_id: string;
  role: 'Driver' | 'Navigator';
  joined_at: string;
}

/**
 * Create a new session with active status (ChatRoulette style)
 */
export async function createSession(userId: string, constraints: Constraint[] = []): Promise<Session> {
  if (!isSupabaseConfigured()) {
    // Fallback for development
    return {
      id: `session-${Date.now()}`,
      creator_id: userId,
      status: 'active',
      constraints,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  console.log('createSession: Creating new active session for user:', userId);

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      creator_id: userId,
      status: 'active', // Sessions are active immediately
      constraints: constraints as any,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }

  console.log('createSession: Created session:', data.id);

  // Add creator as first participant
  await supabase
    .from('session_participants')
    .insert({
      session_id: data.id,
      user_id: userId,
      role: 'Driver',
    });

  return {
    ...data,
    constraints: (data.constraints as any) || [],
  } as Session;
}

/**
 * Find a match - ChatRoulette style: only enter when matched with live user
 */
export async function findMatch(userId: string, constraints: Constraint[] = []): Promise<{ session: Session; role: 'Driver' | 'Navigator' }> {
  if (!isSupabaseConfigured()) {
    // Fallback for development - always create new session
    const session = await createSession(userId, constraints);
    return { session, role: 'Driver' };
  }

  console.log('findMatch: Looking for match for user:', userId);

  // Clean up: Leave ALL sessions user is currently in
  const { data: existingParticipations } = await supabase
    .from('session_participants')
    .select('session_id')
    .eq('user_id', userId);

  if (existingParticipations && existingParticipations.length > 0) {
    console.log('findMatch: User in', existingParticipations.length, 'sessions, leaving all');
    
    const sessionIdsToCleanup = existingParticipations.map(p => p.session_id);
    
    // Delete all participations for this user
    await supabase
      .from('session_participants')
      .delete()
      .eq('user_id', userId);
    
    // Clean up empty sessions
    for (const sessionId of sessionIdsToCleanup) {
      const { data: remainingParticipants } = await supabase
        .from('session_participants')
        .select('user_id')
        .eq('session_id', sessionId);
      
      if (!remainingParticipants || remainingParticipants.length === 0) {
        console.log('findMatch: Deleting empty session:', sessionId);
        await supabase.from('sessions').delete().eq('id', sessionId);
      }
    }
  }

  // Clean up ALL old sessions (sessions older than 1 hour with 0 participants)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  await supabase
    .from('sessions')
    .delete()
    .lt('created_at', oneHourAgo);
  
  console.log('findMatch: Cleaned up old sessions');

  // Find sessions with exactly 1 participant (waiting for match)
  const { data: waitingSessions, error: findError } = await supabase
    .from('sessions')
    .select('*, session_participants(user_id, role)')
    .eq('status', 'waiting')
    .order('created_at', { ascending: true });

  console.log('findMatch: Found waiting sessions:', waitingSessions?.length || 0);

  if (findError) {
    console.error('Error finding waiting sessions:', findError);
  }

  // Filter to sessions with exactly 1 participant
  const availableSessions = waitingSessions?.filter(session => {
    const participants = (session as any).session_participants || [];
    return participants.length === 1;
  }) || [];

  console.log('findMatch: Sessions with 1 participant:', availableSessions.length);

  if (availableSessions.length > 0) {
    // Match with the oldest waiting session
    const targetSession = availableSessions[0];
    
    console.log('findMatch: Matching with waiting session:', targetSession.id);
    
    // Add user as Navigator
    const { error: joinError } = await supabase
      .from('session_participants')
      .insert({
        session_id: targetSession.id,
        user_id: userId,
        role: 'Navigator',
      });

    if (joinError) {
      console.error('Error joining session:', joinError);
      // Create new waiting session instead
      const session = await createWaitingSession(userId, constraints);
      return { session, role: 'Driver' };
    }

    // Update session to active (both users matched)
    await supabase
      .from('sessions')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', targetSession.id);

    console.log('findMatch: Successfully matched! Session now active');

    return {
      session: {
        ...targetSession,
        constraints: (targetSession.constraints as any) || [],
        status: 'active',
      } as Session,
      role: 'Navigator',
    };
  }

  // No waiting sessions found, create new waiting session
  console.log('findMatch: No waiting sessions, creating new waiting session');
  const session = await createWaitingSession(userId, constraints);
  return { session, role: 'Driver' };
}

/**
 * Create a new waiting session (1 user, waiting for match)
 */
async function createWaitingSession(userId: string, constraints: Constraint[] = []): Promise<Session> {
  console.log('createWaitingSession: Creating waiting session for user:', userId);

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      creator_id: userId,
      status: 'waiting',
      constraints: constraints as any,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }

  // Add creator as first participant
  await supabase
    .from('session_participants')
    .insert({
      session_id: data.id,
      user_id: userId,
      role: 'Driver',
    });

  console.log('createWaitingSession: Created waiting session:', data.id);

  return {
    ...data,
    constraints: (data.constraints as any) || [],
  } as Session;
}

/**
 * Join an existing active session
 */
export async function joinSession(sessionId: string, userId: string): Promise<{ session: Session; role: 'Driver' | 'Navigator' }> {
  if (!isSupabaseConfigured()) {
    // Fallback for development
    const session = await getSession(sessionId);
    return { session, role: 'Navigator' };
  }

  // Check if user is already a participant
  const { data: existingParticipant } = await supabase
    .from('session_participants')
    .select('role')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .single();

  if (existingParticipant) {
    const session = await getSession(sessionId);
    return { session, role: existingParticipant.role };
  }

  // Get current participant count to determine role
  const { data: participants } = await supabase
    .from('session_participants')
    .select('role')
    .eq('session_id', sessionId);

  const role: 'Driver' | 'Navigator' = participants && participants.length > 0 ? 'Navigator' : 'Driver';

  // Add user as participant
  const { error } = await supabase
    .from('session_participants')
    .insert({
      session_id: sessionId,
      user_id: userId,
      role,
    });

  if (error) {
    throw new Error(`Failed to join session: ${error.message}`);
  }

  // Update session status to active if it was waiting
  await supabase
    .from('sessions')
    .update({ status: 'active' })
    .eq('id', sessionId)
    .eq('status', 'waiting');

  const session = await getSession(sessionId);
  return { session, role };
}

/**
 * Get all active sessions for browsing
 */
export async function getActiveSessions(): Promise<Session[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('status', 'active')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching active sessions:', error);
    return [];
  }

  return (data || []).map(s => ({
    ...s,
    constraints: (s.constraints as any) || [],
  })) as Session[];
}

/**
 * Get session details
 */
export async function getSession(sessionId: string): Promise<Session> {
  if (!isSupabaseConfigured()) {
    // Fallback for development
    return {
      id: sessionId,
      creator_id: 'unknown',
      status: 'active',
      constraints: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) {
    throw new Error(`Failed to get session: ${error.message}`);
  }

  return {
    ...data,
    constraints: (data.constraints as any) || [],
  } as Session;
}

/**
 * Get session participants
 */
export async function getSessionParticipants(sessionId: string): Promise<SessionParticipant[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from('session_participants')
    .select('*')
    .eq('session_id', sessionId);

  if (error) {
    console.error('Error fetching participants:', error);
    return [];
  }

  return (data || []) as SessionParticipant[];
}

/**
 * Update session status
 */
export async function updateSessionStatus(sessionId: string, status: 'waiting' | 'active' | 'completed'): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  const { error } = await supabase
    .from('sessions')
    .update({ status })
    .eq('id', sessionId);

  if (error) {
    throw new Error(`Failed to update session status: ${error.message}`);
  }
}

/**
 * Leave a session (remove participant)
 */
export async function leaveSession(sessionId: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  const { error } = await supabase
    .from('session_participants')
    .delete()
    .eq('session_id', sessionId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to leave session: ${error.message}`);
  }

  // Check if session has no participants left
  const { data: participants } = await supabase
    .from('session_participants')
    .select('user_id')
    .eq('session_id', sessionId);

  const participantCount = participants?.length || 0;
  console.log('leaveSession: Remaining participants in session:', participantCount);

  // If session is empty, delete it
  if (participantCount === 0) {
    console.log('leaveSession: Session empty, deleting:', sessionId);
    const { error: deleteError } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);

    if (deleteError) {
      console.error('Error deleting empty session:', deleteError);
    } else {
      console.log('leaveSession: Session deleted successfully');
    }
  }
}

