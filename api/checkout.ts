import { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

interface CartItem {
  productId: string
  size?: string
  quantity: number
  // any price/name the client sends is deliberately ignored
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed')

  try {
    const { items }: { items: CartItem[] } = req.body
    if (!items || items.length === 0) return res.status(400).send('No items')

    // Authoritative prices come from the DB, never the browser.
    const ids = items.map(i => i.productId)
    const { data: products, error } = await supabase
      .from('store_products')
      .select('id, name, price_cents, status')
      .in('id', ids)

    if (error) return res.status(500).json({ error: error.message })
    const byId = new Map((products || []).map(p => [p.id, p]))

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
    const metaItems: { product_id: string; size: string | null; quantity: number }[] = []

    for (const item of items) {
      const p = byId.get(item.productId)
      if (!p || p.status !== 'live') {
        return res.status(400).json({ error: `Product unavailable: ${item.productId}` })
      }
      const qty = Math.max(1, Math.min(item.quantity || 1, 20))
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: item.size ? `${p.name} (${item.size})` : p.name },
          unit_amount: p.price_cents, // from DB
        },
        quantity: qty,
      })
      metaItems.push({ product_id: p.id, size: item.size || null, quantity: qty })
    }

    const baseUrl =
      process.env.PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/`,
      metadata: { items: JSON.stringify(metaItems) },
    })

    return res.status(200).json({ url: session.url, sessionId: session.id })
  } catch (err: any) {
    console.error('Checkout error:', err)
    return res.status(500).json({ error: err.message })
  }
}
