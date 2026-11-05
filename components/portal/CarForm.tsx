"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";
import { resizeToJpeg } from "@/lib/image";
import { CAR_OPTIONS, CATEGORIES, FUELS, SEATS, TRANSMISSIONS } from "@/lib/car-options";
import type { CarRow } from "@/lib/portal-types";
import { useAuth } from "./AuthProvider";
import { useDash } from "./DashContext";
import { Loading, PageHeader } from "./dash-ui";
import { ErrorNote, Field, GhostButton, PrimaryButton, SelectInput, TextInput } from "./ui";

const MAX_PHOTOS = 8;
const THIS_YEAR = new Date().getFullYear();

type NewPhoto = { file: File; preview: string };

/** Add a car, or edit one when the address has an id. Photos are shrunk in the browser, then stored publicly like the app's. */
export default function CarForm() {
  const params = useParams<{ id?: string }>();
  const carId = params.id && params.id !== "new" ? params.id : undefined;
  const { agency } = useAuth();
  const { lang, dict } = useDash();
  const t = dict.dash;
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
  const [seats, setSeats] = useState("5");
  const [features, setFeatures] = useState<string[]>([]);
  const [available, setAvailable] = useState(true);
  const [existing, setExisting] = useState<string[]>([]);
  const [added, setAdded] = useState<NewPhoto[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!carId) return;
    sb.from("cars").select("*").eq("id", carId).maybeSingle().then(({ data }) => {
      const car = data as CarRow | null;
      if (car) {
        setMake(car.make); setModel(car.model); setYear(String(car.year)); setPrice(String(car.price_per_day));
        setCategory(car.category); setTransmission(car.transmission); setFuel(car.fuel); setSeats(String(car.seats));
        setFeatures(car.features ?? []); setAvailable(car.is_available); setExisting(car.images ?? []);
      }
      setLoaded(true);
    });
  }, [carId]);

  if (!agency || !loaded) return <Loading />;

  const photoCount = existing.length + added.length;
  const labels = dict.labels;

  function pick(files: FileList | null) {
    if (!files) return;
    const room = MAX_PHOTOS - photoCount;
    const next = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, room).map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setAdded((a) => [...a, ...next]);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!make.trim() || !model.trim() || !(parseFloat(price) > 0)) { setError(t.fleet.required); return; }
    setSaving(true);
    setError(null);

    // New photos go up first; the car keeps the ones it already had
    const urls: string[] = [...existing];
    for (const photo of added) {
      const path = `${agency!.id}-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const blob = await resizeToJpeg(photo.file).catch(() => null);
      const up = blob ? await sb.storage.from("car-images").upload(path, blob, { contentType: "image/jpeg" }) : null;
      if (!up || up.error) { setSaving(false); setError(t.fleet.uploadFailed); return; }
      urls.push(sb.storage.from("car-images").getPublicUrl(up.data.path).data.publicUrl);
    }

    const fields = {
      make: make.trim(), model: model.trim(), year: parseInt(year, 10) || THIS_YEAR, price_per_day: parseFloat(price),
      category, transmission, fuel, seats: parseInt(seats, 10), images: urls, features, is_available: available,
    };
    const result = carId
      ? await sb.from("cars").update(fields).eq("id", carId)
      : await sb.from("cars").insert({ ...fields, agency_id: agency!.id, city: agency!.city, rating: 0, review_count: 0, lat: 0, lng: 0 });
    setSaving(false);
    if (result.error) { setError(t.fleet.saveFailed); return; }
    router.push(`/${lang}/dashboard/fleet`);
  }

  const toggle = (label: string) => setFeatures((f) => (f.includes(label) ? f.filter((x) => x !== label) : [...f, label]));
  const chip = (on: boolean) => `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${on ? "bg-volt text-white" : "glass text-fg/70 hover:bg-fg/10"}`;

  return (
    <form onSubmit={save} className="max-w-3xl space-y-8">
      <Link href={`/${lang}/dashboard/fleet`} className="inline-flex items-center gap-2 text-sm font-semibold text-fg/70 hover:text-fg"><span className="rtl:rotate-180">←</span> {t.nav.fleet}</Link>
      <PageHeader title={carId ? t.fleet.editTitle : t.fleet.newTitle} subtitle={agency.approval_status === "pending" ? t.fleet.reviewNote : undefined} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t.fleet.make}><TextInput value={make} onChange={(e) => setMake(e.target.value)} placeholder={t.fleet.makePlaceholder} /></Field>
        <Field label={t.fleet.model}><TextInput value={model} onChange={(e) => setModel(e.target.value)} placeholder={t.fleet.modelPlaceholder} /></Field>
        <Field label={t.fleet.year}><TextInput type="number" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} min={1990} max={THIS_YEAR + 1} /></Field>
        <Field label={t.fleet.price}><TextInput type="number" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} min={0} placeholder="350" /></Field>
        <Field label={t.fleet.category}>
          <SelectInput value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c} className="bg-night">{labels.category[c]}</option>)}
          </SelectInput>
        </Field>
        <Field label={t.fleet.transmission}>
          <SelectInput value={transmission} onChange={(e) => setTransmission(e.target.value)}>
            {TRANSMISSIONS.map((c) => <option key={c} value={c} className="bg-night">{labels.transmission[c]}</option>)}
          </SelectInput>
        </Field>
        <Field label={t.fleet.fuel}>
          <SelectInput value={fuel} onChange={(e) => setFuel(e.target.value)}>
            {FUELS.map((c) => <option key={c} value={c} className="bg-night">{labels.fuel[c]}</option>)}
          </SelectInput>
        </Field>
        <Field label={t.fleet.seats}>
          <SelectInput value={seats} onChange={(e) => setSeats(e.target.value)}>
            {SEATS.map((s) => <option key={s} value={s} className="bg-night">{s}</option>)}
          </SelectInput>
        </Field>
      </div>

      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-fg/60">{t.fleet.features}</p>
        <div className="flex flex-wrap gap-2">
          {CAR_OPTIONS.map((o) => (
            <button key={o} type="button" onClick={() => toggle(o)} className={chip(features.includes(o))}>{labels.options[o] ?? o}</button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-fg/60">{t.fleet.photos}</p>
        <p className="mb-4 text-sm text-fg/45">{t.fleet.photosHint}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {existing.map((url, i) => (
            <div key={url} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-fg/5">
              <Image src={url} alt="" fill sizes="200px" className="object-cover" />
              {i === 0 ? <span className="absolute start-2 top-2 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold text-white">{t.fleet.mainPhoto}</span> : null}
              <button type="button" onClick={() => setExisting((x) => x.filter((u) => u !== url))} aria-label={t.fleet.remove} className="absolute end-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-page/80 text-sm">×</button>
            </div>
          ))}
          {added.map((p, i) => (
            <div key={p.preview} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-fg/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.preview} alt="" className="h-full w-full object-cover" />
              {existing.length === 0 && i === 0 ? <span className="absolute start-2 top-2 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold text-white">{t.fleet.mainPhoto}</span> : null}
              <button type="button" onClick={() => setAdded((a) => a.filter((x) => x !== p))} aria-label={t.fleet.remove} className="absolute end-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-page/80 text-sm">×</button>
            </div>
          ))}
          {photoCount < MAX_PHOTOS ? (
            <button type="button" onClick={() => fileInput.current?.click()} className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-fg/20 text-sm font-semibold text-fg/70 transition-colors hover:bg-fg/5">
              <span className="text-2xl">+</span>{t.fleet.addPhotos}
            </button>
          ) : null}
        </div>
        <input ref={fileInput} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => pick(e.target.files)} />
      </div>

      <label className="flex cursor-pointer items-center gap-3">
        <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} className="h-5 w-5 accent-[#a259ff]" />
        <span className="font-semibold">{t.fleet.available}</span>
      </label>

      {error ? <ErrorNote>{error}</ErrorNote> : null}

      <div className="flex gap-3">
        <GhostButton type="button" onClick={() => router.push(`/${lang}/dashboard/fleet`)}>{t.common.cancel}</GhostButton>
        <PrimaryButton type="submit" loading={saving} className="sm:w-auto sm:min-w-48">{saving ? t.common.saving : t.common.save}</PrimaryButton>
      </div>
    </form>
  );
}
