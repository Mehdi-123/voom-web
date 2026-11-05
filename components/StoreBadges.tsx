import type { Dictionary } from "@/dictionaries/fr";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/site";

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-8 w-8 shrink-0" fill="currentColor" aria-hidden>
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
  </svg>
);
const PlayIcon = () => (
  <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" aria-hidden>
    <path fill="#00c3ff" d="M3.6 1.9c-.3.2-.5.6-.5 1.1v18c0 .5.2.9.5 1.1L13.2 12z" />
    <path fill="#00e676" d="M3.6 1.9c.4-.2.8-.1 1.2.1l11.4 6.9-3 3.1z" />
    <path fill="#ffc400" d="m16.2 8.9 4 2.3c.7.4.7 1.2 0 1.6l-4 2.3-3-3.1z" />
    <path fill="#ff3d57" d="m13.2 12 3 3.1-11.4 6.8c-.4.3-.8.3-1.2.2z" />
  </svg>
);

/** App Store and Google Play buttons; until the app is published they read "coming soon". */
export default function StoreBadges({ dict }: { dict: Dictionary }) {
  const stores = [
    { name: dict.download.appStore, url: APP_STORE_URL, icon: <AppleIcon /> },
    { name: dict.download.playStore, url: PLAY_STORE_URL, icon: <PlayIcon /> },
  ];
  return (
    <div className="flex flex-wrap gap-3">
      {stores.map((s) => {
        const classes = "flex h-16 min-w-52 items-center gap-3.5 rounded-2xl px-6 text-start";
        return s.url ? (
          <a key={s.name} href={s.url} className={`${classes} bg-white text-ink transition-colors hover:bg-volt hover:text-white`}>
            {s.icon}
            <span className="font-display text-lg font-bold">{s.name}</span>
          </a>
        ) : (
          <span key={s.name} className={`${classes} glass text-white`}>
            {s.icon}
            <span className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-volt-soft">{dict.download.soon}</span>
              <span className="font-display text-lg font-bold leading-tight">{s.name}</span>
            </span>
          </span>
        );
      })}
    </div>
  );
}
