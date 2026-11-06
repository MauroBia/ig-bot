export const metadata = { title: "Eliminazione dei dati · IG Bot" };

export default function Eliminazione() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-sm leading-relaxed">
      <h1 className="mb-4 text-2xl font-bold">Eliminazione dei dati</h1>
      <p className="mb-3">Per far cancellare i dati che ci hai inviato tramite Instagram:</p>
      <ol className="mb-3 list-decimal space-y-1 pl-5">
        <li>Scrivi in direct alla pagina Instagram il messaggio “CANCELLA I MIEI DATI”.</li>
        <li>Entro 30 giorni eliminiamo commenti, messaggi e identificativi associati al tuo profilo.</li>
        <li>Ti confermiamo l’avvenuta cancellazione in direct.</li>
      </ol>
      <p>Puoi anche rimuovere l’accesso dalle impostazioni di Instagram o Facebook, sezione App e siti web.</p>
    </main>
  );
}
