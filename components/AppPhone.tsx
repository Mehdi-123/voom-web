import Image from "next/image";
import PhoneMockup from "@/components/PhoneMockup";

/** A phone showing a real screenshot of the Voom app (the files live in public/app). */
export default function AppPhone({ shot, alt, priority = false, className = "" }: { shot: string; alt: string; priority?: boolean; className?: string }) {
  return (
    <PhoneMockup className={className}>
      <Image src={`/app/${shot}.webp`} alt={alt} fill sizes="290px" priority={priority} className="object-cover object-top" />
    </PhoneMockup>
  );
}
