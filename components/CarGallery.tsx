"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { fill } from "@/lib/i18n";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, ExpandIcon } from "./Icons";

type Labels = { prev: string; next: string; close: string; open: string; count: string; noPhoto: string };

/**
 * The photos of a car: swipe or scroll the big photo, tap a thumbnail to jump, tap the photo to see it full screen.
 * The full-screen view has arrows, the keyboard (arrows, Escape) and swiping.
 */
export default function CarGallery({ images, name, labels }: { images: string[]; name: string; labels: Labels }) {
  const track = useRef<HTMLDivElement>(null);
  const thumbs = useRef<HTMLDivElement>(null);
  const touchStart = useRef<number | null>(null);
  // True while a tap on a thumbnail or an arrow is scrolling the big photo: the photos it passes on the way must not count as "current"
  const gliding = useRef(false);
  const glideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [index, setIndex] = useState(0);
  const [viewer, setViewer] = useState(false);
  const total = images.length;

  // Which photo is showing, from how far the track is scrolled (works the same left-to-right and right-to-left)
  const onScroll = () => {
    const el = track.current;
    if (!el || !el.clientWidth) return;
    if (gliding.current) {
      // Still travelling to the photo that was asked for: wait until the scroll has been quiet for a moment
      if (glideTimer.current) clearTimeout(glideTimer.current);
      glideTimer.current = setTimeout(() => { gliding.current = false; }, 140);
      return;
    }
    setIndex(Math.min(total - 1, Math.max(0, Math.round(Math.abs(el.scrollLeft) / el.clientWidth))));
  };

  const goTo = useCallback((i: number) => {
    const el = track.current;
    const next = (i + total) % total;
    setIndex(next);
    if (!el) return;
    gliding.current = true;
    if (glideTimer.current) clearTimeout(glideTimer.current);
    // If the track is already there no scroll event follows, so release the lock anyway
    glideTimer.current = setTimeout(() => { gliding.current = false; }, 700);
    const sign = getComputedStyle(el).direction === "rtl" ? -1 : 1;
    el.scrollTo({ left: sign * next * el.clientWidth, behavior: "smooth" });
  }, [total]);

  // Keep the active thumbnail centred in the strip (the strip only, never the page)
  useEffect(() => {
    const strip = thumbs.current;
    const thumb = strip?.children[index] as HTMLElement | undefined;
    if (!strip || !thumb) return;
    const rtl = getComputedStyle(strip).direction === "rtl";
    const centre = thumb.offsetLeft + thumb.offsetWidth / 2;
    const left = rtl ? centre - strip.scrollWidth + strip.clientWidth / 2 : centre - strip.clientWidth / 2;
    const max = strip.scrollWidth - strip.clientWidth;
    strip.scrollTo({ left: rtl ? Math.max(-max, Math.min(0, left)) : Math.max(0, Math.min(max, left)), behavior: "smooth" });
  }, [index]);

  // Full screen: keys, and no scrolling of the page behind
  useEffect(() => {
    if (!viewer) return;
    const rtl = document.documentElement.dir === "rtl";
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewer(false);
      if (e.key === "ArrowRight") setIndex((i) => (i + (rtl ? -1 : 1) + total) % total);
      if (e.key === "ArrowLeft") setIndex((i) => (i + (rtl ? 1 : -1) + total) % total);
    };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKey); };
  }, [viewer, total]);

  // Closing the viewer lands the page gallery on the photo that was last seen
  const closeViewer = () => { setViewer(false); requestAnimationFrame(() => goTo(index)); };

  if (total === 0) {
    return <div className="flex aspect-[4/3] items-center justify-center rounded-[2.5rem] bg-paper text-muted">{labels.noPhoto}</div>;
  }

  const counter = fill(labels.count, { n: index + 1, total });
  const arrow = "absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition-colors hover:bg-black/70";

  return (
    <div className="min-w-0">
      <div className="group relative overflow-hidden rounded-[2.5rem] bg-paper shadow-2xl shadow-volt/20">
        <div ref={track} onScroll={onScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => { setIndex(i); setViewer(true); }}
              aria-label={`${labels.open} (${fill(labels.count, { n: i + 1, total })})`}
              className="relative aspect-[4/3] w-full shrink-0 cursor-zoom-in snap-center"
            >
              <Image src={src} alt={i === 0 ? name : `${name} ${i + 1}`} fill priority={i === 0} sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" draggable={false} />
            </button>
          ))}
        </div>

        {total > 1 ? (
          <>
            <button type="button" onClick={() => goTo(index - 1)} aria-label={labels.prev} className={`${arrow} start-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100`}><ChevronLeftIcon className="h-6 w-6 rtl:rotate-180" /></button>
            <button type="button" onClick={() => goTo(index + 1)} aria-label={labels.next} className={`${arrow} end-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100`}><ChevronRightIcon className="h-6 w-6 rtl:rotate-180" /></button>
          </>
        ) : null}

        <span dir="ltr" className="pointer-events-none absolute bottom-4 end-4 flex items-center gap-2 rounded-full bg-black/55 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur">
          <ExpandIcon className="h-3.5 w-3.5" /> {index + 1} / {total}
        </span>
      </div>

      {total > 1 ? (
        <div ref={thumbs} className="no-scrollbar relative -mx-1.5 mt-3 flex gap-3 overflow-x-auto px-1.5 py-1.5">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => goTo(i)}
              aria-label={fill(labels.count, { n: i + 1, total })}
              aria-current={i === index}
              className={`relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-2xl bg-paper transition-all sm:w-32 ${i === index ? "ring-2 ring-volt ring-offset-2 ring-offset-white" : "opacity-60 hover:opacity-100"}`}
            >
              <Image src={src} alt="" fill sizes="128px" className="object-cover" draggable={false} />
            </button>
          ))}
        </div>
      ) : null}

      {viewer ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={counter}
          className="menu-in fixed inset-0 z-[80] flex flex-col bg-black/95"
          onClick={closeViewer}
          onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchStart.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStart.current;
            touchStart.current = null;
            if (Math.abs(dx) > 50) {
              const rtl = document.documentElement.dir === "rtl";
              setIndex((i) => (i + (dx < 0 !== rtl ? 1 : -1) + total) % total);
            }
          }}
        >
          <div className="flex items-center justify-between p-4 text-white">
            <span dir="auto" className="text-sm font-bold">{counter}</span>
            <button type="button" onClick={(e) => { e.stopPropagation(); closeViewer(); }} aria-label={labels.close} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"><CloseIcon className="h-5 w-5" /></button>
          </div>
          <div className="relative min-h-0 flex-1">
            <Image key={images[index]} src={images[index]} alt={`${name} ${index + 1}`} fill sizes="100vw" className="object-contain" onClick={(e) => e.stopPropagation()} draggable={false} />
            {total > 1 ? (
              <>
                <button type="button" onClick={(e) => { e.stopPropagation(); setIndex((i) => (i - 1 + total) % total); }} aria-label={labels.prev} className={`${arrow} start-3 hidden sm:flex`}><ChevronLeftIcon className="h-6 w-6 rtl:rotate-180" /></button>
                <button type="button" onClick={(e) => { e.stopPropagation(); setIndex((i) => (i + 1) % total); }} aria-label={labels.next} className={`${arrow} end-3 hidden sm:flex`}><ChevronRightIcon className="h-6 w-6 rtl:rotate-180" /></button>
              </>
            ) : null}
          </div>
          <div className="h-4" />
        </div>
      ) : null}
    </div>
  );
}
