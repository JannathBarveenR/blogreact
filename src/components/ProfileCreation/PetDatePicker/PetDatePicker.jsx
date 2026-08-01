import React, { useState } from "react";
import "./PetDatePicker.css";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

function toMondayIndex(jsDay) {
  // JS getDay(): 0=Sun..6=Sat  ->  convert to Mon-first index: 0=Mon..6=Sun
  return (jsDay + 6) % 7;
}

function PetDatePicker({ value, onChange, maxDate }) {
  const [view, setView] = useState("days"); // "days" | "months" | "years"
  const [viewDate, setViewDate] = useState(() => (value ? new Date(value.replace(/-/g, "/")) : new Date()));

  const max = maxDate ? new Date(maxDate.replace(/-/g, "/")) : new Date();
  const maxYear = max.getFullYear();
  const minYear = maxYear - 40;

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = toMondayIndex(new Date(year, month, 1).getDay());
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedDate = value ? new Date(value.replace(/-/g, "/")) : null;
  const today = new Date();

  const isDayDisabled = (d) => {
    if (!d) return false;
    return new Date(year, month, d) > max;
  };

  const isDaySelected = (d) =>
    d && selectedDate &&
    selectedDate.getFullYear() === year &&
    selectedDate.getMonth() === month &&
    selectedDate.getDate() === d;

  const isToday = (d) =>
    d &&
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === d;

  const pickDay = (d) => {
    if (!d || isDayDisabled(d)) return;
    const yyyy = year;
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    onChange(`${yyyy}-${mm}-${dd}`);
  };

  const pickMonth = (m) => {
    setViewDate(new Date(year, m, 1));
    setView("days");
  };

  const pickYear = (y) => {
    setViewDate(new Date(y, month, 1));
    setView("months");
  };

  const changeMonth = (delta) => setViewDate(new Date(year, month + delta, 1));

  const years = [];
  for (let y = maxYear; y >= minYear; y--) years.push(y);

  return (
    <div className="pet-cal">
      {view === "days" && (
        <>
          <div className="pet-cal-header">
            <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month">‹</button>
            <button type="button" className="pet-cal-header-label" onClick={() => setView("months")}>
              {MONTHS[month]} {year} <span className="pet-cal-caret">▾</span>
            </button>
            <button type="button" onClick={() => changeMonth(1)} aria-label="Next month">›</button>
          </div>

          <div className="pet-cal-weekdays">
            {DAYS.map((d) => (
              <span key={d} className={d === "Sun" ? "pet-cal-sun" : ""}>{d}</span>
            ))}
          </div>

          <div className="pet-cal-grid">
            {cells.map((d, i) => (
              <button
                type="button"
                key={i}
                disabled={!d || isDayDisabled(d)}
                className={`
                  pet-cal-cell
                  ${d ? "" : "pet-cal-cell--empty"}
                  ${isDaySelected(d) ? "pet-cal-cell--selected" : ""}
                  ${isToday(d) && !isDaySelected(d) ? "pet-cal-cell--today" : ""}
                `}
                onClick={() => pickDay(d)}
              >
                {d || ""}
              </button>
            ))}
          </div>
        </>
      )}

      {view === "months" && (
        <>
          <div className="pet-cal-header">
            <button type="button" className="pet-cal-header-label" onClick={() => setView("years")}>
              {year} <span className="pet-cal-caret">▾</span>
            </button>
          </div>
          <div className="pet-cal-month-grid">
            {MONTHS.map((m, i) => (
              <button
                type="button"
                key={m}
                className={`pet-cal-month-cell ${i === month ? "pet-cal-cell--selected" : ""}`}
                onClick={() => pickMonth(i)}
              >
                {m.slice(0, 3)}
              </button>
            ))}
          </div>
        </>
      )}

      {view === "years" && (
        <>
          <div className="pet-cal-header">
            <span className="pet-cal-header-label pet-cal-header-label--static">Select year</span>
          </div>
          <div className="pet-cal-year-grid">
            {years.map((y) => (
              <button
                type="button"
                key={y}
                className={`pet-cal-year-cell ${y === year ? "pet-cal-cell--selected" : ""}`}
                onClick={() => pickYear(y)}
              >
                {y}
              </button>
            ))}
          </div>
        </>
      )}

      {value && (
        <div className="pet-cal-footer">
          <span>Selected: <strong>{new Date(value.replace(/-/g, "/")).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong></span>
          <button type="button" className="pet-cal-clear" onClick={() => onChange("")}>Clear</button>
        </div>
      )}
    </div>
  );
}

export default PetDatePicker;