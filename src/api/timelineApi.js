/**
 * timelineApi.js — Centralized V2 API service for Paw Note / Timeline
 */
import fetchWithAuth from "../utils/fetchWithAuth";

// ─── Timeline Feed ───────────────────────────────────────────────
export async function getTimeline(petId, view = "chronological") {
  const res = await fetchWithAuth(`/api/v2/pets/${petId}/timeline?view=${view}`);
  if (!res.ok) throw new Error("Failed to fetch timeline");
  return res.json();
}

export async function getVisitGroup(petId, visitGroupId) {
  const res = await fetchWithAuth(`/api/v2/pets/${petId}/timeline/visit/${visitGroupId}`);
  if (!res.ok) throw new Error("Failed to fetch visit group");
  return res.json();
}

// ─── Medical Events ──────────────────────────────────────────────
export async function createMedicalEvent(petId, payload) {
  const res = await fetchWithAuth(`/api/v2/pets/${petId}/medical-events`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (res.status === 409) {
    const data = await res.json();
    return { duplicate: true, ...data };
  }
  if (!res.ok) throw new Error("Failed to create event");
  return res.json();
}

export async function getMedicalEvents(petId, category = null) {
  const q = category ? `?category=${category}` : "";
  const res = await fetchWithAuth(`/api/v2/pets/${petId}/medical-events${q}`);
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
}

export async function getMedicalEvent(petId, eventId) {
  const res = await fetchWithAuth(`/api/v2/pets/${petId}/medical-events/${eventId}`);
  if (!res.ok) throw new Error("Failed to fetch event");
  return res.json();
}

export async function updateMedicalEvent(petId, eventId, patch) {
  const res = await fetchWithAuth(`/api/v2/pets/${petId}/medical-events/${eventId}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to update event");
  return res.json();
}

export async function deleteMedicalEvent(petId, eventId) {
  const res = await fetchWithAuth(`/api/v2/pets/${petId}/medical-events/${eventId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete event");
  return res.json();
}

// ─── Reminders ───────────────────────────────────────────────────
export async function getReminders(petId, type = null, status = null) {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (status) params.set("status", status);
  const q = params.toString() ? `?${params}` : "";
  const res = await fetchWithAuth(`/api/v2/pets/${petId}/reminders${q}`);
  if (!res.ok) throw new Error("Failed to fetch reminders");
  return res.json();
}

export async function createReminder(petId, payload) {
  const res = await fetchWithAuth(`/api/v2/pets/${petId}/reminders`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create reminder");
  return res.json();
}

export async function completeReminder(petId, reminderId) {
  const res = await fetchWithAuth(`/api/v2/pets/${petId}/reminders/${reminderId}/complete`, {
    method: "PUT",
  });
  if (!res.ok) throw new Error("Failed to complete reminder");
  return res.json();
}

export async function snoozeReminder(petId, reminderId, newDate) {
  const res = await fetchWithAuth(`/api/v2/pets/${petId}/reminders/${reminderId}/snooze`, {
    method: "PUT",
    body: JSON.stringify({ new_date: newDate }),
  });
  if (!res.ok) throw new Error("Failed to snooze reminder");
  return res.json();
}

export async function deleteReminder(petId, reminderId) {
  const res = await fetchWithAuth(`/api/v2/pets/${petId}/reminders/${reminderId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete reminder");
  return res.json();
}

// ─── Documents ───────────────────────────────────────────────────
export async function uploadDocument(petId, file, label, eventId = null) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("label", label);
  if (eventId) formData.append("event_id", eventId);

  const res = await fetchWithAuth(`/api/v2/pets/${petId}/documents`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload document");
  return res.json();
}

export async function getDocuments(petId, eventId = null) {
  const q = eventId ? `?event_id=${eventId}` : "";
  const res = await fetchWithAuth(`/api/v2/pets/${petId}/documents${q}`);
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
}

export async function deleteDocument(petId, docId) {
  const res = await fetchWithAuth(`/api/v2/pets/${petId}/documents/${docId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete document");
  return res.json();
}

// ─── Reference Data ──────────────────────────────────────────────
export async function getVaccines(animalType = null) {
  const q = animalType ? `?animal_type=${animalType}` : "";
  const res = await fetchWithAuth(`/api/v2/reference/vaccines${q}`);
  if (!res.ok) throw new Error("Failed to fetch vaccines");
  return res.json();
}

export async function searchMedicines(query = "", type = null, limit = 20) {
  const params = new URLSearchParams({ q: query, limit });
  if (type) params.set("type", type);
  const res = await fetchWithAuth(`/api/v2/reference/medicines?${params}`);
  if (!res.ok) throw new Error("Failed to fetch medicines");
  return res.json();
}

export async function getShampoos(category = null) {
  const q = category ? `?category=${category}` : "";
  const res = await fetchWithAuth(`/api/v2/reference/shampoos${q}`);
  if (!res.ok) throw new Error("Failed to fetch shampoos");
  return res.json();
}

export async function searchClinics(query = "", limit = 20) {
  const res = await fetchWithAuth(`/api/v2/reference/clinics?q=${query}&limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch clinics");
  return res.json();
}

export async function createClinic(name, address, phone) {
  const res = await fetchWithAuth(`/api/v2/reference/clinics`, {
    method: "POST",
    body: JSON.stringify({ name, address, phone }),
  });
  if (!res.ok) throw new Error("Failed to create clinic");
  return res.json();
}

// ─── Export ──────────────────────────────────────────────────────
export async function exportHistory(petId, format = "pdf") {
  const res = await fetchWithAuth(`/api/v2/pets/${petId}/export/${format}`);
  if (!res.ok) throw new Error("Failed to export");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pet_${petId}_history.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}
