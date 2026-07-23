import React, { useState } from "react";
import StepProgress from "../StepProgress/StepProgress";
import StepHeaderBar from "../StepHeaderBar/StepHeaderBar";
import { breedData, petTypes } from "../constants";
import PetDatePicker from "../PetDatePicker/PetDatePicker";
import { FiCalendar } from "react-icons/fi";
import "./Step2.css";

function Step2({ goNext, goBack, petData }) {
  const [selectedPet, setSelectedPet] = useState(petData.petType || "");
  const [selectedPetCard, setSelectedPetCard] = useState(
    petData.petType && ["Dog", "Cat", "Bird", "Rabbit", "Parrot"].includes(petData.petType)
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
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [customPetType, setCustomPetType] = useState("");
  const [customBreed, setCustomBreed] = useState("");
  const [localError, setLocalError] = useState("");
  const breedBoxRef = React.useRef(null);

  const [petIds, setPetIds] = useState(
    petData.petIds?.length ? petData.petIds : [{ idName: "", idNumber: "" }]
  );

  const [knowDOB, setKnowDOB] = useState(!!petData.birthDate);
  const [dob, setDob] = useState(petData.birthDate || "");
  const getApproxYears = () => {
    if (!petData.approxAge) return "";
    const match = petData.approxAge.match(/(\d+)y/);
    return match ? match[1] : "";
  };
  const getApproxMonths = () => {
    if (!petData.approxAge) return "";
    const match = petData.approxAge.match(/(\d+)m/);
    return match ? match[1] : "";
  };
  const [years, setYears] = useState(getApproxYears());
  const [months, setMonths] = useState(getApproxMonths());
  const maxDate = new Date().toISOString().split("T")[0];

  const progress = 66;

  const rawFiltered =
    breedData[selectedPet]?.filter((breed) =>
      breed.toLowerCase().includes(breedSearch.toLowerCase()) &&
      breed !== "Other"
    ) || [];
  const filteredBreeds = [...rawFiltered, "Other"];

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
    goNext({
      petType: selectedPet,
      breed: selectedBreed,
      gender: selectedGender,
      petName,
      petIds,
      knowDOB,
      birthDate: knowDOB ? dob : "",
      approxAge: !knowDOB ? `${years || 0}y ${months || 0}m` : "",
    });
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
                  !["Dog", "Cat", "Bird", "Rabbit", "Parrot"].includes(selectedPet)
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
          </button>
        </div>

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

        {/* AGE / DOB */}
        <div className="form-group">
          <label>Date of Birth or Age</label>
          <div className="age-toggle-row">
            <button
              type="button"
              className={`age-toggle-btn ${knowDOB ? "active" : ""}`}
              onClick={() => setKnowDOB(true)}
            >
              I know the DOB
            </button>
            <button
              type="button"
              className={`age-toggle-btn ${!knowDOB ? "active" : ""}`}
              onClick={() => setKnowDOB(false)}
            >
              Approximate age
            </button>
          </div>

          {knowDOB ? (
            <div
              className="dob-trigger-wrapper"
              onClick={() => setShowDatePickerModal(true)}
            >
              <input
                type="text"
                readOnly
                placeholder="Select Date of Birth"
                value={
                  dob
                    ? new Date(dob).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : ""
                }
                className="dob-trigger-input"
              />
              <FiCalendar className="dob-calendar-icon" />
            </div>
          ) : (
            <div className="age-row">
              <div className="age-field">
                <label>Years</label>
                <input
                  type="number"
                  placeholder="e.g. 3"
                  value={years}
                  min="0"
                  max="100"
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") { setYears(""); return; }
                    const num = Number(v);
                    if (num >= 0 && num <= 100) setYears(num);
                  }}
                />
              </div>
              <div className="age-field">
                <label>Months</label>
                <input
                  type="number"
                  placeholder="e.g. 6"
                  value={months}
                  min="0"
                  max="11"
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") { setMonths(""); return; }
                    const num = Number(v);
                    if (num >= 0 && num <= 11) setMonths(num);
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {localError && <div className="submit-error">{localError}</div>}

        <div className="submit-section">
          <button className="next-btn" onClick={handleNext}>Next</button>
        </div>
      </div>

      {/* DATE PICKER POPUP MODAL */}
      {showDatePickerModal && (
        <div
          className="other-popup-overlay date-picker-overlay"
          onClick={() => setShowDatePickerModal(false)}
        >
          <div
            className="date-picker-popup"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="date-picker-popup-header">
              <h3>Select Date of Birth</h3>
              <button
                type="button"
                className="breed-popup-close"
                onClick={() => setShowDatePickerModal(false)}
              >
                ×
              </button>
            </div>
            <PetDatePicker
              value={dob}
              onChange={(newDob) => {
                setDob(newDob);
                if (newDob) {
                  setShowDatePickerModal(false);
                }
              }}
              maxDate={maxDate}
            />
          </div>
        </div>
      )}

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