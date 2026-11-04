import { ReactNode } from "react";

/** A phone drawn in CSS to show the Voom app. The screen is whatever you put inside. */
export default function PhoneMockup({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative mx-auto aspect-[9/19] w-[min(290px,72vw)] rounded-[3rem] border-[10px] border-[#1c1a2c] bg-[#1c1a2c] shadow-[0_40px_120px_-20px_rgba(162,89,255,0.55)] ${className}`}>
      <div className="relative h-full w-full overflow-hidden rounded-[2.3rem] bg-[#f0f0f0] text-ink">{children}</div>
      <span aria-hidden className="absolute start-1/2 top-2.5 h-5 w-20 -translate-x-1/2 rounded-full bg-[#1c1a2c] rtl:translate-x-1/2" />
    </div>
  );
}
