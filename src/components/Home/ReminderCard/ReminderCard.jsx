import React from "react";
import { useNavigate } from "react-router-dom";
import "./ReminderCard.css";
import reminderIcon from "./reminder-icon.png";

export default function ReminderCard({ onNavigateTab }) {
  const navigate = useNavigate();

  const handleTimeline = () => {
    if (typeof onNavigateTab === "function") {
      onNavigateTab("timeline");
    } else {
      navigate("/home", { state: { tab: "timeline" } });
    }
  };

  return (
    <div className="reminder-card">
      <div className="reminder-left">
        <div className="reminder-icon">
          <img src={reminderIcon} alt="reminder" />
        </div>

        <div className="reminder-text">
          <span className="reminder-label">Next Reminder</span>
          <p className="reminder-title">No upcoming reminders</p>
          <p className="reminder-sub">You're all set!</p>
        </div>
      </div>


    </div>
  );
}