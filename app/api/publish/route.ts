import { NextResponse } from "next/server";
import { pubblicaInScadenza } from "@/lib/coda";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

/** Chiamata ogni 5 minuti dallo scheduler, protetta da CRON_SECRET. */
export async function GET(req: Request) {
  const atteso = process.env.CRON_SECRET;
  if (!atteso || req.headers.get("authorization") !== `Bearer ${atteso}`) {
    return NextResponse.json({ errore: "non autorizzato" }, { status: 401 });
  }
  const risultati = await pubblicaInScadenza();
  return NextResponse.json({ pubblicati: risultati.length, risultati });
}

export const POST = GET;
