import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Plus } from "lucide-react";
import useAuth from "../../../hooks/useAuth";
import PetLifestyleSurveyCard from "../PetLifestyleSurveyCard";
import welcomeImg from "../../../assets/Welcomeimg.jpeg";
import "./HeroSection.css";

export default function HeroSection({
  pets = [],
  selectedPet = null,
  onPetSelect,
  onNavigateTab,
  onSurveyActiveChange,
  onAddPet,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const userName =
    user?.user_metadata?.full_name || user?.name || "Pet Parent";

  const hours = new Date().getHours();
  let greeting;

  if (hours >= 5 && hours < 12) {
    greeting = "Happy morning";
  } else if (hours >= 12 && hours < 17) {
    greeting = "Happy afternoon";
  } else if (hours >= 17 && hours < 21) {
    greeting = "Happy evening";
  } else {
    greeting = "Happy night";
  }

  const targetPet = selectedPet || (pets && pets.length > 0 ? pets[0] : null);
  const targetSpecies = (targetPet?.pet_type || targetPet?.species || targetPet?.type || "").toLowerCase().trim();
  const isEligibleSurvey = targetSpecies === "dog" || targetSpecies === "cat";

  const handleAddPetClick = (e) => {
    e?.stopPropagation();
    if (onAddPet) {
      onAddPet();
    } else {
      navigate("/onboarding/pet");
    }
  };

  return (
    <div className="welcome-card">
      {/* Top Banner Section / Survey Container Card */}
      {isEligibleSurvey ? (
        <PetLifestyleSurveyCard
          pet={targetPet}
          pets={pets}
          onPetSelect={onPetSelect}
          userName={userName}
          onNavigateTab={onNavigateTab}
          onSurveyActiveChange={onSurveyActiveChange}
        />
      ) : (
        <div className="welcome-hero-banner">
          <div className="welcome-text-content">
            <h2 className="welcome-greeting">{greeting},</h2>
            <h2 className="welcome-username">{userName}!</h2>
            <div className="welcome-green-divider" />

            <p className="welcome-subtitle">
              Give your pet the care they deserve. Add your pet to track health records & smart reminders.
            </p>

            {(!pets || pets.length === 0) && (
              <button
                className="welcome-take-survey-btn"
                onClick={handleAddPetClick}
                type="button"
              >
                <Plus className="btn-survey-icon" size={17} strokeWidth={2.5} />
                <span>Add Your Pet</span>
                <ChevronRight className="btn-chevron-icon" size={17} strokeWidth={2.5} />
              </button>
            )}
          </div>

          <div className="welcome-image-wrapper">
            <img
              src={welcomeImg}
              alt="Pet Healthcare"
              className="welcome-bg-image"
            />
          </div>
        </div>
      )}
    </div>
  );
}
