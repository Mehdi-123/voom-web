/** A country a phone number can be from: its code and the dial prefix. The names come from the browser in the reader's language. */
export type Country = { iso: string; dial: string };

// Morocco first, then the countries people call from, alphabetical by name (as in the app)
export const COUNTRIES: Country[] = [
  { iso: "MA", dial: "+212" }, { iso: "DZ", dial: "+213" }, { iso: "AR", dial: "+54" }, { iso: "AT", dial: "+43" }, { iso: "BH", dial: "+973" },
  { iso: "BE", dial: "+32" }, { iso: "BR", dial: "+55" }, { iso: "BF", dial: "+226" }, { iso: "CM", dial: "+237" }, { iso: "CA", dial: "+1" },
  { iso: "CN", dial: "+86" }, { iso: "CO", dial: "+57" }, { iso: "DK", dial: "+45" }, { iso: "EG", dial: "+20" }, { iso: "FR", dial: "+33" },
  { iso: "DE", dial: "+49" }, { iso: "GH", dial: "+233" }, { iso: "GR", dial: "+30" }, { iso: "IN", dial: "+91" }, { iso: "IQ", dial: "+964" },
  { iso: "IT", dial: "+39" }, { iso: "CI", dial: "+225" }, { iso: "JP", dial: "+81" }, { iso: "JO", dial: "+962" }, { iso: "KW", dial: "+965" },
  { iso: "LB", dial: "+961" }, { iso: "LY", dial: "+218" }, { iso: "ML", dial: "+223" }, { iso: "MR", dial: "+222" }, { iso: "MX", dial: "+52" },
  { iso: "NL", dial: "+31" }, { iso: "NG", dial: "+234" }, { iso: "NO", dial: "+47" }, { iso: "OM", dial: "+968" }, { iso: "PK", dial: "+92" },
  { iso: "PS", dial: "+970" }, { iso: "PL", dial: "+48" }, { iso: "PT", dial: "+351" }, { iso: "QA", dial: "+974" }, { iso: "SA", dial: "+966" },
  { iso: "SN", dial: "+221" }, { iso: "ZA", dial: "+27" }, { iso: "ES", dial: "+34" }, { iso: "SE", dial: "+46" }, { iso: "CH", dial: "+41" },
  { iso: "SY", dial: "+963" }, { iso: "TN", dial: "+216" }, { iso: "TR", dial: "+90" }, { iso: "AE", dial: "+971" }, { iso: "GB", dial: "+44" },
  { iso: "US", dial: "+1" }, { iso: "YE", dial: "+967" },
];

export const DEFAULT_COUNTRY: Country = COUNTRIES[0];

// Length of the national number (without the country code or a leading 0), as [min, max] digits
const LENGTHS: Record<string, [number, number]> = {
  MA: [9, 9], DZ: [9, 9], TN: [8, 8], LY: [9, 9], MR: [8, 8], EG: [10, 10], FR: [9, 9], ES: [9, 9], IT: [9, 10], DE: [10, 11], GB: [10, 10],
  US: [10, 10], CA: [10, 10], BE: [8, 9], NL: [9, 9], PT: [9, 9], CH: [9, 9], AT: [10, 13], GR: [10, 10], PL: [9, 9], DK: [8, 8], NO: [8, 8],
  SE: [7, 10], TR: [10, 10], SA: [9, 9], AE: [9, 9], QA: [8, 8], KW: [8, 8], BH: [8, 8], OM: [8, 8], JO: [9, 9], LB: [7, 8], IQ: [10, 10],
  SY: [9, 9], PS: [9, 9], YE: [9, 9], SN: [9, 9], ML: [8, 8], CI: [10, 10], CM: [9, 9], BF: [8, 8], GH: [9, 9], NG: [10, 10], ZA: [9, 9],
  IN: [10, 10], PK: [10, 10], CN: [11, 11], JP: [10, 10], BR: [10, 11], MX: [10, 10], AR: [10, 10], CO: [10, 10],
};
const DEFAULT_LENGTH: [number, number] = [6, 12];

/** Italian numbers really start with 0 or 3; everywhere else a leading 0 is only the local dialling habit. */
const KEEPS_LEADING_ZERO = ["IT"];

/** The flag, from the two letters of the country code. */
export const flagOf = (country: Country): string => String.fromCodePoint(...[...country.iso].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

/** The country's name in the reader's language. */
export function countryName(country: Country, lang: string): string {
  try { return new Intl.DisplayNames([lang], { type: "region" }).of(country.iso) ?? country.iso; } catch { return country.iso; }
}

/** Only the digits typed, without the local leading 0 (people write 06 12 34 56 78 in Morocco). */
export function nationalNumber(country: Country, input: string): string {
  const digits = input.replace(/\D/g, "");
  return digits.startsWith("0") && !KEEPS_LEADING_ZERO.includes(country.iso) ? digits.slice(1) : digits;
}

export function isValidPhone(country: Country, input: string): boolean {
  const [min, max] = LENGTHS[country.iso] ?? DEFAULT_LENGTH;
  const n = nationalNumber(country, input);
  if (n.length < min || n.length > max) return false;
  // Moroccan numbers start with 5 (landline), 6 or 7 (mobile), or 8 (services)
  return country.iso !== "MA" || /^[5-8]/.test(n);
}

/** How the number is stored: the country code and the clean national number, or "" when nothing was typed. */
export function formatPhone(country: Country, input: string): string {
  const n = nationalNumber(country, input);
  return n ? `${country.dial} ${n}` : "";
}

/** A stored number split back into its country and the rest. */
export function parsePhone(stored: string | null | undefined): { country: Country; number: string } {
  if (!stored) return { country: DEFAULT_COUNTRY, number: "" };
  const cleaned = stored.replace(/\s+/g, "");
  const match = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length).find((c) => cleaned.startsWith(c.dial));
  return match ? { country: match, number: cleaned.slice(match.dial.length) } : { country: DEFAULT_COUNTRY, number: stored };
}
