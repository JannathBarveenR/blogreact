import React, { useState, useEffect } from "react";
import "../VetPortal.css";

const API = import.meta.env.VITE_BACKEND_URL || "";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token")}` });

function ItemList({ title, icon, items, setItems, fields }) {
  const add = () => setItems((p) => [...p, Object.fromEntries(fields.map((f) => [f.key, ""]))]);
  const remove = (i) => setItems((p) => p.filter((_, idx) => idx !== i));
  const update = (i, k, v) => setItems((p) => p.map((item, idx) => idx === i ? { ...item, [k]: v } : item));

  return (
    <div className="vet-form-card">
      <div style={{ fontWeight: 800, fontSize: 12, color: "var(--vet-teal)", marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
        <span>{icon} {title}</span>
        <button className="vet-btn vet-btn-outline" style={{ fontSize: 10, padding: "3px 9px" }} onClick={add}>+ Add</button>
      </div>
      {items.length === 0 && (
        <div style={{ fontSize: 11, color: "var(--vet-text-muted)", textAlign: "center", padding: "8px 0" }}>None added</div>
      )}
      {items.map((item, i) => (
        <div key={i} style={{ background: "var(--vet-card-soft)", borderRadius: 8, padding: "10px", marginBottom: 8, position: "relative" }}>
          <button onClick={() => remove(i)} style={{ position: "absolute", top: 6, right: 8, background: "none", border: "none", fontSize: 14, cursor: "pointer", color: "var(--vet-red)" }}>✕</button>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {fields.map((f) => (
              <div key={f.key} style={{ gridColumn: f.full ? "1 / -1" : undefined }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--vet-text-muted)", marginBottom: 3 }}>{f.label}</label>
                <input
                  value={item[f.key] || ""}
                  onChange={(e) => update(i, f.key, e.target.value)}
                  placeholder={f.placeholder || ""}
                  style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: "1.5px solid var(--vet-border)", fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StepPrescription({ medications, setMedications, injections, setInjections, shampoos, setShampoos, vaccines, setVaccines, followUp, setFollowUp, next, back }) {

  return (
    <div>
      <div className="vet-page-header">
        <h1>Step 3 — Prescription</h1>
        <p>Add medications, vaccines, and follow-up schedule</p>
      </div>

      <ItemList
        title="Oral / Topical Medications"
        icon="💊"
        items={medications}
        setItems={setMedications}
        fields={[
          { key: "name", label: "Medicine Name", placeholder: "e.g. Cephalexin 500mg" },
          { key: "brand", label: "Brand", placeholder: "e.g. Cepravin" },
          { key: "dosage", label: "Dosage & Frequency", placeholder: "1 tab BID × 7 days", full: true },
        ]}
      />

      <ItemList
        title="Injections"
        icon="💉"
        items={injections}
        setItems={setInjections}
        fields={[
          { key: "name", label: "Injection Name", placeholder: "e.g. Dexamethasone" },
          { key: "dose", label: "Dose", placeholder: "e.g. 1 mg/kg SC" },
        ]}
      />

      <ItemList
        title="Shampoos / Topical"
        icon="🧴"
        items={shampoos}
        setItems={setShampoos}
        fields={[
          { key: "name", label: "Shampoo / Product", placeholder: "e.g. Ketochlor Shampoo" },
          { key: "category", label: "Category", placeholder: "e.g. anti_fungal" },
        ]}
      />

      <ItemList
        title="Vaccines"
        icon="🔬"
        items={vaccines}
        setItems={setVaccines}
        fields={[
          { key: "name", label: "Vaccine Name", placeholder: "e.g. DHPP" },
          { key: "brand", label: "Brand / Batch", placeholder: "e.g. Vanguard Plus" },
        ]}
      />

      {/* Follow-up */}
      <div className="vet-form-card">
        <div style={{ fontWeight: 800, fontSize: 12, color: "var(--vet-teal)", marginBottom: 10 }}>📅 Follow-up</div>
        <div className="vet-form-group">
          <label>Follow-up Date (optional)</label>
          <input
            type="date"
            value={followUp.date}
            onChange={(e) => setFollowUp((p) => ({ ...p, date: e.target.value }))}
          />
        </div>
        <div className="vet-form-group">
          <label>Follow-up Notes</label>
          <input
            value={followUp.notes}
            onChange={(e) => setFollowUp((p) => ({ ...p, notes: e.target.value }))}
            placeholder="e.g. Recheck skin lesions after 7 days"
          />
        </div>
      </div>

      <button className="vet-btn vet-btn-primary" style={{ width: "100%", padding: 14 }} onClick={next}>
        Next: Review & Sign →
      </button>
    </div>
  );
}
