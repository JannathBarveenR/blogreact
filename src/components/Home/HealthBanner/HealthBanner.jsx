import React from "react";
import { Heart } from "lucide-react";
import bannerBg from "../../../assets/banner-bg.webp";
import "./HealthBanner.css";

const HealthBanner = () => {
  return (
    <section
      className="moments-banner"
      style={{ backgroundImage: `url(${bannerBg})` }}
    >
      <div className="moments-content">
        <h2 className="moments-title">
          <span className="moments-title-dark">Every Moment</span>
          <span className="moments-title-line2">
            <span className="moments-title-light">Matters</span>
            <Heart size={20} className="moments-heart" />
          </span>
        </h2>

        <p className="moments-subtitle">
          Track your pet's health, care 
          <br/>
          routines and happy memories
          <br/>  all in
          one loving place.
        </p>
      </div>
    </section>
  );
};

export default HealthBanner;