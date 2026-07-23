import React, { useState } from "react";
import FormSection from "./shared/FormSection";
import ReminderToggle from "./shared/ReminderToggle";
import DocumentUpload from "./shared/DocumentUpload";
import SaveConfirmation from "./shared/SaveConfirmation";
import CustomDatePicker from "./shared/CustomDatePicker";
import { createMedicalEvent, searchClinics, uploadDocument } from "../../../api/timelineApi";

export default function VetVisitForm({ petId, petName, onClose, onSaved }) {
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [vetName, setVetName] = useState("");
  const [examinationNotes, setExaminationNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");

  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [files, setFiles] = useState([]);

  const [clinicsList, setClinicsList] = useState([]);
  const [showClinics, setShowClinics] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [savedData, setSavedData] = useState(null);

  const handleClinicChange = async (val) => {
    setClinicName(val);
    if (val.trim().length > 1) {
      try {
        const res = await searchClinics(val);
        setClinicsList(res.clinics || []);
        setShowClinics(true);
      } catch (e) {
        console.error(e);
      }
    } else {
      setShowClinics(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setSubmitting(true);
    try {
      const categoryEntries = [];

      // Title formatting: "Dr. Name — Clinic Name" or Clinic Name / Dr. Name
      let title = "Vet Visit";
      const cleanVet = vetName ? `Dr. ${vetName.replace(/^Dr\.\s*/i, "")}` : "";
      if (cleanVet && clinicName) {
        title = `${cleanVet} (${clinicName})`;
      } else if (cleanVet) {
        title = cleanVet;
      } else if (clinicName) {
        title = clinicName;
      } else if (reason) {
        title = `Vet Visit — ${reason}`;
      }

      if (diagnosis.trim()) {
        categoryEntries.push({
          category: "diagnosis",
          item_name: title,
          date_logged: visitDate,
          notes: examinationNotes || reason || null,
          category_fields: {
            diagnoses: [
              {
                diagnosis_name: diagnosis.trim(),
                status: "confirmed",
                clinical_notes: examinationNotes || null,
              },
            ],
          },
        });
      } else {
        categoryEntries.push({
          category: "diagnosis",
          item_name: title,
          date_logged: visitDate,
          notes: examinationNotes || reason || null,
        });
      }

      const payload = {
        event_date: visitDate,
        clinic_name: clinicName || null,
        vet_name: vetName || null,
        reason_for_visit: reason,
        overall_notes: examinationNotes || null,
        follow_up_date: reminderEnabled && followUpDate ? followUpDate : null,
        category_entries: categoryEntries,
      };

      const res = await createMedicalEvent(petId, payload);
      const createdEvent = res.event || res;

      if (files.length > 0 && createdEvent.id) {
        for (const f of files) {
          try {
            await uploadDocument(petId, f, "Vet Prescription / Report", createdEvent.id);
          } catch (docErr) {
            console.error("Doc upload error:", docErr);
          }
        }
      }

      setSavedData({
        title: clinicName ? `Vet Visit — ${clinicName}` : "Vet Visit",
        date: visitDate,
        details: [
          { icon: "medical_services", label: reason },
          ...(diagnosis ? [{ icon: "healing", label: `Diagnosis: ${diagnosis}` }] : []),
          ...(followUpDate ? [{ icon: "event", label: `Follow-up: ${followUpDate}` }] : []),
        ],
      });
    } catch (err) {
      console.error("Failed to save vet visit:", err);
      alert("Failed to save vet visit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (savedData) {
    return (
      <SaveConfirmation
        petName={petName}
        categoryLabel="Vet Visit"
        summary={savedData}
        onViewTimeline={onSaved}
        onAddAnother={() => setSavedData(null)}
      />
    );
  }

  return (
    <div className="pn-form-container">
      <div className="pn-form-header">
        <div className="pn-form-header__left">
          <button className="pn-form-header__back" onClick={onClose}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="pn-form-header__title">Add Vet Visit</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <FormSection title="Visit Details" accentColor="#0891b2">
          <div className="pn-grid-2">
            <div className="pn-field">
              <label className="pn-field__label">Visit Date *</label>
              <CustomDatePicker
                value={visitDate}
                onChange={setVisitDate}
                placeholder="Visit Date"
                label="Select Visit Date"
              />
            </div>
            <div className="pn-field">
              <label className="pn-field__label">Vet Name</label>
              <input
                type="text"
                className="pn-input"
                placeholder="Dr. Smith"
                value={vetName}
                onChange={(e) => setVetName(e.target.value)}
              />
            </div>
          </div>

          <div className="pn-field">
            <label className="pn-field__label">Why did you visit? *</label>
            <input
              type="text"
              className="pn-input"
              placeholder="e.g. Routine checkup, fever, limping"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div className="pn-field" style={{ position: "relative" }}>
            <label className="pn-field__label">Clinic / Hospital Name</label>
            <div className="pn-input-wrap">
              <input
                type="text"
                className="pn-input pn-input--with-icon"
                placeholder="Search or enter clinic name"
                value={clinicName}
                onChange={(e) => handleClinicChange(e.target.value)}
              />
              <span className="material-symbols-outlined pn-input-icon">local_hospital</span>
            </div>

            {showClinics && clinicsList.length > 0 && (
              <div className="pn-suggestions">
                {clinicsList.map((c) => (
                  <div
                    key={c.id || c.name}
                    className="pn-suggestion-item"
                    onClick={() => {
                      setClinicName(c.name);
                      setShowClinics(false);
                    }}
                  >
                    {c.name} {c.address ? `(${c.address})` : ""}
                  </div>
                ))}
              </div>
            )}
          </div>
        </FormSection>

        <FormSection title="Diagnosis & Notes" accentColor="#64748b">
          <div className="pn-field">
            <label className="pn-field__label">Diagnosis (If provided by vet)</label>
            <input
              type="text"
              className="pn-input"
              placeholder="e.g. Ear Infection, Mild Gastritis"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
            />
          </div>

          <div className="pn-field">
            <label className="pn-field__label">What did the vet say?</label>
            <textarea
              className="pn-textarea"
              placeholder="Examination notes, vital signs, recommendations..."
              value={examinationNotes}
              onChange={(e) => setExaminationNotes(e.target.value)}
            />
          </div>
        </FormSection>

        <DocumentUpload files={files} onFilesChange={setFiles} label="Upload Prescription / Lab Reports" />

        <ReminderToggle
          enabled={reminderEnabled}
          onToggle={setReminderEnabled}
          dueDate={followUpDate}
          onDueDateChange={setFollowUpDate}
          label="Set Vet Follow-up Date"
        />

        <button type="submit" className="pn-submit-btn" disabled={submitting || !reason.trim()}>
          <span className="material-symbols-outlined">save</span>
          {submitting ? "Saving Visit..." : "Save Vet Visit"}
        </button>
      </form>
    </div>
  );
}
