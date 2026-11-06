export const metadata = { title: "Informativa privacy · IG Bot" };

export default function Privacy() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-sm leading-relaxed">
      <h1 className="mb-4 text-2xl font-bold">Informativa sulla privacy</h1>
      <p className="mb-3">
        IG Bot è uno strumento interno usato per gestire le pagine Instagram dei nostri eventi (es. Farmer Night):
        programmazione dei contenuti e risposte automatiche a chi scrive una parola chiave nei commenti o in direct.
      </p>
      <h2 className="mb-2 mt-6 font-semibold">Quali dati trattiamo</h2>
      <p className="mb-3">
        Quando commenti un nostro post o ci scrivi in direct con una parola chiave (ad esempio “LISTA”), riceviamo da
        Instagram il testo del commento o del messaggio, il tuo nome utente e un identificativo tecnico. Li usiamo solo
        per inviarti il messaggio che hai richiesto e per evitare di inviartelo due volte.
      </p>
      <h2 className="mb-2 mt-6 font-semibold">Conservazione e condivisione</h2>
      <p className="mb-3">
        I dati vengono conservati al massimo 90 giorni, non vengono venduti né ceduti a terzi e non sono usati per
        pubblicità. Sono ospitati su server nell’Unione Europea.
      </p>
      <h2 className="mb-2 mt-6 font-semibold">I tuoi diritti</h2>
      <p className="mb-3">
        Puoi chiedere in qualsiasi momento di vedere o cancellare i tuoi dati scrivendo in direct alla pagina o seguendo
        le istruzioni nella pagina <a className="text-accento" href="/eliminazione-dati">Eliminazione dei dati</a>.
      </p>
      <p className="mt-8 text-tenue">Titolare: Mauro Bianchetti · Ultimo aggiornamento: novembre 2026</p>
    </main>
  );
}
