import React from "react";
import "./Banner.css";
import petBg from "../../../assets/pet-health-banner.png"; // swap to your image path

const ShieldCheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 3L19 6V11C19 15.5 16 19 12 21C8 19 5 15.5 5 11V6L12 3Z"
      fill="currentColor"
    />
    <path
      d="M8.5 12L11 14.5L15.5 9.5"
      stroke="#ffffff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LeafIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M4 20C4 12 9 5 20 4C19 15 12 20 4 20Z" />
  </svg>
);

export default function Banner({
  petName,
  status = "Good",
  message = "Keep up the good care.",
}) {
  return (
    <div className="pet-banner" style={{ backgroundImage: `url(${petBg})` }}>
      <div className="pet-banner-overlay" />

      <div className="pet-banner-content">
        <h2 className="pet-banner-heading">
          {petName ? `${petName}'s health` : "Your pet's health"}
          <br />
          will be <span className="pet-banner-status">{status}!</span>
        </h2>

        <p className="pet-banner-subtext">{message}</p>

        <div className="pet-banner-badge-wrap">
          <LeafIcon className="pet-banner-leaf pet-banner-leaf--left" />
          <div className="pet-banner-badge">
            <ShieldCheckIcon />
          </div>
          <LeafIcon className="pet-banner-leaf pet-banner-leaf--right" />
        </div>
      </div>
    </div>
  );
}