import { SignUp } from '@clerk/nextjs';
import React from 'react';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <SignUp 
        path="/auth/sign-up"
        routing="path"
        signInUrl="/auth/sign-in"
        redirectUrl="/auth/role-selection"
        appearance={{
          elements: {
            rootBox: "mx-auto w-full max-w-md",
            card: "rounded-lg shadow-md",
          },
        }}
      />
    </div>
  );
}