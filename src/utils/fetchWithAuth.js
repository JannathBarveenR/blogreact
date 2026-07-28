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

export async function refreshAccessToken() {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    const accessToken = localStorage.getItem("access_token");
    if (!refreshToken) return false;

    // Helper to persist new session details
    const persistSession = (newAccess, newRefresh, userObj) => {
      localStorage.setItem("access_token", newAccess);
      if (newRefresh) localStorage.setItem("refresh_token", newRefresh);
      if (userObj) localStorage.setItem("user", JSON.stringify(userObj));
      try {
        document.cookie = `pol_session=1; path=/; max-age=2592000; SameSite=Lax`;
        document.cookie = `pol_at=${newAccess}; path=/; max-age=2592000; SameSite=Lax`;
      } catch {}
    };

    try {
      // 1. Try setSession on Supabase JS Client (auto-refreshes if access token is expired)
      if (accessToken && refreshToken) {
        const { data: setSessionData, error: setSessionErr } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!setSessionErr && setSessionData?.session?.access_token) {
          persistSession(
            setSessionData.session.access_token,
            setSessionData.session.refresh_token,
            setSessionData.session.user
          );
          return true;
        }
      }

      // 2. Fallback: Try explicit refreshSession on Supabase JS Client
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (!error && data?.session?.access_token) {
        persistSession(
          data.session.access_token,
          data.session.refresh_token,
          data.session.user
        );
        return true;
      }

      return false;
    } catch (err) {
      console.error("[fetchWithAuth] Token refresh error:", err);
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
