import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PetDashboard.css";

import HealthBanner from "./HealthBanner/HealthBanner";
import QuickActions from "./QuickActions/QuickActions";
import "./QuickActions/QuickActions.css";
import HeroSection from "./HeroSection/HeroSection";
import AddPetCard from "./AddPetCard/AddPetCard";
import UploadRecordsCard from "./UploadRecordsCard/UploadRecordsCard";
import ProfileCard from "./ProfileCard/ProfileCard";

import polLogo from "../../assets/logo.webp";
import ppacBannerImg from "../../assets/ppac.png";
import fetchWithAuth from "../../utils/fetchWithAuth";
import PetLifestyleSurveyCard from "./PetLifestyleSurveyCard";

// -----------------------------------------------------------------------------
// Pet Dashboard Component
// -----------------------------------------------------------------------------
export default function PetHome({
  pets = [],
  selectedPet: propSelectedPet,
  setSelectedPet,
  onAddPet,
  onNavigateTab,
}) {
  const navigate = useNavigate();

  const selectedPet = propSelectedPet || (pets.length > 0 ? pets[0] : null);

  const handlePetSelect = (pet) => {
    if (typeof setSelectedPet === "function") {
      setSelectedPet(pet);
    }
  };

  const [showPetDropdown, setShowPetDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Survey State
  const [surveyCompleted, setSurveyCompleted] = useState(false); // Default false, will check DB
  const [checkingSurvey, setCheckingSurvey] = useState(true); // Default true to prevent flash

  useEffect(() => {
    const checkSurveyStatus = async () => {
      if (!selectedPet?.id) {
        setCheckingSurvey(false);
        return;
      }
      try {
        setCheckingSurvey(true);
        const res = await fetchWithAuth(`/api/pet-profile/${selectedPet.id}/lifestyle`);
        
        if (res.ok) {
          const data = await res.json();
          const hasAnswers = data.answers && Object.keys(data.answers).length > 0;
          setSurveyCompleted(hasAnswers);
        }
      } catch (err) {
        console.error("Failed to check survey status:", err);
      } finally {
        setCheckingSurvey(false);
      }
    };
    checkSurveyStatus();
  }, [selectedPet?.id]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowPetDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  if (!selectedPet || pets.length === 0) {
    return (
      <main className="pet-home">
        <div className="dashboard-section-header" style={{ padding: '0 4px', margin: '10px 0 4px 0' }}>
          <h3 className="dashboard-section-title">Add your first pet</h3>
        </div>

        <div style={{ marginTop: '2px' }}>
          <ProfileCard
            pets={[]}
            selectedPet={null}
            onAddPet={onAddPet}
          />
        </div>

        <HeroSection pets={pets} />

        <UploadRecordsCard onNavigateTab={onNavigateTab} />

        <div className="education-section" style={{ marginTop: '8px' }}>
          <div 
            className="education-card" 
            style={{ backgroundImage: `url(${ppacBannerImg})` }}
            onClick={() => window.open(`${window.location.origin}/pet-parent-academy`, "_blank")}
          >
            <div className="education-card-content">
              <button 
                className="education-learn-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`${window.location.origin}/pet-parent-academy`, "_blank");
                }}
              >
                Learn now
              </button>
            </div>
          </div>
        </div>

        <div style={{ height: 'var(--bottom-nav-height, 64px)' }} />
      </main>
    );
  }

  return (
    <div className="pet-home">
      <ProfileCard
        pets={pets}
        selectedPet={selectedPet}
        onPetSelect={handlePetSelect}
        onAddPet={onAddPet}
      />

      <div className="pet-dashboard-scrollable">
        <HeroSection 
          pets={pets} 
          surveyCompleted={surveyCompleted}
          checkingSurvey={checkingSurvey}
        />
      </div>

      <UploadRecordsCard onNavigateTab={onNavigateTab} />

      <div className="education-section" style={{ marginTop: '8px', marginBottom: '4px' }}>
        <div 
          className="education-card" 
          style={{ backgroundImage: `url(${ppacBannerImg})` }}
          onClick={() => window.open(`${window.location.origin}/pet-parent-academy`, "_blank")}
        >
          <div className="education-card-content">
            <button 
              className="education-learn-btn"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`${window.location.origin}/pet-parent-academy`, "_blank");
              }}
            >
              Learn now
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '4px' }}>
        <QuickActions onNavigateTab={onNavigateTab} />
      </div>
    </div>
  );
}