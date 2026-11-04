import type { Dictionary } from "@/dictionaries/fr";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/site";

/** App Store and Google Play buttons; until the app is published they read "coming soon". */
export default function StoreBadges({ dict }: { dict: Dictionary }) {
  const stores = [
    { name: dict.download.appStore, url: APP_STORE_URL },
    { name: dict.download.playStore, url: PLAY_STORE_URL },
  ];
  return (
    <div className="flex flex-wrap gap-3">
      {stores.map((s) => {
        const classes = "flex h-16 min-w-48 flex-col items-center justify-center rounded-2xl px-7 text-center";
        return s.url ? (
          <a key={s.name} href={s.url} className={`${classes} bg-white text-ink transition-colors hover:bg-volt hover:text-white`}>
            <span className="font-display text-lg font-bold">{s.name}</span>
          </a>
        ) : (
          <span key={s.name} className={`${classes} glass text-white`}>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-volt-soft">{dict.download.soon}</span>
            <span className="font-display text-lg font-bold">{s.name}</span>
          </span>
        );
      })}
    </div>
  );
}
