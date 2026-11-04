import JsonLd from "./JsonLd";

type Item = { q: string; a: string };

/** Questions that open and close, plus the structured data Google uses for FAQ results. */
export default function Faq({ title, items }: { title: string; items: Item[] }) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-24">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
        }}
      />
      <h2 className="font-display mb-10 text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h2>
      <div className="space-y-3">
        {items.map((i) => (
          <details key={i.q} className="group glass rounded-3xl px-6 py-5 transition-colors open:bg-white/10">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
              {i.q}
              <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-volt/20 text-xl text-volt-soft transition-transform duration-300 group-open:rotate-45">+</span>
            </summary>
            <p className="mt-4 leading-relaxed text-white/60">{i.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
