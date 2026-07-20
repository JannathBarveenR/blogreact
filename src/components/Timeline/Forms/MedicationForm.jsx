import React, { useState, useEffect } from "react";
import FormSection from "./shared/FormSection";
import ReminderToggle from "./shared/ReminderToggle";
import DocumentUpload from "./shared/DocumentUpload";
import SaveConfirmation from "./shared/SaveConfirmation";
import CustomSelect from "./shared/CustomSelect";
import CustomDatePicker from "./shared/CustomDatePicker";
import { createMedicalEvent, searchMedicines, uploadDocument } from "../../../api/timelineApi";

const MEDICINE_TYPES = [
  { value: "tablet", label: "Tablet / Pill" },
  { value: "syrup", label: "Syrup / Liquid" },
  { value: "eye_drop", label: "Drops (Eye/Ear)" },
  { value: "injection", label: "Injection" },
  { value: "ointment", label: "Ointment / Topical" },
];

const TYPE_TO_DEFAULT_UNIT = {
  tablet: "tablet",
  syrup: "ml",
  eye_drop: "drops",
  injection: "ml",
  ointment: "apply",
};

const UNIT_OPTIONS = [
  { value: "tablet", label: "tablet(s)" },
  { value: "ml", label: "ml" },
  { value: "drops", label: "drop(s)" },
  { value: "mg", label: "mg" },
  { value: "tsp", label: "tsp" },
  { value: "apply", label: "apply" },
];

const FREQUENCY_OPTIONS = [
  { value: "Daily (Once)", label: "Once Daily" },
  { value: "Twice Daily", label: "Twice Daily (Morning/Night)" },
  { value: "Thrice Daily", label: "Thrice Daily" },
  { value: "As Needed", label: "As Needed" },
];

const FOOD_RELATION_OPTIONS = [
  { value: "after_food", label: "After Food" },
  { value: "before_food", label: "Before Food" },
  { value: "with_food", label: "With Food" },
];

