'use client'
import React from 'react';
import Link from 'next/link';

const PaymentMethodsManager = () => {
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Payment Methods</h2>
      
      <div className="p-6 border border-gray-200 rounded-md bg-gray-50">
        <p className="text-gray-700 mb-4">
          This platform uses Stripe Checkout for secure, one-time payments. You'll be redirected to 
          Stripe's secure payment page when making a payment.
        </p>
        <p className="text-gray-700 mb-4">
          Stripe accepts various payment methods including credit cards, debit cards, and other 
          local payment methods depending on your region.
        </p>
        <p className="text-sm text-gray-500">
          Your payment information is securely handled by Stripe and never stored on our servers.
        </p>
      </div>
      
      <div className="mt-4 flex justify-end">
        <Link
          href="/dashboard"
          className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-800"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default PaymentMethodsManager; 