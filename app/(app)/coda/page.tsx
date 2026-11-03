export const maxDuration = 300;
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase";
import Azioni from "./azioni";

const STATI: Record<string, { nome: string; colore: string }> = {
  bozza: { nome: "Bozza", colore: "text-tenue border-bordo" },
  da_approvare: { nome: "Da approvare", colore: "text-accento border-accento/40" },
  programmato: { nome: "Programmato", colore: "text-accento border-accento/40" },
  in_pubblicazione: { nome: "In pubblicazione", colore: "text-accento border-accento/40" },
  pubblicato: { nome: "Pubblicato", colore: "text-ok border-ok/40" },
  errore: { nome: "Errore", colore: "text-ko border-ko/40" },
};

const TIPI: Record<string, string> = { IMAGE: "Post", CAROUSEL: "Carosello", REELS: "Reel", STORIES: "Storia" };

const fmt = new Intl.DateTimeFormat("it-IT", {
  weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome",
});

export default async function Coda() {
  const sb = await supabaseServer();
  const { data: posts } = await sb
    .from("posts")
    .select("id, tipo, caption, media_urls, scheduled_at, stato, errore, brand_kit(nome)")
    .order("scheduled_at", { ascending: true, nullsFirst: true })
    .limit(100);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Coda</h1>
        <Link href="/nuovo" className="bottone">+ Nuovo contenuto</Link>
      </div>

      {!posts?.length ? (
        <div className="rounded-2xl border border-dashed border-bordo p-10 text-center text-tenue">
          Nessun contenuto ancora. Crea il primo da <Link href="/nuovo" className="text-accento">Nuovo contenuto</Link>.
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((p) => {
            const s = STATI[p.stato] ?? STATI.bozza;
            const primo = p.media_urls?.[0] as string | undefined;
            const brand = (p.brand_kit as unknown as { nome: string } | null)?.nome;
            return (
              <li key={p.id} className="flex gap-4 rounded-2xl border border-bordo bg-pannello p-3">
                <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-fondo">
                  {primo &&
                    (/\.(mp4|mov)$/i.test(primo) ? (
                      <video src={primo} className="h-full w-full object-cover" muted />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={primo} alt="" className="h-full w-full object-cover" />
                    ))}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-full border px-2 py-0.5 ${s.colore}`}>{s.nome}</span>
                    <span className="text-tenue">{TIPI[p.tipo]} · {brand}</span>
                    {p.scheduled_at && <span className="text-tenue">· {fmt.format(new Date(p.scheduled_at))}</span>}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm">{p.caption || <span className="text-tenue">(nessuna caption)</span>}</p>
                  {p.errore && <p className="mt-1 text-xs text-ko">{p.errore}</p>}
                </div>
                <Azioni id={p.id} stato={p.stato} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
