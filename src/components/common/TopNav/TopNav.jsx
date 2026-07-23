import React, { useState, useEffect } from "react";
import "./TopNav.css";
import polLogo from "../../../assets/POL_logo_tagline.webp";
import RemindersModal from "../RemindersModal/RemindersModal";
import useAuth from "../../../hooks/useAuth";
import { usePets } from "../../../hooks/usePetsQuery";
import { getReminders } from "../../../api/timelineApi";

import { useNavigate } from "react-router-dom";

/**
 * Shared TopNav — used by HomeScreen, ChecklistPage, and other in-app pages.
 * Displays the official PetOLife logo asset and top header reminder button.
 */
const TopNav = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: pets = [] } = usePets(user?.id);
  const [activePet, setActivePet] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

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
        const pending = list.filter((r) => r.status !== "completed" && r.status !== "forgot");
        setPendingCount(pending.length);
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
              onClick={() => navigate("/reminders")}
              title="View Pet Reminders Page"
            >
              <PawIcon size={35} color="#004b23" />
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
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
                  }}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};

function PawIcon({ size = 20, color = "#004b49" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill={color}>
      <ellipse cx="32" cy="42" rx="14" ry="11" />
      <ellipse cx="14" cy="26" rx="6" ry="8" />
      <ellipse cx="50" cy="26" rx="6" ry="8" />
      <ellipse cx="23" cy="14" rx="5.5" ry="7" />
      <ellipse cx="41" cy="14" rx="5.5" ry="7" />
    </svg>
  );
}

export default TopNav;