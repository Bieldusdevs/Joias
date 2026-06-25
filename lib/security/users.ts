import crypto from "crypto";
import type { Role } from "@/lib/security/session";
import { verifyTotp } from "@/lib/security/totp";

export type AdminUser = {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  mfaSecret?: string;
  enabled: boolean;
};

export function hashPassword(password: string, salt = crypto.randomBytes(16).toString("base64url")) {
  const iterations = 210_000;
  const digest = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("base64url");
  return `pbkdf2_sha256$${iterations}$${salt}$${digest}`;
}

function verifyPassword(password: string, hash: string) {
  const [algo, iterationsRaw, salt, digest] = hash.split("$");
  if (algo !== "pbkdf2_sha256" || !iterationsRaw || !salt || !digest) return false;
  const iterations = Number(iterationsRaw);
  const candidate = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("base64url");
  const candidateBuffer = Buffer.from(candidate);
  const digestBuffer = Buffer.from(digest);
  if (candidateBuffer.length !== digestBuffer.length) return false;
  return crypto.timingSafeEqual(candidateBuffer, digestBuffer);
}

function parseUsers(): AdminUser[] {
  const raw = process.env.ADMIN_USERS_JSON;
  if (raw) {
    try {
      const users = JSON.parse(raw) as AdminUser[];
      return users.filter((user) => user.email && user.passwordHash && user.role);
    } catch {
      return [];
    }
  }

  if (process.env.NODE_ENV !== "production") {
    return [
      {
        id: "dev-admin",
        email: process.env.ADMIN_EMAIL || "admin@noir.local",
        passwordHash: process.env.ADMIN_PASSWORD_HASH || hashPassword(process.env.ADMIN_PASSWORD || "admin123"),
        role: "super_admin",
        mfaSecret: process.env.ADMIN_MFA_SECRET,
        enabled: true
      }
    ];
  }

  return [];
}

export async function authenticateAdmin(email: string, password: string, mfaCode?: string) {
  const user = parseUsers().find((candidate) => candidate.email.toLowerCase() === email.toLowerCase() && candidate.enabled);
  if (!user) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;

  // Login facilitado por padrão: email + senha.
  // Se quiser reativar MFA no futuro, defina ADMIN_REQUIRE_MFA=true e informe mfaSecret no ADMIN_USERS_JSON.
  if (process.env.ADMIN_REQUIRE_MFA === "true") {
    if (!user.mfaSecret || !verifyTotp(mfaCode || "", user.mfaSecret)) return null;
  }

  return user;
}
