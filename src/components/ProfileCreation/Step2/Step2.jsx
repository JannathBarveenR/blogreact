import React, { useState } from "react";
import StepProgress from "../StepProgress/StepProgress";
import StepHeaderBar from "../StepHeaderBar/StepHeaderBar";
import { breedData, petTypes } from "../constants";
import "./Step2.css";

function Step2({ goNext, goBack, petData }) {
  const [selectedPet, setSelectedPet] = useState(petData.petType || "");
  const [selectedPetCard, setSelectedPetCard] = useState(
    petData.petType && ["Dog", "Cat", "Bird", "Rabbit"].includes(petData.petType)
      ? petData.petType
      : petData.petType
      ? "Other"
      : ""
  );

  const [selectedBreed, setSelectedBreed] = useState(petData.breed || "");
  const [breedSearch, setBreedSearch] = useState("");
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);
  const [selectedGender, setSelectedGender] = useState(petData.gender || "");
  const [petName, setPetName] = useState(petData.petName || "");
  const [showOtherPopup, setShowOtherPopup] = useState(false);
  const [showOtherBreedPopup, setShowOtherBreedPopup] = useState(false);
  const [customPetType, setCustomPetType] = useState("");
  const [customBreed, setCustomBreed] = useState("");
  const [localError, setLocalError] = useState("");
  const breedBoxRef = React.useRef(null);

  const [petIds, setPetIds] = useState(
    petData.petIds?.length ? petData.petIds : [{ idName: "", idNumber: "" }]
  );

  const progress = 50;

  const filteredBreeds =
    breedData[selectedPet]?.filter((breed) =>
      breed.toLowerCase().includes(breedSearch.toLowerCase())
    ) || [];

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (breedBoxRef.current && !breedBoxRef.current.contains(e.target)) {
        setShowBreedDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNext = () => {
    if (!selectedPet) { setLocalError("Please select a pet type."); return; }
    if (!petName.trim()) { setLocalError("Please enter pet name."); return; }
    setLocalError("");
    goNext({ petType: selectedPet, breed: selectedBreed, gender: selectedGender, petName, petIds });
  };

  return (
    <section className="cpp">
      <div className="cpp-container step2-animate-in">
        <StepHeaderBar onBack={goBack} />
        <StepProgress progress={progress} stepNumber={2} />

        <div className="cpp-header">
          <center><h2>Tell us about your pet</h2></center>
        </div>

        {/* PET TYPE */}
        <div className="pet-type-section">
          <h3>What type of pet?</h3>
          <div className="pet-grid">
            {petTypes.map((pet) => (
              <button
                key={pet.name}
                type="button"
                className={`pet-card ${selectedPetCard === pet.name ? "active" : ""}`}
                onClick={() => {
                  if (pet.name === "Other") {
                    setShowOtherPopup(true);
                  } else {
                    setSelectedPet(pet.name);
                    setSelectedPetCard(pet.name);
                    setSelectedBreed("");
                    setBreedSearch("");
                  }
                }}
              >
                <span>
                  {pet.name === "Other" &&
                  selectedPet &&
                  !["Dog", "Cat", "Bird", "Rabbit"].includes(selectedPet)
                    ? selectedPet
                    : pet.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* PET NAME */}
        <div className="form-group">
          <label>Pet Name</label>
          <input
            type="text"
            placeholder="Enter pet name"
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
          />
        </div>

        {/* BREED */}
{/* BREED */}
<div className="form-group">
  <label>Breed</label>
  <button
    type="button"
    className="breed-selector"
    onClick={() => {
      if (!selectedPet) { alert("Please select a pet type first"); return; }
      setBreedSearch("");
      setShowBreedDropdown(true);
    }}
  >
    <span>{selectedBreed || "Search or select breed"}</span>
    <span className="chevron">›</span>
  </button>
</div>

{/* BREED POPUP */}
{showBreedDropdown && (
  <div className="other-popup-overlay" onClick={() => setShowBreedDropdown(false)}>
    <div className="breed-popup" onClick={(e) => e.stopPropagation()}>
      <div className="breed-popup-header">
        <h3>Select breed</h3>
        <button
          type="button"
          className="breed-popup-close"
          onClick={() => setShowBreedDropdown(false)}
        >
          ×
        </button>
      </div>

      <div className="breed-popup-search">
        <input
          type="text"
          autoFocus
          placeholder="Type to search breed..."
          value={breedSearch}
          onChange={(e) => setBreedSearch(e.target.value)}
        />
      </div>

      {breedData[selectedPet] ? (
        <div className="breed-popup-list">
          {filteredBreeds.length > 0 ? (
            filteredBreeds.map((breed) => (
              <button
                type="button"
                key={breed}
                className={`breed-dropdown-item ${selectedBreed === breed ? "active" : ""}`}
                onClick={() => {
                  if (breed === "Other") {
                    setShowBreedDropdown(false);
                    setShowOtherBreedPopup(true);
                  } else {
                    setSelectedBreed(breed);
                    setShowBreedDropdown(false);
                    setBreedSearch("");
                  }
                }}
              >
                {breed}
              </button>
            ))
          ) : (
            <div className="breed-dropdown-empty">No breeds found</div>
          )}
        </div>
      ) : (
        <div className="custom-breed-box">
          <input
            type="text"
            placeholder="Enter breed..."
            value={selectedBreed}
            onChange={(e) => setSelectedBreed(e.target.value)}
          />
          <button
            type="button"
            className="save-breed-btn"
            onClick={() => setShowBreedDropdown(false)}
          >
            Save Breed
          </button>
        </div>
      )}
    </div>
  </div>
)}

        {/* GENDER */}
        <div className="form-group">
          <label>Gender</label>
          <div className="gender-toggle-grid">
            {["Male", "Female"].map((gender) => (
              <button
                key={gender}
                type="button"
                className={`gender-toggle-card ${selectedGender === gender ? "active" : ""}`}
                onClick={() => setSelectedGender(gender)}
              >
                <span className="gender-icon">{gender === "Male" ? "♂" : "♀"}</span>
                <span>{gender}</span>
              </button>
            ))}
          </div>
        </div>

        {localError && <div className="submit-error">{localError}</div>}

        <div className="submit-section">
          <button className="next-btn" onClick={handleNext}>Next</button>
        </div>
      </div>

      {/* OTHER PET TYPE POPUP */}
      {showOtherPopup && (
        <div className="other-popup-overlay" onClick={() => setShowOtherPopup(false)}>
          <div className="other-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-icon">🐾</div>
            <h3>Tell us about your pet</h3>
            <p>Enter your pet type below</p>
            <input
              type="text"
              placeholder="Eg. Hamster, Turtle, Fish..."
              value={customPetType}
              onChange={(e) => setCustomPetType(e.target.value)}
            />
            <div className="popup-buttons">
              <button className="cancel-btn" onClick={() => setShowOtherPopup(false)}>Cancel</button>
              <button
                className="save-btn"
                onClick={() => {
                  if (!customPetType.trim()) return;
                  setSelectedPet(customPetType);
                  setSelectedPetCard("Other");
                  setShowOtherPopup(false);
                  setCustomPetType("");
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTHER BREED POPUP */}
      {showOtherBreedPopup && (
        <div className="other-popup-overlay" onClick={() => setShowOtherBreedPopup(false)}>
          <div className="other-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-icon">🧬</div>
            <h3>Enter Breed</h3>
            <p>Type your breed name</p>
            <input
              type="text"
              placeholder="Eg. Indie, Rajapalayam..."
              value={customBreed}
              onChange={(e) => setCustomBreed(e.target.value)}
            />
            <div className="popup-buttons">
              <button className="cancel-btn" onClick={() => { setShowOtherBreedPopup(false); setCustomBreed(""); }}>Cancel</button>
              <button
                className="save-btn"
                onClick={() => {
                  if (!customBreed.trim()) return;
                  setSelectedBreed(customBreed);
                  setShowOtherBreedPopup(false);
                  setCustomBreed("");
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Step2;