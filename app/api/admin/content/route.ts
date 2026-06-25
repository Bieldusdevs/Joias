import { NextResponse } from "next/server";
import { getContent } from "@/lib/contentStore";
import { getSessionFromRequest } from "@/lib/security/session";

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  return NextResponse.json(await getContent());
}
