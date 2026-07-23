import React, { useRef } from "react";

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentUpload({ files = [], onFilesChange, label = "Upload Documents / Photos" }) {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length > 0) {
      onFilesChange([...files, ...selected]);
    }
  };

  const handleRemove = (index) => {
    const updated = files.filter((_, i) => i !== index);
    onFilesChange(updated);
  };

  return (
    <div className="pn-field">
      <label className="pn-field__label">{label}</label>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        accept="image/*,.pdf"
        style={{ display: "none" }}
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: "2px dashed #cbd5e1",
          borderRadius: 12,
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          background: "#f8fafc",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 28, color: "#004b49" }}>
          upload_file
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#004b49" }}>
          Choose certificate, prescription or photos
        </span>
        <span style={{ fontSize: 11, color: "#94a3b8" }}>PDF, JPG, PNG up to 10MB</span>
      </div>

      {files.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          {files.map((file, idx) => {
            const isImage = file.type?.startsWith("image/") || /\.(png|jpg|jpeg|webp)$/i.test(file.name);
            const previewUrl = isImage ? URL.createObjectURL(file) : null;

            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: "#ffffff",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#334155",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden", flex: 1 }}>
                  {isImage && previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={file.name}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        objectFit: "cover",
                        flexShrink: 0,
                        border: "1px solid #e2e8f0",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#004b49" }}>
                        description
                      </span>
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: 2, overflow: "hidden" }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 700 }}>
                      {file.name}
                    </span>
                    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    cursor: "pointer",
                    padding: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    close
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
