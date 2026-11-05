const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const ShieldIcon = ({ className = "" }: { className?: string }) => (
  <svg {...base} className={className} aria-hidden><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>
);
export const CameraIcon = ({ className = "" }: { className?: string }) => (
  <svg {...base} className={className} aria-hidden><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>
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

export const BellIcon = ({ className = "" }: { className?: string }) => (
  <svg {...base} className={className} aria-hidden><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /></svg>
);
export const SunIcon = ({ className = "" }: { className?: string }) => (
  <svg {...base} className={className} aria-hidden><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
);
export const MoonIcon = ({ className = "" }: { className?: string }) => (
  <svg {...base} className={className} aria-hidden><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" /></svg>
);
export const ChevronsLeftIcon = ({ className = "" }: { className?: string }) => (
  <svg {...base} className={className} aria-hidden><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" /></svg>
);
export const CoinsIcon = ({ className = "" }: { className?: string }) => (
  <svg {...base} className={className} aria-hidden><circle cx="9" cy="9" r="6" /><path d="M15 6.3A6 6 0 0121 12a6 6 0 01-8 5.6M9 6.5v5M7 8.5h3" /></svg>
);
export const StarIcon = ({ className = "", filled = false }: { className?: string; filled?: boolean }) => (
  <svg {...base} fill={filled ? "currentColor" : "none"} className={className} aria-hidden><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
);

export const PinIcon = ({ className = "" }: { className?: string }) => (
  <svg {...base} className={className} aria-hidden><path d="M12 21s7-5.7 7-11a7 7 0 10-14 0c0 5.3 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
);
export const CheckIcon = ({ className = "" }: { className?: string }) => (
  <svg {...base} strokeWidth={2.4} className={className} aria-hidden><path d="M20 6L9 17l-5-5" /></svg>
);
export const ChevronDownIcon = ({ className = "" }: { className?: string }) => (
  <svg {...base} strokeWidth={2.2} className={className} aria-hidden><path d="M6 9l6 6 6-6" /></svg>
);

export const ChevronLeftIcon = ({ className = "" }: { className?: string }) => (
  <svg {...base} strokeWidth={2.2} className={className} aria-hidden><path d="M15 18l-6-6 6-6" /></svg>
);
export const ChevronRightIcon = ({ className = "" }: { className?: string }) => (
  <svg {...base} strokeWidth={2.2} className={className} aria-hidden><path d="M9 18l6-6-6-6" /></svg>
);
export const CloseIcon = ({ className = "" }: { className?: string }) => (
  <svg {...base} strokeWidth={2.2} className={className} aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const ExpandIcon = ({ className = "" }: { className?: string }) => (
  <svg {...base} strokeWidth={2} className={className} aria-hidden><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
);

export const PanelIcon = ({ className = "" }: { className?: string }) => (
  <svg {...base} className={className} aria-hidden><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M9 4v16" /></svg>
);

export const ImageIcon = ({ className = "" }: { className?: string }) => (
  <svg {...base} className={className} aria-hidden><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="1.8" /><path d="M21 16l-5-5-8 9" /></svg>
);
export const MinusIcon = ({ className = "" }: { className?: string }) => (
  <svg {...base} strokeWidth={2.2} className={className} aria-hidden><path d="M5 12h14" /></svg>
);

export const GlobeIcon = ({ className = "" }: { className?: string }) => (
  <svg {...base} className={className} aria-hidden><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></svg>
);
