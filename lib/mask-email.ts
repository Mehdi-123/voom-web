/** "elmehdi.azhoune@gmail.com" → "el•••••••••••e@gmail.com": enough to recognise the inbox, not enough to read the address. Isolated so it keeps its order in right-to-left text. */
export function maskEmail(email: string): string {
  const [local, domain = ""] = email.split("@");
  if (!domain) return email;
  const head = local.length > 4 ? 2 : 1;
  const tail = local.length > 4 ? local.slice(-1) : "";
  const hidden = "•".repeat(Math.max(3, local.length - head - tail.length));
  return `\u2066${local.slice(0, head)}${hidden}${tail}@${domain}\u2069`;
}
