import React from "react";
import "./CustomStepper.css";

export default function CustomStepper({
  value = "1",
  unit = "tablet(s)",
  onChange,
  onUnitChange,
  allowedUnits = [],
}) {
  const numericVal = parseFloat(value) || 1;

  const handleDecrement = () => {
    let step = numericVal <= 1 ? 0.5 : 1;
    let newVal = Math.max(0.5, numericVal - step);
    newVal = Math.round(newVal * 10) / 10;
    onChange?.(newVal.toString());
  };

  const handleIncrement = () => {
    let step = numericVal < 1 ? 0.5 : 1;
    let newVal = numericVal + step;
    newVal = Math.round(newVal * 10) / 10;
    onChange?.(newVal.toString());
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    onChange?.(val);
  };

  return (
    <div className="cstep-container">
      <div className="cstep-stepper">
        <button
          type="button"
          className="cstep-btn cstep-btn--minus"
          onClick={handleDecrement}
          aria-label="Decrease quantity"
        >
          <span className="material-symbols-outlined">remove</span>
        </button>

        <div className="cstep-input-wrap">
          <input
            type="number"
            step="any"
            className="cstep-input"
            style={{ width: `${Math.max(1, String(value || "1").length)}ch` }}
            value={value}
            onChange={handleInputChange}
            placeholder="1"
          />
          <span className="cstep-unit">{unit}</span>
        </div>

        <button
          type="button"
          className="cstep-btn cstep-btn--plus"
          onClick={handleIncrement}
          aria-label="Increase quantity"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>
    </div>
  );
}
