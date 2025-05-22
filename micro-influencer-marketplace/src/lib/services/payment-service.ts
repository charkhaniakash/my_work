import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

// Initialize Supabase admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Platform fee percentage (10%)
const PLATFORM_FEE_PERCENTAGE = 0.10;

export interface CreatePaymentIntentParams {
  campaignId: string;
  brandId: string;
  influencerId: string;
  amount: number;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  transactionId: string;
}

export async function createPaymentIntent({
  campaignId,
  brandId,
  influencerId,
  amount,
}: CreatePaymentIntentParams): Promise<PaymentIntentResponse> {
  try {
    // Calculate platform fee
    const platformFee = amount * PLATFORM_FEE_PERCENTAGE;
    const influencerAmount = amount - platformFee;

    // Create payment intent in Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        campaignId,
        brandId,
        influencerId,
        platformFee: platformFee.toString(),
      },
    });

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
        stripe_payment_intent_id: paymentIntent.id,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
      transactionId: transaction.id,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

export async function confirmPayment(paymentIntentId: string) {
  try {
    // Update transaction status in database
    const { error } = await supabaseAdmin
      .from('payment_transactions')
      .update({ status: 'processing' })
      .eq('stripe_payment_intent_id', paymentIntentId);

    if (error) throw error;

    // Confirm the payment intent in Stripe
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update transaction status to completed
      await supabaseAdmin
        .from('payment_transactions')
        .update({ status: 'completed' })
        .eq('stripe_payment_intent_id', paymentIntentId);

      // Create transfer to influencer
      const transaction = await supabaseAdmin
        .from('payment_transactions')
        .select('*')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();

      if (transaction.data) {
        const transfer = await stripe.transfers.create({
          amount: Math.round((transaction.data.amount - transaction.data.platform_fee) * 100),
          currency: 'usd',
          destination: transaction.data.influencer_id, // This should be the influencer's Stripe account ID
          transfer_group: transaction.data.campaign_id,
        });

        // Update transaction with transfer ID
        await supabaseAdmin
          .from('payment_transactions')
          .update({ stripe_transfer_id: transfer.id })
          .eq('stripe_payment_intent_id', paymentIntentId);
      }
    }

    return paymentIntent;
  } catch (error) {
    console.error('Error confirming payment:', error);
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

export async function addPaymentMethod(userId: string, paymentMethodId: string) {
  try {
    // Verify the payment method exists in Stripe
    await stripe.paymentMethods.retrieve(paymentMethodId);

    // Add to database
    const { data, error } = await supabaseAdmin
      .from('payment_methods')
      .insert({
        user_id: userId,
        stripe_payment_method_id: paymentMethodId,
        is_default: false, // New payment methods are not default by default
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error adding payment method:', error);
    throw error;
  }
}

export async function setDefaultPaymentMethod(userId: string, paymentMethodId: string) {
  try {
    // Update all payment methods to not be default
    await supabaseAdmin
      .from('payment_methods')
      .update({ is_default: false })
      .eq('user_id', userId);

    // Set the selected payment method as default
    const { data, error } = await supabaseAdmin
      .from('payment_methods')
      .update({ is_default: true })
      .eq('user_id', userId)
      .eq('stripe_payment_method_id', paymentMethodId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error setting default payment method:', error);
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