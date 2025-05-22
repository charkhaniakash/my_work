import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentFormProps {
  campaignId: string;
  brandId: string;
  influencerId: string;
  amount: number;
  onSuccess?: () => void;
}

const PaymentFormInner: React.FC<PaymentFormProps> = ({
  campaignId,
  brandId,
  influencerId,
  amount,
  onSuccess,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Create payment intent
      const res = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, brandId, influencerId, amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create payment intent');

      // 2. Confirm card payment
      if (!stripe || !elements) throw new Error('Stripe not loaded');
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { paymentIntent, error: stripeError } = await stripe.confirmCardPayment(
        data.clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (stripeError) throw new Error(stripeError.message);
      if (paymentIntent?.status !== 'succeeded') throw new Error('Payment not successful');

      // 3. Confirm payment in backend
      const confirmRes = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId: data.paymentIntentId }),
      });
      const confirmData = await confirmRes.json();
      if (!confirmRes.ok) throw new Error(confirmData.error || 'Failed to confirm payment');

      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return <div className="text-green-600 font-semibold">Payment successful!</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <div>
        <label className="block mb-1 font-medium">Card Details</label>
        <div className="border rounded p-2">
          <CardElement options={{ hidePostalCode: true }} />
        </div>
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
      {error && <div className="text-red-600">{error}</div>}
    </form>
  );
};

const PaymentForm: React.FC<PaymentFormProps> = (props) => (
  <Elements stripe={stripePromise}>
    <PaymentFormInner {...props} />
  </Elements>
);

export default PaymentForm;
