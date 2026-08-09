import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Cropper from "react-easy-crop";
import useAuth from "../../hooks/useAuth";
import fetchWithAuth from "../../utils/fetchWithAuth";
import getCroppedImg from "../../utils/cropImage";
import queryClient from "../../utils/queryClient";
import "../Login/Login.css";
import "./ParentProfile.css";
import logoImg from "../../assets/logo_new.png";
import DEFAULT_AVATAR from "../../assets/owner-avatar.svg";
import { FiArrowLeft, FiCamera, FiCheck, FiX } from "react-icons/fi";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function SmallSpinner() {
  return <span className="onboarding-pincode-spinner" />;
}

export default function ParentProfile() {
  const { user, token, validateSession } = useAuth();
  const navigate = useNavigate();

  // Use TanStack Query with key ["userProfile", user?.id] for 0ms cached data pre-filling
  const { data: cachedProfile } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      const res = await fetchWithAuth(`/api/user-profile/${user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch user profile");
      return res.json();
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
  });

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");

  // Avatar & Crop state
  const avatarInputRef = useRef(null);
  const [isCropping, setIsCropping] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = (croppedArea, pixels) => {
    setCroppedAreaPixels(pixels);
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Max size to photo upload is 5MB");
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
      setAvatarUrl(preview);
      setIsCropping(false);

      if (user?.id) {
        const formData = new FormData();
        formData.append("file", croppedFile);

        const res = await fetchWithAuth(`/api/user-profile/${user.id}/avatar`, {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setAvatarUrl(data.avatar_url);
          // Invalidate & refresh TanStack Query cache for user profile
          await queryClient.invalidateQueries({ queryKey: ["userProfile", user?.id] });
        } else {
          alert("Failed to upload cropped photo.");
        }
      }
    } catch (err) {
      console.error("Crop save error:", err);
      alert("An error occurred while cropping photo.");
      setIsCropping(false);
    }
  };

  const handleCropCancel = () => {
    setIsCropping(false);
    setTempImage(null);
  };

  // Pre-fill form instantaneously from TanStack Query cache
  useEffect(() => {
    if (cachedProfile) {
      const rawName = cachedProfile.full_name || "";
      const rawPhone = cachedProfile.phone || "";
      const rawPincode = cachedProfile.pincode || "";
      const rawAddress = cachedProfile.address || "";
      const rawCity = cachedProfile.city || "";
      const rawState = cachedProfile.state || "";
      const rawAvatar = cachedProfile.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "";

      if (rawName) setName(rawName);
      if (rawPhone) {
        const rawPhoneClean = rawPhone.replace("+91", "");
        setMobile(rawPhoneClean);
      }
      if (rawPincode) setPincode(rawPincode);
      if (rawAddress) setAddress(rawAddress);
      if (rawCity) setCity(rawCity);
      if (rawState) setState(rawState);
      if (rawAvatar) setAvatarUrl(rawAvatar);

      if (rawName && rawPhone && rawCity) {
        setIsAlreadyCompleted(true);
      } else {
        setIsAlreadyCompleted(false);
      }
    } else if (user) {
      // pre-populate name from email or user metadata if no profile row yet
      if (user?.user_metadata?.full_name) {
        setName(user.user_metadata.full_name);
      } else if (user?.email) {
        const emailLocalPart = user.email.split("@")[0];
        const defaultName = emailLocalPart.split(/[._-]/)[0];
        const cleanName = defaultName.replace(/\d+/g, "");
        const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        setName(capitalized);
      }
    }
  }, [cachedProfile, user]);

  const lookupPincode = useCallback(async (pin) => {
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) return;
    setPincodeLoading(true);
    setPincodeError("");
    try {
      const res = await fetch(`${API_BASE}/api/location/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode: pin }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Invalid pincode");
      }
      const data = await res.json();
      setCity(data.city || "");
      setState(data.state || "");
    } catch (err) {
      setPincodeError(err.message || "Could not lookup pincode");
      setCity("");
      setState("");
    } finally {
      setPincodeLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pincode.length === 6 && /^\d{6}$/.test(pincode)) {
      lookupPincode(pincode);
    }
  }, [pincode, lookupPincode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!mobile.trim() || mobile.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (pincode.length !== 6) {
      setError("Please enter a valid 6-digit pincode.");
      return;
    }
    if (!city) {
      setError("Could not determine city from pincode.");
      return;
    }

    setLoading(true);
    setError("");

    let phone = mobile.replace(/\D/g, "");
    if (phone.length === 10) phone = "+91" + phone;
    else if (!phone.startsWith("+")) phone = "+" + phone;

    try {
      const res = await fetchWithAuth(`/api/user-profile/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: name.trim(),
          phone,
          email: user?.email,
          city,
          state,
          pincode,
          address: address.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Profile save failed");

      // Update user details in localStorage
      const rawUser = localStorage.getItem("user") || JSON.stringify(user || {});
      const parsedUser = JSON.parse(rawUser);
      const enrichedUser = {
        ...parsedUser,
        user_metadata: {
          ...(parsedUser.user_metadata || {}),
          full_name: name.trim(),
          pincode,
          city,
          state,
          address: address.trim(),
        },
      };
      localStorage.setItem("user", JSON.stringify(enrichedUser));
      localStorage.setItem("user_city", city);

      // Cache the user profile details directly
      localStorage.setItem("user_profile", JSON.stringify({
        full_name: name.trim(),
        phone,
        email: user?.email,
        city,
        state,
        pincode,
        address: address.trim(),
        avatar_url: avatarUrl,
      }));

      // Invalidate & refresh TanStack Query cache so all components (EditableUserCard, etc.) receive fresh data
      await queryClient.invalidateQueries({ queryKey: ["userProfile", user?.id] });

      // Re-validate session so our useAuth gets updated info
      await validateSession();

      navigate("/profile", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/profile");
  };

  return (
    <div className="login-root">
      <div className="login-card parent-profile-card">
        <div className="screen parent-profile-screen">
          <button className="onboarding-back-btn" onClick={handleBack} type="button" aria-label="Go back">
            <FiArrowLeft size={16} /> Back
          </button>

          <div className="logo-wrap parent-profile-logo-wrap">
            <img src={logoImg} alt="PetOLife" className="logo-img parent-profile-logo-img" />
          </div>

          <div className="parent-profile-header">
            <h2 className="title">
              {isAlreadyCompleted ? "Edit Profile" : "Let's complete your profile"}
            </h2>
          </div>

          {/* Profile Picture with Cropper */}
          <div className="parent-profile-avatar-wrap">
            <div className="parent-profile-avatar-container">
              <img
                src={avatarUrl || DEFAULT_AVATAR}
                alt="Profile Avatar"
                className="parent-profile-avatar-img"
              />
              <button
                type="button"
                className="parent-profile-avatar-edit-btn"
                onClick={() => avatarInputRef.current?.click()}
                title="Change photo"
              >
                <FiCamera size={14} />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarSelect}
              />
            </div>
          </div>

          {error && <p className="field-error parent-profile-error">{error}</p>}

          <form onSubmit={handleSubmit} className="parent-profile-form">
            <div className="form-group">
              <label>Your Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Mobile Number</label>
              <div className="phone-input-group">
                <span className="phone-prefix">+91</span>
                <input
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={mobile}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setMobile(val);
                  }}
                  inputMode="numeric"
                  maxLength={10}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Pincode {pincodeLoading && <SmallSpinner />}</label>
              <input
                type="text"
                placeholder="Enter 6-digit pincode"
                value={pincode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setPincode(val);
                  if (val.length < 6) {
                    setCity("");
                    setState("");
                    setPincodeError("");
                  }
                }}
                onBlur={() => {
                  if (pincode.length !== 6) {
                    setPincodeError("PIN code must be 6 numbers.");
                  } else {
                    setPincodeError("");
                  }
                }}
                inputMode="numeric"
                maxLength={6}
                required
              />
              {pincodeError && <span className="field-error" style={{ color: "#d64545", marginTop: 4 }}>{pincodeError}</span>}
            </div>

            <div className="form-group">
              <label>Address <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 400 }}>(Optional)</span></label>
              <input
                type="text"
                placeholder="Flat / House no. / Street / Area (Optional)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="pincode-row">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  placeholder="Auto-filled"
                  value={city}
                  readOnly
                  className={city ? "field-readonly field-filled" : "field-readonly"}
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  placeholder="Auto-filled"
                  value={state}
                  readOnly
                  className={state ? "field-readonly field-filled" : "field-readonly"}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary parent-profile-submit-btn" disabled={loading}>
              {loading ? "Submitting…" : (isAlreadyCompleted ? "Save Profile" : "Submit")}
            </button>
          </form>
        </div>
      </div>

      {/* Photo Crop Modal */}
      {isCropping && createPortal(
        <div className="crop-modal-overlay">
          <div className="crop-modal-content">
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
}

