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

  // Derive active tab directly from URL pathname so browser history works natively
  const getTabFromPath = (path) => {
    if (path.startsWith("/timeline")) return "timeline";
    if (path.startsWith("/records")) return "medicalrecords";
    if (path.startsWith("/profile")) return "profile";
    return "home";
  };

  const activeTab = getTabFromPath(location.pathname);

  const [pets, setPets] = useState([]);
  const [activePetId, setActivePetId] = useState(null);
  const [loadingPets, setLoadingPets] = useState(true);

  const fetchPets = async () => {
    if (!user) return;
    setLoadingPets(true);
    try {
      const localPets = localStorage.getItem(`pets_${user.id}`);
      if (localPets) {
        const parsed = JSON.parse(localPets);
        setPets(parsed);
        const savedActive = localStorage.getItem(`active_pet_id_${user.id}`);
        if (savedActive && parsed.some((p) => p.id === savedActive)) {
          setActivePetId(savedActive);
        } else if (parsed.length > 0) {
          setActivePetId(parsed[0].id);
        }
      }

      const res = await fetchWithAuth(`/api/pet-profile/by-user/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setPets(data);
        localStorage.setItem(`pets_${user.id}`, JSON.stringify(data));

        const savedActive = localStorage.getItem(`active_pet_id_${user.id}`);
        if (savedActive && data.some((p) => p.id === savedActive)) {
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
            refreshPets={fetchPets}
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