export default function MedicationForm({ petId, petName, onClose, onSaved }) {
  const [medName, setMedName] = useState("");
  const [medType, setMedType] = useState("tablet");
  const [doseQty, setDoseQty] = useState("1");
  const [doseUnit, setDoseUnit] = useState("tablet");

  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [durationDays, setDurationDays] = useState(5);
  const [frequency, setFrequency] = useState("Daily (Once)");
  const [foodRelation, setFoodRelation] = useState("after_food");
  const [notes, setNotes] = useState("");

  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [nextDueDate, setNextDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split("T")[0];
  });

  const [files, setFiles] = useState([]);
  const [medsList, setMedsList] = useState([]);
  const [showMeds, setShowMeds] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [savedData, setSavedData] = useState(null);

  // Auto-switch default dose unit when medicine type changes
  const handleMedTypeChange = (newType) => {
    setMedType(newType);
    if (TYPE_TO_DEFAULT_UNIT[newType]) {
      setDoseUnit(TYPE_TO_DEFAULT_UNIT[newType]);
    }
  };

  // Update next due date when start date or duration changes
  useEffect(() => {
    if (startDate && durationDays) {
      const start = new Date(startDate + "T00:00:00");
      const end = new Date(start);
      end.setDate(end.getDate() + Number(durationDays));
      setNextDueDate(end.toISOString().split("T")[0]);
    }
  }, [startDate, durationDays]);

  const handleMedChange = async (val) => {
    setMedName(val);
    if (val.trim().length > 1) {
      try {
        const res = await searchMedicines(val);
        setMedsList(res.medicines || []);
        setShowMeds(true);
      } catch (e) {
        console.error(e);
      }
    } else {
      setShowMeds(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!medName.trim()) return;

    setSubmitting(true);
    try {
      const combinedDose = doseQty ? `${doseQty} ${doseUnit}` : "";

      const categoryEntry = {
        category: "medication",
        item_name: medName.trim(),
        date_logged: startDate,
        next_due_date: reminderEnabled && nextDueDate ? nextDueDate : null,
        notes: notes || null,
        category_fields: {
          medicine_type: medType,
          dose: combinedDose || null,
          frequency: [frequency],
          food_relation: foodRelation,
          duration: Number(durationDays),
          duration_unit: "days",
        },
      };

      const payload = {
        event_date: startDate,
        category_entries: [categoryEntry],
      };

      const res = await createMedicalEvent(petId, payload);
      const createdEvent = res.event || res;

      if (files.length > 0 && createdEvent.id) {
        for (const f of files) {
          try {
            await uploadDocument(petId, f, "Prescription", createdEvent.id);
          } catch (docErr) {
            console.error("Doc upload error:", docErr);
          }
        }
      }

      setSavedData({
        title: medName.trim(),
        date: startDate,
        details: [
          { icon: "pill", label: `Dose: ${combinedDose || "Prescribed"}` },
          { icon: "schedule", label: `${durationDays} Days (${frequency})` },
          ...(reminderEnabled && nextDueDate ? [{ icon: "event", label: `End Date: ${nextDueDate}` }] : []),
        ],
      });
    } catch (err) {
      console.error("Failed to save medication:", err);
      alert("Failed to save medication. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (savedData) {
    return (
      <SaveConfirmation
        petName={petName}
        categoryLabel="Medication"
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
          <h2 className="pn-form-header__title">Add Medication</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <FormSection title="Medicine Information" accentColor="#7c3aed">
          <div className="pn-field" style={{ position: "relative" }}>
            <label className="pn-field__label">Medicine Name *</label>
            <div className="pn-input-wrap">
              <input
                type="text"
                className="pn-input pn-input--with-icon"
                placeholder="e.g. Amoxyclav, Meloxicam"
                value={medName}
                onChange={(e) => handleMedChange(e.target.value)}
                required
              />
              <span className="material-symbols-outlined pn-input-icon">pill</span>
            </div>

            {showMeds && medsList.length > 0 && (
              <div className="pn-suggestions">
                {medsList.map((m) => (
                  <div
                    key={m.id || m.brand_name}
                    className="pn-suggestion-item"
                    onClick={() => {
                      setMedName(m.brand_name);
                      if (m.medicine_type) handleMedTypeChange(m.medicine_type);
                      setShowMeds(false);
                    }}
                  >
                    {m.brand_name} {m.strength ? `(${m.strength})` : ""}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pn-grid-2">
            <div className="pn-field">
              <label className="pn-field__label">Medicine Type</label>
              <CustomSelect
                value={medType}
                options={MEDICINE_TYPES}
                onChange={handleMedTypeChange}
              />
            </div>

            <div className="pn-field">
              <label className="pn-field__label">Dosage</label>
              <div style={{ display: "flex", gap: 6, width: "100%" }}>
                <input
                  type="text"
                  className="pn-input"
                  style={{ flex: "1 1 50px", minWidth: 0, padding: "12px 10px" }}
                  placeholder="e.g. 1"
                  value={doseQty}
                  onChange={(e) => setDoseQty(e.target.value)}
                />
                <div style={{ flex: "1 1 95px", minWidth: 0 }}>
                  <CustomSelect
                    value={doseUnit}
                    options={UNIT_OPTIONS}
                    onChange={setDoseUnit}
                  />
                </div>
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection title="Schedule & Timing" accentColor="#64748b">
          <div className="pn-grid-2">
            <div className="pn-field">
              <label className="pn-field__label">Start Date</label>
              <CustomDatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="Start Date"
                label="Select Start Date"
              />
            </div>

            <div className="pn-field">
              <label className="pn-field__label">Duration (Days)</label>
              <input
                type="number"
                min="1"
                max="365"
                className="pn-input"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
              />
            </div>
          </div>

          <div className="pn-grid-2">
            <div className="pn-field">
              <label className="pn-field__label">Frequency</label>
              <CustomSelect
                value={frequency}
                options={FREQUENCY_OPTIONS}
                onChange={setFrequency}
              />
            </div>

            <div className="pn-field">
              <label className="pn-field__label">Food Relation</label>
              <CustomSelect
                value={foodRelation}
                options={FOOD_RELATION_OPTIONS}
                onChange={setFoodRelation}
              />
            </div>
          </div>

          <div className="pn-field">
            <label className="pn-field__label">Special Instructions</label>
            <textarea
              className="pn-textarea"
              placeholder="e.g. Keep refrigerated, mix with curd..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </FormSection>

        <DocumentUpload files={files} onFilesChange={setFiles} label="Upload Prescription" />

        <ReminderToggle
          enabled={reminderEnabled}
          onToggle={setReminderEnabled}
          dueDate={nextDueDate}
          onDueDateChange={setNextDueDate}
          label="Enable Daily Dose Reminders"
        />

        <button type="submit" className="pn-submit-btn" disabled={submitting || !medName.trim()}>
          <span className="material-symbols-outlined">save</span>
          {submitting ? "Saving Medication..." : "Save Medication"}
        </button>
      </form>
    </div>
  );
}
