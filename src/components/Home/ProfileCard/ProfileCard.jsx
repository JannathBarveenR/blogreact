import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiUpload, FiFileText, FiCreditCard, FiShield } from "react-icons/fi";
import { PetAvatar } from "../../common/PetAvatar";
import PetIdCardModal from "../../UserProfile/PetIdCardModal";
import useAuth from "../../../hooks/useAuth";
import "./ProfileCard.css";

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
    gender: pet.gender || "",
    birthDate: pet.birth_date || pet.dob || "",
    approxAge: pet.approx_age || pet.age || "",
    petIds: pet.pet_ids || pet.petIds || [],
    raw: pet,
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
  onUploadRecords,
  onAddPetNote,
  isStatic = false,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [internalShowDropdown, setInternalShowDropdown] = useState(false);
  const [viewingIdCard, setViewingIdCard] = useState(false);
  const internalRef = useRef(null);

  const isDropdownOpen = propShowPetDropdown !== undefined ? propShowPetDropdown : internalShowDropdown;
  const toggleDropdown = (e) => {
    e?.stopPropagation();
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
    petolifeId: "",
  };

  const normalizedPets = (pets || []).map(normalizePet).filter(Boolean);

  function getPetAge(petInfo) {
    if (petInfo.approxAge) {
      return petInfo.approxAge;
    }
    if (!petInfo.birthDate) {
      return "Not specified";
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

  const handleAvatarClick = (e) => {
    e.stopPropagation();
    setViewingIdCard(true);
  };

  const handleUploadRecordsClick = (e) => {
    e.stopPropagation();
    if (onUploadRecords) {
      onUploadRecords();
    } else {
      navigate("/records", { state: { openUpload: true } });
    }
  };

  const handleUploadNoteClick = (e) => {
    e.stopPropagation();
    if (onAddPetNote) {
      onAddPetNote();
    } else {
      navigate("/timeline/home", { state: { openAddNote: true } });
    }
  };

  return (
    <div className="profile-wrapper" ref={activeRef}>
      <div className={`profile-card${isStatic ? "" : " clickable"}`}>

        {/* Left Section: Pet Image */}
        <div className="profile-card__avatar-block">
          <div
            className="profile-avatar profile-avatar--rect"
            onClick={handleAvatarClick}
            title={`Click to view ${selectedPet.name} Health ID Card`}
          >
            {selectedPet.image ? (
              <img src={selectedPet.image} alt={selectedPet.name} className="avatar-img-rect" />
            ) : (
              <PetAvatar src={null} petType={selectedPet.petType} className="avatar-img-rect" size={60} />
            )}
          </div>
        </div>

        {/* Middle Section: Pet Name v, Breed, Age */}
        <div className="profile-info">
          <div className="profile-name-row" onClick={isStatic ? undefined : toggleDropdown}>
            <h2 className="profile-name">{selectedPet.name}</h2>
            {!isStatic && (
              <span className="profile-triangle-icon" title="Switch Pet">
                <svg
                  width="10"
                  height="8"
                  viewBox="0 0 10 8"
                  fill="#004b23"
                  style={{
                    transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                    display: "block",
                  }}
                >
                  <path d="M5 8L0 0H10L5 8Z" />
                </svg>
              </span>
            )}
          </div>

          <p className="profile-breed">{selectedPet.breed}</p>
          <p className="profile-age">{getPetAge(selectedPet)}</p>
        </div>

        {/* Vertical Divider Line 1 */}
        <div className="profile-card__divider" />

        {/* Right Section Column 1: Upload Medical Records */}
        <div
          className="profile-card__action-col"
          onClick={handleUploadRecordsClick}
          title="Upload Medical Records"
        >
          <FiUpload size={16} className="action-col-icon action-col-icon--green" />
          <span className="action-col-text">
            Medical<br />Records
          </span>
        </div>

        {/* Vertical Divider Line 2 */}
        <div className="profile-card__divider" />

        {/* Right Section Column 2: Upload Pet Note */}
        <div
          className="profile-card__action-col"
          onClick={handleUploadNoteClick}
          title="Upload Pet Note"
        >
          <FiFileText size={16} className="action-col-icon action-col-icon--teal" />
          <span className="action-col-text">
            Pet<br />Note
          </span>
        </div>

      </div>

      {/* Floating Pet Switcher Dropdown */}
      {!isStatic && (
        <div className={`pet-switcher ${isDropdownOpen ? "open" : ""}`}>
          {/* If only 1 pet exists, show ONLY "+ Add Pet" */}
          {pets.length > 1 && (
            <div className="pet-switcher__list">
              {normalizedPets.map((pet, idx) => {
                const originalPet = pets[idx] || pet.raw || pet;
                const isSelected = selectedPet.id === pet.id;

                return (
                  <div
                    key={pet.id}
                    className={`pet-switcher__item ${isSelected ? "active" : ""}`}
                    onClick={() => onSelect(originalPet)}
                  >
                    <div className="pet-switcher__avatar-rect">
                      {pet.image ? (
                        <img src={pet.image} alt={pet.name} className="pet-switcher__img" />
                      ) : (
                        <PetAvatar src={null} petType={pet.petType} size={38} />
                      )}
                    </div>

                    <div className="pet-switcher__info">
                      <h4>{pet.name}</h4>
                      <p>{pet.breed}</p>
                    </div>

                    {isSelected && (
                      <div className="pet-switcher__tick">✓</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <button className="pet-switcher__add-btn" onClick={onAddPet}>
            + Add Pet
          </button>
        </div>
      )}

      {/* Pet ID Card Modal */}
      {viewingIdCard && (
        <PetIdCardModal
          pet={rawSelectedPet || selectedPet.raw || selectedPet}
          owner={user}
          onClose={() => setViewingIdCard(false)}
        />
      )}
    </div>
  );
}