import { NextResponse } from "next/server";
import Stripe from "stripe";
import { findProduct } from "@/lib/products";

export const runtime = "nodejs";

type IncomingItem = {
  id: string;
  quantity: number;
};

export async function POST(request: Request) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        {
          error:
            "Pagamento ainda não configurado. Adicione STRIPE_SECRET_KEY no .env.local ou nas variáveis de ambiente da Vercel."
        },
        { status: 500 }
      );
    }

    const body = (await request.json()) as { items?: IncomingItem[] };
    const items = body.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Carrinho vazio." }, { status: 400 });
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const item of items) {
      const product = findProduct(String(item.id));
      const quantity = Math.max(1, Math.min(20, Number(item.quantity || 1)));

      if (!product) continue;

      lineItems.push({
        quantity,
        price_data: {
          currency: "eur",
          unit_amount: product.price,
          product_data: {
            name: product.name,
            description: `${product.categoryLabel} · ${product.coating}`,
            metadata: {
              productId: product.id,
              category: product.category
            }
          }
        }
      });
    }

    if (lineItems.length === 0) {
      return NextResponse.json({ error: "Nenhum produto válido no carrinho." }, { status: 400 });
    }

    const stripe = new Stripe(secretKey);

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      request.headers.get("origin") ||
      new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "pt",
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      phone_number_collection: {
        enabled: true
      },
      shipping_address_collection: {
        allowed_countries: ["PT", "ES", "FR", "DE", "IT", "BR"]
      },
      line_items: lineItems,
      success_url: `${origin}/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancelado`
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Não foi possível iniciar o checkout. Verifique a chave Stripe." },
      { status: 500 }
    );
  }
}
