import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import logoImg from "../../assets/login-logo.webp";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function Logo() {
  return (
    <div className="logo-wrap">
      <img src={logoImg} alt="PetOLife" className="logo-img" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" className="google-icon">
      <path
        fill="#FFC107"
        d="M43.6 20.1H42V20H24v8h11.3C33.7 32.8 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.5 26.7 36 24 36c-5.3 0-9.7-3.2-11.3-7.7l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.1H42V20H24v8h11.3c-.9 2.4-2.5 4.4-4.5 5.8l6.2 5.2C36.9 37 44 32 44 24c0-1.3-.1-2.6-.4-3.9z"
      />
    </svg>
  );
}

function EyeIcon({ open }) {
  return open ? (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#999"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#999"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function BackBtn({ onClick }) {
  return (
    <button className="back-btn" onClick={onClick} aria-label="Go back">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#1a1a1a"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 12H5M12 5l-7 7 7 7" />
      </svg>
    </button>
  );
}

function SmallSpinner() {
  return <span className="pincode-spinner" />;
}

export function SuccessScreen({ type, userName, onContinue }) {
  const isSignup = type === "signup";
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (countdown <= 0) {
      onContinue();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onContinue]);

  return (
    <div className="screen success-screen">
      <div className="success-icon-wrap">
        <div className="success-circle">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>
      <h2 className="success-title">
        {isSignup ? "Account Created!" : "Welcome Back!"}
      </h2>
      <p className="success-sub">
        {isSignup
          ? `Hey ${userName || "there"} 👋 Your PetOLife account is all set. Let's get started!`
          : `Great to see you again ${userName || ""}! Your pets are waiting for you.`}
      </p>
      <div className="success-badge">
        <span>PetOLife Member</span>
      </div>

      <p className="success-redirect-note">
        Redirecting in {countdown}s…
      </p>
    </div>
  );
}

