import React, { useState, useEffect } from "react";
import "./VetPortal.css";

const API = import.meta.env.VITE_BACKEND_URL || "";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token")}` });

export default function VetProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ doctor_name: "", qualification: "", registration_number: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/v2/vets/me`, { headers: auth() })
      .then((r) => r.json())
      .then((d) => {
        setProfile(d);
        setForm({
          doctor_name: d.doctor_name || "",
          qualification: d.qualification || "",
          registration_number: d.registration_number || "",
          phone: d.phone || "",
        });
      })
      .catch(() => {});
  }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`${API}/api/v2/vets/me`, {
        method: "PUT",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (_) {}
    setSaving(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/vet/login";
  };

  const initials = (form.doctor_name || "DR").replace(/Dr\.?\s*/i, "").split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase() || "DR";

  return (
    <div>
      <div className="vet-page-header">
        <h1>My Profile</h1>
        <p>Update your clinic information and credentials</p>
      </div>

      {/* Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg,#84B662,#6FA54F)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 }}>
          {initials}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: "var(--vet-teal)" }}>{form.doctor_name || "Your Name"}</div>
          <div style={{ fontSize: 12, color: "var(--vet-text-muted)" }}>{form.qualification || "Qualification"}</div>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="vet-form-card">
          <div style={{ fontWeight: 800, fontSize: 12, color: "var(--vet-teal)", marginBottom: 12 }}>Doctor Information</div>

          <div className="vet-form-group">
            <label>Full Name (with Dr.)</label>
            <input value={form.doctor_name} onChange={(e) => set("doctor_name", e.target.value)} placeholder="Dr. Meera Nair" />
          </div>

          <div className="vet-form-group">
            <label>Qualification</label>
            <input value={form.qualification} onChange={(e) => set("qualification", e.target.value)} placeholder="BVSc & AH, MVSc" />
          </div>

          <div className="vet-form-group">
            <label>Registration Number</label>
            <input value={form.registration_number} onChange={(e) => set("registration_number", e.target.value)} placeholder="e.g. KVA-12345" />
          </div>

          <div className="vet-form-group">
            <label>Mobile</label>
            <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 9876543210" />
          </div>
        </div>

        {saved && (
          <div style={{ background: "#E8F5E2", color: "var(--vet-green-dark)", padding: "8px 12px", borderRadius: 8, fontSize: 12, marginBottom: 12, textAlign: "center", fontWeight: 700 }}>
            ✅ Profile saved!
          </div>
        )}

        <button type="submit" className="vet-btn vet-btn-primary" style={{ width: "100%", padding: 12 }} disabled={saving}>
          {saving ? "Saving…" : "Save Profile"}
        </button>
      </form>

      <button
        onClick={handleLogout}
        className="vet-btn vet-btn-outline"
        style={{ width: "100%", padding: 12, marginTop: 12, color: "var(--vet-red)", borderColor: "var(--vet-red)" }}
      >
        Sign Out
      </button>
    </div>
  );
}
