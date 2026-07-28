import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import FormSection from "./shared/FormSection";
import ReminderToggle from "./shared/ReminderToggle";
import DocumentUpload from "./shared/DocumentUpload";
import SaveConfirmation from "./shared/SaveConfirmation";
import CustomDatePicker from "./shared/CustomDatePicker";
import { useQueryClient } from "@tanstack/react-query";
import { timelineKeys } from "../../../hooks/useTimelineQueries";
import { createMedicalEvent, updateMedicalEvent, uploadDocument } from "../../../api/timelineApi";

export default function OtherForm({ petId, petName, onClose, onSaved, editData }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");

  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [nextDueDate, setNextDueDate] = useState("");
  const [files, setFiles] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [savedData, setSavedData] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  useEffect(() => {
    if (!editData) return;
    const catEntry = (editData.category_entries || [])[0] || {};

    if (editData.event_date || catEntry.date_logged) {
      setEventDate(editData.event_date || catEntry.date_logged);
    }
    setTitle(catEntry.item_name || "");
    setDescription(catEntry.notes || editData.overall_notes || "");
    const hasNextDue = Boolean(catEntry.next_due_date || editData.next_due_date);
    setReminderEnabled(hasNextDue);
    if (hasNextDue) {
      setNextDueDate(catEntry.next_due_date || editData.next_due_date);
    }
  }, [editData]);

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

      if (editData) {
        const targetEventId = editData.id || editData.event_id || editData.medical_event_id;
        await updateMedicalEvent(petId, targetEventId, payload);
        queryClient.invalidateQueries({ queryKey: timelineKeys.all(petId) });
        if (onSaved) onSaved("✓ Health note updated successfully!");
        else if (onClose) onClose();
        return;
      }

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

      <div className="pn-form-header">
        <div className="pn-form-header__left">
          <button className="pn-form-header__back" onClick={handleHeaderClose} type="button">
            <span className="material-symbols-outlined">{editData ? "close" : "arrow_back"}</span>
          </button>
          <h2 className="pn-form-header__title">{editData ? "Edit Custom Note" : "Add Custom Note"}</h2>
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
