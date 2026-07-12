import React, { useState, useEffect, useRef } from "react";
import { FiEdit2, FiCheck, FiX, FiCamera } from "react-icons/fi";
import fetchWithAuth from "../../utils/fetchWithAuth";
import DEFAULT_AVATAR from "../../assets/owner-avatar.svg";
import "./EditableUserCard.css";

const EditableUserCard = ({
    user,
    onProfileLoaded,
}) => {
  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    email: "",
    city: "",
    state: "",
    pincode: "",
    avatar_url: ""
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const prevUrl = profile.avatar_url;
    const objectUrl = URL.createObjectURL(file);
    setProfile(prev => ({ ...prev, avatar_url: objectUrl }));
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetchWithAuth(`/api/user-profile/${user.id}/avatar`, {
        method: "POST",
        body: formData,
        headers: {}
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(prev => ({ ...prev, avatar_url: data.avatar_url }));
      } else {
        setProfile(prev => ({ ...prev, avatar_url: prevUrl }));
        setError("Failed to upload photo. Please try again.");
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      console.error("Error uploading avatar:", err);
      setProfile(prev => ({ ...prev, avatar_url: prevUrl }));
      setError("Something went wrong uploading the photo.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updatePayload = {
        full_name: profile.full_name,
        phone: profile.phone,
        email: profile.email,
        city: profile.city,
        state: profile.state,
        pincode: profile.pincode
      };

      const res = await fetchWithAuth(`/api/user-profile/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload)
      });

      if (res.ok) {
        setIsEditing(false);
      } else {
        setError("Failed to update profile.");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    fetchProfile();
    setIsEditing(false);
    setError(null);
  };

  useEffect(() => {
    if (!isEditing) setError(null);
  }, [isEditing]);

  const locationLabel = [profile.city, profile.state].filter(Boolean).join(", ");

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
  <div className="user-card">
    {isEditing && (
      <div className="edit-actions">
        <button
          className="cancel-btn"
          onClick={cancelEdit}
          disabled={saving}
          title="Discard changes"
        >
          <FiX size={16} />
        </button>

        <button
          className="save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : (
            <>
              <FiCheck size={15} /> Save
            </>
          )}
        </button>
      </div>
    )}

    {error && (
      <div className="error-banner">
        ⚠️ {error}
      </div>
    )}

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
          title={isEditing ? "Change photo" : "Edit profile"}
          onClick={() => {
            if (isEditing) {
              fileInputRef.current?.click();
            } else {
              setIsEditing(true);
            }
          }}
        >
          {isEditing ? (
            <FiCamera size={14} />
          ) : (
            <FiEdit2 size={14} />
          )}
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
      {isEditing ? (
        <div className="user-info editing">
          {[
            { label: "Name", name: "full_name", type: "text" },
            { label: "Phone", name: "phone", type: "tel" },
            { label: "Email", name: "email", type: "email" },
            { label: "City", name: "city", type: "text" },
            { label: "State", name: "state", type: "text" },
            { label: "Pincode", name: "pincode", type: "text" },
          ].map(({ label, name, type }) => (
            <div className="detail-row" key={name}>
              <span className="detail-label">{label}</span>

              <input
                type={type}
                name={name}
                value={profile[name]}
                onChange={handleChange}
                placeholder={`Enter ${label.toLowerCase()}`}
                className="detail-input"
              />
            </div>
          ))}
        </div>
      ) : (
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
        </div>
      )}

    </div>
  </div>
);

};

export default EditableUserCard;