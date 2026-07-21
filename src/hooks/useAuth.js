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
import { appCache } from "../utils/appCache";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

// ── Module-level shared state ────────────────────────────────────────────────
// This ensures that even if useAuth() is called from 5 different components,
// the validation only happens once. All other instances read cached state.
let _validationPromise = null;
let _lastValidatedAt = 0;
const VALIDATION_COOLDOWN_MS = 60 * 1000; // Don't re-validate more than once per minute

export default function useAuth() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem("access_token") || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [loading, setLoading] = useState(true);
  const authListenerSetup = useRef(false);

  /**
   * Store tokens and user data after a successful login/signup.
   */
  const login = useCallback((accessToken, refreshToken, userData) => {
    localStorage.setItem("access_token", accessToken);
    if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
    if (userData) localStorage.setItem("user", JSON.stringify(userData));
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
    const userId = user?.id;
    if (userId) {
      localStorage.removeItem(`pets_${userId}`);
      localStorage.removeItem(`active_pet_id_${userId}`);
    }
    appCache.invalidateAll();
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
    if (!storedToken) {
      setIsAuthenticated(false);
      setLoading(false);
      return false;
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
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return false;

    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data?.session) return false;

      const { access_token, refresh_token: newRefresh } = data.session;
      localStorage.setItem("access_token", access_token);
      if (newRefresh) localStorage.setItem("refresh_token", newRefresh);
      if (data.session.user) {
        localStorage.setItem("user", JSON.stringify(data.session.user));
        setUser(data.session.user);
      }
      setToken(access_token);
      return true;
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
    if (!authListenerSetup.current) {
      authListenerSetup.current = true;
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
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

      return () => subscription?.unsubscribe();
    }
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
