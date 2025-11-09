import { motion } from 'motion/react';
import { Heart } from 'lucide-react';

interface TipTicketProps {
  onSelect: (amount: number) => void;
}

export function TipTicket({ onSelect }: TipTicketProps) {
  const amounts = [1, 5, 10, 20];
  
  return (
    <div className="p-6 rounded-lg" style={{ background: 'var(--ticket-cream)' }}>
      <div className="text-center mb-4">
        <Heart size={32} color="var(--neon-orange)" className="mx-auto mb-2" />
        <h3 className="m-0 mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink-violet)' }}>
          Tip Your Partner
        </h3>
        <p className="text-sm opacity-60 m-0" style={{ color: 'var(--ink-violet)' }}>
          Show appreciation for a great session
        </p>
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        {amounts.map((amount) => (
          <motion.button
            key={amount}
            onClick={() => onSelect(amount)}
            className="px-4 py-3 rounded-lg"
            style={{
              background: 'var(--neon-orange)',
              color: 'var(--ink-violet)',
              fontFamily: 'var(--font-display)',
              border: 'none',
              cursor: 'pointer'
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ${amount}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

