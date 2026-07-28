import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiShield, FiCalendar, FiUser, FiPhone, FiHeart, FiArrowRight, FiCheckCircle } from "react-icons/fi";
import { PetAvatar } from "../common/PetAvatar";
import logoImg from "../../assets/logo-with-tagline.webp";
import "./PublicPetProfile.css";

export default function PublicPetProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPublicProfile() {
      if (!id) return;
      try {
        setLoading(true);
        const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
        const res = await fetch(`${API_BASE}/api/pet-profile/public/${encodeURIComponent(id)}`);
        if (res.ok) {
          const data = await res.json();
          setPet(data);
        } else {
          setError("Pet profile not found.");
        }
      } catch (err) {
        console.error("Error fetching public pet profile:", err);
        setError("Could not load pet profile details.");
      } finally {
        setLoading(false);
      }
    }
    fetchPublicProfile();
  }, [id]);

  const handleGetIdClick = () => {
    navigate("/login", { state: { fromPublicPet: true } });
  };

  const getAge = (birthDate) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (months >= 12) {
      const years = Math.floor(months / 12);
      return `${years} Year${years > 1 ? "s" : ""}`;
    }
    return `${months} Month${months !== 1 ? "s" : ""}`;
  };

  if (loading) {
    return (
      <div className="pub-pet-container pub-pet-loading">
        <div className="pub-spinner" />
        <p>Loading Pet Health Profile…</p>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="pub-pet-container pub-pet-error">
        <div className="pub-error-card">
          <h2>Pet Profile Not Found</h2>
          <p>{error || "We couldn't find a pet profile for this ID."}</p>
          <button className="pub-cta-btn" onClick={handleGetIdClick}>
            Get Petolife ID for Your Pet <FiArrowRight />
          </button>
        </div>
      </div>
    );
  }

  const petName = pet.pet_name || pet.name || "Pet";
  const petolifeId = pet.petolife_id || id;
  const ageDisplay = pet.birth_date ? getAge(pet.birth_date) : pet.approx_age || "Not specified";
  const getOwnerName = (petObj) => {
    if (!petObj) return "Pet Parent";
    const candidates = [
      petObj.owner_info?.owner_name,
      petObj.owner_info?.full_name,
      petObj.owner_name,
      petObj.pet_parent,
      petObj.care_team?.owner_name,
    ];
    for (const name of candidates) {
      if (name && typeof name === "string" && name.trim() && name.trim() !== "Pet Parent") {
        return name.trim();
      }
    }
    return "Pet Parent";
  };

  const ownerName = getOwnerName(pet);
  const ownerPhone = pet.owner_phone || pet.owner_info?.owner_phone || pet.owner_info?.phone || pet.care_team?.owner_phone || "";
  
  const maskedPhone = ownerPhone
    ? `+91 ${ownerPhone.replace(/\D/g, "").slice(0, 1)}XXX XX XX ${ownerPhone.replace(/\D/g, "").slice(-2)}`
    : "Protected";

  return (
    <div className="pub-pet-page">
      <div className="pub-pet-card">
        {/* Header Logo & Verification */}
        <header className="pub-pet-header">
          <img src={logoImg} alt="PetOLife" className="pub-logo" />
          <div className="pub-verified-badge">
            <FiShield size={14} /> Verified Petolife Identity
          </div>
        </header>

        {/* Hero Pet Section */}
        <div className="pub-hero-section">
          <div className="pub-avatar-wrap">
            <PetAvatar
              src={pet.pet_photo_url}
              petType={pet.pet_type}
              size={110}
              className="pub-avatar"
            />
            <span className="pub-check-icon">
              <FiCheckCircle size={18} color="#fff" />
            </span>
          </div>

          <h1 className="pub-pet-name">{petName}</h1>
          <div className="pub-pet-id-pill">
            <FiShield size={13} /> {petolifeId}
          </div>
        </div>

        {/* Pet Details Grid */}
        <div className="pub-details-grid">
          <div className="pub-detail-item">
            <span className="pub-icon-bubble"><FiCalendar /></span>
            <div className="pub-detail-text">
              <label>Age / DOB</label>
              <strong>{ageDisplay}</strong>
            </div>
          </div>

          {pet.breed && (
            <div className="pub-detail-item">
              <span className="pub-icon-bubble">🐾</span>
              <div className="pub-detail-text">
                <label>Breed</label>
                <strong>{pet.breed}</strong>
              </div>
            </div>
          )}

          {pet.gender && (
            <div className="pub-detail-item">
              <span className="pub-icon-bubble">♀/♂</span>
              <div className="pub-detail-text">
                <label>Gender</label>
                <strong>{pet.gender}</strong>
              </div>
            </div>
          )}

          <div className="pub-detail-item">
            <span className="pub-icon-bubble"><FiUser /></span>
            <div className="pub-detail-text">
              <label>Pet Parent</label>
              <strong>{ownerName}</strong>
            </div>
          </div>

          <div className="pub-detail-item pub-detail-full">
            <span className="pub-icon-bubble"><FiPhone /></span>
            <div className="pub-detail-text">
              <label>Phone Number</label>
              <strong>{maskedPhone}</strong>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="pub-cta-card">
          <div className="pub-cta-icon">🐾</div>
          <h3>Want a Digital Health ID for Your Pet?</h3>
          <p>Keep medical records, emergency contacts & health IDs safe in one place.</p>
          <button className="pub-cta-btn" onClick={handleGetIdClick}>
            Get Petolife ID for Your Pet <FiArrowRight />
          </button>
        </div>

        {/* Footer */}
        <footer className="pub-footer">
          <FiHeart size={14} color="#84b662" /> Because every pet deserves lifelong care.
        </footer>
      </div>
    </div>
  );
}
