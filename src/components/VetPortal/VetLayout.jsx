import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import "./VetPortal.css";

export default function VetLayout() {
  const navigate = useNavigate();

  const navItems = [
    { path: "/vet/home", icon: "🏠", label: "Home" },
    { path: "/vet/patients", icon: "🐾", label: "Patients" },
    { path: "/vet/profile", icon: "👨‍⚕️", label: "Profile" },
  ];

  return (
    <div className="vet-portal-container">
      {/* App Bar */}
      <div className="vet-app-bar">
        <NavLink to="/vet/home" className="vet-app-brand">
          PetOLife <span className="vet-brand-badge">VET</span>
        </NavLink>
        <div className="vet-avatar-chip" onClick={() => navigate("/vet/profile")}>
          Dr
        </div>
      </div>

      {/* Page Content */}
      <div className="vet-body-wrapper">
        <Outlet />
      </div>

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #d9ddd6", display: "flex", zIndex: 100 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `vet-nav-item${isActive ? " active" : ""}`}
          >
            <span style={{ fontSize: "18px" }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
