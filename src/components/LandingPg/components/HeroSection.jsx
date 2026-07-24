import React from "react";
import { motion } from "framer-motion";
import {
  Heart, Sparkles, Clock, ShieldCheck,
  ArrowRight, Stethoscope, CheckCircle2
} from "lucide-react";
import heroPetsImg from "../../../assets/hero-pets-desk.webp";

const HeroSection = ({ openModal }) => (
  <section id="hero" className="hero-section">
      {/* ── Left: Copy ── */}
      <motion.div
        className="hero-content"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="badge hero-badge">
          <Heart size={14} style={{ color: "#004b49" }} />
          Built for pets who can't speak for themselves.
        </div>

        <h1 className="hero-headline">
          You know my favorite toy.
          <span className="hero-headline-accent">
            Do you know when I was last vaccinated?
          </span>
        </h1>

        <div className="hero-mobile-image-frame">
          <img
            src={heroPetsImg}
            alt="Happy dog and cat with digital Pet Health ID"
            className="hero-mobile-image-src"
          />
        </div>

        <p className="hero-subtitle">
          Your pet depends on you for everything. PetOlife helps you remember
          every vaccination, prescription, lab report, and milestone—so your pet
          never misses the care they deserve.
        </p>

        <div className="hero-trust-bullets">
          <div className="trust-item">
            <div className="trust-icon-wrapper teal"><Sparkles size={16} /></div>
            <div className="trust-text">
              <span className="trust-title">AI-Powered Health Timeline</span>
              <span className="trust-desc">Automated records sorting &amp; extraction</span>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon-wrapper amber"><Clock size={16} /></div>
            <div className="trust-text">
              <span className="trust-title">Smart Reminders</span>
              <span className="trust-desc">Vaccines, meds &amp; checkup alerts</span>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon-wrapper emerald"><ShieldCheck size={16} /></div>
            <div className="trust-text">
              <span className="trust-title">Secure Medical Records</span>
              <span className="trust-desc">Lifelong health history digital pass</span>
            </div>
          </div>
        </div>

        <div className="hero-cta-group">
          <button className="btn-hero-primary" onClick={() => openModal("parent")}>
            Get My Pet Health ID <ArrowRight size={18} />
          </button>
          <button className="btn-hero-secondary" onClick={() => openModal("vet")}>
            <Stethoscope size={17} /> I'm a Veterinarian
          </button>
        </div>

      </motion.div>

      {/* ── Right: Visual ── */}
      <motion.div
        className="hero-media-wrapper"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.75, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="hero-image-frame" data-image-id="HERO_PETS_MAIN">
          <img
            src={heroPetsImg}
            alt="Happy dog and cat with digital Pet Health ID"
            className="hero-image-src"
            loading="eager"
          />

          <div className="hero-floating-card top-right">
            <div className="floating-card-icon">
              <ShieldCheck size={18} style={{ color: "#004b49" }} />
            </div>
            <div className="floating-card-content">
              <span className="floating-card-title">Digital Pet Health ID</span>
              <span className="floating-card-sub">Verified &amp; Instant Shareable</span>
            </div>
          </div>

          <div className="hero-floating-card bottom-left">
            <div className="floating-card-icon">
              <Sparkles size={18} style={{ color: "#004b49" }} />
            </div>
            <div className="floating-card-content">
              <span className="floating-card-title">AI Vaccine Tracker</span>
              <span className="floating-card-sub">Rabies booster in 12 days</span>
            </div>
          </div>
        </div>
      </motion.div>
    
  </section>
);

export default HeroSection;
