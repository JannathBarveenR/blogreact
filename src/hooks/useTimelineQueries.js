/**
 * useTimelineQueries.js — TanStack Query hooks for timeline API.
 *
 * These hooks replace raw useEffect+fetch patterns. Benefits:
 * - Automatic caching: navigating away and back re-uses cached data instantly.
 * - Background refetching: stale data is silently refreshed.
 * - Mutation invalidation: after creating/updating/deleting, related caches
 *   are invalidated so the UI always shows fresh data.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/timelineApi";

// ─── Query Key Factory ────────────────────────────────────────────
// Structured keys allow targeted cache invalidation.
export const timelineKeys = {
  all: (petId) => ["timeline", petId],
  feed: (petId, view) => ["timeline", petId, "feed", view],
  events: (petId, category) => ["timeline", petId, "events", category ?? "all"],
  event: (petId, eventId) => ["timeline", petId, "event", eventId],
  reminders: (petId, type, status) => ["timeline", petId, "reminders", type, status],
  documents: (petId, eventId) => ["timeline", petId, "documents", eventId ?? "all"],
  vaccines: (animalType) => ["reference", "vaccines", animalType ?? "all"],
  medicines: (query, type) => ["reference", "medicines", query, type],
  shampoos: (category) => ["reference", "shampoos", category ?? "all"],
  clinics: (query) => ["reference", "clinics", query],
};

// ─── Timeline Feed ────────────────────────────────────────────────
export function useTimeline(petId, view = "chronological") {
  return useQuery({
    queryKey: timelineKeys.feed(petId, view),
    queryFn: () => api.getTimeline(petId, view),
    enabled: !!petId,
  });
}

// ─── Medical Events ───────────────────────────────────────────────
export function useMedicalEvents(petId, category = null) {
  return useQuery({
    queryKey: timelineKeys.events(petId, category),
    queryFn: () => api.getMedicalEvents(petId, category),
    enabled: !!petId,
  });
}

export function useMedicalEvent(petId, eventId) {
  return useQuery({
    queryKey: timelineKeys.event(petId, eventId),
    queryFn: () => api.getMedicalEvent(petId, eventId),
    enabled: !!petId && !!eventId,
  });
}

export function useCreateMedicalEvent(petId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.createMedicalEvent(petId, payload),
    onSuccess: () => {
      // Invalidate all timeline data for this pet so the feed refreshes
      queryClient.invalidateQueries({ queryKey: timelineKeys.all(petId) });
    },
  });
}

export function useUpdateMedicalEvent(petId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, patch }) => api.updateMedicalEvent(petId, eventId, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timelineKeys.all(petId) });
    },
  });
}

export function useDeleteMedicalEvent(petId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId) => api.deleteMedicalEvent(petId, eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timelineKeys.all(petId) });
    },
  });
}

// ─── Reminders ────────────────────────────────────────────────────
export function useReminders(petId, type = null, status = null) {
  return useQuery({
    queryKey: timelineKeys.reminders(petId, type, status),
    queryFn: () => api.getReminders(petId, type, status),
    enabled: !!petId,
  });
}

export function useCreateReminder(petId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.createReminder(petId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timelineKeys.all(petId) });
    },
  });
}

export function useCompleteReminder(petId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reminderId) => api.completeReminder(petId, reminderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timelineKeys.all(petId) });
    },
  });
}

export function useSnoozeReminder(petId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reminderId, newDate }) => api.snoozeReminder(petId, reminderId, newDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timelineKeys.all(petId) });
    },
  });
}

export function useDeleteReminder(petId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reminderId) => api.deleteReminder(petId, reminderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timelineKeys.all(petId) });
    },
  });
}

// ─── Documents ────────────────────────────────────────────────────
export function useDocuments(petId, eventId = null) {
  return useQuery({
    queryKey: timelineKeys.documents(petId, eventId),
    queryFn: () => api.getDocuments(petId, eventId),
    enabled: !!petId,
  });
}

export function useUploadDocument(petId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, label, eventId }) => api.uploadDocument(petId, file, label, eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timelineKeys.all(petId) });
    },
  });
}

export function useDeleteDocument(petId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (docId) => api.deleteDocument(petId, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timelineKeys.all(petId) });
    },
  });
}

// ─── Reference Data (long cache — rarely changes) ─────────────────
export function useVaccines(animalType = null) {
  return useQuery({
    queryKey: timelineKeys.vaccines(animalType),
    queryFn: () => api.getVaccines(animalType),
    staleTime: 30 * 60 * 1000, // 30 minutes — vaccine lists rarely change
    gcTime: 60 * 60 * 1000,    // 1 hour
  });
}

export function useMedicines(query = "", type = null) {
  return useQuery({
    queryKey: timelineKeys.medicines(query, type),
    queryFn: () => api.searchMedicines(query, type),
    enabled: query.length >= 2, // Only search after 2 characters typed
    staleTime: 5 * 60 * 1000,  // 5 minutes
  });
}

export function useShampoos(category = null) {
  return useQuery({
    queryKey: timelineKeys.shampoos(category),
    queryFn: () => api.getShampoos(category),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

export function useClinics(query = "") {
  return useQuery({
    queryKey: timelineKeys.clinics(query),
    queryFn: () => api.searchClinics(query),
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateClinic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, address, phone }) => api.createClinic(name, address, phone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reference", "clinics"] });
    },
  });
}
