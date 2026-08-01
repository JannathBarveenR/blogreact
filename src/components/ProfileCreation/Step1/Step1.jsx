import React, { useState, useEffect, useCallback } from "react";
import StepProgress from "../StepProgress/StepProgress";
import StepHeaderBar from "../StepHeaderBar/StepHeaderBar";
import { FiCamera, FiSkipForward, FiArrowRight } from "../icons";
import { FiSun, FiMaximize, FiSmile, FiX, FiCheck } from "react-icons/fi";
import { PAW_IMG } from "../constants";
import { PetAvatar } from "../../common/PetAvatar";
import Cropper from "react-easy-crop";
import getCroppedImg from "../../../utils/cropImage";
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

  // Cropper states
  const [isCropping, setIsCropping] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleImageUpload = (e) => {
    setErrorMsg("");
    const file = e.target.files[0];

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg("Max size to photo upload is 5mb");
        return;
      }
      
      const preview = URL.createObjectURL(file);
      setTempImage(preview);
      setIsCropping(true);
    }
  };

  const handleCropSave = async () => {
    try {
      const croppedBlob = await getCroppedImg(tempImage, croppedAreaPixels);
      if (!croppedBlob) {
        setErrorMsg("Failed to crop image.");
        setIsCropping(false);
        return;
      }
      const croppedFile = new File([croppedBlob], "profile.jpg", { type: "image/jpeg" });
      const preview = URL.createObjectURL(croppedBlob);
      
      setImage(preview);
      setPhotoFile(croppedFile);
      setPhotoUploaded(true);
      setIsCropping(false);
      setTempImage(null);
    } catch (e) {
      console.error(e);
      setErrorMsg("Failed to crop image.");
      setIsCropping(false);
    }
  };

  const handleCropCancel = () => {
    setIsCropping(false);
    setTempImage(null);
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

        <label className="pet-photo-wrap" style={{ cursor: "pointer" }}>
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={handleImageUpload}
            onClick={(e) => { e.target.value = null; }}
          />

          <div className={`pet-photo-ring${!photoUploaded ? " pet-photo-ring--pulse" : ""}`}>
            <div className="pet-photo-ring-inner">
              {image ? (
                <img src={image} alt="Pet photo preview" className="step1-photo-img-preview" />
              ) : (
                <PetAvatar src={null} petType={petData?.petType} alt="pet" size={64} className="step1-avatar-fallback" />
              )}
            </div>
          </div>

          <div className="pet-camera-badge">
            <FiCamera />
          </div>
        </label>

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

      {isCropping && (
        <div className="crop-modal-overlay">
          <div className="crop-modal-content">
            <div className="crop-modal-header">
              <h3>Crop Photo</h3>
              <button className="crop-close-btn" onClick={handleCropCancel}>
                <FiX size={24} />
              </button>
            </div>
            
            <div className="crop-container">
              <Cropper
                image={tempImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="crop-controls">
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(e.target.value)}
                className="zoom-slider"
              />
            </div>
            
            <div className="crop-actions">
              <button className="crop-cancel-btn" onClick={handleCropCancel}>
                Cancel
              </button>
              <button className="crop-save-btn" onClick={handleCropSave}>
                <FiCheck size={18} /> Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Step1;