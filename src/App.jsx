import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import Login from "./components/Login/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

// Lazy-loaded routes
const LandingPg = lazy(() => import("./components/LandingPg/LandingPg"));
const MainLayout = lazy(() => import("./components/MainLayout/MainLayout"));
const ProfileCreate = lazy(() => import("./components/ProfileCreation/ProfileCreation/ProfileCreation"));
const PublicPetProfile = lazy(() => import("./components/PublicPetProfile/PublicPetProfile"));
const ResetPassword = lazy(() => import("./components/Login/ResetPassword"));
const AuthCallback = lazy(() => import("./components/AuthCallback/AuthCallback"));
const ParentProfile = lazy(() => import("./components/ParentProfile/ParentProfile"));
const RemindersPage = lazy(() => import("./components/Reminders/RemindersPage"));
const EventDetailPage = lazy(() => import("./components/Timeline/EventDetailPage/EventDetailPage"));
const PetLifestyleSurveyPage = lazy(() => import("./components/Home/PetLifestyleSurveyPage"));
const FeedbackPage = lazy(() => import("./components/Feedback/FeedbackPage"));
const FeedbackDetailPage = lazy(() => import("./components/Feedback/FeedbackDetailPage"));
const NotFoundPage = lazy(() => import("./components/NotFound/NotFoundPage"));
const Blog = lazy(() => import("./components/Blog/Blog"));

function LoadingFallback() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "Inter, sans-serif", color: "#9ca3af" }}>
      Loading…
    </div>
  );
}

function App() {
  useEffect(() => {
    const search = window.location.search;
    const hash = window.location.hash;
    const pathname = window.location.pathname;

    // If an OAuth callback (?code= or #access_token=) lands on any page other than /auth/callback,
    // forward it to /auth/callback so AuthCallback can exchange the PKCE code or tokens.
    if (pathname !== "/auth/callback" && (search.includes("code=") || hash.includes("access_token="))) {
      window.location.href = `/auth/callback${search}${hash}`;
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
          <Route path="/pet/:id" element={<PublicPetProfile />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/pet-parent-academy" element={<Blog />} />
          <Route path="/pet-parent-academy/blogs/:id" element={<Blog />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<MainLayout />} />
            <Route path="/timeline" element={<MainLayout />} />
            <Route path="/timeline/home" element={<MainLayout />} />
            <Route path="/records" element={<MainLayout />} />
            <Route path="/profile" element={<MainLayout />} />
            <Route path="/create-pet-profile" element={<ProfileCreate />} />
            <Route path="/parent-profile" element={<ParentProfile />} />
            <Route path="/reminders" element={<RemindersPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/feedback/:id" element={<Navigate to="/feedback" replace />} />
            <Route path="/timeline/event/:eventId" element={<EventDetailPage />} />
            <Route path="/records/event/:eventId" element={<EventDetailPage />} />
            <Route path="/survey/:petId" element={<PetLifestyleSurveyPage />} />
          </Route>

          {/* Blog – public, opens in new tab from Home */}
          <Route path="/pet-parent-academy" element={<Blog />} />
          <Route path="/pet-parent-academy/blogs/:id" element={<Blog />} />

          {/* Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
