import React from "react";
import "../VetPortal.css";

export default function StepVitals({ vitals, setVitals, next, back, petId }) {
  const set = (k, v) => setVitals((p) => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="vet-page-header">
        <h1>Step 1 — Vitals</h1>
        <p>Record the patient's physical examination findings</p>
      </div>

      <div className="vet-form-card">
        <div className="vet-form-row2">
          <div className="vet-form-group">
            <label>Weight (kg)</label>
            <input type="number" step="0.1" placeholder="e.g. 12.5" value={vitals.weight} onChange={(e) => set("weight", e.target.value)} />
          </div>
          <div className="vet-form-group">
            <label>Temperature (°F)</label>
            <input type="number" step="0.1" placeholder="e.g. 101.5" value={vitals.temp} onChange={(e) => set("temp", e.target.value)} />
          </div>
        </div>

        <div className="vet-form-row2">
          <div className="vet-form-group">
            <label>Heart Rate (bpm)</label>
            <input type="number" placeholder="e.g. 80" value={vitals.heartRate} onChange={(e) => set("heartRate", e.target.value)} />
          </div>
          <div className="vet-form-group">
            <label>Respiration (rpm)</label>
            <input type="number" placeholder="e.g. 20" value={vitals.respRate} onChange={(e) => set("respRate", e.target.value)} />
          </div>
        </div>

        <div className="vet-form-group">
          <label>Behaviour / Demeanor</label>
          <select value={vitals.behavior} onChange={(e) => set("behavior", e.target.value)}>
            <option value="normal">Normal / Alert</option>
            <option value="abnormal">Abnormal / Depressed</option>
            <option value="anxious">Anxious</option>
            <option value="aggressive">Aggressive</option>
            <option value="lethargic">Lethargic</option>
          </select>
        </div>

        {/* Dosage Calculator */}
        {vitals.weight && (
          <div style={{ background: "var(--vet-bg)", borderRadius: 10, padding: "10px 12px", marginTop: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--vet-teal)", marginBottom: 6 }}>Quick Dosage Reference ({vitals.weight} kg)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11 }}>
              {[
                { drug: "Amoxicillin", rate: "20 mg/kg" },
                { drug: "Cephalexin", rate: "22 mg/kg" },
                { drug: "Metronidazole", rate: "15 mg/kg" },
                { drug: "Meloxicam", rate: "0.1 mg/kg" },
              ].map(({ drug, rate }) => {
                const mgPerKg = parseFloat(rate);
                const dose = (mgPerKg * parseFloat(vitals.weight)).toFixed(1);
                return (
                  <div key={drug} style={{ background: "#fff", borderRadius: 8, padding: "6px 8px", color: "var(--vet-text-dark)" }}>
                    <span style={{ fontWeight: 700 }}>{drug}</span>
                    <br />
                    <span style={{ color: "var(--vet-green-dark)" }}>{dose} mg</span>
                    <span style={{ color: "var(--vet-text-muted)" }}> ({rate})</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <button className="vet-btn vet-btn-primary" style={{ width: "100%", padding: 14 }} onClick={next}>
        Next: Diagnosis →
      </button>
    </div>
  );
}
