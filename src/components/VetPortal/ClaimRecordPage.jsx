import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_BACKEND_URL || "";

export default function ClaimRecordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/api/v2/claims/${token}`)
      .then((r) => r.json())
      .then((d) => { setPet(d); setLoading(false); })
      .catch(() => { setError("Invalid or expired claim link."); setLoading(false); });
  }, [token]);

  const handleClaim = async () => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      localStorage.setItem("claim_redirect", `/claim/${token}`);
      navigate("/login");
      return;
    }
    setClaiming(true);
    setError("");
    try {
      const r = await fetch(`${API}/api/v2/claims/${token}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Failed to claim record");
      setClaimed(true);
      setTimeout(() => navigate("/timeline/home"), 2500);
    } catch (err) {
      setError(err.message);
    }
    setClaiming(false);
  };

  const emoji = pet?.pet_type === "cat" ? "🐱" : "🐶";

  return (
    <div style={{ minHeight: "100vh", background: "#EAF5E5", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, maxWidth: 380, width: "100%", boxShadow: "0 8px 32px rgba(0,75,73,0.12)" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#004B49" }}>PetOLife</div>
          <div style={{ fontSize: 12, color: "#6B8570", marginTop: 4 }}>Medical Record Claim</div>
        </div>

        {loading && <div style={{ textAlign: "center", color: "#6B8570", padding: 20 }}>Verifying claim link…</div>}

        {error && !loading && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
            <div style={{ color: "#B4433D", fontWeight: 700, fontSize: 14 }}>{error}</div>
            <a href="/" style={{ display: "block", marginTop: 16, color: "#004B49", fontWeight: 700 }}>Go to PetOLife →</a>
          </div>
        )}

        {claimed && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 50, marginBottom: 12 }}>🎉</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#004B49" }}>Pet Successfully Linked!</div>
            <div style={{ fontSize: 12, color: "#6B8570", marginTop: 8 }}>Taking you to your timeline…</div>
          </div>
        )}

        {pet && !claimed && !loading && (
          <>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 54, marginBottom: 8 }}>{emoji}</div>
              <div style={{ fontWeight: 800, fontSize: 20, color: "#004B49" }}>{pet.pet_name}</div>
              <div style={{ fontSize: 12, color: "#6B8570", marginTop: 4 }}>
                {pet.breed || "Mixed"} · {pet.pet_type}
              </div>
              <div style={{ fontSize: 11, color: "#9BAE9F", marginTop: 2 }}>{pet.petolife_id}</div>
            </div>

            <div style={{ background: "#EAF5E5", borderRadius: 12, padding: "12px 14px", marginBottom: 20, fontSize: 12, color: "#2F5233", lineHeight: 1.6 }}>
              A veterinarian has created a medical record for your pet. Claim this record to link it to your PetOLife account and view the complete health timeline.
            </div>

            {error && (
              <div style={{ background: "#FBEDEC", color: "#B4433D", padding: "8px 12px", borderRadius: 8, fontSize: 12, marginBottom: 12 }}>{error}</div>
            )}

            <button
              onClick={handleClaim}
              disabled={claiming}
              style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg,#84B662,#6FA54F)", color: "#fff", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: "pointer" }}
            >
              {claiming ? "Linking…" : `Claim ${pet.pet_name}'s Record`}
            </button>

            <div style={{ textAlign: "center", fontSize: 11, color: "#9BAE9F", marginTop: 12 }}>
              You'll be asked to sign in if you haven't already
            </div>
          </>
        )}
      </div>
    </div>
  );
}
