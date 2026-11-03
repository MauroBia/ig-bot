"use server";
import { redirect } from "next/navigation";
import { emailAutorizzate, supabaseAdmin, supabaseServer } from "@/lib/supabase";

export type Stato = { errore?: string } | undefined;

export async function accedi(_: Stato, form: FormData): Promise<Stato> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!emailAutorizzate().includes(email)) return { errore: "Questa email non è autorizzata." };

  const sb = await supabaseServer();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { errore: "Email o password sbagliate." };
  redirect("/coda");
}

/** Primo accesso: crea l'account solo se l'email è nella lista autorizzata. */
export async function creaAccount(_: Stato, form: FormData): Promise<Stato> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!emailAutorizzate().includes(email)) return { errore: "Questa email non è autorizzata." };
  if (password.length < 10) return { errore: "La password deve avere almeno 10 caratteri." };

  const { error } = await supabaseAdmin().auth.admin.createUser({ email, password, email_confirm: true });
  if (error) return { errore: "Account già esistente o errore: " + error.message };

  const sb = await supabaseServer();
  await sb.auth.signInWithPassword({ email, password });
  redirect("/coda");
}

export async function esci() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  redirect("/login");
}
