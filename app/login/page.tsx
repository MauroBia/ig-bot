"use client";
import { useActionState, useState } from "react";
import { accedi, creaAccount } from "./actions";

export default function Login() {
  const [nuovo, setNuovo] = useState(false);
  const [stato, azione, inCorso] = useActionState(nuovo ? creaAccount : accedi, undefined);

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form action={azione} className="w-full max-w-sm space-y-4 rounded-2xl border border-bordo bg-pannello p-6">
        <div>
          <h1 className="text-xl font-bold">IG Bot</h1>
          <p className="text-sm text-tenue">{nuovo ? "Crea il tuo accesso" : "Accedi alla dashboard"}</p>
        </div>
        <div>
          <label className="etichetta" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required className="campo" autoComplete="email" />
        </div>
        <div>
          <label className="etichetta" htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="campo"
            autoComplete={nuovo ? "new-password" : "current-password"}
          />
        </div>
        {stato?.errore && <p className="text-sm text-ko">{stato.errore}</p>}
        <button className="bottone w-full" disabled={inCorso}>
          {inCorso ? "Attendi…" : nuovo ? "Crea accesso" : "Accedi"}
        </button>
        <button type="button" onClick={() => setNuovo(!nuovo)} className="w-full text-center text-xs text-tenue hover:text-testo">
          {nuovo ? "Hai già un accesso? Accedi" : "Primo accesso? Crea la password"}
        </button>
      </form>
    </main>
  );
}
