"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServer, utenteCorrente } from "@/lib/supabase";

const TIPI = ["IMAGE", "CAROUSEL", "REELS", "STORIES"];

export async function salvaPost(input: {
  brandId: string;
  tipo: string;
  caption: string;
  mediaUrls: string[];
  scheduledAt: string | null;
  programma: boolean;
}) {
  const utente = await utenteCorrente();
  if (!utente) return { errore: "Sessione scaduta, rifai il login." };
  if (!TIPI.includes(input.tipo)) return { errore: "Tipo non valido." };
  if (!input.mediaUrls.length) return { errore: "Carica almeno un file." };
  if (input.tipo === "CAROUSEL" && (input.mediaUrls.length < 2 || input.mediaUrls.length > 10))
    return { errore: "Il carosello vuole da 2 a 10 file." };
  if (input.tipo !== "STORIES" && input.caption.length > 2200)
    return { errore: "Caption troppo lunga (max 2200 caratteri)." };
  if (input.programma && !input.scheduledAt) return { errore: "Scegli data e ora." };

  const sb = await supabaseServer();
  const { error } = await sb.from("posts").insert({
    brand_id: input.brandId,
    tipo: input.tipo,
    caption: input.tipo === "STORIES" ? null : input.caption,
    media_urls: input.mediaUrls,
    scheduled_at: input.scheduledAt,
    stato: input.programma ? "programmato" : "bozza",
    created_by: utente.id,
  });
  if (error) return { errore: error.message };

  revalidatePath("/coda");
  redirect("/coda");
}
