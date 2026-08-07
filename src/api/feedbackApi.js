import fetchWithAuth from "../utils/fetchWithAuth";

const CACHE_KEY = "pol_user_feedbacks";

export function getCachedFeedbacks() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("[feedbackApi] Error reading cache:", err);
    return [];
  }
}

export function setCachedFeedbacks(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("[feedbackApi] Error writing cache:", err);
  }
}

export async function fetchFeedbacks() {
  try {
    const res = await fetchWithAuth("/api/feedback");
    if (!res.ok) {
      throw new Error(`Failed to fetch feedback (status ${res.status})`);
    }
    const data = await res.json();
    if (Array.isArray(data)) {
      setCachedFeedbacks(data);
    }
    return data;
  } catch (err) {
    console.warn("[feedbackApi] API fetch failed, falling back to cache:", err);
    return getCachedFeedbacks();
  }
}

export async function createFeedback(content) {
  const res = await fetchWithAuth("/api/feedback", {
    method: "POST",
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || "Failed to submit feedback");
  }
  const newFeedback = await res.json();
  const current = getCachedFeedbacks();
  const updatedList = [newFeedback, ...current];
  setCachedFeedbacks(updatedList);
  return newFeedback;
}

export async function updateFeedback(id, content) {
  const res = await fetchWithAuth(`/api/feedback/${id}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || "Failed to update feedback");
  }
  const updated = await res.json();
  const current = getCachedFeedbacks();
  const updatedList = current.map((item) => (item.id === id ? updated : item));
  setCachedFeedbacks(updatedList);
  return updated;
}
