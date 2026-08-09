import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import logoImg from "../../assets/logo_new.png";

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function EyeIcon({ open }) {
  return open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  useEffect(() => {
    // Supabase sends the token in the URL hash: #access_token=...&type=recovery
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get("access_token");
    const type = params.get("type");

    if (token && type === "recovery") {
      setAccessToken(token);
    } else if (token) {
      // Some Supabase versions just send access_token without type
      setAccessToken(token);
    } else {
      setTokenError(true);
    }
  }, []);

  const handleReset = async () => {
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: accessToken,
          new_password: password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to reset password");
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (tokenError) {
    return (
      <div className="login-root">
        <div className="login-card">
          <div className="screen auth-screen" style={{ alignItems: "center", justifyContent: "center" }}>
            <div className="logo-wrap">
              <img src={logoImg} alt="PetOLife" className="logo-img" />
            </div>
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <h2 style={{ color: "#1a1a1a", marginTop: 16, fontSize: 22 }}>Invalid Reset Link</h2>
              <p style={{ color: "#666", marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
                This password reset link is invalid or has expired.<br/>
                Please request a new reset link.
              </p>
              <button
                className="btn-primary"
                style={{ marginTop: 24, maxWidth: 280 }}
                onClick={() => navigate("/login")}
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="login-root">
        <div className="login-card">
          <div className="screen success-screen">
            <div className="success-icon-wrap">
              <div className="success-circle">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            </div>
            <h2 className="success-title">Password Reset!</h2>
            <p className="success-sub">
              Your password has been successfully updated. You can now login with your new password.
            </p>
            <button
              className="btn-primary"
              style={{ maxWidth: 280 }}
              onClick={() => navigate("/login")}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="screen auth-screen">
          <div className="logo-wrap">
            <img src={logoImg} alt="PetOLife" className="logo-img" />
          </div>
          <h2 className="auth-title" style={{ marginTop: 0 }}>Set New Password</h2>
          <p style={{ textAlign: "center", color: "#666", fontSize: 14, marginBottom: 24, marginTop: -16 }}>
            Enter your new password below.
          </p>

          {error && <p className="auth-error">{error}</p>}

          <div className="form-group">
            <label>New Password</label>
            <div className="input-with-icon">
              <input
                type={showPass ? "text" : "password"}
                placeholder="Enter new password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button className="eye-btn" type="button" onClick={() => setShowPass(!showPass)}>
                <EyeIcon open={showPass} />
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type={showPass ? "text" : "password"}
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <button
            className="btn-primary"
            style={{ marginTop: 8 }}
            onClick={handleReset}
            disabled={loading}
          >
            {loading ? "Resetting…" : "Reset Password"}
          </button>

          <p className="auth-footer" style={{ marginTop: 20 }}>
            Remember your password?{" "}
            <span className="link-green" onClick={() => navigate("/login")}>Login</span>
          </p>
        </div>
      </div>
    </div>
  );
}
