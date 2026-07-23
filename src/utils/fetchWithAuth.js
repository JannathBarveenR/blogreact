/**
 * fetchWithAuth — Utility for making authenticated API requests.
 *
 * Automatically attaches the Bearer token from localStorage.
 * On 401, attempts a token refresh via Supabase before redirecting to login.
 * This prevents the "1 hour auto-logout" issue.
 */
import { supabase } from "./supabaseClient";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

// Prevent multiple simultaneous refresh attempts
let _refreshPromise = null;

async function refreshAccessToken() {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return false;

    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data?.session) return false;

      localStorage.setItem("access_token", data.session.access_token);
      if (data.session.refresh_token) {
        localStorage.setItem("refresh_token", data.session.refresh_token);
      }
      if (data.session.user) {
        localStorage.setItem("user", JSON.stringify(data.session.user));
      }
      return true;
    } catch {
      return false;
    }
  })();

  try {
    return await _refreshPromise;
  } finally {
    _refreshPromise = null;
  }
}

export default async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem("access_token");
  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;

  let res = await fetch(url, { ...options, headers });

  // If 401, try refreshing the token and retrying ONCE
  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry the original request with the new token
      const newToken = localStorage.getItem("access_token");
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(url, { ...options, headers });
    }

    // If still 401 after refresh, give up and redirect to login
    if (res.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
  }

  return res;
}
