// supabaseClient — Lazily-initialized Supabase client singleton
// Re-creates the client only when URL or key changes.
// Uses a module-level token provider for Clerk JWT integration.

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
let currentUrl = '';
let currentKey = '';
let tokenProvider: (() => Promise<string | null>) | null = null;

/**
 * Set the token provider for Supabase auth.
 * Called by AuthContext when Clerk session is available.
 * The provider should return a Clerk session token (JWT).
 */
export function setSupabaseTokenProvider(provider: (() => Promise<string | null>) | null): void {
  tokenProvider = provider;
}

/**
 * Get (or create) a Supabase client for the given URL and anon key.
 * Returns the cached client if the credentials haven't changed.
 * Returns null if url or anonKey are empty/missing.
 *
 * The client uses the module-level tokenProvider for auth.
 * When tokenProvider is null, requests are unauthenticated.
 */
export function getSupabaseClient(url: string, anonKey: string): SupabaseClient | null {
  if (!url || !anonKey) return null;

  // Return cached client if credentials haven't changed
  if (client && url === currentUrl && anonKey === currentKey) return client;

  client = createClient(url, anonKey, {
    accessToken: async () => {
      if (tokenProvider) return tokenProvider();
      return null;
    },
  });
  currentUrl = url;
  currentKey = anonKey;
  return client;
}

/**
 * Clear the cached client (e.g. on sign-out or settings change).
 */
export function clearSupabaseClient(): void {
  client = null;
  currentUrl = '';
  currentKey = '';
}
