import { sql } from "@vercel/postgres";
import { promises as fs } from "fs";
import path from "path";
import { products as defaultProducts, defaultSettings } from "@/lib/products";
import type { Product, SiteSettings } from "@/lib/products";
import { sanitizeTags, sanitizeText, sanitizeUrl } from "@/lib/security/sanitize";

export type Content = {
  products: Product[];
  settings: SiteSettings;
};

export type AuditEntry = {
  id: string;
  actorEmail: string;
  role: string;
  action: string;
  resource: string;
  metadata: Record<string, unknown>;
  ip: string;
  createdAt: string;
};

const dataPath = path.join(process.cwd(), "data", "content.json");
const auditPath = path.join(process.cwd(), "data", "audit.json");

function hasDatabase() {
  return Boolean(process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING);
}

async function ensureTables() {
  if (!hasDatabase()) return false;
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_email TEXT NOT NULL,
      role TEXT NOT NULL,
      action TEXT NOT NULL,
      resource TEXT NOT NULL,
      metadata JSONB NOT NULL,
      ip TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  return true;
}

export function validateProduct(input: unknown): Product {
  const raw = (input || {}) as Partial<Product>;
  const category = ["colares", "aneis", "pingentes", "pulseiras", "brincos"].includes(String(raw.category))
    ? (raw.category as Product["category"])
    : "colares";

  const categoryMap: Record<Product["category"], string> = {
    colares: "Colares",
    aneis: "Anéis",
    pingentes: "Pingentes",
    pulseiras: "Pulseiras",
    brincos: "Brincos"
  };

  const id = sanitizeText(raw.id, 80)
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-") || crypto.randomUUID();

  return {
    id,
    name: sanitizeText(raw.name, 120) || "Nova joia",
    category,
    categoryLabel: categoryMap[category],
    price: Math.max(0, Math.min(999999999, Number(raw.price || 0))),
    description: sanitizeText(raw.description, 700),
    coating: sanitizeText(raw.coating, 160),
    video: sanitizeUrl(raw.video, 500),
    image: sanitizeUrl(raw.image, 1200000) || "/editorial/macro-necklace.png",
    tags: sanitizeTags(raw.tags),
    stock: Math.max(0, Math.min(9999, Number(raw.stock || 0))),
    featured: Boolean(raw.featured)
  };
}

export function validateSettings(input: unknown): SiteSettings {
  const raw = (input || {}) as Partial<SiteSettings>;
  return {
    brandName: sanitizeText(raw.brandName, 80) || defaultSettings.brandName,
    heroTitle: sanitizeText(raw.heroTitle, 180) || defaultSettings.heroTitle,
    heroSubtitle: sanitizeText(raw.heroSubtitle, 420) || defaultSettings.heroSubtitle,
    heroImage: sanitizeUrl(raw.heroImage, 1200000) || defaultSettings.heroImage,
    contactEmail: sanitizeText(raw.contactEmail, 160),
    contactPhone: sanitizeText(raw.contactPhone, 80),
    whatsapp: sanitizeUrl(raw.whatsapp, 300),
    instagram: sanitizeUrl(raw.instagram, 300),
    pinterest: sanitizeUrl(raw.pinterest, 300),
    tiktok: sanitizeUrl(raw.tiktok, 300),
    address: sanitizeText(raw.address, 240)
  };
}

async function getFileContent(): Promise<Content> {
  try {
    const raw = JSON.parse(await fs.readFile(dataPath, "utf8")) as Partial<Content>;
    const fileProducts = Array.isArray(raw.products) && raw.products.length > 0 ? raw.products.map(validateProduct) : defaultProducts;
    return {
      products: fileProducts,
      settings: validateSettings(raw.settings || defaultSettings)
    };
  } catch {
    return { products: defaultProducts, settings: defaultSettings };
  }
}

async function setFileContent(content: Content) {
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  await fs.writeFile(dataPath, JSON.stringify(content, null, 2));
}

export async function getContent(): Promise<Content> {
  if (!(await ensureTables())) return getFileContent();

  const productRows = await sql<{ data: Product }>`SELECT data FROM products ORDER BY updated_at DESC`;
  const settingsRows = await sql<{ value: SiteSettings }>`SELECT value FROM site_settings WHERE key = 'main' LIMIT 1`;

  const products = productRows.rows.length ? productRows.rows.map((row) => validateProduct(row.data)) : defaultProducts;
  const settings = settingsRows.rows[0]?.value ? validateSettings(settingsRows.rows[0].value) : defaultSettings;

  return { products, settings };
}

export async function saveProducts(products: Product[]) {
  const clean = products.map(validateProduct);
  if (!(await ensureTables())) {
    const current = await getFileContent();
    await setFileContent({ ...current, products: clean });
    return clean;
  }

  await sql`DELETE FROM products`;
  for (const product of clean) {
    await sql`INSERT INTO products (id, data) VALUES (${product.id}, ${JSON.stringify(product)}::jsonb)`;
  }
  return clean;
}

export async function saveSettings(settings: SiteSettings) {
  const clean = validateSettings(settings);
  if (!(await ensureTables())) {
    const current = await getFileContent();
    await setFileContent({ ...current, settings: clean });
    return clean;
  }

  await sql`
    INSERT INTO site_settings (key, value)
    VALUES ('main', ${JSON.stringify(clean)}::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `;
  return clean;
}

export async function addAuditLog(entry: Omit<AuditEntry, "id" | "createdAt">) {
  const audit: AuditEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...entry
  };

  if (!(await ensureTables())) {
    await fs.mkdir(path.dirname(auditPath), { recursive: true });
    let rows: AuditEntry[] = [];
    try {
      rows = JSON.parse(await fs.readFile(auditPath, "utf8")) as AuditEntry[];
    } catch {}
    rows.unshift(audit);
    await fs.writeFile(auditPath, JSON.stringify(rows.slice(0, 500), null, 2));
    return audit;
  }

  await sql`
    INSERT INTO audit_logs (id, actor_email, role, action, resource, metadata, ip)
    VALUES (${audit.id}, ${audit.actorEmail}, ${audit.role}, ${audit.action}, ${audit.resource}, ${JSON.stringify(audit.metadata)}::jsonb, ${audit.ip})
  `;
  return audit;
}

export async function getAuditLogs(limit = 100): Promise<AuditEntry[]> {
  if (!(await ensureTables())) {
    try {
      const rows = JSON.parse(await fs.readFile(auditPath, "utf8")) as AuditEntry[];
      return rows.slice(0, limit);
    } catch {
      return [];
    }
  }

  const rows = await sql<{
    id: string;
    actor_email: string;
    role: string;
    action: string;
    resource: string;
    metadata: Record<string, unknown>;
    ip: string;
    created_at: string;
  }>`SELECT id, actor_email, role, action, resource, metadata, ip, created_at FROM audit_logs ORDER BY created_at DESC LIMIT ${limit}`;

  return rows.rows.map((row) => ({
    id: row.id,
    actorEmail: row.actor_email,
    role: row.role,
    action: row.action,
    resource: row.resource,
    metadata: row.metadata,
    ip: row.ip,
    createdAt: new Date(row.created_at).toISOString()
  }));
}
