# Noir Atelier — alta joalheria editorial premium

Site completo de joias de luxo com estética editorial, atmosfera sofisticada e painel administrativo fácil de usar.

## Incluído

- Landing page premium com modelo editorial usando joias negras
- Fotografias macro para vitrine de produtos
- Paleta: preto absoluto, grafite, ônix e prata escura
- Glassmorphism sutil
- WebGL/Three.js + React Three Fiber para fundo e efeitos visuais
- GLSL shaders
- GSAP + ScrollTrigger
- Lenis
- Framer Motion
- WebGPU com fallback
- Vídeos fullscreen
- Carrinho e checkout
- Painel admin em `/admin`
- Edição de produtos, descrições, valores, fotos, vídeos, estoque e tags
- Edição de contacto, email, WhatsApp, Instagram, Pinterest, TikTok e morada
- Upload/troca de foto dos produtos pelo painel
- Upload/troca da foto principal da home pelo painel
- Logs de auditoria
- RBAC/cargos administrativos
- Rate limiting
- Cookies HttpOnly
- CSRF
- Sanitização anti-XSS
- Queries parametrizadas para banco SQL
- Sessões administrativas com expiração automática
- Headers de segurança via middleware

## WAF

O WAF/Cloudflare foi desativado/removido do projeto. O site não depende de configuração WAF para funcionar.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra:

```txt
http://localhost:3000
```

Painel admin:

```txt
http://localhost:3000/admin
```

Em desenvolvimento, caso não configure `ADMIN_USERS_JSON`, existe um usuário local simples:

```txt
email: admin@noir.local
senha: admin123
```

Não existe usuário padrão em produção.

## Configurar admin em produção

Gere o hash da senha:

```bash
node scripts/hash-password.mjs "sua-senha-forte"
```

Configure na Vercel:

```env
ADMIN_SESSION_SECRET=uma-string-aleatoria-longa
ADMIN_USERS_JSON=[{"id":"owner","email":"admin@seudominio.com","passwordHash":"HASH_GERADO","role":"super_admin","enabled":true}]
```

Cargos disponíveis:

- `super_admin`: edita tudo e vê auditoria
- `editor`: edita produtos
- `support`: acesso limitado/leitura

## MFA opcional

O login está facilitado por padrão com email e senha. Se quiser ativar MFA no futuro:

```env
ADMIN_REQUIRE_MFA=true
ADMIN_USERS_JSON=[{"id":"owner","email":"admin@seudominio.com","passwordHash":"HASH_GERADO","role":"super_admin","mfaSecret":"SUA_SECRET_BASE32","enabled":true}]
```

## Persistência das edições

Para admin persistente em produção, conecte um banco Postgres/Neon/Vercel Postgres e configure:

```env
POSTGRES_URL=sua_url_postgres
```

Sem banco, o projeto usa fallback local para desenvolvimento.

## Pagamentos

Configure:

```env
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
STRIPE_SECRET_KEY=sua_chave_secreta
```

## Deploy na Vercel

```bash
npm run build
```

Depois suba para GitHub e importe na Vercel.
