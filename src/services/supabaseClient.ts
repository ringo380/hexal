// supabaseClient — Lazily-initialized Supabase client singleton
// Re-creates the client only when URL or key changes.

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
let currentUrl = '';
let currentKey = '';

/**
 * Get (or create) a Supabase client for the given URL and anon key.
 * Returns the cached client if the credentials haven't changed.
 * Returns null if url or anonKey are empty/missing.
 */
export function getSupabaseClient(url: string, anonKey: string): SupabaseClient | null {
  if (!url || !anonKey) return null;

  // Return cached client if credentials haven't changed
  if (client && url === currentUrl && anonKey === currentKey) return client;

  client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
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
