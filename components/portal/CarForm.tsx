"use client";

import { DragEvent, FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";
import { resizeToJpeg } from "@/lib/image";
import { fill, formatPrice } from "@/lib/i18n";
import { CAR_OPTIONS, CATEGORIES, FUELS, SEATS, TRANSMISSIONS } from "@/lib/car-options";
import type { CarRow } from "@/lib/portal-types";
import { CarIcon, CheckIcon, ImageIcon, PlusIcon } from "@/components/Icons";
import { useAuth } from "./AuthProvider";
import { useDash } from "./DashContext";
import { Loading, PageHeader } from "./dash-ui";
import { ErrorNote, Field, GhostButton, PrimaryButton, TextInput } from "./ui";
import { CategoryIcon, LineIcon } from "./CarFormIcons";
import PhotoCropper from "./PhotoCropper";

const MAX_PHOTOS = 8;
const THIS_YEAR = new Date().getFullYear();
const PRICE_STEP = 50;

/** A photo already stored (url only) or one just chosen (file, shown from a local preview). */
type Photo = { key: string; url: string; file?: File };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="glass rounded-[2rem] p-6 sm:p-8">
      <h2 className="mb-6 text-xs font-bold uppercase tracking-wider text-fg/60">{title}</h2>
      {children}
    </section>
  );
}

/** The round − / + button beside the price and the seats. */
function StepButton({ label, onClick, disabled }: { label: "−" | "+"; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.4rem] bg-volt/15 text-2xl font-semibold leading-none text-volt-soft transition-colors hover:bg-volt/25 disabled:cursor-not-allowed disabled:opacity-35">{label}</button>
  );
}

/** A choice shown as a card: purple when picked. `tile` is the colour behind the picture, for the cut-outs of the car drawings. */
const choice = (on: boolean) => `text-start transition-colors ${on ? "bg-volt text-white" : "bg-fg/5 text-fg hover:bg-fg/10"}`;
const tileOf = (on: boolean) => ({ "--tile": on ? "var(--color-volt-soft)" : "var(--color-night)" }) as React.CSSProperties;

