'use client';

import React, { ReactNode } from 'react';
import { useVisibilityChange } from '@/lib/hooks/useVisibilityChange';

interface VisibilityProviderProps {
  children: ReactNode;
}

export default function VisibilityProvider({ children }: VisibilityProviderProps) {
  useVisibilityChange();
  
  return <>{children}</>;
} 