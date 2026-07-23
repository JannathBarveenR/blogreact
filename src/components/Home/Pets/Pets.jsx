import React from "react";
import { FiPlus } from "react-icons/fi";
import "./Pets.css";

import dogIcon from "../../../assets/dog.webp";
import catIcon from "../../../assets/cats.webp";
import rabbitIcon from "../../../assets/rabbit.webp";
import birdIcon from "../../../assets/bird.webp";
import defaultPetIcon from "../../../assets/other.webp";

export default function Pets({ pets = [], selectedPet, onPetSelect, onAddPet }) {
  const getPetPhoto = (pet) => pet.pet_photo_url || pet.image || null;

  const getPetIcon = (pet) => {
    const type = (pet.pet_type || pet.type || "").toLowerCase().trim();
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

  // Build the list of story items
  const items = [];

  // Add all pets
  pets.forEach((pet) => {
    items.push({
      id: pet.id,
      name: pet.pet_name || pet.name || "Pet",
      photo: getPetPhoto(pet),
      defaultIcon: getPetIcon(pet),
      isAdd: false,
      petData: pet,
    });
  });

  // Always show "Add a pet" at the end (or as the sole circle if no pets)
  items.push({
    id: "add_pet_btn",
    name: "Add a pet",
    isAdd: true,
  });

  return (
    <div className="pets-stories-wrapper">
      <div className="pets-stories-container">
        {items.map((item) => {
          const isSelected = selectedPet && selectedPet.id === item.id;

          if (item.isAdd) {
            return (
              <div
                key={item.id}
                className="pet-story-item add-pet-story"
                onClick={onAddPet}
              >
                <div className="story-ring add-ring">
                  <div className="story-inner add-inner">
                    <FiPlus size={28} className="add-plus-icon" />
                  </div>
                </div>
                <span className="story-name">{item.name}</span>
              </div>
            );
          }

          return (
            <div
              key={item.id}
              className={`pet-story-item${isSelected ? " active-story" : ""}`}
              onClick={() => onPetSelect(item.petData)}
            >
              <div className={`story-ring${isSelected ? " active" : ""}`}>
                <div className="story-inner">
                  {item.photo ? (
                    <img src={item.photo} alt={item.name} className="story-img" />
                  ) : (
                    <img src={item.defaultIcon} alt={item.name} className="story-img-default" />
                  )}
                </div>
              </div>
              <span className="story-name">{item.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
