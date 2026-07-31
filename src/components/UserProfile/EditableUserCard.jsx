import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FiEdit2, FiCamera, FiCheck, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Cropper from "react-easy-crop";
import fetchWithAuth from "../../utils/fetchWithAuth";
import getCroppedImg from "../../utils/cropImage";
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

  // Cropper states
  const [isCropping, setIsCropping] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = (croppedArea, pixels) => {
    setCroppedAreaPixels(pixels);
  };

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

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Max size for photo upload is 5MB");
      return;
    }
    const preview = URL.createObjectURL(file);
    setTempImage(preview);
    setIsCropping(true);
    e.target.value = "";
  };

  const handleCropSave = async () => {
    try {
      const croppedBlob = await getCroppedImg(tempImage, croppedAreaPixels);
      if (!croppedBlob) {
        alert("Failed to crop image.");
        setIsCropping(false);
        return;
      }
      const croppedFile = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
      const preview = URL.createObjectURL(croppedBlob);
      setAvatarOverride(preview);
      setIsCropping(false);

      const formData = new FormData();
      formData.append("file", croppedFile);

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
        alert("Failed to upload cropped photo.");
      }
    } catch (err) {
      console.error("Error uploading avatar:", err);
      alert("An error occurred while cropping photo.");
      setIsCropping(false);
    }
  };

  const handleCropCancel = () => {
    setIsCropping(false);
    setTempImage(null);
  };

  const handleCardClick = (e) => {
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
            title="Edit Profile & Photo"
            onClick={(e) => {
              e.stopPropagation();
              navigate("/parent-profile");
            }}
          >
            <FiCamera size={14} />
          </button>
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

      {/* Photo Crop Modal */}
      {isCropping && createPortal(
        <div className="crop-modal-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="crop-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="crop-modal-header">
              <h3>Crop Photo</h3>
              <button type="button" className="crop-close-btn" onClick={handleCropCancel}>
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
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="zoom-slider"
              />
            </div>
            
            <div className="crop-actions">
              <button type="button" className="crop-cancel-btn" onClick={handleCropCancel}>
                Cancel
              </button>
              <button type="button" className="crop-save-btn" onClick={handleCropSave}>
                <FiCheck size={18} /> Apply & Save Photo
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default EditableUserCard;