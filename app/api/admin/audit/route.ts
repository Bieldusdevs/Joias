import { NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/contentStore";
import { getSessionFromRequest } from "@/lib/security/session";

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }
  return NextResponse.json({ logs: await getAuditLogs(120) });
}
