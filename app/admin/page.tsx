"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product, SiteSettings } from "@/lib/products";
import { categories, defaultSettings, products as defaultProducts } from "@/lib/products";
import { money } from "@/lib/money";

type User = {
  email: string;
  role: "super_admin" | "editor" | "support";
};

type AuditLog = {
  id: string;
  actorEmail: string;
  role: string;
  action: string;
  resource: string;
  ip: string;
  createdAt: string;
};

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [csrfToken, setCsrfToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(defaultProducts[0]?.id || "");

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedId) || products[0],
    [products, selectedId]
  );

  const canEditProducts = user?.role === "super_admin" || user?.role === "editor";
  const canEditSettings = user?.role === "super_admin";

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    setLoading(true);
    const response = await fetch("/api/admin/me", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      setUser(data.user);
      await loadCsrf();
      await loadContent();
      await loadAudit();
    }
    setLoading(false);
  }

  async function loadCsrf() {
    const response = await fetch("/api/admin/csrf", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      setCsrfToken(data.csrfToken);
    }
  }

  async function loadContent() {
    const response = await fetch("/api/admin/content", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      setProducts(data.products);
      setSettings(data.settings);
      setSelectedId(data.products[0]?.id || "");
    }
  }

  async function loadAudit() {
    const response = await fetch("/api/admin/audit", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      setLogs(data.logs || []);
    }
  }

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setStatus("A validar acesso...");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, mfaCode })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(data.error || "Não foi possível autenticar.");
      return;
    }
    setUser(data.user);
    setPassword("");
    setMfaCode("");
    await loadCsrf();
    await loadContent();
    await loadAudit();
    setStatus("Sessão iniciada.");
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setUser(null);
    setCsrfToken("");
    setStatus("");
  }

  async function saveProductsAction() {
    if (!canEditProducts) return;
    setStatus("A guardar produtos...");
    const response = await fetch("/api/admin/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
      body: JSON.stringify({ products })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(data.error || "Erro ao guardar produtos.");
      return;
    }
    setProducts(data.products);
    await loadAudit();
    setStatus("Produtos atualizados.");
  }

  async function saveSettingsAction() {
    if (!canEditSettings) return;
    setStatus("A guardar definições...");
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
      body: JSON.stringify({ settings })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(data.error || "Erro ao guardar definições.");
      return;
    }
    setSettings(data.settings);
    await loadAudit();
    setStatus("Definições atualizadas.");
  }

  function updateProduct(id: string, patch: Partial<Product>) {
    setProducts((current) => current.map((product) => (product.id === id ? { ...product, ...patch } : product)));
  }

  function addProduct() {
    const id = `joia-${Date.now()}`;
    const product: Product = {
      id,
      name: "Nova joia Noir",
      category: "colares",
      categoryLabel: "Colares",
      price: 0,
      description: "Descrição editorial da peça.",
      coating: "Prata escura · pedra negra",
      video: "/videos/colar-riviera.mp4",
      image: "/editorial/macro-necklace.png",
      tags: ["noir"],
      stock: 1
    };
    setProducts((current) => [product, ...current]);
    setSelectedId(id);
  }

  function removeProduct(id: string) {
    const next = products.filter((product) => product.id !== id);
    setProducts(next);
    setSelectedId(next[0]?.id || "");
  }

  function readImageFile(file: File) {
    return new Promise<string>((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        reject(new Error("Selecione um arquivo de imagem."));
        return;
      }
      if (file.size > 900_000) {
        reject(new Error("Use uma imagem com até 900 KB para manter o site rápido."));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      reader.readAsDataURL(file);
    });
  }

  async function changeProductPhoto(id: string, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const image = await readImageFile(file);
      updateProduct(id, { image });
      setStatus("Foto do produto carregada. Clique em Guardar produtos para publicar.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Erro ao trocar foto.");
    } finally {
      event.target.value = "";
    }
  }

  async function changeHeroPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const heroImage = await readImageFile(file);
      setSettings((current) => ({ ...current, heroImage }));
      setStatus("Foto principal carregada. Clique em Guardar para publicar.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Erro ao trocar foto principal.");
    } finally {
      event.target.value = "";
    }
  }


  if (loading) {
    return <main className="admin-shell"><p className="eyebrow">Admin</p><h1>A carregar painel.</h1></main>;
  }

  if (!user) {
    return (
      <main className="admin-login-page">
        <form className="admin-login-card" onSubmit={login}>
          <p className="eyebrow">Noir Atelier · Administração</p>
          <h1>Acesso reservado.</h1>
          <p>Entre com credenciais administrativas e código MFA para gerir catálogo, contactos, redes sociais e auditoria.</p>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="username" required />
          </label>
          <label>
            Palavra-passe
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required />
          </label>
          <label>
            Código MFA
            <input value={mfaCode} onChange={(event) => setMfaCode(event.target.value)} inputMode="numeric" maxLength={6} autoComplete="one-time-code" required />
          </label>
          <button className="button primary full" type="submit">Entrar</button>
          {status ? <p className="admin-status">{status}</p> : null}
        </form>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">Painel Admin</p>
          <h1>Noir Atelier.</h1>
        </div>
        <div className="admin-user">
          <span>{user.email}</span>
          <b>{user.role}</b>
          <button className="button ghost" onClick={logout}>Sair</button>
        </div>
      </header>

      {status ? <div className="admin-status-bar">{status}</div> : null}

      <section className="admin-grid">
        <aside className="admin-panel product-list-panel">
          <div className="panel-head">
            <h2>Produtos</h2>
            {canEditProducts ? <button className="button ghost" onClick={addProduct}>Novo</button> : null}
          </div>
          <div className="admin-product-list">
            {products.map((product) => (
              <button
                key={product.id}
                className={product.id === selectedId ? "admin-product-row active" : "admin-product-row"}
                onClick={() => setSelectedId(product.id)}
              >
                <img src={product.image} alt="" />
                <span>{product.name}</span>
                <b>{money.format(product.price / 100)}</b>
              </button>
            ))}
          </div>
        </aside>

        <section className="admin-panel editor-panel">
          <div className="panel-head">
            <h2>Editor de produto</h2>
            {canEditProducts ? <button className="button primary" onClick={saveProductsAction}>Guardar produtos</button> : null}
          </div>

          {selectedProduct ? (
            <div className="editor-grid">
              <label>ID<input value={selectedProduct.id} onChange={(event) => updateProduct(selectedProduct.id, { id: event.target.value })} disabled={!canEditProducts} /></label>
              <label>Nome<input value={selectedProduct.name} onChange={(event) => updateProduct(selectedProduct.id, { name: event.target.value })} disabled={!canEditProducts} /></label>
              <label>Categoria
                <select value={selectedProduct.category} onChange={(event) => updateProduct(selectedProduct.id, { category: event.target.value as Product["category"] })} disabled={!canEditProducts}>
                  {categories.filter((category) => category.id !== "todos").map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
                </select>
              </label>
              <label>Preço em cêntimos<input value={selectedProduct.price} onChange={(event) => updateProduct(selectedProduct.id, { price: Number(event.target.value) })} type="number" disabled={!canEditProducts} /></label>
              <label>Estoque<input value={selectedProduct.stock} onChange={(event) => updateProduct(selectedProduct.id, { stock: Number(event.target.value) })} type="number" disabled={!canEditProducts} /></label>
              <label>Acabamento<input value={selectedProduct.coating} onChange={(event) => updateProduct(selectedProduct.id, { coating: event.target.value })} disabled={!canEditProducts} /></label>
              <label className="wide">Foto do produto — URL, caminho ou imagem carregada<input value={selectedProduct.image} onChange={(event) => updateProduct(selectedProduct.id, { image: event.target.value })} disabled={!canEditProducts} /></label>
              <label className="wide">Trocar foto do produto<input type="file" accept="image/*" onChange={(event) => changeProductPhoto(selectedProduct.id, event)} disabled={!canEditProducts} /></label>
              <label className="wide">Vídeo do produto<input value={selectedProduct.video} onChange={(event) => updateProduct(selectedProduct.id, { video: event.target.value })} disabled={!canEditProducts} /></label>
              <label className="wide">Descrição<textarea value={selectedProduct.description} onChange={(event) => updateProduct(selectedProduct.id, { description: event.target.value })} disabled={!canEditProducts} /></label>
              <label className="wide">Tags separadas por vírgula<input value={selectedProduct.tags.join(", ")} onChange={(event) => updateProduct(selectedProduct.id, { tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} disabled={!canEditProducts} /></label>
              <label className="check"><input checked={Boolean(selectedProduct.featured)} onChange={(event) => updateProduct(selectedProduct.id, { featured: event.target.checked })} type="checkbox" disabled={!canEditProducts} /> Destaque</label>
              {canEditProducts ? <button className="danger-button" onClick={() => removeProduct(selectedProduct.id)}>Remover produto</button> : null}
              <div className="admin-preview wide">
                <img src={selectedProduct.image} alt={selectedProduct.name} />
                <div><p className="eyebrow">Preview</p><h3>{selectedProduct.name}</h3><p>{selectedProduct.description}</p></div>
              </div>
            </div>
          ) : <p>Nenhum produto selecionado.</p>}
        </section>

        <section className="admin-panel settings-panel">
          <div className="panel-head">
            <h2>Marca, contacto e redes</h2>
            {canEditSettings ? <button className="button primary" onClick={saveSettingsAction}>Guardar</button> : null}
          </div>
          <div className="editor-grid">
            <label>Nome da marca<input value={settings.brandName} onChange={(event) => setSettings({ ...settings, brandName: event.target.value })} disabled={!canEditSettings} /></label>
            <label>Email<input value={settings.contactEmail} onChange={(event) => setSettings({ ...settings, contactEmail: event.target.value })} disabled={!canEditSettings} /></label>
            <label>Telefone<input value={settings.contactPhone} onChange={(event) => setSettings({ ...settings, contactPhone: event.target.value })} disabled={!canEditSettings} /></label>
            <label>WhatsApp<input value={settings.whatsapp} onChange={(event) => setSettings({ ...settings, whatsapp: event.target.value })} disabled={!canEditSettings} /></label>
            <label>Instagram<input value={settings.instagram} onChange={(event) => setSettings({ ...settings, instagram: event.target.value })} disabled={!canEditSettings} /></label>
            <label>Pinterest<input value={settings.pinterest} onChange={(event) => setSettings({ ...settings, pinterest: event.target.value })} disabled={!canEditSettings} /></label>
            <label>TikTok<input value={settings.tiktok} onChange={(event) => setSettings({ ...settings, tiktok: event.target.value })} disabled={!canEditSettings} /></label>
            <label>Morada<input value={settings.address} onChange={(event) => setSettings({ ...settings, address: event.target.value })} disabled={!canEditSettings} /></label>
            <label className="wide">Título da home<input value={settings.heroTitle} onChange={(event) => setSettings({ ...settings, heroTitle: event.target.value })} disabled={!canEditSettings} /></label>
            <label className="wide">Subtítulo da home<textarea value={settings.heroSubtitle} onChange={(event) => setSettings({ ...settings, heroSubtitle: event.target.value })} disabled={!canEditSettings} /></label>
            <label className="wide">Foto principal da home<input value={settings.heroImage} onChange={(event) => setSettings({ ...settings, heroImage: event.target.value })} disabled={!canEditSettings} /></label>
            <label className="wide">Trocar foto principal<input type="file" accept="image/*" onChange={changeHeroPhoto} disabled={!canEditSettings} /></label>
            <div className="admin-preview wide">
              <img src={settings.heroImage} alt="Foto principal" />
              <div><p className="eyebrow">Preview da home</p><h3>{settings.brandName}</h3><p>{settings.heroTitle}</p></div>
            </div>
          </div>
        </section>

        <section className="admin-panel audit-panel">
          <div className="panel-head"><h2>Auditoria</h2><button className="button ghost" onClick={loadAudit}>Atualizar</button></div>
          <div className="audit-list">
            {logs.length ? logs.map((log) => (
              <div key={log.id} className="audit-row">
                <b>{log.action}</b>
                <span>{log.actorEmail} · {log.role}</span>
                <small>{new Date(log.createdAt).toLocaleString("pt-PT")} · {log.ip}</small>
              </div>
            )) : <p>Sem registos visíveis para este cargo.</p>}
          </div>
        </section>
      </section>
    </main>
  );
}
