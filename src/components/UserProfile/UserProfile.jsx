import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiEdit2, FiX } from "react-icons/fi";
import { QRCodeSVG } from "qrcode.react";
import useAuth from "../../hooks/useAuth";
import EditableUserCard from "./EditableUserCard";
import EditPetList from "./EditPetsList";
import NO_PETS_IMG from "../../assets/no-pets.png";
import PETS_BANNER_IMG from "../../assets/dog-cat-banner.png";
import "./UserProfile.css";

const UserProfile = ({ pets = [], activePetId, onPetSelect, onAddPet, onUpdatePet }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [viewingPetId, setViewingPetId] = useState(null);
  const [showEditPets, setShowEditPets] = useState(false);

  // Fallback to first pet if no activePetId is provided but pets exist
  const selectedPet =
    pets.find((p) => p.id === activePetId) || (pets.length > 0 ? pets[0] : null);

  const confirmLogout = () => {
    if (logout) {
      logout();
    }

    localStorage.removeItem("petolife_user_session");
    sessionStorage.clear();

    navigate("/login");
  };

  const handlePetSelect = (petId) => {
    setViewingPetId(petId);
    onPetSelect?.(petId);
  };

  const handleCancelView = () => {
    setViewingPetId(null);
  };

  const viewedPet = pets.find((p) => p.id === viewingPetId);

  // ====== Edit Pets list view (shown in place of the dashboard) ======
  if (showEditPets) {
    return (
      <EditPetList
        pets={pets}
        onAddPet={onAddPet}
        onBack={() => setShowEditPets(false)}
        onUpdatePet={onUpdatePet}
      />
    );
  }

  return (
    <div className="user-profile-page">
      <h2 className="profile-dashboard-title">Profile Dashboard</h2>

      {user && <EditableUserCard user={user} />}

      {/* My Pets Section */}
      <div className="section-header">
        <h3>My Pets</h3>
        <button
          className="edit-pet-btn"
          onClick={() => setShowEditPets(true)}
        >
          <FiEdit2 size={14} /> Edit Pet
        </button>
      </div>

      {pets.length === 0 ? (
        <div className="no-pets-card">
          <img src={NO_PETS_IMG} alt="No pets added" className="no-pets-img" />
          <h4 className="no-pets-title">No pets added yet</h4>
          <p className="no-pets-subtitle">
            Add your furry friends to get personalized care, reminders and
            everything they need for a happy life.
          </p>
          <button className="add-pet-btn" type="button" onClick={onAddPet}>
            <span className="plus-icon">+</span> Add New Pet
          </button>
        </div>
      ) : (
        <>
          <div className="pets-grid">
            {pets.map((pet) => (
              <div
                className={`pet-chip${pet.id === viewingPetId ? " active" : ""}`}
                key={pet.id}
                onClick={() => handlePetSelect(pet.id)}
                role="button"
                tabIndex={0}
              >
                <img
                  src={pet.pet_photo_url || pet.image || NO_PETS_IMG}
                  alt={pet.pet_name || pet.name || "Pet"}
                  className="pet-chip-img"
                />
                <span className="pet-chip-name">
                  {pet.pet_name || pet.name || "Unnamed"}
                </span>
              </div>
            ))}

            {/* Add New Pet */}
            <div className="add-pet-card" onClick={onAddPet}>
              <div className="add-pet-circle">
                <FiPlus size={26} />
              </div>
              <p>Add New Pet</p>
            </div>
          </div>

          {/* QR / Pet ID detail view */}
          {viewedPet && (
            <div className="pet-detail-card">
              <button
                className="pet-detail-cancel"
                onClick={handleCancelView}
                title="Close"
              >
                <FiX size={16} />
              </button>

              <div className="pet-qr-wrapper">
                <QRCodeSVG
                  value={String(viewedPet.pet_id || viewedPet.id || "")}
                  size={120}
                  bgColor="#ffffff"
                  fgColor="#1a1a1a"
                  level="M"
                />
              </div>
              <p className="pet-id-label">
                Pet ID: <span>{viewedPet.pet_id || viewedPet.id}</span>
              </p>
            </div>
          )}
        </>
      )}

      {/* Bottom Banner */}
      <div className="pets-banner">
        <div className="banner-img-wrapper">
          <img src={PETS_BANNER_IMG} alt="Dog and cat" className="banner-img" />
          <span className="banner-heart">♥</span>
        </div>
        <p className="banner-text">
          Together, let's build a
          <br />
          healthier &amp; happier life for pets! <span className="heart">💚</span>
        </p>
      </div>

      <div className="logout-section">
        <button className="logout-btn" onClick={() => setShowLogoutModal(true)}>
          Log Out
        </button>
      </div>

      {showLogoutModal && (
        <div className="logout-modal-overlay">
          <div className="logout-modal">
            <h3>Confirm Log Out</h3>
            <p>Are you sure you want to log out of your account?</p>
            <div className="logout-modal-actions">
              <button className="btn-cancel" onClick={() => setShowLogoutModal(false)}>
                Cancel
              </button>
              <button className="btn-confirm" onClick={confirmLogout}>
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;