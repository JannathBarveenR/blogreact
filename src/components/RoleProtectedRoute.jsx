import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUserRoles } from "../hooks/useUserRoles";

export default function RoleProtectedRoute({ requires = "vet" }) {
  const token = localStorage.getItem("access_token");
  const { hasRole, loading } = useUserRoles();
  const location = useLocation();

  if (!token) {
    // If accessing vet portal, redirect to vet login
    if (requires === "vet") {
      return <Navigate to="/vet/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "Inter, sans-serif", color: "#6B8570" }}>
        Loading…
      </div>
    );
  }

  // If role check passes, render child routes
  if (hasRole(requires)) {
    return <Outlet />;
  }

  // If user is logged in but doesn't have the vet role, redirect to timeline home
  return <Navigate to="/timeline/home" replace />;
}
