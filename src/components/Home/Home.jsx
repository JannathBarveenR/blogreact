import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PetDashboard from "./PetDashboard";

export default function Home({ pets: propPets, activePetId: propActivePetId, onPetSelect, onAddPet, onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();

  const incomingPet = location.state?.newPet || null;

  // Use props from HomeScreen if provided, otherwise fall back to local state
  const [localPets, setLocalPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);

  const pets = propPets && propPets.length > 0 ? propPets : localPets;

  useEffect(() => {
    if (incomingPet) {
      setLocalPets([incomingPet]);
      setSelectedPet(incomingPet);
    }
  }, [incomingPet]);

  useEffect(() => {
    // When props change, update selected pet
    if (propPets && propPets.length > 0) {
      const active = propActivePetId
        ? propPets.find(p => p.id === propActivePetId) || propPets[0]
        : propPets[0];
      setSelectedPet(active);
    }
  }, [propPets, propActivePetId]);

  const handleSelect = (pet) => {
    setSelectedPet(pet);
    if (typeof onPetSelect === "function") {
      onPetSelect(pet);
    }
  };

  const handleAddPet = () => {
    navigate("/create-pet-profile");
  };

  return (
    <PetDashboard
      pets={pets}
      selectedPet={selectedPet}
      setSelectedPet={handleSelect}
      onAddPet={onAddPet || handleAddPet}
      onNavigateTab={onNavigate}
    />
  );
}