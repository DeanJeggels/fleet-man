"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider, keepPreviousData } from "@tanstack/react-query";

export function QueryProvider({ children }: { children: ReactNode }) {
  // Create the client once per component lifetime (not per render)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Keep data fresh for 60s — within that window, repeat navigations
            // return cached data synchronously with no refetch at all.
            staleTime: 60 * 1000,
            // Cache for 5 minutes after the last observer unmounts — gives
            // navigation a warm cache even when returning after a detour.
            gcTime: 5 * 60 * 1000,
            // Only retry transient errors once
            retry: 1,
            // Don't refetch on focus/reconnect — too noisy for a form-heavy app,
            // and remount-style refetches can wipe in-progress form state.
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            // When a query key changes (e.g. filter or page swaps), keep the
            // previous data visible while the new query resolves instead of
            // flashing a skeleton. Massively reduces perceived latency on
            // navigations and filter changes.
            placeholderData: keepPreviousData,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
