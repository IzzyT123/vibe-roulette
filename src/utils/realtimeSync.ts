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
  role?: 'user' | 'assistant'; // Optional for backwards compatibility
  createdAt: string;
}

type FileChangeCallback = (change: FileChange) => void;
type ChatMessageCallback = (message: ChatMessage) => void;
type TypingStatusCallback = (userId: string, isTyping: boolean) => void;
type CodeApprovalCallback = (approval: CodeApproval) => void;
type CursorPositionCallback = (position: CursorPosition) => void;
type ActivityCallback = (activity: SessionActivity) => void;

export interface SessionActivity {
  id: string;
  sessionId: string;
  userId: string;
  actionType: 'file_opened' | 'file_saved' | 'file_created' | 'ai_request' | 'code_generated' | 'error_fixed' | 'tab_switched';
  actionData?: Record<string, any>;
  createdAt: string;
}

export interface CursorPosition {
  sessionId: string;
  userId: string;
  filePath: string;
  lineNumber: number;
  columnNumber: number;
  selectionStartLine?: number;
  selectionStartColumn?: number;
  selectionEndLine?: number;
  selectionEndColumn?: number;
  updatedAt: string;
}

export interface CodeApproval {
  id: string;
  sessionId: string;
  changeId: string;
  filePath: string;
  codeContent: string;
  createdBy: string;
  approvals: string[]; // Array of user IDs who approved
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

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
 * Send a chat message with role (user or assistant)
 */
export async function sendChatMessage(
  sessionId: string,
  message: string,
  role: 'user' | 'assistant' = 'user'
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
    role: role,
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
    role: msg.role || 'user', // Default to 'user' for backwards compatibility
    createdAt: msg.created_at,
  })) as ChatMessage[];
}

/**
 * Update typing status for a user
 */
export async function updateTypingStatus(
  sessionId: string,
  isTyping: boolean
): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId || !isSupabaseConfigured()) return;

  const { error } = await supabase
    .from('session_typing')
    .upsert(
      {
        session_id: sessionId,
        user_id: userId,
        is_typing: isTyping,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'session_id,user_id',
      }
    );

  if (error) {
    console.error('Error updating typing status:', error);
  }
}

/**
 * Subscribe to typing status changes
 */