/** Add a car, or edit one when the address has an id. Photos are shrunk in the browser, then stored publicly like the app's. */
export default function CarForm() {
  const params = useParams<{ id?: string }>();
  const carId = params.id && params.id !== "new" ? params.id : undefined;
  const { agency } = useAuth();
  const { lang, dict } = useDash();
  const t = dict.dash;
  const f = t.fleet;
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const [loaded, setLoaded] = useState(!carId);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(String(THIS_YEAR));
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<string>("economy");
  const [transmission, setTransmission] = useState<string>("manual");
  const [fuel, setFuel] = useState<string>("petrol");
  const [seats, setSeats] = useState<number>(5);
  const [features, setFeatures] = useState<string[]>([]);
  const [available, setAvailable] = useState(true);
  const [photos, setPhotos] = useState<Photo[]>([]);
  // Photos picked together wait here and are cropped one after the other
  const [queue, setQueue] = useState<File[]>([]);
  const [queueTotal, setQueueTotal] = useState(0);
  const [over, setOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!carId) return;
    sb.from("cars").select("*").eq("id", carId).maybeSingle().then(({ data }) => {
      const car = data as CarRow | null;
      if (car) {
        setMake(car.make); setModel(car.model); setYear(String(car.year)); setPrice(String(car.price_per_day));
        setCategory(car.category); setTransmission(car.transmission); setFuel(car.fuel); setSeats(car.seats);
        setFeatures(car.features ?? []); setAvailable(car.is_available);
        setPhotos((car.images ?? []).map((url, i) => ({ key: `${i}-${url}`, url })));
      }
      setLoaded(true);
    });
  }, [carId]);

  // Pages stay alive, hidden, when you leave them, so a new-car form would still hold the last car typed.
  // Leaving it (after saving, or by going elsewhere) empties it; this runs when the page is hidden.
  useEffect(() => {
    if (carId) return;
    return () => {
      setMake(""); setModel(""); setYear(String(THIS_YEAR)); setPrice("");
      setCategory("economy"); setTransmission("manual"); setFuel("petrol"); setSeats(5);
      setFeatures([]); setAvailable(true);
      setPhotos((all) => { all.forEach((p) => { if (p.file) URL.revokeObjectURL(p.url); }); return []; });
      setQueue([]); setQueueTotal(0); setError(null); setSaving(false);
    };
  }, [carId]);

  // Previews made from local files are released when the page closes
  useEffect(() => () => { photos.forEach((p) => { if (p.file) URL.revokeObjectURL(p.url); }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!agency || !loaded) return <Loading />;

  const labels = dict.labels;

  function addFiles(files: FileList | File[] | null) {
    if (!files) return;
    const room = MAX_PHOTOS - photos.length;
    const picked = Array.from(files).filter((file) => file.type.startsWith("image/")).slice(0, room);
    if (picked.length) { setQueueTotal(picked.length); setQueue(picked); }
    if (fileInput.current) fileInput.current.value = "";
  }
  const nextInQueue = () => setQueue((q) => q.slice(1));
  function addCropped(blob: Blob) {
    const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
    setPhotos((all) => [...all, { key: `${file.name}-${Math.random().toString(36).slice(2)}`, url: URL.createObjectURL(file), file }]);
    nextInQueue();
  }
  function onDrop(e: DragEvent) { e.preventDefault(); setOver(false); addFiles(e.dataTransfer.files); }
  const remove = (key: string) => setPhotos((all) => all.filter((p) => p.key !== key));
  const makeMain = (key: string) => setPhotos((all) => { const p = all.find((x) => x.key === key); return p ? [p, ...all.filter((x) => x.key !== key)] : all; });

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!make.trim() || !model.trim() || !(parseFloat(price) > 0)) { setError(f.required); return; }
    setSaving(true);
    setError(null);

    // New photos go up first, in the order shown; photos already stored keep their address
    const urls: string[] = [];
    for (const photo of photos) {
      if (!photo.file) { urls.push(photo.url); continue; }
      const path = `${agency!.id}-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const blob = await resizeToJpeg(photo.file).catch(() => null);
      const up = blob ? await sb.storage.from("car-images").upload(path, blob, { contentType: "image/jpeg" }) : null;
      if (!up || up.error) { setSaving(false); setError(f.uploadFailed); return; }
      urls.push(sb.storage.from("car-images").getPublicUrl(up.data.path).data.publicUrl);
    }

    const fields = {
      make: make.trim(), model: model.trim(), year: parseInt(year, 10) || THIS_YEAR, price_per_day: parseFloat(price),
      category, transmission, fuel, seats, images: urls, features, is_available: available,
    };
    const result = carId
      ? await sb.from("cars").update(fields).eq("id", carId)
      : await sb.from("cars").insert({ ...fields, agency_id: agency!.id, city: agency!.city, rating: 0, review_count: 0, lat: 0, lng: 0 });
    setSaving(false);
    if (result.error) { setError(f.saveFailed); return; }
    router.push(`/${lang}/dashboard/fleet`);
  }

  const toggle = (label: string) => setFeatures((list) => (list.includes(label) ? list.filter((x) => x !== label) : [...list, label]));
  const pill = (on: boolean) => `flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors ${on ? "border-volt bg-volt text-white" : "border-fg/15 text-fg/75 hover:bg-fg/10"}`;
  const priceNumber = parseFloat(price) || 0;
  const seatIndex = Math.max(0, SEATS.indexOf(seats as (typeof SEATS)[number]));
  const title = [make.trim(), model.trim()].filter(Boolean).join(" ");

  return (
    <form onSubmit={save}>
      {queue[0] ? (
        <PhotoCropper key={queueTotal - queue.length} file={queue[0]} index={queueTotal - queue.length} total={queueTotal} labels={f.crop} cancelLabel={t.common.cancel} onDone={addCropped} onSkip={nextInQueue} onCancel={() => setQueue([])} />
      ) : null}
      <Link href={`/${lang}/dashboard/fleet`} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-fg/70 hover:text-fg"><span className="rtl:rotate-180">←</span> {t.nav.fleet}</Link>
      <PageHeader title={carId ? f.editTitle : f.newTitle} subtitle={agency.approval_status === "pending" ? f.reviewNote : undefined} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          {/* Photos first: they are what sells a car */}
          <Section title={f.photos}>
            <div
              onDragOver={(e) => { e.preventDefault(); setOver(true); }}
              onDragLeave={() => setOver(false)}
              onDrop={onDrop}
              className={`rounded-3xl transition-colors ${over ? "bg-volt/10 ring-2 ring-volt" : ""}`}
            >
              {photos.length === 0 ? (
                <button type="button" onClick={() => fileInput.current?.click()} className="flex w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-fg/20 px-6 py-14 text-center transition-colors hover:bg-fg/5">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-volt/15 text-volt-soft"><ImageIcon className="h-7 w-7" /></span>
                  <span className="font-bold">{f.dropHint}</span>
                  <span className="max-w-sm text-sm text-fg/55">{f.dropSub}</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {photos.map((p, i) => (
                    <div key={p.key} className={`group relative overflow-hidden rounded-2xl bg-fg/5 ${i === 0 ? "col-span-2 row-span-2 aspect-[4/3] sm:aspect-auto" : "aspect-[4/3]"}`}>
                      {p.file
                        /* eslint-disable-next-line @next/next/no-img-element */
                        ? <img src={p.url} alt="" className="h-full w-full object-cover" />
                        : <Image src={p.url} alt="" fill sizes="(min-width: 640px) 33vw, 50vw" className="object-cover" />}
                      {i === 0 ? <span className="absolute start-3 top-3 rounded-full bg-black/70 px-3 py-1 text-[11px] font-bold text-white">{f.mainPhoto}</span> : null}
                      <button type="button" onClick={() => remove(p.key)} aria-label={f.remove} className="absolute end-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-lg leading-none text-white transition-colors hover:bg-black/80">×</button>
                      {i > 0 ? <button type="button" onClick={() => makeMain(p.key)} className="absolute inset-x-2 bottom-2 rounded-full bg-black/65 py-1.5 text-xs font-bold text-white opacity-100 transition-opacity hover:bg-black/85 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100">{f.setMain}</button> : null}
                    </div>
                  ))}
                  {photos.length < MAX_PHOTOS ? (
                    <button type="button" onClick={() => fileInput.current?.click()} className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-fg/20 text-sm font-semibold text-fg/70 transition-colors hover:bg-fg/5">
                      <PlusIcon className="h-6 w-6" />{f.addPhotos}
                    </button>
                  ) : null}
                </div>
              )}
            </div>
            <p className="mt-4 text-sm text-fg/50">{fill(f.photoCount, { n: photos.length })} · {f.photosHint}</p>
            <input ref={fileInput} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => addFiles(e.target.files)} />
          </Section>

          <Section title={f.details}>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label={f.make}><TextInput value={make} onChange={(e) => setMake(e.target.value)} placeholder={f.makePlaceholder} /></Field>
              <Field label={f.model}><TextInput value={model} onChange={(e) => setModel(e.target.value)} placeholder={f.modelPlaceholder} /></Field>
              <Field label={f.year}><TextInput type="number" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} min={1990} max={THIS_YEAR + 1} /></Field>
            </div>

            {/* The price, big, with − / + like in the app */}
            <div className="relative mt-6 flex items-center gap-3 overflow-hidden rounded-3xl bg-[#13121f] p-4 text-white sm:p-5">
              <span aria-hidden className="pointer-events-none absolute -end-12 -top-20 h-48 w-48 rounded-full border-[6px] border-volt/35" />
              <span aria-hidden className="pointer-events-none absolute -end-28 -top-36 h-80 w-80 rounded-full border-[5px] border-volt/20" />
              <StepButton label="−" disabled={priceNumber <= 0} onClick={() => setPrice(String(Math.max(priceNumber - PRICE_STEP, 0)))} />
              <div className="relative min-w-0 flex-1 text-center">
                <label htmlFor="car-price" className="block text-[10px] font-bold uppercase tracking-[0.11em] text-white/45">{f.price}</label>
                <div className="flex items-end justify-center gap-1.5">
                  <input
                    id="car-price"
                    inputMode="decimal"
                    value={price}
                    onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, "").slice(0, 6))}
                    placeholder="0"
                    style={{ width: `${Math.max(price.length, 1) + 0.3}ch` }}
                    className="font-display max-w-full bg-transparent text-center text-5xl font-extrabold leading-tight text-volt outline-none placeholder:text-white/25"
                  />
                  <span className="pb-3 text-sm font-semibold text-white/50">MAD</span>
                </div>
              </div>
              <StepButton label="+" onClick={() => setPrice(String(priceNumber + PRICE_STEP))} />
            </div>
          </Section>

          <Section title={f.specs}>
            <div className="space-y-8">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-fg/60">{f.category}</p>
                <div className="-mx-6 flex gap-2.5 overflow-x-auto px-6 pb-1 no-scrollbar sm:-mx-8 sm:px-8">
                  {CATEGORIES.map((c) => {
                    const on = category === c;
                    return (
                      <button key={c} type="button" onClick={() => setCategory(c)} aria-pressed={on} className={`w-36 shrink-0 rounded-[1.25rem] p-3.5 ${choice(on)}`} style={tileOf(on)}>
                        <span className={`flex h-[42px] w-16 items-center justify-center rounded-[0.875rem] ${on ? "bg-white/20" : "bg-volt/10"} ${on ? "text-white" : "text-volt"}`}><CategoryIcon name={c} className="h-[34px] w-11" /></span>
                        <span className="mt-3 block text-[15px] font-bold">{labels.category[c]}</span>
                        <span className={`mt-0.5 block text-[11px] leading-snug ${on ? "text-white/80" : "text-fg/55"}`}>{labels.categoryHint[c]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-fg/60">{f.seats}</p>
                  <div className="flex items-center gap-3 rounded-3xl bg-fg/5 p-3">
                    <StepButton label="−" disabled={seatIndex <= 0} onClick={() => setSeats(SEATS[seatIndex - 1])} />
                    <div className="flex-1 text-center">
                      <p className="font-display text-4xl font-extrabold leading-none tabular-nums">{seats}</p>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-fg/55">{f.seats}</p>
                    </div>
                    <StepButton label="+" disabled={seatIndex >= SEATS.length - 1} onClick={() => setSeats(SEATS[seatIndex + 1])} />
                  </div>
                </div>
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-fg/60">{f.transmission}</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {TRANSMISSIONS.map((c) => {
                      const on = transmission === c;
                      return (
                        <button key={c} type="button" onClick={() => setTransmission(c)} aria-pressed={on} className={`flex flex-col gap-3.5 rounded-[1.25rem] p-3.5 ${choice(on)} ${on ? "" : "text-fg"}`}>
                          <LineIcon name={c} className={`h-[26px] w-[26px] ${on ? "text-white" : "text-volt"}`} />
                          <span>
                            <span className="block text-[15px] font-bold">{labels.transmission[c]}</span>
                            <span className={`mt-px block text-[11px] ${on ? "text-white/80" : "text-fg/55"}`}>{labels.transmissionHint[c]}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-fg/60">{f.fuel}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {FUELS.map((c) => {
                    const on = fuel === c;
                    return (
                      <button key={c} type="button" onClick={() => setFuel(c)} aria-pressed={on} className={`flex flex-col items-center gap-2 rounded-[1.125rem] py-3.5 ${choice(on)}`}>
                        <LineIcon name={c} className={`h-[22px] w-[22px] ${on ? "text-white" : "text-volt"}`} />
                        <span className="text-xs font-bold">{labels.fuel[c]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Section>

          <Section title={f.features}>
            <div className="flex flex-wrap gap-2">
              {CAR_OPTIONS.map((o) => {
                const on = features.includes(o);
                return (
                  <button key={o} type="button" onClick={() => toggle(o)} aria-pressed={on} className={pill(on)}>
                    {on ? <CheckIcon className="h-4 w-4" /> : null}{labels.options[o] ?? o}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title={f.visibleOn}>
            <button type="button" role="switch" aria-checked={available} onClick={() => setAvailable((a) => !a)} className="flex w-full items-center justify-between gap-4 text-start">
              <span>
                <span className="block font-bold">{f.visibleOn}</span>
                <span className="mt-1 block text-sm text-fg/55">{available ? f.visibleOnText : f.visibleOffText}</span>
              </span>
              <span className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${available ? "bg-go" : "bg-fg/20"}`}>
                <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${available ? "start-7" : "start-1"}`} />
              </span>
            </button>
          </Section>
        </div>

        {/* What customers will see, and the buttons: they stay in view while the form scrolls */}
        <aside className="space-y-5 lg:sticky lg:top-8 lg:self-start">
          <div className="hidden lg:block">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-fg/60">{f.previewTitle}</p>
            <div className="overflow-hidden rounded-[2rem] bg-white text-ink shadow-xl shadow-black/15">
              <div className="relative aspect-[4/3] bg-paper">
                {photos[0] ? (
                  photos[0].file
                    /* eslint-disable-next-line @next/next/no-img-element */
                    ? <img src={photos[0].url} alt="" className="h-full w-full object-cover" />
                    : <Image src={photos[0].url} alt="" fill sizes="22rem" className="object-cover" />
                ) : <span className="absolute inset-0 flex items-center justify-center text-ink/20"><CarIcon className="h-16 w-16" /></span>}
                <span className="absolute start-4 top-4 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold text-white">{labels.category[category as keyof typeof labels.category]}</span>
              </div>
              <div className="space-y-2 p-5">
                <h3 className={`font-display text-2xl font-extrabold leading-tight tracking-tight ${title ? "" : "text-ink/30"}`}>{title || f.namePending}</h3>
                <p className="text-sm text-muted">{year} · {agency.city}</p>
                <p className="text-sm text-muted">{[labels.transmission[transmission as keyof typeof labels.transmission], labels.fuel[fuel as keyof typeof labels.fuel], `${seats} ${dict.car.seats.toLowerCase()}`].join(" · ")}</p>
                <p className="pt-1"><span className="font-display text-2xl font-extrabold text-volt-mid">{priceNumber > 0 ? formatPrice(priceNumber, lang) : "—"}</span> <span className="text-sm text-muted">{dict.car.perDay}</span></p>
              </div>
            </div>
          </div>

          {error ? <ErrorNote>{error}</ErrorNote> : null}
          <div className="flex gap-3">
            <GhostButton type="button" onClick={() => router.push(`/${lang}/dashboard/fleet`)}>{t.common.cancel}</GhostButton>
            <PrimaryButton type="submit" loading={saving}>{saving ? t.common.saving : t.common.save}</PrimaryButton>
          </div>
        </aside>
      </div>
    </form>
  );
}
