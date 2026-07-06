import React, { useState, useRef, useEffect } from "react";
import "./TopNav.css";
import polLogo from "../../../assets/POL_logo.svg";
import { Bell } from "lucide-react";

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
            <Bell size={20} color="#004b49" />
          </button>

          {showNotifications && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                background: "#fff",
                border: "1px solid #e5ede1",
                borderRadius: "14px",
                padding: "14px 16px",
                boxShadow: "0 12px 28px rgba(0, 75, 73, 0.14)",
                fontSize: "13.5px",
                fontWeight: 600,
                color: "#6d756d",
                whiteSpace: "nowrap",
                zIndex: 100,
              }}
            >
              No notifications yet
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default TopNav;