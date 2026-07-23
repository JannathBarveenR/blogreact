import React, { useState } from "react";
import StepProgress from "../StepProgress/StepProgress";
import StepHeaderBar from "../StepHeaderBar/StepHeaderBar";
import { FiEdit2, FiCheck } from "../icons";
import { API_BASE, petTypes, breedData } from "../constants";
import fetchWithAuth from "../../../utils/fetchWithAuth";
import { PetAvatar } from "../../common/PetAvatar";
import queryClient from "../../../utils/queryClient";
import "./Step4.css";

// Centralized age calculation so every consumer of pet data gets the
// same, always-populated string. Never returns "" if a valid birthDate
// is given.
function calculateAgeString(birthDate) {
  if (!birthDate) return "";

  const dob = new Date(birthDate);
  const today = new Date();

  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years < 0 || months < 0) return "";

  return `${years}y ${months}m`;
}

function Step4({ goBack, petData, setStep, isSubmitting, setIsSubmitting, submitError, setSubmitError, onNavigateToPetHome }) {
  const progress = 100;

  const [localPetData, setLocalPetData] = useState({
    petName: petData.petName || "",
    petType: petData.petType || "",
    breed: petData.breed || "",
    gender: petData.gender || "",
    birthDate: petData.birthDate || "",
    approxAge: petData.approxAge || "",
    petPhotoFile: petData.petPhotoFile || null
  });

  const [isEditing, setIsEditing] = useState(false);

  const [showBreedDropdown, setShowBreedDropdown] = useState(false);
  const [breedSearch, setBreedSearch] = useState("");
  const [showOtherBreedPopup, setShowOtherBreedPopup] = useState(false);
  const [customBreed, setCustomBreed] = useState("");

  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarYear, setCalendarYear] = useState(
    localPetData.birthDate ? new Date(localPetData.birthDate).getFullYear() : new Date().getFullYear()
  );
  const [calendarMonth, setCalendarMonth] = useState(
    localPetData.birthDate ? new Date(localPetData.birthDate).getMonth() : new Date().getMonth()
  );

  const rawFiltered =
    breedData[localPetData.petType]?.filter((breed) =>
      breed.toLowerCase().includes(breedSearch.toLowerCase()) &&
      breed !== "Other"
    ) || [];
  const filteredBreeds = [...rawFiltered, "Other"];

  React.useEffect(() => {
    if (localPetData.birthDate) {
      const computed = calculateAgeString(localPetData.birthDate);
      if (computed) {
        setLocalPetData((prev) => ({
          ...prev,
          approxAge: computed,
        }));
      }
    }
  }, [localPetData.birthDate]);

  const handleGenerate = async () => {
    setIsSubmitting(true);
    setSubmitError("");

    try {
      // Single source of truth for the display age, computed once here.
      // We no longer blank this out when birthDate exists — we resolve it
      // to a concrete string up front so nothing downstream has to guess.
      const resolvedAge =
        (localPetData.birthDate && calculateAgeString(localPetData.birthDate)) ||
        localPetData.approxAge ||
        "";

      const formData = new FormData();
      formData.append("pet_type", localPetData.petType || "");
      formData.append("pet_name", (localPetData.petName || "").trim());
      if (localPetData.breed)      formData.append("breed", localPetData.breed);
      if (localPetData.gender)     formData.append("gender", localPetData.gender);
      if (localPetData.birthDate)  formData.append("birth_date", localPetData.birthDate);
      if (resolvedAge)             formData.append("approx_age", resolvedAge);
      if (localPetData.petPhotoFile) formData.append("pet_photo", localPetData.petPhotoFile);

      const storedUserData = localStorage.getItem("user");
      if (storedUserData) {
        try {
          const userObj = JSON.parse(storedUserData);
          if (userObj.id) formData.append("user_id", userObj.id);
          const city = userObj.user_metadata?.city;
          if (city) formData.append("city", city);
        } catch {}
      }

      const validIds = (petData.petIds || []).filter(
        (p) => p.idName?.trim() && p.idNumber?.trim()
      );
      if (validIds.length > 0) {
        formData.append("pet_ids", JSON.stringify(validIds));
      }

      const response = await fetchWithAuth("/api/pet-profile/", {
        method: "POST",
        body: formData,
      });

      const profileData = await response.json();

      if (!response.ok) {
        throw new Error(
          profileData.detail || profileData.error || "Failed to create pet profile."
        );
      }

      const petProfileId = profileData.pet_profile_id;
      const petolifeId   = profileData.petolife_id;

      const localUser   = localStorage.getItem("user");
      const userId      = localUser ? JSON.parse(localUser).id : "guest";
      const storageKey  = `pets_${userId}`;

      // newPet: shape stored in localStorage (used to seed the dashboard
      // list on reload). `approx_age` is ALWAYS populated now — we don't
      // rely on `birth_date` surviving downstream to recompute it.
      const newPet = {
        id: petProfileId,
        petolife_id: petolifeId,
        pet_name: (localPetData.petName || "").trim(),
        pet_type: localPetData.petType,
        breed: localPetData.breed,
        gender: localPetData.gender,
        birth_date: localPetData.birthDate || "",
        approx_age: resolvedAge,
        age: resolvedAge, // duplicate under `age` too, since PetIdCardModal checks this key first
        pet_photo_url: profileData.data?.pet_photo_url,
      };

      const existingPetsStr = localStorage.getItem(storageKey);
      const existingPets    = existingPetsStr ? JSON.parse(existingPetsStr) : [];
      localStorage.setItem(storageKey, JSON.stringify([newPet, ...existingPets]));

      // petForHome: shape passed directly in-memory to the dashboard via
      // onNavigateToPetHome. Also always populated now.
      const petForHome = {
        id: petProfileId,
        petolife_id: petolifeId,
        name: (localPetData.petName || "").trim(),
        pet_type: localPetData.petType || "",
        breed: localPetData.breed || "Not added",
        gender: localPetData.gender || "Male",
        birth_date: localPetData.birthDate || "",
        age: resolvedAge || "Not added",
        image: profileData.data?.pet_photo_url ||
               (localPetData.petPhotoFile ? URL.createObjectURL(localPetData.petPhotoFile) : ""),
        pet_ids: validIds,
      };

      // Invalidating TanStack query cache ensures the dashboard fetches the new list
      queryClient.invalidateQueries({ queryKey: ["pets", userId] });

      onNavigateToPetHome({ newPet: petForHome });
    } catch (err) {
      console.error("Submit error:", err);
      setSubmitError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Max size to photo upload is 5mb");
        return;
      }
      setLocalPetData((prev) => ({ ...prev, petPhotoFile: file }));
    }
  };

  const inputStyle = { padding: '9px 10px', borderRadius: '10px', border: '1.5px solid #dce8d8', outline: 'none', width: '100%', maxWidth: '150px', textAlign: 'left', fontFamily: 'inherit', fontSize: '13.5px', color: '#16211f', background: '#fbfdf9' };

  return (
    <div className="confirm-container">
      <StepHeaderBar onBack={goBack} />
      <StepProgress progress={progress} stepNumber={4} />


      <div className="confirm-header">
        <h2 className="confirm-title">Review Pet Profile</h2>
      </div>

      <div className="confirm-card">
        <button
          type="button"
          className="confirm-card-edit-btn"
          onClick={() => setIsEditing(!isEditing)}
          title={isEditing ? "Save details" : "Edit details"}
        >
          {isEditing ? <FiCheck size={18} /> : <FiEdit2 size={16} />}
        </button>

        <div className="pet-summary-top">
          <div className="pet-avatar-wrap" style={{ position: 'relative' }}>
            <label style={{ cursor: isEditing ? 'pointer' : 'default', display: 'block' }}>
              <PetAvatar
                src={localPetData.petPhotoFile ? URL.createObjectURL(localPetData.petPhotoFile) : null}
                petType={localPetData.petType}
                className="pet-avatar"
                size={48}
              />
              {isEditing && (
                <input 
                  type="file" 
                  accept="image/*" 
                  hidden 
                  onChange={handleImageChange}
                />
              )}
              {isEditing && (
                <div style={{ position: 'absolute', bottom: -5, right: -5, background: '#4a8f43', color: 'white', borderRadius: '50%', padding: '2px 4px', fontSize: '10px' }}>
                  <FiEdit2 size={10} />
                </div>
              )}
            </label>
          </div>

          <div className="pet-summary-meta">
            <h3>{localPetData.petName || "Your Pet"}</h3>
            <p>{localPetData.breed || "Breed not added"}</p>
            <div className="pet-summary-badge">
              <span>{localPetData.petType || "Pet"}</span>
            </div>
          </div>
        </div>

        <div className="confirm-details">
          {[
            { label: "Pet Name",  name: "petName", type: "text" },
            { label: "Pet Type",  name: "petType", type: "select", options: petTypes.map(p => p.name) },
            { label: "Breed",     name: "breed", type: "breed-popup" },
            { label: "Gender",    name: "gender", type: "select", options: ["Male", "Female"] },
          ].map(({ label, name, type, options }) => (
            <div className="confirm-row" key={label}>
              <div className="confirm-row-left">
                <span className="label">{label}</span>
              </div>
              {isEditing ? (
                 type === "breed-popup" ? (
                   <button
                     type="button"
                     className="confirm-breed-selector-btn"
                     onClick={() => {
                       if (!localPetData.petType) { alert("Please select a pet type first"); return; }
                       setBreedSearch("");
                       setShowBreedDropdown(true);
                     }}
                     style={inputStyle}
                   >
                     <span>{localPetData.breed || "Select Breed"}</span>
                   </button>
                 ) : type === "select" && options?.length > 0 ? (
                   <select 
                     value={localPetData[name]} 
                     onChange={e => {
                       const val = e.target.value;
                       setLocalPetData(prev => {
                         const next = { ...prev, [name]: val };
                         if (name === "petType") next.breed = ""; // reset breed on type change
                         return next;
                       });
                     }} 
                     style={inputStyle}
                   >
                     <option value="">Select...</option>
                     {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                   </select>
                 ) : (
                   <input 
                     type="text" 
                     value={localPetData[name]} 
                     onChange={e => setLocalPetData({...localPetData, [name]: e.target.value})} 
                     style={inputStyle}
                     placeholder={`Enter ${label}`}
                   />
                 )
              ) : (
                 <strong>{localPetData[name] || "[Not Added]"}</strong>
              )}
            </div>
          ))}

          {/* Age / DOB Row */}
          <div className="confirm-row" key="Age">
            <div className="confirm-row-left">
              <span className="label">Age / DOB</span>
            </div>
            {isEditing ? (
              <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', alignItems: 'flex-start', width: '150px' }}>
                <button
                  type="button"
                  onClick={() => setShowCalendar(true)}
                  style={inputStyle}
                >
                  {localPetData.birthDate || "Select DOB"}
                </button>
                <span style={{ fontSize: '11px', color: '#8a938a', marginLeft: '4px' }}>Approx Age (if no DOB)</span>
                <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                  <input 
                    type="number" 
                    value={localPetData.approxAge.match(/(\d+)y/)?.[1] || ""} 
                    min="0" max="100"
                    onChange={e => {
                      const y = e.target.value;
                      const m = localPetData.approxAge.match(/(\d+)m/)?.[1] || "0";
                      setLocalPetData({...localPetData, approxAge: `${y}y ${m}m`, birthDate: ""});
                    }} 
                    style={{...inputStyle, width: '65px', maxWidth: '65px'}}
                    placeholder="Yrs"
                  />
                  <input 
                    type="number" 
                    value={localPetData.approxAge.match(/(\d+)m/)?.[1] || ""} 
                    min="0" max="11"
                    onChange={e => {
                      const m = e.target.value;
                      const y = localPetData.approxAge.match(/(\d+)y/)?.[1] || "0";
                      setLocalPetData({...localPetData, approxAge: `${y}y ${m}m`, birthDate: ""});
                    }} 
                    style={{...inputStyle, width: '65px', maxWidth: '65px'}}
                    placeholder="Mos"
                  />
                </div>
              </div>
            ) : (
              <strong>{localPetData.birthDate || localPetData.approxAge || "[Not Added]"}</strong>
            )}
          </div>
        </div>
      </div>

      {submitError && <div className="submit-error">{submitError}</div>}

      <button
        className={`generate-btn ${isSubmitting ? "loading" : ""}`}
        onClick={handleGenerate}
        disabled={isSubmitting || isEditing}
      >
        {isSubmitting ? (
          <>
            <span className="btn-spinner"></span>
            Generating Pet ID…
          </>
        ) : (
          <span>Generate Pet Health ID</span>
        )}
      </button>

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

            {breedData[localPetData.petType] ? (
              <div className="breed-popup-list">
                {filteredBreeds.length > 0 ? (
                  filteredBreeds.map((breed) => (
                    <button
                      type="button"
                      key={breed}
                      className={`breed-dropdown-item ${localPetData.breed === breed ? "active" : ""}`}
                      onClick={() => {
                        if (breed === "Other") {
                          setShowBreedDropdown(false);
                          setShowOtherBreedPopup(true);
                        } else {
                          setLocalPetData({ ...localPetData, breed });
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
                  value={localPetData.breed}
                  onChange={(e) => setLocalPetData({ ...localPetData, breed: e.target.value })}
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
                  setLocalPetData({ ...localPetData, breed: customBreed });
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

      {/* CALENDAR POPUP */}
      {showCalendar && (
        <div className="other-popup-overlay" onClick={() => setShowCalendar(false)}>
          <div className="calendar-popup" onClick={(e) => e.stopPropagation()}>
            <div className="calendar-popup-header">
              <h3>Select Birth Date</h3>
              <button
                type="button"
                className="breed-popup-close"
                onClick={() => setShowCalendar(false)}
              >
                ×
              </button>
            </div>

            <div className="calendar-selectors">
              <select
                value={calendarMonth}
                onChange={(e) => setCalendarMonth(parseInt(e.target.value))}
                className="calendar-select"
              >
                {[
                  "January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"
                ].map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>

              <select
                value={calendarYear}
                onChange={(e) => setCalendarYear(parseInt(e.target.value))}
                className="calendar-select"
              >
                {Array.from({ length: 40 }, (_, i) => new Date().getFullYear() - i).map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            <div className="calendar-grid">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div key={d} className="calendar-weekday-header">{d}</div>
              ))}
              {(() => {
                const firstDayIdx = new Date(calendarYear, calendarMonth, 1).getDay();
                const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                const cells = [];
                
                for (let i = 0; i < firstDayIdx; i++) {
                  cells.push(<div key={`empty-${i}`} className="calendar-day-empty" />);
                }
                
                for (let day = 1; day <= totalDays; day++) {
                  const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isSelected = localPetData.birthDate === dateStr;
                  const isToday = new Date().toISOString().split("T")[0] === dateStr;
                  const isFuture = new Date(calendarYear, calendarMonth, day) > new Date();

                  cells.push(
                    <button
                      key={`day-${day}`}
                      type="button"
                      disabled={isFuture}
                      className={`calendar-day-btn${isSelected ? " active" : ""}${isToday ? " today" : ""}`}
                      onClick={() => {
                        setLocalPetData({
                          ...localPetData,
                          birthDate: dateStr,
                          approxAge: calculateAgeString(dateStr)
                        });
                        setShowCalendar(false);
                      }}
                    >
                      {day}
                    </button>
                  );
                }
                return cells;
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Step4;