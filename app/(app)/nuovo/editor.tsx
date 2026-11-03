"use client";
import { useState, useTransition } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { salvaPost } from "./actions";

type Variante = { titolo: string; caption: string; hashtag: string[] };

const TIPI = [
  { id: "IMAGE", nome: "Post foto" },
  { id: "CAROUSEL", nome: "Carosello" },
  { id: "REELS", nome: "Reel" },
  { id: "STORIES", nome: "Storia" },
];

function oraLocaleTra(minuti: number) {
  const d = new Date(Date.now() + minuti * 60000);
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function Editor({ brand }: { brand: { id: string; nome: string }[] }) {
  const [brandId, setBrandId] = useState(brand[0]?.id ?? "");
  const [tipo, setTipo] = useState("IMAGE");
  const [media, setMedia] = useState<string[]>([]);
  const [caricamento, setCaricamento] = useState(false);
  const [brief, setBrief] = useState("");
  const [varianti, setVarianti] = useState<Variante[]>([]);
  const [generando, setGenerando] = useState(false);
  const [caption, setCaption] = useState("");
  const [quando, setQuando] = useState(oraLocaleTra(60));
  const [errore, setErrore] = useState("");
  const [salvando, startSalva] = useTransition();

  const isStoria = tipo === "STORIES";
  const multi = tipo === "CAROUSEL";

  async function carica(files: FileList | null) {
    if (!files?.length) return;
    setErrore("");
    setCaricamento(true);
    const sb = supabaseBrowser();
    const nuovi: string[] = [];
    for (const f of Array.from(files)) {
      const isImg = f.type.startsWith("image/");
      if (isImg && f.type !== "image/jpeg") {
        setErrore("Instagram accetta foto solo in JPEG: esporta la foto in .jpg e riprova.");
        continue;
      }
      if (isStoria && !isImg && f.size > 8 * 1024 * 1024) {
        setErrore("I video per le storie devono pesare meno di 8 MB.");
        continue;
      }
      const est = f.name.split(".").pop()?.toLowerCase() ?? "bin";
      const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${est}`;
      const { error } = await sb.storage.from("media").upload(path, f, { contentType: f.type });
      if (error) {
        setErrore("Upload fallito: " + error.message);
        continue;
      }
      nuovi.push(sb.storage.from("media").getPublicUrl(path).data.publicUrl);
    }
    setMedia((m) => (multi ? [...m, ...nuovi].slice(0, 10) : nuovi.slice(0, 1)));
    setCaricamento(false);
  }

  async function generaCopy() {
    setErrore("");
    setGenerando(true);
    try {
      const r = await fetch("/api/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, brief, tipo }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.errore);
      setVarianti(j.varianti);
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Errore");
    } finally {
      setGenerando(false);
    }
  }

  function usa(v: Variante) {
    setCaption(isStoria ? v.caption : [v.caption, v.hashtag.join(" ")].filter(Boolean).join("\n\n"));
  }

  function salva(programma: boolean) {
    setErrore("");
    startSalva(async () => {
      const res = await salvaPost({
        brandId,
        tipo,
        caption,
        mediaUrls: media,
        scheduledAt: quando ? new Date(quando).toISOString() : null,
        programma,
      });
      if (res?.errore) setErrore(res.errore);
    });
  }

  const isVideo = (u: string) => /\.(mp4|mov)$/i.test(u);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <section className="grid gap-4 rounded-2xl border border-bordo bg-pannello p-5 sm:grid-cols-2">
          <div>
            <label className="etichetta">Pagina</label>
            <select className="campo" value={brandId} onChange={(e) => setBrandId(e.target.value)}>
              {brand.map((b) => (
                <option key={b.id} value={b.id}>{b.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="etichetta">Tipo</label>
            <div className="flex flex-wrap gap-2">
              {TIPI.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setTipo(t.id); setMedia([]); setVarianti([]); }}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${tipo === t.id ? "border-accento bg-accento/10 text-accento" : "border-bordo text-tenue"}`}
                >
                  {t.nome}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-bordo bg-pannello p-5">
          <label className="etichetta">
            {multi ? "File (da 2 a 10, foto JPEG o video)" : tipo === "REELS" ? "Video (MP4 o MOV)" : "Foto JPEG o video"}
          </label>
          <input
            type="file"
            multiple={multi}
            accept={tipo === "REELS" ? "video/mp4,video/quicktime" : "image/jpeg,video/mp4,video/quicktime"}
            onChange={(e) => carica(e.target.files)}
            className="block w-full text-sm text-tenue file:mr-3 file:rounded-lg file:border-0 file:bg-accento file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-black"
          />
          {caricamento && <p className="mt-2 text-sm text-tenue">Caricamento in corso…</p>}
          {isStoria && <p className="mt-2 text-xs text-tenue">Formato 1080×1920. Tieni i testi al centro: sopra e sotto Instagram copre l'immagine.</p>}
        </section>

        <section className="space-y-3 rounded-2xl border border-bordo bg-pannello p-5">
          <label className="etichetta">Brief per il copy</label>
          <textarea
            className="campo min-h-24"
            placeholder="Es. Farmer Night 12 dicembre al Magika di Crema, apertura 22:30, lista ridotta entro le 23:30, scrivi in DM per tavoli."
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
          />
          <button type="button" className="bottone" onClick={generaCopy} disabled={generando || !brief.trim()}>
            {generando ? "Claude sta scrivendo…" : varianti.length ? "Rigenera 3 proposte" : "Genera 3 proposte"}
          </button>

          {varianti.length > 0 && (
            <div className="grid gap-3 md:grid-cols-3">
              {varianti.map((v, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => usa(v)}
                  className="rounded-xl border border-bordo bg-fondo p-3 text-left text-sm transition hover:border-accento"
                >
                  <div className="mb-1 font-semibold text-accento">{v.titolo}</div>
                  <div className="line-clamp-6 whitespace-pre-line text-tenue">{v.caption}</div>
                  <div className="mt-2 text-xs text-accento/80">Usa questa →</div>
                </button>
              ))}
            </div>
          )}

          <div>
            <label className="etichetta">{isStoria ? "Testo da mettere sulla grafica (non viene pubblicato)" : "Caption finale"}</label>
            <textarea className="campo min-h-40" value={caption} onChange={(e) => setCaption(e.target.value)} />
            {!isStoria && <p className="mt-1 text-right text-xs text-tenue">{caption.length}/2200</p>}
          </div>
        </section>

        <section className="flex flex-wrap items-end gap-3 rounded-2xl border border-bordo bg-pannello p-5">
          <div>
            <label className="etichetta">Data e ora di pubblicazione</label>
            <input type="datetime-local" className="campo" value={quando} onChange={(e) => setQuando(e.target.value)} />
          </div>
          <button type="button" className="bottone" disabled={salvando || !media.length} onClick={() => salva(true)}>
            Programma
          </button>
          <button type="button" className="bottone-secondario" disabled={salvando || !media.length} onClick={() => salva(false)}>
            Salva bozza
          </button>
          {errore && <p className="w-full text-sm text-ko">{errore}</p>}
        </section>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="etichetta">Anteprima</div>
        <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-[2rem] border-4 border-bordo bg-black">
          <div className={`relative ${isStoria || tipo === "REELS" ? "aspect-[9/16]" : "aspect-[4/5]"} bg-pannello`}>
            {media[0] ? (
              isVideo(media[0]) ? (
                <video src={media[0]} className="h-full w-full object-cover" muted autoPlay loop playsInline />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={media[0]} alt="" className="h-full w-full object-cover" />
              )
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-tenue">Nessun file</div>
            )}
            {multi && media.length > 1 && (
              <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs">1/{media.length}</span>
            )}
          </div>
          {!isStoria && (
            <div className="max-h-40 overflow-y-auto whitespace-pre-line p-3 text-xs">
              <span className="font-semibold">{brand.find((b) => b.id === brandId)?.nome} </span>
              {caption || <span className="text-tenue">La caption apparirà qui</span>}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
