import React from "react";
import "./TimelineCard.css";

/* Map category → visual config */
const CATEGORY_CONFIG = {
  vaccination: { icon: "vaccines", label: "Vaccination", color: "#2563eb", bg: "#eff6ff" },
  medication: { icon: "pill", label: "Medication", color: "#7c3aed", bg: "#f5f3ff" },
  deworming: { icon: "shield", label: "Deworming", color: "#059669", bg: "#ecfdf5" },
  diagnosis: { icon: "stethoscope", label: "Vet Visit", color: "#0891b2", bg: "#ecfeff" },
  anti_tick_flea: { icon: "bug_report", label: "Anti-Tick", color: "#d97706", bg: "#fffbeb" },
  grooming: { icon: "auto_awesome", label: "Grooming", color: "#db2777", bg: "#fdf2f8" },
  other: { icon: "more_horiz", label: "Other", color: "#64748b", bg: "#f8fafc" },
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateShort(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr.includes("T") ? dateStr : dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatDateFull(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr.includes("T") ? dateStr : dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function TimelineCard({ entry, onClick, onPreviewDoc }) {
  const cat = entry.category || "other";
  const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.other;

  const docs = entry.documents || [];
  const attachUrls = entry.attachments || [];
  const allDocs = docs.length > 0 ? docs : attachUrls;
  const primaryDoc = docs[0] || (typeof attachUrls[0] === "string" ? attachUrls[0] : null);
  const primaryDocUrl = typeof primaryDoc === "string" ? primaryDoc : primaryDoc?.file_url;
  const isDocImage =
    typeof primaryDoc === "object"
      ? primaryDoc?.file_type?.startsWith("image/") || /\.(png|jpg|jpeg|webp)$/i.test(primaryDocUrl || "")
      : /\.(png|jpg|jpeg|webp)$/i.test(primaryDocUrl || "");
  const totalAttachments = allDocs.length;

  const nextDue = entry.next_due_date;
  const status = entry.status;

  // Title formatting: For Medication, display exact date added; for Vet Visit, show Doctor & Clinic
  let displayTitle = entry.item_name;
  if (cat === "medication") {
    displayTitle = formatDateFull(entry.date_logged || entry.date || entry.event_date) || entry.item_name;
  } else if (cat === "diagnosis") {
    const vet = entry.vet_name ? `Dr. ${entry.vet_name.replace(/^Dr\.\s*/i, "")}` : "";
    const clinic = entry.clinic_name || "";
    if (vet && clinic) {
      displayTitle = `${vet} (${clinic})`;
    } else if (vet) {
      displayTitle = vet;
    } else if (clinic) {
      displayTitle = clinic;
    }
  }

  const handleOpenDoc = (e) => {
    e.stopPropagation();
    if (allDocs.length > 0) {
      onPreviewDoc?.(allDocs);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(entry);
    } else {
      const targetId = entry.event_id || entry.medical_event_id || entry.id || entry.visit_group_id;
      if (targetId) {
        window.location.href = `/timeline/event/${targetId}`;
      }
    }
  };

  return (
    <div className="tl-card" onClick={handleCardClick} role="button" tabIndex={0}>
      {/* Left Accent Bar */}
      <div className="tl-card__accent" style={{ background: config.color }} />

      {/* 80% Left Column / 20% Right Column Grid */}
      <div className="tl-card__split">
        {/* 80% LEFT SIDE */}
        <div className="tl-card__left">
          {/* Header Badge & Icon */}
          <div className="tl-card__header">
            <div className="tl-card__icon-wrap" style={{ background: config.bg, color: config.color }}>
              <span className="material-symbols-outlined tl-card__icon">{config.icon}</span>
            </div>
            <span className="tl-card__badge" style={{ background: config.bg, color: config.color }}>
              {config.label}
            </span>
          </div>

          {/* Main Info */}
          <div className="tl-card__info">
            <h4 className="tl-card__title">{displayTitle}</h4>

            {entry.reason_for_visit && cat === "diagnosis" && (
              <p className="tl-card__reason">
                <span className="material-symbols-outlined tl-card__reason-icon">medical_services</span>
                Reason: {entry.reason_for_visit}
              </p>
            )}

            {entry.notes && (
              <p className="tl-card__notes">
                {entry.notes.length > 90 ? entry.notes.slice(0, 90) + "…" : entry.notes}
              </p>
            )}
          </div>

          {/* Footer Tags */}
          <div className="tl-card__footer">
            {status && (
              <span className={`tl-card__status tl-card__status--${status}`}>
                {status.replace(/_/g, " ")}
              </span>
            )}

            {entry.treatment?.dose && (
              <span className="tl-card__tag">
                <span className="material-symbols-outlined tl-card__tag-icon">science</span>
                {entry.treatment.dose}
              </span>
            )}

            {entry.treatment?.frequency && entry.treatment.frequency.length > 0 && (
              <span className="tl-card__tag">
                <span className="material-symbols-outlined tl-card__tag-icon">schedule</span>
                {Array.isArray(entry.treatment.frequency)
                  ? entry.treatment.frequency.join(", ")
                  : entry.treatment.frequency}
              </span>
            )}

            {nextDue && (
              <span className="tl-card__tag tl-card__tag--due">
                <span className="material-symbols-outlined tl-card__tag-icon">event</span>
                Due {formatDateShort(nextDue)}
              </span>
            )}
          </div>
        </div>

        {/* 20% RIGHT SIDE (Portrait Orientation) */}
        <div className="tl-card__right">
          <span className="tl-card__date">{formatDate(entry.date_logged)}</span>

          {primaryDocUrl ? (
            <button
              type="button"
              className="tl-card__rx-portrait"
              onClick={handleOpenDoc}
              title="Preview Document / Photo"
            >
              {isDocImage ? (
                <div className="tl-card__rx-thumb-wrap">
                  <img src={primaryDocUrl} alt="Document" className="tl-card__rx-thumb" />
                  {totalAttachments > 1 && (
                    <span className="tl-card__rx-count-badge">+{totalAttachments - 1}</span>
                  )}
                </div>
              ) : (
                <div className="tl-card__rx-file-card">
                  <span className="material-symbols-outlined tl-card__rx-file-icon">description</span>
                  {totalAttachments > 1 && (
                    <span className="tl-card__rx-count-badge">+{totalAttachments - 1}</span>
                  )}
                </div>
              )}
            </button>
          ) : (
            <div className="tl-card__right-spacer" />
          )}
        </div>
      </div>
    </div>
  );
}
