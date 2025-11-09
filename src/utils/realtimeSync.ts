import { supabase, isSupabaseConfigured } from './supabase';
import { getCurrentUserId } from './auth';

export interface FileChange {
  sessionId: string;
  filePath: string;
  content: string;
  updatedBy: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  message: string;
  createdAt: string;
}

type FileChangeCallback = (change: FileChange) => void;
type ChatMessageCallback = (message: ChatMessage) => void;

/**
 * Subscribe to file changes for a session
 */
export function subscribeToSessionFiles(
  sessionId: string,
  callback: FileChangeCallback
): () => void {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured - realtime sync disabled');
    // Return no-op unsubscribe for development
    return () => {};
  }

  console.log('Subscribing to session files:', sessionId);
  
  const channel = supabase
    .channel(`session_files:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'session_files',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        const newData = payload.new as Record<string, any>;
        const oldData = payload.old as Record<string, any>;
        
        console.log('Realtime file change received:', {
          eventType: payload.eventType,
          filePath: newData?.file_path || oldData?.file_path,
          hasContent: !!(newData?.content)
        });
        
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const fileChange: FileChange = {
            sessionId: newData.session_id,
            filePath: newData.file_path,
            content: newData.content || '',
            updatedBy: newData.updated_by,
            updatedAt: newData.updated_at,
          };
          callback(fileChange);
        } else if (payload.eventType === 'DELETE') {
          // Handle file deletion
          const fileChange: FileChange = {
            sessionId: oldData.session_id,
            filePath: oldData.file_path,
            content: '',
            updatedBy: oldData.updated_by || '',
            updatedAt: new Date().toISOString(),
          };
          callback(fileChange);
        }
      }
    )
    .subscribe((status) => {
      console.log('Realtime subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to file changes for session:', sessionId);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Error subscribing to file changes');
      }
    });

  return () => {
    console.log('Unsubscribing from session files:', sessionId);
    supabase.removeChannel(channel);
  };
}

/**
 * Update a file and broadcast to other users
 */
export async function updateFile(
  sessionId: string,
  filePath: string,
  content: string
): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured - file update skipped');
    // No-op for development
    return;
  }

  console.log('Updating file in Supabase:', {
    sessionId,
    filePath,
    contentLength: content.length,
    userId
  });

  const { data, error } = await supabase
    .from('session_files')
    .upsert(
      {
        session_id: sessionId,
        file_path: filePath,
        content: content,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'session_id,file_path',
      }
    )
    .select();

  if (error) {
    console.error('Error updating file:', error);
    throw new Error(`Failed to update file: ${error.message}`);
  }

  console.log('File updated successfully:', {
    filePath,
    data: data?.[0]?.id
  });
}

/**
 * Get all files for a session
 */
export async function getSessionFiles(sessionId: string): Promise<Map<string, string>> {
  if (!isSupabaseConfigured()) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('session_files')
    .select('file_path, content')
    .eq('session_id', sessionId);

  if (error) {
    console.error('Error fetching session files:', error);
    return new Map();
  }

  const files = new Map<string, string>();
  (data || []).forEach((file) => {
    files.set(file.file_path, file.content || '');
  });

  return files;
}

/**
 * Subscribe to chat messages for a session
 */
export function subscribeToSessionChat(
  sessionId: string,
  callback: ChatMessageCallback
): () => void {
  if (!isSupabaseConfigured()) {
    return () => {};
  }

  const channel = supabase
    .channel(`session_chat:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'session_chat',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        const message: ChatMessage = {
          id: payload.new.id,
          sessionId: payload.new.session_id,
          userId: payload.new.user_id,
          message: payload.new.message,
          createdAt: payload.new.created_at,
        };
        callback(message);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Send a chat message
 */
export async function sendChatMessage(
  sessionId: string,
  message: string
): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  if (!isSupabaseConfigured()) {
    // No-op for development
    return;
  }

  const { error } = await supabase.from('session_chat').insert({
    session_id: sessionId,
    user_id: userId,
    message: message,
  });

  if (error) {
    console.error('Error sending chat message:', error);
    throw new Error(`Failed to send message: ${error.message}`);
  }
}

/**
 * Get chat history for a session
 */
export async function getSessionChatHistory(sessionId: string): Promise<ChatMessage[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from('session_chat')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching chat history:', error);
    return [];
  }

  return (data || []).map((msg) => ({
    id: msg.id,
    sessionId: msg.session_id,
    userId: msg.user_id,
    message: msg.message,
    createdAt: msg.created_at,
  })) as ChatMessage[];
}

