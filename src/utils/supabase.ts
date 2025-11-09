import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration
// These should be set as environment variables in production
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
};

// Create Supabase client only if configured, otherwise create a mock client
let supabaseInstance: SupabaseClient | null = null;

if (isSupabaseConfigured()) {
  supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
} else {
  console.warn('Supabase URL or Anon Key not configured. Running in local-only mode. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables for multiplayer features.');
  
  // Create a mock client with dummy values to prevent errors
  // This won't actually work, but prevents crashes
  // Using a valid URL format to pass Supabase validation
  try {
    supabaseInstance = createClient('https://placeholder.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder', {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
  }
}

export const supabase = supabaseInstance!;

