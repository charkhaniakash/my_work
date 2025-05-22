'use client'
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { CreditCard, Check, Trash, Plus } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// This will be used inside Elements provider
const PaymentMethodsManagerInner = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [addingNewMethod, setAddingNewMethod] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch payment methods on component mount
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/payments/methods');
      if (!res.ok) {
        throw new Error('Failed to fetch payment methods');
      }
      const data = await res.json();
      setPaymentMethods(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const addPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      setError('Stripe not loaded');
      return;
    }

    try {
      setAdding(true);
      setError(null);
      
      // Create payment method using card details
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }
      
      const { paymentMethod, error: stripeError } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });
      
      if (stripeError) {
        throw new Error(stripeError.message);
      }
      
      if (!paymentMethod) {
        throw new Error('Failed to create payment method');
      }
      
      // Save payment method to backend
      const res = await fetch('/api/payments/methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId: paymentMethod.id }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save payment method');
      }
      
      // Reset form and refresh payment methods
      setSuccess('Payment method added successfully');
      setAddingNewMethod(false);
      cardElement.clear();
      fetchPaymentMethods();
    } catch (err: any) {
      setError(err.message || 'Failed to add payment method');
    } finally {
      setAdding(false);
    }
  };

  const setDefaultMethod = async (paymentMethodId: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/payments/methods/default', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to set default payment method');
      }
      
      setSuccess('Default payment method updated');
      fetchPaymentMethods();
    } catch (err: any) {
      setError(err.message || 'Failed to set default payment method');
    } finally {
      setLoading(false);
    }
  };

  const formatCardDetails = (method: any) => {
    const card = method.details?.card;
    if (!card) return 'Card';
    return `${card.brand.charAt(0).toUpperCase() + card.brand.slice(1)} •••• ${card.last4}`;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Payment Methods</h2>
      
      {/* Success/Error messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-3 mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 rounded-md p-3 mb-4">
          {success}
        </div>
      )}
      
      {/* Payment methods list */}
      {loading ? (
        <div className="text-gray-500">Loading payment methods...</div>
      ) : (
        <div className="space-y-3 mb-6">
          {paymentMethods.length === 0 && !addingNewMethod ? (
            <div className="text-gray-500">No payment methods found.</div>
          ) : (
            paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`flex items-center justify-between border rounded-md p-3 ${
                  method.is_default ? 'border-blue-500 bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <CreditCard className="text-gray-600" />
                  <div>
                    <div className="font-medium">{formatCardDetails(method)}</div>
                    <div className="text-sm text-gray-500">
                      Expires: {method.details?.card?.exp_month}/{method.details?.card?.exp_year}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {method.is_default ? (
                    <span className="flex items-center text-sm text-blue-600">
                      <Check size={16} className="mr-1" /> Default
                    </span>
                  ) : (
                    <button
                      onClick={() => setDefaultMethod(method.stripe_payment_method_id)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                      disabled={loading}
                    >
                      Set as default
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Add new payment method */}
      {!addingNewMethod ? (
        <button
          onClick={() => setAddingNewMethod(true)}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <Plus size={16} className="mr-1" /> Add Payment Method
        </button>
      ) : (
        <div className="mt-6 border rounded-md p-4">
          <h3 className="text-lg font-medium mb-3">Add New Payment Method</h3>
          <form onSubmit={addPaymentMethod} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Card Information</label>
              <div className="border rounded-md p-3">
                <CardElement 
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                      invalid: {
                        color: '#9e2146',
                      },
                    },
                  }}
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm disabled:opacity-50"
                disabled={adding || !stripe}
              >
                {adding ? 'Adding...' : 'Add Card'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddingNewMethod(false);
                  setError(null);
                }}
                className="text-gray-600 px-3 py-2 border rounded-md text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// Wrapper component with Stripe Elements provider
const PaymentMethodsManager = () => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentMethodsManagerInner />
    </Elements>
  );
};

export default PaymentMethodsManager; 