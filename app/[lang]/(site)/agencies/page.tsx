import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { alternatesFor } from "@/lib/seo";
import Link from "next/link";
import StoreBadges from "@/components/StoreBadges";
import Reveal from "@/components/Reveal";
import Words from "@/components/Words";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return { title: { absolute: `${dict.agencies.h1}` }, description: dict.agencies.intro, alternates: alternatesFor("/agencies", lang) };
}

export default async function AgenciesPage({ params }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const a = dict.agencies;

  return (
    <>
      <section className="night grain relative isolate overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10"><span className="sweep top-[35%] w-[34rem]" /><span className="sweep top-[68%] w-[24rem]" style={{ animationDelay: "2.2s" }} /></div>
        <div className="mx-auto max-w-6xl px-5 pb-24 pt-40 sm:pt-48">
          <Reveal as="h1" variant="none" className="font-display max-w-5xl text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
            <Words text={a.h1} />
          </Reveal>
          <Reveal delay={450}><p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/65 sm:text-xl">{a.intro}</p></Reveal>
          <Reveal delay={600} className="mt-10 flex flex-wrap gap-3">
            <Link href={`/${lang}/signup/agency`} className="rounded-full bg-volt px-8 py-4 text-lg font-bold text-white shadow-lg shadow-volt/40 transition-all hover:bg-volt-soft">{a.cta} →</Link>
            <Link href={`/${lang}/login`} className="glass rounded-full px-8 py-4 text-lg font-semibold transition-colors hover:bg-white/15">{dict.dash.auth.login}</Link>
          </Reveal>
        </div>
      </section>

      <section className="bg-ink px-5 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal><h2 className="font-display text-5xl font-extrabold tracking-tight sm:text-6xl">{a.benefitsTitle}</h2></Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {a.benefits.map((b, i) => (
              <Reveal key={b.title} delay={i * 90}>
                <div className="glass h-full rounded-[2rem] p-8 transition-colors hover:bg-white/10">
                  <div className="speed-lines mb-6"><i /><i /></div>
                  <h3 className="font-display text-3xl font-extrabold tracking-tight">{b.title}</h3>
                  <p className="mt-3 leading-relaxed text-white/60">{b.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="night relative px-5 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal><h2 className="font-display text-5xl font-extrabold tracking-tight sm:text-6xl">{a.stepsTitle}</h2></Reveal>
          <ol className="mt-12 divide-y divide-white/10">
            {a.steps.map((s, i) => (
              <Reveal key={s.title} as="li" className="grid items-center gap-4 py-10 sm:grid-cols-[12rem_1fr] sm:gap-10">
                <span className="font-display outline-text text-8xl font-extrabold leading-none sm:text-9xl">{i + 1}</span>
                <div>
                  <h3 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{s.title}</h3>
                  <p className="mt-3 max-w-xl text-lg leading-relaxed text-white/60">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-gradient-to-br from-volt-deep via-volt-mid to-volt px-5 py-24 text-center sm:py-32">
        <Reveal>
          <h2 className="font-display mx-auto max-w-3xl text-5xl font-extrabold tracking-tight sm:text-7xl">{dict.download.title}</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/80">{dict.download.text}</p>
          <div className="mt-10 flex flex-col items-center gap-6">
            <Link href={`/${lang}/signup/agency`} className="rounded-full bg-white px-8 py-4 text-lg font-bold text-ink transition-transform hover:scale-105">{a.cta} →</Link>
            <StoreBadges dict={dict} />
          </div>
        </Reveal>
      </section>
    </>
  );
}
