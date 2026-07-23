import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCheck, FiX, FiCalendar, FiClock, FiPlus, FiAlertTriangle, FiFilter } from "react-icons/fi";
import useAuth from "../../hooks/useAuth";
import { usePets } from "../../hooks/usePetsQuery";
import { getReminders, updateReminder, createReminder } from "../../api/timelineApi";
import { PetAvatar } from "../common/PetAvatar";
import CustomDatePicker from "../Timeline/Forms/shared/CustomDatePicker";
import CustomSelect from "../Timeline/Forms/shared/CustomSelect";
import "./RemindersPage.css";

const TIME_SLOTS = [
  { value: "morning", label: "🌅 Morning (08:00 AM)" },
  { value: "afternoon", label: "☀️ Afternoon (02:00 PM)" },
  { value: "night", label: "🌙 Night (09:00 PM)" },
];

const REMINDER_TYPES = [
  { value: "medication", label: "Medication / Dose" },
  { value: "vet_visit", label: "Vet Visit" },
  { value: "vaccination", label: "Vaccination" },
  { value: "deworming", label: "Deworming" },
  { value: "custom", label: "Custom Reminder" },
];

export default function RemindersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: pets = [] } = usePets(user?.id);
  const [activePetId, setActivePetId] = useState(null);

  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active"); // "active" | "history"

  // Quick Add Reminder Modal
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("medication");
  const [timeSlot, setTimeSlot] = useState("morning");
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!pets.length || !user?.id) return;
    const savedActive = localStorage.getItem(`active_pet_id_${user.id}`);
    if (savedActive && pets.some((p) => p.id === savedActive)) {
      setActivePetId(savedActive);
    } else {
      setActivePetId(pets[0].id);
    }
  }, [pets, user?.id]);

  const activePet = pets.find((p) => p.id === activePetId) || pets[0];

  const fetchPetReminders = async () => {
    if (!activePetId) return;
    try {
      setLoading(true);
      const res = await getReminders(activePetId);
      const list = res.reminders || res || [];
      setReminders(list);
    } catch (err) {
      console.error("Failed to fetch reminders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPetReminders();
  }, [activePetId]);

  const handleAction = async (reminderId, newStatus) => {
    try {
      // Optimistic UI update
      setReminders((prev) =>
        prev.map((r) => (r.id === reminderId ? { ...r, status: newStatus } : r))
      );
      await updateReminder(activePetId, reminderId, { status: newStatus });
    } catch (err) {
      console.error("Failed to update reminder status:", err);
      fetchPetReminders();
    }
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    if (!title.trim() || !activePetId) return;
    try {
      setSubmitting(true);
      const timeMap = { morning: "08:00:00", afternoon: "14:00:00", night: "21:00:00" };
      const payload = {
        title: title.trim(),
        type,
        time_slot: timeSlot,
        due_date: dueDate,
        due_time: timeMap[timeSlot] || "09:00:00",
        notes: notes.trim() || null,
        status: "pending",
      };
      await createReminder(activePetId, payload);
      setTitle("");
      setNotes("");
      setShowAddForm(false);
      fetchPetReminders();
    } catch (err) {
      console.error("Failed to create reminder:", err);
      alert("Failed to create reminder.");
    } finally {
      setSubmitting(false);
    }
  };

  const activeReminders = reminders.filter((r) => r.status === "pending" || !r.status);
  const historyReminders = reminders.filter((r) => r.status === "completed" || r.status === "forgot");

  const getSlotBadge = (slotStr, timeStr) => {
    if (slotStr === "morning" || (timeStr && timeStr < "12:00")) {
      return <span className="rem-slot-badge rem-slot-badge--morning">🌅 Morning</span>;
    }
    if (slotStr === "afternoon" || (timeStr && timeStr >= "12:00" && timeStr < "18:00")) {
      return <span className="rem-slot-badge rem-slot-badge--afternoon">☀️ Afternoon</span>;
    }
    if (slotStr === "night" || (timeStr && timeStr >= "18:00")) {
      return <span className="rem-slot-badge rem-slot-badge--night">🌙 Night</span>;
    }
    return <span className="rem-slot-badge">⏰ Reminder</span>;
  };

  return (
    <div className="rem-page">
      {/* ── Top Header ── */}
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

      {/* ── Main Container ── */}
      <main className="rem-page-body">
        {/* Navigation Tabs */}
        <div className="rem-tabs">
          <button
            className={`rem-tab ${activeTab === "active" ? "rem-tab--active" : ""}`}
            onClick={() => setActiveTab("active")}
          >
            Active Schedule ({activeReminders.length})
          </button>
          <button
            className={`rem-tab ${activeTab === "history" ? "rem-tab--active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            History ({historyReminders.length})
          </button>
        </div>

        {/* Add Reminder CTA */}
        <button className="rem-new-btn" onClick={() => setShowAddForm((prev) => !prev)}>
          <FiPlus size={18} /> {showAddForm ? "Close Form" : "Set New Reminder"}
        </button>

        {/* Quick Add Form */}
        {showAddForm && (
          <form className="rem-quick-form" onSubmit={handleCreateReminder}>
            <h3>Add New Reminder for {activePet?.pet_name || activePet?.name}</h3>
            
            <div className="rem-field">
              <label>Reminder Title / Tablet Name *</label>
              <input
                type="text"
                placeholder="e.g. Dolo 650 - 1 Tablet"
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
                <label>Dose Timing / Slot</label>
                <CustomSelect value={timeSlot} options={TIME_SLOTS} onChange={setTimeSlot} />
              </div>
            </div>

            <div className="rem-field">
              <label>Due Date</label>
              <CustomDatePicker value={dueDate} onChange={setDueDate} placeholder="Select Date" />
            </div>

            <div className="rem-field">
              <label>Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Take after food with milk"
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
        {loading ? (
          <div className="rem-loading-box">Loading reminders…</div>
        ) : (activeTab === "active" ? activeReminders : historyReminders).length === 0 ? (
          <div className="rem-empty-box">
            <span className="rem-empty-emoji">{activeTab === "active" ? "✨" : "📜"}</span>
            <h3>{activeTab === "active" ? "No Active Reminders" : "No Past Reminders"}</h3>
            <p>{activeTab === "active" ? "You have completed all scheduled tasks for your pet!" : "History of completed or missed reminders will appear here."}</p>
          </div>
        ) : (
          <div className="rem-cards-list">
            {(activeTab === "active" ? activeReminders : historyReminders).map((rem) => (
              <div key={rem.id} className="rem-card-item">
                {/* Pet Header Bar on Each Card */}
                <div className="rem-card-header">
                  <div className="rem-pet-info">
                    <PetAvatar
                      src={activePet?.pet_photo_url}
                      petType={activePet?.pet_type}
                      size={36}
                      className="rem-pet-avatar"
                    />
                    <span className="rem-pet-name">{activePet?.pet_name || activePet?.name || "Pet"}</span>
                  </div>
                  {getSlotBadge(rem.time_slot, rem.due_time)}
                </div>

                {/* Reminder Title & Details */}
                <div className="rem-card-content">
                  <h3 className="rem-item-title">{rem.title}</h3>
                  
                  <div className="rem-item-meta">
                    <span><FiCalendar size={13} /> {rem.due_date}</span>
                    {rem.due_time && <span><FiClock size={13} /> {rem.due_time.slice(0, 5)}</span>}
                  </div>

                  {rem.notes && <p className="rem-item-notes">{rem.notes}</p>}
                </div>

                {/* ONLY TWO OPTIONS: DONE OR FORGOT */}
                {activeTab === "active" ? (
                  <div className="rem-card-options">
                    <button
                      type="button"
                      className="rem-option-btn rem-option-btn--done"
                      onClick={() => handleAction(rem.id, "completed")}
                    >
                      <FiCheck size={18} /> Done
                    </button>

                    <button
                      type="button"
                      className="rem-option-btn rem-option-btn--forgot"
                      onClick={() => handleAction(rem.id, "forgot")}
                    >
                      <FiX size={18} /> Forgot
                    </button>
                  </div>
                ) : (
                  <div className="rem-history-status">
                    {rem.status === "completed" ? (
                      <span className="rem-status-pill rem-status-pill--done"><FiCheck size={14} /> Completed</span>
                    ) : (
                      <span className="rem-status-pill rem-status-pill--forgot"><FiX size={14} /> Missed / Forgot</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
