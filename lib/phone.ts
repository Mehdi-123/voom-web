/** Moroccan phone numbers: 9 digits starting with 5, 6, 7 or 8, written with or without the leading 0. */
export function nationalNumber(input: string): string {
  const digits = input.replace(/\D/g, "");
  return digits.startsWith("0") ? digits.slice(1) : digits;
}

export const isValidPhone = (input: string): boolean => /^[5-8]\d{8}$/.test(nationalNumber(input));

/** How the number is stored: +212 and the nine digits. */
export const formatPhone = (input: string): string => `+212 ${nationalNumber(input)}`;
