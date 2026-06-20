import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevents aggressive background refreshes on tab refocus
      retry: 1, // Retry failed queries once before throwing
      staleTime: 5 * 60 * 1000, // Stale time of 5 minutes
    },
  },
});
