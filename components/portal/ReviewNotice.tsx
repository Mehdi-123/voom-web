/** Shown on the agency home while its file is being checked: where the review stands, as in the app. */
export default function ReviewNotice({ title, text, steps }: { title: string; text: string; steps: readonly string[] }) {
  // Done, in progress, not started
  const fills = [1, 0.5, 0];
  return (
    <section className="mb-8 rounded-3xl border border-fg/12 bg-night p-6 shadow-sm shadow-black/5 sm:p-8">
      <p className="inline-flex items-center gap-2 rounded-full bg-volt/15 px-3 py-1.5 text-xs font-bold text-volt-soft">
        <span aria-hidden className="h-2 w-2 rounded-full bg-volt" />
        {steps[1]}
      </p>
      <h2 className="font-display mt-4 text-balance text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
      <p className="mt-2 max-w-2xl leading-relaxed text-fg/65">{text}</p>

      <ol className="mt-7 grid grid-cols-3 gap-3">
        {steps.map((label, i) => (
          <li key={label}>
            <span className="block h-1 overflow-hidden rounded-full bg-fg/12">
              <span className="block h-full rounded-full bg-volt" style={{ width: `${fills[i] * 100}%` }} />
            </span>
            <span className={`mt-2 block text-xs leading-snug ${i === 1 ? "font-bold" : i === 2 ? "text-fg/40" : "text-fg/65"}`}>{label}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
