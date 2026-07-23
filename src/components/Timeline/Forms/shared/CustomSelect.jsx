import React, { useState, useRef, useEffect } from "react";
import "./CustomSelect.css";

export default function CustomSelect({
  value,
  options = [],
  onChange,
  placeholder = "Select an option",
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value || opt.key === value);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange?.(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="cs-wrap" ref={dropdownRef}>
      <button
        type="button"
        className={`cs-trigger ${isOpen ? "cs-trigger--open" : ""}`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
      >
        <span className={`cs-trigger__label ${!selectedOption ? "cs-trigger__label--placeholder" : ""}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className={`material-symbols-outlined cs-trigger__chevron ${isOpen ? "cs-trigger__chevron--open" : ""}`}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="cs-menu">
          {options.map((opt) => {
            const optVal = opt.value !== undefined ? opt.value : opt.key;
            const isSelected = optVal === value;

            return (
              <div
                key={optVal}
                className={`cs-option ${isSelected ? "cs-option--selected" : ""}`}
                onClick={() => handleSelect(optVal)}
              >
                <span className="cs-option__label">{opt.label}</span>
                {isSelected && (
                  <span className="material-symbols-outlined cs-option__check">
                    check
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
