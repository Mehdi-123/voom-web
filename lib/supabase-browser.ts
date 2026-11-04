import { createClient } from "@supabase/supabase-js";

/**
 * The signed-in client, used by the private pages (login, dashboard). The session lives in the browser;
 * what a person can read or change is still decided by the database's row level security, exactly as in the app.
 */
export const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});
