import React, { useState, useEffect } from "react";
import "./MainLayout.css";
import { useNavigate, useLocation } from "react-router-dom";

import TopNav from "../common/TopNav/TopNav";
import BottomNav from "../common/BottomNav/BottomNav";
import MedicalRecords from "../medical/MedicalRecords";
import Home from "../Home/Home";
import TimelinePage from "../Timeline/TimelinePage";
import UserProfile from "../UserProfile/UserProfile";
import useAuth from "../../hooks/useAuth";
import { usePets, useInvalidatePets } from "../../hooks/usePetsQuery";

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Derive active tab directly from URL pathname so browser history works natively
  const getTabFromPath = (path) => {
    if (path.startsWith("/timeline")) return "timeline";
    if (path.startsWith("/records")) return "medicalrecords";
    if (path.startsWith("/profile")) return "profile";
    return "home";
  };

  const activeTab = getTabFromPath(location.pathname);

  // TanStack Query: pets are now cached. Switching tabs re-uses cached data instantly.
  const { data: pets = [], isLoading: loadingPets } = usePets(user?.id);
  const invalidatePets = useInvalidatePets();
  const [activePetId, setActivePetId] = useState(null);

  // Sync activePetId when pets data arrives
  useEffect(() => {
    if (!pets.length || !user?.id) return;
    const savedActive = localStorage.getItem(`active_pet_id_${user.id}`);
    if (savedActive && pets.some((p) => p.id === savedActive)) {
      setActivePetId(savedActive);
    } else {
      setActivePetId(pets[0].id);
      localStorage.setItem(`active_pet_id_${user.id}`, pets[0].id);
    }
  }, [pets, user?.id]);

  const handleAddPet = () => {
    navigate("/create-pet-profile");
  };

  const handleUploadRecords = () => {
    navigate("/records");
  };

  const handleNavigateTab = (tabKey) => {
    if (tabKey === "home") navigate("/home");
    else if (tabKey === "timeline" || tabKey === "checklist") navigate("/timeline/home");
    else if (tabKey === "medicalrecords" || tabKey === "docs") navigate("/records");
    else if (tabKey === "profile") navigate("/profile");
  };

  const handlePetSelect = (selectedPet) => {
    if (!selectedPet) return;
    setActivePetId(selectedPet.id);
    if (user?.id) {
      localStorage.setItem(`active_pet_id_${user.id}`, selectedPet.id);
    }
  };

  const renderContent = () => {
    if (activeTab === "timeline") {
      return (
        <div style={{ paddingBottom: "70px", height: "100vh", overflowY: "auto" }}>
          <TopNav />
          <TimelinePage
            pets={pets}
            activePetId={activePetId}
            onPetSelect={handlePetSelect}
            onAddPet={handleAddPet}
          />
        </div>
      );
    }

    if (activeTab === "medicalrecords") {
      return (
        <div style={{ paddingBottom: "70px", height: "100vh", overflowY: "auto" }}>
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
        <div style={{ paddingBottom: "70px", height: "100vh", overflowY: "auto" }}>
          <UserProfile
            pets={pets}
            activePetId={activePetId}
            onPetSelect={handlePetSelect}
            onAddPet={handleAddPet}
            refreshPets={() => invalidatePets(user?.id)}
          />
        </div>
      );
    }

    // HOME TAB
    return (
      <div style={{ paddingBottom: "70px", height: "100vh", overflowY: "auto" }}>
        <TopNav />
        <Home
          pets={pets}
          activePetId={activePetId}
          onPetSelect={handlePetSelect}
          onAddPet={handleAddPet}
          onNavigate={(target) => handleNavigateTab(target)}
        />
      </div>
    );
  };

  return (
    <>
      {renderContent()}
      <BottomNav
        active={activeTab}
        onNavigate={handleNavigateTab}
        onAddPet={handleAddPet}
        onUploadRecords={handleUploadRecords}
      />
    </>
  );
};

export default MainLayout;