import React, { useState, useEffect } from "react";
import { FiX, FiCheck, FiClock, FiTrash2, FiPlus, FiCalendar, FiBell, FiShield, FiAlertCircle } from "react-icons/fi";
import { getReminders, createReminder, completeReminder, snoozeReminder, deleteReminder } from "../../../api/timelineApi";
import CustomDatePicker from "../../Timeline/Forms/shared/CustomDatePicker";
import CustomSelect from "../../Timeline/Forms/shared/CustomSelect";
import "./RemindersModal.css";

const REMINDER_TYPES = [
  { value: "vet_visit", label: "Vet Visit" },
  { value: "medication", label: "Medication / Follow-up" },
  { value: "vaccination", label: "Vaccination" },
  { value: "deworming", label: "Deworming" },
  { value: "grooming", label: "Grooming" },
  { value: "custom", label: "Custom Reminder" },
];

export default function RemindersModal({ petId, petName, onClose }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // New reminder form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState("vet_visit");
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [dueTime, setDueTime] = useState("09:00");
  const [priority, setPriority] = useState("medium");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchRemindersList = async () => {
    if (!petId) return;
    try {
      setLoading(true);
      const res = await getReminders(petId);
      const list = res.reminders || res || [];
      // Filter out completed ones or sort pending first
      setReminders(list.filter((r) => r.status !== "completed"));
    } catch (err) {
      console.error("Failed to fetch reminders:", err);
      setError("Could not load reminders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRemindersList();
  }, [petId]);

  const handleComplete = async (reminderId) => {
    try {
      await completeReminder(petId, reminderId);
      setReminders((prev) => prev.filter((r) => r.id !== reminderId));
    } catch (err) {
      console.error("Failed to complete reminder:", err);
    }
  };

  const handleSnooze = async (reminderId, currentDate) => {
    try {
      const d = new Date(currentDate || new Date());
      d.setDate(d.getDate() + 1);
      const newDate = d.toISOString().split("T")[0];
      await snoozeReminder(petId, reminderId, newDate);
      fetchRemindersList();
    } catch (err) {
      console.error("Failed to snooze reminder:", err);
    }
  };

  const handleDelete = async (reminderId) => {
    try {
      await deleteReminder(petId, reminderId);
      setReminders((prev) => prev.filter((r) => r.id !== reminderId));
    } catch (err) {
      console.error("Failed to delete reminder:", err);
    }
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      setSubmitting(true);
      const payload = {
        title: title.trim(),
        type,
        due_date: dueDate,
        due_time: dueTime ? `${dueTime}:00` : "09:00:00",
        priority,
        notes: notes.trim() || null,
      };
      await createReminder(petId, payload);
      setTitle("");
      setNotes("");
      setShowAddForm(false);
      fetchRemindersList();
    } catch (err) {
      console.error("Failed to create reminder:", err);
      alert("Failed to create reminder. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeIcon = (typeStr) => {
    switch (typeStr) {
      case "vet_visit": return "🩺";
      case "medication":
      case "medication_end": return "💊";
      case "vaccination": return "💉";
      case "deworming": return "🪱";
      case "grooming": return "✂️";
      default: return "🔔";
    }
  };

  return (
    <div className="rem-overlay" onClick={onClose}>
      <div className="rem-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="rem-header">
          <div className="rem-title-row">
            <span className="rem-bell-badge"><FiBell size={18} /></span>
            <div>
              <h2 className="rem-title">Reminders</h2>
              <p className="rem-subtitle">{petName ? `Reminders for ${petName}` : "Pet Health Schedule"}</p>
            </div>
          </div>
          <button className="rem-close-btn" onClick={onClose} aria-label="Close">
            <FiX size={18} />
          </button>
        </div>

        {/* Action Bar */}
        <div className="rem-action-bar">
          <span className="rem-count-badge">
            {reminders.length} Active {reminders.length === 1 ? "Reminder" : "Reminders"}
          </span>
          <button className="rem-add-btn" onClick={() => setShowAddForm((prev) => !prev)}>
            <FiPlus size={16} /> {showAddForm ? "Cancel" : "Add Reminder"}
          </button>
        </div>

        {/* Add New Reminder Form (Collapsible) */}
        {showAddForm && (
          <form className="rem-add-form" onSubmit={handleCreateReminder}>
            <h4 className="rem-form-title">Create New Reminder</h4>
            
            <div className="rem-field">
              <label>Reminder Title *</label>
              <input
                type="text"
                placeholder="e.g. Vet Follow-up Checkup"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="rem-field-grid">
              <div className="rem-field">
                <label>Reminder Type</label>
                <CustomSelect value={type} options={REMINDER_TYPES} onChange={setType} />
              </div>

              <div className="rem-field">
                <label>Due Date</label>
                <CustomDatePicker value={dueDate} onChange={setDueDate} placeholder="Select Date" />
              </div>
            </div>

            <div className="rem-field">
              <label>Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Bring previous medical history"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button type="submit" className="rem-submit-btn" disabled={submitting || !title.trim()}>
              {submitting ? "Saving..." : "Save Reminder"}
            </button>
          </form>
        )}

        {/* Reminders List */}
        <div className="rem-list-container">
          {loading ? (
            <div className="rem-loading">Loading active reminders…</div>
          ) : reminders.length === 0 ? (
            <div className="rem-empty">
              <span className="rem-empty-icon">🎉</span>
              <h4>No Pending Reminders</h4>
              <p>You are all caught up! Click "+ Add Reminder" above to set a new follow-up.</p>
            </div>
          ) : (
            reminders.map((rem) => (
              <div key={rem.id} className={`rem-card rem-card--${rem.priority || "medium"}`}>
                <div className="rem-card-left">
                  <span className="rem-type-icon">{getTypeIcon(rem.type)}</span>
                  <div className="rem-card-info">
                    <div className="rem-card-title-row">
                      <h4 className="rem-card-title">{rem.title}</h4>
                      <span className="rem-type-badge">{rem.type?.replace("_", " ")}</span>
                    </div>

                    <div className="rem-card-due">
                      <FiCalendar size={13} /> {rem.due_date} {rem.due_time ? `@ ${rem.due_time.slice(0, 5)}` : ""}
                    </div>

                    {rem.notes && <p className="rem-card-notes">{rem.notes}</p>}
                  </div>
                </div>

                {/* Actions */}
                <div className="rem-card-actions">
                  <button
                    type="button"
                    className="rem-btn rem-btn--complete"
                    onClick={() => handleComplete(rem.id)}
                    title="Mark Complete"
                  >
                    <FiCheck size={14} /> Done
                  </button>

                  <button
                    type="button"
                    className="rem-btn rem-btn--snooze"
                    onClick={() => handleSnooze(rem.id, rem.due_date)}
                    title="Snooze +1 Day"
                  >
                    <FiClock size={14} /> +1 Day
                  </button>

                  <button
                    type="button"
                    className="rem-btn rem-btn--delete"
                    onClick={() => handleDelete(rem.id)}
                    title="Delete"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
