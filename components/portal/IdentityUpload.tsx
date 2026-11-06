"use client";

import { useState } from "react";
import { IDENTITY_DOCS, emptyDocs, hasAllDocs, uploadIdentity, type DocFiles } from "@/lib/identity-docs";
import { fill } from "@/lib/i18n";
import { useAuth } from "./AuthProvider";
import { useDash } from "./DashContext";
import IdentityPhotos from "./IdentityPhotos";
import { ErrorNote, PrimaryButton } from "./ui";

/** Sends the renter's four documents for review, from the account page. */
export default function IdentityUpload() {
  const { user, refresh } = useAuth();
  const { dict } = useDash();
  const t = dict.dash.auth;
  const [files, setFiles] = useState<DocFiles>(emptyDocs);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function send() {
    if (!user || !hasAllDocs(files)) return;
    setSending(true);
    setFailed(false);
    const ok = await uploadIdentity(user.id, files);
    setSending(false);
    if (!ok) { setFailed(true); return; }
    await refresh();
  }

  const added = IDENTITY_DOCS.filter((d) => files[d.key]).length;

  return (
    <div className="mt-6 space-y-5">
      <IdentityPhotos dict={dict} files={files} onChange={setFiles} wide />
      {failed ? <ErrorNote>{t.docsFailed}</ErrorNote> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="sm:w-56">
          <span className="block h-1.5 overflow-hidden rounded-full bg-fg/12">
            <span className="block h-full rounded-full bg-volt transition-[width]" style={{ width: `${(added / IDENTITY_DOCS.length) * 100}%` }} />
          </span>
          <span className="mt-2 block text-xs font-semibold text-fg/60">{fill(t.docsCount, { n: added, total: IDENTITY_DOCS.length })}</span>
        </div>
        <PrimaryButton type="button" loading={sending} disabled={!hasAllDocs(files)} onClick={send} className="sm:w-auto sm:px-10">{sending ? t.docsSending : t.docsSend}</PrimaryButton>
      </div>
    </div>
  );
}
