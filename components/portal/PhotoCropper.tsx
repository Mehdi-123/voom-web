"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fill } from "@/lib/i18n";
import { PrimaryButton } from "./ui";

/** Every car photo is saved at this shape and size, as in the app. */
const RATIO = 4 / 3;
const OUT_W = 1200;
const OUT_H = OUT_W / RATIO;
const MAX_ZOOM = 4;

export type CropLabels = { title: string; photoOf: string; skip: string; hint: string; next: string; done: string; zoom: string };

type Props = {
  file: File;
  index: number;
  total: number;
  labels: CropLabels;
  cancelLabel: string;
  onDone: (photo: Blob) => void;
  onSkip: () => void;
  onCancel: () => void;
};

type View = { x: number; y: number; z: number };

/**
 * Crops one picked photo to the shared 4:3 frame. Drag to move; zoom with the slider, the buttons, the wheel or a pinch.
 * Mount it with a key per photo so each one starts centred and unzoomed.
 */
export default function PhotoCropper({ file, index, total, labels, cancelLabel, onDone, onSkip, onCancel }: Props) {
  const frame = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [frameW, setFrameW] = useState(0);
  const [view, setView] = useState<View>({ x: 0, y: 0, z: 1 });
  const [busy, setBusy] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const frameH = frameW / RATIO;

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const el = new Image();
    el.onload = () => setImage(el);
    el.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const measure = () => setFrameW(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The photo, scaled so that it just covers the frame
  const base = image && frameW ? Math.max(frameW / image.naturalWidth, frameH / image.naturalHeight) : 1;
  const shownW = image ? image.naturalWidth * base * view.z : 0;
  const shownH = image ? image.naturalHeight * base * view.z : 0;

  /** Moves and zooms, keeping the photo covering the frame. */
  const apply = useCallback((x: number, y: number, z: number) => {
    const zoom = Math.min(Math.max(z, 1), MAX_ZOOM);
    const maxX = image ? Math.max(0, (image.naturalWidth * base * zoom - frameW) / 2) : 0;
    const maxY = image ? Math.max(0, (image.naturalHeight * base * zoom - frameH) / 2) : 0;
    setView({ x: Math.min(Math.max(x, -maxX), maxX), y: Math.min(Math.max(y, -maxY), maxY), z: zoom });
  }, [image, base, frameW, frameH]);

  const viewRef = useRef(view);
  useEffect(() => { viewRef.current = view; }, [view]);

  // The wheel zooms; it has to be a non-passive listener to stop the page from scrolling
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const v = viewRef.current;
      apply(v.x, v.y, v.z * Math.exp(-e.deltaY * 0.0015));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [apply]);

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }
  function onPointerMove(e: React.PointerEvent) {
    const last = pointers.current.get(e.pointerId);
    if (!last) return;
    const all = [...pointers.current.values()];
    const spread = () => (all.length >= 2 ? Math.hypot(all[0].x - all[1].x, all[0].y - all[1].y) : 0);
    const before = spread();
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const now = [...pointers.current.values()];
    const v = viewRef.current;
    if (now.length >= 2 && before > 0) {
      apply(v.x, v.y, v.z * (Math.hypot(now[0].x - now[1].x, now[0].y - now[1].y) / before));
    } else {
      apply(v.x + (e.clientX - last.x), v.y + (e.clientY - last.y), v.z);
    }
  }
  const onPointerUp = (e: React.PointerEvent) => { pointers.current.delete(e.pointerId); };

  async function finish() {
    if (!image) return;
    setBusy(true);
    // The part of the original photo that sits inside the frame
    const scale = base * view.z;
    const sx = (shownW / 2 - view.x - frameW / 2) / scale;
    const sy = (shownH / 2 - view.y - frameH / 2) / scale;
    const canvas = document.createElement("canvas");
    canvas.width = OUT_W;
    canvas.height = OUT_H;
    canvas.getContext("2d")!.drawImage(image, sx, sy, frameW / scale, frameH / scale, 0, 0, OUT_W, OUT_H);
    canvas.toBlob((blob) => { if (blob) onDone(blob); else setBusy(false); }, "image/jpeg", 0.88);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const isLast = index + 1 >= total;
  const zoomButton = "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fg/10 text-xl font-semibold transition-colors hover:bg-fg/20 disabled:opacity-35";

  return (
    <div className="scrim fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4" role="dialog" aria-modal="true" aria-label={labels.title}>
      <div className="w-full max-w-xl rounded-[2rem] border border-fg/12 bg-night p-5 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button type="button" onClick={onCancel} disabled={busy} className="text-sm font-semibold text-fg/70 hover:text-fg">{cancelLabel}</button>
          <h2 className="text-center font-display text-lg font-extrabold">{total > 1 ? fill(labels.photoOf, { current: index + 1, total }) : labels.title}</h2>
          {total > 1 ? <button type="button" onClick={onSkip} disabled={busy} className="text-sm font-semibold text-volt-soft hover:underline">{labels.skip}</button> : <span className="w-10" />}
        </div>

        <div
          ref={frame}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative aspect-[4/3] w-full cursor-grab touch-none select-none overflow-hidden rounded-2xl bg-black active:cursor-grabbing"
        >
          {image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={image.src}
              alt=""
              draggable={false}
              className="pointer-events-none absolute start-1/2 top-1/2 max-w-none"
              style={{ width: shownW, height: shownH, transform: `translate(calc(-50% + ${view.x}px), calc(-50% + ${view.y}px))` }}
            />
          ) : null}
          {/* Thirds, to line the car up */}
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,transparent_33.2%,rgba(255,255,255,.28)_33.3%,transparent_33.5%,transparent_66.5%,rgba(255,255,255,.28)_66.6%,transparent_66.8%),linear-gradient(to_bottom,transparent_33.2%,rgba(255,255,255,.28)_33.3%,transparent_33.5%,transparent_66.5%,rgba(255,255,255,.28)_66.6%,transparent_66.8%)]" />
        </div>

        <p className="mt-3 text-center text-xs text-fg/55">{labels.hint}</p>

        <div className="mt-3 flex items-center gap-3">
          <button type="button" aria-label={`${labels.zoom} −`} disabled={view.z <= 1} onClick={() => apply(view.x, view.y, view.z / 1.25)} className={zoomButton}>−</button>
          <input type="range" aria-label={labels.zoom} min={1} max={MAX_ZOOM} step={0.01} value={view.z} onChange={(e) => apply(view.x, view.y, Number(e.target.value))} className="h-1.5 flex-1 cursor-pointer accent-volt" />
          <button type="button" aria-label={`${labels.zoom} +`} disabled={view.z >= MAX_ZOOM} onClick={() => apply(view.x, view.y, view.z * 1.25)} className={zoomButton}>+</button>
        </div>

        <div className="mt-5">
          <PrimaryButton type="button" onClick={finish} loading={busy} disabled={!image}>{isLast ? labels.done : labels.next}</PrimaryButton>
        </div>
      </div>
    </div>
  );
}
