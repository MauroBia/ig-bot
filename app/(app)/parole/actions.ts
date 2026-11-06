"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer, utenteCorrente } from "@/lib/supabase";

async function controlla() {
  if (!(await utenteCorrente())) throw new Error("non autorizzato");
}

export async function salvaRegola(fd: FormData) {
  await controlla();
  const sb = await supabaseServer();
  const v = (k: string) => String(fd.get(k) ?? "").trim();
  const riga = {
    brand_kit_id: v("brand_kit_id"),
    parola: v("parola").toUpperCase(),
    messaggio: v("messaggio"),
    risposta_pubblica: v("risposta_pubblica") || null,
    media_id: v("media_id") || null,
    anche_in_direct: fd.get("anche_in_direct") === "on",
  };
  if (!riga.parola || !riga.messaggio || !riga.brand_kit_id) throw new Error("Parola e messaggio sono obbligatori");
  const id = v("id");
  if (id) await sb.from("regole_dm").update(riga).eq("id", id);
  else await sb.from("regole_dm").insert(riga);
  revalidatePath("/parole");
}

export async function attivaRegola(id: string, attiva: boolean) {
  await controlla();
  const sb = await supabaseServer();
  await sb.from("regole_dm").update({ attiva }).eq("id", id);
  revalidatePath("/parole");
}

export async function eliminaRegola(id: string) {
  await controlla();
  const sb = await supabaseServer();
  await sb.from("regole_dm").delete().eq("id", id);
  revalidatePath("/parole");
}
