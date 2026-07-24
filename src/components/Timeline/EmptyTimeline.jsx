import React from "react";
import "./EmptyTimeline.css";

const CATEGORY_NAMES = {
  vaccination: "Vaccination",
  medication: "Medication",
  deworming: "Deworming",
  diagnosis: "Vet Visit",
  grooming: "Grooming",
  other: "Custom Note",
};

const CATEGORY_ICONS = {
  vaccination: "vaccines",
  medication: "pill",
  deworming: "shield",
  diagnosis: "stethoscope",
  grooming: "auto_awesome",
  other: "more_horiz",
};

export default function EmptyTimeline({
  petName,
  totalEventsCount = 0,
  activeFilter = "all",
  onAddNote,
  onClearFilter,
}) {
  const isFilteredEmpty = totalEventsCount > 0 && activeFilter !== "all";
  const categoryLabel = CATEGORY_NAMES[activeFilter] || "Health";
  const categoryIcon = CATEGORY_ICONS[activeFilter] || "clinical_notes";

  if (isFilteredEmpty) {
    return (
      <div className="empty-tl">
        <div className="empty-tl__illustration">
          <div className="empty-tl__circle" style={{ background: "#eff6ff" }}>
            <span className="material-symbols-outlined empty-tl__main-icon" style={{ color: "#2563eb" }}>
              {categoryIcon}
            </span>
          </div>
          <span className="material-symbols-outlined empty-tl__float empty-tl__float--1">search</span>
          <span className="material-symbols-outlined empty-tl__float empty-tl__float--2">pets</span>
        </div>

        <h3 className="empty-tl__title">
          No {categoryLabel} records for {petName || "your pet"}
        </h3>
        <p className="empty-tl__subtitle">
          No {categoryLabel.toLowerCase()} notes or reminders recorded yet for {petName || "your pet"}.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 280 }}>
          <button className="empty-tl__cta" onClick={onAddNote} style={{ marginBottom: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add_circle</span>
            Add {categoryLabel}
          </button>
          <button
            type="button"
            className="empty-tl__clear-btn"
            onClick={onClearFilter}
          >
            Show All Timeline Notes ({totalEventsCount})
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="empty-tl">
      <div className="empty-tl__illustration">
        <div className="empty-tl__circle">
          <span className="material-symbols-outlined empty-tl__main-icon">
            clinical_notes
          </span>
        </div>
        {/* Floating decorative paw prints */}
        <span className="material-symbols-outlined empty-tl__float empty-tl__float--1">pets</span>
        <span className="material-symbols-outlined empty-tl__float empty-tl__float--2">favorite</span>
        <span className="material-symbols-outlined empty-tl__float empty-tl__float--3">vaccines</span>
      </div>

      <h3 className="empty-tl__title">
        {petName ? `${petName}'s timeline is empty` : "No health records yet"}
      </h3>
      <p className="empty-tl__subtitle">
        Start recording vaccinations, vet visits, medications, and more. Every note builds a complete health story.
      </p>

      <button className="empty-tl__cta" onClick={onAddNote}>
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add_circle</span>
        Add First Pet Note
      </button>

      <div className="empty-tl__features">
        <div className="empty-tl__feature">
          <span className="material-symbols-outlined empty-tl__feature-icon">vaccines</span>
          <span>Vaccinations</span>
        </div>
        <div className="empty-tl__feature">
          <span className="material-symbols-outlined empty-tl__feature-icon">stethoscope</span>
          <span>Vet Visits</span>
        </div>
        <div className="empty-tl__feature">
          <span className="material-symbols-outlined empty-tl__feature-icon">pill</span>
          <span>Medications</span>
        </div>
        <div className="empty-tl__feature">
          <span className="material-symbols-outlined empty-tl__feature-icon">shield</span>
          <span>Deworming</span>
        </div>
      </div>
    </div>
  );
}
