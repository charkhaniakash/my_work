'use client';

import Link from 'next/link';

export default function PaymentCancelPage() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-8 h-8 text-red-600"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Payment Canceled</h2>
        <p className="text-gray-600 mb-6">
          Your payment has been canceled. No charges were made.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Return to Dashboard
          </Link>
          <Link
            href="/campaigns"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Browse Campaigns
          </Link>
        </div>
      </div>
    </div>
  );
} 