import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";

/**
 * AuthCallback — Handles the OAuth redirect from Supabase (PKCE flow).
 *
 * When using supabase.auth.signInWithOAuth() from the frontend, supabase-js
 * automatically stores the code_verifier and exchanges the ?code= on this page.
 * We just need to call getSession() after the redirect and save tokens to localStorage.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Completing sign in…");

  useEffect(() => {
    async function handleCallback() {
      try {
        // supabase-js automatically detects the ?code= in the URL and exchanges it
        // because it stored the code_verifier when signInWithOAuth was called.
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("[AuthCallback] Session error:", error);
          setStatus("Sign in failed. Redirecting to login…");
          setTimeout(() => navigate("/login", { replace: true }), 1500);
          return;
        }

        if (data?.session) {
          const { access_token, refresh_token, user } = data.session;

          // Persist tokens so our custom useAuth hook picks them up
          localStorage.setItem("access_token", access_token);
          if (refresh_token) localStorage.setItem("refresh_token", refresh_token);
          if (user) localStorage.setItem("user", JSON.stringify(user));

          setStatus("Sign in successful! Redirecting…");
          navigate("/home", { replace: true });
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
