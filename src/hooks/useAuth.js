/**
 * useAuth — Custom authentication hook for session management.
 *
 * ARCHITECTURE:
 * - Session validation happens ONCE at the app level (ProtectedRoute).
 * - Child components (MainLayout, HeroSection, etc.) call useAuth() but
 *   only read cached state — they do NOT re-validate against the server.
 * - Token refresh is handled automatically via Supabase's onAuthStateChange
 *   listener, which fires when the token is about to expire.
 *
 * This eliminates redundant /api/auth/me calls (was 3-4 per page load, now 1).
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import { refreshAccessToken } from "../utils/fetchWithAuth";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

// ── Module-level shared state ────────────────────────────────────────────────
let _validationPromise = null;
let _lastValidatedAt = 0;
const VALIDATION_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cache for validation

// Cookie Helpers
function setAuthCookies(accessToken, refreshToken) {
  try {
    document.cookie = `pol_session=1; path=/; max-age=2592000; SameSite=Lax`;
    if (accessToken) document.cookie = `pol_at=${accessToken}; path=/; max-age=2592000; SameSite=Lax`;
  } catch {}
}

function clearAuthCookies() {
  try {
    document.cookie = "pol_session=; path=/; max-age=0;";
    document.cookie = "pol_at=; path=/; max-age=0;";
  } catch {}
}

export default function useAuth() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem("access_token") || null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!(localStorage.getItem("access_token") || document.cookie.includes("pol_session=1"));
  });
  const [loading, setLoading] = useState(true);
  const authListenerSetup = useRef(false);

  /**
   * Store tokens and user data after a successful login/signup.
   */
  const login = useCallback((accessToken, refreshToken, userData) => {
    localStorage.setItem("access_token", accessToken);
    if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
    if (userData) localStorage.setItem("user", JSON.stringify(userData));
    setAuthCookies(accessToken, refreshToken);

    if (accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).catch(() => {});
    }

    setToken(accessToken);
    setUser(userData);
    setIsAuthenticated(true);
  }, []);

  /**
   * Clear all session data and redirect to /login.
   */
  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    clearAuthCookies();
    const userId = user?.id;
    if (userId) {
      localStorage.removeItem(`pets_${userId}`);
      localStorage.removeItem(`active_pet_id_${userId}`);
    }
    _lastValidatedAt = 0;
    _validationPromise = null;
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    navigate("/login", { replace: true });
  }, [navigate, user?.id]);

  /**
   * Validate the stored token against the backend.
   * Uses a module-level deduplication so multiple useAuth() instances
   * don't fire parallel /api/auth/me requests.
   */
  const validateSession = useCallback(async () => {
    const storedToken = localStorage.getItem("access_token");
    const storedRefresh = localStorage.getItem("refresh_token");

    if (!storedToken) {
      setIsAuthenticated(false);
      setLoading(false);
      return false;
    }

    // Sync session with Supabase client to enable background auto-refresh
    if (storedToken && storedRefresh) {
      supabase.auth.setSession({ access_token: storedToken, refresh_token: storedRefresh }).catch(() => {});
    }

    // If we validated recently, skip the server call entirely
    if (Date.now() - _lastValidatedAt < VALIDATION_COOLDOWN_MS) {
      setIsAuthenticated(true);
      setLoading(false);
      return true;
    }

    // If another component already started validation, piggyback on it
    if (_validationPromise) {
      const result = await _validationPromise;
      setIsAuthenticated(result);
      setLoading(false);
      return result;
    }

    // We are the first — do the actual validation
    _validationPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (!res.ok) throw new Error("Invalid token");
        const userData = await res.json();
        setUser((prev) => prev ? { ...prev, ...userData } : userData);
        setAuthCookies(storedToken, storedRefresh);
        _lastValidatedAt = Date.now();
        return true;
      } catch {
        // Token is invalid — try refreshing before giving up
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          _lastValidatedAt = Date.now();
          return true;
        }
        // Refresh also failed — clear everything
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        clearAuthCookies();
        setToken(null);
        setUser(null);
        return false;
      }
    })();

    try {
      const result = await _validationPromise;
      setIsAuthenticated(result);
      setLoading(false);
      return result;
    } finally {
      _validationPromise = null;
    }
  }, []);

  /**
   * Attempt to refresh the access token using the stored refresh token.
   * This is what prevents the 1-hour auto-logout.
   */
  const tryRefreshToken = async () => {
    try {
      const success = await refreshAccessToken();
      if (success) {
        const newToken = localStorage.getItem("access_token");
        const storedUser = localStorage.getItem("user");
        if (newToken) setToken(newToken);
        if (storedUser) {
          try { setUser(JSON.parse(storedUser)); } catch {}
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error("[useAuth] Refresh failed:", err);
      return false;
    }
  };

  // ── Setup: Validate on mount + listen for Supabase auth changes ──────────
  useEffect(() => {
    // Parse OAuth hash fragment if present (e.g., from Google Login)
    const hash = window.location.hash;
    if (hash && hash.includes("access_token=")) {
      const params = new URLSearchParams(hash.replace("#", "?"));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      if (accessToken) {
        localStorage.setItem("access_token", accessToken);
        if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }

    validateSession();

    // Listen for Supabase auth state changes (automatic token refresh)
    let subscription = null;
    if (!authListenerSetup.current) {
      authListenerSetup.current = true;
      const { data } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (event === "TOKEN_REFRESHED" && session) {
            localStorage.setItem("access_token", session.access_token);
            if (session.refresh_token) {
              localStorage.setItem("refresh_token", session.refresh_token);
            }
            setToken(session.access_token);
            _lastValidatedAt = Date.now();
          }
          if (event === "SIGNED_OUT") {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("user");
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      );
      subscription = data?.subscription;
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, [validateSession]);

  return {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    logout,
    validateSession,
  };
}
