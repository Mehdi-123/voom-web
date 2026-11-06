import type { ReactNode } from "react";

/**
 * The pictures of the car form's pickers, the same as in the app. The car takes the text colour; the windows and lights
 * are cut out with `--tile`, which the caller sets to the colour behind the icon.
 */
const TILE = "var(--tile)";
const Wheel = ({ x }: { x: number }) => <rect x={x} y={19} width={4} height={7} rx={1.4} fill="currentColor" />;

/** Front views, one per category: narrow, wide, low, tall, boxy. */
const CATEGORY_ART: Record<string, ReactNode> = {
  economy: (
    <>
      <path d="M13 9.5Q14 5 17 5h14q3 0 4 4.5L37 15v8H11v-8z" fill="currentColor" />
      <path d="M15 14l1.2-5h15.6L33 14z" fill={TILE} fillOpacity={0.45} />
      <circle cx={16} cy={19} r={2} fill={TILE} />
      <circle cx={32} cy={19} r={2} fill={TILE} />
      <Wheel x={11} /><Wheel x={33} />
    </>
  ),
  comfort: (
    <>
      <path d="M10 11Q11 6 15 6h18q4 0 5 5l2 4v8H8v-8z" fill="currentColor" />
      <path d="M13 13.5l1.6-5.5h18.8l1.6 5.5z" fill={TILE} fillOpacity={0.45} />
      <rect x={11} y={18} width={7} height={2.4} rx={1.2} fill={TILE} />
      <rect x={30} y={18} width={7} height={2.4} rx={1.2} fill={TILE} />
      <Wheel x={8} /><Wheel x={36} />
    </>
  ),
  luxury: (
    <>
      <path d="M7 14Q9 9 15 8h18q6 1 8 6l2 3v6H5v-6z" fill="currentColor" />
      <path d="M12 13.4l2.4-3.6h19.2l2.4 3.6z" fill={TILE} fillOpacity={0.45} />
      <rect x={10} y={17.2} width={8} height={2} rx={1} fill={TILE} />
      <rect x={30} y={17.2} width={8} height={2} rx={1} fill={TILE} />
      <rect x={20} y={19} width={8} height={3} rx={1.5} fill={TILE} fillOpacity={0.6} />
      <Wheel x={5} /><Wheel x={39} />
      <path d="M24 0.6l.9 2.4 2.4.9-2.4.9L24 7.2l-.9-2.4-2.4-.9 2.4-.9z" fill="currentColor" />
    </>
  ),
  suv: (
    <>
      <path d="M9 11Q10 4.5 15 4.5h18q5 0 6 6.5l1.5 4v9H7.5v-9z" fill="currentColor" />
      <path d="M12.5 14l1.6-7.2h19.8l1.6 7.2z" fill={TILE} fillOpacity={0.45} />
      <path d="M12 2.4h24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <rect x={10} y={17.4} width={7} height={2.4} rx={1.2} fill={TILE} />
      <rect x={31} y={17.4} width={7} height={2.4} rx={1.2} fill={TILE} />
      <Wheel x={7.5} /><Wheel x={36.5} />
    </>
  ),
  van: (
    <>
      <path d="M9 7Q9 3.5 12.5 3.5h23Q39 3.5 39 7l1 16.5H8z" fill="currentColor" />
      <path d="M12 6.5h24l.8 8.5H11.2z" fill={TILE} fillOpacity={0.45} />
      <rect x={11} y={18} width={7} height={2.4} rx={1.2} fill={TILE} />
      <rect x={30} y={18} width={7} height={2.4} rx={1.2} fill={TILE} />
      <Wheel x={9} /><Wheel x={35} />
    </>
  ),
};

export function CategoryIcon({ name, className = "" }: { name: string; className?: string }) {
  return <svg viewBox="0 0 48 32" fill="none" className={className} aria-hidden>{CATEGORY_ART[name]}</svg>;
}

const line = { stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const LINE_ART: Record<string, ReactNode> = {
  manual: (
    <>
      <circle cx="6" cy="5" r="2" {...line} /><circle cx="12" cy="5" r="2" {...line} /><circle cx="18" cy="5" r="2" {...line} />
      <path d="M6 7v12M12 7v12M18 7v12M6 13h12" {...line} />
    </>
  ),
  automatic: (
    <>
      <circle cx="12" cy="12" r="10" {...line} />
      <path d="M8 16l4-9 4 9M9.5 13h5" {...line} />
    </>
  ),
  petrol: (
    <>
      <path d="M14 13h2a2 2 0 012 2v2a2 2 0 004 0v-7a2 2 0 00-.59-1.42L18 5" {...line} />
      <path d="M14 21V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16" {...line} />
      <path d="M2 21h13M3 9h11" {...line} />
    </>
  ),
  diesel: <path d="M12 2.7l5.7 5.6a8 8 0 11-11.4 0z" {...line} />,
  electric: <path d="M13 2L3 14h9l-1 8 10-12h-9z" {...line} />,
  hybrid: (
    <>
      <path d="M11 20A7 7 0 019.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.5 2 8 0 5.5-4.8 10-10 10z" {...line} />
      <path d="M2 21c0-3 1.9-5.5 6-7" {...line} />
    </>
  ),
};

/** Gearbox and fuel pictures. */
export function LineIcon({ name, className = "" }: { name: string; className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>{LINE_ART[name]}</svg>;
}
