import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft, FiCheck, FiX, FiCalendar, FiClock, FiPlus,
  FiAlertCircle, FiBell
} from "react-icons/fi";
import useAuth from "../../hooks/useAuth";
import { usePets } from "../../hooks/usePetsQuery";
import {
  useReminders, useCreateReminder, useCompleteReminder,
  useSnoozeReminder
} from "../../hooks/useTimelineQueries";
import { PetAvatar } from "../common/PetAvatar";
import CustomDatePicker from "../Timeline/Forms/shared/CustomDatePicker";
import CustomSelect from "../Timeline/Forms/shared/CustomSelect";
import "./RemindersPage.css";

const TIME_SLOTS = [
  { value: "morning",   label: "Morning (08:00)" },
  { value: "afternoon", label: "Afternoon (14:00)" },
  { value: "night",     label: "Night (21:00)" },
];

const SLOT_TIME_MAP = { morning: "08:00:00", afternoon: "14:00:00", night: "21:00:00" };

const SLOT_GROUPS = [
  { key: "morning",   label: "Morning",   time: "08:00" },
  { key: "afternoon", label: "Afternoon", time: "14:00" },
  { key: "night",     label: "Night",     time: "21:00" },
  { key: "other",     label: "Other",     time: "" },
];

const REMINDER_TYPES = [
  { value: "medication",  label: "Medication / Dose" },
  { value: "vet_visit",   label: "Vet Visit" },
  { value: "vaccination", label: "Vaccination" },
  { value: "deworming",   label: "Deworming" },
  { value: "custom",      label: "Custom Reminder" },
];

function getSlotKey(rem) {
  const s = (rem.time_slot || "").toLowerCase();
  if (s === "morning" || s === "afternoon" || s === "night") return s;
  const t = rem.due_time || "";
  if (!t) return "other";
  const h = parseInt(t.slice(0, 2), 10);
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 24) return "night";
  return "other";
}

function isOverdue(rem) {
  const today = new Date().toISOString().split("T")[0];
  if (rem.due_date < today) return true;
  if (rem.due_date === today && rem.due_time) {
    const now = new Date();
    const [hh, mm] = rem.due_time.split(":");
    const dueMin = parseInt(hh, 10) * 60 + parseInt(mm, 10);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return nowMin > dueMin;
  }
  return false;
}

