import React, { useState } from "react";
import Step1 from "../Step1/Step1";
import Step2 from "../Step2/Step2";
import Step4 from "../Step4/Step4";
import PostIdScreen from "../../postidscreen/postidscreen";

/**
 * ProfileCreation — self-contained, no react-router-dom or framer-motion.
 *
 * Props:
 *   onNavigateBack      — called when the user hits Back on Step 1
 *                         (falls back to window.history.back())
 *   onNavigateToPetHome — called with { newPet } after successful submit
 *                         (falls back to sessionStorage + window.location.href)
 *
 * Usage inside a react-router app:
 *   <ProfileCreation
 *     onNavigateBack={() => navigate(-1)}
 *     onNavigateToPetHome={(state) => navigate("/pet-home", { state })}
 *   />
 *
 * Usage standalone (no router):
 *   <ProfileCreation />
 */
function ProfileCreation({ onNavigateBack, onNavigateToPetHome }) {
  const [step, setStep]               = useState(1);
  const [petData, setPetData]         = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError]   = useState("");

  const navigateBack = () => {
    if (typeof onNavigateBack === "function") {
      onNavigateBack();
    } else {
      window.history.back();
    }
  };

  const navigateToPetHome = (state) => {
    if (typeof onNavigateToPetHome === "function") {
      onNavigateToPetHome(state);
    } else {
      sessionStorage.setItem("petHomeState", JSON.stringify(state));
      window.location.href = "/pet-home";
    }
  };

  const goNext = (data) => {
    setPetData((prev) => ({ ...prev, ...data }));
    setStep((s) => s + 1);
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  switch (step) {
    case 1:
      return (
        <Step1
          goNext={goNext}
          onNavigateBack={navigateBack}
          petData={petData}
        />
      );
    case 2:
      return (
        <Step2
          goNext={goNext}
          goBack={goBack}
          petData={petData}
        />
      );
    case 3:
      return (
        <Step4
          goBack={goBack}
          petData={petData}
          setStep={setStep}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
          submitError={submitError}
          setSubmitError={setSubmitError}
          onNavigateToPetHome={(data) => {
             // Extract data in the shape PostIdScreen expects, preserving all fields
             const p = data.newPet || {};
             const createdPet = {
               ...p,
               petName: p.pet_name || p.name || '',
               petolifeId: p.petolife_id || '',
               petPhotoUrl: p.pet_photo_url || p.image || '',
               petProfileId: p.id || '',
               birthDate: p.birth_date || p.birthDate || '',
               approxAge: p.approx_age || p.approxAge || p.age || '',
               owner_name: p.owner_name || p.pet_parent || '',
               owner_phone: p.owner_phone || '',
             };
             setPetData(prev => ({...prev, createdPet}));
             setStep(5);
          }}
        />
      );
    case 5:
      return (
        <PostIdScreen inlineData={petData.createdPet} />
      );
    default:
      return (
        <Step1
          goNext={goNext}
          onNavigateBack={navigateBack}
          petData={petData}
        />
      );
  }
}

export default ProfileCreation;
