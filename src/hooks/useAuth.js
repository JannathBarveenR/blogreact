/**
 * useAuth — Custom authentication hook for session management.
 *
 * Provides: user, token, isAuthenticated, login(), logout(), validateSession()
 * Uses localStorage for token persistence (acceptable for MVP; production should use HttpOnly cookies).
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { appCache } from "../utils/appCache";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

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
    // Clear all auth-related data
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    // Clear pet caches for this user
    const userId = user?.id;
    if (userId) {
      localStorage.removeItem(`pets_${userId}`);
      localStorage.removeItem(`active_pet_id_${userId}`);
    }
    appCache.invalidateAll();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    navigate("/login", { replace: true });
  }, [navigate, user?.id]);

  /**
   * Validate the stored token against the backend.
   * Returns true if valid, false otherwise. On failure, auto-logs out.
   */
  const validateSession = useCallback(async () => {
    const storedToken = localStorage.getItem("access_token");
    if (!storedToken) {
      setIsAuthenticated(false);
      setLoading(false);
      return false;
    }
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      if (!res.ok) throw new Error("Invalid token");
      const userData = await res.json();
      setUser((prev) => prev ? { ...prev, ...userData } : userData);
      setIsAuthenticated(true);
      setLoading(false);
      return true;
    } catch {
      // Token is invalid/expired — clear session
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      return false;
    }
  }, []);

  // Validate session on mount
  useEffect(() => {
    validateSession();
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
