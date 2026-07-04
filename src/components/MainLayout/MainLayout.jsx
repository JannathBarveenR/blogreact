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
import { appCache, CACHE_KEYS, TTL } from "../../utils/appCache";

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

  const prefetchSecondaryData = (userId, currentPets) => {
    // 1. Prefetch user profile
    const profileKey = CACHE_KEYS.userProfile(userId);
    if (!appCache.get(profileKey, TTL.userProfile)) {
      fetchWithAuth(`/api/user-profile/${userId}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) appCache.set(profileKey, data);
        })
        .catch(() => {});
    }

    // 2. Prefetch medical records for active pet
    const activePet = activePetId || (currentPets && currentPets[0]?.id);
    if (activePet) {
      const recordsKey = CACHE_KEYS.medicalRecords(activePet);
      if (!appCache.get(recordsKey, TTL.medicalRecords)) {
        fetchWithAuth(`/api/medical-records/${activePet}`)
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data) appCache.set(recordsKey, data);
          })
          .catch(() => {});
      }
    }
  };

  const fetchPets = async (forceRefresh = false) => {
    if (!user) return;
    const cacheKey = CACHE_KEYS.pets(user.id);

    if (!forceRefresh) {
      const cached = appCache.get(cacheKey, TTL.pets);
      if (cached) {
        setPets(cached);
        setLoadingPets(false);
        prefetchSecondaryData(user.id, cached);
        return;
      }
    }

    setLoadingPets(true);
    try {
      // Try local storage first as cold fallback
      const localPets = localStorage.getItem(`pets_${user.id}`);
      if (localPets && !forceRefresh) {
        const parsed = JSON.parse(localPets);
        setPets(parsed);
        const savedActive = localStorage.getItem(`active_pet_id_${user.id}`);
        if (savedActive && parsed.some(p => p.id === savedActive)) {
          setActivePetId(savedActive);
        } else if (parsed.length > 0) {
          setActivePetId(parsed[0].id);
        }
      }

      // Fetch pets
      const res = await fetchWithAuth(`/api/pet-profile/by-user/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setPets(data);
        appCache.set(cacheKey, data);
        localStorage.setItem(`pets_${user.id}`, JSON.stringify(data));
        
        const savedActive = localStorage.getItem(`active_pet_id_${user.id}`);
        let finalActivePetId = activePetId;
        if (savedActive && data.some(p => p.id === savedActive)) {
          setActivePetId(savedActive);
          finalActivePetId = savedActive;
        } else if (data.length > 0) {
          setActivePetId(data[0].id);
          finalActivePetId = data[0].id;
          localStorage.setItem(`active_pet_id_${user.id}`, data[0].id);
        }
        
        prefetchSecondaryData(user.id, data);
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

  const handleFab = () => {
    navigate("/create-pet-profile");
  };

  const handlePetSelect = (selectedPet) => {
    if (!selectedPet) return;
    setActivePetId(selectedPet.id);
    if (user?.id) {
      localStorage.setItem(`active_pet_id_${user.id}`, selectedPet.id);
    }
  };

  return (
    <>
      <div style={{ paddingBottom: '70px', height: '100vh', overflowY: 'auto' }}>
        <TopNav />
        {/* Keep-alive structure using display: none for inactive tabs */}
        <div style={{ display: activeTab === "home" ? "block" : "none" }}>
          <Home
            pets={pets}
            activePetId={activePetId}
            onPetSelect={handlePetSelect}
            onAddPet={handleAddPet}
          />
        </div>
        <div style={{ display: (activeTab === "medicalrecords" || activeTab === "docs") ? "block" : "none" }}>
          <MedicalRecords
            pets={pets}
            activePetId={activePetId}
            onPetSelect={handlePetSelect}
            onAddPet={handleAddPet}
          />
        </div>
        <div style={{ display: activeTab === "profile" ? "block" : "none" }}>
          <UserProfile
            pets={pets}
            activePetId={activePetId}
            onPetSelect={handlePetSelect}
            onAddPet={handleAddPet}
            refreshPets={() => fetchPets(true)}
          />
        </div>
        <div style={{ display: (activeTab === "timeline" || activeTab === "checklist") ? "block" : "none" }}>
          <TimelinePage />
        </div>
      </div>
      <BottomNav
        active={activeTab}
        onNavigate={setActiveTab}
        onFabPress={handleFab}
      />
    </>
  );
};

export default MainLayout;
