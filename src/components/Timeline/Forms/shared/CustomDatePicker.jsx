import React, { useState } from "react";
import "./CustomDatePicker.css";

function formatDateDisplay(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  if (!year || !month || !day) return dateStr;
  const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function CustomDatePicker({
  value,
  onChange,
  placeholder = "Select date",
  label = "Select Date",
  allowFuture = true,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const initialDate = value ? new Date(value + "T00:00:00") : new Date();
  const [calendarYear, setCalendarYear] = useState(initialDate.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(initialDate.getMonth());

  const handleSelectDay = (day) => {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange?.(dateStr);
    setIsOpen(false);
  };

  return (
    <div className="cdp-wrap">
      <button
        type="button"
        className="cdp-trigger"
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        <span className={`cdp-trigger__label ${!value ? "cdp-trigger__label--placeholder" : ""}`}>
          {value ? formatDateDisplay(value) : placeholder}
        </span>
        <span className="material-symbols-outlined cdp-trigger__icon">
          calendar_today
        </span>
      </button>

      {isOpen && (
        <div className="cdp-overlay" onClick={() => setIsOpen(false)}>
          <div className="cdp-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="cdp-header">
              <h3 className="cdp-title">{label}</h3>
              <button type="button" className="cdp-close" onClick={() => setIsOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Selectors */}
            <div className="cdp-selectors">
              <select
                className="cdp-select"
                value={calendarMonth}
                onChange={(e) => setCalendarMonth(parseInt(e.target.value))}
              >
                {[
                  "January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December",
                ].map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>

              <select
                className="cdp-select"
                value={calendarYear}
                onChange={(e) => setCalendarYear(parseInt(e.target.value))}
              >
                {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - 15 + i).map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            {/* Weekday headers */}
            <div className="cdp-grid">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div key={d} className="cdp-weekday">{d}</div>
              ))}

              {/* Days */}
              {(() => {
                const firstDayIdx = new Date(calendarYear, calendarMonth, 1).getDay();
                const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                const cells = [];

                for (let i = 0; i < firstDayIdx; i++) {
                  cells.push(<div key={`empty-${i}`} className="cdp-empty" />);
                }

                for (let day = 1; day <= totalDays; day++) {
                  const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const isSelected = value === dateStr;
                  const isToday = new Date().toISOString().split("T")[0] === dateStr;
                  const isFuture = new Date(calendarYear, calendarMonth, day) > new Date();

                  const isDisabled = !allowFuture && isFuture;

                  cells.push(
                    <button
                      key={`day-${day}`}
                      type="button"
                      disabled={isDisabled}
                      className={`cdp-day ${isSelected ? "cdp-day--selected" : ""} ${isToday ? "cdp-day--today" : ""}`}
                      onClick={() => handleSelectDay(day)}
                    >
                      {day}
                    </button>
                  );
                }
                return cells;
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
