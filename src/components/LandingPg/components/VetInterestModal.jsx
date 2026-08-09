import React, { useState, useCallback, useEffect } from "react";
import { X, Stethoscope, CheckCircle2, ShieldCheck } from "lucide-react";
import { submitVetForm } from "../../../api/endpoints";
import logo from "../../../assets/logo-with-tagline.webp";
import "../../Login/Login.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function SmallSpinner() {
  return <span className="pincode-spinner" />;
}

export default function VetInterestModal({ isOpen, onClose }) {
  const [form, setForm] = useState({
    doctorName: "",
    clinicName: "",
    email: "",
    mobile: "",
    pincode: "",
    city: "",
    state: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setForm({
        doctorName: "",
        clinicName: "",
        email: "",
        mobile: "",
        pincode: "",
        city: "",
        state: "",
      });
      setError("");
      setSuccess(false);
      setPincodeError("");
    }
  }, [isOpen]);

  const lookupPincode = useCallback(async (pincodeVal) => {
    if (pincodeVal.length !== 6 || !/^\d{6}$/.test(pincodeVal)) return;
    setPincodeLoading(true);
    setPincodeError("");
    try {
      const res = await fetch(`${API_BASE}/api/location/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode: pincodeVal }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Invalid pincode");
      }
      const data = await res.json();
      setForm((prev) => ({
        ...prev,
        city: data.city || "",
        state: data.state || "",
      }));
    } catch (err) {
      setPincodeError(err.message || "Could not lookup pincode");
      setForm((prev) => ({ ...prev, city: "", state: "" }));
    } finally {
      setPincodeLoading(false);
    }
  }, []);

  useEffect(() => {
    if (form.pincode.length === 6 && /^\d{6}$/.test(form.pincode)) {
      lookupPincode(form.pincode);
    }
  }, [form.pincode, lookupPincode]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.doctorName.trim()) {
      setError("Please enter doctor name.");
      return;
    }
    if (!form.clinicName.trim()) {
      setError("Please enter clinic name.");
      return;
    }
    if (!form.email.trim() || !form.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!form.mobile.trim() || form.mobile.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    setError("");

    let phone = form.mobile.replace(/\D/g, "");
    if (phone.length === 10) phone = "+91" + phone;
    else if (!phone.startsWith("+")) phone = "+" + phone;

    const result = await submitVetForm({
      doctorName: form.doctorName.trim(),
      clinicName: form.clinicName.trim(),
      email: form.email.trim(),
      mobile: phone,
      pincode: form.pincode,
      city: form.city ? `${form.city}${form.state ? ", " + form.state : ""}` : "",
    });

    setLoading(false);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.message || "Submission failed. Please try again.");
    }
  };

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal-container vet-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="login-modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        {success ? (
          <div className="screen success-screen vet-success-screen" style={{ padding: "40px 24px", textAlign: "center" }}>
            <div className="success-icon-wrap" style={{ margin: "0 auto 16px" }}>
              <div className="success-circle" style={{ background: "#004b49", width: 72, height: 72, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle2 size={40} color="#ffffff" />
              </div>
            </div>
            <h2 className="success-title" style={{ color: "#004b49", fontSize: "24px", fontWeight: 800 }}>
              Thank You, Doctor!
            </h2>
            <p className="success-sub" style={{ color: "#4b5e55", maxWidth: 440, margin: "8px auto 16px", fontSize: "15px" }}>
              You are on the priority early access list for the <strong>PetOlife Veterinary Portal</strong>.
            </p>
            <div className="success-badge" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#f0faf0", border: "1px solid #84b662", color: "#004b49", padding: "6px 14px", borderRadius: 20, fontWeight: 700, fontSize: "13px" }}>
              <ShieldCheck size={16} /> <span>Priority Partner Vet</span>
            </div>
            <p style={{ color: "#7a9488", fontSize: "13px", marginTop: 16 }}>
              Our onboarding team will reach out to you at <strong>{form.email}</strong> soon.
            </p>
            <button
              type="button"
              className="btn-primary-gradient"
              onClick={onClose}
              style={{ marginTop: 24, maxWidth: 200, margin: "24px auto 0" }}
            >
              Done
            </button>
          </div>
        ) : (
          <div className="login-card-2col">
            {/* Left Banner */}
            <div className="login-left-banner" style={{ background: "linear-gradient(145deg, #004b49 0%, #003634 100%)", color: "#fff" }}>
              <div className="left-banner-header">
                <img src={logo} alt="PetOlife Logo" className="left-banner-logo" style={{ filter: "brightness(0) invert(1)" }} />
              </div>

              <div style={{ margin: "24px 0", textAlign: "center" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(4px)", padding: "8px 16px", borderRadius: 30, border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontWeight: 700, fontSize: "13px" }}>
                  <Stethoscope size={18} />
                  <span>Veterinary Portal Access</span>
                </div>
              </div>

              <div className="left-banner-footer" style={{ marginTop: "auto" }}>
                <h3 className="left-banner-title" style={{ color: "#fff", fontSize: "20px", fontWeight: 800 }}>
                  Partner with PetOlife
                </h3>
                <p className="left-banner-sub" style={{ color: "#d4e8cf", fontSize: "13px" }}>
                  Empower your clinic with digital pet records, instant QR scanning, and automated patient care alerts.
                </p>

                <ul className="left-banner-features" style={{ color: "#e8f5e5" }}>
                  <li><CheckCircle2 size={15} className="feature-check" style={{ color: "#84b662" }} /> Zero-friction clinic check-ins</li>
                  <li><CheckCircle2 size={15} className="feature-check" style={{ color: "#84b662" }} /> Lifelong medical history digital pass</li>
                  <li><CheckCircle2 size={15} className="feature-check" style={{ color: "#84b662" }} /> Automated vaccination follow-up reminders</li>
                </ul>
              </div>
            </div>

            {/* Right Form */}
            <div className="login-right-form">
              <div className="form-header">
                <h2 className="form-title" style={{ color: "#004b49" }}>Join as a Partner Veterinarian</h2>
                <p className="form-subtitle">Register for early access to the PetOlife Vet Portal</p>
              </div>

              {error && <p className="auth-error">{error}</p>}

              <form onSubmit={handleSubmit}>
                <div className="form-grid-2col">
                  <div className="form-group">
                    <label>Doctor Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Sarah Jenkins"
                      value={form.doctorName}
                      onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Clinic / Hospital Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Happy Tails Pet Clinic"
                      value={form.clinicName}
                      onChange={(e) => setForm({ ...form, clinicName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2col">
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      placeholder="dr.sarah@clinic.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Mobile Number *</label>
                    <div className="phone-input-group">
                      <span className="phone-prefix">+91</span>
                      <input
                        type="tel"
                        placeholder="10-digit mobile"
                        value={form.mobile}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setForm({ ...form, mobile: val });
                        }}
                        inputMode="numeric"
                        maxLength={10}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-grid-2col">
                  <div className="form-group">
                    <label>Pincode {pincodeLoading && <SmallSpinner />}</label>
                    <input
                      type="text"
                      placeholder="6-digit pincode"
                      value={form.pincode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setForm((prev) => ({ ...prev, pincode: val }));
                        if (val.length < 6) {
                          setForm((prev) => ({ ...prev, pincode: val, city: "", state: "" }));
                          setPincodeError("");
                        }
                      }}
                      inputMode="numeric"
                      maxLength={6}
                    />
                  </div>

                  <div className="form-group">
                    <label>City & State</label>
                    <input
                      type="text"
                      placeholder="Auto-filled from pincode"
                      value={form.city ? `${form.city}${form.state ? ", " + form.state : ""}` : ""}
                      readOnly
                      className={form.city ? "field-readonly field-filled" : "field-readonly"}
                    />
                  </div>
                </div>
                {pincodeError && <span className="field-error">{pincodeError}</span>}

                <button
                  type="submit"
                  className="btn-primary-gradient"
                  disabled={loading}
                  style={{ marginTop: 14 }}
                >
                  {loading ? "Submitting Request…" : "Register Interest as Vet"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
