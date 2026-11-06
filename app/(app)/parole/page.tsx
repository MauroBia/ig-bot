import { supabaseServer } from "@/lib/supabase";
import { attivaRegola, eliminaRegola, salvaRegola } from "./actions";

const fmt = new Intl.DateTimeFormat("it-IT", {
  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome",
});

export default async function Parole() {
  const sb = await supabaseServer();
  const [{ data: brand }, { data: regole }, { data: eventi }] = await Promise.all([
    sb.from("brand_kit").select("id, nome").order("nome"),
    sb.from("regole_dm").select("*, brand_kit(nome)").order("created_at"),
    sb.from("eventi_dm").select("*").order("created_at", { ascending: false }).limit(30),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Parole chiave</h1>
        <p className="mt-1 text-sm text-tenue">
          Chi commenta (o scrive in direct) la parola chiave riceve in automatico il messaggio. Tutto il resto viene ignorato.
        </p>
      </div>

      <ul className="space-y-3">
        {regole?.map((r) => (
          <li key={r.id} className="rounded-2xl border border-bordo bg-pannello p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-accento px-2 py-0.5 text-sm font-bold text-black">{r.parola}</span>
              <span className="text-xs text-tenue">
                {(r.brand_kit as { nome: string } | null)?.nome} · {r.media_id ? `solo post ${r.media_id}` : "tutti i post"}
                {r.anche_in_direct ? " · anche in direct" : ""}
              </span>
              <span className={`ml-auto text-xs ${r.attiva ? "text-ok" : "text-tenue"}`}>{r.attiva ? "Attiva" : "In pausa"}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm">{r.messaggio}</p>
            {r.risposta_pubblica && <p className="mt-1 text-xs text-tenue">Risposta pubblica: {r.risposta_pubblica}</p>}
            <div className="mt-3 flex gap-2">
              <form action={attivaRegola.bind(null, r.id, !r.attiva)}>
                <button className="bottone-secondario">{r.attiva ? "Metti in pausa" : "Attiva"}</button>
              </form>
              <form action={eliminaRegola.bind(null, r.id)}>
                <button className="bottone-secondario">Elimina</button>
              </form>
            </div>
          </li>
        ))}
      </ul>

      <form action={salvaRegola} className="space-y-3 rounded-2xl border border-bordo bg-pannello p-4">
        <h2 className="font-semibold">Nuova parola chiave</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className="etichetta">Pagina</span>
            <select name="brand_kit_id" className="campo">
              {brand?.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
            </select>
          </label>
          <label>
            <span className="etichetta">Parola chiave</span>
            <input name="parola" className="campo" placeholder="LISTA" required />
          </label>
        </div>
        <label className="block">
          <span className="etichetta">Messaggio in direct</span>
          <textarea name="messaggio" rows={4} className="campo" required placeholder="Ciao! Ecco il link per iscriverti in lista: …" />
        </label>
        <label className="block">
          <span className="etichetta">Risposta pubblica sotto al commento (facoltativa)</span>
          <input name="risposta_pubblica" className="campo" placeholder="Ti abbiamo scritto in direct 📩" />
        </label>
        <label className="block">
          <span className="etichetta">Solo su un post (ID, facoltativo)</span>
          <input name="media_id" className="campo" placeholder="Vuoto = tutti i post" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="anche_in_direct" defaultChecked /> Rispondi anche a chi scrive la parola in direct
        </label>
        <button className="bottone">Salva</button>
      </form>

      <div>
        <h2 className="mb-3 font-semibold">Ultime risposte</h2>
        {!eventi?.length ? (
          <p className="text-sm text-tenue">Ancora nessuna.</p>
        ) : (
          <ul className="divide-y divide-bordo rounded-2xl border border-bordo bg-pannello text-sm">
            {eventi.map((e) => (
              <li key={e.id} className="flex flex-wrap gap-x-3 px-4 py-2">
                <span className="text-tenue">{fmt.format(new Date(e.created_at))}</span>
                <span>{e.tipo === "commento" ? "💬" : "✉️"} {e.da_username ? "@" + e.da_username : ""} “{e.testo}”</span>
                <span className={`ml-auto ${e.esito === "inviato" ? "text-ok" : e.esito === "errore" ? "text-ko" : "text-tenue"}`}>
                  {e.esito}{e.errore ? `: ${e.errore}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
