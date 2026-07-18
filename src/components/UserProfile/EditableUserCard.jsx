import React, { useState, useEffect, useRef } from "react";
import { FiEdit2, FiCamera } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import fetchWithAuth from "../../utils/fetchWithAuth";
import DEFAULT_AVATAR from "../../assets/owner-avatar.svg";
import "./EditableUserCard.css";

const EditableUserCard = ({
    user,
    onProfileLoaded,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    email: "",
    city: "",
    state: "",
    pincode: "",
    avatar_url: ""
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await fetchWithAuth(`/api/user-profile/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setProfile({
          full_name: data.full_name || "",
          phone: data.phone || "",
          email: data.email || "",
          city: data.city || "",
          state: data.state || "",
          pincode: data.pincode || "",
          avatar_url: data.avatar_url || ""
        });
        onProfileLoaded?.(data);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const prevUrl = profile.avatar_url;
    const objectUrl = URL.createObjectURL(file);
    setProfile((prev) => ({ ...prev, avatar_url: objectUrl }));

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetchWithAuth(`/api/user-profile/${user.id}/avatar`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setProfile((prev) => ({ ...prev, avatar_url: data.avatar_url }));
        
        // Notify parent profile tab about the updated photo
        onProfileLoaded?.({ ...profile, avatar_url: data.avatar_url });
      } else {
        setProfile((prev) => ({ ...prev, avatar_url: prevUrl }));
      }
    } catch (err) {
      console.error("Error uploading avatar:", err);
      setProfile((prev) => ({ ...prev, avatar_url: prevUrl }));
    }
  };

  const handleCardClick = (e) => {
    // If they click the avatar uploader or the file input, do not navigate
    if (e.target.closest(".avatar-wrapper") || e.target.closest("input")) {
      return;
    }
    navigate("/parent-profile");
  };

  const locationLabel = [profile.city, profile.state].filter(Boolean).join(", ");
  const isProfileIncomplete = !profile.full_name || !profile.phone || !profile.city;

  if (loading) {
    return (
      <div className="user-card loading-skeleton">
        <div className="skeleton-avatar" />
        <div className="skeleton-lines">
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
          <div className="skeleton-line" />
        </div>
      </div>
    );
  }

  return (
    <div className="user-card clickable-card" onClick={handleCardClick} role="button" tabIndex={0}>
      <div className="user-view">
        {/* Avatar */}
        <div className="avatar-wrapper">
          <img
            src={profile.avatar_url || DEFAULT_AVATAR}
            alt="Profile"
            className="avatar-img"
          />
          <button
            className="edit-avatar-btn"
            type="button"
            title="Change photo"
            onClick={() => fileInputRef.current?.click()}
          >
            <FiCamera size={14} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden-input"
            onChange={handleAvatarChange}
          />
        </div>

        {/* Right Side */}
        <div className="user-info">
          <h2 className="user-name">
            {profile.full_name || "Pet Parent"}
          </h2>

          <p className="user-email">
            {profile.email || (
              <span className="detail-empty">
                No email provided
              </span>
            )}
          </p>

          <p className="user-location">
            <span className="location-pin">📍</span>
            {locationLabel || (
              <span className="detail-empty">
                Location not set
              </span>
            )}
          </p>

          {isProfileIncomplete && (
            <p className="complete-profile-warning">
              Complete your profile
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditableUserCard;