import crypto from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export type Role = "super_admin" | "editor" | "support";

export type SessionPayload = {
  userId: string;
  email: string;
  role: Role;
  csrf: string;
  exp: number;
};

export const sessionCookieName = "noir_admin_session";
const maxAgeSeconds = 60 * 60 * 2;

function secret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.NEXTAUTH_SECRET || "dev-session-secret-change-me";
}

function b64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(payload: Omit<SessionPayload, "csrf" | "exp">) {
  const session: SessionPayload = {
    ...payload,
    csrf: crypto.randomBytes(32).toString("base64url"),
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds
  };
  const encoded = b64url(JSON.stringify(session));
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionToken(token?: string | null): SessionPayload | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = sign(encoded);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getSessionFromCookies() {
  const store = await cookies();
  return verifySessionToken(store.get(sessionCookieName)?.value);
}

export function getSessionFromRequest(request: NextRequest | Request) {
  const header = request.headers.get("cookie") || "";
  const found = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${sessionCookieName}=`));
  return verifySessionToken(found?.split("=").slice(1).join("="));
}

export async function requireSession(roles?: Role[]) {
  const session = await getSessionFromCookies();
  if (!session) return null;
  if (roles && !roles.includes(session.role)) return null;
  return session;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds
  };
}

export function expiredSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  };
}
