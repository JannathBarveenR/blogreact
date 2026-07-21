/**
 * queryClient.js — TanStack React Query global configuration.
 *
 * This provides intelligent caching for all API calls:
 * - Data is cached in the browser and reused across page navigations.
 * - Stale data is automatically refreshed in the background.
 * - Failed requests are retried automatically.
 * - When a user performs a mutation (create/update/delete), related
 *   cached queries are invalidated so fresh data is fetched.
 */
import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered "fresh" for 2 minutes.
      // During this window, navigating between tabs re-uses cached data
      // without hitting the server at all.
      staleTime: 2 * 60 * 1000,

      // Cached data is garbage-collected after 10 minutes of inactivity.
      gcTime: 10 * 60 * 1000,

      // Retry failed requests once (helps with flaky mobile connections).
      retry: 1,

      // Don't refetch when window regains focus (saves server load).
      refetchOnWindowFocus: false,
    },
  },
});

export default queryClient;