function RegistrationScreen({ onLogin, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    pincode: "",
    city: "",
    state: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");

  const set = (k) => (e) => {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, [k]: val }));
    if (k === "pincode" && val.length < 6) {
      setForm((prev) => ({ ...prev, [k]: val, city: "", state: "" }));
      setPincodeError("");
    }
  };

  const lookupPincode = useCallback(async (pincode) => {
    if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) return;
    setPincodeLoading(true);
    setPincodeError("");
    try {
      const res = await fetch(`${API_BASE}/api/location/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode }),
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

  const handleRegister = async () => {
    if (!form.name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!form.email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (!form.mobile.trim() || form.mobile.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!form.password || form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.pincode.length !== 6) {
      setError("Please enter a valid 6-digit pincode.");
      return;
    }
    if (!form.city) {
      setError("Could not determine city from pincode.");
      return;
    }

    setLoading(true);
    setError("");

    let phone = form.mobile.replace(/\D/g, "");
    if (phone.length === 10) phone = "+91" + phone;
    else if (!phone.startsWith("+")) phone = "+" + phone;

    const userPassword = form.password;

    try {
      const signupRes = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          password: userPassword,
          full_name: form.name.trim(),
          city: form.city,
          state: form.state,
          pincode: form.pincode,
        }),
      });
      const signupData = await signupRes.json();
      if (!signupRes.ok) throw new Error(signupData.detail || "Signup failed");

      const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password: userPassword }),
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok)
        throw new Error(loginData.detail || "Auto-login failed");

      if (loginData.access_token)
        localStorage.setItem("access_token", loginData.access_token);
      if (loginData.refresh_token)
        localStorage.setItem("refresh_token", loginData.refresh_token);
      if (loginData.user) {
        const enrichedUser = {
          ...loginData.user,
          user_metadata: {
            ...loginData.user.user_metadata,
            pincode: form.pincode,
            city: form.city,
            state: form.state,
          },
        };
        localStorage.setItem("user", JSON.stringify(enrichedUser));
        // Save city to its own key — survives all future logins
        localStorage.setItem("user_city", form.city);
      }

      onSuccess({ type: "signup", name: form.name.trim() });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen auth-screen">
      <Logo />
      <h2 className="auth-title" style={{ marginTop: 0 }}>
        "Create your pet's lifelong digital health identity today!"
      </h2>
      {error && <p className="auth-error">{error}</p>}

      <div className="form-group">
        <label>Pet Parent Name</label>
        <input
          type="text"
          placeholder="Enter your full name"
          value={form.name}
          onChange={set("name")}
          autoComplete="name"
        />
      </div>

      <div className="form-group">
        <label>Email Address</label>
        <input
          type="email"
          placeholder="Enter your email"
          value={form.email}
          onChange={set("email")}
          autoComplete="email"
        />
      </div>

      <div className="form-group">
        <label>Mobile Number</label>
        <div className="phone-input-group">
          <span className="phone-prefix">+91</span>
          <input
            type="tel"
            placeholder="Enter 10-digit mobile number"
            value={form.mobile}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 10);
              setForm((prev) => ({ ...prev, mobile: val }));
            }}
            inputMode="numeric"
            maxLength={10}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Password</label>
        <div className="input-with-icon">
          <input
            type={showPass ? "text" : "password"}
            placeholder="Create a password (min 6 chars)"
            value={form.password}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, password: e.target.value }))
            }
            autoComplete="new-password"
          />
          <button
            className="eye-btn"
            type="button"
            onClick={() => setShowPass(!showPass)}
          >
            <EyeIcon open={showPass} />
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Pincode {pincodeLoading && <SmallSpinner />}</label>
        <input
          type="text"
          placeholder="Enter 6-digit pincode"
          value={form.pincode}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "").slice(0, 6);
            setForm((prev) => ({ ...prev, pincode: val }));
            if (val.length < 6) {
              setForm((prev) => ({
                ...prev,
                pincode: val,
                city: "",
                state: "",
              }));
              setPincodeError("");
            }
          }}
          inputMode="numeric"
          maxLength={6}
        />
        {pincodeError && <span className="field-error">{pincodeError}</span>}
      </div>

      <div className="pincode-row">
        <div className="form-group">
          <label>City</label>
          <input
            type="text"
            placeholder="Auto-filled"
            value={form.city}
            readOnly
            className={
              form.city ? "field-readonly field-filled" : "field-readonly"
            }
          />
        </div>
        <div className="form-group">
          <label>State</label>
          <input
            type="text"
            placeholder="Auto-filled"
            value={form.state}
            readOnly
            className={
              form.state ? "field-readonly field-filled" : "field-readonly"
            }
          />
        </div>
      </div>

      <button
        className="btn-primary"
        style={{ marginTop: 8 }}
        onClick={handleRegister}
        disabled={loading}
      >
        {loading ? "Creating Account…" : "Create Account"}
      </button>

      <div className="or-divider">
        <span>OR</span>
      </div>

      <button
        className="btn-google"
        onClick={async () => {
          try {
            const res = await fetch(`${API_BASE}/api/auth/google`);
            const data = await res.json();
            if (data.url) window.location.href = data.url;
          } catch {
            setError("Google signup is not available yet.");
          }
        }}
      >
        <GoogleIcon /> Sign up with Google
      </button>

      <p className="auth-footer" style={{ marginTop: 16 }}>
        Already have an account?{" "}
        <span className="link-green" onClick={onLogin}>
          Login
        </span>
      </p>
    </div>
  );
}

function LoginScreen({ onSignUp, onSuccess }) {
  const [showPass, setShowPass] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const isEmail = identifier.includes("@");
      const payload = { password };
      if (isEmail) {
        payload.email = identifier;
      } else {
        let phone = identifier.replace(/[\s\-\(\)]/g, "");
        if (!phone.startsWith("+")) {
          phone = phone.replace(/\D/g, "");
          if (phone.length === 10) phone = "+91" + phone;
          else if (!phone.startsWith("+")) phone = "+" + phone;
        }
        payload.phone = phone;
      }

      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || "Login failed");

      if (data.access_token)
        localStorage.setItem("access_token", data.access_token);
      if (data.refresh_token)
        localStorage.setItem("refresh_token", data.refresh_token);

      if (data.user) {
        // city is now in Supabase user_metadata (saved during signup)
        // so data.user.user_metadata.city is always available
        const city = data.user.user_metadata?.city;
        const enrichedUser = {
          ...data.user,
          user_metadata: { ...data.user.user_metadata, city: city || "" },
        };
        localStorage.setItem("user", JSON.stringify(enrichedUser));

        // Save to dedicated key — never lost even if localStorage.user gets refreshed
        if (city) {
          localStorage.setItem("user_city", city);
        } else {
          // Fallback for old accounts created before the backend fix:
          // fetch city from user_profiles table
          try {
            const profileRes = await fetch(
              `${API_BASE}/api/user-profile/${data.user.id}`,
              { headers: { Authorization: `Bearer ${data.access_token}` } },
            );
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              if (profileData.city) {
                localStorage.setItem("user_city", profileData.city);
                enrichedUser.user_metadata.city = profileData.city;
                localStorage.setItem("user", JSON.stringify(enrichedUser));
              }
            }
          } catch (e) {
            console.warn("Could not fetch city from profile:", e);
          }
        }
      }

      onSuccess({
        type: "login",
        name: data.user?.user_metadata?.full_name || identifier.split("@")[0],
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen auth-screen">
      <BackBtn onClick={onSignUp} />
      <Logo />
      <h2 className="auth-title-log" style={{ marginTop: 0 }}>
        Welcome back! Your pet's health journey continues here.
      </h2>

      {error && <p className="auth-error">{error}</p>}

      <div className="form-group">
        <label>Email or Phone Number</label>
        <input
          type="text"
          placeholder="Enter your email or phone"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Password</label>
        <div className="input-with-icon">
          <input
            type={showPass ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="eye-btn" onClick={() => setShowPass(!showPass)}>
            <EyeIcon open={showPass} />
          </button>
        </div>
      </div>

      <div className="forgot-row">
        <span className="link-green" onClick={() => setShowForgot(true)}>
          Forgot Password?
        </span>
      </div>

      {showForgot && <ForgotPasswordForm onBack={() => setShowForgot(false)} />}

      <button className="btn-primary" onClick={handleLogin} disabled={loading}>
        {loading ? "Logging in…" : "Login"}
      </button>

      <div className="or-divider">
        <span>OR</span>
      </div>

      <button
        className="btn-google"
        onClick={async () => {
          try {
            const res = await fetch(`${API_BASE}/api/auth/google`);
            const data = await res.json();
            if (data.url) window.location.href = data.url;
          } catch {
            setError("Google login is not available yet.");
          }
        }}
      >
        <GoogleIcon /> Continue with Google
      </button>

      <p className="auth-footer">
        New user?{" "}
        <span className="link-green" onClick={onSignUp}>
          Create Account
        </span>
      </p>
    </div>
  );
}

function ForgotPasswordForm({ onBack }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to send reset email");
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div
        style={{
          marginTop: 12,
          padding: "16px",
          background: "#f0faf3",
          borderRadius: "12px",
        }}
      >
        <p style={{ color: "#138a36", fontWeight: 600, marginBottom: 4 }}>
          ✓ Reset email sent!
        </p>
        <p style={{ color: "#555", fontSize: "13px" }}>
          Check your inbox for a password reset link.
        </p>
        <button
          onClick={onBack}
          style={{
            marginTop: 8,
            cursor: "pointer",
            border: "none",
            background: "none",
            color: "#138a36",
            fontWeight: 600,
          }}
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: 12,
        padding: "16px",
        background: "#f8f9fa",
        borderRadius: "12px",
      }}
    >
      <h4 style={{ margin: "0 0 8px", fontSize: "15px", color: "#333" }}>
        Reset Password
      </h4>
      {error && (
        <p className="auth-error" style={{ fontSize: "13px", marginBottom: 8 }}>
          {error}
        </p>
      )}
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 14px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          fontSize: "14px",
          marginBottom: 10,
          boxSizing: "border-box",
        }}
      />
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          className="btn-primary"
          onClick={handleReset}
          disabled={loading}
          style={{ flex: 1, fontSize: "14px", padding: "10px" }}
        >
          {loading ? "Sending…" : "Send Reset Link"}
        </button>
        <button
          onClick={onBack}
          style={{
            flex: 0,
            padding: "10px 16px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            background: "#fff",
            cursor: "pointer",
            fontSize: "14px",
            color: "#555",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState("register");
  const [successData, setSuccessData] = useState(null);

  const handleSuccess = (data) => {
    setSuccessData(data);
    setScreen("success");
  };

  const handleSuccessContinue = () => {
    navigate("/home");
    setSuccessData(null);
  };

  return (
    <div className="login-root">
      <div className="login-card">
        {screen === "register" && (
          <RegistrationScreen
            onLogin={() => setScreen("login")}
            onSuccess={handleSuccess}
          />
        )}
        {screen === "login" && (
          <LoginScreen
            onSignUp={() => setScreen("register")}
            onSuccess={handleSuccess}
          />
        )}
        {screen === "success" && (
          <SuccessScreen
            type={successData?.type}
            userName={successData?.name}
            onContinue={handleSuccessContinue}
          />
        )}
      </div>
    </div>
  );
}