import { NextResponse } from "next/server";
import { addAuditLog } from "@/lib/contentStore";
import { expiredSessionCookieOptions, getSessionFromRequest, sessionCookieName } from "@/lib/security/session";
import { getClientIp } from "@/lib/security/rateLimit";

export async function POST(request: Request) {
  const session = getSessionFromRequest(request);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, "", expiredSessionCookieOptions());

  if (session) {
    await addAuditLog({
      actorEmail: session.email,
      role: session.role,
      action: "logout",
      resource: "admin_session",
      metadata: {},
      ip: getClientIp(request)
    });
  }

  return response;
}
