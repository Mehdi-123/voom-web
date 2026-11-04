/** A band of big words sliding past endlessly; the list is doubled so the loop has no gap. */
export default function Marquee({ words }: { words: string[] }) {
  const row = (key: string) => (
    <div key={key} aria-hidden={key === "b"} className="flex shrink-0 items-center">
      {words.map((w, i) => (
        <span key={`${key}${w}`} className="flex items-center">
          <span className={`font-display px-8 text-6xl font-extrabold tracking-tight sm:text-8xl ${i % 2 ? "outline-text" : "text-white"}`}>{w}</span>
          <span aria-hidden className="text-4xl text-volt">✦</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="marquee overflow-hidden py-10" dir="ltr">
      <div className="marquee-track">{row("a")}{row("b")}</div>
    </div>
  );
}
