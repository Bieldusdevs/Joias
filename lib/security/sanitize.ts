export function sanitizeText(value: unknown, maxLength = 600) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeUrl(value: unknown, maxLength = 800) {
  const text = sanitizeText(value, maxLength);
  if (!text) return "";
  if (
    text.startsWith("/") ||
    text.startsWith("https://") ||
    text.startsWith("http://") ||
    text.startsWith("mailto:") ||
    text.startsWith("tel:") ||
    text.startsWith("data:image/")
  ) {
    return text;
  }
  return "";
}

export function sanitizeTags(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => sanitizeText(item, 32)).filter(Boolean).slice(0, 8);
}
