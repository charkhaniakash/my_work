import { SignIn } from "@clerk/nextjs";
import React from 'react';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <SignIn
        path="/auth/sign-in"
        routing="path"
        signUpUrl="/auth/sign-up"
        redirectUrl="/dashboard"
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