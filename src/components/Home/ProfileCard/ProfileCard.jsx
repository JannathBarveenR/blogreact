import React, { useState, useRef, useEffect } from "react";
import { PetAvatar } from "../../common/PetAvatar";
import "./ProfileCard.css";

import maleIcon from "./male-icon.png";
import femaleIcon from "./female-icon.png";
import pawIcon from "./paw-icon.png";

function normalizePet(pet) {
  if (!pet) return null;

  return {
    id: pet.id || Math.random().toString(),
    petolifeId: pet.petolife_id || pet.petolifeId || pet.pet_id || pet.id || "",
    name: pet.pet_name || pet.name || "Pet",
    image: pet.pet_photo_url || pet.image || "",
    petType: pet.pet_type || pet.type || "",
    breed: pet.breed || "Breed not added",
    gender: pet.gender || "Male",
    birthDate: pet.birth_date || "",
    approxAge: pet.approx_age || pet.age || "",
    petIds: pet.pet_ids || pet.petIds || [],
  };
}

export default function ProfileCard({
  pets = [],
  selectedPet: rawSelectedPet,
  showPetDropdown: propShowPetDropdown,
  setShowPetDropdown: propSetShowPetDropdown,
  handlePetSelect: propHandlePetSelect,
  dropdownRef: propDropdownRef,
  onAddPet,
  isStatic = false,
}) {
  const [internalShowDropdown, setInternalShowDropdown] = useState(false);
  const internalRef = useRef(null);

  const isDropdownOpen = propShowPetDropdown !== undefined ? propShowPetDropdown : internalShowDropdown;
  const toggleDropdown = () => {
    if (propSetShowPetDropdown) {
      propSetShowPetDropdown((prev) => !prev);
    } else {
      setInternalShowDropdown((prev) => !prev);
    }
  };

  const activeRef = propDropdownRef || internalRef;

  const onSelect = (pet) => {
    if (propHandlePetSelect) {
      propHandlePetSelect(pet);
    }
    if (propSetShowPetDropdown) {
      propSetShowPetDropdown(false);
    } else {
      setInternalShowDropdown(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeRef.current && !activeRef.current.contains(event.target)) {
        if (propSetShowPetDropdown) {
          propSetShowPetDropdown(false);
        } else {
          setInternalShowDropdown(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeRef, propSetShowPetDropdown]);

  const selectedPet = normalizePet(rawSelectedPet) || {
    id: "default",
    name: "Pet",
    image: pawIcon,
    breed: "Breed not added",
    gender: "Male",
    petolifeId: "",
  };

  const normalizedPets = (pets || []).map(normalizePet).filter(Boolean);
  function getPetAge(petInfo) {
    if (!petInfo.birthDate) {
      return petInfo.approxAge || "Age not added";
    }

    const birth = new Date(petInfo.birthDate);
    const today = new Date();

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();

    if (today.getDate() < birth.getDate()) {
      months--;
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    if (years > 0) {
      return `${years} ${years === 1 ? "Year" : "Years"}${
        months > 0 ? ` ${months} ${months === 1 ? "Month" : "Months"}` : ""
      }`;
    }

    return `${months} ${months === 1 ? "Month" : "Months"}`;
  }
  const genderIcon =
    selectedPet.gender?.toLowerCase() === "female"
      ? femaleIcon
      : maleIcon;

  return (
    <div className="profile-wrapper" ref={activeRef}>
      <div
        className={`profile-card${isStatic ? "" : " clickable"}`}
        onClick={isStatic ? undefined : toggleDropdown}
      >
        <div className="profile-avatar">
          <PetAvatar src={selectedPet.image} petType={selectedPet.petType} className="avatar-img" size={48} />
        </div>

        <div className="profile-info">
          <div className="profile-name-row">
            <h2 className="profile-name">{selectedPet.name}</h2>
            {!isStatic && (
              <span
                className={`profile-chevron ${
                  isDropdownOpen ? "rotate" : ""
                }`}
              >
                &#8964;
              </span>
            )}
          </div>

          <p className="profile-breed">{selectedPet.breed}</p>

          <div className="profile-meta">
            <span className="meta-item">
              <img src={pawIcon} alt="" className="meta-icon" />
              {getPetAge(selectedPet)}
            </span>

            <span className="meta-item">
              <img src={genderIcon} alt="" className="meta-icon" />
              {selectedPet.gender}
            </span>
          </div>
        </div>
      </div>

      {/* Floating Pet Switcher */}
      {!isStatic && (
        <div className={`pet-switcher ${isDropdownOpen ? "open" : ""}`}>
          {normalizedPets.map((pet, idx) => {
            const originalPet = pets[idx] || pet;
            const petGenderIcon =
              pet.gender?.toLowerCase() === "female"
                ? femaleIcon
                : maleIcon;

            return (
              <div
                key={pet.id}
                className={`pet-switcher__item ${
                  selectedPet.id === pet.id ? "active" : ""
                }`}
                onClick={() => onSelect(originalPet)}
              >
                <PetAvatar src={pet.image} petType={pet.petType} className="pet-switcher__avatar" size={40} />

                <div className="pet-switcher__info">
                  <h4>{pet.name}</h4>
                  <p>{pet.breed}</p>

                  <div className="pet-switcher__meta">
                    <span>
                      <img src={pawIcon} alt="" className="meta-icon" />
                      {getPetAge(pet)}
                    </span>

                    <span>
                      <img src={petGenderIcon} alt="" className="meta-icon" />
                      {pet.gender}
                    </span>
                  </div>
                </div>

                {selectedPet.id === pet.id && (
                  <div className="pet-switcher__tick">✓</div>
                )}
              </div>
            );
          })}

          <button className="pet-switcher__add-btn" onClick={onAddPet}>
            + Add Pet
          </button>
        </div>
      )}
    </div>
  );
}