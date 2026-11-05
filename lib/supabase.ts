import { createClient } from "@supabase/supabase-js";

/** Read-only client with the public key, for the server only (the browser uses `sb`, so there is a single auth client there). Row level security decides what it can see: approved agencies' available cars. */
export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
