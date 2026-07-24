import React, { useState } from "react";
import { createPortal } from "react-dom";
import "./BottomNav.css";

const ACTIVE = "#84B662";   // brand-teal
const INACTIVE = "#8a948a"; // muted

const NAV_ITEMS = [
  {
    key: "home",
    label: "Home",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? ACTIVE : "none"} stroke={active ? ACTIVE : INACTIVE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <polyline points="9 21 9 12 15 12 15 21" />
      </svg>
    ),
  },
  {
    key: "timeline",
    label: "Timeline",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? ACTIVE : INACTIVE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    key: "add",
    label: "",
    icon: () => null,
    isFab: true,
  },
  {
    key: "medicalrecords",
    label: "Records",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? ACTIVE : INACTIVE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="11" x2="12" y2="17" />
        <line x1="9" y1="14" x2="15" y2="14" />
      </svg>
    ),
  },
  {
    key: "profile",
    label: "Profile",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? ACTIVE : INACTIVE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
];

// Options in the FAB popup. Each has a "key" you can switch on in the
// parent's onFabOptionSelect callback to decide where to navigate.
const FAB_OPTIONS = [
  {
    key: "addPetNote",
    title: "Add Pet Note",
    subtitle: "Log symptoms, vaccinations, or daily notes",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#004b49" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    key: "addPet",
    title: "Add a Pet",
    subtitle: "Create a new profile for your pet",
    icon: (
      <svg width="22" height="22" viewBox="0 0 64 64" fill="#004b49">
        <ellipse cx="32" cy="42" rx="9" ry="7" />
        <ellipse cx="21" cy="32" rx="4" ry="5" />
        <ellipse cx="43" cy="32" rx="4" ry="5" />
        <ellipse cx="26.5" cy="24" rx="3.4" ry="4.5" />
        <ellipse cx="37.5" cy="24" rx="3.4" ry="4.5" />
      </svg>
    ),
  },
  {
    key: "uploadRecords",
    title: "Upload Medical Records",
    subtitle: "Add vaccination or vet documents",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#004b49" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="11" x2="12" y2="17" />
        <line x1="9" y1="14" x2="15" y2="14" />
      </svg>
    ),
  },
];

const BottomNav = ({
  active = "home",
  onNavigate,
  onFabOptionSelect,
  onAddPetNote,
  onAddPet,          // same prop shape as AddPetCard's onAddPet — pass the same function to both
  onAddFamilyAccess,
  onUploadRecords,
}) => {
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleFabClick = () => {
    setSheetOpen(true);
  };

  const handleOptionClick = (optionKey) => {
    setSheetOpen(false);

    if (optionKey === "addPetNote" && onAddPetNote) {
      onAddPetNote();
      return;
    }
    if (optionKey === "addPet" && onAddPet) {
      onAddPet();
      return;
    }
    if (optionKey === "familyAccess" && onAddFamilyAccess) {
      onAddFamilyAccess();
      return;
    }
    if (optionKey === "uploadRecords" && onUploadRecords) {
      onUploadRecords();
      return;
    }

    // fallback: generic dispatcher, for anyone not using the dedicated props above
    if (onFabOptionSelect) onFabOptionSelect(optionKey);
  };

  // The popup itself, rendered separately so it can be portaled out.
  const popup = sheetOpen ? (
    <div className="fabsheet-backdrop" onClick={() => setSheetOpen(false)}>
      <div
        className="fabsheet"
        role="dialog"
        aria-modal="true"
        aria-label="Quick add menu"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fabsheet__handle" />
        <h3 className="fabsheet__title">What would you like to do?</h3>

        <div className="fabsheet__options">
          {FAB_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              className="fabsheet__option"
              onClick={() => handleOptionClick(opt.key)}
            >
              <span className="fabsheet__option-icon">{opt.icon}</span>
              <span className="fabsheet__option-text">
                <span className="fabsheet__option-title">{opt.title}</span>
                <span className="fabsheet__option-subtitle">{opt.subtitle}</span>
              </span>
              <svg
                className="fabsheet__chevron"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8a948a"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>

      </div>
    </div>
  ) : null;

  return (
    <>
      <nav className="bottomnav" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          if (item.isFab) {
            return (
              <button
                key={item.key}
                className="bottomnav__fab"
                aria-label="Add"
                onClick={handleFabClick}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            );
          }

          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              className={`bottomnav__item ${isActive ? "bottomnav__item--active" : ""}`}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onNavigate && onNavigate(item.key)}
            >
              <span className="bottomnav__icon">{item.icon(isActive)}</span>
              <span className="bottomnav__label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Rendered into document.body so a transformed/overflow-hidden
          ancestor elsewhere in the app can't clip or misposition it. */}
      {popup && createPortal(popup, document.body)}
    </>
  );
};

export default BottomNav;