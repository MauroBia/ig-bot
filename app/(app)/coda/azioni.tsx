"use client";
import { useTransition } from "react";
import { elimina, inBozza, programma, pubblicaOra } from "./actions";

export default function Azioni({ id, stato }: { id: string; stato: string }) {
  const [inCorso, start] = useTransition();
  if (stato === "pubblicato" || stato === "in_pubblicazione") return null;

  const esegui = (f: () => Promise<unknown>) => start(async () => { await f(); });

  return (
    <div className="flex shrink-0 flex-col gap-2">
      <button
        className="bottone-secondario"
        disabled={inCorso}
        onClick={() => {
          if (confirm("Pubblico subito su Instagram?")) esegui(() => pubblicaOra(id));
        }}
      >
        {inCorso ? "…" : stato === "errore" ? "Riprova ora" : "Pubblica ora"}
      </button>
      {stato === "programmato" ? (
        <button className="bottone-secondario" disabled={inCorso} onClick={() => esegui(() => inBozza(id))}>Sospendi</button>
      ) : (
        <button className="bottone-secondario" disabled={inCorso} onClick={() => esegui(() => programma(id))}>Programma</button>
      )}
      <button
        className="bottone-secondario text-ko"
        disabled={inCorso}
        onClick={() => {
          if (confirm("Elimino questo contenuto?")) esegui(() => elimina(id));
        }}
      >
        Elimina
      </button>
    </div>
  );
}
