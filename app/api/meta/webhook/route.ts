import { NextResponse } from "next/server";
import { firmaValida, gestisciCommento, gestisciMessaggio } from "@/lib/dm";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Verifica dell'URL da parte di Meta. */
export async function GET(req: Request) {
  const u = new URL(req.url).searchParams;
  if (u.get("hub.mode") === "subscribe" && u.get("hub.verify_token") === process.env.META_VERIFY_TOKEN) {
    return new Response(u.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("no", { status: 403 });
}

/** Notifiche di Meta: commenti e messaggi. */
export async function POST(req: Request) {
  const corpo = await req.text();
  if (!firmaValida(corpo, req.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ errore: "firma non valida" }, { status: 401 });
  }
  const dati = JSON.parse(corpo);
  const lavori: Promise<void>[] = [];
  for (const e of dati.entry ?? []) {
    const ig = String(e.id);
    for (const ch of e.changes ?? []) {
      if (ch.field === "comments") lavori.push(gestisciCommento(ig, ch.value));
    }
    for (const m of e.messaging ?? []) lavori.push(gestisciMessaggio(ig, m));
  }
  await Promise.allSettled(lavori);
  return NextResponse.json({ ok: true });
}
