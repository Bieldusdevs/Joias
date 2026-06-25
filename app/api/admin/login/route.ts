import { NextResponse } from "next/server";
import { addAuditLog } from "@/lib/contentStore";
import { authenticateAdmin } from "@/lib/security/users";
import { createSessionToken, sessionCookieName, sessionCookieOptions } from "@/lib/security/session";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";
import { sanitizeText } from "@/lib/security/sanitize";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`admin-login:${ip}`, 6, 60_000);

  if (!limit.allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde um momento." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const email = sanitizeText(body.email, 160);
  const password = typeof body.password === "string" ? body.password : "";
  const mfaCode = sanitizeText(body.mfaCode, 12);

  const user = await authenticateAdmin(email, password, mfaCode);

  if (!user) {
    await addAuditLog({
      actorEmail: email || "unknown",
      role: "support",
      action: "login_failed",
      resource: "admin_session",
      metadata: { reason: "invalid_credentials_or_mfa" },
      ip
    });
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
  }

  const token = createSessionToken({ userId: user.id, email: user.email, role: user.role });
  const response = NextResponse.json({ ok: true, user: { email: user.email, role: user.role } });
  response.cookies.set(sessionCookieName, token, sessionCookieOptions());

  await addAuditLog({
    actorEmail: user.email,
    role: user.role,
    action: "login_success",
    resource: "admin_session",
    metadata: {},
    ip
  });

  return response;
}
