import type { Matchmaking, Room, RemixNote } from '../types/contracts';
import { findMatch, getSession, joinSession } from './sessionService';
import { getCurrentUserId } from './auth';

// Mock delay for realistic API feel
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate random constraints for new sessions
function generateConstraints(): Room['constraints'] {
  const styles = ['Neo-Brutalism', 'Memphis Design', 'Glassmorphism', 'Neumorphism', 'Retro Wave'];
  const goals = ['Add a surprise', 'Make it interactive', 'Add animations', 'Create a component library'];
  
  return [
    {
      id: `c1-${Date.now()}`,
      kind: 'Style',
      label: styles[Math.floor(Math.random() * styles.length)],
      details: 'Apply this design style throughout'
    },
    {
      id: `c2-${Date.now()}`,
      kind: 'Goal',
      label: goals[Math.floor(Math.random() * goals.length)],
      details: 'Hidden easter egg or delightful interaction'
    }
  ];
}

// API endpoints
export const api = {
  async spin(): Promise<Matchmaking> {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      const constraints = generateConstraints();
      const { session, role } = await findMatch(userId, constraints);
      
      const room: Room = {
        id: session.id,
        role,
        constraints: session.constraints,
      };
      
      // Return searching if in waiting session (Driver), matched if session is active (Navigator)
      const isMatched = session.status === 'active' && role === 'Navigator';
      console.log('api.spin: Session:', session.id, 'role:', role, 'status:', session.status, 'isMatched:', isMatched);
      
      return {
        status: isMatched ? 'matched' : 'searching',
        room: isMatched ? room : undefined,
      };
    } catch (error) {
      console.error('Error in spin:', error);
      // Fallback to mock for development
      await delay(1200);
      const room: Room = {
        id: `room-${Date.now()}`,
        role: Math.random() > 0.5 ? 'Driver' : 'Navigator',
        constraints: generateConstraints(),
      };
      return { status: 'matched', room };
    }
  },
  
  async getRoom(id: string): Promise<{ room: Room }> {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      const session = await getSession(id);
      
      // Get user's role in this session
      const { role } = await joinSession(id, userId);
      
      const room: Room = {
        id: session.id,
        role,
        constraints: session.constraints,
      };
      
      return { room };
    } catch (error) {
      console.error('Error getting room:', error);
      // Fallback to mock
      await delay(300);
      return {
        room: {
          id,
          role: 'Driver',
          constraints: generateConstraints(),
        }
      };
    }
  },

  async browseActiveSessions(): Promise<Room[]> {
    try {
      const { getActiveSessions } = await import('./sessionService');
      const sessions = await getActiveSessions();
      
      return sessions.map(session => ({
        id: session.id,
        role: 'Navigator' as const, // Default role when browsing
        constraints: session.constraints,
      }));
    } catch (error) {
      console.error('Error browsing sessions:', error);
      return [];
    }
  },

  async joinActiveSession(sessionId: string): Promise<{ room: Room }> {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      const { session, role } = await joinSession(sessionId, userId);
      
      const room: Room = {
        id: session.id,
        role,
        constraints: session.constraints,
      };
      
      return { room };
    } catch (error) {
      console.error('Error joining session:', error);
      throw error;
    }
  },
  
  async deploy(_roomId: string): Promise<{ previewUrl: string }> {
    await delay(800);
    return { previewUrl: 'https://example.com/preview' };
  },
  
  async createTipCheckout(roomId: string, amount: number): Promise<{ url: string }> {
    await delay(400);
    return { url: `https://checkout.stripe.com/test?amount=${amount}&room=${roomId}` };
  },
  
  async saveRemix(_roomId: string): Promise<{ noteId: string }> {
    await delay(500);
    
    return { noteId: `note-${Date.now()}` };
  },
  
  async getRemixNote(noteId: string): Promise<RemixNote> {
    await delay(300);
    
    return {
      id: noteId,
      roomId: 'room-123',
      markdown: `# Remix Summary\n\n## Changes Made\n- Added gradient background\n- Implemented hover states\n- Created reusable button component\n\n## Diff\n\`\`\`diff\n+ const Button = ({ children }) => (\n+   <button className="arcade-btn">{children}</button>\n+ );\n\`\`\``
    };
  }
};

