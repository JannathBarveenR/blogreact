import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./VetPortal.css";

const API = import.meta.env.VITE_BACKEND_URL || "";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token")}` });

export default function PatientHub() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => { fetchPatients(""); }, []);

  const fetchPatients = async (q) => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/v2/patients/search?q=${encodeURIComponent(q)}`, { headers: auth() });
      const d = await r.json();
      setPatients(d.patients || []);
    } catch (_) {}
    setLoading(false);
  };

  const handleSearch = (e) => {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPatients(v), 350);
  };

  const emoji = (t) => (t === "cat" ? "🐱" : "🐶");

  return (
    <div>
      <div className="vet-page-header">
        <h1>Patients</h1>
        <p>Search by name, phone, or PetOlife ID</p>
      </div>

      <div className="vet-search-box">
        <span>🔍</span>
        <input placeholder="Search patients…" value={query} onChange={handleSearch} autoFocus />
        {loading && <span style={{ fontSize: 11, color: "var(--vet-text-muted)" }}>…</span>}
      </div>

      <button
        className="vet-btn vet-btn-primary"
        style={{ width: "100%", marginBottom: 16 }}
        onClick={() => setShowCreate(true)}
      >
        + Register Walk-in Patient
      </button>

      {patients.map((p) => (
        <div
          key={p.id}
          className="vet-patient-row"
          onClick={() => navigate(`/vet/patients/${p.id}`)}
          role="button"
          tabIndex={0}
        >
          <div className="vet-pet-icon">{emoji(p.pet_type)}</div>
          <div className="vet-patient-info">
            <div className="vet-patient-name">
              {p.pet_name}
              <span className={`vet-claim-badge ${p.is_claimed ? "claimed" : "unclaimed"}`}>
                {p.is_claimed ? "Linked" : "Unclaimed"}
              </span>
            </div>
            <div className="vet-patient-meta">
              {p.breed || "Mixed"} · {p.owner_name} · {p.petolife_id}
            </div>
          </div>
          <span style={{ color: "var(--vet-text-muteder)", fontSize: 16 }}>›</span>
        </div>
      ))}

      {patients.length === 0 && !loading && (
        <div style={{ textAlign: "center", color: "var(--vet-text-muted)", fontSize: 12, padding: "30px 0" }}>
          No patients found. Tap "Register Walk-in Patient" to add one.
        </div>
      )}

      {showCreate && (
        <CreatePatientModal
          onClose={() => setShowCreate(false)}
          onCreated={(pet) => { setShowCreate(false); navigate(`/vet/patients/${pet.id}`); }}
        />
      )}
    </div>
  );
}

function CreatePatientModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    pet_name: "", pet_type: "dog", breed: "", gender: "Male",
    approx_age: "", weight: "", owner_name: "", owner_phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.pet_name.trim()) { setError("Pet name is required"); return; }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        weight: form.weight ? parseFloat(form.weight) : null,
      };
      const r = await fetch(`${API}/api/v2/patients`, {
        method: "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Failed to create patient");
      onCreated(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: 20, width: "100%", maxWidth: 600, margin: "0 auto", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--vet-teal)", margin: 0 }}>Register Walk-in Patient</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>

        {error && <div style={{ background: "#FBEDEC", color: "#B4433D", padding: "8px 12px", borderRadius: 8, fontSize: 12, marginBottom: 12 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="vet-form-group">
            <label>Pet Name *</label>
            <input value={form.pet_name} onChange={(e) => set("pet_name", e.target.value)} placeholder="e.g. Bruno" required />
          </div>

          <div className="vet-form-row2">
            <div className="vet-form-group">
              <label>Species</label>
              <select value={form.pet_type} onChange={(e) => set("pet_type", e.target.value)}>
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
              </select>
            </div>
            <div className="vet-form-group">
              <label>Gender</label>
              <select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div className="vet-form-row2">
            <div className="vet-form-group">
              <label>Breed</label>
              <input value={form.breed} onChange={(e) => set("breed", e.target.value)} placeholder="e.g. Labrador" />
            </div>
            <div className="vet-form-group">
              <label>Approx Age</label>
              <input value={form.approx_age} onChange={(e) => set("approx_age", e.target.value)} placeholder="e.g. 3 years" />
            </div>
          </div>

          <div className="vet-form-group">
            <label>Weight (kg)</label>
            <input type="number" step="0.1" value={form.weight} onChange={(e) => set("weight", e.target.value)} placeholder="e.g. 14.5" />
          </div>

          <div style={{ borderTop: "1px solid var(--vet-border)", margin: "14px 0", paddingTop: 14, fontSize: 12, fontWeight: 700, color: "var(--vet-text-muted)" }}>
            Owner Contact (for claim link)
          </div>

          <div className="vet-form-group">
            <label>Owner Name</label>
            <input value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)} placeholder="e.g. Rahul Sharma" />
          </div>
          <div className="vet-form-group">
            <label>Owner Phone</label>
            <input type="tel" value={form.owner_phone} onChange={(e) => set("owner_phone", e.target.value)} placeholder="+91 9876543210" />
          </div>

          <button type="submit" className="vet-btn vet-btn-primary" style={{ width: "100%", padding: 12, marginTop: 4 }} disabled={saving}>
            {saving ? "Registering…" : "Register Patient"}
          </button>
        </form>
      </div>
    </div>
  );
}
