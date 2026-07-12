import React from "react";
import { ShieldCheck, ChevronRight, Plus } from "lucide-react";
import "./AddPetCard.css";
import tailImg from "../../../assets/tail.png";

const AddPetCard = ({ onAddPet }) => {
  return (
    <div className="add-pet-card">
      {/* Decorative background layer */}

      {/* Safe & Secure badge */}
      <div className="ap-badge">
        <span className="ap-badge-icon">
          <ShieldCheck size={13} color="#ffffff" />
        </span>
        Safe &amp; Secure
      </div>

      {/* Icon + sparkle + plus bubble */}
      <div className="ap-icon-wrap">
        <div className="ap-icon-float">
          <div className="ap-icon-pulse" />
          <div className="ap-icon-ring">
           <div className="ap-icon-circle" onClick={onAddPet}>
              <img
                src={tailImg}
                alt="Pet Tail"
                className="ap-tail-img1"
              />
            </div>
          </div>
          
        </div>
      </div>

      {/* Heading */}
      <h2 className="ap-title">
        <span className="ap-title-dark"></span>
        <span className="ap-title-line2">
          <span className="ap-title-dark">Let's add your</span>{" "}
          <span className="ap-title-light">first pet</span>
          </span>
      </h2>

      {/* Subtitle */}
      <p className="ap-subtitle">
        Create your pet's digital health profile and securely manage vaccinations, medical records and appointments.
      </p>

      {/* CTA button */}
      <button type="button" className="ap-cta" onClick={onAddPet}>
        <span className="ap-cta-icon">
          <img src={tailImg} className="ap-btn-tail2" alt="" />
        </span>
        Add Your Pet
        </button>
    </div>
  );
};

export default AddPetCard;