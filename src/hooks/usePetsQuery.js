/**
 * usePetsQuery.js — TanStack Query hook for fetching user's pets.
 *
 * Replaces the manual localStorage + fetchWithAuth pattern in MainLayout.
 * Provides automatic caching so switching between tabs doesn't re-fetch pets.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import fetchWithAuth from "../utils/fetchWithAuth";

export const petsKeys = {
  all: (userId) => ["pets", userId],
};

/**
 * Fetch all pets for the given user. Cached for 5 minutes.
 */
export function usePets(userId) {
  return useQuery({
    queryKey: petsKeys.all(userId),
    queryFn: async () => {
      const res = await fetchWithAuth(`/api/pet-profile/by-user/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch pets");
      return res.json();
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 15 * 60 * 1000,    // 15 minutes
  });
}

/**
 * Hook to invalidate the pets cache (call after creating/editing a pet).
 */
export function useInvalidatePets() {
  const queryClient = useQueryClient();
  return (userId) => {
    queryClient.invalidateQueries({ queryKey: petsKeys.all(userId) });
  };
}
