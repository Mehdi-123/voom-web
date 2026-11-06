"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/dictionaries/fr";
import { IDENTITY_DOCS, MAX_PHOTO, type DocFiles, type DocKey } from "@/lib/identity-docs";
import { CameraIcon } from "@/components/Icons";

/** One photo slot: shows the chosen picture, or an invitation to pick one. */
function Slot({ label, url, error, onPick }: { label: string; url?: string; error?: string; onPick: (file: File | null) => void }) {
  return (
    <div>
      <label className={`group relative flex aspect-[1.6] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 text-center transition-colors focus-within:ring-2 focus-within:ring-volt/60 ${error ? "border-danger" : url ? "border-volt/60" : "border-dashed border-fg/20 bg-fg/[0.03] hover:border-volt/50 hover:bg-volt/5"}`}>
        <input type="file" accept="image/jpeg,image/png" className="sr-only" onChange={(e) => { onPick(e.target.files?.[0] ?? null); e.target.value = ""; }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url ? <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-full bg-volt/12 text-volt-soft"><CameraIcon className="h-5 w-5" /></span>}
        {url ? <span className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1.5 text-xs font-semibold text-white">{label}</span> : <span className="px-3 text-xs font-semibold text-fg/70">{label}</span>}
      </label>
      {error ? <span className="mt-1.5 block text-xs text-danger">{error}</span> : null}
    </div>
  );
}

/** The four renter photos (ID card and licence, both sides) as a 2 × 2 grid (a single row when `wide` and the screen allows). Files stay in the parent until they are sent. */
export default function IdentityPhotos({ dict, files, onChange, wide = false }: { dict: Dictionary; files: DocFiles; onChange: (files: DocFiles) => void; wide?: boolean }) {
  const t = dict.dash.auth;
  const labels = dict.dash.review.docs;
  const [errors, setErrors] = useState<Partial<Record<DocKey, string>>>({});
  // Pictures already chosen (the person went back a step) are shown again
  const [previews, setPreviews] = useState<Partial<Record<DocKey, string>>>(() => Object.fromEntries(IDENTITY_DOCS.flatMap((d) => (files[d.key] ? [[d.key, URL.createObjectURL(files[d.key]!)]] : []))));
  const latest = useRef(previews);
  useEffect(() => { latest.current = previews; });
  useEffect(() => () => Object.values(latest.current).forEach((u) => u && URL.revokeObjectURL(u)), []);

  function pick(key: DocKey, file: File | null) {
    if (file && !["image/jpeg", "image/png"].includes(file.type)) { setErrors((e) => ({ ...e, [key]: t.fileType })); return; }
    if (file && file.size > MAX_PHOTO) { setErrors((e) => ({ ...e, [key]: t.fileTooBig })); return; }
    setErrors((e) => ({ ...e, [key]: undefined }));
    if (previews[key]) URL.revokeObjectURL(previews[key]!);
    const url = file ? URL.createObjectURL(file) : undefined;
    setPreviews((p) => ({ ...p, [key]: url }));
    onChange({ ...files, [key]: file });
  }

  return (
    <div>
      <div className={`grid grid-cols-2 gap-3 ${wide ? "lg:grid-cols-4" : ""}`}>
        {IDENTITY_DOCS.map((d) => <Slot key={d.key} label={labels[d.key]} url={previews[d.key]} error={errors[d.key]} onPick={(f) => pick(d.key, f)} />)}
      </div>
      <p className="mt-2.5 text-xs text-fg/45">{t.docsHint}</p>
    </div>
  );
}
