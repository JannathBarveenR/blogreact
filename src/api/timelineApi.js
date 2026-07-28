/**
 * timelineApi.js — Centralized V2 API service for Pet's Note / Timeline
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

export async function updateReminder(petId, reminderId, patch) {
  const res = await fetchWithAuth(`/api/v2/pets/${petId}/reminders/${reminderId}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to update reminder");
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

export async function markReminderMissed(petId, reminderId) {
  const res = await fetchWithAuth(
    `/api/v2/pets/${petId}/reminders/${reminderId}/mark-missed`,
    { method: "PUT" }
  );
  if (!res.ok) throw new Error("Failed to mark reminder as missed");
  return res.json();
}

/**
 * Generate one reminder per dose-slot per day for a medication course.
 * @param {string} petId
 * @param {{ medication_name, frequency, start_date, duration_days, dose_labels?, linked_event_id?, notes? }} payload
 */
export async function generateDoseSchedule(petId, payload) {
  const res = await fetchWithAuth(
    `/api/v2/pets/${petId}/reminders/generate-dose-schedule`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) throw new Error("Failed to generate dose schedule");
  return res.json();
}

// ─── Records (unified — replaces old Documents section) ──────────
//
// Two upload paths, matching the two backend endpoints:
//   uploadEventRecord  → POST /api/v2/pets/{petId}/medical-events/{eventId}/records  (log=1)
//   uploadRawRecord    → POST /api/v2/pets/{petId}/records                            (log=0)
//
// Read / management work across both types via a single records endpoint.

/**
 * Upload a file attached to a specific timeline log entry (log=1).
 * Called by all 5 timeline forms after createMedicalEvent() returns an event.id.
 *
 * @param {string} petId
 * @param {string} eventId  — the medical_events row this file belongs to
 * @param {File}   file
 * @param {string} label    — e.g. "Vet Prescription / Report"
 * @param {string} [category="Other"]
 */
export async function uploadEventRecord(petId, eventId, file, label, category = "Other") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("label", label);
  formData.append("category", category);
  const res = await fetchWithAuth(
    `/api/v2/pets/${petId}/medical-events/${eventId}/records`,
    { method: "POST", body: formData }
  );
  if (!res.ok) throw new Error("Failed to upload event record");
  return res.json(); // { record: { id, log:1, event_id, label, file_url, ... } }
}

/**
 * Upload a standalone medical document from the Medical Records tab (log=0).
 *
 * @param {string}   petId
 * @param {FormData} formData  — must include: file, title, category, notes (opt)
 */
export async function uploadRawRecord(petId, formData) {
  const res = await fetchWithAuth(`/api/v2/pets/${petId}/records`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload record");
  return res.json(); // { record: { id, log:0, title, category, notes, file_url, ... } }
}

/**
 * List records for a pet.
 *
 * @param {string}      petId
 * @param {object}      [opts]
 * @param {0|1|undefined} [opts.log]     — filter by type; omit for all
 * @param {string}      [opts.eventId]  — filter by a specific event
 */
export async function getRecords(petId, { log, eventId } = {}) {
  const params = new URLSearchParams();
  if (log !== undefined) params.set("log", log);
  if (eventId) params.set("event_id", eventId);
  const q = params.toString() ? `?${params}` : "";
  const res = await fetchWithAuth(`/api/v2/pets/${petId}/records${q}`);
  if (!res.ok) throw new Error("Failed to fetch records");
  return res.json(); // Array of record objects (file_url freshly re-signed by backend)
}

/**
 * Fetch a single record with a fresh presigned file_url.
 */
export async function getRecord(petId, recordId) {
  const res = await fetchWithAuth(`/api/v2/pets/${petId}/records/${recordId}`);
  if (!res.ok) throw new Error("Failed to fetch record");
  return res.json();
}

/**
 * Delete a record (removes S3 object + DB row).
 * If log=1, also removes the record ID from medical_events.document_ids.
 */
export async function deleteRecord(petId, recordId) {
  const res = await fetchWithAuth(`/api/v2/pets/${petId}/records/${recordId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete record");
  return res.json(); // { deleted: true }
}

/**
 * Toggle is_favorite on a record (mainly used for log=0 raw records).
 */
export async function toggleRecordFavorite(petId, recordId) {
  const res = await fetchWithAuth(
    `/api/v2/pets/${petId}/records/${recordId}/favorite`,
    { method: "PATCH" }
  );
  if (!res.ok) throw new Error("Failed to toggle favorite");
  return res.json(); // { is_favorite: bool, record: {...} }
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
