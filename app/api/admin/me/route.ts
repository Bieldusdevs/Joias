import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/security/session";

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({
    authenticated: true,
    user: { email: session.email, role: session.role },
    expiresAt: session.exp
  });
}
