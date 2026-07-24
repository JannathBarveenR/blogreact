import React, { useState } from "react";
import { FiPlus, FiArrowUpRight } from "react-icons/fi";
import useAuth from "../../../hooks/useAuth";
import PetIdCardModal from "../../UserProfile/PetIdCardModal";
import "./Pets.css";

import dogIcon from "../../../assets/dog.webp";
import catIcon from "../../../assets/cats.webp";
import rabbitIcon from "../../../assets/rabbit.webp";
import birdIcon from "../../../assets/bird.webp";
import defaultPetIcon from "../../../assets/other.webp";

export default function Pets({ pets = [], selectedPet, onPetSelect, onAddPet }) {
  const { user } = useAuth();
  const [viewingIdCardPet, setViewingIdCardPet] = useState(null);

  const getPetPhoto = (pet) => pet?.pet_photo_url || pet?.image || null;

  const getPetIcon = (pet) => {
    const type = (pet?.pet_type || pet?.type || "").toLowerCase().trim();
    switch (type) {
      case "dog":
        return dogIcon;
      case "cat":
        return catIcon;
      case "rabbit":
      case "bunny":
        return rabbitIcon;
      case "bird":
      case "parrot":
        return birdIcon;
      default:
        return defaultPetIcon;
    }
  };

  const getPetBreed = (pet) => {
    if (!pet) return "";
    const breed = pet.breed || pet.pet_breed || pet.breed_name;
    if (breed && typeof breed === "string" && breed.trim()) {
      return breed.trim();
    }
    const type = pet.pet_type || pet.type;
    if (type && typeof type === "string" && type.trim()) {
      return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    }
    return "Pet";
  };

  if (!pets || pets.length === 0) {
    return (
      <div className="pets-stories-wrapper">
        <div className="pets-stories-container">
          <div className="pet-story-item add-pet-story" onClick={onAddPet}>
            <div className="story-ring add-ring">
              <div className="story-inner add-inner">
                <FiPlus size={28} className="add-plus-icon" />
              </div>
            </div>
            <span className="story-name">Add a pet</span>
          </div>
        </div>
      </div>
    );
  }

  // Selected pet comes first
  const activeSelected = selectedPet && pets.some((p) => p.id === selectedPet.id)
    ? selectedPet
    : pets[0];

  const orderedPets = [
    activeSelected,
    ...pets.filter((p) => p.id !== activeSelected.id),
  ];

  return (
    <div className="pets-stories-wrapper">
      <div className="pets-stories-container">
        {orderedPets.map((pet, idx) => {
          const isSelected = idx === 0;
          const photo = getPetPhoto(pet);
          const defaultIcon = getPetIcon(pet);
          const name = pet.pet_name || pet.name || "Pet";

          if (isSelected) {
            return (
              <div
                key={pet.id}
                className="pet-capsule-card"
                onClick={() => onPetSelect?.(pet)}
              >
                <div className="pet-capsule-avatar">
                  {photo ? (
                    <img src={photo} alt={name} className="pet-capsule-img" />
                  ) : (
                    <img src={defaultIcon} alt={name} className="pet-capsule-img-default" />
                  )}
                </div>

                <div className="pet-capsule-text">
                  <span className="pet-capsule-name">{name}</span>
                  <span className="pet-capsule-age">{getPetBreed(pet)}</span>
                </div>

                <button
                  type="button"
                  className="pet-capsule-arrow-btn"
                  title="View Pet Health ID Card"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingIdCardPet(pet);
                  }}
                >
                  <FiArrowUpRight size={24} className="pet-capsule-arrow-icon" />
                </button>
              </div>
            );
          }

          return (
            <div
              key={pet.id}
              className="pet-story-item unselected-story"
              onClick={() => onPetSelect?.(pet)}
            >
              <div className="story-ring">
                <div className="story-inner">
                  {photo ? (
                    <img src={photo} alt={name} className="story-img" />
                  ) : (
                    <img src={defaultIcon} alt={name} className="story-img-default" />
                  )}
                </div>
              </div>
              <span className="story-name">{name}</span>
            </div>
          );
        })}

        {/* Add Pet Story */}
        <div className="pet-story-item add-pet-story" onClick={onAddPet}>
          <div className="story-ring add-ring">
            <div className="story-inner add-inner">
              <FiPlus size={24} className="add-plus-icon" />
            </div>
          </div>
          <span className="story-name">Add a pet</span>
        </div>
      </div>

      {/* Pet Health ID Card Modal with Download Button */}
      {viewingIdCardPet && (
        <PetIdCardModal
          pet={viewingIdCardPet}
          owner={user}
          onClose={() => setViewingIdCardPet(null)}
        />
      )}
    </div>
  );
}
