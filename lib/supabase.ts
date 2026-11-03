import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Client legato alla sessione dell'utente (rispetta le regole di sicurezza). */
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(URL, ANON, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // chiamato da un Server Component: i cookie si aggiornano alla richiesta successiva
        }
      },
    },
  });
}

/** Client con permessi completi: solo lato server (cron e creazione utenti). */
export function supabaseAdmin() {
  return createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

export function emailAutorizzate(): string[] {
  return (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Restituisce l'utente se loggato e autorizzato, altrimenti null. */
export async function utenteCorrente() {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  const email = data.user?.email?.toLowerCase();
  if (!data.user || !email || !emailAutorizzate().includes(email)) return null;
  return data.user;
}
