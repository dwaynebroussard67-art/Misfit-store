import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Stripe needs the raw request body to verify the signature; Vercel's
// default body parser would JSON-parse it first and break verification.
export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface OrderItem {
  product_id: string;
  size: string | null;
  quantity: number;
}

async function buffer(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return res.status(400).json({ error: 'Missing webhook signature or secret' });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      webhookSecret
    );
  } catch (err: any) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type !== 'checkout.session.completed') {
    // Acknowledge other event types
    return res.status(200).json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  try {
    const items: OrderItem[] = JSON.parse(session.metadata?.items || '[]');
    const email = session.customer_email || session.customer_details?.email || 'unknown@example.com';

    if (items.length === 0) {
      console.error('Webhook: checkout.session.completed with no items in metadata', session.id);
      return res.status(200).json({ received: true, skipped: 'no items' });
    }

    // Order header. stripe_session_id is UNIQUE, so a Stripe retry that
    // re-delivers this event hits a conflict here instead of double-billing
    // the order — treat that as "already processed" and stop.
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        stripe_session_id: session.id,
        customer_email: email,
        customer_phone: session.customer_details?.phone || null,
        shipping_name: session.customer_details?.name || null,
        shipping_address: session.customer_details?.address || null,
        amount_total_cents: session.amount_total ?? 0,
        status: 'paid',
      })
      .select()
      .single();

    if (orderError) {
      if (orderError.code === '23505') {
        // Unique violation on stripe_session_id: already processed.
        return res.status(200).json({ received: true, duplicate: true });
      }
      console.error('Error creating order header:', orderError);
      return res.status(500).json({ error: 'Failed to create order' });
    }

    // Line items: look up current product names/prices from the DB (never
    // trust metadata for money), then write one store_orders row per item.
    const productIds = items.map((i) => i.product_id);
    const { data: products, error: productsError } = await supabase
      .from('store_products')
      .select('id, name, price_cents')
      .in('id', productIds);

    if (productsError) {
      console.error('Error fetching products for order:', productsError);
      return res.status(500).json({ error: 'Failed to load order line items' });
    }

    const byId = new Map((products || []).map((p) => [p.id, p]));

    const lineItemRows = items.map((item) => {
      const product = byId.get(item.product_id);
      return {
        order_id: order.id,
        product_id: item.product_id,
        product_name: product?.name || 'Unknown',
        customer_email: email,
        size: item.size,
        quantity: item.quantity,
        price_cents: product?.price_cents ?? 0,
        status: 'completed',
      };
    });

    const { error: lineItemsError } = await supabase
      .from('store_orders')
      .insert(lineItemRows);

    if (lineItemsError) {
      console.error('Error creating order line items:', lineItemsError);
      return res.status(500).json({ error: 'Failed to create order line items' });
    }

    // Send ntfy notification
    const ntfyTopic = process.env.NTFY_TOPIC || 'misfit-store-orders';
    const ntfyUrl = `https://ntfy.sh/${ntfyTopic}`;

    const itemLines = lineItemRows
      .map((row) => `- ${row.product_name}${row.size ? ` (${row.size})` : ''} x${row.quantity}`)
      .join('\n');

    const notificationMessage = `
New Order: #${order.id.slice(0, 8)}
Email: ${email}
Total: $${((session.amount_total ?? 0) / 100).toFixed(2)}
${itemLines}
    `.trim();

    try {
      await fetch(ntfyUrl, {
        method: 'POST',
        headers: { 'Title': `MISFIT Store Order` },
        body: notificationMessage,
      });
    } catch (ntfyErr) {
      console.warn('ntfy notification failed (non-blocking):', ntfyErr);
    }

    // TODO: Printify fulfillment and tithe-ledger writes are not implemented
    // yet. They need: PRINTIFY_SHOP_ID, a confirmed PRINTIFY_API_KEY, and a
    // populated store_variants table (product_id + size -> Printify variant
    // id) before an order can be forwarded automatically. See
    // HANDOFF-STRIPE.md for the open questions on this.

    return res.status(200).json({ received: true, orderId: order.id });
  } catch (err: any) {
    console.error('Webhook processing error:', err);
    return res.status(500).json({ error: err.message });
  }
}
