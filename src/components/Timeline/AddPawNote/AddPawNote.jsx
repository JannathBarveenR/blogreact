import React, { useState } from "react";
import "./AddPawNote.css";
import "../Forms/Forms.css";

import VaccinationForm from "../Forms/VaccinationForm";
import VetVisitForm from "../Forms/VetVisitForm";
import MedicationForm from "../Forms/MedicationForm";
import DewormingForm from "../Forms/DewormingForm";
import OtherForm from "../Forms/OtherForm";

const CATEGORIES = [
  {
    id: "vaccination",
    title: "Vaccination",
    description: "Log immunization shots and boosters.",
    icon: "vaccines",
    color: "#2563eb",
    bg: "#eff6ff",
    supported: true,
  },
  {
    id: "vet_visit",
    title: "Vet Visit",
    description: "Summary of professional consultations.",
    icon: "stethoscope",
    color: "#0891b2",
    bg: "#ecfeff",
    supported: true,
  },
  {
    id: "medication",
    title: "Medication",
    description: "Track pills, liquids, or topical meds.",
    icon: "pill",
    color: "#7c3aed",
    bg: "#f5f3ff",
    supported: true,
  },
  {
    id: "deworming",
    title: "Deworming",
    description: "Parasite prevention and treatments.",
    icon: "shield",
    color: "#059669",
    bg: "#ecfdf5",
    supported: true,
  },
  {
    id: "other",
    title: "Other",
    description: "Miscellaneous health related events.",
    icon: "add",
    color: "#64748b",
    bg: "#f8fafc",
    supported: true,
  },
  {
    id: "change_in_pet",
    title: "Change in Pet",
    description: "Behavioral or physical observations.",
    icon: "favorite",
    color: "#e11d48",
    bg: "#fff1f2",
    supported: false, // Waiting on backend team
  },
  {
    id: "routine_care",
    title: "Routine Care",
    description: "Grooming, weight, or daily checks.",
    icon: "auto_awesome",
    color: "#db2777",
    bg: "#fdf2f8",
    supported: false, // Waiting on backend team
  },
  {
    id: "treatment",
    title: "Treatment",
    description: "Surgical procedures or intensive care.",
    icon: "medical_services",
    color: "#d97706",
    bg: "#fffbeb",
    supported: false, // Waiting on backend team
  },
];

export default function AddPawNote({ petId, petName, onClose, onSaved }) {
  const [selectedCategory, setSelectedCategory] = useState(null);

  if (selectedCategory === "vaccination") {
    return (
      <VaccinationForm
        petId={petId}
        petName={petName}
        onClose={() => setSelectedCategory(null)}
        onSaved={onSaved}
      />
    );
  }

  if (selectedCategory === "vet_visit") {
    return (
      <VetVisitForm
        petId={petId}
        petName={petName}
        onClose={() => setSelectedCategory(null)}
        onSaved={onSaved}
      />
    );
  }

  if (selectedCategory === "medication") {
    return (
      <MedicationForm
        petId={petId}
        petName={petName}
        onClose={() => setSelectedCategory(null)}
        onSaved={onSaved}
      />
    );
  }

  if (selectedCategory === "deworming") {
    return (
      <DewormingForm
        petId={petId}
        petName={petName}
        onClose={() => setSelectedCategory(null)}
        onSaved={onSaved}
      />
    );
  }

  if (selectedCategory === "other") {
    return (
      <OtherForm
        petId={petId}
        petName={petName}
        onClose={() => setSelectedCategory(null)}
        onSaved={onSaved}
      />
    );
  }

  return (
    <div className="add-pn">
      {/* Header */}
      <div className="add-pn__header">
        <button className="add-pn__back-btn" onClick={onClose}>
          <span className="material-symbols-outlined">close</span>
        </button>
        <span className="add-pn__header-title">Select Category</span>
      </div>

      {/* Hero Section */}
      <div className="add-pn__hero">
        <h1 className="add-pn__hero-title">
          What happened with {petName || "your pet"}?
        </h1>
        <p className="add-pn__hero-subtitle">
          Choose what you'd like to add to {petName ? `${petName}'s` : "the"} health timeline.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="add-pn__grid">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`add-pn__card ${!cat.supported ? "add-pn__card--disabled" : ""}`}
            onClick={() => {
              if (cat.supported) setSelectedCategory(cat.id);
            }}
          >
            <div className="add-pn__icon-wrap" style={{ background: cat.bg, color: cat.color }}>
              <span className="material-symbols-outlined add-pn__icon">{cat.icon}</span>
            </div>
            <div className="add-pn__card-body">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                <h3 className="add-pn__card-title">{cat.title}</h3>
                {!cat.supported && <span className="add-pn__coming-soon">Soon</span>}
              </div>
              <p className="add-pn__card-desc">{cat.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
