import { supabaseAdmin } from "./supabase";
import { pubblica } from "./meta";

/**
 * Pubblica un singolo post. Lo "prenota" passando lo stato a in_pubblicazione
 * solo se è ancora programmato, così due esecuzioni non lo pubblicano due volte.
 */
export async function pubblicaPost(id: string) {
  const sb = supabaseAdmin();
  const { data: post } = await sb
    .from("posts")
    .update({ stato: "in_pubblicazione", errore: null })
    .eq("id", id)
    .in("stato", ["programmato", "errore"])
    .select("*, brand_kit(ig_user_id, nome)")
    .single();

  if (!post) return { ok: false, motivo: "Post non trovato o già in pubblicazione" };

  try {
    const igUserId = post.brand_kit?.ig_user_id;
    if (!igUserId) throw new Error("Il brand non ha un ID Instagram collegato");
    const igMediaId = await pubblica(igUserId, post);
    await sb
      .from("posts")
      .update({ stato: "pubblicato", ig_media_id: igMediaId, published_at: new Date().toISOString() })
      .eq("id", id);
    await sb.from("logs").insert({ livello: "info", messaggio: "Pubblicato", dettagli: { id, igMediaId } });
    return { ok: true };
  } catch (e) {
    const errore = e instanceof Error ? e.message : String(e);
    await sb.from("posts").update({ stato: "errore", errore }).eq("id", id);
    await sb.from("logs").insert({ livello: "errore", messaggio: errore, dettagli: { id } });
    return { ok: false, motivo: errore };
  }
}

/** Pubblica tutti i post programmati il cui orario è già passato. */
export async function pubblicaInScadenza() {
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("posts")
    .select("id")
    .eq("stato", "programmato")
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at")
    .limit(5);
  const risultati = [];
  for (const p of data ?? []) risultati.push({ id: p.id, ...(await pubblicaPost(p.id)) });
  return risultati;
}
