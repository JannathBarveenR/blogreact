import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./VetPortal.css";

export default function VetLogin() {
  const navigate = useNavigate();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const isEmail = emailOrPhone.includes("@");
      const payload = {
        password: password,
        [isEmail ? "email" : "phone"]: emailOrPhone.trim(),
      };

      const backendUrl = import.meta.env.VITE_BACKEND_URL || "";
      const res = await fetch(`${backendUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Invalid login credentials");
      }

      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
        if (data.refresh_token) {
          localStorage.setItem("refresh_token", data.refresh_token);
        }
        navigate("/vet/home", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Failed to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vet-portal-container" style={{ justifyContent: "center", alignItems: "center", padding: "20px" }}>
      <div className="vet-form-card" style={{ maxWidth: "420px", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "22px", fontWeight: "800", color: "var(--vet-teal)" }}>
            PetOLife <span className="vet-brand-badge">VET PORTAL</span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--vet-text-muted)", marginTop: "6px" }}>
            Veterinary Clinical Consultations &amp; Patient Records
          </p>
        </div>

        {error && (
          <div style={{ background: "#FBEDEC", color: "var(--vet-red)", padding: "10px 12px", borderRadius: "8px", fontSize: "12px", marginBottom: "14px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="vet-form-group">
            <label>Doctor Email or Mobile</label>
            <input
              type="text"
              placeholder="e.g. dr.meera@clinic.com or 9876543210"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              required
            />
          </div>

          <div className="vet-form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="vet-btn vet-btn-primary"
            style={{ width: "100%", padding: "12px", marginTop: "10px" }}
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign In to Vet Portal"}
          </button>
        </form>

        <div style={{ marginTop: "18px", textAlign: "center", fontSize: "11.5px", color: "var(--vet-text-muted)" }}>
          Are you a pet parent?{" "}
          <a href="/login" style={{ color: "var(--vet-teal)", fontWeight: "700" }}>
            Parent Login
          </a>
        </div>
      </div>
    </div>
  );
}