export default function RemindersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: pets = [] } = usePets(user?.id);
  const [activePetId, setActivePetId] = useState(null);
  const [activeTab, setActiveTab] = useState("active");

  const { data: remindersData, isLoading: loading } = useReminders(activePetId);
  const createReminderMutation   = useCreateReminder(activePetId);
  const completeReminderMutation = useCompleteReminder(activePetId);
  const snoozeReminderMutation   = useSnoozeReminder(activePetId);

  const rawReminders = Array.isArray(remindersData)
    ? remindersData
    : (remindersData?.reminders || []);

  // Client-side auto-mark missed
  const reminders = rawReminders.map((r) => {
    if (r.status === "pending" && isOverdue(r)) return { ...r, status: "missed" };
    return r;
  });

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle]     = useState("");
  const [type, setType]       = useState("medication");
  const [timeSlot, setTimeSlot] = useState("morning");
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes]     = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Snooze
  const [snoozeModal, setSnoozeModal] = useState(null);
  const [customSnoozeDate, setCustomSnoozeDate] = useState("");

  useEffect(() => {
    if (!pets.length || !user?.id) return;
    const saved = localStorage.getItem(`active_pet_id_${user.id}`);
    if (saved && pets.some((p) => p.id === saved)) {
      setActivePetId(saved);
    } else {
      setActivePetId(pets[0].id);
    }
  }, [pets, user?.id]);

  const activePet = pets.find((p) => p.id === activePetId) || pets[0];

  const handleDone = (reminderId) => {
    completeReminderMutation.mutate(reminderId);
  };

  const handleSnooze = (presetKey) => {
    if (!snoozeModal || !activePetId) return;
    let targetDate = new Date();
    if (presetKey === "1h")        targetDate.setHours(targetDate.getHours() + 1);
    else if (presetKey === "3h")   targetDate.setHours(targetDate.getHours() + 3);
    else if (presetKey === "tomorrow") targetDate.setDate(targetDate.getDate() + 1);
    else if (presetKey === "1w")   targetDate.setDate(targetDate.getDate() + 7);
    else if (presetKey === "custom" && customSnoozeDate) targetDate = new Date(customSnoozeDate);

    const formattedDate = targetDate.toISOString().split("T")[0];
    snoozeReminderMutation.mutate(
      { reminderId: snoozeModal.id, newDate: formattedDate },
      { onSuccess: () => setSnoozeModal(null), onError: () => setSnoozeModal(null) }
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !activePetId) return;
    setSubmitting(true);
    const payload = {
      title: title.trim(),
      type,
      time_slot: timeSlot,
      due_date: dueDate,
      due_time: SLOT_TIME_MAP[timeSlot] || "09:00:00",
      notes: notes.trim() || null,
      status: "pending",
    };
    createReminderMutation.mutate(payload, {
      onSuccess: () => { setTitle(""); setNotes(""); setShowAddForm(false); setSubmitting(false); },
      onError:   () => { alert("Failed to create reminder."); setSubmitting(false); },
    });
  };

  // Split active vs history
  const activeReminders = reminders.filter(
    (r) => r.status === "pending" || r.status === "snoozed" || r.status === "missed"
  );
  const historyReminders = reminders.filter((r) => r.status === "completed");

  // Group active by time slot
  const grouped = SLOT_GROUPS.map((sg) => ({
    ...sg,
    items: activeReminders.filter((r) => getSlotKey(r) === sg.key),
  })).filter((g) => g.items.length > 0);

  const missedCount = activeReminders.filter((r) => r.status === "missed").length;

  return (
    <div className="rem-page">
      {/* Header */}
      <header className="rem-page-header">
        <div className="rem-page-header__left">
          <button className="rem-back-btn" onClick={() => navigate(-1)} aria-label="Back">
            <FiArrowLeft size={20} />
          </button>
          <h2>Pet Reminders</h2>
        </div>

        {pets.length > 1 && (
          <select
            className="rem-pet-select"
            value={activePetId || ""}
            onChange={(e) => setActivePetId(e.target.value)}
          >
            {pets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.pet_name || p.name}
              </option>
            ))}
          </select>
        )}
      </header>

      <main className="rem-page-body">
        {/* Tabs */}
        <div className="rem-tabs">
          <button
            className={`rem-tab ${activeTab === "active" ? "rem-tab--active" : ""}`}
            onClick={() => setActiveTab("active")}
          >
            Active ({activeReminders.length})
            {missedCount > 0 && (
              <span className="rem-missed-dot">{missedCount} missed</span>
            )}
          </button>
          <button
            className={`rem-tab ${activeTab === "history" ? "rem-tab--active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            Completed ({historyReminders.length})
          </button>
        </div>

        {/* Add button */}
        <button className="rem-new-btn" onClick={() => setShowAddForm((p) => !p)}>
          <FiPlus size={18} /> {showAddForm ? "Close" : "Set New Reminder"}
        </button>

        {/* Add form */}
        {showAddForm && (
          <form className="rem-quick-form" onSubmit={handleCreate}>
            <h3>New Reminder — {activePet?.pet_name || activePet?.name}</h3>

            <div className="rem-field">
              <label>Title *</label>
              <input
                type="text"
                placeholder="e.g. Dolo 650 — 1 Tablet"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="rem-field-grid">
              <div className="rem-field">
                <label>Type</label>
                <CustomSelect value={type} options={REMINDER_TYPES} onChange={setType} />
              </div>
              <div className="rem-field">
                <label>Time Slot</label>
                <CustomSelect value={timeSlot} options={TIME_SLOTS} onChange={setTimeSlot} />
              </div>
            </div>

            <div className="rem-field">
              <label>Due Date</label>
              <CustomDatePicker value={dueDate} onChange={setDueDate} placeholder="Select Date" />
            </div>

            <div className="rem-field">
              <label>Notes (optional)</label>
              <input
                type="text"
                placeholder="e.g. Take after food"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button type="submit" className="rem-submit-btn" disabled={submitting || !title.trim()}>
              {submitting ? "Saving..." : "Save Reminder"}
            </button>
          </form>
        )}

        {/* Content */}
        {loading ? (
          <div className="rem-loading-box">Loading reminders...</div>
        ) : activeTab === "active" ? (
          activeReminders.length === 0 ? (
            <div className="rem-empty-box">
              <div className="rem-empty-icon"><FiBell size={32} /></div>
              <h3>No Active Reminders</h3>
              <p>All tasks are complete. Add a new reminder to stay on track.</p>
            </div>
          ) : (
            <div className="rem-grouped-list">
              {grouped.map((group) => (
                <div key={group.key} className="rem-group">
                  <div className="rem-group-header">
                    <span className={`rem-group-dot rem-group-dot--${group.key}`} />
                    <span className="rem-group-label">{group.label}</span>
                    {group.time && <span className="rem-group-time">{group.time}</span>}
                  </div>

                  <div className="rem-cards-list">
                    {group.items.map((rem) => {
                      const isMissed  = rem.status === "missed";
                      const isSnoozed = rem.status === "snoozed";
                      return (
                        <div
                          key={rem.id}
                          className={`rem-card-item ${isMissed ? "rem-card-item--missed" : ""} ${isSnoozed ? "rem-card-item--snoozed" : ""}`}
                        >
                          <div className="rem-card-header">
                            <div className="rem-pet-info">
                              <PetAvatar
                                src={activePet?.pet_photo_url}
                                petType={activePet?.pet_type}
                                size={32}
                                className="rem-pet-avatar"
                              />
                              <span className="rem-pet-name">{activePet?.pet_name || "Pet"}</span>
                            </div>
                            {isMissed && (
                              <span className="rem-status-pill rem-status-pill--missed">
                                <FiAlertCircle size={11} /> Missed
                              </span>
                            )}
                            {isSnoozed && (
                              <span className="rem-status-pill rem-status-pill--snoozed">
                                <FiClock size={11} /> Snoozed
                              </span>
                            )}
                          </div>

                          <div className="rem-card-content">
                            <h3 className="rem-item-title">{rem.title}</h3>
                            <div className="rem-item-meta">
                              <span><FiCalendar size={12} /> {rem.due_date}</span>
                              {rem.due_time && (
                                <span><FiClock size={12} /> {rem.due_time.slice(0, 5)}</span>
                              )}
                            </div>
                            {rem.notes && <p className="rem-item-notes">{rem.notes}</p>}
                          </div>

                          <div className="rem-card-options">
                            <button
                              type="button"
                              className="rem-option-btn rem-option-btn--done"
                              onClick={() => handleDone(rem.id)}
                            >
                              <FiCheck size={15} />
                              {isMissed ? "Mark Done" : "Done"}
                            </button>

                            {!isMissed && (
                              <button
                                type="button"
                                className="rem-option-btn rem-option-btn--snooze"
                                onClick={() => setSnoozeModal(rem)}
                              >
                                <FiClock size={15} /> Snooze
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          // History tab
          historyReminders.length === 0 ? (
            <div className="rem-empty-box">
              <div className="rem-empty-icon"><FiCheck size={32} /></div>
              <h3>No Completed Reminders</h3>
              <p>Reminders you complete will appear here.</p>
            </div>
          ) : (
            <div className="rem-cards-list">
              {historyReminders.map((rem) => (
                <div key={rem.id} className="rem-card-item rem-card-item--done">
                  <div className="rem-card-content">
                    <h3 className="rem-item-title">{rem.title}</h3>
                    <div className="rem-item-meta">
                      <span><FiCalendar size={12} /> {rem.due_date}</span>
                    </div>
                  </div>
                  <div className="rem-history-status">
                    <span className="rem-status-pill rem-status-pill--done">
                      <FiCheck size={12} /> Completed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>

      {/* Snooze modal */}
      {snoozeModal && (
        <div className="rem-snooze-backdrop" onClick={() => setSnoozeModal(null)}>
          <div className="rem-snooze-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rem-snooze-header">
              <h3><FiClock size={17} /> Snooze Reminder</h3>
              <button className="rem-snooze-close" onClick={() => setSnoozeModal(null)}>
                <FiX size={18} />
              </button>
            </div>

            <p className="rem-snooze-subtitle">
              Snooze <strong>"{snoozeModal.title}"</strong> until:
            </p>

            <div className="rem-snooze-options">
              <button className="rem-snooze-opt-btn" onClick={() => handleSnooze("1h")}>1 Hour</button>
              <button className="rem-snooze-opt-btn" onClick={() => handleSnooze("3h")}>3 Hours</button>
              <button className="rem-snooze-opt-btn" onClick={() => handleSnooze("tomorrow")}>Tomorrow</button>
              <button className="rem-snooze-opt-btn" onClick={() => handleSnooze("1w")}>1 Week</button>
            </div>

            <div className="rem-snooze-custom">
              <label>Custom Date:</label>
              <div className="rem-snooze-custom-row">
                <CustomDatePicker
                  value={customSnoozeDate || new Date().toISOString().split("T")[0]}
                  onChange={setCustomSnoozeDate}
                />
                <button
                  type="button"
                  className="rem-snooze-apply-btn"
                  disabled={!customSnoozeDate}
                  onClick={() => handleSnooze("custom")}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
