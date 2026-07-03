import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

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
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (err: any) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      // Extract metadata
      const productId = session.metadata?.product_id;
      const size = session.metadata?.size || null;
      const quantity = parseInt(session.metadata?.quantity || '1');
      const productName = session.metadata?.product_name || 'Unknown';
      const email = session.customer_email || 'unknown@example.com';

      // Fetch product to get price
      const { data: product } = await supabase
        .from('store_products')
        .select('price_cents, printify_product_id')
        .eq('id', productId)
        .single();

      const priceCents = product?.price_cents || 0;

      // Create order in Supabase
      const { data: order, error: orderError } = await supabase
        .from('store_orders')
        .insert([
          {
            stripe_session_id: session.id,
            product_id: productId,
            product_name: productName,
            customer_email: email,
            size: size,
            quantity: quantity,
            price_cents: priceCents,
            status: 'completed',
          },
        ])
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        return res.status(500).json({ error: 'Failed to create order' });
      }

      // Send ntfy notification
      const ntfyTopic = process.env.NTFY_TOPIC || 'misfit-store-orders';
      const ntfyUrl = `https://ntfy.sh/${ntfyTopic}`;

      const notificationMessage = `
New Order: #${order.id.slice(0, 8)}
Product: ${productName}
Email: ${email}
Size: ${size || 'N/A'}
Qty: ${quantity}
Amount: $${(priceCents / 100).toFixed(2)}
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

      // Optional: Forward to Printify if API key present
      if (process.env.PRINTIFY_API_KEY && product?.printify_product_id) {
        try {
          // Create Printify order (simplified example)
          const printifyResponse = await fetch(
            'https://api.printful.com/orders',
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.PRINTIFY_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                recipient: {
                  name: email.split('@')[0],
                  email: email,
                },
                items: [
                  {
                    product_id: product.printify_product_id,
                    quantity: quantity,
                    variant_id: size, // May need mapping depending on Printify API
                  },
                ],
              }),
            }
          );

          if (printifyResponse.ok) {
            const printifyOrder = await printifyResponse.json();
            // Update order with printify_order_id
            await supabase
              .from('store_orders')
              .update({
                printify_order_id: printifyOrder.id,
                status: 'fulfilled',
              })
              .eq('id', order.id);
          }
        } catch (printifyErr) {
          console.warn('Printify integration failed (non-blocking):', printifyErr);
        }
      }

      return res.status(200).json({ received: true, orderId: order.id });
    } catch (err: any) {
      console.error('Webhook processing error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // Acknowledge other event types
  return res.status(200).json({ received: true });
}
