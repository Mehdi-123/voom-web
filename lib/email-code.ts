import { sb } from "./supabase-browser";

/** Sends a new sign-in code to an account that exists (an account never confirmed gets its sign-up code again). */
export async function sendEmailCode(email: string) {
  const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
  if (error) await sb.auth.resend({ type: "signup", email });
}

/** Checks the code the person typed: a sign-in code or, for a new account, its sign-up code. */
export async function verifyEmailCode(email: string, token: string) {
  const first = await sb.auth.verifyOtp({ email, token, type: "email" });
  return first.error ? sb.auth.verifyOtp({ email, token, type: "signup" }) : first;
}
