import React, { useState, useEffect } from "react";
import FormSection from "./shared/FormSection";
import ReminderToggle from "./shared/ReminderToggle";
import DocumentUpload from "./shared/DocumentUpload";
import SaveConfirmation from "./shared/SaveConfirmation";
import CustomDatePicker from "./shared/CustomDatePicker";
import { createMedicalEvent, getVaccines, uploadEventRecord } from "../../../api/timelineApi";

export default function VaccinationForm({ petId, petName, onClose, onSaved }) {
  const [vaccineName, setVaccineName] = useState("");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [dose, setDose] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [vetName, setVetName] = useState("");
  const [notes, setNotes] = useState("");

  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [nextDueDate, setNextDueDate] = useState("");
  const [files, setFiles] = useState([]);

  const [vaccinesList, setVaccinesList] = useState([]);
  const [filteredVaccines, setFilteredVaccines] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [savedData, setSavedData] = useState(null);

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
          dose: dose || null,
          vaccine_details: {
            vaccine_name: vaccineName,
            batch_number: batchNumber || null,
          },
        },
      };

      const payload = {
        event_date: eventDate,
        clinic_name: clinicName || null,
        vet_name: vetName || null,
        category_entries: [categoryEntry],
      };

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

  return (
    <div className="pn-form-container">
      {/* Header */}
      <div className="pn-form-header">
        <div className="pn-form-header__left">
          <button className="pn-form-header__back" onClick={onClose}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="pn-form-header__title">Add Vaccination</h2>
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
                onChange={setEventDate}
                placeholder="Select Date"
                label="Date Vaccination Given"
              />
            </div>
            <div className="pn-field">
              <label className="pn-field__label">
                Dose<span className="pn-field__label-optional">(Optional)</span>
              </label>
              <input
                type="text"
                className="pn-input"
                placeholder="e.g. 1.0 ml"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
              />
            </div>
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
              onChange={(e) => setClinicName(e.target.value)}
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
                onChange={(e) => setBatchNumber(e.target.value)}
              />
            </div>
            <div className="pn-field">
              <label className="pn-field__label">Administered By</label>
              <input
                type="text"
                className="pn-input"
                placeholder="Vet / Nurse Name"
                value={vetName}
                onChange={(e) => setVetName(e.target.value)}
              />
            </div>
          </div>

          <div className="pn-field">
            <label className="pn-field__label">Notes</label>
            <textarea
              className="pn-textarea"
              placeholder="Any reaction, observations or special instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </FormSection>

        {/* Documents */}
        <DocumentUpload files={files} onFilesChange={setFiles} label="Upload Certificate / Prescription" />

        {/* Reminder */}
        <ReminderToggle
          enabled={reminderEnabled}
          onToggle={setReminderEnabled}
          dueDate={nextDueDate}
          onDueDateChange={setNextDueDate}
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
