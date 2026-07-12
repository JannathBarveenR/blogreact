import React, { useState, useEffect } from "react";
import "./MainLayout.css";
import { useNavigate, useLocation } from "react-router-dom";

import TopNav from "../common/TopNav/TopNav";
import BottomNav from "../common/BottomNav/BottomNav";
import MedicalRecords from "../medical/MedicalRecords";
import Home from "../Home/Home";
import TimelinePage from "../Timeline/TimelinePage";
import UserProfile from "../UserProfile/UserProfile";
import fetchWithAuth from "../../utils/fetchWithAuth";
import useAuth from "../../hooks/useAuth";

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Set tab from navigation state if available
  const [activeTab, setActiveTab] = useState(location.state?.tab || "home");
  
  const [pets, setPets] = useState([]);
  const [activePetId, setActivePetId] = useState(null);
  const [loadingPets, setLoadingPets] = useState(true);

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  const fetchPets = async () => {
    if (!user) return;
    setLoadingPets(true);
    try {
      // Try local storage first
      const localPets = localStorage.getItem(`pets_${user.id}`);
      if (localPets) {
        const parsed = JSON.parse(localPets);
        setPets(parsed);
        const savedActive = localStorage.getItem(`active_pet_id_${user.id}`);
        if (savedActive && parsed.some(p => p.id === savedActive)) {
          setActivePetId(savedActive);
        } else if (parsed.length > 0) {
          setActivePetId(parsed[0].id);
        }
      }

      // ✅ Fetch only THIS user's pets using their user.id
      const res = await fetchWithAuth(`/api/pet-profile/by-user/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setPets(data);
        localStorage.setItem(`pets_${user.id}`, JSON.stringify(data));
        
        const savedActive = localStorage.getItem(`active_pet_id_${user.id}`);
        if (savedActive && data.some(p => p.id === savedActive)) {
          setActivePetId(savedActive);
        } else if (data.length > 0) {
          setActivePetId(data[0].id);
          localStorage.setItem(`active_pet_id_${user.id}`, data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch pets", err);
    } finally {
      setLoadingPets(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, [user]);

  // Single source of truth for "go start the add-pet flow" —
  // used by AddPetCard, BottomNav's FAB, Home, MedicalRecords, and UserProfile.
  const handleAddPet = () => {
    navigate("/create-pet-profile");
  };

  // Same pattern QuickActions already uses for its "Medical Records" card —
  // just flip the active tab, no route change needed.
  const handleUploadRecords = () => {
    setActiveTab("medicalrecords");
  };

  const handlePetSelect = (selectedPet) => {
    if (!selectedPet) return;
    setActivePetId(selectedPet.id);
    if (user?.id) {
      localStorage.setItem(`active_pet_id_${user.id}`, selectedPet.id);
    }
  };

  const renderContent = () => {
    if (activeTab === "timeline" || activeTab === "checklist") {
      return (
        <div style={{ paddingBottom: '70px', height: '100vh', overflowY: 'auto' }}>
          <TopNav />
          <TimelinePage />
        </div>
      );
    }
    
    if (activeTab === "medicalrecords" || activeTab === "docs") {
      return (
        <div style={{ paddingBottom: '70px', height: '100vh', overflowY: 'auto' }}>
          <TopNav />
          <MedicalRecords
            pets={pets}
            activePetId={activePetId}
            onPetSelect={handlePetSelect}
            onAddPet={handleAddPet}
          />
        </div>
      );
    }

    if (activeTab === "profile") {
      return (
        <div style={{ paddingBottom: '70px', height: '100vh', overflowY: 'auto' }}>

          <UserProfile
            pets={pets}
            activePetId={activePetId}
            onPetSelect={handlePetSelect}
            onAddPet={handleAddPet}
            refreshPets={fetchPets}
          />
        </div>
      );
    }

    // HOME TAB
    return (
      <div style={{ paddingBottom: '70px', height: '100vh', overflowY: 'auto' }}>
        <TopNav />
        <Home
          pets={pets}
          activePetId={activePetId}
          onPetSelect={handlePetSelect}
          onAddPet={handleAddPet}
        />
      </div>
    );
  };

  return (
    <>
      {renderContent()}
      <BottomNav
        active={activeTab}
        onNavigate={(page) => setActiveTab(page)}
        onAddPet={handleAddPet}
        onUploadRecords={handleUploadRecords}
      />
    </>
  );
};

export default MainLayout;