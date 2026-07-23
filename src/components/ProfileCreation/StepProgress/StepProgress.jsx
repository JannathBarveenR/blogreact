import React from "react";
import { TOTAL_STEPS } from "../constants";

const STEP_LABELS = ["Photo", "Details", "Review"];

function StepProgress({ stepNumber }) {
  return (
    <div className="w-full mb-6">
      <div className="relative flex items-center justify-between px-1">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
          const step = i + 1;
          const isDone = step < stepNumber;
          const isActive = step === stepNumber;
          const isLast = step === TOTAL_STEPS;

          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center gap-1.5 relative z-10">
                <div
                  className={`
                    flex items-center justify-center
                    h-9 w-9 rounded-full text-[15px] font-bold
                    transition-all duration-500 ease-out
                    ${
                      isDone
                        ? "bg-[#84B662] text-white scale-100"
                        : isActive
                        ? "bg-white border-2 border-[#84B662] text-[#004B49] scale-110 shadow-[0_0_0_6px_rgba(132,182,98,0.15)]"
                        : "bg-[#EDF2EA] text-[#9BAE9F] border-2 border-transparent"
                    }
                  `}
                >
                  {isDone ? "🐾" : step}
                </div>
                <span
                  className={`text-[11px] font-semibold tracking-tight transition-colors duration-300 ${
                    isActive ? "text-[#004B49]" : isDone ? "text-[#5C8A63]" : "text-[#B4BEB6]"
                  }`}
                >
                  {STEP_LABELS[i] || `Step ${step}`}
                </span>
              </div>

              {!isLast && (
                <div className="flex-1 h-[3px] mx-1 rounded-full bg-[#E4EBE0] relative overflow-hidden -translate-y-2.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#84B662] to-[#6FA54F] transition-all duration-700 ease-out"
                    style={{ width: step < stepNumber ? "100%" : "0%" }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="text-center mt-3">
        <span className="text-[13px] font-bold text-[#004B49]">
          Step {stepNumber} of {TOTAL_STEPS}
        </span>
      </div>
    </div>
  );
}

export default StepProgress;