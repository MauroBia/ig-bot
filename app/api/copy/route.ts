import { NextResponse } from "next/server";
import { supabaseServer, utenteCorrente } from "@/lib/supabase";
import { generaCopy } from "@/lib/claude";

export async function POST(req: Request) {
  if (!(await utenteCorrente())) return NextResponse.json({ errore: "non autorizzato" }, { status: 401 });

  const { brandId, brief, tipo } = await req.json();
  if (!brief?.trim()) return NextResponse.json({ errore: "Scrivi un brief" }, { status: 400 });

  const sb = await supabaseServer();
  const { data: brand } = await sb.from("brand_kit").select("*").eq("id", brandId).single();
  if (!brand) return NextResponse.json({ errore: "Brand non trovato" }, { status: 404 });

  try {
    const varianti = await generaCopy(brand, brief, tipo);
    return NextResponse.json({ varianti });
  } catch (e) {
    return NextResponse.json(
      { errore: "Non sono riuscito a generare il copy: " + (e instanceof Error ? e.message : "errore") },
      { status: 500 }
    );
  }
}
