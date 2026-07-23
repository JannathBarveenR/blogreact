import React, { useState } from "react";
import "./DocumentModal.css";

export default function DocumentModal({ docs = [], initialIndex = 0, onClose }) {
  const documentList = Array.isArray(docs) ? docs : [docs];
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (documentList.length === 0) return null;

  const currentDoc = documentList[currentIndex] || documentList[0];
  const url = typeof currentDoc === "string" ? currentDoc : currentDoc.file_url;
  const label =
    typeof currentDoc === "object"
      ? currentDoc.label || currentDoc.filename || `Prescription ${currentIndex + 1}`
      : `Prescription ${currentIndex + 1}`;
  const fileType = typeof currentDoc === "object" ? currentDoc.file_type || "" : "";
  const isImage = !fileType || fileType.startsWith("image/") || /\.(png|jpg|jpeg|webp)$/i.test(url);

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : documentList.length - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < documentList.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="doc-modal-overlay" onClick={onClose}>
      <div className="doc-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="doc-modal-header">
          <div className="doc-modal-header__left">
            <span className="material-symbols-outlined doc-modal-header__icon">description</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span className="doc-modal-header__title">{label}</span>
              {documentList.length > 1 && (
                <span className="doc-modal-header__count">
                  {currentIndex + 1} of {documentList.length}
                </span>
              )}
            </div>
          </div>

          <div className="doc-modal-header__right">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="doc-modal-open-btn"
              title="Open full document"
            >
              <span className="material-symbols-outlined">open_in_new</span>
            </a>
            <button className="doc-modal-close-btn" onClick={onClose}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Content Viewer with Navigation Controls */}
        <div className="doc-modal-body">
          {documentList.length > 1 && (
            <button className="doc-modal-nav-btn doc-modal-nav-btn--prev" onClick={handlePrev} title="Previous">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
          )}

          {isImage ? (
            <img src={url} alt={label} className="doc-modal-img" />
          ) : (
            <iframe src={url} title={label} className="doc-modal-iframe" />
          )}

          {documentList.length > 1 && (
            <button className="doc-modal-nav-btn doc-modal-nav-btn--next" onClick={handleNext} title="Next">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
