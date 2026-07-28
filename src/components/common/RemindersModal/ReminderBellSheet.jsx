/**
 * ReminderBellSheet.jsx
 * Bottom sheet triggered by the bell icon in TopNav.
 * Shows today's reminders grouped by time slot: Morning / Afternoon / Night.
 * Supports marking as Done (even if missed) and shows missed status distinctly.
 */
import React, { useState, useEffect } from "react";
import { FiX, FiCheck, FiClock, FiAlertCircle, FiChevronRight, FiCalendar } from "react-icons/fi";
import { getReminders, completeReminder, updateReminder } from "../../../api/timelineApi";
import "./ReminderBellSheet.css";

const TIME_SLOTS = [
  { key: "morning",   label: "Morning",   range: [0, 12],  time: "08:00" },
  { key: "afternoon", label: "Afternoon", range: [12, 17], time: "14:00" },
  { key: "night",     label: "Night",     range: [17, 24], time: "21:00" },
];

function getSlotForReminder(rem) {
  const slot = (rem.time_slot || "").toLowerCase();
  if (slot === "morning")   return "morning";
  if (slot === "afternoon") return "afternoon";
  if (slot === "night")     return "night";
  // Fall back to time string
  const t = rem.due_time || "";
  if (!t) return "morning";
  const h = parseInt(t.slice(0, 2), 10);
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "night";
}

function getLocalToday() {
  return new Date().toLocaleDateString("en-CA");
}

function isOverdue(rem) {
  const today = getLocalToday();
  if (rem.due_date < today) return true;
  if (rem.due_date === today && rem.due_time) {
    const now = new Date();
    const [hh, mm] = rem.due_time.split(":");
    const dueMinutes = parseInt(hh, 10) * 60 + parseInt(mm, 10);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return nowMinutes > dueMinutes;
  }
  return false;
}

export default function ReminderBellSheet({ petId, petName, onClose }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // reminder id being acted on

  const today = getLocalToday();

  const load = async () => {
    if (!petId) return;
    try {
      setLoading(true);
      const res = await getReminders(petId);
      const list = res.reminders || res || [];

      // Auto-compute missed for overdue pending reminders (client-side)
      const processed = list.map((r) => {
        if (r.status === "pending" && isOverdue(r)) {
          return { ...r, status: "missed" };
        }
        return r;
      });

      // Show today's reminders + any pending/missed/snoozed ones
      const relevant = processed.filter((r) => {
        if (r.status === "completed") return false;
        if (r.due_date === today) return true;
        if (r.due_date < today && r.status !== "completed") return true;
        return false;
      });

      setReminders(relevant);
    } catch (err) {
      console.error("Failed to fetch reminders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [petId]);

  const handleDone = async (rem) => {
    setActionLoading(rem.id);
    try {
      await completeReminder(petId, rem.id);
      setReminders((prev) => prev.filter((r) => r.id !== rem.id));
    } catch (err) {
      console.error("Failed to complete reminder:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const groupedSlots = TIME_SLOTS.map((slot) => ({
    ...slot,
    items: reminders.filter((r) => getSlotForReminder(r) === slot.key),
  })).filter((s) => s.items.length > 0);

  const totalCount = reminders.length;
  const missedCount = reminders.filter((r) => r.status === "missed").length;

  return (
    <div className="bell-sheet-backdrop" onClick={onClose}>
      <div className="bell-sheet" onClick={(e) => e.stopPropagation()}>

        {/* Handle */}
        <div className="bell-sheet__handle" />

        {/* Header */}
        <div className="bell-sheet__header">
          <div className="bell-sheet__header-left">
            <div className="bell-sheet__bell-badge">
              <BellSolidIcon size={18} />
            </div>
            <div>
              <h2 className="bell-sheet__title">Today's Schedule</h2>
              {petName && (
                <p className="bell-sheet__subtitle">{petName}</p>
              )}
            </div>
          </div>
          <button className="bell-sheet__close" onClick={onClose} aria-label="Close">
            <FiX size={20} />
          </button>
        </div>

        {/* Summary bar */}
        {!loading && totalCount > 0 && (
          <div className="bell-sheet__summary">
            <span className="bell-sheet__summary-count">
              {totalCount} {totalCount === 1 ? "reminder" : "reminders"}
            </span>
            {missedCount > 0 && (
              <span className="bell-sheet__missed-badge">
                <FiAlertCircle size={12} /> {missedCount} missed
              </span>
            )}
          </div>
        )}

        {/* Content */}
        <div className="bell-sheet__body">
          {loading ? (
            <div className="bell-sheet__loading">
              <div className="bell-sheet__spinner" />
              <span>Loading reminders...</span>
            </div>
          ) : totalCount === 0 ? (
            <div className="bell-sheet__empty">
              <div className="bell-sheet__empty-icon">
                <BellCheckIcon size={32} />
              </div>
              <h4>All clear!</h4>
              <p>No pending reminders for {petName || "your pet"} today.</p>
            </div>
          ) : (
            groupedSlots.map((slot) => (
              <div key={slot.key} className="bell-sheet__slot-group">
                <div className="bell-sheet__slot-header">
                  <span className={`bell-sheet__slot-dot bell-sheet__slot-dot--${slot.key}`} />
                  <span className="bell-sheet__slot-label">{slot.label}</span>
                  <span className="bell-sheet__slot-time">{slot.time}</span>
                </div>

                <div className="bell-sheet__slot-items">
                  {slot.items.map((rem) => {
                    const isMissed = rem.status === "missed";
                    const isSnoozed = rem.status === "snoozed";
                    const isActing = actionLoading === rem.id;

                    return (
                      <div
                        key={rem.id}
                        className={`bell-sheet__item ${isMissed ? "bell-sheet__item--missed" : ""} ${isSnoozed ? "bell-sheet__item--snoozed" : ""}`}
                      >
                        <div className="bell-sheet__item-content">
                          <div className="bell-sheet__item-header">
                            <span className="bell-sheet__item-type-dot" data-type={rem.type} />
                            <span className="bell-sheet__item-title">{rem.title}</span>
                            {isMissed && (
                              <span className="bell-sheet__status-pill bell-sheet__status-pill--missed">
                                Missed
                              </span>
                            )}
                            {isSnoozed && (
                              <span className="bell-sheet__status-pill bell-sheet__status-pill--snoozed">
                                Snoozed
                              </span>
                            )}
                          </div>
                          {rem.notes && (
                            <p className="bell-sheet__item-notes">{rem.notes}</p>
                          )}
                          {rem.due_date !== today && (
                            <p className="bell-sheet__item-date">
                              <FiCalendar size={11} /> {rem.due_date}
                            </p>
                          )}
                        </div>

                        <button
                          className="bell-sheet__done-btn"
                          disabled={isActing}
                          onClick={() => handleDone(rem)}
                          title={isMissed ? "Mark as done (override missed)" : "Mark as done"}
                        >
                          {isActing ? (
                            <span className="bell-sheet__btn-spinner" />
                          ) : (
                            <FiCheck size={15} />
                          )}
                          <span>{isMissed ? "Done" : "Done"}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function BellSolidIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6V11c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
    </svg>
  );
}

function BellCheckIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}
