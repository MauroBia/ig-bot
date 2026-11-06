import { NextResponse } from "next/server";
import { diagnosi } from "@/lib/dm";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** Controlla permessi e (con ?iscrivi=1) iscrive le Pagine ai webhook. Protetto da CRON_SECRET. */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ errore: "non autorizzato" }, { status: 401 });
  }
  const iscrivi = new URL(req.url).searchParams.get("iscrivi") === "1";
  const { data } = await supabaseAdmin().from("brand_kit").select("nome, page_id").not("page_id", "is", null);
  const out: Record<string, unknown> = {};
  for (const b of data ?? []) out[b.nome] = await diagnosi(b.page_id, iscrivi);
  return NextResponse.json(out);
}
