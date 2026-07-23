import React, { useEffect } from "react";
import "./SaveConfirmation.css";

export default function SaveConfirmation({ petName, categoryLabel, summary, onViewTimeline, onAddAnother }) {
  useEffect(() => {
    // Simple confetti effect
    const container = document.getElementById("confetti-box");
    if (!container) return;

    const colors = ["#004b49", "#86c540", "#f59e0b", "#3b82f6", "#ec4899"];
    for (let i = 0; i < 30; i++) {
      const p = document.createElement("div");
      p.className = "confetti-piece";
      p.style.left = `${Math.random() * 100}%`;
      p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      p.style.animationDelay = `${Math.random() * 0.4}s`;
      p.style.animationDuration = `${1.2 + Math.random() * 0.8}s`;
      container.appendChild(p);
    }
  }, []);

  return (
    <div className="save-conf">
      <div id="confetti-box" className="save-conf__confetti-box" />

      <div className="save-conf__icon-circle">
        <span className="material-symbols-outlined save-conf__icon">check_circle</span>
      </div>

      <h2 className="save-conf__title">Success!</h2>
      <p className="save-conf__subtitle">
        Added to {petName ? `${petName}'s` : "your pet's"} Health Timeline
      </p>

      {/* Card Summary */}
      <div className="save-conf__card">
        <div className="save-conf__badge">{categoryLabel || "Paw Note"}</div>
        <h3 className="save-conf__card-title">{summary?.title || "Health Note Recorded"}</h3>
        <p className="save-conf__card-date">{summary?.date || "Today"}</p>

        {summary?.details && (
          <div className="save-conf__details">
            {summary.details.map((item, idx) => (
              <div key={idx} className="save-conf__detail-item">
                <span className="material-symbols-outlined save-conf__detail-icon">{item.icon || "info"}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Stack */}
      <div className="save-conf__actions">
        <button className="save-conf__btn save-conf__btn--primary" onClick={onViewTimeline}>
          View in Timeline
        </button>
        <button className="save-conf__btn save-conf__btn--secondary" onClick={onAddAnother}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
          Add Another Paw Note
        </button>
      </div>
    </div>
  );
}
