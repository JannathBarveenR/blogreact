import React from "react";
import { useNavigate } from "react-router-dom";
import { Upload, ChevronRight, Lock } from "lucide-react";
import rcrdCardImg from "../../../assets/rcrdcard.jpeg";
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
    <div className="upload-records-card-wrapper" onClick={handleCardClick}>
      {/* Main Design Image */}
      <img
        src={rcrdCardImg}
        alt="Upload Pet Health Records"
        className="upload-records-main-img"
      />

      {/* CTA Button & Trust Tagline Overlay */}
      <div className="upload-records-overlay-container">
        <button
          className="upload-my-records-btn"
          onClick={handleCardClick}
          type="button"
        >
          <Upload size={18} strokeWidth={2.5} />
          <span>Upload My Records</span>
          <ChevronRight size={18} strokeWidth={2.8} />
        </button>

        <div className="upload-records-trust-tagline">
          <Lock size={12} className="trust-lock-icon" strokeWidth={2.5} />
          <span>Safe · Secure · Always With You</span>
        </div>
      </div>
    </div>
  );
}
