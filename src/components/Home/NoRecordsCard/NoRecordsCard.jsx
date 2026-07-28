import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import "./NoRecordsCard.css";
import noRecordsIcon from "./no-records-icon.png";
import fetchWithAuth from "../../../utils/fetchWithAuth";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function NoRecordsCard({ selectedPet, onNavigateTab }) {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewFile, setViewFile] = useState(null);

  const petId = selectedPet?.id || selectedPet?.pet_profile_id;

  useEffect(() => {
    if (!petId) return;
    let isMounted = true;

    const fetchPetRecords = async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth(`/api/v2/pets/${petId}/records?log=0`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setRecords(data || []);
        }
      } catch (err) {
        console.error("Error fetching records for PetHome summary:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchPetRecords();
    return () => { isMounted = false; };
  }, [petId]);

  const handleGoToRecords = () => {
    if (typeof onNavigateTab === "function") {
      onNavigateTab("medicalrecords");
    } else {
      navigate("/home", { state: { tab: "medicalrecords" } });
    }
  };

  if (records.length > 0) {
    return (
      <div className="no-records-card active-records-summary">
        <div className="summary-header">
          <div>
            <h4 className="no-records-title">Medical Records</h4>
            <p className="no-records-desc" style={{ maxWidth: "100%", textAlign: "left", marginTop: 2 }}>
              {records.length} document{records.length > 1 ? "s" : ""} saved
            </p>
          </div>
          <button className="view-all-btn" onClick={handleGoToRecords}>
            View All →
          </button>
        </div>

        <div className="summary-list">
          {records.slice(0, 3).map((rec) => (
            <div key={rec.id} className="summary-item" onClick={() => setViewFile(rec)}>
              <span className="summary-badge">{rec.category}</span>
              <span className="summary-title">{rec.title || rec.label}</span>
              <span className="summary-date">
                {rec.created_at ? new Date(rec.created_at).toLocaleDateString() : ""}
              </span>
            </div>
          ))}
        </div>

        {viewFile && (
          <div className="file-view-overlay" onClick={() => setViewFile(null)}>
            <div className="file-view-card" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setViewFile(null)}>
                <X size={22} />
              </button>

              <div className="file-view-content">
                {/\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i.test(viewFile.file_url || viewFile.storage_path || "") ? (
                  <img src={viewFile.file_url} alt="Preview" />
                ) : (
                  <iframe
                    src={`${viewFile.file_url}#toolbar=0&navpanes=0`}
                    title="PDF"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="no-records-card">
      <div className="no-records-icon">
        <img src={noRecordsIcon} alt="No Records" />
      </div>

      <h4 className="no-records-title">No Medical Records Yet</h4>

      <p className="no-records-desc">
        Upload your pet's medical documents to keep everything safe and organized.
      </p>

      <button className="upload-btn" onClick={handleGoToRecords}>
        Upload Records <span className="upload-plus">+</span>
      </button>
    </div>
  );
}