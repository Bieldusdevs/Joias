# BONITA — Next.js Gold Jewelry E-commerce

Site premium de e-commerce de peças de ouro com identidade visual **rosa bebê + branco + dourado**, experiência cinematográfica, blur refinado e animações suaves.

## Stack

- **Next.js / React App Router**
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion** para loader, transições, cursor, modais e blur motion
- **GSAP + ScrollTrigger** para animações editoriais em scroll
- **GSAP Draggable** para intro drag-and-drop 2D do anel na mão
- **Howler.js** para som elegante de cristal
- **Stripe Checkout** via API Route
- **Sanity CMS-ready** para catálogo/editorial
- **Prisma + PostgreSQL-ready** para banco próprio, pedidos e produtos

## Alterações de identidade

- Marca renomeada para **BONITA**.
- Logo/wordmark BONITA aplicada no loader, header e footer.
- A bolinha do **i** foi transformada em um **diamante dourado**.
- Paleta alterada para rosa bebê, branco, dourado e tons suaves de pele/pó.
- Todas as joias renderizadas em 3D foram removidas da experiência visual.
- A área de produto agora usa fotografia macro de peças de ouro com zoom, blur e parallax leve.

## Entrada cinematográfica drag-and-drop

Implementada em:

```txt
app/components/IntroExperience.tsx
```

Recursos:

- Imagem ultra realista da mão em `public/assets/hand-intro.png`.
- Anel de ouro PNG/cutout em `public/assets/ring-drag.png`.
- Drag and drop 2D com **GSAP Draggable** no desktop.
- Versão mobile simplificada: toque no anel para continuar.
- Botão obrigatório **Skip intro**.
- Glow no encaixe, partículas douradas, flash, escurecimento rápido, som de cristal com **Howler.js** e transição blur + zoom para o site.
- Áudio local em `public/audio/crystal.wav`.

## Requisitos

- Node.js **22.12+** recomendado, compatível com a versão atual do Sanity Studio.

## Como rodar localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra:

```bash
http://localhost:3000
```

## Deploy na Vercel

1. Suba o projeto para GitHub/GitLab/Bitbucket.
2. Importe na Vercel.
3. Framework: **Next.js**.
4. Build command: `npm run build`.
5. Output: padrão da Vercel para Next.js.
6. Configure as variáveis de ambiente em **Project Settings > Environment Variables**.

Variáveis principais:

```env
NEXT_PUBLIC_SITE_URL=https://seu-dominio.vercel.app
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SANITY_PROJECT_ID=...
NEXT_PUBLIC_SANITY_DATASET=production
DATABASE_URL=postgresql://...
```

## Stripe

O endpoint está em:

```txt
app/api/checkout/route.ts
```

Enquanto `STRIPE_SECRET_KEY` não estiver configurada, o checkout retorna modo demonstração. Para pagamento real:

1. Crie produtos/preços no Stripe.
2. Substitua `stripePriceId` em `app/lib/products.ts` pelos IDs reais `price_...`.
3. Configure `STRIPE_SECRET_KEY` na Vercel.

## Estrutura principal

```txt
app/
  api/checkout/route.ts
  components/
    Cursor.tsx
    IntroExperience.tsx
    Loader.tsx
    LuxuryStore.tsx
  lib/
    products.ts
    sanity.ts
    stripe.ts
  types/product.ts
  globals.css
  layout.tsx
  page.tsx
public/assets/
  hero-jewelry.png
  ring.png
  necklace.png
  earrings.png
  bracelet.png
  hand-intro.png
  ring-drag.png
public/audio/
  crystal.wav
prisma/schema.prisma
sanity/product.schema.ts
```