export function subscribeToTypingStatus(
  sessionId: string,
  callback: TypingStatusCallback
): () => void {
  if (!isSupabaseConfigured()) {
    return () => {};
  }

  const channel = supabase
    .channel(`typing:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'session_typing',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const data = payload.new as any;
          callback(data.user_id, data.is_typing);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Create a code approval request
 */
export async function createCodeApproval(
  sessionId: string,
  filePath: string,
  codeContent: string
): Promise<string> {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  if (!isSupabaseConfigured()) {
    return 'mock-change-id';
  }

  const changeId = `change-${Date.now()}`;

  const { error } = await supabase.from('code_approvals').insert({
    session_id: sessionId,
    change_id: changeId,
    file_path: filePath,
    code_content: codeContent,
    created_by: userId,
    approvals: [userId], // Creator auto-approves
    status: 'pending',
  });

  if (error) {
    console.error('Error creating code approval:', error);
    throw new Error(`Failed to create approval: ${error.message}`);
  }

  return changeId;
}

/**
 * Approve a code change
 */
export async function approveCodeChange(
  sessionId: string,
  changeId: string
): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId || !isSupabaseConfigured()) return;

  // Get current approval
  const { data: approval, error: fetchError } = await supabase
    .from('code_approvals')
    .select('*')
    .eq('session_id', sessionId)
    .eq('change_id', changeId)
    .single();

  if (fetchError || !approval) {
    console.error('Error fetching approval:', fetchError);
    return;
  }

  const approvals = approval.approvals || [];
  if (!approvals.includes(userId)) {
    approvals.push(userId);
  }

  // Check if we have 2 approvals (both users)
  const status = approvals.length >= 2 ? 'approved' : 'pending';

  const { error } = await supabase
    .from('code_approvals')
    .update({
      approvals,
      status,
    })
    .eq('session_id', sessionId)
    .eq('change_id', changeId);

  if (error) {
    console.error('Error approving code:', error);
  }
}

/**
 * Reject a code change
 */
export async function rejectCodeChange(
  sessionId: string,
  changeId: string
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const { error } = await supabase
    .from('code_approvals')
    .update({ status: 'rejected' })
    .eq('session_id', sessionId)
    .eq('change_id', changeId);

  if (error) {
    console.error('Error rejecting code:', error);
  }
}

/**
 * Subscribe to code approval changes
 */
export function subscribeToCodeApprovals(
  sessionId: string,
  callback: CodeApprovalCallback
): () => void {
  if (!isSupabaseConfigured()) {
    return () => {};
  }

  const channel = supabase
    .channel(`approvals:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'code_approvals',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const data = payload.new as any;
          const approval: CodeApproval = {
            id: data.id,
            sessionId: data.session_id,
            changeId: data.change_id,
            filePath: data.file_path,
            codeContent: data.code_content,
            createdBy: data.created_by,
            approvals: data.approvals || [],
            status: data.status,
            createdAt: data.created_at,
          };
          callback(approval);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Get pending code approvals for a session
 */
export async function getPendingApprovals(sessionId: string): Promise<CodeApproval[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from('code_approvals')
    .select('*')
    .eq('session_id', sessionId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending approvals:', error);
    return [];
  }

  return (data || []).map((item) => ({
    id: item.id,
    sessionId: item.session_id,
    changeId: item.change_id,
    filePath: item.file_path,
    codeContent: item.code_content,
    createdBy: item.created_by,
    approvals: item.approvals || [],
    status: item.status,
    createdAt: item.created_at,
  })) as CodeApproval[];
}

/**
 * Update cursor position for collaborative editing
 */
export async function updateCursorPosition(
  sessionId: string,
  filePath: string,
  lineNumber: number,
  columnNumber: number,
  selection?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  }
): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId || !isSupabaseConfigured()) return;

  const { error } = await supabase
    .from('cursor_positions')
    .upsert(
      {
        session_id: sessionId,
        user_id: userId,
        file_path: filePath,
        line_number: lineNumber,
        column_number: columnNumber,
        selection_start_line: selection?.startLine,
        selection_start_column: selection?.startColumn,
        selection_end_line: selection?.endLine,
        selection_end_column: selection?.endColumn,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'session_id,user_id',
      }
    );

  if (error) {
    console.error('Error updating cursor position:', error);
  }
}

/**
 * Subscribe to cursor position changes
 */
export function subscribeToCursorPositions(
  sessionId: string,
  callback: CursorPositionCallback
): () => void {
  if (!isSupabaseConfigured()) {
    return () => {};
  }

  const channel = supabase
    .channel(`cursors:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'cursor_positions',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const data = payload.new as any;
          const position: CursorPosition = {
            sessionId: data.session_id,
            userId: data.user_id,
            filePath: data.file_path,
            lineNumber: data.line_number,
            columnNumber: data.column_number,
            selectionStartLine: data.selection_start_line,
            selectionStartColumn: data.selection_start_column,
            selectionEndLine: data.selection_end_line,
            selectionEndColumn: data.selection_end_column,
            updatedAt: data.updated_at,
          };
          callback(position);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Log an activity action
 */
export async function logActivity(
  sessionId: string,
  actionType: SessionActivity['actionType'],
  actionData?: Record<string, any>
): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId || !isSupabaseConfigured()) return;

  const { error } = await supabase.from('session_activity').insert({
    session_id: sessionId,
    user_id: userId,
    action_type: actionType,
    action_data: actionData || null,
  });

  if (error) {
    console.error('Error logging activity:', error);
  }
}

/**
 * Subscribe to session activity
 */
export function subscribeToActivity(
  sessionId: string,
  callback: ActivityCallback
): () => void {
  if (!isSupabaseConfigured()) {
    return () => {};
  }

  const channel = supabase
    .channel(`activity:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'session_activity',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        const data = payload.new as any;
        const activity: SessionActivity = {
          id: data.id,
          sessionId: data.session_id,
          userId: data.user_id,
          actionType: data.action_type,
          actionData: data.action_data,
          createdAt: data.created_at,
        };
        callback(activity);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Get session activity history
 */
export async function getSessionActivity(sessionId: string, limit = 50): Promise<SessionActivity[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from('session_activity')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching activity:', error);
    return [];
  }

  return (data || []).map((item) => ({
    id: item.id,
    sessionId: item.session_id,
    userId: item.user_id,
    actionType: item.action_type,
    actionData: item.action_data,
    createdAt: item.created_at,
  })) as SessionActivity[];
}

