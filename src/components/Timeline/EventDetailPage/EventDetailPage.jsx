import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FiArrowLeft, FiCalendar, FiClock, FiFileText, FiUser, FiPhone, FiCheckCircle, FiShield, FiDownload, FiTrash2 } from "react-icons/fi";
import { getMedicalEvent, deleteMedicalEvent } from "../../../api/timelineApi";
import useAuth from "../../../hooks/useAuth";
import { usePets } from "../../../hooks/usePetsQuery";
import { PetAvatar } from "../../common/PetAvatar";
import logoImg from "../../../assets/logo-with-tagline.webp";
import "./EventDetailPage.css";

export default function EventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const statePetId = location.state?.petId;
  const { user } = useAuth();
  const { data: pets = [] } = usePets(user?.id);

  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchDetails() {
      if (!eventId) return;
      try {
        setLoading(true);
        const targetPet = statePetId
          ? pets.find((p) => p.id === statePetId)
          : null;

        const orderedPets = targetPet
          ? [targetPet, ...pets.filter((p) => p.id !== targetPet.id)]
          : pets;

        if (orderedPets.length > 0) {
          let foundData = null;
          for (const pet of orderedPets) {
            try {
              foundData = await getMedicalEvent(pet.id, eventId);
              if (foundData) break;
            } catch (err) {
              // try next pet if not found
            }
          }
          if (foundData) {
            setEventData(foundData);
          } else {
            setError("Medical record not found.");
          }
        } else {
          setError("No pet profile available.");
        }
      } catch (err) {
        console.error("Error fetching event details:", err);
        setError("Could not load medical details.");
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [eventId, pets, statePetId]);

  const handleDeleteRecord = async () => {
    if (!window.confirm("Are you sure you want to delete this medical record? This action cannot be undone.")) {
      return;
    }
    const petId = eventData?.pet_id || pets[0]?.id;
    if (!petId || !eventId) return;

    try {
      setDeleting(true);
      await deleteMedicalEvent(petId, eventId);
      alert("Medical record deleted successfully.");
      navigate("/timeline/home");
    } catch (err) {
      console.error("Failed to delete record:", err);
      alert("Failed to delete medical record. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="ev-detail-page ev-detail-loading">
        <div className="ev-spinner" />
        <p>Loading Prescription & Medical Record…</p>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="ev-detail-page">
        <header className="ev-header">
          <button className="ev-back-btn" onClick={() => navigate(-1)}><FiArrowLeft size={20} /></button>
          <h2>Medical Detail</h2>
        </header>
        <div className="ev-error-card">
          <p>{error || "Medical record not found."}</p>
          <button className="ev-primary-btn" onClick={() => navigate("/timeline/home")}>Return to Timeline</button>
        </div>
      </div>
    );
  }

  const activePet = pets.find((p) => p.id === eventData.pet_id) || pets[0];
  const entries = eventData.category_entries || [];
  const primaryEntry = entries[0] || {};
  const categoryFields = primaryEntry.category_fields || {};
  const medicinesList = categoryFields.medicines_list || [];
  const attachments = eventData.attachments || primaryEntry.attachments || [];

  return (
    <div className="ev-detail-page">
      {/* Top Header */}
      <header className="ev-header">
        <button className="ev-back-btn" onClick={() => navigate(-1)} aria-label="Back">
          <FiArrowLeft size={20} />
        </button>
        <h2>Prescription & Details</h2>
        <img src={logoImg} alt="PetOLife" className="ev-header-logo" />
      </header>

      <main className="ev-body">
        {/* Pet & Parent Card */}
        <div className="ev-card ev-pet-parent-card">
          <div className="ev-pet-row">
            <PetAvatar src={activePet?.pet_photo_url} petType={activePet?.pet_type} size={54} />
            <div>
              <h3 className="ev-pet-name">{activePet?.pet_name || activePet?.name || "Pet"}</h3>
              <span className="ev-pet-id-pill"><FiShield size={12} /> {activePet?.petolife_id || "Petolife ID"}</span>
            </div>
          </div>

          <div className="ev-divider" />

          <div className="ev-parent-info">
            <div className="ev-info-item">
              <FiUser size={15} color="#004b23" />
              <span>Pet Parent: <strong>{user?.user_metadata?.full_name || user?.email || "Parent"}</strong></span>
            </div>
            <div className="ev-info-item">
              <FiCalendar size={15} color="#004b23" />
              <span>Event Date: <strong>{eventData.event_date}</strong></span>
            </div>
          </div>
        </div>

        {/* Medicines / Treatment Breakdown */}
        <div className="ev-card">
          <div className="ev-card-title-row">
            <span className="ev-badge">{primaryEntry.category || "MEDICATION"}</span>
            <span className="ev-date">{eventData.event_date}</span>
          </div>

          <h2 className="ev-main-title">{primaryEntry.item_name || "Prescription Record"}</h2>

          {/* List of Prescribed Medicines */}
          <div className="ev-meds-section">
            <h4 className="ev-section-subtitle">Prescribed Medicines ({medicinesList.length || 1})</h4>
            
            {medicinesList.length > 0 ? (
              medicinesList.map((m, idx) => (
                <div key={m.id || idx} className="ev-med-item">
                  <div className="ev-med-header">
                    <span className="ev-med-name">{idx + 1}. {m.name}</span>
                    <span className="ev-med-type">{m.type}</span>
                  </div>
                  <div className="ev-med-dose">
                    Dosage: <strong>{m.dose_qty} {m.dose_unit}</strong> • {m.frequency} ({m.duration_days} Days)
                  </div>
                  {m.special_instructions && (
                    <div className="ev-med-instructions">Note: {m.special_instructions}</div>
                  )}
                </div>
              ))
            ) : (
              <div className="ev-med-item">
                <div className="ev-med-header">
                  <span className="ev-med-name">{primaryEntry.item_name}</span>
                  <span className="ev-med-type">{categoryFields.medicine_type || "Medication"}</span>
                </div>
                <div className="ev-med-dose">
                  Dose: <strong>{categoryFields.dose || "As prescribed"}</strong> • Duration: {categoryFields.duration || 5} Days
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Prescription Attachment Viewer */}
        {attachments.length > 0 && (
          <div className="ev-card">
            <h4 className="ev-section-subtitle"><FiFileText size={16} /> Prescription Document</h4>
            <div className="ev-attachments-grid">
              {attachments.map((url, i) => (
                <div key={i} className="ev-attachment-wrap">
                  <img src={url} alt={`Prescription ${i + 1}`} className="ev-attachment-img" />
                  <a href={url} target="_blank" rel="noreferrer" className="ev-download-link">
                    <FiDownload size={14} /> View Full Prescription
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <button className="ev-primary-btn" onClick={() => navigate("/reminders")}>
          View Linked Reminders
        </button>

        {/* Delete Medical Record Button */}
        <button
          type="button"
          className="ev-delete-btn"
          onClick={handleDeleteRecord}
          disabled={deleting}
        >
          <FiTrash2 size={16} /> {deleting ? "Deleting Record..." : "Delete Medical Record"}
        </button>
      </main>
    </div>
  );
}
