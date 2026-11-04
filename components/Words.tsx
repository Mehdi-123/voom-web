/** A headline whose words slide up one after another; put it inside a Reveal so it plays when it comes into view. */
export default function Words({ text, step = 70, start = 0 }: { text: string; step?: number; start?: number }) {
  return (
    <>
      {text.split(" ").map((word, i) => (
        <span key={i}>
          <span className="word"><span style={{ "--d": `${start + i * step}ms` } as React.CSSProperties}>{word}</span></span>{" "}
        </span>
      ))}
    </>
  );
}
