import type { Dictionary } from "@/dictionaries/fr";

/** Supabase's own wording is English only, so the common cases are rewritten in the page's language. */
export function authErrorMessage(dict: Dictionary, error: { message?: string; status?: number } | null | undefined, fallback: string): string {
  if (!error) return fallback;
  const seconds = error.message?.match(/after (\d+) seconds?/i)?.[1];
  if (seconds) return dict.dash.auth.waitSeconds.replace("{seconds}", seconds);
  if (error.status === 429) return dict.dash.auth.tooManyAttempts;
  return fallback;
}
