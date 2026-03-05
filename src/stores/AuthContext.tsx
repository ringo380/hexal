// AuthContext — Clerk authentication wrapper
// The app works 100% without an account. If Clerk isn't configured,
// this context simply returns user: null, isAuthenticated: false.

import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { useUser, useSession, useClerk } from '@clerk/react';
import { setSupabaseTokenProvider, clearSupabaseClient } from '../services/supabaseClient';

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
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

// ============ CONTEXT ============

const AuthContext = createContext<AuthContextValue | null>(null);

// ============ NO-AUTH FALLBACK ============

const noAuthValue: AuthContextValue = {
  user: null,
  loading: false,
  signOut: async () => {},
  isAuthenticated: false,
};

// ============ CLERK AUTH PROVIDER ============

function ClerkAuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser();
  const { session } = useSession();
  const { signOut: clerkSignOut } = useClerk();

  // Map Clerk user to our AuthUser interface
  const user: AuthUser | null = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress ?? '',
    displayName: clerkUser.fullName ?? clerkUser.firstName ?? '',
    avatarUrl: clerkUser.imageUrl,
  } : null;

  // Set up the Supabase token provider when session is available
  useEffect(() => {
    if (session) {
      setSupabaseTokenProvider(() => session.getToken());
    } else {
      setSupabaseTokenProvider(null);
    }
  }, [session]);

  // Clean up token provider on unmount
  useEffect(() => {
    return () => {
      setSupabaseTokenProvider(null);
    };
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    await clerkSignOut();
    setSupabaseTokenProvider(null);
    clearSupabaseClient();
  }, [clerkSignOut]);

  // ============ CONTEXT VALUE ============

  const value: AuthContextValue = {
    user,
    loading: !isLoaded,
    signOut,
    isAuthenticated: clerkUser !== null && clerkUser !== undefined,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============ EXPORTED PROVIDER ============

interface AuthProviderProps {
  children: React.ReactNode;
  clerkEnabled?: boolean;
}

export function AuthProvider({ children, clerkEnabled = false }: AuthProviderProps) {
  if (!clerkEnabled) {
    return (
      <AuthContext.Provider value={noAuthValue}>
        {children}
      </AuthContext.Provider>
    );
  }

  return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
}

// ============ HOOK ============

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
