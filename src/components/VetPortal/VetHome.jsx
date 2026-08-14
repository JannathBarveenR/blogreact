import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./VetPortal.css";

const API = import.meta.env.VITE_BACKEND_URL || "";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token")}` });

export default function VetHome() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ todayVisits: 0, totalPatients: 0, unclaimed: 0 });
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/v2/vets/me`, { headers: auth() })
      .then((r) => r.json())
      .then(setProfile)
      .catch(() => {});
    fetchPatients("");
  }, []);

  const fetchPatients = async (q) => {
    setSearching(true);
    try {
      const r = await fetch(`${API}/api/v2/patients/search?q=${encodeURIComponent(q)}`, { headers: auth() });
      const d = await r.json();
      const list = d.patients || [];
      setResults(list);
      setStats({
        totalPatients: list.length,
        unclaimed: list.filter((p) => !p.is_claimed).length,
        todayVisits: 0,
      });
    } catch (_) {}
    setSearching(false);
  };

  const handleSearch = (e) => {
    const v = e.target.value;
    setSearch(v);
    if (v.length >= 2) fetchPatients(v);
    else if (v.length === 0) fetchPatients("");
  };

  const doctorName = profile?.doctor_name || "Doctor";
  const initials = doctorName.replace(/Dr\.?\s*/i, "").split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase() || "DR";

  return (
    <div>
      {/* Greeting */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", paddingTop: "4px" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#84B662,#6FA54F)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800 }}>
          {initials}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--vet-teal)" }}>Hello, {doctorName} 👋</div>
          <div style={{ fontSize: 11, color: "var(--vet-text-muted)" }}>{profile?.qualification || "BVSc & AH"}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="vet-stat-grid">
        <div className="vet-stat-card accent-green" onClick={() => navigate("/vet/patients")}>
          <div className="num">{stats.totalPatients}</div>
          <div className="label">Total Patients</div>
        </div>
        <div className="vet-stat-card accent-amber" onClick={() => navigate("/vet/patients")}>
          <div className="num">{stats.unclaimed}</div>
          <div className="label">Unclaimed Records</div>
        </div>
      </div>

      {/* Quick Start Visit */}
      <button
        className="vet-btn vet-btn-primary"
        style={{ width: "100%", padding: "14px", fontSize: 14, marginBottom: 20 }}
        onClick={() => navigate("/vet/patients")}
      >
        🩺 Search Patient to Start Consultation
      </button>

      {/* Quick Search */}
      <div className="vet-section-title">
        <span>Recent Patients</span>
        <button className="vet-btn vet-btn-outline" style={{ fontSize: 11, padding: "5px 10px" }} onClick={() => navigate("/vet/patients")}>
          + Add Patient
        </button>
      </div>

      <div className="vet-search-box">
        <span>🔍</span>
        <input
          placeholder="Search by name, phone, or PetOlife ID…"
          value={search}
          onChange={handleSearch}
        />
        {searching && <span style={{ fontSize: 11, color: "var(--vet-text-muted)" }}>…</span>}
      </div>

      {results.slice(0, 6).map((pet) => (
        <PatientRow key={pet.id} pet={pet} onClick={() => navigate(`/vet/patients/${pet.id}`)} />
      ))}

      {results.length === 0 && !searching && (
        <div style={{ textAlign: "center", color: "var(--vet-text-muted)", fontSize: 12, padding: "20px 0" }}>
          No patients found. Add your first walk-in patient to get started.
        </div>
      )}
    </div>
  );
}

function PatientRow({ pet, onClick }) {
  const emoji = pet.pet_type === "cat" ? "🐱" : "🐶";
  return (
    <div className="vet-patient-row" onClick={onClick} role="button" tabIndex={0}>
      <div className="vet-pet-icon">{emoji}</div>
      <div className="vet-patient-info">
        <div className="vet-patient-name">
          {pet.pet_name}
          <span className={`vet-claim-badge ${pet.is_claimed ? "claimed" : "unclaimed"}`}>
            {pet.is_claimed ? "Linked" : "Unclaimed"}
          </span>
        </div>
        <div className="vet-patient-meta">
          {pet.breed || "Mixed"} · {pet.owner_name || "—"} · {pet.owner_phone || pet.petolife_id}
        </div>
      </div>
      <span style={{ color: "var(--vet-text-muteder)", fontSize: 16 }}>›</span>
    </div>
  );
}
