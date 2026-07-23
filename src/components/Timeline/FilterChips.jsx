import React from "react";
import "./FilterChips.css";

const CATEGORIES = [
  { key: "all", label: "All", icon: "grid_view" },
  { key: "vaccination", label: "Vaccination", icon: "vaccines" },
  { key: "medication", label: "Medication", icon: "pill" },
  { key: "deworming", label: "Deworming", icon: "shield" },
  { key: "diagnosis", label: "Vet Visit", icon: "stethoscope" },
  { key: "grooming", label: "Grooming", icon: "auto_awesome" },
  { key: "other", label: "Other", icon: "more_horiz" },
];

export default function FilterChips({ activeFilter = "all", onFilterChange }) {
  return (
    <div className="filter-chips-wrapper">
      <div className="filter-chips-scroll">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            className={`filter-chip ${activeFilter === cat.key ? "filter-chip--active" : ""}`}
            onClick={() => onFilterChange?.(cat.key)}
          >
            <span className="filter-chip__icon material-symbols-outlined">
              {cat.icon}
            </span>
            <span className="filter-chip__label">{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
