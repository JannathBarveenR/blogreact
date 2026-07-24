import React from "react";
import { ShieldCheck, Heart, Stethoscope, Mail, Globe, ArrowUp } from "lucide-react";
import logo from "../../../assets/logo-with-tagline.webp";

const Footer = ({ openModal }) => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="footer-container">
      <div className="footer-inner">

        {/* Brand */}
        <div>
          <a href="#hero"><img src={logo} alt="PetOlife" className="footer-logo-img" /></a>
          <p className="footer-tagline">
            Building a unified digital health identity for every pet — protecting memories,
            medical history, and preventive care in one secure timeline.
          </p>
          <div className="footer-slogan-badge">
            <ShieldCheck size={14} style={{ color: "#004b49" }} /> Every Pet. One Identity. Better Care.
          </div>
        </div>

        {/* Platform */}
        <div>
          <p className="footer-heading">Platform</p>
          <ul className="footer-list">
            <li><a href="#hero">Home</a></li>
            <li><a href="#empathy">Why PetOlife</a></li>
            <li><a href="#features">AI Health Timeline</a></li>
            <li><a href="#features">Medical Records</a></li>
            <li><a href="#features">Smart Reminders</a></li>
          </ul>
        </div>

        {/* Portals */}
        <div>
          <p className="footer-heading">Portals</p>
          <ul className="footer-list">
            <li>
              <button className="footer-link-btn" onClick={() => openModal("parent")}>
                <Heart size={13} style={{ color: "#004b49" }} /> Pet Parent ID Pass
              </button>
            </li>
            <li>
              <button className="footer-link-btn" onClick={() => openModal("vet")}>
                <Stethoscope size={13} style={{ color: "#004b49" }} /> Veterinary Portal
              </button>
            </li>
            <li><a href="#vision">Our Belief</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="footer-heading">Contact</p>
          <ul className="footer-list">
            <li className="footer-info-item"><Mail size={14} style={{ color: "#004b49" }} /> support@petolife.com</li>
            <li className="footer-info-item"><Globe size={14} style={{ color: "#004b49" }} /> www.petolife.com</li>
            <li className="footer-info-item"><ShieldCheck size={14} style={{ color: "#004b49" }} /> 256-Bit Encrypted Vault</li>
          </ul>
        </div>

      </div>

      <div className="footer-bottom">
        <p className="copyright-text">
          &copy; {new Date().getFullYear()} PetOlife. Built for pets who can't speak for themselves.
        </p>
        <button className="scroll-top-btn" onClick={scrollToTop} aria-label="Back to top">
          Back to top <ArrowUp size={14} />
        </button>
      </div>
    </footer>
  );
};

export default Footer;
