import React from "react";
import { TOTAL_STEPS } from "../constants";
import dogParent from "../../../assets/dog-parent.png";
import homeCard from "../../../assets/dog-home.png";

function CelebrationBurst({ left, top, delay = 0 }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left,
        top,
        animationDelay: `${delay}s`,
      }}
    >
      <div className="relative h-[90px] w-[90px] animate-[burst_2.5s_infinite]">
        {[...Array(12)].map((_, i) => (
          <span
            key={i}
            className="
              absolute
              left-1/2
              top-1/2
              h-[22px]
              w-[2px]
              rounded-full
              origin-bottom
              bg-gradient-to-b
              from-[#84B662]
              to-transparent
            "
            style={{
              transform: `translate(-50%, -100%) rotate(${i * 30}deg)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function StepProgress({ stepNumber }) {
  const TRACK_START = 8;
  const TRACK_END = 88;

  const currentPosition =
    TRACK_START +
    ((stepNumber - 1) / (TOTAL_STEPS - 1)) *
      (TRACK_END - TRACK_START);

  return (
    <>
      <style>
        {`
          @keyframes burst {
            0% {
              transform: scale(0);
              opacity: 0;
            }
            20% {
              opacity: 1;
            }
            100% {
              transform: scale(1.3);
              opacity: 0;
            }
          }

          @keyframes sparkle {
            0%,100% {
              transform: scale(1);
              box-shadow:
                0 0 10px rgba(132,182,98,.3),
                0 0 20px rgba(132,182,98,.2);
            }

            50% {
              transform: scale(1.15);
              box-shadow:
                0 0 25px rgba(132,182,98,.8),
                0 0 40px rgba(132,182,98,.3);
            }
          }

          @keyframes glowPulse {
            0%,100% {
              opacity:.3;
              transform:scale(1);
            }

            50% {
              opacity:.8;
              transform:scale(1.25);
            }
          }

          .sparkle {
            animation: sparkle 1.5s infinite;
          }

          .glow-ring {
            position:absolute;
            width:70px;
            height:70px;
            border-radius:9999px;
            background:rgba(132,182,98,.15);
            filter:blur(18px);
            animation:glowPulse 2s infinite;
          }
        `}
      </style>

      <div className="relative overflow-visible rounded-[28px] ">

        {/* Background blur */}
        <div className="absolute -left-10 bottom-0 h-20 w-20 rounded-full bg-[#84B662]/10 blur-2xl" />
        <div className="absolute -right-10 top-0 h-20 w-20 rounded-full bg-[#004B49]/5 blur-2xl" />

        <div className="relative h-[150px]">

          {/* Base Line */}
          <div
            className="absolute top-[72px] h-[5px] rounded-full bg-[#D9DDD6]"
            style={{
              left: `${TRACK_START}%`,
              width: `${TRACK_END - TRACK_START}%`,
            }}
          />

          {/* Active Line */}
          <div
            className="
              absolute
              top-[72px]
              h-[5px]
              rounded-full
              bg-gradient-to-r
              from-[#84B662]
              to-[#6FA54F]
              transition-all
              duration-700
            "
            style={{
              left: `${TRACK_START}%`,
              width: `${currentPosition - TRACK_START}%`,
            }}
          />

          {/* Step Dots */}
          {[1, 2, 3, 4].map((step) => {
            const position =
              TRACK_START +
              ((step - 1) / (TOTAL_STEPS - 1)) *
                (TRACK_END - TRACK_START);

            const active = step <= stepNumber;

            return (
              <div
                key={step}
                className="absolute top-[63px] -translate-x-1/2"
                style={{
                  left: `${position}%`,
                }}
              >
                <div
                  className={`
                    relative
                    flex
                    h-7
                    w-7
                    items-center
                    justify-center
                    rounded-full
                    border-2
                    transition-all
                    duration-500
                    ${
                      step === TOTAL_STEPS &&
                      stepNumber === TOTAL_STEPS
                        ? "sparkle"
                        : ""
                    }
                    ${
                      active
                        ? "border-[#84B662] bg-white shadow-[0_0_20px_rgba(132,182,98,.5)]"
                        : "border-[#D0D0D0] bg-white"
                    }
                  `}
                >
                  {step === TOTAL_STEPS &&
                    stepNumber === TOTAL_STEPS && (
                      <div className="glow-ring" />
                    )}

                  {active && (
                    <div className="h-3 w-3 rounded-full bg-[#84B662]" />
                  )}
                </div>
              </div>
            );
          })}

          {/* Walking Parent */}
          <div
            className="absolute transition-all duration-700 ease-in-out"
            style={{
              left: `calc(${currentPosition}% - 35px)`,
              top: "5px",
              zIndex: 20,
            }}
          >
            <img
              src={dogParent}
              alt="Pet Parent"
              className="
                h-[70px]
                w-auto
                object-contain
                drop-shadow-lg
              "
            />
          </div>

          {/* Home */}
          <div
            className="absolute"
            style={{
              right: "-5px",
              top: "-5px",
              zIndex: 10,
            }}
          >
            {stepNumber === TOTAL_STEPS && (
              <>
                <CelebrationBurst
                  left="-90px"
                  top="-40px"
                  delay={0}
                />

                <CelebrationBurst
                  left="10px"
                  top="-70px"
                  delay={0.5}
                />

                <CelebrationBurst
                  left="100px"
                  top="-30px"
                  delay={1}
                />
              </>
            )}

            <img
              src={homeCard}
              alt="Home"
              className="
                h-[90px]
                w-auto
                object-contain
              "
            />
          </div>

          {/* Decorative Trees */}
          <div className="absolute left-[1px] top-[9px] text-5xl opacity-30">
            🌳
          </div>

        </div>

        {/* Step Badge */}
        <div className="mt-0 text-center">
          <div >
            <span className="text-[16px] font-bold text-[#004B49]">
              {stepNumber === TOTAL_STEPS
                ? `Step ${TOTAL_STEPS} of ${TOTAL_STEPS}`
                : `Step ${stepNumber} of ${TOTAL_STEPS}`}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export default StepProgress;