import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/security/session";

export function verifyCsrf(request: Request) {
  const session = getSessionFromRequest(request);
  const token = request.headers.get("x-csrf-token");
  return Boolean(session && token && token === session.csrf);
}

export function csrfError() {
  return NextResponse.json({ error: "Pedido recusado por proteção CSRF." }, { status: 403 });
}
