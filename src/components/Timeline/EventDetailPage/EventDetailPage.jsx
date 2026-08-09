import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FiArrowLeft, FiCalendar, FiClock, FiFileText, FiUser, FiPhone, FiCheckCircle, FiShield, FiDownload, FiTrash2, FiEdit2, FiSave, FiX } from "react-icons/fi";
import { getMedicalEvent, deleteMedicalEvent, updateMedicalEvent } from "../../../api/timelineApi";
import { useQueryClient } from "@tanstack/react-query";
import { timelineKeys } from "../../../hooks/useTimelineQueries";
import useAuth from "../../../hooks/useAuth";
import { usePets } from "../../../hooks/usePetsQuery";
import { PetAvatar } from "../../common/PetAvatar";
import logoImg from "../../../assets/logo-with-tagline.webp";
import MedicationForm from "../Forms/MedicationForm";
import VetVisitForm from "../Forms/VetVisitForm";
import VaccinationForm from "../Forms/VaccinationForm";
import DewormingForm from "../Forms/DewormingForm";
import OtherForm from "../Forms/OtherForm";
import AppFooterSpacer from "../../common/AppFooterSpacer/AppFooterSpacer";
import "./EventDetailPage.css";

export default function EventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const statePetId = location.state?.petId;
  const { user } = useAuth();
  const { data: pets = [] } = usePets(user?.id);
  const queryClient = useQueryClient();

  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Modal & Toast states
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

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

  const confirmDeleteRecord = async () => {
    const petId = eventData?.pet_id || pets[0]?.id;
    if (!petId || !eventId) return;

    try {
      setDeleting(true);
      await deleteMedicalEvent(petId, eventId);
      try {
        queryClient.invalidateQueries({ queryKey: timelineKeys.all(petId) });
      } catch (cacheErr) {
        console.error(cacheErr);
      }
      setShowDeleteModal(false);
      setToastMsg("✓ Medical record deleted successfully!");
      setTimeout(() => {
        navigate("/timeline/home");
      }, 1200);
    } catch (err) {
      console.error("Failed to delete record:", err);
      setShowDeleteModal(false);
      setToastMsg("⚠️ Failed to delete medical record.");
      setTimeout(() => setToastMsg(""), 3500);
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

  const renderEditForm = () => {
    const cat = (primaryEntry.category || "medication").toLowerCase();
    const petId = eventData?.pet_id || pets[0]?.id;
    const petName = activePet?.pet_name || activePet?.name || "Pet";

    const commonProps = {
      petId,
      petName,
      editData: eventData,
      onClose: () => setIsEditing(false),
      onSaved: (msg) => {
        setIsEditing(false);
        setToastMsg(msg || "✓ Record updated successfully!");
        setTimeout(() => setToastMsg(""), 3500);
        getMedicalEvent(petId, eventId).then((data) => {
          if (data) setEventData(data);
        }).catch(() => {});
      },
    };

    if (cat === "medication") return <MedicationForm {...commonProps} />;
    if (cat === "diagnosis" || cat === "vet_visit") return <VetVisitForm {...commonProps} />;
    if (cat === "vaccination") return <VaccinationForm {...commonProps} />;
    if (cat === "deworming") return <DewormingForm {...commonProps} />;
    return <OtherForm {...commonProps} />;
  };

  if (isEditing) {
    return (
      <div className="ev-detail-page ev-detail-edit-mode">
        {renderEditForm()}
        {toastMsg && createPortal(
          <div className="ev-toast-popup">
            <span className="material-symbols-outlined">check_circle</span>
            <span>{toastMsg}</span>
          </div>,
          document.body
        )}
      </div>
    );
  }

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
        {/* Pet Card (Photo & Name only) */}
        <div className="ev-card ev-pet-parent-card">
          <div className="ev-pet-row">
            <div className="ev-square-pet-avatar">
              {activePet?.pet_photo_url ? (
                <img src={activePet.pet_photo_url} alt={activePet?.pet_name || activePet?.name || "Pet"} />
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: "#004b23" }}>pets</span>
              )}
            </div>
            <div>
              <h3 className="ev-pet-name">{activePet?.pet_name || activePet?.name || "Pet"}</h3>
              <span className="ev-pet-id-pill"><FiShield size={12} /> {activePet?.petolife_id || "Petolife ID"}</span>
            </div>
          </div>
        </div>

        {/* Record Detail Card */}
        <div className="ev-card">
          <div className="ev-card-title-row">
            <span className="ev-badge">{primaryEntry.category || "MEDICATION"}</span>
            <button
              type="button"
              className="ev-pencil-btn"
              onClick={() => setIsEditing(true)}
              title="Edit Record"
            >
              <FiEdit2 size={15} />
            </button>
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

        {/* Delete Medical Record Button */}
        <button
          type="button"
          className="ev-delete-btn"
          onClick={() => setShowDeleteModal(true)}
          disabled={deleting}
        >
          <FiTrash2 size={16} /> {deleting ? "Deleting Record..." : "Delete Medical Record"}
        </button>
      </main>
      <AppFooterSpacer />

      {/* In-App Toast Notification */}
      {toastMsg && createPortal(
        <div className="ev-toast-popup">
          <span className="material-symbols-outlined">check_circle</span>
          <span>{toastMsg}</span>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && createPortal(
        <div className="ev-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="ev-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="ev-modal-icon-wrap">
              <FiTrash2 size={26} />
            </div>
            <h3 className="ev-modal-title">Delete Medical Record?</h3>
            <p className="ev-modal-desc">
              Are you sure you want to delete this medical record? This action cannot be undone.
            </p>
            <div className="ev-modal-actions">
              <button
                type="button"
                className="ev-modal-cancel-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ev-modal-delete-btn"
                onClick={confirmDeleteRecord}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
