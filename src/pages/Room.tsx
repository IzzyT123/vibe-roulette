import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ConstraintCard } from '../components/ConstraintCard';
import { CodeEditor } from '../components/CodeEditor';
import { AIChat } from '../components/AIChat';
import { AIChatPanel, type Message as ChatMessage } from '../components/AIChatPanel';
import { LivePreview } from '../components/LivePreview';
import { HelpModal } from '../components/HelpModal';
import { APIKeySettings } from '../components/APIKeySettings';
import { ToastContainer, ToastType } from '../components/Toast';
import { FileTree } from '../components/FileTree';
import { EditorTabs, EditorTab } from '../components/EditorTabs';
import { UserProfile } from '../components/UserProfile';
import { CodeApprovalModal } from '../components/CodeApprovalModal';
import { ActivityFeed, type Activity } from '../components/ActivityFeed';
import { SessionStats } from '../components/SessionStats';
import { RoleBadge } from '../components/RoleBadge';
import { vfs } from '../utils/virtualFileSystem';
import { soundEffects } from '../utils/soundEffects';
import { aiService } from '../utils/aiService';
import { 
  subscribeToSessionFiles, 
  updateFile, 
  getSessionFiles,
  subscribeToSessionChat,
  sendChatMessage,
  getSessionChatHistory,
  updateTypingStatus,
  subscribeToTypingStatus,
  createCodeApproval,
  approveCodeChange,
  rejectCodeChange,
  subscribeToCodeApprovals,
  getPendingApprovals,
  updateCursorPosition,
  subscribeToCursorPositions,
  logActivity,
  subscribeToActivity,
  getSessionActivity,
  type CodeApproval,
  type CursorPosition,
  type SessionActivity
} from '../utils/realtimeSync';
import { getCurrentUserId } from '../utils/auth';
import { leaveSession } from '../utils/sessionService';
import { downloadAsGitRepo } from '../utils/downloadService';
import type { FileSystemNode } from '../types/fileSystem';
import { 
  Eye, 
  EyeOff, 
  Rocket, 
  Sparkles, 
  HelpCircle,
  FileText,
  Layout,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
  Zap,
  Settings,
  FilePlus,
  FolderPlus,
  Download,
  Users,
  LogOut,
  Clock
} from 'lucide-react';
import type { Room as RoomType } from '../types/contracts';

interface RoomProps {
  room: RoomType;
  onSessionEnd: () => void;
  onBrowseProjects?: () => void;
  onSpinAgain?: () => void;
}

// Initialize with starter file
const initializeDefaultProject = () => {
  vfs.setFile('/src/App.tsx', `import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ 
      padding: '2rem', 
      fontFamily: 'system-ui',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <h1>Hello from Vibe Roulette! 🎮</h1>
      <p>Start building something amazing together.</p>
      
      <div style={{ marginTop: '2rem' }}>
        <button 
          onClick={() => setCount(count + 1)}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            background: '#FF6A00',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Clicked {count} times
        </button>
      </div>
    </div>
  );
}`);
};

const CHAT_STORAGE_BASE_KEY = 'vibeRouletteChatHistory';

const createInitialChatMessages = (): ChatMessage[] => [
  {
    id: '0',
    role: 'assistant',
    content: "👋 Ready to code! I'll remember our conversation.\n\n**Try:**\n• \"create a button\"\n• \"build a dashboard\"\n• Then: \"make it blue\" or \"add a chart\"\n\nI'll build on what we already have!",
    timestamp: new Date()
  }
];

const mapsAreEqual = (a: Map<string, string>, b: Map<string, string>) => {
  if (a.size !== b.size) return false;
  for (const [key, value] of a.entries()) {
    if (b.get(key) !== value) {
      return false;
    }
  }
  return true;
};

