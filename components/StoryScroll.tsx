"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

type Step = { title: string; text: string };

/**
 * "How it works" as a story: the text scrolls, and the phone beside it stays put and changes screen with each step.
 * On narrow screens each step shows its own phone below its text instead.
 */
export default function StoryScroll({ steps, phones }: { steps: Step[]; phones: ReactNode[] }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
        });
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-24">
      <ol>
        {steps.map((s, i) => (
          <li
            key={s.title}
            ref={(el) => { refs.current[i] = el; }}
            data-index={i}
            className="flex min-h-[40vh] flex-col justify-center gap-6 py-10 lg:min-h-[85vh]"
          >
            <span className={`font-display text-8xl font-extrabold leading-none transition-colors duration-500 sm:text-9xl ${active === i ? "text-volt" : "outline-text"}`}>{i + 1}</span>
            <div className={`transition-opacity duration-500 ${active === i ? "lg:opacity-100" : "lg:opacity-30"}`}>
              <h3 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{s.title}</h3>
              <p className="mt-3 max-w-md text-lg leading-relaxed text-white/60">{s.text}</p>
            </div>
            <div className="lg:hidden">{phones[i]}</div>
          </li>
        ))}
      </ol>

      <div className="relative hidden lg:block">
        <div className="sticky top-0 flex h-screen items-center justify-center">
          <div className="relative w-[290px]">
            {phones.map((p, i) => (
              <div key={i} className={`transition-all duration-700 ${i === 0 ? "" : "absolute inset-0"} ${active === i ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
                {p}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
