import React, { useState, useRef, useEffect } from "react";
import "./TopNav.css";
import polLogo from "../../../assets/POL_logo_tagline.png";

/**
 * Shared TopNav — used by HomeScreen, ChecklistPage, and other in-app pages.
 * Displays the official PetOLife logo asset and a notification icon.
 */
const TopNav = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="topnav">
      <div className="topnav__left">
        <div className="topnav__brand">
          <img src={polLogo} alt="PetOLife" className="topnav__logo-img" />
        </div>
      </div>
      <div className="topnav__right">
        <div ref={notifRef} style={{ position: "relative", display: "inline-block" }}>
          <button
            className="topnav__icon-btn"
            aria-label="Notifications"
            onClick={() => setShowNotifications((prev) => !prev)}
          >
            <PawIcon size={35} color="#004b23" />
          </button>

          

        </div>
      </div>
    </nav>
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