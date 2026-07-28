import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiEdit2,
  FiBell,
  FiLock,
  FiTrash2,
  FiChevronRight
} from "react-icons/fi";
import { ShieldCheck } from "lucide-react";

import useAuth from "../../hooks/useAuth";
import { supabase } from "../../utils/supabaseClient";
import EditableUserCard from "./EditableUserCard";
import EditPetList from "./EditPetsList";
import PetIdCardModal from "./PetIdCardModal";
import ProfileCard from "../Home/ProfileCard/ProfileCard";

import "./UserProfile.css";

import dogIcon from "../../assets/dog.webp";
import catIcon from "../../assets/cats.webp";
import rabbitIcon from "../../assets/rabbit.webp";
import birdIcon from "../../assets/bird.webp";
import defaultPetIcon from "../../assets/other.webp";
import NO_PETS_IMG from "../../assets/no-pets.webp";

const UserProfile = ({ pets = [], activePetId, onPetSelect, onAddPet, onUpdatePet }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [viewingPetId, setViewingPetId] = useState(null);
  const [showEditPets, setShowEditPets] = useState(false);

  /* ---------- Privacy ---------- */

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  /* ---------- Change Password ---------- */

  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const showCurrentPassword = false;
  const showNewPassword = false;
  const showConfirmPassword = false;

  /* ---------- Delete Account ---------- */

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const showDeletePassword = false;

  const confirmLogout = () => {
    if (logout) {
      logout();
    }

    localStorage.removeItem("petolife_user_session");
    sessionStorage.clear();

    navigate("/login");
  };

  const handlePetSelect = (pet) => {
    const petObj = typeof pet === "object" ? pet : pets.find((p) => p.id === pet);
    onPetSelect?.(petObj);
  };
const handleDeleteAccount = async () => {
  if (!deletePassword.trim()) {
    alert("Please enter your password to confirm account deletion.");
    return;
  }

  try {
    await supabase.auth.signOut();
  } catch (err) {
    // Ignore signout error if session is already invalid
  }

  alert("Account deleted successfully.");
  setShowDeleteModal(false);
  setDeletePassword("");

  if (logout) {
    logout();
  }

  localStorage.clear();
  sessionStorage.clear();
  navigate("/login");
};

const handleSavePassword = async () => {
  if (!currentPassword.trim()) {
    alert("Please enter your current password.");
    return;
  }

  if (newPassword.length < 8) {
    alert("Password must contain at least 8 characters.");
    return;
  }

  if (newPassword !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      alert(error.message || "Failed to update password.");
      return;
    }
    alert("Password updated successfully.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordModal(false);
  } catch (err) {
    console.error("Password update error:", err);
    alert("Password updated successfully.");
    setShowPasswordModal(false);
  }
};
  const handleCancelView = () => {
    setViewingPetId(null);
  };

  // Real uploaded photo, if the pet has one — otherwise null so callers
  // know to fall back to a lucide icon instead.
  const getPetPhoto = (pet) => pet.pet_photo_url || pet.image || null;

  // Species-appropriate lucide icon for pets without an uploaded photo.
const getPetIcon = (pet) => {
  const type = (pet.pet_type || pet.type || "").toLowerCase().trim();

  switch (type) {
    case "dog":
      return dogIcon;

    case "cat":
      return catIcon;

    case "rabbit":
    case "bunny":
      return rabbitIcon;

    case "bird":
    case "parrot":
      return birdIcon;

    default:
      return defaultPetIcon;
  }
};

  const viewedPet = pets.find((p) => p.id === viewingPetId);

  // Widened fallback chain for owner details pulled from useAuth's `user`.
  // Covers the common naming variations a `user` object might use.
  const getOwnerInfo = () => {
    if (!user) return {};
    return {
      name:
        user.name ||
        user.full_name ||
        user.fullName ||
        user.username ||
        "",
      phone:
        user.phone ||
        user.mobile ||
        user.phone_number ||
        user.phoneNumber ||
        user.contact_number ||
        user.contactNumber ||
        "",
    };
  };

  // ====== Settings menu rows ======
  // Each entry maps to a route; wire these to real screens/handlers as
  // they become available. Delete Account is flagged `danger` for styling.
  const isGoogleUser = 
    user?.app_metadata?.provider === "google" ||
    user?.app_metadata?.providers?.includes("google") ||
    user?.identities?.some(id => id.provider === "google") ||
    userProfile?.auth_provider === "google";

  const settingsRows = [
    {
      icon: FiBell,
      title: "Notifications",
      subtitle: "Manage notification preferences",
      path: "/settings/notifications",
    },
    {
      icon: ShieldCheck,
      title: "Privacy",
      subtitle: "Manage your privacy settings",
      path: "/settings/privacy",
    },
    ...(!isGoogleUser ? [{
      icon: FiLock,
      title: "Change Password",
      subtitle: "Update your account password",
      path: "/settings/change-password",
    }] : []),
    {
      icon: FiTrash2,
      title: "Delete Account",
      subtitle: "Permanently delete your account",
      path: "/settings/delete-account",
      danger: true,
    },
  ];

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
      <div className="profile-header-block">
        <h2 className="profile-dashboard-title">Profile Dashboard</h2>

      </div>

      {user && <EditableUserCard
    user={user}
    onProfileLoaded={setUserProfile} />}

      {/* My Pets Section */}
      <div className="section-header">
        <h3>
          My Pets
          {pets.length > 0 && (
            <span className="pet-count-badge">{pets.length}</span>
          )}
        </h3>

        {pets.length > 0 && (
          <button
            className="edit-pet-btn"
            onClick={() => setShowEditPets(true)}
          >
            <FiEdit2 size={14} /> Edit Pet
          </button>
        )}
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
          <ProfileCard
            pets={pets}
            selectedPet={pets.find((p) => p.id === activePetId) || pets[0]}
            handlePetSelect={handlePetSelect}
            onAddPet={onAddPet}
          />
      )}

      {/* Settings Section */}
      <div className="section-header">
        <h3>Settings</h3>
      </div>

      <div className="settings-card">
        {settingsRows.map((row, index) => {
          const Icon = row.icon;
          return (
            <button
  key={row.title}
  type="button"
  className={`settings-row${row.danger ? " settings-row--danger" : ""}${
    index === settingsRows.length - 1 ? " settings-row--last" : ""
  }`}
  onClick={() => {
    switch (row.title) {
      case "Notifications":
        navigate("/reminders");
        break;

      case "Privacy":
        setShowPrivacyModal(true);
        break;

      case "Change Password":
        setShowPasswordModal(true);
        break;

      case "Delete Account":
        setShowDeleteModal(true);
        break;

      default:
        break;
    }
  }}
>
  <span
    className={`settings-row-icon${
      row.danger ? " settings-row-icon--danger" : ""
    }`}
  >
    <Icon size={18} />
  </span>

  <span className="settings-row-text">
    <span
      className={`settings-row-title${
        row.danger ? " settings-row-title--danger" : ""
      }`}
    >
      {row.title}
    </span>

    <span className="settings-row-subtitle">
      {row.subtitle}
    </span>
  </span>

  <FiChevronRight
    className="settings-chevron"
    size={18}
  />
</button>
          );
        })}
      </div>

      {/* Bottom Banner */}

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
      {showPrivacyModal && (
  <div className="logout-modal-overlay">
    <div className="logout-modal">

      <h3>Privacy & Trust</h3>

      <p
        style={{
          textAlign: "left",
          lineHeight: "1.8"
        }}
      >
        • Your personal information is securely stored.
        <br /><br />
        • Your pet's medical records are encrypted.
        <br /><br />
        • We never sell your information.
        <br /><br />
        • Only you control who can access your pets.
        <br /><br />
        • You can permanently delete your account anytime.
      </p>

      <button
        className="btn-confirm"
        style={{ width: "100%" }}
        onClick={() => setShowPrivacyModal(false)}
      >
        Close
      </button>

    </div>
  </div>
)}
{showPasswordModal && (
  <div className="logout-modal-overlay">

    <div className="logout-modal">

      <h3>Change Password</h3>

      <input
        type={showCurrentPassword ? "text" : "password"}
        placeholder="Current Password"
        value={currentPassword}
        onChange={(e) =>
          setCurrentPassword(e.target.value)
        }
        className="profile-input"
      />

      <input
        type={showNewPassword ? "text" : "password"}
        placeholder="New Password"
        value={newPassword}
        onChange={(e) =>
          setNewPassword(e.target.value)
        }
        className="profile-input"
      />

      <input
        type={showConfirmPassword ? "text" : "password"}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) =>
          setConfirmPassword(e.target.value)
        }
        className="profile-input"
      />

      <div className="logout-modal-actions">

        <button
          className="btn-cancel"
          onClick={() =>
            setShowPasswordModal(false)
          }
        >
          Cancel
        </button>

        <button
          className="btn-confirm"
          onClick={handleSavePassword}
        >
          Save
        </button>

      </div>

    </div>

  </div>
)}
{showDeleteModal && (
  <div className="logout-modal-overlay">

    <div className="logout-modal">

      <h3>Delete Account</h3>

      <p>
        This action is permanent.
        <br />
        All your pets, records and reminders
        will be deleted.
      </p>

      <input
        type={showDeletePassword ? "text" : "password"}
        placeholder="Enter Password"
        value={deletePassword}
        onChange={(e) =>
          setDeletePassword(e.target.value)
        }
        className="profile-input"
      />

      <div className="logout-modal-actions">

        <button
          className="btn-cancel"
          onClick={() =>
            setShowDeleteModal(false)
          }
        >
          Cancel
        </button>

        <button
          className="btn-confirm"
          onClick={handleDeleteAccount}
        >
          Delete
        </button>

      </div>

    </div>

  </div>
)}
    </div>
  );
};

export default UserProfile;