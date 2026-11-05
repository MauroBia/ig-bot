const G = "https://graph.facebook.com/v25.0";

function token() {
  const t = process.env.META_SYSTEM_USER_TOKEN;
  if (!t) throw new Error("Manca META_SYSTEM_USER_TOKEN nelle variabili d'ambiente");
  return t;
}

async function chiama(path: string, params: Record<string, string>, metodo: "GET" | "POST" = "POST") {
  const qs = new URLSearchParams({ ...params, access_token: token() });
  const r =
    metodo === "POST"
      ? await fetch(`${G}/${path}`, { method: "POST", body: qs })
      : await fetch(`${G}/${path}?${qs}`);
  const j = await r.json();
  if (j.error) throw new Error(j.error.error_user_msg || j.error.message);
  return j;
}

const isVideo = (url: string) => /\.(mp4|mov)(\?|$)/i.test(url);

/** Aspetta che Meta finisca di elaborare un video (max ~4 minuti). */
async function attendiPronto(id: string) {
  for (let i = 0; i < 48; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 3000));
    const s = await chiama(id, { fields: "status_code" }, "GET");
    if (s.status_code === "FINISHED") return;
    if (s.status_code === "ERROR") throw new Error("Instagram non è riuscito a elaborare il file");
  }
  throw new Error("Timeout: il video ci mette troppo a essere elaborato");
}

export type PostDaPubblicare = {
  tipo: "IMAGE" | "CAROUSEL" | "REELS" | "STORIES";
  caption: string | null;
  media_urls: string[];
};

/** Pubblica un contenuto su Instagram e restituisce l'ID del post. */
export async function pubblica(igUserId: string, post: PostDaPubblicare): Promise<string> {
  const [primo] = post.media_urls;
  if (!primo) throw new Error("Nessun media allegato");
  let creationId: string;

  if (post.tipo === "CAROUSEL") {
    if (post.media_urls.length < 2 || post.media_urls.length > 10)
      throw new Error("Il carosello deve avere da 2 a 10 elementi");
    const figli: string[] = [];
    for (const url of post.media_urls) {
      const p: Record<string, string> = { is_carousel_item: "true" };
      if (isVideo(url)) Object.assign(p, { media_type: "VIDEO", video_url: url });
      else p.image_url = url;
      const c = await chiama(`${igUserId}/media`, p);
      await attendiPronto(c.id);
      figli.push(c.id);
    }
    const c = await chiama(`${igUserId}/media`, {
      media_type: "CAROUSEL",
      children: figli.join(","),
      caption: post.caption ?? "",
    });
    await attendiPronto(c.id);
    creationId = c.id;
  } else {
    const p: Record<string, string> = {};
    const video = isVideo(primo);
    if (post.tipo === "STORIES") {
      p.media_type = "STORIES";
      if (video) p.video_url = primo;
      else p.image_url = primo;
    } else if (post.tipo === "REELS" || video) {
      Object.assign(p, { media_type: "REELS", video_url: primo, caption: post.caption ?? "" });
    } else {
      Object.assign(p, { image_url: primo, caption: post.caption ?? "" });
    }
    const c = await chiama(`${igUserId}/media`, p);
    await attendiPronto(c.id);
    creationId = c.id;
  }

  // Instagram a volte risponde "non pronto" anche dopo FINISHED: riprova qualche volta
  for (let tentativo = 1; ; tentativo++) {
    try {
      const pub = await chiama(`${igUserId}/media_publish`, { creation_id: creationId });
      return pub.id as string;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const nonPronto = /non è pronto|not ready|not available|attendi/i.test(msg);
      if (!nonPronto || tentativo >= 6) throw e;
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}
