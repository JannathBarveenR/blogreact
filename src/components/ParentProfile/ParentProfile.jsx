import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import "../Login/Login.css";
import "./ParentProfile.css";
import logoImg from "../../assets/logo-with-tagline.webp";
import { FiArrowLeft } from "react-icons/fi";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function SmallSpinner() {
  return <span className="onboarding-pincode-spinner" />;
}

export default function ParentProfile() {
  const { user, token, validateSession } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");

  // Load existing profile details on mount
  useEffect(() => {
    async function loadCurrentProfile() {
      if (!user?.id || !token) return;
      try {
        const res = await fetch(`${API_BASE}/api/user-profile/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const rawName = data.full_name || "";
          const rawPhone = data.phone || "";
          const rawPincode = data.pincode || "";
          const rawAddress = data.address || "";
          const rawCity = data.city || "";
          const rawState = data.state || "";

          if (rawName) setName(rawName);
          if (rawPhone) {
            const rawPhoneClean = rawPhone.replace("+91", "");
            setMobile(rawPhoneClean);
          }
          if (rawPincode) setPincode(rawPincode);
          if (rawAddress) setAddress(rawAddress);
          if (rawCity) setCity(rawCity);
          if (rawState) setState(rawState);

          if (rawName && rawPhone && rawPincode && rawAddress && rawCity && rawState) {
            setIsAlreadyCompleted(true);
          }
        } else {
          // pre-populate name from email
          if (user?.email) {
            const emailLocalPart = user.email.split("@")[0];
            const defaultName = emailLocalPart.split(/[._-]/)[0];
            const cleanName = defaultName.replace(/\d+/g, "");
            const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
            setName(capitalized);
          }
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      }
    }
    loadCurrentProfile();
  }, [user, token]);

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
    if (!address.trim()) {
      setError("Please enter your address.");
      return;
    }

    setLoading(true);
    setError("");

    let phone = mobile.replace(/\D/g, "");
    if (phone.length === 10) phone = "+91" + phone;
    else if (!phone.startsWith("+")) phone = "+" + phone;

    try {
      const res = await fetch(`${API_BASE}/api/user-profile/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
      }));

      // Re-validate session so our useAuth gets updated info
      await validateSession();

      navigate("/home", { replace: true, state: { tab: "home" } });
    } catch (err) {
      setError(err.message || "Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/home", { state: { tab: "home" } });
  };

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="screen">
          <button className="onboarding-back-btn" onClick={handleBack} type="button" aria-label="Go back">
            <FiArrowLeft size={18} /> Back
          </button>

          <div className="logo-wrap" style={{ textAlign: "center", marginBottom: 10, marginTop:"20px" }}>
            <img src={logoImg} alt="PetOLife" className="logo-img" style={{ display: "inline-block", width: "150px" }} />
          </div>

          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h2 className="title" style={{ fontSize: 20, margin: "0" }}>
              {isAlreadyCompleted ? "Edit Profile" : "Let's complete your profile"}
            </h2>
          </div>

          {error && <p className="field-error" style={{ color: "#d64545", textAlign: "center", marginBottom: 16 }}>{error}</p>}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
              <label>Address</label>
              <input
                type="text"
                placeholder="Flat / House no. / Street / Area"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
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

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 12 }}>
              {loading ? "Saving Profile…" : (isAlreadyCompleted ? "Save Profile" : "Complete Profile")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
