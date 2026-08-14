import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./VetPortal.css";

const API = import.meta.env.VITE_BACKEND_URL || "";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token")}` });

const CATEGORY_CONFIG = {
  vaccination: { icon: "💉", label: "Vaccination", color: "#2563eb" },
  medication: { icon: "💊", label: "Medication", color: "#7c3aed" },
  deworming: { icon: "🛡️", label: "Deworming", color: "#059669" },
  diagnosis: { icon: "🩺", label: "Vet Visit", color: "#0891b2" },
  vet_visit: { icon: "🩺", label: "Vet Visit", color: "#0891b2" },
  anti_tick_flea: { icon: "🐛", label: "Anti-Tick", color: "#d97706" },
  other: { icon: "📋", label: "Other", color: "#64748b" },
};

export default function PatientDetail() {
  const { petId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");

  useEffect(() => {
    fetch(`${API}/api/v2/patients/${petId}`, { headers: auth() })
      .then((r) => r.json())
      .then((d) => { setPatient(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [petId]);

  const sendInvite = async () => {
    setInviting(true);
    try {
      const r = await fetch(`${API}/api/v2/patients/${petId}/invite`, { method: "POST", headers: auth() });
      const d = await r.json();
      setInviteMsg(d.message || "Invite sent!");
    } catch (_) {
      setInviteMsg("Failed to send invite");
    }
    setInviting(false);
  };

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: "var(--vet-text-muted)" }}>Loading…</div>;
  if (!patient) return <div style={{ textAlign: "center", padding: 40, color: "var(--vet-red)" }}>Patient not found.</div>;

  const emoji = patient.pet_type === "cat" ? "🐱" : "🐶";
  const events = patient.medical_events || [];

  return (
    <div>
      {/* Back */}
      <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", fontSize: 13, color: "var(--vet-text-muted)", cursor: "pointer", marginBottom: 12 }}>
        ← Back
      </button>

      {/* Patient Card */}
      <div className="vet-form-card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {patient.pet_photo_url ? (
          <img src={patient.pet_photo_url} alt="" style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--vet-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{emoji}</div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: "var(--vet-teal)" }}>{patient.pet_name}</div>
          <div style={{ fontSize: 12, color: "var(--vet-text-muted)" }}>
            {patient.breed || "Mixed"} · {patient.gender || "—"} · {patient.approx_age || "Age unknown"}
          </div>
          <div style={{ fontSize: 11, color: "var(--vet-text-muteder)", marginTop: 2 }}>{patient.petolife_id}</div>
        </div>
        <span className={`vet-claim-badge ${patient.is_claimed ? "claimed" : "unclaimed"}`}>
          {patient.is_claimed ? "Linked" : "Unclaimed"}
        </span>
      </div>

      {/* Owner Info */}
      <div className="vet-form-card" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
        <span style={{ fontSize: 20 }}>👤</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{patient.owner_name || "Owner not registered"}</div>
          <div style={{ fontSize: 11, color: "var(--vet-text-muted)" }}>{patient.owner_phone || patient.claim_phone || "No phone on file"}</div>
        </div>
        {!patient.is_claimed && patient.claim_token && (
          <button className="vet-btn vet-btn-outline" style={{ fontSize: 11, padding: "5px 10px" }} onClick={sendInvite} disabled={inviting}>
            {inviting ? "…" : "📲 Send Link"}
          </button>
        )}
      </div>
      {inviteMsg && <div style={{ fontSize: 11, color: "var(--vet-green-dark)", textAlign: "center", marginTop: -8, marginBottom: 10 }}>{inviteMsg}</div>}

      {/* Vitals Summary */}
      {patient.weight && (
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1, background: "#fff", border: "1px solid var(--vet-border)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: "var(--vet-teal)" }}>{patient.weight} kg</div>
            <div style={{ fontSize: 10, color: "var(--vet-text-muted)" }}>WEIGHT</div>
          </div>
          <div style={{ flex: 1, background: "#fff", border: "1px solid var(--vet-border)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: "var(--vet-teal)" }}>{patient.blood_group || "—"}</div>
            <div style={{ fontSize: 10, color: "var(--vet-text-muted)" }}>BLOOD GROUP</div>
          </div>
        </div>
      )}

      {/* Start Consultation */}
      <button
        className="vet-btn vet-btn-primary"
        style={{ width: "100%", padding: 14, fontSize: 14, marginBottom: 20 }}
        onClick={() => navigate(`/vet/visit/${petId}`)}
      >
        🩺 Start Consultation
      </button>

      {/* Medical Timeline */}
      <div className="vet-section-title">Medical History</div>

      {events.length === 0 && (
        <div style={{ textAlign: "center", color: "var(--vet-text-muted)", fontSize: 12, padding: "20px 0" }}>
          No medical records yet. Start the first consultation above.
        </div>
      )}

      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

function EventCard({ event }) {
  const entries = event.category_entries || [];
  const primary = entries[0] || {};
  const cfg = CATEGORY_CONFIG[primary.category] || CATEGORY_CONFIG.other;
  const dateStr = new Date(event.event_date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const isVetPortal = event.source === "vet_portal";

  return (
    <div style={{ background: "#fff", border: "1px solid var(--vet-border)", borderRadius: 12, padding: "12px 14px", marginBottom: 10, display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f0f6ed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
        {cfg.icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          {cfg.label}
          {isVetPortal && (
            <span style={{ fontSize: 9, background: "#E5F0FF", color: "#2A5A9C", padding: "2px 6px", borderRadius: 20, fontWeight: 800 }}>
              VET SIGNED
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: "var(--vet-text-muted)", marginTop: 2 }}>
          {dateStr} · {event.vet_name ? `Dr. ${event.vet_name.replace(/^Dr\.?\s*/i, "")}` : "Self-logged"}
          {event.clinic_name ? ` · ${event.clinic_name}` : ""}
        </div>
        {entries.length > 1 && (
          <div style={{ fontSize: 11, color: "var(--vet-text-muted)", marginTop: 2 }}>
            +{entries.length - 1} more {entries.length - 1 === 1 ? "entry" : "entries"}
          </div>
        )}
      </div>
    </div>
  );
}
