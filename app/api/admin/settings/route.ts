import { NextResponse } from "next/server";
import { addAuditLog, saveSettings, validateSettings } from "@/lib/contentStore";
import { csrfError, verifyCsrf } from "@/lib/security/csrf";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";
import { getSessionFromRequest } from "@/lib/security/session";

export async function PUT(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }
  if (!verifyCsrf(request)) return csrfError();

  const ip = getClientIp(request);
  const limit = rateLimit(`admin-settings:${session.email}:${ip}`, 20, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Limite de ações atingido." }, { status: 429 });

  const body = await request.json().catch(() => ({}));
  const settings = validateSettings(body.settings);
  const saved = await saveSettings(settings);

  await addAuditLog({
    actorEmail: session.email,
    role: session.role,
    action: "settings_update",
    resource: "site_settings",
    metadata: { brandName: saved.brandName },
    ip
  });

  return NextResponse.json({ settings: saved });
}
