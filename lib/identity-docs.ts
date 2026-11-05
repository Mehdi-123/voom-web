import { sb } from "./supabase-browser";
import { resizeToJpeg } from "./image";

/** The four photos asked from every renter: ID card and driving licence, both sides. */
export const IDENTITY_DOCS = [
  { key: "idFront", file: "id-front", column: "id_front" },
  { key: "idBack", file: "id-back", column: "id_back" },
  { key: "licenseFront", file: "license-front", column: "license_front" },
  { key: "licenseBack", file: "license-back", column: "license_back" },
] as const;

export type DocKey = (typeof IDENTITY_DOCS)[number]["key"];
export type DocFiles = Record<DocKey, File | null>;

export const MAX_PHOTO = 8 * 1024 * 1024;
export const emptyDocs = (): DocFiles => ({ idFront: null, idBack: null, licenseFront: null, licenseBack: null });
export const hasAllDocs = (files: DocFiles): files is Record<DocKey, File> => IDENTITY_DOCS.every((d) => files[d.key]);

/** Uploads the four photos to the private bucket and files them for review (the database puts the review back to pending). */
export async function uploadIdentity(userId: string, files: Record<DocKey, File>): Promise<boolean> {
  const paths = await Promise.all(IDENTITY_DOCS.map(async (d) => {
    const path = `${userId}/${d.file}.jpg`;
    const { error } = await sb.storage.from("customer-documents").upload(path, await resizeToJpeg(files[d.key]), { contentType: "image/jpeg", upsert: true });
    return error ? null : path;
  }));
  if (paths.some((p) => !p)) return false;
  const row = Object.fromEntries(IDENTITY_DOCS.map((d, i) => [d.column, paths[i]]));
  const { error } = await sb.from("customer_documents").upsert({ user_id: userId, ...row });
  return !error;
}
