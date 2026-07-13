import React, { useEffect, useRef, useState } from "react";
import "./PetDashboard.css";

import ProfileCard from "./ProfileCard/ProfileCard";
import "./ProfileCard/ProfileCard.css";
import HealthBanner from "./HealthBanner/HealthBanner";
import QuickActions from "./QuickActions/QuickActions";
import "./QuickActions/QuickActions.css";
import ReminderCard from "./ReminderCard/ReminderCard";
import "./ReminderCard/ReminderCard.css";
import NoRecordsCard from "./NoRecordsCard/NoRecordsCard";
import "./NoRecordsCard/NoRecordsCard.css";
import HeroSection from "./HeroSection/HeroSection";
import AddPetCard from "./AddPetCard/AddPetCard";
import Banner from "./Banner/Banner";

export default function PetHome({
  pets = [],
  selectedPet: propSelectedPet,
  setSelectedPet,
  onAddPet,
}) {
  const [showPetDropdown, setShowPetDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const selectedPet = propSelectedPet || (pets.length > 0 ? pets[0] : null);

  const handlePetSelect = (pet) => {
    if (typeof setSelectedPet === "function") {
      setSelectedPet(pet);
    }
    setShowPetDropdown(false);
  };

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

        <HeroSection />

        <div style={{ marginTop: '24px' }}>
          <AddPetCard onAddPet={onAddPet} />
        </div>

        <div style={{ marginTop: '24px' }}>
          <HealthBanner />
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
        showPetDropdown={showPetDropdown}
        setShowPetDropdown={setShowPetDropdown}
        handlePetSelect={handlePetSelect}
        dropdownRef={dropdownRef}
        onAddPet={onAddPet}
      />

        <div style={{ marginTop: '-24px' }}>
          <Banner />
        </div>
        <div style={{ marginTop: '16px' }}>
          <QuickActions  />
        </div>
      
      <ReminderCard />
    </div>
  );
}