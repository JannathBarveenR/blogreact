import React from "react";
import { useNavigate } from "react-router-dom";
import logoImg from "../../assets/logo_clean.webp";
import "./NotFoundPage.css";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <img src={logoImg} alt="PetOLife Logo" className="not-found-logo" />

        <div className="coming-soon-badge">Coming Soon</div>

        <h1 className="not-found-title">Pet Parent Academy</h1>
        <p className="not-found-desc">
          PetoLife's own blogs page — expert pet care tips, training guides, and health insights — is under development and will be available soon!
        </p>

        <div className="coming-soon-features">
          <div className="coming-soon-feature">
            <span className="material-symbols-outlined coming-soon-icon">school</span>
            <span>Expert Articles</span>
          </div>
          <div className="coming-soon-feature">
            <span className="material-symbols-outlined coming-soon-icon">pets</span>
            <span>Training Guides</span>
          </div>
          <div className="coming-soon-feature">
            <span className="material-symbols-outlined coming-soon-icon">health_and_safety</span>
            <span>Health Tips</span>
          </div>
        </div>

        <button className="not-found-home-btn" onClick={() => navigate("/home")}>
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
