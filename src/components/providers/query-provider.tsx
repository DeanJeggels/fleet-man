"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function QueryProvider({ children }: { children: ReactNode }) {
  // Create the client once per component lifetime (not per render)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Keep data fresh for 60s — dashboards re-use within that window
            staleTime: 60 * 1000,
            // Cache for 5 minutes after the last observer unmounts
            gcTime: 5 * 60 * 1000,
            // Only retry transient errors once
            retry: 1,
            // Don't refetch on window focus by default — too noisy for form-heavy app
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
