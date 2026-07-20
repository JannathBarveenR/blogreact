import React, { useState, useEffect } from "react";
import StepProgress from "../StepProgress/StepProgress";
import StepHeaderBar from "../StepHeaderBar/StepHeaderBar";
import { FiCamera, FiSkipForward, FiArrowRight } from "../icons";
import { FiSun, FiMaximize, FiSmile } from "react-icons/fi";
import { PAW_IMG } from "../constants";
import { PetAvatar } from "../../common/PetAvatar";
import "./Step1.css";


function Step1({ goNext, onNavigateBack, petData }) {

  const [image, setImage] = useState(null);

  useEffect(() => {

    if (petData?.petPhotoPreview) {

      setImage(petData.petPhotoPreview);
      setPhotoFile(petData.petPhotoFile);
      setPhotoUploaded(true);
    }

  }, [petData]);

  const [photoFile, setPhotoFile] = useState(
    petData?.petPhotoFile || null
  );

  const [photoUploaded, setPhotoUploaded] = useState(
    !!petData?.petPhotoPreview
  );
  
  const [errorMsg, setErrorMsg] = useState("");
  const progress = photoUploaded ? 25 : 0;

  const handleImageUpload = (e) => {
    setErrorMsg("");
    const file = e.target.files[0];

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg("Max size to photo upload is 5mb");
        return;
      }
      
      const preview = URL.createObjectURL(file);

      setImage(preview);
      setPhotoFile(file);
      setPhotoUploaded(true);
    }
};

  const tips = [
    { icon: <FiSun />, text: "Natural light works best" },
    { icon: <FiSmile />, text: "Make sure their face is visible" },
    { icon: <FiMaximize />, text: "Get close, fill the frame" },
  ];

  return (
    <div className="petphoto-container step-animate-in d-flex flex-column min-vh-100">
      <StepHeaderBar  onBack={onNavigateBack} />
      <StepProgress progress={progress} stepNumber={1} />

      <div className="hero-section mb-4">
        <img src={PAW_IMG} alt="" className="paw-img paw-left" />
        <img src={PAW_IMG} alt="" className="paw-img paw-right" />

        <div className="pet-photo-wrap">
          <div className={`pet-photo-ring${!photoUploaded ? " pet-photo-ring--pulse" : ""}`}>
            <div className="pet-photo-ring-inner">
              <PetAvatar src={image} petType={petData?.petType} alt="pet" size={56} className="step1-avatar-fallback" />
            </div>
          </div>

          <label className="pet-camera-badge">
            <FiCamera />
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleImageUpload}
            />
          </label>
        </div>

        <h1>Add Your Pet's Photo</h1>
        <p className="subtitle">
          Help veterinarians and caregivers identify your furry friend quickly.
        </p>
        {errorMsg && <p style={{ color: 'red', marginTop: '10px', fontSize: '0.9rem', fontWeight: '500' }}>{errorMsg}</p>}
      </div>

      <div className="photo-tips-card d-flex flex-column gap-2 mb-4">
        <span className="photo-tips-title">Tips for a great photo</span>
        {tips.map((tip, i) => (
          <div className="photo-tip-item d-flex align-items-center gap-2" key={i}>
            <span className="photo-tip-icon">{tip.icon}</span>
            <span>{tip.text}</span>
          </div>
        ))}
      </div>

      <div className="button-group">
        <button
          className="next-btn next-btn--animated"
          onClick={() =>
            goNext({
              petPhotoFile: photoFile,
              petPhotoPreview: image,
            })
          }
        >
          Next
          <FiArrowRight />
        </button>

        <span
          className="skip-link"
          onClick={() =>
            goNext({
              petPhotoFile: null,
              petPhotoPreview: null,
            })
          }
        >
          Skip for now
        </span>
      </div>
    </div>
  );
}

export default Step1;