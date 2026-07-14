import React from "react";
import { useNavigate } from "react-router-dom";
import "./QuickActions.css";

import checklistIcon from "../../../assets/checklist-icon.webp";
import medicalRecordsIcon from "../../../assets/medical-icon.webp";

export default function QuickActions({ onNavigateTab }) {
  const navigate = useNavigate();

  const handleTimeline = () => {
    if (typeof onNavigateTab === "function") {
      onNavigateTab("timeline");
    } else {
      navigate("/home", { state: { tab: "timeline" } });
    }
  };

  const handleRecords = () => {
    if (typeof onNavigateTab === "function") {
      onNavigateTab("medicalrecords");
    } else {
      navigate("/home", { state: { tab: "medicalrecords" } });
    }
  };

  return (
    <section className="quick-actions-section">
      <div className="section-header">
        <h3 className="section-title">Quick Actions</h3>
        <span className="section-sparkle">✦</span>
      </div>

      <div className="quick-actions-grid">
        <div className="action-card action-card--green" onClick={handleTimeline}>
          <div className="action-card-icon action-card-icon--green">
            <img src={checklistIcon} alt="" />
          </div>
          <div className="action-card-content">
            <h4 className="action-card-title action-card-title--green">
              Health Timeline
            </h4>
            <p className="action-card-desc">
              Track care, tasks & important reminders
            </p>
          </div>
          <button
            type="button"
            className="action-card-cta action-card-cta--green"
            onClick={(e) => {
              e.stopPropagation();
              handleTimeline();
            }}
          >
            View timeline
            <span className="action-card-cta-arrow">→</span>
          </button>
        </div>

        <div className="action-card action-card--teal" onClick={handleRecords}>
          <div className="action-card-icon action-card-icon--teal" >
            <img src={medicalRecordsIcon} alt="" />
          </div>
          <div className="action-card-content">
            <h4 className="action-card-title action-card-title--teal">
              Medical Records
            </h4>
            <p className="action-card-desc">
              Upload & store pet medical documents
            </p>
          </div>
          <button
            type="button"
            className="action-card-cta action-card-cta--teal"
            onClick={(e) => {
              e.stopPropagation();
              handleRecords();
            }}
          >
            View records
            <span className="action-card-cta-arrow">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}