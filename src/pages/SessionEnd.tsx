import { useState } from 'react';
import { motion } from 'motion/react';
import { TipTicket } from '../components/TipTicket';
import { RibbonButton } from '../components/RibbonButton';
import { Confetti } from '../components/Confetti';
import { Switch } from '../components/ui/switch';
import { Download, RotateCcw } from 'lucide-react';
import { api } from '../utils/api';

interface SessionEndProps {
  roomId: string;
  onRestart: () => void;
  onViewRemix: (noteId: string) => void;
}

export function SessionEnd({ roomId, onRestart, onViewRemix }: SessionEndProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [revealIdentity, setRevealIdentity] = useState(false);
  const [followPartner, setFollowPartner] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleTipSelect = async (amount: number) => {
    const { url } = await api.createTipCheckout(roomId, amount);
    window.open(url, '_blank');
  };
  
  const handleSaveRemix = async () => {
    setIsSaving(true);
    const { noteId } = await api.saveRemix(roomId);
    setIsSaving(false);
    onViewRemix(noteId);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden">
      <Confetti active={showConfetti} />
      
      <div className="relative z-10 max-w-2xl w-full space-y-8">
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center"
        >
          <h1 
            className="text-5xl mb-4"
            style={{
              fontFamily: 'var(--font-display)',
              background: 'var(--grad-arcade)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            SESSION COMPLETE!
          </h1>
          <p className="text-xl opacity-80 m-0" style={{ color: 'var(--ticket-cream)' }}>
            Nice work! Time to wrap up.
          </p>
        </motion.div>
        
        <TipTicket onSelect={handleTipSelect} />
        
        <div className="grid grid-cols-2 gap-4">
          <div 
            className="p-5 rounded-lg"
            style={{
              background: 'var(--ticket-cream)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div 
                  className="mb-1"
                  style={{ 
                    color: 'var(--ink-violet)',
                    fontFamily: 'var(--font-display)'
                  }}
                >
                  Reveal Identity
                </div>
              </div>
              <Switch
                checked={revealIdentity}
                onCheckedChange={setRevealIdentity}
              />
            </div>
          </div>
          
          <div 
            className="p-5 rounded-lg"
            style={{
              background: 'var(--ticket-cream)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div 
                  className="mb-1"
                  style={{ 
                    color: 'var(--ink-violet)',
                    fontFamily: 'var(--font-display)'
                  }}
                >
                  Follow Partner
                </div>
              </div>
              <Switch
                checked={followPartner}
                onCheckedChange={setFollowPartner}
              />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <RibbonButton
            onClick={handleSaveRemix}
            disabled={isSaving}
            variant="secondary"
            size="lg"
          >
            <div className="flex items-center gap-2">
              <Download size={20} />
              {isSaving ? 'Saving...' : 'Save Remix'}
            </div>
          </RibbonButton>
          
          <RibbonButton
            onClick={onRestart}
            variant="accent"
            size="lg"
          >
            <div className="flex items-center gap-2">
              <RotateCcw size={20} />
              Spin Again
            </div>
          </RibbonButton>
        </div>
      </div>
    </div>
  );
}

