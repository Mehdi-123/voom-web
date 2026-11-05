import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale, getDictionary } from "@/lib/i18n";
import { CITIES } from "@/lib/cities";
import { getCars } from "@/lib/cars";
import CarCard from "@/components/CarCard";
import CitySearch from "@/components/CitySearch";
import StoreBadges from "@/components/StoreBadges";
import Faq from "@/components/Faq";
import Reveal from "@/components/Reveal";
import Words from "@/components/Words";
import Marquee from "@/components/Marquee";
import AppPhone from "@/components/AppPhone";
import StoryScroll from "@/components/StoryScroll";
import ScrollTop from "@/components/ScrollTop";
import { ArrowIcon } from "@/components/Icons";
import { Banknotes, IdScan, PhoneBooking, VerifiedStamp, WhyCard } from "@/components/WhyVisuals";

// One hue per city tile, around the brand's purple
const HUES = [268, 285, 250, 300, 235, 275, 262, 312, 245, 290, 272, 256];

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const cars = await getCars({ limit: 8 });
  // Real screenshots of the app, in the order of the three steps
  const storyPhones = [
    { shot: "car", alt: dict.how.steps[0].title },
    { shot: "book-dates", alt: dict.how.steps[1].title },
    { shot: "booking", alt: dict.mock.confirmed },
  ];

  return (
    <>
      {/* ── Hero ── */}
      <section className="night grain relative isolate z-10 overflow-x-clip">
        <div aria-hidden className="parallax pointer-events-none absolute inset-0 -z-10">
          <span className="sweep top-[22%] w-[38rem]" style={{ animationDelay: "0s" }} />
          <span className="sweep top-[48%] w-[26rem]" style={{ animationDelay: "1.8s", opacity: 0.6 }} />
          <span className="sweep top-[74%] w-[32rem]" style={{ animationDelay: "3.4s" }} />
        </div>
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-24 pt-32 lg:grid-cols-[1.25fr_1fr] lg:pb-28 lg:pt-36">
          <div>
            <Reveal>
              <p className="glass mb-8 inline-flex items-center gap-3 rounded-full px-4 py-2 text-sm font-semibold text-volt-soft">
                <span className="relative flex h-2.5 w-2.5"><span aria-hidden className="absolute inset-0 rounded-full bg-go" style={{ animation: "pulse-ring 2s ease-out infinite" }} /><span className="relative h-2.5 w-2.5 rounded-full bg-go" /></span>
                {dict.hero.eyebrow}
              </p>
            </Reveal>
            <Reveal as="h1" variant="none" className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              <Words text={dict.hero.title} />
            </Reveal>
            <Reveal delay={500}><p className="mt-8 max-w-xl text-lg leading-relaxed text-white/65 sm:text-xl">{dict.hero.subtitle}</p></Reveal>
            <Reveal delay={650} className="mt-10"><CitySearch lang={lang} label={dict.hero.cityLabel} button={dict.hero.search} /></Reveal>
            <Reveal delay={800} className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-white/60">
              {dict.hero.chips.map((c) => <span key={c} className="flex items-center gap-2"><span className="text-go">✓</span>{c}</span>)}
            </Reveal>
          </div>

          <Reveal variant="side" delay={300} className="relative mx-auto w-full max-w-sm lg:max-w-none">
            <div className="float [--r:4deg]"><AppPhone shot="home" alt={dict.mock.explore} priority /></div>
            <div className="glass float absolute start-0 top-24 hidden rounded-2xl px-4 py-3 text-sm font-bold [--r:-4deg] sm:-start-6 sm:block lg:-start-10" style={{ animationDelay: "-2s" }}>
              <span className="text-go">✓</span> {dict.mock.chipConfirmed}
            </div>
            <div className="glass float absolute end-0 bottom-28 hidden rounded-2xl px-4 py-3 text-sm font-bold [--r:3deg] sm:-end-6 sm:block" style={{ animationDelay: "-4s" }}>
              350 MAD <span className="font-normal text-white/60">{dict.mock.perDay}</span>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="border-y border-white/10 bg-ink"><Marquee words={CITIES.map((c) => c.names[lang])} /></div>

      {/* ── How it works: the phone changes as you scroll ── */}
      <section className="bg-ink px-5 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal><h2 className="font-display text-5xl font-extrabold tracking-tight sm:text-7xl">{dict.how.title}</h2></Reveal>
          <div className="mt-6">
            <StoryScroll
              steps={dict.how.steps}
              phones={storyPhones.map((p) => <AppPhone key={p.shot} shot={p.shot} alt={p.alt} />)}
            />
          </div>
        </div>
      </section>

      {/* ── Cities ── */}
      <section id="cities" className="night relative scroll-mt-6 overflow-hidden px-5 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h2 className="font-display text-5xl font-extrabold tracking-tight sm:text-7xl">{dict.cities.title}</h2>
            <p className="mt-4 max-w-xl text-lg text-white/60">{dict.cities.subtitle}</p>
          </Reveal>
          <div className="mt-14 grid auto-rows-[9.5rem] grid-cols-2 gap-3 md:grid-cols-4 md:auto-rows-[11rem]">
            {CITIES.map((c, i) => (
              <Reveal key={c.slug} delay={(i % 4) * 80} className={i === 0 ? "col-span-2 row-span-2" : i === CITIES.length - 1 ? "col-span-2" : ""}>
                <Link
                  href={`/${lang}/cities/${c.slug}`}
                  className="group relative flex h-full flex-col justify-end overflow-hidden rounded-[2rem] p-6 transition-transform duration-500 hover:-translate-y-1"
                  style={{ background: `linear-gradient(145deg, hsl(${HUES[i]} 55% 14%), hsl(${HUES[i]} 70% 34%))` }}
                >
                  <span aria-hidden className="font-display pointer-events-none absolute -end-2 -top-6 text-[9rem] font-extrabold leading-none text-white/[0.06] transition-transform duration-700 group-hover:scale-110">{c.names[lang].charAt(0)}</span>
                  <span aria-hidden className="absolute end-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 transition-all duration-300 group-hover:bg-white group-hover:text-ink rtl:rotate-180"><ArrowIcon className="h-4 w-4" /></span>
                  <span className={`font-display font-extrabold tracking-tight ${i === 0 ? "text-5xl sm:text-6xl" : "text-2xl"}`}>{c.names[lang]}</span>
                  <span className="mt-1 text-sm text-white/60">{dict.cities.see}</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Latest cars: swipe sideways ── */}
      {cars.length > 0 ? (
        <section className="bg-paper py-24 text-ink sm:py-32">
          <div className="mx-auto max-w-6xl px-5">
            <Reveal>
              <h2 className="font-display text-5xl font-extrabold tracking-tight sm:text-7xl">{dict.popular.title}</h2>
              <p className="mt-4 text-lg text-muted">{dict.popular.subtitle}</p>
              <Link href={`/${lang}/cars`} className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-bold text-white transition-colors hover:bg-volt">{dict.catalog.seeAll} <ArrowIcon className="h-4 w-4 rtl:rotate-180" /></Link>
            </Reveal>
          </div>
          <div className="no-scrollbar -mb-10 mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-16 pt-6 scroll-ps-5 sm:px-[max(1.25rem,calc((100vw-72rem)/2+1.25rem))] sm:scroll-ps-[max(1.25rem,calc((100vw-72rem)/2+1.25rem))]">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} lang={lang} dict={dict} className="w-[82vw] shrink-0 snap-start sm:w-[22rem]" />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Why Voom ── */}
      <section className="bg-ink px-5 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal><h2 className="font-display text-5xl font-extrabold tracking-tight sm:text-7xl">{dict.why.title}</h2></Reveal>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {dict.why.items.map((item, i) => {
              const tone = [
                "bg-gradient-to-br from-volt-mid to-volt text-white md:col-span-2",
                "bg-paper text-ink",
                "bg-gradient-to-br from-[#0d3b36] to-[#07201e] text-white",
                "glass md:col-span-2",
              ][i];
              const art = [
                <VerifiedStamp key="a" className="absolute end-4 top-4 h-44 w-44 text-white sm:end-8 sm:top-8 sm:h-64 sm:w-64" />,
                <Banknotes key="b" className="mx-auto" />,
                <IdScan key="c" className="mx-auto" />,
                <PhoneBooking key="d" className="mx-auto w-52 sm:absolute sm:end-12 sm:top-8 sm:mx-0" />,
              ][i];
              return (
                <Reveal key={item.title} delay={i * 90} className={i === 0 || i === 3 ? "md:col-span-2" : ""}>
                  <WhyCard className={tone.replace(/ ?md:col-span-2/, "")}>
                    {i === 1 || i === 2 ? <div className="pt-2">{art}</div> : art}
                    <div className={i === 3 ? "mt-auto max-w-sm" : i === 0 ? "mt-auto max-w-sm pt-44 sm:pt-0" : ""}>
                      <h3 className="font-display text-3xl font-extrabold tracking-tight">{item.title}</h3>
                      <p className={`mt-2 max-w-md leading-relaxed ${i === 1 ? "text-muted" : "text-white/70"}`}>{item.text}</p>
                    </div>
                  </WhyCard>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── For agencies ── */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-volt-deep via-volt-mid to-volt px-5 py-28 sm:py-40">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10"><span className="sweep top-[30%] w-[30rem]" style={{ background: "linear-gradient(90deg,transparent,#fff)" }} /><span className="sweep top-[70%] w-[22rem]" style={{ animationDelay: "2.5s", background: "linear-gradient(90deg,transparent,#fff)" }} /></div>
        <div className="mx-auto max-w-6xl">
          <Reveal as="h2" variant="none" className="font-display max-w-4xl text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
            <Words text={dict.agencyCta.title} />
          </Reveal>
          <Reveal delay={400}><p className="mt-8 max-w-2xl text-lg text-white/80 sm:text-xl">{dict.agencyCta.text}</p></Reveal>
          <Reveal delay={550} className="mt-10">
            <Link href={`/${lang}/agencies`} className="inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-lg font-bold text-ink transition-transform hover:scale-105">
              {dict.agencyCta.button} <ArrowIcon className="h-5 w-5 rtl:rotate-180" />
            </Link>
          </Reveal>
        </div>
      </section>

      <Faq title={dict.faq.title} items={dict.faq.items} />

      {/* ── Download ── */}
      <section id="download" className="night relative scroll-mt-6 overflow-hidden px-5 py-24 sm:py-32">
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <h2 className="font-display text-5xl font-extrabold tracking-tight sm:text-7xl">{dict.download.title}</h2>
            <p className="mt-5 max-w-lg text-lg text-white/60">{dict.download.text}</p>
            <div className="mt-10"><StoreBadges dict={dict} /></div>
          </Reveal>
          <Reveal variant="side" className="flex justify-center">
            <div className="float [--r:-3deg]"><AppPhone shot="browse" alt={dict.mock.explore} /></div>
          </Reveal>
        </div>
      </section>
      <ScrollTop label={dict.nav.top} />
    </>
  );
}
