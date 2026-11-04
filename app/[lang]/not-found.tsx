import Link from "next/link";

/** Shown for an address that does not exist. Not translated: the language is not known here. */
export default function NotFound() {
  return (
    <div className="night mx-auto flex min-h-screen max-w-none flex-col items-center justify-center px-5 text-center">
      <p className="font-display text-[10rem] font-extrabold leading-none text-volt">404</p>
      <h1 className="mt-2 text-xl font-semibold">Page not found · Page introuvable · الصفحة غير موجودة</h1>
      <Link href="/" className="mt-10 rounded-full bg-volt px-8 py-4 font-bold text-white">Voom</Link>
    </div>
  );
}
