/** Cloudflare Turnstile: the site key is public (it draws the widget), the secret key stays on the server. */
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

/** True when the check is switched on; without keys the forms work as before (handy while developing). */
export const turnstileEnabled = TURNSTILE_SITE_KEY.length > 0;

/** Server side: asks Cloudflare whether this token came from a real person who just passed the check. */
export async function verifyTurnstile(token: string | undefined, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return !turnstileEnabled;
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
    const json = (await res.json()) as { success?: boolean };
    return json.success === true;
  } catch {
    return false;
  }
}
