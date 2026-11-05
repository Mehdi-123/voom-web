"use client";

import { useState } from "react";
import { emptyDocs, hasAllDocs, uploadIdentity, type DocFiles } from "@/lib/identity-docs";
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

  return (
    <div className="mt-5 max-w-xl space-y-4">
      <IdentityPhotos dict={dict} files={files} onChange={setFiles} />
      {failed ? <ErrorNote>{t.docsFailed}</ErrorNote> : null}
      <PrimaryButton type="button" loading={sending} disabled={!hasAllDocs(files)} onClick={send}>{sending ? t.docsSending : t.docsSend}</PrimaryButton>
    </div>
  );
}
