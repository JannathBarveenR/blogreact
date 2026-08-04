import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, ChevronLeft, FileText, Upload, Plus, ShieldCheck, X, ClipboardList } from "lucide-react";
import fetchWithAuth from "../../utils/fetchWithAuth";
import welcomeImg from "../../assets/Welcomeimg.jpeg";
import "./PetLifestyleSurveyCard.css";

export default function PetLifestyleSurveyCard({
  pet,
  pets = [],
  onPetSelect,
  userName = "Pet Parent",
  onNavigateTab,
  onSurveyActiveChange,
}) {
  const navigate = useNavigate();
  const petName = pet?.pet_name || pet?.name || "your pet";
  const petId = pet?.id;
  const species = (pet?.pet_type || pet?.species || pet?.type || "").toLowerCase().trim();
  const isDog = species === "dog";
  const isCat = species === "cat";
  const isEligible = isDog || isCat;

  // View state: 0 = banner overview (invite or completed), 1..12 = question index, 13 = completion screen
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [medPromptDismissed, setMedPromptDismissed] = useState(false);

  // Notify parent if survey is currently active (Q1..Q12)
  useEffect(() => {
    const isActive = currentQIndex > 0 && currentQIndex <= 12;
    if (typeof onSurveyActiveChange === "function") {
      onSurveyActiveChange(isActive);
    }
  }, [currentQIndex, onSurveyActiveChange]);

  // Greeting calculation
  const hours = new Date().getHours();
  let greeting;
  if (hours >= 5 && hours < 12) {
    greeting = "Happy morning";
  } else if (hours >= 12 && hours < 17) {
    greeting = "Happy afternoon";
  } else if (hours >= 17 && hours < 21) {
    greeting = "Happy evening";
  } else {
    greeting = "Happy night";
  }

  // Survey answers state
  const [answers, setAnswers] = useState({
    q1_activity: "",
    q2_feeding: "",
    q3_playtime: "",
    q4a_walks: "",
    q4b_location: "",
    q5_other_pets: "",
    q6_travel: "",
    q7a_outdoor: "",
    q8a_training: "",
    q7b_litterbox: "",
    q8b_cat_activities: [],
    q9_grooming: [],
    q10_medication: "",
    q11_diet: "",
    q11_diet_other: "",
    q12_notes: "",
  });

  // Check if another cat/dog pet has an incomplete survey
  const incompleteOtherPet = (pets || []).find((p) => {
    if (!p || p.id === petId) return false;
    const pSpecies = (p.pet_type || p.species || p.type || "").toLowerCase().trim();
    if (pSpecies !== "dog" && pSpecies !== "cat") return false;
    const cached = localStorage.getItem(`care_profile_${p.id}`);
    if (!cached) return true;
    try {
      const parsed = JSON.parse(cached);
      return !parsed || Object.keys(parsed).length === 0;
    } catch {
      return true;
    }
  });

  const DEFAULT_ANSWERS = {
    q1_activity: "",
    q2_feeding: "",
    q3_playtime: "",
    q4a_walks: "",
    q4b_location: "",
    q5_other_pets: "",
    q6_travel: "",
    q7a_outdoor: "",
    q8a_training: "",
    q7b_litterbox: "",
    q8b_cat_activities: [],
    q9_grooming: [],
    q10_medication: "",
    q11_diet: "",
    q11_diet_other: "",
    q12_notes: "",
  };

  // Load saved answers & resume step for current pet
  useEffect(() => {
    if (!petId || !isEligible) return;

    let isMounted = true;
    const cacheKey = `care_profile_${petId}`;
    const cached = localStorage.getItem(cacheKey);

    let loadedAnswers = { ...DEFAULT_ANSWERS };
    let completedFlag = false;

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && Object.keys(parsed).length > 0) {
          loadedAnswers = { ...DEFAULT_ANSWERS, ...parsed };
          completedFlag = true;
        }
      } catch (e) {}
    }

    setAnswers(loadedAnswers);
    setIsCompleted(completedFlag);
    setMedPromptDismissed(false);

    // Load saved in-progress question index if user paused previously
    const savedQIndex = localStorage.getItem(`care_profile_qindex_${petId}`);
    if (savedQIndex && !isNaN(savedQIndex)) {
      const idx = parseInt(savedQIndex, 10);
      if (idx > 0 && idx <= 12) {
        if (!completedFlag) {
          setCurrentQIndex(idx);
        }
      }
    }

    const fetchLifestyle = async () => {
      try {
        const res = await fetchWithAuth(`/api/pet-profile/${petId}/lifestyle`);
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.answers && Object.keys(data.answers).length > 0) {
            setAnswers({ ...DEFAULT_ANSWERS, ...data.answers });
            setIsCompleted(true);
            localStorage.setItem(cacheKey, JSON.stringify(data.answers));
          } else if (!cached) {
            setAnswers({ ...DEFAULT_ANSWERS });
            setIsCompleted(false);
          }
        }
      } catch (err) {
        console.error("Error fetching lifestyle data:", err);
      }
    };

    fetchLifestyle();
    return () => {
      isMounted = false;
    };
  }, [petId, isEligible]);

  if (!isEligible) {
    return null; // The survey is only for cats and dogs
  }

  // Save current question index in localStorage for seamless resume
  const updateQuestionIndex = (nextIdx) => {
    setCurrentQIndex(nextIdx);
    if (petId && nextIdx > 0 && nextIdx <= 12) {
      localStorage.setItem(`care_profile_qindex_${petId}`, nextIdx.toString());
    }
  };

  const handleSingleOptionClick = (field, val, autoAdvance = true) => {
    const updated = { ...answers, [field]: val };
    setAnswers(updated);
    if (petId) {
      localStorage.setItem(`care_profile_${petId}`, JSON.stringify(updated));
    }
    if (field === "q10_medication" && val === "Yes") {
      setMedPromptDismissed(false);
    }
    if (autoAdvance) {
      if (currentQIndex < 12) {
        updateQuestionIndex(currentQIndex + 1);
      }
    }
  };

  const toggleCatActivity = (act) => {
    setAnswers((prev) => {
      const current = prev.q8b_cat_activities || [];
      const updatedList = current.includes(act)
        ? current.filter((item) => item !== act)
        : [...current, act];
      const updated = { ...prev, q8b_cat_activities: updatedList };
      if (petId) localStorage.setItem(`care_profile_${petId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const toggleGrooming = (item) => {
    setAnswers((prev) => {
      const current = prev.q9_grooming || [];
      let updatedList;
      if (item === "None of these") {
        updatedList = ["None of these"];
      } else {
        const filtered = current.filter((g) => g !== "None of these");
        updatedList = filtered.includes(item)
          ? filtered.filter((g) => g !== item)
          : [...filtered, item];
      }
      const updated = { ...prev, q9_grooming: updatedList };
      if (petId) localStorage.setItem(`care_profile_${petId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleFinishSave = async () => {
    setSaving(true);
    try {
      if (petId) {
        localStorage.setItem(`care_profile_${petId}`, JSON.stringify(answers));
        localStorage.removeItem(`care_profile_qindex_${petId}`);
        await fetchWithAuth(`/api/pet-profile/${petId}/lifestyle`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
        });
      }
      setIsCompleted(true);
      setCurrentQIndex(13); // Go to Completion Screen
    } catch (err) {
      console.error("Failed to save care profile:", err);
      setIsCompleted(true);
      setCurrentQIndex(13);
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchToOtherPet = (otherPet) => {
    if (!otherPet) return;
    if (onPetSelect) {
      onPetSelect(otherPet);
    }
    const savedQIndex = localStorage.getItem(`care_profile_qindex_${otherPet.id}`);
    const nextIdx =
      savedQIndex && !isNaN(savedQIndex) && parseInt(savedQIndex, 10) > 0
        ? parseInt(savedQIndex, 10)
        : 1;
    setCurrentQIndex(nextIdx);
  };

  const handleUploadRecordsClick = (e) => {
    e?.stopPropagation();
    setCurrentQIndex(0);
    if (typeof onNavigateTab === "function") {
      onNavigateTab("medicalrecords", { openUpload: true });
    } else {
      navigate("/records", { state: { openUpload: true } });
    }
  };

  const handleAddPetNoteClick = (e) => {
    e?.stopPropagation();
    setCurrentQIndex(0);
    if (typeof onNavigateTab === "function") {
      onNavigateTab("timeline");
    } else {
      navigate("/timeline/home", { state: { openAddNote: true } });
    }
  };

  // ---------------------------------------------------------------------------
  // VIEW 0: BANNER OVERVIEW (Original Image & Layout Preserved)
  // ---------------------------------------------------------------------------
  if (currentQIndex === 0) {
    return (
      <div className="welcome-hero-banner">
        <div className="welcome-text-content">
          <h2 className="welcome-greeting">{greeting},</h2>
          <h2 className="welcome-username">{userName}!</h2>
          <div className="welcome-green-divider" />

          {isCompleted ? (
            <>
              <p className="welcome-subtitle">
                PetOlife now knows {petName} better!
              </p>
              <div className="completed-hero-chip">
                <Check size={12} strokeWidth={3} /> {petName}’s Profile Complete
              </div>
            </>
          ) : (
            <>
              <p className="welcome-subtitle">
                Help us understand {petName} better. It only takes a minute.
              </p>
              <button
                className="welcome-take-survey-btn"
                onClick={() => setCurrentQIndex(1)}
                type="button"
              >
                <ClipboardList className="btn-survey-icon" size={17} strokeWidth={2.2} />
                <span>Take Survey</span>
                <ChevronRight className="btn-chevron-icon" size={17} strokeWidth={2.5} />
              </button>
            </>
          )}

          {incompleteOtherPet && (
            <div className="other-pet-prompt-bar" onClick={() => handleSwitchToOtherPet(incompleteOtherPet)}>
              <span>Complete {incompleteOtherPet.pet_name || incompleteOtherPet.name}’s Profile</span>
              <ChevronRight size={13} strokeWidth={2.5} />
            </div>
          )}
        </div>

        <div className="welcome-image-wrapper">
          <img
            src={welcomeImg}
            alt="Pet Healthcare"
            className="welcome-bg-image"
          />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW 13: COMPLETION SCREEN (Fits in Box)
  // ---------------------------------------------------------------------------
  if (currentQIndex === 13) {
    const otherPet = incompleteOtherPet;

    return (
      <div className="care-profile-card care-profile-card--fixed care-profile-card--completion">
        <div className="completion-content">
          <div className="completion-header-wrap">
            <div className="completion-badge-row">
              <span className="completion-sparkle">🎉</span>
              <h3 className="completion-title">{petName}’s Care Profile is Ready</h3>
            </div>

            <p className="completion-subtitle">
              We now understand {petName}’s daily routine and care needs better to personalise their PetOlife experience.
            </p>
          </div>

          {otherPet ? (
            <div className="other-pet-cta-box" onClick={() => handleSwitchToOtherPet(otherPet)}>
              <p className="other-pet-title">Next Pet Profile Pending</p>
              <p className="other-pet-sub">Complete {otherPet.pet_name || otherPet.name}’s Care Profile now →</p>
            </div>
          ) : (
            <div className="completion-next-card" onClick={handleUploadRecordsClick} style={{ cursor: "pointer" }}>
              <span className="next-card-badge"><ShieldCheck size={12} /> Next Step</span>
              <p className="next-card-title">Upload medical records for {petName}</p>
            </div>
          )}

          <div className="completion-btn-group">
            <button
              type="button"
              className="care-profile-card__btn care-profile-card__btn--primary completion-btn"
              onClick={handleUploadRecordsClick}
            >
              <Upload size={15} /> Upload Medical Records
            </button>

            <button
              type="button"
              className="care-profile-card__btn care-profile-card__btn--outline completion-btn"
              onClick={handleAddPetNoteClick}
            >
              <FileText size={15} /> Add a Pet Note
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEWS 1..12: ONE QUESTION AT A TIME IN FIXED BOX
  // ---------------------------------------------------------------------------
  const totalQ = 12;

  return (
    <div className="care-profile-card care-profile-card--fixed care-profile-card--question">
      {/* Top Fixed Progress Bar */}
      <div className="q-box-header">
        <button
          type="button"
          className="q-box-nav-btn"
          disabled={currentQIndex <= 1}
          onClick={() => updateQuestionIndex(currentQIndex - 1)}
        >
          <ChevronLeft size={16} />
        </button>

        <div className="q-box-progress-wrap">
          <span className="q-box-progress-text">
            Q{currentQIndex} of {totalQ}
          </span>
          <div className="q-box-progress-bar">
            <div
              className="q-box-progress-fill"
              style={{ width: `${(currentQIndex / totalQ) * 100}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          className="q-box-close-btn"
          onClick={() => setCurrentQIndex(0)}
          title="Pause & save progress"
        >
          <X size={15} />
        </button>
      </div>

      {/* Question Content View */}
      <div className="q-box-body">
        {/* Q1 */}
        {currentQIndex === 1 && (
          <div className="q-step-wrap">
            <label className="q-title">1. How active is {petName} on a typical day?</label>
            <div className="q-opts-list">
              {["Very active", "Moderately active", "Mostly relaxed"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`q-opt-btn ${answers.q1_activity === opt ? "selected" : ""}`}
                  onClick={() => handleSingleOptionClick("q1_activity", opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Q2 */}
        {currentQIndex === 2 && (
          <div className="q-step-wrap">
            <label className="q-title">2. Does {petName} follow a regular feeding schedule?</label>
            <div className="q-opts-list">
              {["Yes", "Mostly", "No"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`q-opt-btn ${answers.q2_feeding === opt ? "selected" : ""}`}
                  onClick={() => handleSingleOptionClick("q2_feeding", opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Q3 */}
        {currentQIndex === 3 && (
          <div className="q-step-wrap">
            <label className="q-title">3. How often does {petName} enjoy playtime?</label>
            <div className="q-opts-list">
              {["Once a day", "Twice a day", "Multiple times a day", "Whenever possible"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`q-opt-btn ${answers.q3_playtime === opt ? "selected" : ""}`}
                  onClick={() => handleSingleOptionClick("q3_playtime", opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Q4: Dogs vs Cats */}
        {currentQIndex === 4 && (
          <div className="q-step-wrap">
            {isDog ? (
              <>
                <label className="q-title">4. How many walks does {petName} usually go on each day?</label>
                <div className="q-opts-list">
                  {["No walks", "Once", "Twice", "Three or more"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`q-opt-btn ${answers.q4a_walks === opt ? "selected" : ""}`}
                      onClick={() => handleSingleOptionClick("q4a_walks", opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <label className="q-title">4. Where does {petName} spend most of the time?</label>
                <div className="q-opts-list">
                  {["Indoors", "Outdoors", "Both indoors and outdoors"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`q-opt-btn ${answers.q4b_location === opt ? "selected" : ""}`}
                      onClick={() => handleSingleOptionClick("q4b_location", opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Q5 */}
        {currentQIndex === 5 && (
          <div className="q-step-wrap">
            <label className="q-title">5. Does {petName} usually spend time with other pets?</label>
            <div className="q-opts-list">
              {["Frequently", "Sometimes", "Rarely", "Never"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`q-opt-btn ${answers.q5_other_pets === opt ? "selected" : ""}`}
                  onClick={() => handleSingleOptionClick("q5_other_pets", opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Q6 */}
        {currentQIndex === 6 && (
          <div className="q-step-wrap">
            <label className="q-title">6. Does {petName} usually travel with you?</label>
            <div className="q-opts-list">
              {["Often", "Occasionally", "Rarely", "Never"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`q-opt-btn ${answers.q6_travel === opt ? "selected" : ""}`}
                  onClick={() => handleSingleOptionClick("q6_travel", opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Q7: Dogs vs Cats */}
        {currentQIndex === 7 && (
          <div className="q-step-wrap">
            {isDog ? (
              <>
                <label className="q-title">7. Does {petName} enjoy outdoor activities?</label>
                <div className="q-opts-list">
                  {["Very much", "Sometimes", "Not really"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`q-opt-btn ${answers.q7a_outdoor === opt ? "selected" : ""}`}
                      onClick={() => handleSingleOptionClick("q7a_outdoor", opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <label className="q-title">7. Does {petName} regularly use a litter box?</label>
                <div className="q-opts-list">
                  {["Yes", "No"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`q-opt-btn ${answers.q7b_litterbox === opt ? "selected" : ""}`}
                      onClick={() => handleSingleOptionClick("q7b_litterbox", opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Q8: Dogs vs Cats */}
        {currentQIndex === 8 && (
          <div className="q-step-wrap">
            {isDog ? (
              <>
                <label className="q-title">8. Is {petName} currently learning any training or commands?</label>
                <div className="q-opts-list">
                  {["Yes", "No"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`q-opt-btn ${answers.q8a_training === opt ? "selected" : ""}`}
                      onClick={() => handleSingleOptionClick("q8a_training", opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <label className="q-title">8. Which activities does {petName} enjoy?</label>
                <span className="q-subhint">(Select multiple)</span>
                <div className="q-opts-grid-scroll">
                  {[
                    "Climbing",
                    "Using a scratching post",
                    "Watching through windows",
                    "Playing with toys",
                    "Sleeping and relaxing",
                  ].map((opt) => {
                    const isSelected = (answers.q8b_cat_activities || []).includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        className={`q-opt-btn ${isSelected ? "selected" : ""}`}
                        onClick={() => toggleCatActivity(opt)}
                      >
                        {isSelected && <Check size={13} className="chk-icon" />} {opt}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="q-next-btn"
                  onClick={() => updateQuestionIndex(9)}
                >
                  Next <ChevronRight size={14} />
                </button>
              </>
            )}
          </div>
        )}

        {/* Q9: Grooming (Multi-select) */}
        {currentQIndex === 9 && (
          <div className="q-step-wrap">
            <label className="q-title">9. Which grooming activities are part of {petName}’s routine?</label>
            <span className="q-subhint">(Select all that apply)</span>
            <div className="q-opts-grid-scroll">
              {[
                "Bath",
                "Coat brushing",
                "Nail trimming",
                "Ear cleaning",
                "Teeth brushing",
                "None of these",
              ].map((opt) => {
                const isSelected = (answers.q9_grooming || []).includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    className={`q-opt-btn ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleGrooming(opt)}
                  >
                    {isSelected && <Check size={13} className="chk-icon" />} {opt}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="q-next-btn"
              disabled={!answers.q9_grooming || answers.q9_grooming.length === 0}
              onClick={() => updateQuestionIndex(10)}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Q10: Long-term medication */}
        {currentQIndex === 10 && (
          <div className="q-step-wrap">
            <label className="q-title">10. Is {petName} currently taking any long-term medication?</label>
            <div className="q-opts-list">
              {["Yes", "No"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`q-opt-btn ${answers.q10_medication === opt ? "selected" : ""}`}
                  onClick={() => handleSingleOptionClick("q10_medication", opt, false)}
                >
                  {opt}
                </button>
              ))}
            </div>

            {answers.q10_medication === "Yes" && !medPromptDismissed ? (
              <div className="med-callout-compact">
                <p className="med-title">Would you like to add the medication now?</p>
                <div className="med-btn-group">
                  <button type="button" className="med-btn-pri" onClick={handleUploadRecordsClick}>
                    <Plus size={13} /> Add Meds
                  </button>
                  <button type="button" className="med-btn-sec" onClick={() => updateQuestionIndex(11)}>
                    I’ll Add Later
                  </button>
                </div>
              </div>
            ) : answers.q10_medication ? (
              <button
                type="button"
                className="q-next-btn"
                onClick={() => updateQuestionIndex(11)}
              >
                Next <ChevronRight size={14} />
              </button>
            ) : null}
          </div>
        )}

        {/* Q11: Special Diet */}
        {currentQIndex === 11 && (
          <div className="q-step-wrap">
            <label className="q-title">11. Does {petName} follow a special diet?</label>
            <div className="q-opts-grid-scroll">
              {[
                "No special diet",
                "Weight management diet",
                "Kidney care diet",
                "Digestive care diet",
                "Allergy-friendly diet",
                "Other",
              ].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`q-opt-btn ${answers.q11_diet === opt ? "selected" : ""}`}
                  onClick={() => handleSingleOptionClick("q11_diet", opt, false)}
                >
                  {opt}
                </button>
              ))}
            </div>

            {answers.q11_diet === "Other" && (
              <input
                type="text"
                className="q-input-compact"
                placeholder="Tell us about diet..."
                value={answers.q11_diet_other || ""}
                onChange={(e) =>
                  handleSingleOptionClick("q11_diet_other", e.target.value, false)
                }
              />
            )}

            {answers.q11_diet && (
              <button
                type="button"
                className="q-next-btn"
                onClick={() => updateQuestionIndex(12)}
              >
                Next <ChevronRight size={14} />
              </button>
            )}
          </div>
        )}

        {/* Q12: Optional notes & Finish */}
        {currentQIndex === 12 && (
          <div className="q-step-wrap">
            <label className="q-title">
              12. Anything else about {petName}? <span className="opt-tag">(Optional)</span>
            </label>
            <textarea
              className="q-textarea-compact"
              placeholder="Add important care info..."
              rows={2}
              value={answers.q12_notes || ""}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, q12_notes: e.target.value }))
              }
            />
            <button
              type="button"
              className="q-finish-btn"
              disabled={saving}
              onClick={handleFinishSave}
            >
              {saving ? "Saving..." : "Finish & Save"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
