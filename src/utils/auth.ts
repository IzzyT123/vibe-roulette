import { supabase, isSupabaseConfigured } from './supabase';

export interface User {
  id: string;
  username?: string;
  created_at: string;
}

const USER_STORAGE_KEY = 'vibeRouletteUserId';

/**
 * Get or create anonymous user
 */
export async function getOrCreateAnonymousUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) {
    // Fallback to localStorage-only user for development
    let userId = localStorage.getItem(USER_STORAGE_KEY);
    if (!userId) {
      userId = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(USER_STORAGE_KEY, userId);
    }
    return {
      id: userId,
      username: undefined,
      created_at: new Date().toISOString(),
    };
  }

  // Check if user already exists in localStorage
  const storedUserId = localStorage.getItem(USER_STORAGE_KEY);
  
  if (storedUserId) {
    // Try to fetch existing user
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', storedUserId)
      .single();
    
    if (data && !error) {
      return data as User;
    }
  }

  // Create new anonymous user
  const { data, error } = await supabase
    .from('users')
    .insert({})
    .select()
    .single();

  if (error) {
    console.error('Error creating anonymous user:', error);
    // Fallback to localStorage
    const userId = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(USER_STORAGE_KEY, userId);
    return {
      id: userId,
      username: undefined,
      created_at: new Date().toISOString(),
    };
  }

  localStorage.setItem(USER_STORAGE_KEY, data.id);
  return data as User;
}

/**
 * Update username for current user
 */
export async function updateUsername(userId: string, username: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    // Store in localStorage for development
    localStorage.setItem(`${USER_STORAGE_KEY}_username`, username);
    return true;
  }

  const { error } = await supabase
    .from('users')
    .update({ username })
    .eq('id', userId);

  if (error) {
    console.error('Error updating username:', error);
    return false;
  }

  return true;
}

/**
 * Get current user from localStorage
 */
export function getCurrentUserId(): string | null {
  return localStorage.getItem(USER_STORAGE_KEY);
}

/**
 * Get current user (fetch from Supabase if configured)
 */
export async function getCurrentUser(): Promise<User | null> {
  const userId = getCurrentUserId();
  if (!userId) {
    return null;
  }

  if (!isSupabaseConfigured()) {
    const username = localStorage.getItem(`${USER_STORAGE_KEY}_username`);
    return {
      id: userId,
      username: username || undefined,
      created_at: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data as User;
}

