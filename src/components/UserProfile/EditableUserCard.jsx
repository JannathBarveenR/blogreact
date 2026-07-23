import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  const { data: serverProfile, isLoading: loading } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      const res = await fetchWithAuth(`/api/user-profile/${user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch user profile");
      return res.json();
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  const [avatarOverride, setAvatarOverride] = useState(null);

  useEffect(() => {
    if (serverProfile) {
      onProfileLoaded?.(serverProfile);
    }
  }, [serverProfile]);

  const profile = {
    full_name: serverProfile?.full_name || "",
    phone: serverProfile?.phone || "",
    email: serverProfile?.email || "",
    city: serverProfile?.city || "",
    state: serverProfile?.state || "",
    pincode: serverProfile?.pincode || "",
    avatar_url: avatarOverride || serverProfile?.avatar_url || "",
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const prevUrl = profile.avatar_url;
    const objectUrl = URL.createObjectURL(file);
    setAvatarOverride(objectUrl);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetchWithAuth(`/api/user-profile/${user.id}/avatar`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setAvatarOverride(data.avatar_url);
        queryClient.invalidateQueries({ queryKey: ["userProfile", user?.id] });
        onProfileLoaded?.({ ...profile, avatar_url: data.avatar_url });
      } else {
        setAvatarOverride(prevUrl);
      }
    } catch (err) {
      console.error("Error uploading avatar:", err);
      setAvatarOverride(prevUrl);
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

          {isProfileIncomplete ? (
            <p className="complete-profile-warning" style={{ textDecoration: "underline" }}>
              Complete your profile
            </p>
          ) : (
            <div className="edit-actions">
              <span className="edit-profile-btn" style={{ color: "#2e7d32", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px", textDecoration: "underline" }}>
                <FiEdit2 size={12} /> Edit profile
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditableUserCard;