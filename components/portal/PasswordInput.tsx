"use client";

import { forwardRef, InputHTMLAttributes, useState } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/Icons";
import { TextInput } from "./ui";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { invalid?: boolean; common: { showPassword: string; hidePassword: string } };

/** A password field with an eye to read what was typed. */
const PasswordInput = forwardRef<HTMLInputElement, Props>(function PasswordInput({ common, className = "", ...props }, ref) {
  const [shown, setShown] = useState(false);
  const label = shown ? common.hidePassword : common.showPassword;
  return (
    <div className="relative">
      <TextInput ref={ref} {...props} type={shown ? "text" : "password"} className={`pe-14 ${className}`} />
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        aria-label={label}
        aria-pressed={shown}
        title={label}
        className="absolute end-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-fg/55 transition-colors hover:bg-fg/10 hover:text-fg focus-visible:outline-2 focus-visible:outline-volt"
      >
        {shown ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
      </button>
    </div>
  );
});

export default PasswordInput;
