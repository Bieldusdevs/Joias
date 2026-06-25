# Aurora Joias — site completo de vendas de joias banhadas a ouro

Projeto completo com frontend e backend em Next.js, pronto para GitHub e deploy na Vercel.

## O que está incluído

- Loja de joias banhadas a ouro com tema escuro elegante
- Categorias: colares, anéis, pingentes, pulseiras e brincos
- Cards de produtos com vídeos MP4 em vez de screenshots
- Sistema de carrinho com localStorage
- Backend `/api/checkout` para criar sessão do Stripe Checkout
- Páginas de checkout concluído e cancelado
- Fundo WebGL discreto com React Three Fiber, Three.js e GLSL Shader
- Transições GSAP
- Scroll suave com Lenis
- Animações com Framer Motion
- Camada WebGPU experimental com fallback automático para WebGL
- Cursor personalizado sutil
- Efeitos leves de luz e shader
- Configuração para Vercel

## Stack

- Next.js
- React
- React Three Fiber
- Three.js
- GSAP
- Lenis
- GLSL Shaders
- Framer Motion
- WebGPU API
- Stripe
- TypeScript

## Como rodar localmente

```bash
npm install
npm run dev
```

Abra:

```txt
http://localhost:3000
```

## Como editar os produtos

Os produtos ficam em:

```txt
lib/products.ts
```

Você pode alterar:

- Nome
- Preço
- Categoria
- Descrição
- Vídeo
- Estoque
- Tags
- Tipo de banho/acabamento

Os preços estão em centavos. Exemplo: `6490` significa `64,90 €`.

## Vídeos dos produtos

Os vídeos ficam em:

```txt
public/videos
```

Arquivos usados pelo projeto:

```txt
colar-aurora.mp4
anel-solar.mp4
pingente-lua.mp4
pulseira-celeste.mp4
brinco-estrela.mp4
colar-riviera.mp4
anel-imperial.mp4
pingente-coracao.mp4
```

Para colocar vídeos reais, substitua esses arquivos mantendo os mesmos nomes.

## Configurar pagamentos com Stripe

### 1. Criar conta

Crie uma conta em:

```txt
https://stripe.com
```

### 2. Pegar a chave secreta

No painel Stripe, acesse:

```txt
Developers > API keys
```

Copie a chave secreta de teste, que começa com:

```txt
sk_test_
```

### 3. Criar `.env.local`

Na raiz do projeto:

```bash
cp .env.example .env.local
```

Depois edite o arquivo:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_SUA_CHAVE_AQUI
```

### 4. Testar uma compra

Rode:

```bash
npm run dev
```

Adicione produtos no carrinho e clique em **Finalizar compra**.

Cartão de teste Stripe:

```txt
4242 4242 4242 4242
```

Use qualquer data futura e qualquer CVC de 3 números.

### 5. Configurar na Vercel

Depois que subir para GitHub e importar na Vercel, configure as variáveis em:

```txt
Project Settings > Environment Variables
```

Variáveis:

```env
NEXT_PUBLIC_SITE_URL=https://seu-dominio.vercel.app
STRIPE_SECRET_KEY=sk_test_SUA_CHAVE_AQUI
```

Depois faça o deploy.

### 6. Ir para produção

Quando for vender de verdade:

1. Ative sua conta Stripe.
2. Troque `sk_test_` por `sk_live_`.
3. Altere `NEXT_PUBLIC_SITE_URL` para o domínio real.
4. Opcional: configure webhooks para salvar pedidos em banco de dados, controlar estoque e enviar e-mails.

## Subir para GitHub

```bash
git init
git add .
git commit -m "Site de joias banhadas a ouro"
git branch -M main
git remote add origin URL_DO_SEU_REPOSITORIO
git push -u origin main
```

## Deploy na Vercel

1. Entre em https://vercel.com
2. Clique em **Add New Project**
3. Importe o repositório do GitHub
4. Adicione as variáveis de ambiente
5. Clique em **Deploy**

## Arquivos principais

```txt
app/page.tsx                  Frontend da loja
app/api/checkout/route.ts     Backend Stripe Checkout
app/checkout/sucesso/page.tsx Página de sucesso
app/checkout/cancelado/page.tsx Página de cancelamento
app/globals.css               Visual completo
lib/products.ts               Catálogo de produtos
public/videos                 Vídeos dos produtos
```
