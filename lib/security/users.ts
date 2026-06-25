import crypto from "crypto";
import type { Role } from "@/lib/security/session";
import { verifyTotp } from "@/lib/security/totp";

export type AdminUser = {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  mfaSecret: string;
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
  return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(digest));
}

function parseUsers(): AdminUser[] {
  const raw = process.env.ADMIN_USERS_JSON;
  if (raw) {
    try {
      const users = JSON.parse(raw) as AdminUser[];
      return users.filter((user) => user.email && user.passwordHash && user.mfaSecret && user.role);
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
        mfaSecret: process.env.ADMIN_MFA_SECRET || "JBSWY3DPEHPK3PXP",
        enabled: true
      }
    ];
  }

  return [];
}

export async function authenticateAdmin(email: string, password: string, mfaCode: string) {
  const user = parseUsers().find((candidate) => candidate.email.toLowerCase() === email.toLowerCase() && candidate.enabled);
  if (!user) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  if (!verifyTotp(mfaCode, user.mfaSecret)) return null;
  return user;
}
