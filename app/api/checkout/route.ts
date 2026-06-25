import { NextResponse } from 'next/server'
import { products } from '@/app/lib/products'
import { stripe } from '@/app/lib/stripe'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const items = body?.items as Array<{ id: string; quantity: number; material?: string }> | undefined

  if (!items?.length) {
    return NextResponse.json({ error: 'Carrinho vazio.' }, { status: 400 })
  }

  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  if (!stripe || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({
      mode: 'demo',
      message: 'Checkout em modo demonstração. Configure STRIPE_SECRET_KEY e stripePriceId dos produtos para pagamento real.'
    })
  }

  const lineItems = items.map((item) => {
    const product = products.find((candidate) => candidate.id === item.id)
    if (!product) throw new Error(`Produto inválido: ${item.id}`)

    if (product.stripePriceId && !product.stripePriceId.startsWith('price_replace')) {
      return { price: product.stripePriceId, quantity: item.quantity }
    }

    return {
      quantity: item.quantity,
      price_data: {
        currency: 'eur',
        unit_amount: product.price * 100,
        product_data: {
          name: product.name,
          description: item.material ? `${product.description} Material: ${item.material}` : product.description,
          images: [`${origin}${product.image}`]
        }
      }
    }
  })

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    success_url: `${origin}/?success=true`,
    cancel_url: `${origin}/?canceled=true`,
    billing_address_collection: 'required',
    shipping_address_collection: { allowed_countries: ['PT', 'FR', 'IT', 'ES', 'US', 'GB'] },
    metadata: {
      brand: 'BONITA'
    }
  })

  return NextResponse.json({ url: session.url })
}
