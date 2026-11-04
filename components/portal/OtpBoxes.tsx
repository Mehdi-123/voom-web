"use client";

import { useRef } from "react";

export const OTP_LENGTH = 6;

/** Six boxes for a one-time code: typing moves on, backspace moves back, and a pasted code fills them all. */
export default function OtpBoxes({ digits, onChange, label }: { digits: string[]; onChange: (digits: string[]) => void; label: string }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const setAt = (index: number, text: string) => {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length > 1) {
      // A pasted code: spread it across the boxes
      const next = Array(OTP_LENGTH).fill("");
      cleaned.slice(0, OTP_LENGTH).split("").forEach((ch, i) => { next[i] = ch; });
      onChange(next);
      refs.current[Math.min(cleaned.length, OTP_LENGTH - 1)]?.focus();
      return;
    }
    const next = [...digits];
    next[index] = cleaned;
    onChange(next);
    if (cleaned && index < OTP_LENGTH - 1) refs.current[index + 1]?.focus();
  };

  return (
    <div role="group" aria-label={label} dir="ltr" className="flex justify-between gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={d}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={OTP_LENGTH}
          aria-label={`${label} ${i + 1}`}
          onChange={(e) => setAt(i, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i] && i > 0) {
              const next = [...digits];
              next[i - 1] = "";
              onChange(next);
              refs.current[i - 1]?.focus();
            }
          }}
          onFocus={(e) => e.target.select()}
          className={`h-16 w-full min-w-0 rounded-2xl border bg-white/5 text-center text-2xl font-bold text-white outline-none transition-colors focus:border-volt focus:bg-white/10 ${d ? "border-volt/60 bg-volt/10" : "border-white/15"}`}
        />
      ))}
    </div>
  );
}
