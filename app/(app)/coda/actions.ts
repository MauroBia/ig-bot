"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer, utenteCorrente } from "@/lib/supabase";
import { pubblicaPost } from "@/lib/coda";

async function controlla() {
  if (!(await utenteCorrente())) throw new Error("non autorizzato");
}

export async function pubblicaOra(id: string) {
  await controlla();
  const sb = await supabaseServer();
  // un post in bozza va prima programmato, poi lo pubblichiamo subito
  await sb.from("posts").update({ stato: "programmato", scheduled_at: new Date().toISOString() }).eq("id", id).eq("stato", "bozza");
  const r = await pubblicaPost(id);
  revalidatePath("/coda");
  return r;
}

export async function programma(id: string) {
  await controlla();
  const sb = await supabaseServer();
  await sb.from("posts").update({ stato: "programmato" }).eq("id", id).in("stato", ["bozza", "errore"]);
  revalidatePath("/coda");
}

export async function inBozza(id: string) {
  await controlla();
  const sb = await supabaseServer();
  await sb.from("posts").update({ stato: "bozza" }).eq("id", id).in("stato", ["programmato", "errore"]);
  revalidatePath("/coda");
}

export async function elimina(id: string) {
  await controlla();
  const sb = await supabaseServer();
  await sb.from("posts").delete().eq("id", id).neq("stato", "in_pubblicazione");
  revalidatePath("/coda");
}
