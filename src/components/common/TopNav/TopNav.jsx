import React, { useState, useEffect } from "react";
import "./TopNav.css";
import polLogo from "../../../assets/logo_new.png";
import useAuth from "../../../hooks/useAuth";
import { usePets } from "../../../hooks/usePetsQuery";
import { getReminders } from "../../../api/timelineApi";
import ReminderBellSheet from "../RemindersModal/ReminderBellSheet";

/**
 * Shared TopNav — uses a bell icon (instead of paw) that opens an inline
 * reminder bottom-sheet for today's schedule when clicked.
 */
const TopNav = () => {
  const { user } = useAuth();
  const { data: pets = [] } = usePets(user?.id);
  const [activePet, setActivePet] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!pets.length || !user?.id) return;
    const savedActive = localStorage.getItem(`active_pet_id_${user.id}`);
    const selected = pets.find((p) => p.id === savedActive) || pets[0];
    setActivePet(selected);
  }, [pets, user?.id]);

  useEffect(() => {
    async function checkPendingReminders() {
      if (!activePet?.id) return;
      try {
        const res = await getReminders(activePet.id);
        const list = res.reminders || res || [];
        const today = new Date().toLocaleDateString("en-CA");
        const active = list.filter(
          (r) => r.status !== "completed" && r.due_date <= today
        );
        setPendingCount(active.length);
      } catch (err) {
        console.error("Error fetching reminder count:", err);
      }
    }
    checkPendingReminders();
  }, [activePet?.id]);

  return (
    <>
      <nav className="topnav">
        <div className="topnav__left">
          <div className="topnav__brand">
            <img src={polLogo} alt="PetOLife" className="topnav__logo-img" />
          </div>
        </div>
        <div className="topnav__right">
          <div style={{ position: "relative", display: "inline-block" }}>
            <button
              className="topnav__icon-btn"
              aria-label="Reminders"
              onClick={() => setSheetOpen(true)}
              title="View Today's Reminders"
            >
              <BellIcon size={26} color="#004b23" />
              {pendingCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -2,
                    background: "#84b662",
                    color: "#ffffff",
                    fontSize: 10,
                    fontWeight: 800,
                    borderRadius: "50%",
                    minWidth: 18,
                    height: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid #ffffff",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  }}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {sheetOpen && activePet && (
        <ReminderBellSheet
          petId={activePet.id}
          petName={activePet.pet_name || activePet.name}
          onClose={() => {
            setSheetOpen(false);
            // Refresh pending count after closing
            getReminders(activePet.id).then((res) => {
              const list = res.reminders || res || [];
              const today = new Date().toLocaleDateString("en-CA");
              const active = list.filter(
                (r) => r.status !== "completed" && r.due_date <= today
              );
              setPendingCount(active.length);
            }).catch(() => {});
          }}
        />
      )}
    </>
  );
};

function BellIcon({ size = 24, color = "#004b49" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export default TopNav;