/** The same password rules as the Voom app. */
export const PASSWORD_RULES = {
  minLength: (p: string) => p.length >= 8,
  uppercase: (p: string) => /[A-Z]/.test(p),
  number: (p: string) => /[0-9]/.test(p),
};

export const isStrongPassword = (p: string) => Object.values(PASSWORD_RULES).every((rule) => rule(p));
