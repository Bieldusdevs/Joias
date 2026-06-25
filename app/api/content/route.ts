import { NextResponse } from "next/server";
import { getContent } from "@/lib/contentStore";

export async function GET() {
  const content = await getContent();
  return NextResponse.json(content, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
