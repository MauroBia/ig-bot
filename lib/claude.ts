import Anthropic from "@anthropic-ai/sdk";

export type Brand = {
  nome: string;
  tono: string | null;
  hashtag_fissi: string[] | null;
  parole_vietate: string[] | null;
  esempi: string[] | null;
};

export type Variante = { titolo: string; caption: string; hashtag: string[] };

export async function generaCopy(brand: Brand, brief: string, tipo: string): Promise<Variante[]> {
  const client = new Anthropic();
  const isStoria = tipo === "STORIES";

  const system = [
    `Sei il social media manager di ${brand.nome}. Scrivi in italiano.`,
    brand.tono ? `Tono di voce: ${brand.tono}.` : "",
    brand.parole_vietate?.length ? `Non usare mai: ${brand.parole_vietate.join(", ")}.` : "",
    brand.hashtag_fissi?.length ? `Includi sempre questi hashtag: ${brand.hashtag_fissi.join(" ")}.` : "",
    brand.esempi?.length ? `Esempi di post riusciti:\n${brand.esempi.join("\n---\n")}` : "",
    isStoria
      ? "Stai scrivendo il TESTO DA METTERE SOPRA UNA STORIA: massimo 2 righe brevi, d'impatto, nessun hashtag."
      : "Regole: la prima riga deve agganciare (max 125 caratteri), caption max 2200 caratteri, call to action chiara, max 10 hashtag.",
    'Rispondi SOLO con JSON valido in questo formato: {"varianti":[{"titolo":"","caption":"","hashtag":[]}]}',
  ]
    .filter(Boolean)
    .join("\n");

  const msg = await client.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 2000,
    system,
    messages: [{ role: "user", content: `Brief: ${brief}\n\nDammi 3 varianti diverse tra loro.` }],
  });

  const testo = msg.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("");
  const json = testo.slice(testo.indexOf("{"), testo.lastIndexOf("}") + 1);
  const dati = JSON.parse(json) as { varianti: Variante[] };
  return dati.varianti.slice(0, 3);
}
