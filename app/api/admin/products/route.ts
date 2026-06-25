import { NextResponse } from "next/server";
import { addAuditLog, saveProducts, validateProduct } from "@/lib/contentStore";
import { csrfError, verifyCsrf } from "@/lib/security/csrf";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";
import { getSessionFromRequest } from "@/lib/security/session";

export async function PUT(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session || !["super_admin", "editor"].includes(session.role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }
  if (!verifyCsrf(request)) return csrfError();

  const ip = getClientIp(request);
  const limit = rateLimit(`admin-products:${session.email}:${ip}`, 30, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Limite de ações atingido." }, { status: 429 });

  const body = await request.json().catch(() => ({}));
  const products = Array.isArray(body.products) ? body.products.map(validateProduct).slice(0, 80) : [];
  const saved = await saveProducts(products);

  await addAuditLog({
    actorEmail: session.email,
    role: session.role,
    action: "products_update",
    resource: "products",
    metadata: { count: saved.length },
    ip
  });

  return NextResponse.json({ products: saved });
}
