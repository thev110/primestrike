import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase client using the SERVICE ROLE key.
// NEVER import this into a client component or expose the key with NEXT_PUBLIC_.
//
// Lazily constructed: createClient throws if the key is empty, which would
// break `next build` (env vars are absent during page-data collection).
// We build the client on first request instead of at module-eval time.
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "supabaseAdmin: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing."
    );
  }
  _client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _client;
}

// Proxy so existing `supabaseAdmin.from(...)` / `.storage` / `.auth` calls work
// unchanged, but the real client is only created when first accessed.
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

// Bucket that holds the protected videos (private bucket).
export const VIDEO_BUCKET = process.env.SUPABASE_VIDEO_BUCKET || "Videos";
