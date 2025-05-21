// lib/useHydratedState.ts
"use client";

import { useState, useEffect } from 'react';

/**
 * A hook to help with hydration mismatches, particularly for things like dates
 * that might be different between server and client.
 */
export function useHydratedState<T>(initialServerValue: T, clientValueFn: () => T): T {
  const [value, setValue] = useState<T>(initialServerValue);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    setValue(clientValueFn());
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return isHydrated ? value : initialServerValue;
}

/**
 * A higher-order component that wraps dynamic content that might
 * differ between server and client.
 */
export function HydratedDiv({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div suppressHydrationWarning {...props}>
      {children}
    </div>
  );
}
