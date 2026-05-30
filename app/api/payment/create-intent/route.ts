/**
 * Stripe Payment Intent API
 *
 * To activate card payments:
 * 1. Run: npm install stripe
 * 2. Create .env.local and add:
 *      STRIPE_SECRET_KEY=sk_live_YOUR_KEY_HERE
 * 3. In Admin → Settings, enter your Stripe Publishable Key (pk_live_...)
 *    and toggle "Enable Card Payments" ON.
 *
 * Note: Stripe does not support VND. Amounts are converted to USD.
 * Exchange rate constant below — update as needed.
 */

import { NextRequest, NextResponse } from 'next/server';

const VND_TO_USD_RATE = 25000; // 1 USD ≈ 25,000 VND (update periodically)

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return NextResponse.json(
      {
        error: 'Card payments not yet configured.',
        detail: 'Set STRIPE_SECRET_KEY in .env.local to activate.',
      },
      { status: 503 }
    );
  }

  try {
    const { amountVnd, bookingRef, customerEmail, customerName } = await req.json();

    if (!amountVnd || amountVnd <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Dynamic require so the build doesn't fail if 'stripe' isn't installed yet
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Stripe = require('stripe');
    const stripe = new Stripe(secretKey, { apiVersion: '2024-04-10' });

    // Convert VND → USD cents (Stripe minimum: 50 cents)
    const usdCents = Math.max(50, Math.round((amountVnd / VND_TO_USD_RATE) * 100));

    const intent = await stripe.paymentIntents.create({
      amount:   usdCents,
      currency: 'usd',
      receipt_email: customerEmail ?? undefined,
      metadata: {
        bookingRef:      bookingRef ?? '',
        customerName:    customerName ?? '',
        originalAmountVnd: String(amountVnd),
        exchangeRate:    String(VND_TO_USD_RATE),
      },
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({
      clientSecret: intent.client_secret,
      amountUsd:    (usdCents / 100).toFixed(2),
      amountVnd,
    });
  } catch (err) {
    console.error('[payment/create-intent]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Payment failed' },
      { status: 500 }
    );
  }
}
