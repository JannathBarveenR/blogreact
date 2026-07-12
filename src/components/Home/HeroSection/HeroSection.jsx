import React from "react";
import heroBg from "../../../assets/pet-parent.png";
import "./HeroSection.css";

export default function HeroSection() {
  return (
    <section
      className="hero"
      style={{ backgroundImage: `url(${heroBg})` }}
    >
      <div className="hero-inner">
        <div className="hero-left">


          <div className="hero-badge">
            <span className="hero-badge-icon"><PawIcon filled /></span>
            <div className="hero-text">Welcome to PetOLife</div>
          </div>

          <h1 className="hero-title">
            <span className="hero-title-dark">Your Pet's Journey,</span>
            <span className="hero-title-green">Our Priority.</span>
          </h1>

          <p className="hero-subtitle">
            Your all-in-one platform for pet care, health, community and
            everything your pet deserves.
          </p>

          
        </div>
      </div>
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