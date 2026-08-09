import React from "react";
import { useNavigate } from "react-router-dom";
import { Upload, ChevronRight, Sparkles } from "lucide-react";
import petFolderImg from "../../../assets/Petfolder.png";
import "./UploadRecordsCard.css";

export default function UploadRecordsCard({ onNavigateTab }) {
  const navigate = useNavigate();

  const handleUploadClick = (e) => {
    e.stopPropagation();
    if (typeof onNavigateTab === "function") {
      onNavigateTab("medicalrecords", { openUpload: true });
    } else {
      navigate("/records", { state: { openUpload: true } });
    }
  };

  return (
    <div className="upload-records-card">
      {/* SVG Gooey Filter definition */}
      <svg className="goo-filter-svg" xmlns="http://www.w3.org/2000/svg" version="1.1">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="10" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 21 -7"
              result="goo"
            />
            <feBlend in2="goo" in="SourceGraphic" result="mix" />
          </filter>
        </defs>
      </svg>

      {/* Top right decorative sparkle */}
      <Sparkles className="upload-card-sparkle" size={16} strokeWidth={2} />

      {/* 1. Full-Width Upper Heading Section */}
      <div className="upload-card-header-full">
        <h3 className="upload-card-title-dark">
          Don’t Lose Another{" "}
          <span className="upload-card-title-green">Medical Record</span>
        </h3>
        <div className="upload-title-divider" />
      </div>

      {/* 2. Middle Section: Description Text coupled directly with Image */}
      <div className="upload-card-body-row">
        <p className="upload-card-subtitle">
          Every prescription, vaccination card and report should always be easy to find.
        </p>

        <div className="upload-card-img-container">
          <img
            src={petFolderImg}
            alt="Pet Medical Records Folder"
            className="upload-card-folder-img"
          />
        </div>
      </div>

      {/* 3. Bottom CTA Button Section (Only button handles click) */}
      <div className="upload-card-bottom-bar">
        <button
          className="upload-blob-btn"
          onClick={handleUploadClick}
          type="button"
        >
          <Upload size={17} strokeWidth={2.4} />
          <span>Upload Medical Records</span>
          <ChevronRight size={17} strokeWidth={2.6} />

          <span className="upload-blob-btn__inner">
            <span className="upload-blob-btn__blobs">
              <span className="upload-blob-btn__blob" />
              <span className="upload-blob-btn__blob" />
              <span className="upload-blob-btn__blob" />
              <span className="upload-blob-btn__blob" />
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
