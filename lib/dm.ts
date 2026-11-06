import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "./supabase";

const G = "https://graph.facebook.com/v25.0";
const sistema = () => process.env.META_SYSTEM_USER_TOKEN ?? "";

async function graph(path: string, token: string, corpo?: object, metodo = corpo ? "POST" : "GET") {
  const r = await fetch(`${G}/${path}${path.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(token)}`, {
    method: metodo,
    headers: corpo ? { "Content-Type": "application/json" } : undefined,
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error.error_user_msg || j.error.message);
  return j;
}

const cachePagine = new Map<string, string>();
/** Token della Pagina Facebook collegata, ricavato dal token di sistema. */
export async function tokenPagina(pageId: string) {
  if (cachePagine.has(pageId)) return cachePagine.get(pageId)!;
  const j = await graph(`${pageId}?fields=access_token`, sistema());
  if (!j.access_token) throw new Error("Il token di sistema non ha accesso alla Pagina " + pageId);
  cachePagine.set(pageId, j.access_token);
  return j.access_token as string;
}

/** Messaggio privato in risposta a un commento (una sola volta per commento, entro 7 giorni). */
export async function rispostaPrivata(pageId: string, commentId: string, testo: string) {
  const t = await tokenPagina(pageId);
  return graph(`${pageId}/messages`, t, { recipient: { comment_id: commentId }, message: { text: testo } });
}

/** Messaggio in direct a chi ci ha scritto (entro 24 ore dal suo messaggio). */
export async function inviaDirect(pageId: string, igsid: string, testo: string) {
  const t = await tokenPagina(pageId);
  return graph(`${pageId}/messages`, t, { recipient: { id: igsid }, message: { text: testo } });
}

/** Risposta pubblica sotto al commento. */
export async function rispostaPubblica(commentId: string, testo: string) {
  return graph(`${commentId}/replies`, sistema(), { message: testo });
}

export function firmaValida(corpo: string, firma: string | null) {
  const segreto = process.env.META_APP_SECRET;
  if (!segreto || !firma?.startsWith("sha256=")) return false;
  const atteso = Buffer.from("sha256=" + createHmac("sha256", segreto).update(corpo).digest("hex"));
  const ricevuto = Buffer.from(firma);
  return atteso.length === ricevuto.length && timingSafeEqual(atteso, ricevuto);
}

const normalizza = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();

type Regola = {
  id: string; parola: string; messaggio: string; risposta_pubblica: string | null;
  media_id: string | null; anche_in_direct: boolean;
};

/** Trova la regola la cui parola chiave compare come parola intera nel testo. */
export function trovaRegola(testo: string, regole: Regola[], mediaId?: string) {
  const parole = ` ${normalizza(testo)} `;
  return regole.find(
    (r) => (!r.media_id || r.media_id === mediaId) && parole.includes(` ${normalizza(r.parola)} `),
  );
}

async function brandDa(igUserId: string) {
  const sb = supabaseAdmin();
  const { data } = await sb.from("brand_kit").select("id, page_id").eq("ig_user_id", igUserId).maybeSingle();
  if (!data?.page_id) return null;
  const { data: regole } = await sb.from("regole_dm").select("*").eq("brand_kit_id", data.id).eq("attiva", true);
  return { pageId: data.page_id as string, regole: (regole ?? []) as Regola[] };
}

/** Registra l'evento; false se era già stato gestito (Meta a volte manda doppioni). */
async function prenota(origineId: string, campi: Record<string, unknown>) {
  const { error } = await supabaseAdmin().from("eventi_dm").insert({ origine_id: origineId, esito: "in_corso", ...campi });
  return !error;
}
async function chiudi(origineId: string, esito: string, errore?: string, regolaId?: string) {
  await supabaseAdmin().from("eventi_dm").update({ esito, errore: errore ?? null, regola_id: regolaId ?? null }).eq("origine_id", origineId);
}

type Commento = { id: string; text?: string; from?: { id: string; username?: string }; media?: { id: string } };

export async function gestisciCommento(igUserId: string, c: Commento) {
  if (!c?.id || !c.text || c.from?.id === igUserId) return; // ignora i nostri commenti (evita loop)
  const b = await brandDa(igUserId);
  if (!b) return;
  const regola = trovaRegola(c.text, b.regole, c.media?.id);
  if (!regola) return;
  if (!(await prenota(c.id, { tipo: "commento", ig_user_id: igUserId, da_username: c.from?.username, testo: c.text }))) return;
  try {
    await rispostaPrivata(b.pageId, c.id, regola.messaggio);
    if (regola.risposta_pubblica) await rispostaPubblica(c.id, regola.risposta_pubblica).catch(() => {});
    await chiudi(c.id, "inviato", undefined, regola.id);
  } catch (e) {
    await chiudi(c.id, "errore", e instanceof Error ? e.message : String(e), regola.id);
  }
}

type Messaggio = { sender: { id: string }; message?: { mid: string; text?: string; is_echo?: boolean } };

export async function gestisciMessaggio(igUserId: string, m: Messaggio) {
  const msg = m.message;
  if (!msg?.text || msg.is_echo || m.sender.id === igUserId) return;
  const b = await brandDa(igUserId);
  if (!b) return;
  const regola = trovaRegola(msg.text, b.regole.filter((r) => r.anche_in_direct && !r.media_id));
  if (!regola) return;
  if (!(await prenota(msg.mid, { tipo: "direct", ig_user_id: igUserId, testo: msg.text }))) return;
  try {
    await inviaDirect(b.pageId, m.sender.id, regola.messaggio);
    await chiudi(msg.mid, "inviato", undefined, regola.id);
  } catch (e) {
    await chiudi(msg.mid, "errore", e instanceof Error ? e.message : String(e), regola.id);
  }
}

/** Controllo dei permessi e iscrizione della Pagina ai webhook. */
export async function diagnosi(pageId: string, iscrivi: boolean) {
  const out: Record<string, unknown> = {};
  const prova = async (nome: string, f: () => Promise<unknown>) => {
    try { out[nome] = await f(); } catch (e) { out[nome] = { errore: e instanceof Error ? e.message : String(e) }; }
  };
  await prova("permessi", async () => (await graph("me/permissions", sistema())).data);
  await prova("pagina", async () => ((await tokenPagina(pageId)) ? "ok" : "no"));
  if (iscrivi) {
    await prova("iscrizione", async () => {
      const t = await tokenPagina(pageId);
      try {
        return await graph(`${pageId}/subscribed_apps?subscribed_fields=feed,messages`, t, {});
      } catch {
        return await graph(`${pageId}/subscribed_apps?subscribed_fields=messages`, t, {});
      }
    });
  }
  await prova("app_iscritte", async () => (await graph(`${pageId}/subscribed_apps`, await tokenPagina(pageId))).data);
  return out;
}
