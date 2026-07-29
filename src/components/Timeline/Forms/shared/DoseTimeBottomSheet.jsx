import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "./CustomTimePicker.css";

function getDoseCount(frequency) {
  if (!frequency) return 1;
  const f = frequency.toLowerCase();
  if (f.includes("twice") || f.includes("2")) return 2;
  if (f.includes("thrice") || f.includes("3")) return 3;
  if (f.includes("four") || f.includes("4")) return 4;
  return 1;
}

function getOrdinalLabel(index) {
  const ordinals = ["1st", "2nd", "3rd", "4th", "5th"];
  return ordinals[index] || `${index + 1}th`;
}

function format24to12(time24) {
  if (!time24) return "";
  const [hhStr, mmStr] = time24.split(":");
  let hh = parseInt(hhStr, 10);
  let mm = parseInt(mmStr || "0", 10);
  if (isNaN(hh)) return "";
  const period = hh >= 12 ? "PM" : "AM";
  let h12 = hh % 12;
  if (h12 === 0) h12 = 12;
  return `${String(h12).padStart(2, "0")}:${String(mm).padStart(2, "0")} ${period}`;
}

export default function DoseTimeBottomSheet({
  isOpen,
  onClose,
  frequency = "Daily (Once)",
  doseTimes = [],
  onSave,
}) {
  const doseCount = getDoseCount(frequency);
  const [activeDoseIndex, setActiveDoseIndex] = useState(0);
  const [localTimes, setLocalTimes] = useState([]);

  // Time picker wheel state
  const [selectedHour, setSelectedHour] = useState(8);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState("AM");

  // Sync state when sheet opens or doseCount / doseTimes changes
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const count = getDoseCount(frequency);
      const initial = Array.from({ length: count }, (_, i) => doseTimes[i] || "");
      setLocalTimes(initial);
      setActiveDoseIndex(0);

      // Load time for 1st dose if set
      const firstTime = initial[0];
      if (firstTime) {
        const [hStr, mStr] = firstTime.split(":");
        let h = parseInt(hStr, 10) || 8;
        const m = parseInt(mStr, 10) || 0;
        const p = h >= 12 ? "PM" : "AM";
        let h12 = h % 12;
        if (h12 === 0) h12 = 12;
        setSelectedHour(h12);
        setSelectedMinute(m);
        setSelectedPeriod(p);
      } else {
        setSelectedHour(8);
        setSelectedMinute(0);
        setSelectedPeriod("AM");
      }
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, frequency, doseTimes]);

  // When active dose tab changes, update picker wheel position without forcing auto-save
  const handleTabChange = (newIndex) => {
    setActiveDoseIndex(newIndex);
    const existingTime = localTimes[newIndex];
    if (existingTime) {
      const [hStr, mStr] = existingTime.split(":");
      let h = parseInt(hStr, 10) || 8;
      const m = parseInt(mStr, 10) || 0;
      const p = h >= 12 ? "PM" : "AM";
      let h12 = h % 12;
      if (h12 === 0) h12 = 12;
      setSelectedHour(h12);
      setSelectedMinute(m);
      setSelectedPeriod(p);
    } else {
      // Visual wheel defaults to 08:00 AM, but localTimes[newIndex] remains "" (Not Set)
      setSelectedHour(8);
      setSelectedMinute(0);
      setSelectedPeriod("AM");
    }
  };

  const updateLocalTimeForActiveDose = (idx, time24Str) => {
    setLocalTimes((prev) => {
      const updated = [...prev];
      updated[idx] = time24Str;
      return updated;
    });
  };

  const handleHourSelect = (h) => {
    setSelectedHour(h);
    let h24 = h % 12;
    if (selectedPeriod === "PM") h24 += 12;
    const t24 = `${String(h24).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")}`;
    updateLocalTimeForActiveDose(activeDoseIndex, t24);
  };

  const handleMinuteSelect = (m) => {
    setSelectedMinute(m);
    let h24 = selectedHour % 12;
    if (selectedPeriod === "PM") h24 += 12;
    const t24 = `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    updateLocalTimeForActiveDose(activeDoseIndex, t24);
  };

  const handlePeriodSelect = (p) => {
    setSelectedPeriod(p);
    let h24 = selectedHour % 12;
    if (p === "PM") h24 += 12;
    const t24 = `${String(h24).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")}`;
    updateLocalTimeForActiveDose(activeDoseIndex, t24);
  };

  const handleClearActiveDose = () => {
    updateLocalTimeForActiveDose(activeDoseIndex, "");
  };

  const handleSetTime = () => {
    let h24 = selectedHour % 12;
    if (selectedPeriod === "PM") h24 += 12;
    const t24 = `${String(h24).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")}`;
    const updatedTimes = [...localTimes];
    updatedTimes[activeDoseIndex] = t24;
    setLocalTimes(updatedTimes);

    // If there is a next dose tab, advance to it
    if (activeDoseIndex + 1 < doseCount) {
      const nextIdx = activeDoseIndex + 1;
      setActiveDoseIndex(nextIdx);
      const nextTime = updatedTimes[nextIdx];
      if (nextTime) {
        const [hStr, mStr] = nextTime.split(":");
        let h = parseInt(hStr, 10) || 8;
        const m = parseInt(mStr, 10) || 0;
        const p = h >= 12 ? "PM" : "AM";
        let h12 = h % 12;
        if (h12 === 0) h12 = 12;
        setSelectedHour(h12);
        setSelectedMinute(m);
        setSelectedPeriod(p);
      } else {
        setSelectedHour(8);
        setSelectedMinute(0);
        setSelectedPeriod("AM");
      }
    } else {
      // Done with all doses
      onSave?.(updatedTimes);
      onClose?.();
    }
  };

  const handleCloseModal = () => {
    onSave?.(localTimes);
    onClose?.();
  };

  if (!isOpen) return null;

  const currentActiveOrdinal = getOrdinalLabel(activeDoseIndex);

  return ReactDOM.createPortal(
    <div className="ctp-overlay" onClick={handleCloseModal}>
      <div className="ctp-modal dt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ctp-handle" />

        {/* Modal Header */}
        <div className="ctp-header dt-header">
          <div>
            <h3 className="ctp-title dt-title">Select {currentActiveOrdinal} Dose Time</h3>
            <p className="ctp-subtitle dt-subtitle">
              Dose {activeDoseIndex + 1} of {doseCount} • {frequency}
            </p>
          </div>
          <button type="button" className="ctp-close" onClick={handleCloseModal}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Dynamic Dose Toggles (Pill-style Segmented Buttons matching reference image) */}
        <div className="dt-toggles-container">
          {Array.from({ length: doseCount }).map((_, idx) => {
            const label = `${getOrdinalLabel(idx)} Dose`;
            const formattedTime = format24to12(localTimes[idx]);
            const isActive = idx === activeDoseIndex;

            return (
              <button
                key={idx}
                type="button"
                className={`dt-toggle-card ${isActive ? "dt-toggle-card--active" : ""}`}
                onClick={() => handleTabChange(idx)}
              >
                <span className="dt-toggle-label">{label}</span>
                <span className={`dt-toggle-time ${formattedTime ? "dt-toggle-time--set" : ""}`}>
                  {formattedTime || "Not Set"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Single Reusable Time Picker Columns */}
        <div className="ctp-selectors">
          {/* Hours */}
          <div className="ctp-col">
            <label className="ctp-col-label">HOUR</label>
            <div className="ctp-scroll-list">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                <button
                  key={h}
                  type="button"
                  className={`ctp-num-btn ${selectedHour === h ? "ctp-num-btn--selected" : ""}`}
                  onClick={() => handleHourSelect(h)}
                >
                  {String(h).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>

          {/* Minutes */}
          <div className="ctp-col">
            <label className="ctp-col-label">MINUTE</label>
            <div className="ctp-scroll-list">
              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`ctp-num-btn ${selectedMinute === m ? "ctp-num-btn--selected" : ""}`}
                  onClick={() => handleMinuteSelect(m)}
                >
                  {String(m).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>

          {/* AM / PM */}
          <div className="ctp-col ctp-col--period">
            <label className="ctp-col-label">PERIOD</label>
            <div className="ctp-period-toggle">
              <button
                type="button"
                className={`ctp-period-btn ${selectedPeriod === "AM" ? "ctp-period-btn--selected" : ""}`}
                onClick={() => handlePeriodSelect("AM")}
              >
                AM
              </button>
              <button
                type="button"
                className={`ctp-period-btn ${selectedPeriod === "PM" ? "ctp-period-btn--selected" : ""}`}
                onClick={() => handlePeriodSelect("PM")}
              >
                PM
              </button>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="ctp-footer">
          <button type="button" className="ctp-clear-btn" onClick={handleClearActiveDose}>
            Clear
          </button>
          <button type="button" className="ctp-save-btn" onClick={handleSetTime}>
            Set Time
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
