import { supabaseServer } from "@/lib/supabase";
import Editor from "./editor";

export default async function Nuovo() {
  const sb = await supabaseServer();
  const { data: brand } = await sb.from("brand_kit").select("id, nome").order("nome");
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Nuovo contenuto</h1>
      <Editor brand={brand ?? []} />
    </div>
  );
}
