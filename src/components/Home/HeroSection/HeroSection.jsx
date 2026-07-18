import React from "react";
import useAuth from "../../../hooks/useAuth";
import "./HeroSection.css";

export default function HeroSection({ pets = [] }) {
  const { user } = useAuth();
  
  const userName = user?.user_metadata?.full_name || user?.name || "Pet Parent";
  
  const hours = new Date().getHours();
  let greeting = "Good evening";
  let themeClass = "evening-theme";
  
  if (hours >= 5 && hours < 12) {
    greeting = "Good morning";
    themeClass = "morning-theme";
  } else if (hours >= 12 && hours < 17) {
    greeting = "Happy afternoon";
    themeClass = "afternoon-theme";
  } else if (hours >= 17 && hours < 21) {
    greeting = "Good evening";
    themeClass = "evening-theme";
  } else {
    greeting = "Good night";
    themeClass = "night-theme";
  }

  const hasPets = pets && pets.length > 0;
  const quote = "Until one has loved an animal, a part of one's soul remains unawakened.";

  return (
    <section className={`dashboard-hero ${themeClass}`}>

      <h1 className="dashboard-hero-title">
        {greeting}, <span className="dashboard-hero-username">{userName}</span>!
      </h1>

      {!hasPets ? (
        <p className="dashboard-hero-subtitle quote-style">
          "{quote}"
        </p>
      ) : (
        <p className="dashboard-hero-subtitle">
          Your all-in-one personalized pet health dashboard is ready.
        </p>
      )}
    </section>
  );
}

function PawIcon({ className = "", filled = false }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill={filled ? "currentColor" : "none"} stroke={filled ? "none" : "currentColor"} strokeWidth={filled ? 0 : 3}>
      <ellipse cx="32" cy="42" rx="14" ry="11" />
      <ellipse cx="14" cy="26" rx="6" ry="8" />
      <ellipse cx="50" cy="26" rx="6" ry="8" />
      <ellipse cx="23" cy="14" rx="5.5" ry="7" />
      <ellipse cx="41" cy="14" rx="5.5" ry="7" />
    </svg>
  );
}