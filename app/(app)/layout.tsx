import Link from "next/link";
import { redirect } from "next/navigation";
import { utenteCorrente } from "@/lib/supabase";
import { esci } from "../login/actions";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const utente = await utenteCorrente();
  if (!utente) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="border-b border-bordo bg-pannello">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
          <span className="font-bold">IG Bot</span>
          <nav className="flex gap-4 text-sm">
            <Link href="/coda" className="text-tenue hover:text-testo">Coda</Link>
            <Link href="/nuovo" className="text-tenue hover:text-testo">Nuovo contenuto</Link>
          </nav>
          <form action={esci} className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-tenue sm:inline">{utente.email}</span>
            <button className="bottone-secondario">Esci</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
