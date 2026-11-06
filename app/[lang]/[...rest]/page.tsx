import { notFound } from "next/navigation";

/** Any address under a language that matches no page: shows the 404 page in that language. */
export default function UnknownPage() {
  notFound();
}
