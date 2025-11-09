export type Constraint = { 
  id: string; 
  kind: 'Style' | 'Goal' | 'Time'; 
  label: string; 
  details?: string;
};

export type Room = { 
  id: string; 
  constraints: Constraint[]; 
  role: 'Driver' | 'Navigator';
};

export type Matchmaking = { 
  status: 'searching' | 'matched'; 
  room?: Room;
};

export type RemixNote = { 
  id: string; 
  roomId: string; 
  markdown: string;
};

