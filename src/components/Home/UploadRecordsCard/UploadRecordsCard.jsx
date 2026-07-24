import React from "react";
import { useNavigate } from "react-router-dom";
import { FileUp, Sparkles, ArrowRight } from "lucide-react";
import "./UploadRecordsCard.css";

export default function UploadRecordsCard({ onNavigateTab }) {
  const navigate = useNavigate();

  const handleCardClick = (e) => {
    e.stopPropagation();
    if (typeof onNavigateTab === "function") {
      onNavigateTab("medicalrecords", { openUpload: true });
    } else {
      navigate("/records", { state: { openUpload: true } });
    }
  };

  return (
    <div className="upload-records-action-card" onClick={handleCardClick}>
      <div className="upload-card-content">
        <div className="upload-card-header">
          <div className="upload-card-icon-wrapper">
            <FileUp size={22} className="upload-card-icon" />
          </div>
          <div className="upload-card-badge">
            <Sparkles size={12} /> AI Analysis Coming soon
          </div>
        </div>

        <div className="upload-card-text">
          <h4 className="upload-card-title">Upload Pet Medical Records</h4>
          <p className="upload-card-desc">
            Keep prescriptions, lab reports &amp; vaccine records organized in one digital pass.
          </p>
        </div>

        <div className="upload-card-footer">
          <button className="upload-card-btn" onClick={handleCardClick}>
            <span>Upload Records Now</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
