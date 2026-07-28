import React, { useState } from "react";
import FormSection from "./shared/FormSection";
import ReminderToggle from "./shared/ReminderToggle";
import DocumentUpload from "./shared/DocumentUpload";
import SaveConfirmation from "./shared/SaveConfirmation";
import CustomDatePicker from "./shared/CustomDatePicker";
import { useQueryClient } from "@tanstack/react-query";
import { timelineKeys } from "../../../hooks/useTimelineQueries";
import { createMedicalEvent, uploadDocument } from "../../../api/timelineApi";

export default function OtherForm({ petId, petName, onClose, onSaved }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");

  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [nextDueDate, setNextDueDate] = useState("");
  const [files, setFiles] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [savedData, setSavedData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      const categoryEntry = {
        category: "other",
        item_name: title.trim(),
        date_logged: eventDate,
        next_due_date: reminderEnabled && nextDueDate ? nextDueDate : null,
        notes: description || null,
      };

      const payload = {
        event_date: eventDate,
        category_entries: [categoryEntry],
      };

      const res = await createMedicalEvent(petId, payload);
      const createdEvent = res.event || res;

      if (files.length > 0 && createdEvent.id) {
        for (const f of files) {
          try {
            await uploadDocument(petId, f, "Document / Photo", createdEvent.id);
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
        title: title.trim(),
        date: eventDate,
        details: [
          { icon: "more_horiz", label: "Custom Health Note" },
          ...(nextDueDate ? [{ icon: "event", label: `Reminder: ${nextDueDate}` }] : []),
        ],
      });
    } catch (err) {
      console.error("Failed to save note:", err);
      alert("Failed to save note. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (savedData) {
    return (
      <SaveConfirmation
        petName={petName}
        categoryLabel="Other Note"
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
          <h2 className="pn-form-header__title">Add Custom Note</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <FormSection title="Event Details" accentColor="#64748b">
          <div className="pn-field">
            <label className="pn-field__label">Title *</label>
            <input
              type="text"
              className="pn-input"
              placeholder="e.g. Diet change, Weight check, Allergy observation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="pn-field">
            <label className="pn-field__label">Date</label>
            <CustomDatePicker
              value={eventDate}
              onChange={setEventDate}
              placeholder="Select Date"
              label="Select Note Date"
            />
          </div>

          <div className="pn-field">
            <label className="pn-field__label">Description</label>
            <textarea
              className="pn-textarea"
              placeholder="Describe what happened or what you observed..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </FormSection>

        <DocumentUpload files={files} onFilesChange={setFiles} label="Upload Photos or Documents" />

        <ReminderToggle
          enabled={reminderEnabled}
          onToggle={setReminderEnabled}
          dueDate={nextDueDate}
          onDueDateChange={setNextDueDate}
          label="Set Follow-up / Reminder Date"
        />

        <button type="submit" className="pn-submit-btn" disabled={submitting || !title.trim()}>
          <span className="material-symbols-outlined">save</span>
          {submitting ? "Saving Note..." : "Save Pet Note"}
        </button>
      </form>
    </div>
  );
}
