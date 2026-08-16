import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Completing sign in…");

  useEffect(() => {
    async function handleCallback() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("[AuthCallback] Session error:", error);
          setStatus("Sign in failed. Redirecting to login…");
          setTimeout(() => navigate("/login", { replace: true }), 1500);
          return;
        }

        if (data?.session) {
          const { access_token, refresh_token, user } = data.session;

          localStorage.setItem("access_token", access_token);
          if (refresh_token) localStorage.setItem("refresh_token", refresh_token);
          if (user) localStorage.setItem("user", JSON.stringify(user));

          setStatus("Checking onboarding status…");
          try {
            const profileRes = await fetch(`${API_BASE}/api/user-profile/${user.id}`, {
              headers: { Authorization: `Bearer ${access_token}` },
            });

            if (profileRes.ok) {
              const profileData = await profileRes.json();

              // FIXED: Both full_name AND phone must exist to consider profile complete.
              // This ensures Google OAuth users who skipped the form are always
              // redirected back to complete their phone number.
              const isComplete =
                profileData &&
                profileData.full_name &&
                profileData.full_name.trim() !== "" &&
                profileData.phone &&
                profileData.phone.trim() !== "" &&
                profileData.pincode &&
                profileData.pincode.trim() !== "" &&
                profileData.city &&
                profileData.city.trim() !== "";

              if (isComplete) {
                setStatus("Sign in successful! Redirecting…");
                navigate("/home", { replace: true });
              } else {
                navigate("/parent-profile", { replace: true });
              }
            } else {
              // No profile row yet — send to onboarding
              navigate("/parent-profile", { replace: true });
            }
          } catch (e) {
            console.error("[AuthCallback] Failed to fetch profile:", e);
            navigate("/parent-profile", { replace: true });
          }
        } else {
          setStatus("No session found. Redirecting to login…");
          setTimeout(() => navigate("/login", { replace: true }), 1500);
        }
      } catch (err) {
        console.error("[AuthCallback] Unexpected error:", err);
        setStatus("Something went wrong. Redirecting to login…");
        setTimeout(() => navigate("/login", { replace: true }), 1500);
      }
    }

    handleCallback();
  }, [navigate]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#def3e1",
        fontFamily: "Inter, 'Segoe UI', sans-serif",
        gap: "16px",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          border: "4px solid #c0e8d0",
          borderTop: "4px solid #06402b",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p style={{ color: "#06402b", fontWeight: 600, fontSize: "15px" }}>
        {status}
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}