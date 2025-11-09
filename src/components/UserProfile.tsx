import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Edit2, Check, X } from 'lucide-react';
import { getCurrentUser, updateUsername, getCurrentUserId } from '../utils/auth';

interface UserProfileProps {
  compact?: boolean;
}

export function UserProfile({ compact = false }: UserProfileProps) {
  const [username, setUsername] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const user = await getCurrentUser();
    if (user) {
      setUsername(user.username || '');
    } else {
      // Show anonymous ID
      const userId = getCurrentUserId();
      if (userId) {
        setUsername(`Anonymous ${userId.slice(0, 8)}`);
      }
    }
  };

  const handleEdit = () => {
    setTempUsername(username);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const userId = getCurrentUserId();
    if (userId && tempUsername.trim()) {
      const success = await updateUsername(userId, tempUsername.trim());
      if (success) {
        setUsername(tempUsername.trim());
        setIsEditing(false);
      }
    } else {
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const handleCancel = () => {
    setTempUsername('');
    setIsEditing(false);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <User size={16} color="var(--ticket-cream)" />
        <span className="text-sm" style={{ color: 'var(--ticket-cream)' }}>
          {username || 'Anonymous'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <User size={18} color="var(--ticket-cream)" />
      {isEditing ? (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={tempUsername}
            onChange={(e) => setTempUsername(e.target.value)}
            placeholder="Enter username"
            className="px-2 py-1 rounded text-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid var(--border)',
              color: 'var(--ticket-cream)',
              minWidth: '120px',
            }}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <motion.button
            onClick={handleSave}
            disabled={isSaving}
            className="p-1 rounded"
            style={{ color: 'var(--mint-glow)' }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Check size={14} />
          </motion.button>
          <motion.button
            onClick={handleCancel}
            className="p-1 rounded"
            style={{ color: 'var(--neon-orange)' }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={14} />
          </motion.button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--ticket-cream)' }}>
            {username || 'Anonymous'}
          </span>
          <motion.button
            onClick={handleEdit}
            className="p-1 rounded opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: 'var(--ticket-cream)' }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Edit username"
          >
            <Edit2 size={14} />
          </motion.button>
        </div>
      )}
    </div>
  );
}

