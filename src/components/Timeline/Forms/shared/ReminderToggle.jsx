import React from "react";
import CustomDatePicker from "./CustomDatePicker";

export default function ReminderToggle({
  enabled,
  onToggle,
  dueDate,
  onDueDateChange,
  label = "Set Next Due Date / Reminder",
}) {
  return (
    <div
      style={{
        background: enabled ? "#f0fdf4" : "#f8fafc",
        border: `1.5px solid ${enabled ? "#86c540" : "#cbd5e1"}`,
        borderRadius: 14,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 22,
              color: enabled ? "#004b49" : "#94a3b8",
              fontVariationSettings: "'FILL' 1",
            }}
          >
            event_repeat
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: enabled ? "#004b49" : "#475569" }}>
            {label}
          </span>
        </div>

        {/* Toggle Switch */}
        <label style={{ position: "relative", display: "inline-block", width: 44, height: 24, cursor: "pointer", flexShrink: 0 }}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            style={{ opacity: 0, width: 0, height: 0 }}
          />
          <span
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: enabled ? "#004b49" : "#cbd5e1",
              borderRadius: 24,
              transition: "0.2s",
            }}
          >
            <span
              style={{
                position: "absolute",
                height: 18,
                width: 18,
                left: enabled ? 22 : 3,
                bottom: 3,
                backgroundColor: "#fff",
                borderRadius: "50%",
                transition: "0.2s",
              }}
            />
          </span>
        </label>
      </div>

      {enabled && (
        <div className="pn-field" style={{ marginTop: 4 }}>
          <label className="pn-field__label">Next Due Date</label>
          <CustomDatePicker
            value={dueDate || ""}
            onChange={onDueDateChange}
            placeholder="Select Due Date"
            label="Next Due / Reminder Date"
            allowFuture={true}
          />
        </div>
      )}
    </div>
  );
}
