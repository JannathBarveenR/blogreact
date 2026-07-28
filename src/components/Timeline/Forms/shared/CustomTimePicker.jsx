import React, { useState } from "react";
import ReactDOM from "react-dom";
import "./CustomTimePicker.css";

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

export default function CustomTimePicker({
  value = "",
  onChange,
  placeholder = "--:-- --",
  label = "Select Time",
  sublabel = "",
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Parse initial 12h state from value ("HH:MM")
  const initialParts = value ? value.split(":") : ["08", "00"];
  let initH = parseInt(initialParts[0], 10) || 8;
  const initM = parseInt(initialParts[1], 10) || 0;
  const initPeriod = initH >= 12 ? "PM" : "AM";
  let initH12 = initH % 12;
  if (initH12 === 0) initH12 = 12;

  const [selectedHour, setSelectedHour] = useState(initH12);
  const [selectedMinute, setSelectedMinute] = useState(initM);
  const [selectedPeriod, setSelectedPeriod] = useState(initPeriod);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleOpen = () => {
    if (value) {
      const parts = value.split(":");
      let h = parseInt(parts[0], 10) || 8;
      const m = parseInt(parts[1], 10) || 0;
      const p = h >= 12 ? "PM" : "AM";
      let h12 = h % 12;
      if (h12 === 0) h12 = 12;
      setSelectedHour(h12);
      setSelectedMinute(m);
      setSelectedPeriod(p);
    }
    setIsOpen(true);
  };

  const handleSave = () => {
    let h24 = selectedHour % 12;
    if (selectedPeriod === "PM") h24 += 12;
    const time24 = `${String(h24).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")}`;
    onChange?.(time24);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange?.("");
    setIsOpen(false);
  };

  const handlePreset = (time24Str) => {
    onChange?.(time24Str);
    setIsOpen(false);
  };

  const displayTime = format24to12(value);

  return (
    <div className="ctp-wrap">
      <button
        type="button"
        className={`ctp-trigger ${value ? "ctp-trigger--active" : ""}`}
        onClick={handleOpen}
      >
        <span className="material-symbols-outlined ctp-icon">schedule</span>
        <span className={`ctp-trigger__text ${!value ? "ctp-trigger__text--placeholder" : ""}`}>
          {displayTime || placeholder}
        </span>
      </button>
      {sublabel && <span className="ctp-sublabel">{sublabel}</span>}

      {isOpen &&
        ReactDOM.createPortal(
          <div className="ctp-overlay" onClick={() => setIsOpen(false)}>
            <div className="ctp-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ctp-handle" />
            {/* Modal Header */}
            <div className="ctp-header">
              <div>
                <h3 className="ctp-title">{label}</h3>
                {sublabel && <p className="ctp-subtitle">{sublabel}</p>}
              </div>
              <button type="button" className="ctp-close" onClick={() => setIsOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Presets Row */}
            <div className="ctp-presets">
              <button type="button" className="ctp-preset-btn" onClick={() => handlePreset("08:00")}>
                08:00 AM
              </button>
              <button type="button" className="ctp-preset-btn" onClick={() => handlePreset("14:00")}>
                02:00 PM
              </button>
              <button type="button" className="ctp-preset-btn" onClick={() => handlePreset("20:00")}>
                08:00 PM
              </button>
            </div>

            {/* Time Selectors */}
            <div className="ctp-selectors">
              {/* Hours */}
              <div className="ctp-col">
                <label className="ctp-col-label">Hour</label>
                <div className="ctp-scroll-list">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <button
                      key={h}
                      type="button"
                      className={`ctp-num-btn ${selectedHour === h ? "ctp-num-btn--selected" : ""}`}
                      onClick={() => setSelectedHour(h)}
                    >
                      {String(h).padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minutes */}
              <div className="ctp-col">
                <label className="ctp-col-label">Minute</label>
                <div className="ctp-scroll-list">
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`ctp-num-btn ${selectedMinute === m ? "ctp-num-btn--selected" : ""}`}
                      onClick={() => setSelectedMinute(m)}
                    >
                      {String(m).padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>

              {/* AM / PM */}
              <div className="ctp-col ctp-col--period">
                <label className="ctp-col-label">Period</label>
                <div className="ctp-period-toggle">
                  <button
                    type="button"
                    className={`ctp-period-btn ${selectedPeriod === "AM" ? "ctp-period-btn--selected" : ""}`}
                    onClick={() => setSelectedPeriod("AM")}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    className={`ctp-period-btn ${selectedPeriod === "PM" ? "ctp-period-btn--selected" : ""}`}
                    onClick={() => setSelectedPeriod("PM")}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="ctp-footer">
              <button type="button" className="ctp-clear-btn" onClick={handleClear}>
                Clear
              </button>
              <button type="button" className="ctp-save-btn" onClick={handleSave}>
                Set Time
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
