import React, { useState } from "react";
import FormSection from "./shared/FormSection";
import ReminderToggle from "./shared/ReminderToggle";
import DocumentUpload from "./shared/DocumentUpload";
import SaveConfirmation from "./shared/SaveConfirmation";
import CustomSelect from "./shared/CustomSelect";
import CustomDatePicker from "./shared/CustomDatePicker";
import { useQueryClient } from "@tanstack/react-query";
import { timelineKeys } from "../../../hooks/useTimelineQueries";
import { createMedicalEvent, uploadDocument } from "../../../api/timelineApi";

const GIVEN_AT_OPTIONS = [
  { value: "home", label: "Home" },
  { value: "clinic", label: "Vet Clinic" },
];

export default function DewormingForm({ petId, petName, onClose, onSaved }) {
  const queryClient = useQueryClient();
  const [medName, setMedName] = useState("");
  const [givenDate, setGivenDate] = useState(new Date().toISOString().split("T")[0]);
  const [dose, setDose] = useState("");
  const [weight, setWeight] = useState("");
  const [givenAt, setGivenAt] = useState("home");
  const [notes, setNotes] = useState("");

  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [nextDueDate, setNextDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().split("T")[0];
  });
  const [files, setFiles] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [savedData, setSavedData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!medName.trim()) return;

    setSubmitting(true);
    try {
      const categoryEntry = {
        category: "deworming",
        item_name: medName.trim(),
        date_logged: givenDate,
        next_due_date: reminderEnabled && nextDueDate ? nextDueDate : null,
        notes: notes || null,
        category_fields: {
          dose: dose || null,
          weight: weight ? parseFloat(weight) : null,
          given_at: givenAt,
        },
      };

      const payload = {
        event_date: givenDate,
        category_entries: [categoryEntry],
      };

      const res = await createMedicalEvent(petId, payload);
      const createdEvent = res.event || res;

      if (files.length > 0 && createdEvent.id) {
        for (const f of files) {
          try {
            await uploadDocument(petId, f, "Deworming Prescription / Photo", createdEvent.id);
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
        title: medName.trim(),
        date: givenDate,
        details: [
          { icon: "shield", label: `Given At: ${givenAt === "home" ? "Home" : "Vet Clinic"}` },
          ...(nextDueDate ? [{ icon: "event", label: `Next Due: ${nextDueDate}` }] : []),
        ],
      });
    } catch (err) {
      console.error("Failed to save deworming:", err);
      alert("Failed to save deworming note. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (savedData) {
    return (
      <SaveConfirmation
        petName={petName}
        categoryLabel="Deworming"
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
          <h2 className="pn-form-header__title">Add Deworming</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <FormSection title="Deworming Details" accentColor="#059669">
          <div className="pn-field">
            <label className="pn-field__label">Medicine / Product Name *</label>
            <input
              type="text"
              className="pn-input"
              placeholder="e.g. Drontal, SkyWorm, Ezy-Deworm"
              value={medName}
              onChange={(e) => setMedName(e.target.value)}
              required
            />
          </div>

          <div className="pn-grid-2">
            <div className="pn-field">
              <label className="pn-field__label">Date Given</label>
              <CustomDatePicker
                value={givenDate}
                onChange={setGivenDate}
                placeholder="Date Given"
                label="Date Deworming Given"
              />
            </div>

            <div className="pn-field">
              <label className="pn-field__label">Dosage</label>
              <input
                type="text"
                className="pn-input"
                placeholder="e.g. 1 tablet"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
              />
            </div>
          </div>

          <div className="pn-grid-2">
            <div className="pn-field">
              <label className="pn-field__label">Pet Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                className="pn-input"
                placeholder="e.g. 15.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>

            <div className="pn-field">
              <label className="pn-field__label">Given At</label>
              <CustomSelect
                value={givenAt}
                options={GIVEN_AT_OPTIONS}
                onChange={setGivenAt}
              />
            </div>
          </div>

          <div className="pn-field">
            <label className="pn-field__label">Notes</label>
            <textarea
              className="pn-textarea"
              placeholder="Observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </FormSection>

        <DocumentUpload files={files} onFilesChange={setFiles} label="Upload Prescription / Medicine Photo" />

        <ReminderToggle
          enabled={reminderEnabled}
          onToggle={setReminderEnabled}
          dueDate={nextDueDate}
          onDueDateChange={setNextDueDate}
          label="Set Next Deworming Due Date (Auto: +90 days)"
        />

        <button type="submit" className="pn-submit-btn" disabled={submitting || !medName.trim()}>
          <span className="material-symbols-outlined">save</span>
          {submitting ? "Saving Deworming..." : "Save Deworming"}
        </button>
      </form>
    </div>
  );
}
