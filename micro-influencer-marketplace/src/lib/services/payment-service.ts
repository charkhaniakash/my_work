import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

// Initialize Supabase admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Platform fee percentage (10%)
const PLATFORM_FEE_PERCENTAGE = 0.10;

export interface CreateCheckoutSessionParams {
  campaignId: string;
  brandId: string;
  influencerId: string;
  amount: number;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  checkoutUrl: string;
}

export async function createCheckoutSession({
  campaignId,
  brandId,
  influencerId,
  amount,
  successUrl,
  cancelUrl,
}: CreateCheckoutSessionParams): Promise<CheckoutSessionResponse> {
  try {
    console.log('Stripe API Key exists:', !!process.env.STRIPE_SECRET_KEY);
    
    // Calculate platform fee
    const platformFee = amount * PLATFORM_FEE_PERCENTAGE;
    
    // Create checkout session in Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Campaign Payment',
              description: `Payment for campaign ID: ${campaignId}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        campaignId,
        brandId,
        influencerId,
        platformFee: platformFee.toString(),
      },
    });

    console.log('Stripe session created successfully:', session.id);

    try {
      // Create transaction record in database
      const { data: transaction, error } = await supabaseAdmin
        .from('payment_transactions')
        .insert({
          campaign_id: campaignId,
          brand_id: brandId,
          influencer_id: influencerId,
          amount,
          platform_fee: platformFee,
          status: 'pending',
          stripe_payment_intent_id: session.payment_intent || session.id, // Use session ID as fallback
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        // Don't throw here - still return the session even if DB insert fails
      } else {
        console.log('Database transaction created:', transaction.id);
      }
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      // Still return the session even if database operation fails
    }

    return {
      sessionId: session.id,
      checkoutUrl: session.url!,
    };
  } catch (error) {
    console.error('Stripe checkout session creation error:', error);
    throw error;
  }
}

// Webhook handler for Stripe events
export async function handleStripeWebhook(event: any) {
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        // Update transaction status in database
        await supabaseAdmin
          .from('payment_transactions')
          .update({ status: 'completed' })
          .eq('stripe_payment_intent_id', session.payment_intent || session.id);
        
        // Handle platform fee transfer logic here if needed
        break;
        
      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object;
        // Update transaction status to failed
        await supabaseAdmin
          .from('payment_transactions')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', failedPaymentIntent.id);
        break;
    }
  } catch (error) {
    console.error('Error handling webhook:', error);
    throw error;
  }
}

export async function getPaymentMethods(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('payment_methods')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    // Fetch payment method details from Stripe
    const paymentMethods = await Promise.all(
      data.map(async (method) => {
        const stripeMethod = await stripe.paymentMethods.retrieve(
          method.stripe_payment_method_id
        );
        return {
          ...method,
          details: stripeMethod,
        };
      })
    );

    return paymentMethods;
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    throw error;
  }
}

export async function getTransactionHistory(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('payment_transactions')
      .select(`
        *,
        campaign:campaigns(title),
        brand:brand_id(full_name),
        influencer:influencer_id(full_name)
      `)
      .or(`brand_id.eq.${userId},influencer_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    throw error;
  }
} 