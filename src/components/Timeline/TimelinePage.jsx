import React from "react";
import "./TimelinePage.css";
import timelineImg from "../../assets/timeline.webp"; 
// Small inline icon components (no external icon library needed)
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3 9.5H21" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8 3V6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M16 3V6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M7 13.5H9V15.5H7z" fill="currentColor" />
    <path d="M11 13.5H13V15.5H11z" fill="currentColor" />
    <path d="M15 13.5H17V15.5H15z" fill="currentColor" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 3L19 6V11C19 15.5 16 19 12 21C8 19 5 15.5 5 11V6L12 3Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M8.5 12L11 14.5L15.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TrendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 17L9.5 11.5L13.5 15.5L20 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14.5 8H20V13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="4" y="18" width="2.2" height="2.2" rx="0.4" fill="currentColor" opacity="0.35" />
    <rect x="8" y="18" width="2.2" height="2.2" rx="0.4" fill="currentColor" opacity="0.5" />
    <rect x="12" y="18" width="2.2" height="2.2" rx="0.4" fill="currentColor" opacity="0.7" />
    <rect x="16" y="18" width="2.2" height="2.2" rx="0.4" fill="currentColor" opacity="1" />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="5.5" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3.5 6.5L12 13L20.5 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const HeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 20.5C12 20.5 3.5 15.4 3.5 9.6C3.5 6.8 5.7 4.7 8.4 4.7C10 4.7 11.3 5.5 12 6.7C12.7 5.5 14 4.7 15.6 4.7C18.3 4.7 20.5 6.8 20.5 9.6C20.5 15.4 12 20.5 12 20.5Z" />
  </svg>
);

const PawIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="12" cy="15.5" rx="5" ry="4.2" />
    <ellipse cx="5.2" cy="9.5" rx="1.8" ry="2.3" />
    <ellipse cx="9.6" cy="6.3" rx="1.8" ry="2.3" />
    <ellipse cx="14.4" cy="6.3" rx="1.8" ry="2.3" />
    <ellipse cx="18.8" cy="9.5" rx="1.8" ry="2.3" />
  </svg>
);

const SparkleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L13.8 9.2L21 11L13.8 12.8L12 20L10.2 12.8L3 11L10.2 9.2L12 2Z" />
  </svg>
);

const features = [
  {
    icon: <CalendarIcon />,
    title: "Track vaccinations & due dates",
  },
  {
    icon: <ShieldIcon />,
    title: "Never miss important care",
  },
  {
    icon: <TrendIcon />,
    title: "AI-powered health insights",
  },
];

export default function TimelinePage() {
  return (
    <div className="ptcs-page">
      <div className="ptcs-card">
      {/* faint decorative paw prints */}
      <PawIcon className="ptcs-bg-paw ptcs-bg-paw--tl" />
      <PawIcon className="ptcs-bg-paw ptcs-bg-paw--tr" />
      <PawIcon className="ptcs-bg-paw ptcs-bg-paw--br" />

      <div className="ptcs-hero">
        {/* Replace src with your own asset, e.g. "/timeline.webp" */}
        <img src={timelineImg} alt="Puppy sitting beside a calendar" className="ptcs-hero-img" />
      </div>

      <div className="ptcs-badge">
        <SparkleIcon />
        <span>Coming soon</span>
        <SparkleIcon />
      </div>

      <h1 className="ptcs-heading">
        Timeline is on
        <br />
        <span className="ptcs-heading-accent">the way!</span>
      </h1>

      <p className="ptcs-subtitle">
        We're working hard to bring you a smart health timeline for your pet.
      </p>

      <div className="ptcs-features">
        {features.map((f) => (
          <div className="ptcs-feature-card" key={f.title}>
            <div className="ptcs-feature-icon">{f.icon}</div>
            <p className="ptcs-feature-title">{f.title}</p>
          </div>
        ))}
      </div>

      
    </div>
    </div>
  );
}