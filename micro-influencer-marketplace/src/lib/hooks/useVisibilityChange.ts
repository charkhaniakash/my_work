'use client';

import { useEffect } from 'react';

export function useVisibilityChange() {
  useEffect(() => {
    // This will prevent unnecessary reloads when switching tabs
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Document is visible again, but we prevent reload
        document.title = 'Micro Influencer Marketplace';
      } else {
        // Document is hidden (user switched tabs)
        document.title = 'Come back soon!';
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
} 