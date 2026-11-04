import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyTurnstile } from "@/lib/turnstile";

type Body =
  | { action: "signup"; token?: string; email: string; password: string; data: Record<string, unknown> }
  | { action: "recover"; token?: string; email: string };

/**
 * Sign-up and password-reset emails, sent only after Cloudflare confirms a person passed the check.
 * The code that arrives by email is then entered on the page and verified with Supabase as before.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body || (body.action !== "signup" && body.action !== "recover") || typeof body.email !== "string") {
    return NextResponse.json({ error: { code: "bad_request", message: "Bad request" } }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  if (!(await verifyTurnstile(body.token, ip))) {
    return NextResponse.json({ error: { code: "captcha_failed", message: "Check failed" } }, { status: 400 });
  }

  // A throwaway client: the person's own session is created later, when they enter the emailed code
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  if (body.action === "recover") {
    const { error } = await supabase.auth.resetPasswordForEmail(body.email);
    return error ? NextResponse.json({ error: { code: error.code, message: error.message, status: error.status } }, { status: error.status ?? 400 }) : NextResponse.json({ ok: true });
  }

  const { data, error } = await supabase.auth.signUp({ email: body.email, password: body.password, options: { data: body.data } });
  if (error) return NextResponse.json({ error: { code: error.code, message: error.message, status: error.status } }, { status: error.status ?? 400 });
  // An address that is already registered comes back as a user with no identities
  return NextResponse.json({ ok: true, exists: !!data.user && (data.user.identities?.length ?? 1) === 0 });
}
