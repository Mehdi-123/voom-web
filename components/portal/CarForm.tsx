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
import { CarIcon, CheckIcon, ImageIcon, MinusIcon, PlusIcon } from "@/components/Icons";
import { useAuth } from "./AuthProvider";
import { useDash } from "./DashContext";
import { Loading, PageHeader } from "./dash-ui";
import { ErrorNote, Field, GhostButton, PrimaryButton, TextInput } from "./ui";

const MAX_PHOTOS = 8;
const THIS_YEAR = new Date().getFullYear();

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

  // Previews made from local files are released when the page closes
  useEffect(() => () => { photos.forEach((p) => { if (p.file) URL.revokeObjectURL(p.url); }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!agency || !loaded) return <Loading />;

  const labels = dict.labels;

  function addFiles(files: FileList | File[] | null) {
    if (!files) return;
    const room = MAX_PHOTOS - photos.length;
    const next = Array.from(files).filter((file) => file.type.startsWith("image/")).slice(0, room)
      .map((file) => ({ key: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`, url: URL.createObjectURL(file), file }));
    setPhotos((all) => [...all, ...next]);
    if (fileInput.current) fileInput.current.value = "";
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
  const title = [make.trim(), model.trim()].filter(Boolean).join(" ");

  return (
    <form onSubmit={save}>
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
              <Field label={f.price}>
                <div className="relative">
                  <TextInput type="number" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} min={0} placeholder="350" className="pe-24 text-xl font-bold" />
                  <span className="pointer-events-none absolute end-5 top-1/2 -translate-y-1/2 text-sm font-bold text-fg/50">MAD</span>
                </div>
              </Field>
            </div>
          </Section>

          <Section title={f.specs}>
            <div className="space-y-7">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-fg/60">{f.category}</p>
                <div className="flex flex-wrap gap-2">{CATEGORIES.map((c) => <button key={c} type="button" onClick={() => setCategory(c)} aria-pressed={category === c} className={pill(category === c)}>{labels.category[c]}</button>)}</div>
              </div>
              <div className="grid gap-7 sm:grid-cols-2">
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-fg/60">{f.transmission}</p>
                  <div className="flex flex-wrap gap-2">{TRANSMISSIONS.map((c) => <button key={c} type="button" onClick={() => setTransmission(c)} aria-pressed={transmission === c} className={pill(transmission === c)}>{labels.transmission[c]}</button>)}</div>
                </div>
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-fg/60">{f.seats}</p>
                  <div className="inline-flex items-center gap-1 rounded-full border border-fg/15 p-1">
                    <button type="button" onClick={() => setSeats(SEATS[Math.max(0, SEATS.indexOf(seats as (typeof SEATS)[number]) - 1)])} aria-label="−" className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-fg/10"><MinusIcon className="h-4 w-4" /></button>
                    <span className="w-10 text-center text-lg font-extrabold tabular-nums">{seats}</span>
                    <button type="button" onClick={() => setSeats(SEATS[Math.min(SEATS.length - 1, SEATS.indexOf(seats as (typeof SEATS)[number]) + 1)])} aria-label="+" className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-fg/10"><PlusIcon className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-fg/60">{f.fuel}</p>
                <div className="flex flex-wrap gap-2">{FUELS.map((c) => <button key={c} type="button" onClick={() => setFuel(c)} aria-pressed={fuel === c} className={pill(fuel === c)}>{labels.fuel[c]}</button>)}</div>
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
