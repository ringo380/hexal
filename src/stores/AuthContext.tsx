// AuthContext — Optional Supabase authentication wrapper
// The app works 100% without an account. If cloud settings aren't configured,
// this context simply returns user: null, isAuthenticated: false.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Subscription } from '@supabase/supabase-js';
import { useSettings } from './SettingsContext';
import { getSupabaseClient, clearSupabaseClient } from '../services/supabaseClient';

// ============ TYPES ============

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error?: string }>;
  signInWithOAuth: (provider: 'google' | 'github' | 'discord') => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

// ============ CONTEXT ============

const AuthContext = createContext<AuthContextValue | null>(null);

// ============ PROVIDER ============

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const { supabaseUrl, supabaseAnonKey } = settings.cloud;

  // Listen for auth state changes whenever the Supabase client is available
  useEffect(() => {
    const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);

    // If Supabase is not configured, skip auth entirely
    if (!client) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Check current session on mount
    let authSubscription: Subscription | undefined;

    const init = async () => {
      try {
        const { data: { session } } = await client.auth.getSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email ?? '',
            displayName:
              (session.user.user_metadata?.display_name as string) ??
              (session.user.user_metadata?.full_name as string) ??
              session.user.email ??
              '',
            avatarUrl: session.user.user_metadata?.avatar_url as string | undefined,
          });
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }

      // Subscribe to future auth state changes
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email ?? '',
            displayName:
              (session.user.user_metadata?.display_name as string) ??
              (session.user.user_metadata?.full_name as string) ??
              session.user.email ??
              '',
            avatarUrl: session.user.user_metadata?.avatar_url as string | undefined,
          });
        } else {
          setUser(null);
        }
      });

      authSubscription = data.subscription;
    };

    init();

    // Cleanup subscription on unmount or credential change
    return () => {
      authSubscription?.unsubscribe();
    };
  }, [supabaseUrl, supabaseAnonKey]);

  // ============ AUTH METHODS ============

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error?: string }> => {
      const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
      if (!client) return { error: 'Cloud settings not configured' };

      const { error } = await client.auth.signInWithPassword({ email, password });
      return error ? { error: error.message } : {};
    },
    [supabaseUrl, supabaseAnonKey]
  );

  const signUp = useCallback(
    async (email: string, password: string, displayName: string): Promise<{ error?: string }> => {
      const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
      if (!client) return { error: 'Cloud settings not configured' };

      const { error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
        },
      });
      return error ? { error: error.message } : {};
    },
    [supabaseUrl, supabaseAnonKey]
  );

  const signInWithOAuth = useCallback(
    async (provider: 'google' | 'github' | 'discord'): Promise<{ error?: string }> => {
      const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
      if (!client) return { error: 'Cloud settings not configured' };

      const { error } = await client.auth.signInWithOAuth({ provider });
      return error ? { error: error.message } : {};
    },
    [supabaseUrl, supabaseAnonKey]
  );

  const signOut = useCallback(async (): Promise<void> => {
    const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
    if (client) {
      await client.auth.signOut();
    }
    clearSupabaseClient();
    setUser(null);
  }, [supabaseUrl, supabaseAnonKey]);

  // ============ CONTEXT VALUE ============

  const value: AuthContextValue = {
    user,
    loading,
    signIn,
    signUp,
    signInWithOAuth,
    signOut,
    isAuthenticated: user !== null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============ HOOK ============

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
