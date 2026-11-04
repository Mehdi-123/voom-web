const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const ShieldIcon = ({ className = "" }: { className?: string }) => (
  <svg {...base} className={className} aria-hidden><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>
);
export const CashIcon = ({ className = "" }: { className?: string }) => (
  <svg {...base} className={className} aria-hidden><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="3" /><path d="M6 12h.01M18 12h.01" /></svg>
);
export const IdIcon = ({ className = "" }: { className?: string }) => (
  <svg {...base} className={className} aria-hidden><rect x="2" y="5" width="20" height="14" rx="2" /><circle cx="8" cy="11" r="2" /><path d="M5 16c.7-1.6 2-2 3-2s2.3.4 3 2M14 9h5M14 13h4" /></svg>
);
export const BoltIcon = ({ className = "" }: { className?: string }) => (
  <svg {...base} className={className} aria-hidden><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></svg>
);
export const ArrowIcon = ({ className = "" }: { className?: string }) => (
  <svg {...base} strokeWidth={2.2} className={className} aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

export const GridIcon = ({ className = "" }: { className?: string }) => (
  <svg {...base} className={className} aria-hidden><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
);
export const CalendarIcon = ({ className = "" }: { className?: string }) => (
  <svg {...base} className={className} aria-hidden><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
);
export const CarIcon = ({ className = "" }: { className?: string }) => (
  <svg {...base} className={className} aria-hidden><path d="M3 17v-4l2-5c.3-.8 1-1.2 1.8-1.2h10.4c.8 0 1.5.4 1.8 1.2l2 5v4" /><path d="M3 13h18M6 17v2M18 17v2" /><circle cx="7.5" cy="14.5" r=".6" fill="currentColor" /><circle cx="16.5" cy="14.5" r=".6" fill="currentColor" /></svg>
);
export const UserIcon = ({ className = "" }: { className?: string }) => (
  <svg {...base} className={className} aria-hidden><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></svg>
);
export const LogoutIcon = ({ className = "" }: { className?: string }) => (
  <svg {...base} className={className} aria-hidden><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
);
export const PlusIcon = ({ className = "" }: { className?: string }) => (
  <svg {...base} strokeWidth={2.2} className={className} aria-hidden><path d="M12 5v14M5 12h14" /></svg>
);
