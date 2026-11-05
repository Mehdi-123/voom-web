"use client";

import { ShieldIcon } from "@/components/Icons";
import { useAuth } from "./AuthProvider";
import { useDash } from "./DashContext";

/** Where the renter's identity check stands. Booking is only possible once it is approved, and that happens in the app. */
export default function IdentityCard() {
  const { identity } = useAuth();
  const { dict } = useDash();
  const m = dict.dash.me;
  if (!identity) return null;

  const view = {
    none: { title: m.idNone, text: m.idNoneText, tone: "border-warn/40 bg-warn/10", icon: "bg-warn/20 text-warn" },
    pending: { title: m.idPending, text: m.idPendingText, tone: "border-volt/40 bg-volt/10", icon: "bg-volt/20 text-volt-soft" },
    approved: { title: m.idApproved, text: m.idApprovedText, tone: "border-go/40 bg-go/10", icon: "bg-go/20 text-go" },
    rejected: { title: m.idRejected, text: m.idRejectedText, tone: "border-danger/40 bg-danger/10", icon: "bg-danger/20 text-danger" },
  }[identity.status];

  return (
    <div className={`flex items-start gap-4 rounded-3xl border p-5 ${view.tone}`}>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${view.icon}`}><ShieldIcon className="h-5 w-5" /></span>
      <div className="min-w-0">
        <p className="font-bold">{view.title}</p>
        <p className="mt-1 text-sm text-fg/70">{view.text}</p>
        {identity.status === "rejected" && identity.reason ? <p className="mt-2 text-sm"><span className="font-semibold">{m.idReason}:</span> {identity.reason}</p> : null}
      </div>
    </div>
  );
}