export function Room({ room, onSessionEnd, onBrowseProjects, onSpinAgain }: RoomProps) {
  const [currentCode, setCurrentCode] = useState('');
  const [aiCode, setAiCode] = useState<string>();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; type: ToastType; message: string }>>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => createInitialChatMessages());
  const chatHistoryLoadedRef = useRef(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRemoteUpdateRef = useRef(false);
  
  // Virtual File System state
  const [fileTree, setFileTree] = useState<FileSystemNode[]>([]);
  const [allFiles, setAllFiles] = useState<Map<string, string>>(new Map());
  
  // IDE state
  const [openTabs, setOpenTabs] = useState<EditorTab[]>([
    { path: '/src/App.tsx', name: 'App.tsx', isDirty: false }
  ]);
  const [activeTab, setActiveTab] = useState('/src/App.tsx');
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [activeLeftPanel, setActiveLeftPanel] = useState<'files' | 'constraints' | 'activity'>('files');
  const [activeRightPanel, setActiveRightPanel] = useState<'preview' | 'ai'>('preview');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isPreviewMaximized, setIsPreviewMaximized] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [linesWritten, setLinesWritten] = useState(0);
  const [filesCreatedCount, setFilesCreatedCount] = useState(0);
  const [aiRequestsCount, setAIRequestsCount] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(soundEffects.isEnabled());
  
  // Typing indicator and code approval state
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<CodeApproval | null>(null);
  const [approvedCode, setApprovedCode] = useState<Map<string, string>>(new Map());
  const [partnerCursor, setPartnerCursor] = useState<CursorPosition | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const approvalTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastApprovalChangeId = useRef<string | null>(null);
  const lastToastTime = useRef<Record<string, number>>({});
  const isBulkImportingRef = useRef(false);
  const lastAINotificationTime = useRef<number>(0);
  
  // Load session files and chat history on mount
  useEffect(() => {
    const loadSessionData = async () => {
      try {
        // Load files from Supabase
        const sessionFiles = await getSessionFiles(room.id);
        if (sessionFiles.size > 0) {
          // Import files into VFS
          const filesArray = Array.from(sessionFiles.entries()).map(([path, content]) => ({
            path,
            content,
          }));
          vfs.importFiles(filesArray);
          refreshFileSystem();
        } else {
          // Initialize default project if no files exist
          if (vfs.getFileCount() === 0) {
            initializeDefaultProject();
            refreshFileSystem();
          }
        }

        // Load chat history from Supabase
        const chatHistory = await getSessionChatHistory(room.id);
        if (chatHistory.length > 0) {
          const messages: ChatMessage[] = chatHistory.map((msg) => ({
            id: msg.id,
            role: msg.role || 'user', // Use role from database, default to 'user'
            content: msg.message,
            timestamp: new Date(msg.createdAt),
            userId: msg.userId, // Include userId to distinguish messages
          }));
          setChatMessages([...createInitialChatMessages(), ...messages]);
        } else {
          setChatMessages(createInitialChatMessages());
        }
        chatHistoryLoadedRef.current = true;
      } catch (error) {
        console.error('Error loading session data:', error);
        // Fallback to local initialization
        if (vfs.getFileCount() === 0) {
          initializeDefaultProject();
          refreshFileSystem();
        }
        setChatMessages(createInitialChatMessages());
        chatHistoryLoadedRef.current = true;
      }
    };

    loadSessionData();
  }, [room.id]);

  // Subscribe to real-time file changes
  useEffect(() => {
    const unsubscribeFiles = subscribeToSessionFiles(room.id, (change) => {
      const userId = getCurrentUserId();
      // Don't apply our own changes (they're already in VFS)
      if (change.updatedBy === userId) {
        console.log('Ignoring own file change:', change.filePath);
        return;
      }

      console.log('Received remote file change:', {
        filePath: change.filePath,
        contentLength: change.content.length,
        updatedBy: change.updatedBy
      });

      isRemoteUpdateRef.current = true;
      vfs.setFile(change.filePath, change.content);
      refreshFileSystem();

      // Update current code if it's the active file
      if (change.filePath === activeTab) {
        setCurrentCode(change.content);
      }

      // Debounced toast notification - only show once every 3 seconds per file
      // Skip notifications during bulk AI imports
      if (!isBulkImportingRef.current) {
        const now = Date.now();
        const lastToast = lastToastTime.current[change.filePath] || 0;
        if (now - lastToast > 3000) {
          addToast('info', `📝 ${change.filePath.split('/').pop()} updated by collaborator`);
          lastToastTime.current[change.filePath] = now;
        }
      }
      
      // Reset flag after a brief delay to allow refreshFileSystem to complete
      setTimeout(() => {
        isRemoteUpdateRef.current = false;
      }, 100);
    });

    return () => {
      unsubscribeFiles();
    };
  }, [room.id, activeTab]);

  // Subscribe to real-time chat messages
  useEffect(() => {
    const unsubscribeChat = subscribeToSessionChat(room.id, (message) => {
      const userId = getCurrentUserId();
      // Don't add our own messages (they're already added locally)
      if (message.userId === userId) {
        return;
      }

      const chatMessage: ChatMessage = {
        id: message.id,
        role: message.role || 'user', // Use role from database, default to 'user' for backwards compatibility
        content: message.message,
        timestamp: new Date(message.createdAt),
        userId: message.userId, // Include userId to distinguish messages
      };
      setChatMessages((prev) => [...prev, chatMessage]);
    });

    return () => {
      unsubscribeChat();
    };
  }, [room.id]);

  // Subscribe to typing indicators
  useEffect(() => {
    const unsubscribeTyping = subscribeToTypingStatus(room.id, (userId, isTyping) => {
      const currentUserId = getCurrentUserId();
      // Only show typing for partner, not self
      if (userId !== currentUserId) {
        setPartnerTyping(isTyping);
      }
    });

    return () => {
      unsubscribeTyping();
    };
  }, [room.id]);
  
  // Subscribe to partner cursor positions
  useEffect(() => {
    const unsubscribeCursors = subscribeToCursorPositions(room.id, (position) => {
      const currentUserId = getCurrentUserId();
      // Only show cursor for partner, not self
      if (position.userId !== currentUserId && position.filePath === activeTab) {
        setPartnerCursor(position);
      }
    });

    return () => {
      unsubscribeCursors();
    };
  }, [room.id, activeTab]);
  
  // Subscribe to activity feed
  useEffect(() => {
    const loadActivities = async () => {
      const history = await getSessionActivity(room.id);
      const currentUserId = getCurrentUserId();
      const activityList: Activity[] = history.reverse().map((act) => ({
        id: act.id,
        userId: act.userId,
        actionType: act.actionType,
        actionData: act.actionData,
        timestamp: new Date(act.createdAt),
        isCurrentUser: act.userId === currentUserId,
      }));
      setActivities(activityList);
      
      // Calculate initial stats from history
      const filesCreated = activityList.filter(a => a.actionType === 'file_created').length;
      const aiRequests = activityList.filter(a => a.actionType === 'ai_request').length;
      setFilesCreatedCount(filesCreated);
      setAIRequestsCount(aiRequests);
    };

    loadActivities();

    const unsubscribeActivity = subscribeToActivity(room.id, (activity) => {
      const currentUserId = getCurrentUserId();
      const newActivity: Activity = {
        id: activity.id,
        userId: activity.userId,
        actionType: activity.actionType,
        actionData: activity.actionData,
        timestamp: new Date(activity.createdAt),
        isCurrentUser: activity.userId === currentUserId,
      };
      setActivities((prev) => [...prev, newActivity]);
      
      // Update stats
      if (activity.actionType === 'file_created') {
        setFilesCreatedCount(prev => prev + 1);
      } else if (activity.actionType === 'ai_request') {
        setAIRequestsCount(prev => prev + 1);
      }
    });

    return () => {
      unsubscribeActivity();
    };
  }, [room.id]);
  
  // Timer for session duration
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);
  
  // Track lines written
  useEffect(() => {
    const lines = currentCode.split('\n').length;
    setLinesWritten(lines);
  }, [currentCode]);

  // Code approvals temporarily disabled due to infinite loop issues
  // TODO: Redesign approval system with manual "Request Approval" button
  /*
  useEffect(() => {
    const loadPending = async () => {
      const pending = await getPendingApprovals(room.id);
      if (pending.length > 0) {
        setPendingApproval(pending[0]);
      }
    };

    loadPending();

    const unsubscribeApprovals = subscribeToCodeApprovals(room.id, (approval) => {
      if (approval.status === 'pending') {
        setPendingApproval(approval);
      } else if (approval.status === 'approved') {
        setPendingApproval(null);
        vfs.setFile(approval.filePath, approval.codeContent);
        refreshFileSystem();
        setApprovedCode(prev => {
          const next = new Map(prev);
          next.set(approval.filePath, approval.codeContent);
          return next;
        });
        addToast('success', `✅ Code approved by both users!`);
      } else if (approval.status === 'rejected') {
        setPendingApproval(null);
        addToast('info', '❌ Code change rejected');
      }
    });

    return () => {
      unsubscribeApprovals();
    };
  }, [room.id]);
  */

  // Sync file changes to Supabase (reduced debounce for real-time feel)
  useEffect(() => {
    if (isRemoteUpdateRef.current) {
      console.log('Skipping sync - remote update in progress');
      return; // Don't sync remote updates
    }

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      if (activeTab && currentCode !== undefined && currentCode !== '') {
        console.log('Syncing file to Supabase:', {
          filePath: activeTab,
          contentLength: currentCode.length
        });
        setIsSyncing(true);
        try {
          await updateFile(room.id, activeTab, currentCode);
          console.log('File synced successfully:', activeTab);
        } catch (error) {
          console.error('Error syncing file:', error);
          addToast('error', `Failed to sync ${activeTab.split('/').pop()}`);
        } finally {
          setIsSyncing(false);
        }
      }
    }, 200); // Reduced to 200ms for more real-time feel

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [currentCode, activeTab, room.id]);
  
  const refreshFileSystem = () => {
    const tree = vfs.getFileTree();
    const files = vfs.getAllFiles();
    const newFilesMap = new Map(Array.from(files, f => [f.path, f.content]));
    
    console.log('Refreshing file system:', {
      fileCount: files.length,
      files: files.map(f => f.path),
      isRemoteUpdate: isRemoteUpdateRef.current
    });
    
    setFileTree(tree as FileSystemNode[]);
    
    // Always create a new Map reference to ensure React detects the change
    // Only skip if content is actually the same (to prevent unnecessary re-renders)
    if (!mapsAreEqual(newFilesMap, allFiles)) {
      // Create a completely new Map instance so React detects the change
      setAllFiles(new Map(newFilesMap));
    } else if (isRemoteUpdateRef.current) {
      // Force update even if content is same (for remote updates)
      setAllFiles(new Map(newFilesMap));
    }
  };
  
  const addToast = (type: ToastType, message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };
  
  
  const handleLeaveSession = async () => {
    const userId = getCurrentUserId();
    if (userId && confirm('Leave this session?')) {
      try {
        await leaveSession(room.id, userId);
        onSessionEnd();
      } catch (error) {
        console.error('Error leaving session:', error);
        addToast('error', 'Failed to leave session');
      }
    }
  };

  const handleSpinAgain = async () => {
    const userId = getCurrentUserId();
    if (userId) {
      try {
        // Leave current session
        await leaveSession(room.id, userId);
        // Trigger spin again callback
        if (onSpinAgain) {
          onSpinAgain();
        } else {
          // Fallback: go to landing
          onSessionEnd();
        }
      } catch (error) {
        console.error('Error spinning again:', error);
        addToast('error', 'Failed to start new session');
      }
    }
  };
  
  const handleFileSelect = (path: string) => {
    // Only select actual files, not folders
    if (!vfs.hasFile(path)) {
      console.warn('Room: File not found in VFS:', path);
      return;
    }
    
    console.log('Room: Selecting file:', path);
    const content = vfs.getFile(path);
    console.log('Room: File content length:', content?.length || 0);
    
    // Add tab if not already open
    if (!openTabs.find(tab => tab.path === path)) {
      const fileName = path.split('/').pop() || path;
      setOpenTabs([...openTabs, { path, name: fileName, isDirty: false }]);
    }
    setActiveTab(path);
    setCurrentCode(content || '');
    addToast('success', `Opened ${path.split('/').pop()}`);
    
    // Log activity
    logActivity(room.id, 'file_opened', { fileName: path.split('/').pop(), filePath: path });
  };
  
  const handleTabClose = (path: string) => {
    const newTabs = openTabs.filter(tab => tab.path !== path);
    setOpenTabs(newTabs);
    
    if (activeTab === path && newTabs.length > 0) {
      const newActive = newTabs[newTabs.length - 1].path;
      setActiveTab(newActive);
      // currentCode will be updated by tab click handler
    }
  };

  const handleFixErrors = async (errorMessage: string, files: Map<string, string>) => {
    try {
      addToast('info', '🤖 AI is fixing errors...');
      
      // Build context with all files and error
      const filesContext = Array.from(files.entries())
        .map(([path, content]) => `// File: ${path}\n${content}`)
        .join('\n\n---\n\n');
      
      // Use AI to fix the code
      const response = await aiService.fixCode(filesContext, errorMessage);
      
      // Parse multi-file response if it's a project
      const fixedFiles = aiService.parseMultiFileResponse(response.code);
      
      if (fixedFiles && fixedFiles.length > 1) {
        // Multi-file fix
        vfs.importFiles(fixedFiles);
        refreshFileSystem();
        
        // Update active tab if it was one of the fixed files
        const mainFile = fixedFiles.find(f => f.path === activeTab) || fixedFiles[0];
        if (mainFile) {
          setCurrentCode(mainFile.content);
        }
        
        addToast('success', `✅ Fixed ${fixedFiles.length} files!`);
      } else {
        // Single file fix - update current active file
        if (activeTab) {
          vfs.setFile(activeTab, response.code);
          setCurrentCode(response.code);
          refreshFileSystem();
          addToast('success', '✅ Fixed current file!');
        }
      }
    } catch (error) {
      console.error('Error fixing code:', error);
      addToast('error', 'Failed to fix errors. Try asking AI directly.');
    }
  };
  
  // Watch for active tab changes and update code
  useEffect(() => {
    console.log('Room: activeTab changed to:', activeTab);
    const content = vfs.getFile(activeTab);
    console.log('Room: Content from VFS for', activeTab, ':', content ? `length ${content.length}` : 'undefined');
    if (content !== undefined) {
      setCurrentCode(content);
    } else {
      console.warn('Room: No content found for', activeTab);
    }
  }, [activeTab]); // Only activeTab as dependency
  
  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--ink-violet)' }}>
      {/* 
        CRITICAL FIX: Top Bar with proper z-index 
        This bar now has z-50 to ensure it stays above all panels
        Using sticky positioning as a backup
      */}
      <motion.div 
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{
          background: 'rgba(15, 10, 31, 0.95)',
          borderColor: 'var(--border)',
          backdropFilter: 'blur(10px)',
          zIndex: 50,
          position: 'relative',
        }}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <div className="flex items-center gap-4">
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <Zap size={24} color="var(--neon-orange)" fill="var(--neon-orange)" />
            <h2 className="m-0 text-xl" style={{ fontFamily: 'var(--font-display)', color: 'var(--ticket-cream)' }}>
              VIBE ROULETTE
            </h2>
          </motion.div>
          
          <RoleBadge role={room.role} size="lg" />

          {isSyncing && (
            <motion.div
              className="px-2 py-1 rounded text-xs flex items-center gap-1"
              style={{
                background: 'rgba(81, 255, 196, 0.2)',
                color: 'var(--mint-glow)',
              }}
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Sparkles size={12} />
              Syncing...
            </motion.div>
          )}

          {partnerTyping && (
            <motion.div
              className="px-2 py-1 rounded text-xs flex items-center gap-1"
              style={{
                background: 'rgba(177, 107, 255, 0.2)',
                color: 'var(--orchid-electric)',
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                ✨
              </motion.span>
              Vibing...
            </motion.div>
          )}

          <UserProfile compact />
        </div>
        
              <div className="flex items-center gap-2">
                {onSpinAgain && (
                  <motion.button
                    onClick={handleSpinAgain}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                    style={{
                      background: 'var(--neon-orange)',
                      color: 'var(--ink-violet)',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 'bold'
                    }}
                    whileHover={{ scale: 1.05, boxShadow: '0 4px 12px rgba(255, 106, 0, 0.4)' }}
                    whileTap={{ scale: 0.95 }}
                    title="Spin Again - Find New Collaborator"
                  >
                    <Sparkles size={18} />
                    Spin Again
                  </motion.button>
                )}

                {onBrowseProjects && (
                  <motion.button
                    onClick={onBrowseProjects}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      color: 'var(--ticket-cream)',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.15)' }}
                    whileTap={{ scale: 0.95 }}
                    title="Browse Projects"
                  >
                    <Users size={18} />
                    Browse
                  </motion.button>
                )}

                <motion.button
                  onClick={async () => {
                    try {
                      addToast('info', 'Preparing download...');
                      await downloadAsGitRepo(room.id);
                      addToast('success', 'Download started!');
                    } catch (error) {
                      console.error('Error downloading repo:', error);
                      addToast('error', 'Failed to download repo');
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: 'var(--ticket-cream)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.15)' }}
                  whileTap={{ scale: 0.95 }}
                  title="Download Repo"
                >
                  <Download size={18} />
                </motion.button>
                
                <motion.button
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: 'var(--ticket-cream)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.15)' }}
                  whileTap={{ scale: 0.95 }}
                  title="AI API Settings"
                >
                  <Settings size={18} />
                </motion.button>
                
                <motion.button
                  onClick={() => setIsHelpOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: 'var(--ticket-cream)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.15)' }}
                  whileTap={{ scale: 0.95 }}
                  title="Help & Tips"
                >
                  <HelpCircle size={18} />
                </motion.button>
                
                <motion.button
                  onClick={handleLeaveSession}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
                  style={{
                    background: 'rgba(255,51,102,0.2)',
                    color: '#FF3366',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  whileHover={{ scale: 1.05, background: 'rgba(255,51,102,0.3)' }}
                  whileTap={{ scale: 0.95 }}
                  title="Leave Session"
                >
                  <LogOut size={18} />
                </motion.button>
              </div>
      </motion.div>
      
      {/* 
        Main IDE Layout - flex-1 ensures it takes remaining space
        overflow-hidden prevents content from pushing the header off screen
      */}
      <div className="flex-1 flex overflow-hidden" style={{ position: 'relative', zIndex: 1 }}>
        {/* Left Sidebar */}
        <AnimatePresence>
          {showLeftSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="border-r overflow-hidden flex flex-col"
              style={{
                background: 'rgba(15, 10, 31, 0.5)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
                <motion.button
                  onClick={() => setActiveLeftPanel('files')}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2"
                  style={{
                    background: activeLeftPanel === 'files' ? 'rgba(81, 255, 196, 0.1)' : 'transparent',
                    borderBottom: activeLeftPanel === 'files' ? '2px solid var(--mint-glow)' : '2px solid transparent',
                    color: 'var(--ticket-cream)',
                    cursor: 'pointer',
                  }}
                  whileHover={{ background: 'rgba(255, 255, 255, 0.05)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FileText size={16} />
                  <span className="text-sm">Files</span>
                </motion.button>
                
                <motion.button
                  onClick={() => setActiveLeftPanel('constraints')}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2"
                  style={{
                    background: activeLeftPanel === 'constraints' ? 'rgba(81, 255, 196, 0.1)' : 'transparent',
                    borderBottom: activeLeftPanel === 'constraints' ? '2px solid var(--mint-glow)' : '2px solid transparent',
                    color: 'var(--ticket-cream)',
                    cursor: 'pointer',
                  }}
                  whileHover={{ background: 'rgba(255, 255, 255, 0.05)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Sparkles size={16} />
                  <span className="text-sm">Quest</span>
                </motion.button>
                
                <motion.button
                  onClick={() => setActiveLeftPanel('activity')}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2"
                  style={{
                    background: activeLeftPanel === 'activity' ? 'rgba(81, 255, 196, 0.1)' : 'transparent',
                    borderBottom: activeLeftPanel === 'activity' ? '2px solid var(--mint-glow)' : '2px solid transparent',
                    color: 'var(--ticket-cream)',
                    cursor: 'pointer',
                  }}
                  whileHover={{ background: 'rgba(255, 255, 255, 0.05)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Clock size={16} />
                  <span className="text-sm">Activity</span>
                </motion.button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3">
                <AnimatePresence mode="wait">
                  {activeLeftPanel === 'files' ? (
                    <motion.div
                      key="files"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      {fileTree.length > 0 ? (
                        <FileTree
                          files={fileTree}
                          onFileSelect={handleFileSelect}
                          selectedFile={activeTab}
                        />
                      ) : (
                        <div className="text-center py-8" style={{ color: 'var(--ticket-cream)', opacity: 0.5 }}>
                          <p className="text-sm">No files yet.</p>
                          <p className="text-xs mt-2">Ask AI to create a project!</p>
                        </div>
                      )}
                    </motion.div>
                  ) : activeLeftPanel === 'constraints' ? (
                    <motion.div
                      key="constraints"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {room.constraints.map((constraint, i) => (
                        <ConstraintCard key={constraint.id} constraint={constraint} index={i} />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="activity"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="h-full"
                    >
                      <ActivityFeed activities={activities} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Center - Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <EditorTabs
            tabs={openTabs}
            activeTab={activeTab}
            onTabClick={(path) => {
              setActiveTab(path);
              const content = vfs.getFile(path) || '';
              setCurrentCode(content);
            }}
            onTabClose={handleTabClose}
          />
          
          <div className="flex-1 relative">
            <CodeEditor 
              roomId={room.id} 
              role={room.role}
              filePath={activeTab}
              currentCode={currentCode}
              onCodeChange={(code) => {
                setCurrentCode(code);
                
                // Emit typing indicator
                updateTypingStatus(room.id, true);
                
                // Debounce typing indicator clear
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }
                typingTimeoutRef.current = setTimeout(() => {
                  updateTypingStatus(room.id, false);
                }, 1000);
                
                // Save to virtual file system (local changes, visible in editor)
                vfs.setFile(activeTab, code);
                
                // Update local preview immediately (real-time editing experience)
                setAllFiles(prevFiles => {
                  const newFiles = new Map(prevFiles);
                  newFiles.set(activeTab, code);
                  return newFiles;
                });
                
                // Debounced sync to Supabase (for remote user to see changes)
                // This will trigger real-time update for the other user
              }}
              onCursorMove={(line, column) => {
                // Update cursor position in Supabase (debounced by CodeEditor)
                updateCursorPosition(room.id, activeTab, line, column);
              }}
              aiGeneratedCode={aiCode}
            />
            
            <motion.button
              onClick={() => setShowLeftSidebar(!showLeftSidebar)}
              className="absolute top-2 left-2 p-2 rounded-lg z-10"
              style={{
                background: 'rgba(15, 10, 31, 0.8)',
                border: '1px solid var(--border)',
                color: 'var(--ticket-cream)',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {showLeftSidebar ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
            </motion.button>
            
            <motion.button
              onClick={() => setShowRightSidebar(!showRightSidebar)}
              className="absolute top-2 right-2 p-2 rounded-lg z-10"
              style={{
                background: 'rgba(15, 10, 31, 0.8)',
                border: '1px solid var(--border)',
                color: 'var(--ticket-cream)',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Layout size={16} />
            </motion.button>
          </div>
        </div>
        
        {/* Right Sidebar - Preview/AI */}
        <AnimatePresence>
          {showRightSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ 
                width: isPreviewMaximized ? 800 : 400, 
                opacity: 1 
              }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="border-l flex flex-col overflow-hidden"
              style={{ 
                borderColor: 'var(--border)',
                background: 'var(--ink-violet)',
              }}
            >
              <div className="flex border-b items-center" style={{ borderColor: 'var(--border)' }}>
                <motion.button
                  onClick={() => setActiveRightPanel('preview')}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2"
                  style={{
                    background: activeRightPanel === 'preview' ? 'rgba(81, 255, 196, 0.1)' : 'transparent',
                    borderBottom: activeRightPanel === 'preview' ? '2px solid var(--mint-glow)' : '2px solid transparent',
                    color: 'var(--ticket-cream)',
                    cursor: 'pointer',
                  }}
                  whileHover={{ background: 'rgba(255, 255, 255, 0.05)' }}
                >
                  <Layout size={16} />
                  <span className="text-sm">Preview</span>
                </motion.button>
                
                <motion.button
                  onClick={() => setActiveRightPanel('ai')}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2"
                  style={{
                    background: activeRightPanel === 'ai' ? 'rgba(81, 255, 196, 0.1)' : 'transparent',
                    borderBottom: activeRightPanel === 'ai' ? '2px solid var(--mint-glow)' : '2px solid transparent',
                    color: 'var(--ticket-cream)',
                    cursor: 'pointer',
                  }}
                  whileHover={{ background: 'rgba(255, 255, 255, 0.05)' }}
                >
                  <Sparkles size={16} />
                  <span className="text-sm">AI</span>
                </motion.button>
                
                <motion.button
                  onClick={() => setIsPreviewMaximized(!isPreviewMaximized)}
                  className="px-3 py-2"
                  style={{
                    background: 'transparent',
                    color: 'var(--ticket-cream)',
                    cursor: 'pointer',
                  }}
                  whileHover={{ background: 'rgba(255, 255, 255, 0.05)' }}
                >
                  {isPreviewMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </motion.button>
              </div>
              
              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  {activeRightPanel === 'preview' ? (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full"
                    >
                      <LivePreview 
                        code={currentCode} 
                        loading={false}
                        allFiles={allFiles}
                        onErrorDetected={(error) => {
                          console.log('Preview error detected:', error);
                        }}
                        onFixRequested={handleFixErrors}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="ai"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full"
                    >
                      <AIChatPanel
                        sessionId={room.id}
                        currentUserId={getCurrentUserId() || undefined}
                        messages={chatMessages}
                        setMessages={setChatMessages}
                        currentCode={currentCode}
                        allFiles={allFiles}
                        activeFilePath={activeTab}
                        onCodeGenerated={(code) => {
                          setAiCode(code);
                          // Debounce AI notifications - only once per 5 seconds
                          const now = Date.now();
                          if (now - lastAINotificationTime.current > 5000) {
                            addToast('success', 'AI generated code ready!');
                            lastAINotificationTime.current = now;
                          }
                        }}
                        onProjectGenerated={async (files) => {
                          // AI generated multiple files
                          console.log('Importing files:', files);
                          
                          // Set bulk import flag to suppress individual notifications
                          isBulkImportingRef.current = true;
                          
                          vfs.importFiles(files);
                          refreshFileSystem();
                          
                          // Sync all files to Supabase
                          for (const file of files) {
                            try {
                              await updateFile(room.id, file.path, file.content);
                            } catch (error) {
                              console.error('Error syncing file:', error);
                            }
                          }
                          
                          // Clear bulk import flag after a delay
                          setTimeout(() => {
                            isBulkImportingRef.current = false;
                          }, 2000);
                          
                          // Open the main file
                          const mainFile = files.find(f => f.path.includes('App.tsx')) || files[0];
                          if (mainFile) {
                            // Close old tabs and open new main file
                            setOpenTabs([{ path: mainFile.path, name: mainFile.path.split('/').pop() || 'App.tsx', isDirty: false }]);
                            setActiveTab(mainFile.path);
                            setCurrentCode(mainFile.content);
                          }
                          
                          // Single notification for all files (debounced)
                          const now = Date.now();
                          if (now - lastAINotificationTime.current > 5000) {
                            addToast('success', `✨ AI created ${files.length} files!`);
                            lastAINotificationTime.current = now;
                          }
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Toast notifications */}
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
      />
      
      {/* AI Chat Modal */}
      <AIChat
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        currentCode={currentCode}
        onCodeGenerated={(code) => {
          setAiCode(code);
          // Debounce AI notifications - only once per 5 seconds
          const now = Date.now();
          if (now - lastAINotificationTime.current > 5000) {
            addToast('success', 'AI generated code ready!');
            lastAINotificationTime.current = now;
          }
        }}
      />
      
      {/* Help Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
      
      {/* API Key Settings Modal */}
      <APIKeySettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      
      {/* Code Approval Modal - Temporarily disabled */}
      {/* TODO: Redesign approval system with manual "Request Approval" button to avoid infinite loops */}
      
      {/* Session Stats */}
      <SessionStats
        linesWritten={linesWritten}
        filesCreated={filesCreatedCount}
        aiRequests={aiRequestsCount}
        timeElapsed={timeElapsed}
        isOpen={showStats}
        onToggle={() => setShowStats(!showStats)}
      />
    </div>
  );
}

