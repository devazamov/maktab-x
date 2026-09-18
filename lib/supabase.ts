import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Server-only client, authenticated with the service role key. This
 * bypasses Row Level Security, so it must only ever be imported from
 * server code (API routes, server components) — never shipped to the
 * client bundle.
 */
export function supabaseAdmin() {
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase env vars missing: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Anon-key client for any future client-side reads that are safe under
 * RLS (e.g. public leaderboards). Not used by Phase 1 yet — auth'd
 * reads currently go through our own API routes with the session
 * cookie instead.
 */
export function supabaseAnon() {
  if (!url || !anonKey) {
    throw new Error(
      "Supabase env vars missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  return createClient(url, anonKey);
}

export function isSupabaseConfigured() {
  return Boolean(url && anonKey && serviceRoleKey);
}
