'use client';

import { ReactNode } from 'react';

interface DashboardHeaderProps {
  heading: string;
  text?: string;
  children?: ReactNode;
}

export function DashboardHeader({ heading, text, children }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold leading-tight tracking-wide text-gray-900">
          {heading}
        </h1>
        {text && <p className="text-sm text-gray-500">{text}</p>}
      </div>
      {children}
    </div>
  );
} 