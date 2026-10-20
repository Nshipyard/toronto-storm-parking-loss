import { NextResponse } from "next/server";
import { getData } from "@/lib/storms";

export async function GET() {
  return NextResponse.json(getData().summary);
}
