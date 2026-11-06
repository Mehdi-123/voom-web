"use client";

import { ShieldIcon } from "@/components/Icons";
import { useAuth } from "./AuthProvider";
import { useDash } from "./DashContext";
import IdentityUpload from "./IdentityUpload";

/** Where the renter's identity check stands, with the upload form while documents are missing or refused. Booking is only possible once they are approved. */
export default function IdentityCard() {
  const { identity } = useAuth();
  const { dict } = useDash();
  const m = dict.dash.me;
  if (!identity) return null;

  const view = {
    none: { title: m.idNone, text: m.idNoneText, icon: "bg-warn/20 text-warn" },
    pending: { title: m.idPending, text: m.idPendingText, icon: "bg-volt/20 text-volt-soft" },
    approved: { title: m.idApproved, text: m.idApprovedText, icon: "bg-go/20 text-go" },
    rejected: { title: m.idRejected, text: m.idRejectedText, icon: "bg-danger/20 text-danger" },
  }[identity.status];

  const needsDocs = identity.status === "none" || identity.status === "rejected";

  return (
    <section className="rounded-3xl border border-fg/12 bg-night p-5 shadow-sm shadow-black/5 sm:p-7">
      <div className="flex items-start gap-4">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${view.icon}`}><ShieldIcon className="h-6 w-6" /></span>
        <div className="min-w-0">
          <h2 className="font-display text-xl font-extrabold tracking-tight">{view.title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-fg/65">{view.text}</p>
          {identity.status === "rejected" && identity.reason ? <p className="mt-2 text-sm"><span className="font-semibold">{m.idReason}:</span> {identity.reason}</p> : null}
        </div>
      </div>
      {needsDocs ? <IdentityUpload /> : null}
    </section>
  );
}
