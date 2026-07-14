import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  FaPaw,
  FaShieldAlt,
  FaDog,
  FaMars,
  FaAward,
  FaCalendarAlt,
  FaUser,
  FaPhoneAlt,
  FaRegCopy,
  FaCheck,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { FiX } from "react-icons/fi";
import "./PetIdCardModal.css";
import petolifeLogo from "../../assets/POL_logo_tagline.webp";


const PetIdCardModal = ({
  pet,
  owner,
  avatarSrc,
  isPhoto = true,
  FallbackIcon,
  onClose,
}) => {
  if (!pet) return null;

  const [copied, setCopied] = useState(false);
  const [phoneVisible, setPhoneVisible] = useState(false);

  const petolifeId =
    pet.petolife_id ||
    pet.petolifeId ||
    pet.pet_id ||
    pet.id ||
    "";

  const qrValue = `${window.location.origin}/api/pet-profile/by-petolife-id/${encodeURIComponent(
    petolifeId
  )}`;

  const name = pet.pet_name || pet.name || "Unknown";
  const type = pet.pet_type || pet.type || "";
  const breed = pet.breed || pet.pet_breed || "";

  const calculateAge = (birthDate) => {
    if (!birthDate) return "";
    const dob = new Date(birthDate);
    if (isNaN(dob.getTime())) return "";
    const today = new Date();
    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    if (years < 0 || months < 0) return "";
    return `${years}y ${months}m`;
  };

  const birthDateValue =
    pet.birth_date ||
    pet.birthDate ||
    pet.dob ||
    pet.date_of_birth ||
    pet.dateOfBirth ||
    pet?.metadata?.birth_date ||
    pet?.data?.birth_date ||
    "";

  const age =
    pet.age ||
    pet.pet_age ||
    pet.approx_age ||
    pet.approxAge ||
    pet.age_display ||
    (birthDateValue ? calculateAge(birthDateValue) : "") ||
    "Not added";

  const gender = pet.gender || pet.pet_gender || "";

  const ownerName = owner?.full_name || owner?.name || "";
  const ownerPhone = owner?.phone || "";
  const ownerEmail = owner?.email || "";
  const ownerLocation = [owner?.city, owner?.state].filter(Boolean).join(", ");
const getMaskedPhone = (phone) => {
  if (!phone) return "";

  // Keep only digits
  const digits = phone.replace(/\D/g, "");

  // Indian number (10 digits)
  if (digits.length === 10) {
    return `+91 ***** **${digits.slice(-3)}`;
  }
  // Indian number with country code (12 digits: 91XXXXXXXXXX)
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91 ***** **${digits.slice(-3)}`;
  }

  // Fallback
  return phone;
};
  // Fixed-length mask (not one dot per digit) so the value never
  // gets wide enough to wrap or overflow the grid cell.
  const maskedPhone = getMaskedPhone(ownerPhone);
  const handleCopyId = () => {
    if (!petolifeId || !navigator.clipboard) return;
    navigator.clipboard
      .writeText(petolifeId)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  };

  return (
    <div className="pid-overlay" onClick={onClose}>
      <div className="pid-card" onClick={(e) => e.stopPropagation()}>
        <button className="pid-close" onClick={onClose} type="button" aria-label="Close">
          <FiX />
        </button>

        {/* Decorative */}

        {/* ================= HEADER ================= */}
        <div className="pid-header">
          
            <div className="pid-brand-row">
              <img
                src={petolifeLogo}
                alt="PetOlife"
                className="pid-logo"
              />
            </div>
          <div className="pid-subtitle">
            <FaShieldAlt />
            <span>PET HEALTH IDENTITY CARD</span>
          </div>
        </div>

        {/* ================= PHOTO ================= */}
        <div className="pid-photo-wrap">
          <div className="pid-photo-ring">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={name}
                className="pid-photo"
              />
            ) : (
              <img
                src={FallbackIcon}
                alt={type || "Pet"}
                className="pid-photo icon-photo"
              />
            )}
        </div>
        </div>

        {/* ================= NAME + VERIFIED ================= */}
        <div className="pid-row pid-row--split">
          <div className="pid-col">
            <span className="pid-mini-label">Name</span>
            <strong className="pid-name-value">{name}</strong>
          </div>
          <div className="pid-verified-badge">
            <FaShieldAlt />
            <span>Verified by PetOlife</span>
          </div>
        </div>

        {/* ================= PET ID ================= */}
        <div className="pid-row pid-row--split">
          <div className="pid-col">
            <span className="pid-mini-label">Pet ID</span>
            <strong className="pid-id-value">{petolifeId}</strong>
          </div>
          {petolifeId && (
            <button
              className={`pid-copy-btn ${copied ? "pid-copy-btn--done" : ""}`}
              onClick={handleCopyId}
              type="button"
              aria-label="Copy Pet ID"
            >
              {copied ? <FaCheck /> : <FaRegCopy />}
            </button>
          )}
        </div>

        <div className="pid-divider-line" />

        {/* ================= DETAILS GRID ================= */}
        <div className="pid-grid">
          <div className="pid-grid-item">
            <div className="pid-grid-icon"><FaAward /></div>
            <div className="pid-grid-text">
              <span className="pid-grid-label">Breed:</span>
              <strong className="pid-grid-value">{breed || "—"}</strong>
            </div>
          </div>

          <div className="pid-grid-item">
            <div className="pid-grid-icon"><FaDog /></div>
            <div className="pid-grid-text">
              <span className="pid-grid-label">Type:</span>
              <strong className="pid-grid-value">{type || "—"}</strong>
            </div>
          </div>

          <div className="pid-grid-item">
            <div className="pid-grid-icon"><FaCalendarAlt /></div>
            <div className="pid-grid-text">
              <span className="pid-grid-label">Age:</span>
              <strong className="pid-grid-value">{age}</strong>
            </div>
          </div>

          <div className="pid-grid-item">
            <div className="pid-grid-icon"><FaMars /></div>
            <div className="pid-grid-text">
              <span className="pid-grid-label">Gender:</span>
              <strong className="pid-grid-value">{gender || "—"}</strong>
            </div>
          </div>

          <div className="pid-grid-item">
            <div className="pid-grid-icon"><FaUser /></div>
            <div className="pid-grid-text">
              <span className="pid-grid-label">Pet Parent:</span>
              <strong className="pid-grid-value">{ownerName || "—"}</strong>
            </div>
          </div>

          {/* Phone: masked by default, eye icon toggles visibility */}
          <div className="pid-grid-item">
            <div className="pid-grid-icon"><FaPhoneAlt /></div>
            <div className="pid-grid-text">
              <span className="pid-grid-label">Phone:</span>
              {ownerPhone ? (
                <div className="pid-phone-row">
                  <strong className="pid-grid-value">
                    {phoneVisible ? ownerPhone : maskedPhone}
                  </strong>
                  <button
                    className="pid-eye-btn"
                    onClick={() => setPhoneVisible((v) => !v)}
                    type="button"
                    aria-label={phoneVisible ? "Hide phone number" : "Show phone number"}
                  >
                    {phoneVisible ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              ) : (
                <strong className="pid-grid-value">—</strong>
              )}
            </div>
          </div>

        </div>

        {/* ================= QR ================= */}
        <div className="pid-qr-section">
          <div className="pid-qr-box">
            <QRCodeSVG
              value={qrValue}
              size={128}
              bgColor="#ffffff"
              fgColor="#1d5d35"
            />
          </div>
          <div className="pid-qr-caption">
            <FaShieldAlt />
            <span>Scan to View Verified Pet Profile</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetIdCardModal;