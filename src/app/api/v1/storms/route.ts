import { NextResponse } from "next/server";
import { getData } from "@/lib/storms";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const d = getData();
  const id = searchParams.get("id");
  if (id) {
    const s = d.storms.find((x) => x.id === id);
    if (!s) return NextResponse.json({ error: `Unknown storm id ${id}` }, { status: 404 });
    return NextResponse.json(s);
  }
  const ranked = [...d.storms].sort((a, b) => b.est_revenue_lost_cad - a.est_revenue_lost_cad);
  return NextResponse.json({ count: ranked.length, storms: ranked });
}
