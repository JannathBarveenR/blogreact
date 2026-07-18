import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import Pets from "./Pets/Pets";
import fetchWithAuth from "../../utils/fetchWithAuth";

import polLogo from "../../assets/logo.webp";
import educationBannerImg from "../../assets/education-banner.png";

// Helper to get task list based on hour of the day
const getChecklistTasks = () => {
  const hours = new Date().getHours();
  
  if (hours >= 5 && hours < 12) {
    return [
      { id: "morning_breakfast", label: "Had breakfast" },
      { id: "morning_water", label: "Fresh water ready" },
      { id: "morning_active", label: "Feeling active" },
      { id: "morning_potty", label: "Potty looks normal" },
      { id: "morning_healthy", label: "Looking healthy" },
    ];
  } else if (hours >= 12 && hours < 17) {
    return [
      { id: "afternoon_water", label: "Water is topped up" },
      { id: "afternoon_eating", label: "Eating well" },
      { id: "afternoon_moving", label: "Moving around normally" },
      { id: "afternoon_relaxed", label: "Comfortable and relaxed" },
      { id: "afternoon_play", label: "Had some play or activity" },
    ];
  } else if (hours >= 17 && hours < 21) {
    return [
      { id: "evening_dinner", label: "Had dinner" },
      { id: "evening_water", label: "Fresh water ready" },
      { id: "evening_activity", label: "Had enough activity" },
      { id: "evening_clean", label: "Clean and comfortable" },
      { id: "evening_behavior", label: "No unusual behavior" },
    ];
  } else {
    return [
      { id: "night_water", label: "Water ready for the night" },
      { id: "night_sleeping", label: "Sleeping spot is comfortable" },
      { id: "night_safe", label: "Safe and settled in" },
      { id: "night_okay", label: "Feeling okay before bed" },
      { id: "night_meds", label: "Medicines or daily care done" },
    ];
  }
};

export default function PetHome({
  pets = [],
  selectedPet: propSelectedPet,
  setSelectedPet,
  onAddPet,
}) {
  const navigate = useNavigate();
  const [showPetDropdown, setShowPetDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [hasReminders, setHasReminders] = useState(false);

  const selectedPet = propSelectedPet || (pets.length > 0 ? pets[0] : null);

  const handlePetSelect = (pet) => {
    if (typeof setSelectedPet === "function") {
      setSelectedPet(pet);
    }
    setShowPetDropdown(false);
  };

  // Check if medical records exist to toggle reminders card forwarding
  useEffect(() => {
    if (!selectedPet?.id) {
      setHasReminders(false);
      return;
    }
    const checkReminders = async () => {
      try {
        const res = await fetchWithAuth(`/api/medical-records/${selectedPet.id}`);
        if (res.ok) {
          const data = await res.json();
          setHasReminders(data && data.length > 0);
        }
      } catch (err) {
        console.error("Error checking reminders:", err);
      }
    };
    checkReminders();
  }, [selectedPet?.id]);

  // Checklist State Management
  const todayStr = new Date().toISOString().split("T")[0];
  const currentTasks = getChecklistTasks();
  const [checkedTasks, setCheckedTasks] = useState({});

  // Sync checklist state when active pet changes or date changes
  useEffect(() => {
    if (!selectedPet?.id) return;
    const initial = {};
    currentTasks.forEach((t) => {
      const val = localStorage.getItem(`checklist_${todayStr}_${selectedPet.id}_${t.id}`);
      initial[t.id] = val === "true";
    });
    setCheckedTasks(initial);
  }, [selectedPet?.id, todayStr]);

  const toggleTask = (taskId) => {
    if (!selectedPet?.id) return;
    setCheckedTasks((prev) => {
      const newVal = !prev[taskId];
      localStorage.setItem(`checklist_${todayStr}_${selectedPet.id}_${taskId}`, String(newVal));
      return { ...prev, [taskId]: newVal };
    });
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

  const renderChecklist = () => {
    if (pets.length === 0 || !selectedPet) return null;

    const heading = pets.length === 1
      ? `Have you checked this for ${selectedPet.pet_name || selectedPet.name}?`
      : "Have you checked this for your pets?";

    return (
      <div className="checklist-card">
        <h4 className="checklist-header">{heading}</h4>
        <div className="checklist-items">
          {currentTasks.map((task) => {
            const isChecked = !!checkedTasks[task.id];
            return (
              <div
                key={task.id}
                className={`checklist-item ${isChecked ? "checked" : ""}`}
                onClick={() => toggleTask(task.id)}
              >
                <div className="checklist-checkbox">
                  {isChecked && <span className="check-mark">✓</span>}
                </div>
                <span className="checklist-text">{task.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!selectedPet || pets.length === 0) {
    return (
      <main className="pet-home">
        <HeroSection pets={pets} />

        <div className="dashboard-section-header" style={{ padding: '0 4px', margin: '10px 0 4px 0' }}>
          <h3 className="dashboard-section-title">Add your first pet</h3>
        </div>

        <div style={{ marginTop: '2px' }}>
          <Pets
            pets={[]}
            selectedPet={null}
            onPetSelect={handlePetSelect}
            onAddPet={onAddPet}
          />
        </div>

        <div className="education-section" style={{ marginTop: '8px' }}>
          <h3 className="education-title">Be the Best Pet Parent</h3>
          <div 
            className="education-card" 
            style={{ backgroundImage: `url(${educationBannerImg})` }}
            onClick={() => navigate("/app/blogs")}
          >
            <div className="education-card-content">
              <img src={polLogo} alt="PetOLife" className="education-logo-img" />
              <span className="education-text">Education</span>
              <p className="education-desc">
                Learn what experts say about pets
              </p>
            </div>
          </div>
        </div>

        {/* <div style={{ marginTop: '24px' }}>
          <HealthBanner />
        </div> */}

        <div style={{ height: 'var(--bottom-nav-height, 64px)' }} />
      </main>
    );
  }

  return (
    <div className="pet-home">
      <HeroSection pets={pets} />

      <div className="dashboard-section-header" style={{ padding: '0 4px', margin: '20px 0 4px 0' }}>
        <h3 className="dashboard-section-title">
          {pets.length === 1 ? "Your Pet" : "Your Pets"}
        </h3>
      </div>

      <Pets
        pets={pets}
        selectedPet={selectedPet}
        onPetSelect={handlePetSelect}
        onAddPet={onAddPet}
      />

      {/* Conditional Reminder/Checklist Ordering */}
      {hasReminders ? (
        <>
          <ReminderCard />
          {renderChecklist()}
        </>
      ) : (
        <>
          {renderChecklist()}
          {/* Hide ReminderCard completely when there are no reminders */}
        </>
      )}

      <div className="education-section" style={{ marginTop: '8px', marginBottom: '16px' }}>
        <h3 className="education-title">Be the Best Pet Parent</h3>
        <div 
          className="education-card" 
          style={{ backgroundImage: `url(${educationBannerImg})` }}
          onClick={() => navigate("/app/blogs")}
        >
          <div className="education-card-content">
            <img src={polLogo} alt="PetOLife" className="education-logo-img" />
            <span className="education-text">Education</span>
            <p className="education-desc">
              Learn what experts say about pets
            </p>
          </div>
        </div>
      </div>

      <ProfileCard
        pets={pets}
        selectedPet={selectedPet}
        isStatic={true}
      />

      <div style={{ marginTop: '16px' }}>
        <Banner />
      </div>
      <div style={{ marginTop: '16px' }}>
        <QuickActions  />
      </div>
    </div>
  );
}