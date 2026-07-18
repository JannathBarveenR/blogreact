import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import Login from "./components/Login/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

// Lazy-loaded routes
const LandingPg = lazy(() => import("./components/LandingPg/LandingPg"));
const MainLayout = lazy(() => import("./components/MainLayout/MainLayout"));
const ProfileCreate = lazy(() => import("./components/ProfileCreation/ProfileCreation/ProfileCreation"));
const PetCard = lazy(() => import("./components/petcard/petcard"));
const ResetPassword = lazy(() => import("./components/Login/ResetPassword"));
const AuthCallback = lazy(() => import("./components/AuthCallback/AuthCallback"));
const ParentProfile = lazy(() => import("./components/ParentProfile/ParentProfile"));

function LoadingFallback() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "Inter, sans-serif", color: "#9ca3af" }}>
      Loading…
    </div>
  );
}

import { useEffect } from "react";

function App() {
  useEffect(() => {
    // Parse OAuth hash fragment globally to catch redirects to / or /landing
    const hash = window.location.hash;
    if (hash && hash.includes("access_token=")) {
      const params = new URLSearchParams(hash.replace("#", "?"));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      if (accessToken) {
        localStorage.setItem("access_token", accessToken);
        if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
        // Clean up URL and redirect to home
        window.history.replaceState(null, "", "/home");
        window.location.href = "/home"; // Force navigation so ProtectedRoute picks it up
      }
    }
  }, []);

  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/landing" replace />} />
          <Route path="/landing" element={<LandingPg />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/pet/:id" element={<PetCard />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<MainLayout />} />
            <Route path="/create-pet-profile" element={<ProfileCreate />} />
            <Route path="/parent-profile" element={<ParentProfile />} />
          </Route>
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/landing" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
