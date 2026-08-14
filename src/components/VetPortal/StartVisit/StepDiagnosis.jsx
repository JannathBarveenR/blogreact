import React from "react";
import "../VetPortal.css";

const DIAG_CATEGORIES = ["General","Dermatology","Orthopedic","Gastro","Respiratory","Ophthalmology","Cardiology","Neurology","Dental","Endocrine","Renal","Reproductive"];
const STATUSES = [
  { value: "suspected", label: "Suspected" },
  { value: "confirmed", label: "Confirmed" },
  { value: "rule_out", label: "Rule Out" },
];

export default function StepDiagnosis({ diagnoses, setDiagnoses, next, back }) {
  const update = (i, k, v) =>
    setDiagnoses((prev) => prev.map((d, idx) => (idx === i ? { ...d, [k]: v } : d)));

  const addDiag = () =>
    setDiagnoses((prev) => [...prev, { category: "General", name: "", status: "suspected", notes: "" }]);

  const removeDiag = (i) =>
    setDiagnoses((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="vet-page-header">
        <h1>Step 2 — Diagnosis</h1>
        <p>Add one or more diagnoses for this consultation</p>
      </div>

      {diagnoses.map((d, i) => (
        <div key={i} className="vet-form-card" style={{ position: "relative" }}>
          {diagnoses.length > 1 && (
            <button onClick={() => removeDiag(i)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "var(--vet-red)" }}>✕</button>
          )}
          <div style={{ fontWeight: 800, fontSize: 12, color: "var(--vet-teal)", marginBottom: 10 }}>
            Diagnosis {diagnoses.length > 1 ? `#${i + 1}` : ""}
          </div>

          <div className="vet-form-row2">
            <div className="vet-form-group">
              <label>Category</label>
              <select value={d.category} onChange={(e) => update(i, "category", e.target.value)}>
                {DIAG_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="vet-form-group">
              <label>Status</label>
              <select value={d.status} onChange={(e) => update(i, "status", e.target.value)}>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div className="vet-form-group">
            <label>Diagnosis / Condition Name *</label>
            <input
              value={d.name}
              onChange={(e) => update(i, "name", e.target.value)}
              placeholder="e.g. Allergic Dermatitis, Otitis Externa…"
            />
          </div>

          <div className="vet-form-group">
            <label>Clinical Notes</label>
            <textarea
              rows={3}
              value={d.notes}
              onChange={(e) => update(i, "notes", e.target.value)}
              placeholder="Observations, findings, treatment plan notes…"
              style={{ resize: "none" }}
            />
          </div>
        </div>
      ))}

      <button className="vet-btn vet-btn-outline" style={{ width: "100%", marginBottom: 12 }} onClick={addDiag}>
        + Add Another Diagnosis
      </button>

      <button
        className="vet-btn vet-btn-primary"
        style={{ width: "100%", padding: 14 }}
        onClick={next}
        disabled={diagnoses.some((d) => !d.name.trim())}
      >
        Next: Prescription →
      </button>
    </div>
  );
}
