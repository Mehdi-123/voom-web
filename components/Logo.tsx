import Image from "next/image";

/** The Voom logo, in white for dark backgrounds or black for light ones. */
export default function Logo({ tone = "black", height = 28 }: { tone?: "white" | "black"; height?: number }) {
  return (
    <Image
      src={tone === "white" ? "/logo-white.svg" : "/logo-black.svg"}
      alt="Voom"
      width={Math.round(height * (245 / 45))}
      height={height}
      priority
      unoptimized
      draggable={false}
      className="pointer-events-none select-none"
    />
  );
}
