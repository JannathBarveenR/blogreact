import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import FormSection from "./shared/FormSection";
import ReminderToggle from "./shared/ReminderToggle";
import DocumentUpload from "./shared/DocumentUpload";
import SaveConfirmation from "./shared/SaveConfirmation";
import CustomDatePicker from "./shared/CustomDatePicker";
import CustomStepper from "./shared/CustomStepper";
import CustomTimePicker from "./shared/CustomTimePicker";
import { useQueryClient } from "@tanstack/react-query";
import { timelineKeys } from "../../../hooks/useTimelineQueries";
import { createMedicalEvent, updateMedicalEvent, getVaccines, uploadDocument } from "../../../api/timelineApi";

export default function VaccinationForm({ petId, petName, onClose, onSaved, editData }) {
  const queryClient = useQueryClient();
  const [vaccineName, setVaccineName] = useState("");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [eventTime, setEventTime] = useState("");
  const [doseQty, setDoseQty] = useState("1");
  const [doseUnit, setDoseUnit] = useState("ml");
  const [batchNumber, setBatchNumber] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [vetName, setVetName] = useState("");
  const [notes, setNotes] = useState("");

  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [nextDueDate, setNextDueDate] = useState("");
  const [dueTime, setDueTime] = useState("09:00");
  const [files, setFiles] = useState([]);

  const [vaccinesList, setVaccinesList] = useState([]);
  const [filteredVaccines, setFilteredVaccines] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [savedData, setSavedData] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  // Pre-fill if editing
  useEffect(() => {
    if (!editData) return;
    const catEntry = (editData.category_entries || [])[0] || {};
    const cFields = catEntry.category_fields || {};
    const vDetails = cFields.vaccine_details || {};

    if (editData.event_date || catEntry.date_logged) {
      setEventDate(editData.event_date || catEntry.date_logged);
    }
    setVaccineName(vDetails.vaccine_name || catEntry.item_name || "");
    if (cFields.dose) {
      const parts = cFields.dose.trim().split(" ");
      if (parts.length >= 2) {
        setDoseQty(parts[0]);
        setDoseUnit(parts.slice(1).join(" "));
      } else {
        setDoseQty(cFields.dose);
      }
    }
    if (cFields.given_time || editData.event_time) {
      setEventTime(cFields.given_time || editData.event_time);
    }
    if (cFields.due_time || editData.due_time) {
      setDueTime(cFields.due_time || editData.due_time);
    }
    setBatchNumber(vDetails.batch_number || "");
    setClinicName(cFields.clinic_name || editData.clinic_name || "");
    setVetName(cFields.vet_name || editData.vet_name || "");
    setNotes(catEntry.notes || editData.overall_notes || "");
    const hasNextDue = Boolean(catEntry.next_due_date || editData.next_due_date);
    setReminderEnabled(hasNextDue);
    if (hasNextDue) {
      setNextDueDate(catEntry.next_due_date || editData.next_due_date);
    }
  }, [editData]);

  // Fetch vaccines for reference dropdown
  useEffect(() => {
    getVaccines()
      .then((res) => {
        if (res.vaccines) setVaccinesList(res.vaccines);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleNameChange = (val) => {
    setVaccineName(val);
    if (val.trim()) {
      const matches = vaccinesList.filter((v) =>
        v.vaccine_name.toLowerCase().includes(val.toLowerCase())
      );
      setFilteredVaccines(matches);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectVaccine = (vac) => {
    setVaccineName(vac.vaccine_name);
    setShowSuggestions(false);

    // Auto-calculate next due date if default interval exists
    if (vac.default_interval_days && eventDate) {
      const d = new Date(eventDate + "T00:00:00");
      d.setDate(d.getDate() + vac.default_interval_days);
      setNextDueDate(d.toISOString().split("T")[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vaccineName.trim()) return;

    setSubmitting(true);
    try {
      const categoryEntry = {
        category: "vaccination",
        item_name: vaccineName,
        date_logged: eventDate,
        next_due_date: reminderEnabled && nextDueDate ? nextDueDate : null,
        notes: notes || null,
        category_fields: {
          medicine_type: "vaccine",
          dose: doseQty ? `${doseQty} ${doseUnit}` : null,
          given_time: eventTime || null,
          due_time: reminderEnabled ? dueTime : null,
          vaccine_details: {
            vaccine_name: vaccineName,
            batch_number: batchNumber || null,
          },
        },
      };

      const payload = {
        event_date: eventDate,
        event_time: eventTime || null,
        clinic_name: clinicName || null,
        vet_name: vetName || null,
        category_entries: [categoryEntry],
      };

      if (editData) {
        const targetEventId = editData.id || editData.event_id || editData.medical_event_id;
        await updateMedicalEvent(petId, targetEventId, payload);
        queryClient.invalidateQueries({ queryKey: timelineKeys.all(petId) });
        if (onSaved) onSaved("✓ Vaccination record updated successfully!");
        else if (onClose) onClose();
        return;
      }

      const res = await createMedicalEvent(petId, payload);
      const createdEvent = res.event || res;

      if (files.length > 0 && createdEvent.id) {
        for (const f of files) {
          try {
            await uploadEventRecord(petId, createdEvent.id, f, "Vaccination Certificate");
          } catch (docErr) {
            console.error("Doc upload error:", docErr);
          }
        }
      }

      try {
        queryClient.invalidateQueries({ queryKey: timelineKeys.all(petId) });
      } catch (cErr) {
        console.error("Cache invalidation error:", cErr);
      }

      setSavedData({
        title: vaccineName,
        date: eventDate,
        details: [
          { icon: "vaccines", label: "Vaccination Given" },
          ...(nextDueDate ? [{ icon: "event", label: `Next Due: ${nextDueDate}` }] : []),
        ],
      });
    } catch (err) {
      console.error("Failed to save vaccination:", err);
      alert("Failed to save. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (savedData) {
    return (
      <SaveConfirmation
        petName={petName}
        categoryLabel="Vaccination"
        summary={savedData}
        onViewTimeline={onSaved}
        onAddAnother={() => setSavedData(null)}
      />
    );
  }

  const handleHeaderClose = () => {
    if (editData && isDirty) {
      setShowUnsavedPrompt(true);
    } else {
      onClose();
    }
  };

  return (
    <div className="pn-form-container">
      {toastMessage && (
        <div style={{
          position: "fixed",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          background: "#004b23",
          color: "#ffffff",
          padding: "10px 20px",
          borderRadius: "20px",
          fontWeight: "700",
          fontSize: "14px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span>
          {toastMessage}
        </div>
      )}

      {/* Unsaved Changes Confirmation Modal */}
      {showUnsavedPrompt && createPortal(
        <div className="ev-modal-overlay" onClick={() => setShowUnsavedPrompt(false)}>
          <div className="ev-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <div className="ev-modal-icon-wrap" style={{ background: "#fef3c7", color: "#d97706" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 28 }}>warning</span>
            </div>
            <h3 className="ev-modal-title">Unsaved Changes</h3>
            <p className="ev-modal-desc">
              You have modified this medical record. Would you like to save your updates before leaving?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", marginTop: 8 }}>
              <button
                type="button"
                className="ev-primary-btn"
                style={{ width: "100%", height: 46, borderRadius: 14, fontSize: 15, fontWeight: 700, background: "#004b23", border: "none" }}
                onClick={(e) => {
                  setShowUnsavedPrompt(false);
                  handleSubmit(e);
                }}
              >
                Save Changes
              </button>
              <button
                type="button"
                style={{ width: "100%", height: 46, borderRadius: 14, fontSize: 15, fontWeight: 700, background: "#ef4444", color: "#ffffff", border: "none", cursor: "pointer" }}
                onClick={() => {
                  setShowUnsavedPrompt(false);
                  onClose();
                }}
              >
                Discard Changes
              </button>
              <button
                type="button"
                style={{ background: "transparent", border: "none", color: "#64748b", fontWeight: 600, fontSize: 14, cursor: "pointer", padding: "6px" }}
                onClick={() => setShowUnsavedPrompt(false)}
              >
                Keep Editing
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Header */}
      <div className="pn-form-header">
        <div className="pn-form-header__left">
          <button className="pn-form-header__back" onClick={handleHeaderClose} type="button">
            <span className="material-symbols-outlined">{editData ? "close" : "arrow_back"}</span>
          </button>
          <h2 className="pn-form-header__title">{editData ? "Edit Vaccination" : "Add Vaccination"}</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Core Info */}
        <FormSection title="Vaccine Details" accentColor="#2563eb">
          <div className="pn-field" style={{ position: "relative" }}>
            <label className="pn-field__label">Vaccine Name *</label>
            <div className="pn-input-wrap">
              <input
                type="text"
                className="pn-input pn-input--with-icon"
                placeholder="e.g. Rabies, DHPP"
                value={vaccineName}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
              <span className="material-symbols-outlined pn-input-icon">vaccines</span>
            </div>

            {showSuggestions && filteredVaccines.length > 0 && (
              <div className="pn-suggestions">
                {filteredVaccines.map((vac) => (
                  <div
                    key={vac.id || vac.vaccine_name}
                    className="pn-suggestion-item"
                    onClick={() => handleSelectVaccine(vac)}
                  >
                    {vac.vaccine_name} ({vac.animal_type || "general"})
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pn-grid-2">
            <div className="pn-field">
              <label className="pn-field__label">Date Given</label>
              <CustomDatePicker
                value={eventDate}
                onChange={(d) => { setEventDate(d); setIsDirty(true); }}
                placeholder="Select Date"
                label="Date Vaccination Given"
              />
            </div>
            <div className="pn-field">
              <label className="pn-field__label">Time Given (Optional)</label>
              <CustomTimePicker
                value={eventTime}
                onChange={(t) => { setEventTime(t); setIsDirty(true); }}
                placeholder="Select Time"
                label="Time Vaccination Given"
              />
            </div>
          </div>

          <div className="pn-field">
            <label className="pn-field__label">Dosage & Quantity</label>
            <CustomStepper
              value={doseQty}
              unit={doseUnit}
              onChange={(v) => { setDoseQty(v); setIsDirty(true); }}
              onUnitChange={(u) => { setDoseUnit(u); setIsDirty(true); }}
              allowedUnits={[
                { value: "ml", label: "ml" },
                { value: "dose", label: "dose(s)" },
                { value: "vial", label: "vial(s)" },
                { value: "mg", label: "mg" },
              ]}
            />
          </div>

          <div className="pn-field">
            <label className="pn-field__label">
              Vet / Clinic Name<span className="pn-field__label-optional">(Optional)</span>
            </label>
            <input
              type="text"
              className="pn-input"
              placeholder="e.g. Happy Paws Clinic"
              value={clinicName}
              onChange={(e) => { setClinicName(e.target.value); setIsDirty(true); }}
            />
          </div>
        </FormSection>

        {/* Additional Details */}
        <FormSection title="Additional Details" accentColor="#64748b">
          <div className="pn-grid-2">
            <div className="pn-field">
              <label className="pn-field__label">Batch / Lot Number</label>
              <input
                type="text"
                className="pn-input"
                placeholder="BTCH-9921"
                value={batchNumber}
                onChange={(e) => { setBatchNumber(e.target.value); setIsDirty(true); }}
              />
            </div>
            <div className="pn-field">
              <label className="pn-field__label">Administered By</label>
              <input
                type="text"
                className="pn-input"
                placeholder="Vet / Nurse Name"
                value={vetName}
                onChange={(e) => { setVetName(e.target.value); setIsDirty(true); }}
              />
            </div>
          </div>

          <div className="pn-field">
            <label className="pn-field__label">Notes</label>
            <textarea
              className="pn-textarea"
              placeholder="Any reaction, observations or special instructions..."
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setIsDirty(true); }}
            />
          </div>
        </FormSection>

        {/* Documents */}
        <DocumentUpload files={files} onFilesChange={(f) => { setFiles(f); setIsDirty(true); }} label="Upload Certificate / Prescription" />

        {/* Reminder */}
        <ReminderToggle
          enabled={reminderEnabled}
          onToggle={(v) => { setReminderEnabled(v); setIsDirty(true); }}
          dueDate={nextDueDate}
          onDueDateChange={(d) => { setNextDueDate(d); setIsDirty(true); }}
          dueTime={dueTime}
          onDueTimeChange={(t) => { setDueTime(t); setIsDirty(true); }}
          label="Set Vaccination Booster Due Date"
        />

        {/* Submit */}
        <button type="submit" className="pn-submit-btn" disabled={submitting || !vaccineName.trim()}>
          <span className="material-symbols-outlined">save</span>
          {submitting ? "Saving Vaccination..." : "Save Vaccination"}
        </button>
      </form>
    </div>
  );
}
