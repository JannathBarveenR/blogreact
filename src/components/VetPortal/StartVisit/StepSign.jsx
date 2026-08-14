import React, { useState } from "react";
import "../VetPortal.css";

const API = import.meta.env.VITE_BACKEND_URL || "";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token")}` });

export default function StepSign({ petId, vitals, diagnoses, medications, injections, shampoos, vaccines, followUp, onDone, back }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const totalRx = medications.length + injections.length + shampoos.length + vaccines.length;

  const handleSign = async () => {
    setSaving(true);
    setError("");
    try {
      const body = {
        pet_id: petId,
        vitals,
        diagnoses,
        medications,
        injections,
        shampoos,
        vaccines,
        follow_up_date: followUp.date || null,
        follow_up_notes: followUp.notes || null,
      };
      const r = await fetch(`${API}/api/v2/visits`, {
        method: "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Failed to save consultation");
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const Row = ({ label, value }) => value ? (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--vet-border)", fontSize: 12 }}>
      <span style={{ color: "var(--vet-text-muted)", fontWeight: 600 }}>{label}</span>
      <span style={{ color: "var(--vet-text-dark)", fontWeight: 700, textAlign: "right", maxWidth: "60%" }}>{value}</span>
    </div>
  ) : null;

  return (
    <div>
      <div className="vet-page-header">
        <h1>Step 4 — Review & Sign</h1>
        <p>Verify details before saving to the pet's timeline</p>
      </div>

      {/* Vitals Summary */}
      <div className="vet-form-card">
        <div style={{ fontWeight: 800, fontSize: 12, color: "var(--vet-teal)", marginBottom: 10 }}>🩺 Vitals</div>
        <Row label="Weight" value={vitals.weight ? `${vitals.weight} kg` : null} />
        <Row label="Temperature" value={vitals.temp ? `${vitals.temp} °F` : null} />
        <Row label="Heart Rate" value={vitals.heartRate ? `${vitals.heartRate} bpm` : null} />
        <Row label="Respiration" value={vitals.respRate ? `${vitals.respRate} rpm` : null} />
        <Row label="Behaviour" value={vitals.behavior} />
        {!vitals.weight && !vitals.temp && (
          <div style={{ fontSize: 11, color: "var(--vet-text-muted)", textAlign: "center", padding: "4px 0" }}>No vitals recorded</div>
        )}
      </div>

      {/* Diagnoses Summary */}
      <div className="vet-form-card">
        <div style={{ fontWeight: 800, fontSize: 12, color: "var(--vet-teal)", marginBottom: 10 }}>📋 Diagnoses</div>
        {diagnoses.map((d, i) => (
          <div key={i} style={{ padding: "6px 0", borderBottom: i < diagnoses.length - 1 ? "1px solid var(--vet-border)" : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{d.name || "—"}</div>
            <div style={{ fontSize: 11, color: "var(--vet-text-muted)" }}>
              {d.category} · {d.status}
              {d.notes && ` · ${d.notes.slice(0, 60)}${d.notes.length > 60 ? "…" : ""}`}
            </div>
          </div>
        ))}
      </div>

      {/* Rx Summary */}
      <div className="vet-form-card">
        <div style={{ fontWeight: 800, fontSize: 12, color: "var(--vet-teal)", marginBottom: 10 }}>💊 Prescription ({totalRx} items)</div>
        {totalRx === 0 && <div style={{ fontSize: 11, color: "var(--vet-text-muted)", textAlign: "center", padding: "4px 0" }}>No medications prescribed</div>}
        {medications.map((m, i) => <div key={i} style={{ fontSize: 12, padding: "4px 0" }}>💊 {m.name} {m.dosage ? `· ${m.dosage}` : ""}</div>)}
        {injections.map((m, i) => <div key={i} style={{ fontSize: 12, padding: "4px 0" }}>💉 Inj. {m.name} {m.dose ? `· ${m.dose}` : ""}</div>)}
        {shampoos.map((m, i) => <div key={i} style={{ fontSize: 12, padding: "4px 0" }}>🧴 {m.name}</div>)}
        {vaccines.map((m, i) => <div key={i} style={{ fontSize: 12, padding: "4px 0" }}>🔬 {m.name} {m.brand ? `· ${m.brand}` : ""}</div>)}
      </div>

      {/* Follow-up Summary */}
      {followUp.date && (
        <div className="vet-form-card">
          <div style={{ fontWeight: 800, fontSize: 12, color: "var(--vet-teal)", marginBottom: 6 }}>📅 Follow-up</div>
          <Row label="Date" value={new Date(followUp.date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} />
          <Row label="Notes" value={followUp.notes} />
        </div>
      )}

      {error && (
        <div style={{ background: "#FBEDEC", color: "var(--vet-red)", padding: "10px 12px", borderRadius: 8, fontSize: 12, marginBottom: 14 }}>{error}</div>
      )}

      <div style={{ background: "#E5F0FF", border: "1px solid #cfe0f7", borderRadius: 10, padding: "10px 12px", fontSize: 11.5, color: "#2A5A9C", marginBottom: 16 }}>
        ✅ Signing this consultation will instantly update the pet parent's PetOlife Timeline.
      </div>

      <button
        className="vet-btn vet-btn-primary"
        style={{ width: "100%", padding: 14, fontSize: 14 }}
        onClick={handleSign}
        disabled={saving}
      >
        {saving ? "Saving…" : "✍️ Sign & Save Consultation"}
      </button>
    </div>
  );
}
