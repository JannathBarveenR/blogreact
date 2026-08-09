import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, ShieldCheck, Stethoscope, Heart } from "lucide-react";
import logo from "../../../assets/logo-with-tagline.webp";

const Navbar = ({ openModal }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { label: "Home", href: "#hero" },
    { label: "Pet's Thought", href: "#empathy" },
    { label: "Platform Features", href: "#features" },
    { label: "Why PetOlife", href: "#vision" },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className={`navbar-header ${scrolled ? "scrolled" : ""}`}>
        <div className="navbar-container">
          <a href="#hero" className="navbar-brand" aria-label="PetOlife Home">
            <img src={logo} alt="PetOlife - Every Pet. One Identity. Better Care." className="navbar-logo-img" />
          </a>

          <nav className="navbar-desktop-nav" aria-label="Main navigation">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="nav-link">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="navbar-actions">
            <button
              className="btn btn-outline-nav"
              onClick={() => openModal("vet")}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Stethoscope size={15} />
              <span>Join as Vet</span>
            </button>
            <button
              className="btn btn-outline-nav"
              onClick={() => navigate("/login")}
            >
              <span>Login</span>
            </button>
            <button
              className="btn btn-primary-nav"
              onClick={() => openModal("register")}
            >
              <Heart className="btn-icon" size={16} />
              <span>Get My Pet Health ID</span>
            </button>
          </div>

          <div className="navbar-mobile-actions">
            <button
              type="button"
              className="btn btn-outline-nav btn-mobile-login"
              onClick={() => navigate("/login")}
            >
              <span>Login</span>
            </button>

            <button
              type="button"
              className="navbar-mobile-toggle"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Backdrop */}
      <div
        className={`mobile-menu-overlay ${menuOpen ? "open" : ""}`}
        onClick={closeMenu}
      />

      {/* Mobile Drawer */}
      <aside className={`mobile-menu-drawer ${menuOpen ? "open" : ""}`} aria-label="Mobile navigation">
        <div className="mobile-menu-header">
          <img src={logo} alt="PetOlife Logo" className="mobile-logo-img" />
          <button className="mobile-close-btn" onClick={closeMenu} aria-label="Close menu">
            <X size={24} />
          </button>
        </div>

        <nav className="mobile-nav-list">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} onClick={closeMenu} className="mobile-nav-link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="mobile-cta-group">
          <button
            className="btn btn-primary-nav w-full"
            onClick={() => {
              closeMenu();
              openModal("register");
            }}
          >
            <Heart className="btn-icon" size={16} />
            <span>Get My Pet Health ID</span>
          </button>
          <button
            className="btn btn-outline-nav w-full mt-2"
            onClick={() => {
              closeMenu();
              openModal("vet");
            }}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
          >
            <Stethoscope size={16} />
            <span>Join as Vet</span>
          </button>
          <button
            className="btn btn-outline-nav w-full mt-2"
            onClick={() => {
              closeMenu();
              navigate("/login");
            }}
          >
            <span>Login</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Navbar;
