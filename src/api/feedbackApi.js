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

export async function createFeedback(content, imageFiles = []) {
  const options = { method: "POST" };

  if (imageFiles && imageFiles.length > 0) {
    const formData = new FormData();
    formData.append("content", content);
    imageFiles.forEach((file) => {
      formData.append("images", file);
    });
    options.body = formData;
  } else {
    options.body = JSON.stringify({ content });
  }

  const res = await fetchWithAuth("/api/feedback", options);
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

export async function updateFeedback(id, content, newImageFiles = [], existingImageUrls = {}) {
  const options = { method: "PUT" };

  if (newImageFiles && newImageFiles.length > 0) {
    const formData = new FormData();
    formData.append("content", content);
    formData.append("existing_image_urls", JSON.stringify(existingImageUrls || {}));
    newImageFiles.forEach((file) => {
      formData.append("images", file);
    });
    options.body = formData;
  } else {
    options.body = JSON.stringify({ content, image_urls: existingImageUrls || {} });
  }

  const res = await fetchWithAuth(`/api/feedback/${id}`, options);
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

export async function fetchFeedbackById(id) {
  const res = await fetchWithAuth(`/api/feedback/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch feedback (status ${res.status})`);
  }
  return await res.json();
}

export async function deleteFeedback(id) {
  const res = await fetchWithAuth(`/api/feedback/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || "Failed to delete feedback");
  }
  const current = getCachedFeedbacks();
  const updatedList = current.filter((item) => item.id !== id);
  setCachedFeedbacks(updatedList);
  return true;
}
