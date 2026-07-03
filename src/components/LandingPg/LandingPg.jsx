// Homepg.jsx - Consolidated standalone component
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPg.css"; // merged stylesheet

// ---------- Navbar ----------
import logo from "../../assets/logo.png";
const Navbar = ({ openModal }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navLinks = [
    { label: "Home", href: "#home" },
    { label: "For Pet Parents", href: "#pet-parents" },
    { label: "For Veterinarians", href: "#veterinarians" },
    { label: "About PetOlife", href: "#about" },
  ];
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
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
      <header className={`navbar${scrolled ? " scrolled" : ""}`}>
        <div className="container navbar-inner">
          <a href="#home" className="navbar-logo" aria-label="PetOlife Home">
            <img src={logo} alt="PetOlife" />
          </a>
          <nav className="navbar-nav" aria-label="Main navigation">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className="navbar-cta">
            <button
              className="btn btn-primary"
              onClick={() => openModal("parent")}
            >
              Join Early Access
            </button>
          </div>
          <button
            className={`navbar-hamburger${menuOpen ? " open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>
      <div
        className={`navbar-mobile-overlay${menuOpen ? " open" : ""}`}
        onClick={closeMenu}
      ></div>
      <nav
        className={`navbar-mobile${menuOpen ? " open" : ""}`}
        aria-label="Mobile navigation"
      >
        {navLinks.map((link) => (
          <a key={link.href} href={link.href} onClick={closeMenu}>
            {link.label}
          </a>
        ))}
        <button
          className="btn btn-primary"
          onClick={() => {
            closeMenu();
            openModal("parent");
          }}
        >
          Join Early Access
        </button>
      </nav>
    </>
  );
};

// ---------- Hero ----------
import heroPets from "../../assets/hero-pets.png";
const Hero = ({ openModal, onJoinPetParent }) => (
  <section id="home" className="hero">
    <div className="container hero-grid">
      {/* Left Side */}
      <div className="hero-content">
        <h1 className="hero-title">
          Building a Health Identity
          <br />
          for <span className="highlight">Every Pet</span>
        </h1>

        <p className="hero-description">
          Helping pet parents organize health records, track care routines, and
          stay connected with trusted veterinary care.
        </p>

        <div className="hero-actions">
          <button className="btn btn-primary" onClick={onJoinPetParent}>
            Join as Pet Parent
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => openModal("vet")}
          >
            Join as Veterinarian
          </button>
        </div>
      </div>

      {/* Right Side */}
      <div className="hero-visual">
        <img src={heroPets} alt="Pet parent with pets" className="hero-image" />
      </div>
    </div>
  </section>
);

// ---------- Workingprocess ----------
import petProfileImg from "../../assets/pet-profile.png";
import healthRecordsImg from "../../assets/health-records.png";
import healthTimelineImg from "../../assets/health-timeline.png";
const steps = [
  {
    id: "01",
    image: petProfileImg,
    alt: "Pet Profile card for Bruno the Golden Retriever showing name, breed, age, and gender",
    title: "Create Pet Profile",
    description:
      "Add your pet's basic details and medical information to  get started.",
  },
  {
    id: "02",
    image: healthRecordsImg,
    alt: "Petolife health record box with vaccination, prescription, lab report, and treatment documents",
    title: "Upload Records",
    description:
      "Store vaccination records, prescriptions, and other important health documents securely.",
  },
  {
    id: "03",
    image: healthTimelineImg,
    alt: "Health timeline showing vaccination, deworming, and health checkup dates with next reminder",
    title: "Track Health",
    description:
      "Receive smart reminders and track your pet's complete healthcare journey in one place.",
  },
];
const Workingprocess = () => (
  <section className="py-16 md:py-24 bg-[#f7fff8]">
    <div className="max-w-[1300px] mx-auto px-8 md:px-10 pt-12 md:pt-14">
      <div className="text-center pt-12 md:pt-20 mb-20 md:mb-28">
        <span className="inline-block bg-[#dff7e4] text-[#2d8f55] px-[18px] py-2 rounded-full font-semibold mb-8 md:mb-10">
          🐾 3 steps to pet parenthood 😊
        </span>
        <h2 className="text-3xl md:text-5xl font-bold mb-6 md:mb-8 leading-tight">
          <span className="text-[#084108]">How</span>{" "}
          <span className="text-green">PetOlife Works</span>
        </h2>
        <p className="text-[#666] text-base md:text-lg">
          Keep your furry friends healthy with just three simple steps.
        </p>
      </div>

      <div className="flex flex-col gap-6 md:gap-8">
        {steps.map((step) => (
          <div
            key={step.id}
            className="flex flex-row items-center rounded-[24px] overflow-hidden border-2 border-[#e5f5e9] bg-white shadow-sm p-10 md:p-20 gap-5 md:gap-10 transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            {/* Left half — image */}
            <div className="w-1/2 flex items-center justify-center">
              <img
                src={step.image}
                alt={step.alt}
                className="w-full h-auto max-h-52 md:max-h-64 object-contain"
              />
            </div>

            {/* Right half — badge, title, description */}
            <div className="w-1/2 flex flex-col justify-center pr-4 md:pr-10">
              <span className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-[#082312] to-[#33e073] text-white text-xs md:text-sm font-bold flex items-center justify-center shadow-md mb-5 md:mb-7">
                {step.id}
              </span>
              <h3 className="text-lg md:text-2xl font-bold text-[#155f37] mb-3 md:mb-5">
                {step.title}
              </h3>
              <p className="text-sm md:text-base text-[#666] leading-loose my-3 md:my-4">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-28 md:mt-36 mb-8 md:mb-12 bg-gradient-to-r from-[#eafced] to-[#dff9e7] rounded-2xl p-8 md:p-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
        <span className="text-3xl">💚</span>
        <p className="text-[#02150b] font-medium">
          Smart reminders, secure records, and a lifelong health timeline — all
          in one place.
        </p>
      </div>
    </div>
  </section>
);

// ---------- VetTimeline ----------
import prescription from "../../assets/vetconnect/prescription.svg";
import followup from "../../assets/vetconnect/followup.svg";
import history from "../../assets/vetconnect/history.svg";
import continuity from "../../assets/vetconnect/continuity.svg";
const vetSteps = [
  { image: prescription, title: "Digital Prescription" },
  { image: followup, title: "Better Follow-up" },
  { image: history, title: "Organized Patient History" },
  { image: continuity, title: "Treatment Continuity" },
];
const VetTimeline = () => (
  <section className="vetTimeline">
    <div className="container">
      <div className="timelineHeader">
        <h2>
          <span className="dark">Built for</span>
          <span className="green"> Better Veterinary Care</span>
        </h2>
        <p>One connected workflow for smarter and continuous pet healthcare.</p>
      </div>
      <div className="timelineWrapper">
        <div className="timelineLine"></div>
        {vetSteps.map((item, index) => (
          <div className="timelineItem" key={index}>
            <div className="timelineCircle">
              <img src={item.image} alt={item.title} />
            </div>
            <h4>{item.title}</h4>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ---------- BeforeAfter ----------
import problemSolutionImg from "../../assets/problem-solution.jpeg";
const BeforeAfter = () => (
  <section className="section ba-section">
    <div className="container">
      <div className="ba-header">
        <h2 className="section-title">
          Struggling with <span className="text-teal">Pet Care</span>?{" "}
          <span className="text-green">Solution!</span>
        </h2>
        <p className="section-subtitle">
          Bridging the gap between stressful pet care and happy companionship.
        </p>
      </div>
      <div className="ba-image-wrapper">
        <img
          src={problemSolutionImg}
          alt="Before and after PetOlife — from scattered pet care to organized health management"
          className="ba-image"
        />
      </div>
    </div>
  </section>
);

// ---------- Categories ----------
import firstImg from "../../assets/firstimg.png";
import thirdImg from "../../assets/thirdimg.png";

const petParentBenefits = [
  "Store health records",
  "Track vaccines",
  "Track medications",
  "Receive reminders",
  "Stay organized",
];
const vetBenefits = [
  "Access complete history",
  "Improve treatment continuity",
  "Support follow-up care",
  "Shape future workflows",
];

const Categories = ({ openModal }) => (
  <section id="veterinarians" className="bg-white py-14 md:py-20">
    <div className="max-w-[1300px] mx-auto px-4 md:px-6">
      {/* Section header */}
      <div className="text-center mb-10 md:mb-16 flex flex-col items-center">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase text-[#0D5C5C] mb-3">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 shrink-0"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Who Is It For
        </span>
        <h2 className="text-2xl md:text-4xl font-extrabold text-gray-900 leading-tight tracking-tight mb-4">
          Made for Every <span className="text-[#2ea862]">Pet Journey</span>
        </h2>
        <p className="text-[0.9rem] md:text-[1.0625rem] text-gray-600 leading-relaxed max-w-[560px]">
          Whether you're a dedicated pet parent or a practising veterinarian —
          PetOlife is built with you in mind.
        </p>
      </div>

      <div className="flex flex-col gap-8 md:gap-10">
        {/* ---------------- Parent card ---------------- */}
        <div className="absolute -right-24 top-10 w-80 h-80 rounded-full bg-white/40 blur-3xl"></div>
        <div className="absolute -left-16 bottom-0 w-72 h-72 rounded-full bg-white/30 blur-3xl"></div>
        <div className="relative overflow-hidden grid grid-cols-1 lg:grid-cols-2 items-center rounded-[36px] border border-green-100 bg-gradient-to-r from-[#f9fef9] via-[#f3fbf5] to-[#e8f7ee] shadow-lg min-h-[560px]">
          {/* Text content */}
          <div className="flex flex-col justify-center px-8 py-10 lg:px-14 lg:py-16">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2 border border-green-100 shadow-sm text-[#1b5f3a] text-sm font-semibold mb-7">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3z" />
              </svg>
              Happy Pets. Healthy Future.
            </span>

            <h3 className="text-[2.4rem] lg:text-[3.6rem] font-extrabold leading-[1.05] tracking-tight mb-6">
              <span className="text-[#0f3d24]">Built for Responsible</span>{" "}
              <span className="text-[#2ea862]">Pet Parenting</span>
            </h3>

            <p className="text-lg leading-8 text-gray-600 max-w-xl mb-8">
              Everything you need to keep your furry family happy, healthy &
              loved.
            </p>

            <ul className="space-y-4 mb-10">
              {petParentBenefits.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-4 text-lg font-medium text-gray-700"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1b5f3a] text-white shadow-md">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <button
              className="inline-flex w-fit items-center gap-3 rounded-full bg-[#166534] px-8 py-4 text-base font-semibold text-white shadow-lg transition duration-300 hover:scale-105 hover:shadow-xl"
              onClick={() => openModal("parent")}
            >
              Join Early Access
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>

          {/* Visual */}
          <div className="relative flex items-center justify-center h-full p-8 lg:p-14">
            <img
              src={firstImg}
              alt="Pet health tracking and medical records interface"
              className="w-full max-w-[620px] object-contain drop-shadow-2xl transition duration-500 hover:scale-[1.02]"
            />
          </div>
        </div>

        {/* ---------------- Vet card ---------------- */}
        <div className="relative overflow-hidden grid grid-cols-1 lg:grid-cols-2 items-center rounded-[36px] border border-blue-100 bg-gradient-to-r from-[#f8fbff] via-[#f2f7ff] to-[#eaf3ff] shadow-lg min-h-[560px]">
          <div className="absolute -left-20 top-12 w-80 h-80 rounded-full bg-white/40 blur-3xl"></div>
          <div className="absolute -right-16 bottom-0 w-72 h-72 rounded-full bg-white/30 blur-3xl"></div>
          {/* Visual (first on mobile + desktop-left for vet card) */}
          <div className="relative flex items-center justify-center order-2 lg:order-1 h-full p-8 lg:p-14">
            <img
              src={thirdImg}
              alt="Breed guides, knowledge base, and veterinary advice interface"
              className="w-full max-w-[620px] object-contain drop-shadow-2xl transition duration-500 hover:scale-[1.02]"
            />
          </div>

          {/* Text content */}
          <div className="flex flex-col justify-center order-1 lg:order-2 px-8 py-10 lg:px-14 lg:py-16">
            <span className="inline-flex self-start items-center gap-1.5 bg-white/80 border border-blue-200 text-[#1a3a5f] text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 21c-4.4-2.6-8-6.4-8-11a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 4.6-3.6 8.4-8 11z" />
              </svg>
              Trusted Clinical Insight
            </span>

            <h3 className="text-2xl md:text-[2rem] font-extrabold leading-tight tracking-tight mb-4">
              <span className="text-[#0f2a3d]">Designed with</span>{" "}
              <span className="text-[#2a7f9a]">Veterinary Feedback</span>
            </h3>

            <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-6 max-w-md">
              Shaped alongside practising vets to fit real clinical workflows
              and patient care.
            </p>

            <ul className="flex flex-col gap-3 mb-8">
              {vetBenefits.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-3 text-sm md:text-[0.9375rem] font-medium text-gray-700"
                >
                  <span className="w-6 h-6 rounded-full bg-[#1a3a5f] text-white flex items-center justify-center shrink-0">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <button
              className="self-start inline-flex items-center gap-2 rounded-full font-semibold text-white bg-[#1a3a5f] px-6 py-3.5 text-sm shadow-sm transition-all hover:brightness-110 hover:shadow-md active:scale-[0.97]"
              onClick={() => openModal("vet")}
            >
              Join Early Access
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <p className="text-center mt-10 md:mt-14 text-sm text-gray-500 leading-relaxed">
        <span className="mr-1">🌱</span>
        <strong className="text-gray-700 font-semibold">
          Planning to bring home your first pet?
        </strong>{" "}
        PetOlife will help you get started responsibly.
      </p>
    </div>
  </section>
);

// ---------- Trust ----------
const trustIndicators = [
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      </svg>
    ),
    label: "Veterinary Feedback",
    desc: "Shaped by insights from practising veterinarians.",
  },
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
    label: "Real Clinic Learnings",
    desc: "Built on real-world clinic workflows and challenges.",
  },
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    label: "Pet Parent Community",
    desc: "Designed around real needs of responsible pet parents.",
  },
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    label: "Privacy-Focused",
    desc: "Your pet's data stays secure and under your control.",
  },
];
const Trust = ({ openModal }) => (
  <section id="about" className="section trust-section">
    <div className="container">
      <div className="trust-header">
        <span className="section-label">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>{" "}
          Trust &amp; Credibility
        </span>
        <h2 className="section-title">
          Built with <span className="text-teal">Pet Parents</span>.<br />
          Built with <span className="text-green">Veterinarians</span>.
        </h2>
        <p className="trust-mission">
          Building a Health Identity for Every Pet.
        </p>
      </div>
      <div className="trust-grid">
        {trustIndicators.map((item, idx) => (
          <div key={idx} className={`trust-card trust-card--${idx + 1}`}>
            <div className="trust-card-icon">{item.icon}</div>
            <h4 className="trust-card-label">{item.label}</h4>
            <p className="trust-card-desc">{item.desc}</p>
          </div>
        ))}
      </div>
      <div className="trust-cta-block">
        <p className="trust-cta-text">
          Join the growing community of pet parents and veterinarians who are
          shaping the future of pet healthcare.
        </p>
        <div className="trust-cta-actions">
          <button
            className="btn btn-primary"
            onClick={() => openModal("parent")}
          >
            Join as Pet Parent
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => openModal("vet")}
          >
            Join as Veterinarian
          </button>
        </div>
      </div>
    </div>
  </section>
);

// ---------- Footer ----------
import footerLogo from "../../assets/logo.png";
const Footer = () => {
  const companyLinks = [
    { label: "About Us", href: "#about" },
    { label: "Our Mission", href: "#home" },
    { label: "Contact Us", href: "mailto:tech@petolife.com" },
  ];
  const productLinks = [
    { label: "How It Works", href: "#pet-parents" },
    { label: "For Pet Parents", href: "#veterinarians" },
    { label: "For Veterinarians", href: "#veterinarians" },
    { label: "Trust & Mission", href: "#about" },
  ];
  return (
    <footer className="footer">
      <div className="footer-wave">
        <svg
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z"
            fill="currentColor"
          />
        </svg>
      </div>
      <div className="footer-body">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <img src={footerLogo} alt="PetOlife" className="footer-logo" />
              <p className="footer-tagline">
                Building a Health Identity for Every Pet.
              </p>
            </div>
            <div className="footer-column">
              <h4 className="footer-column-title">Company</h4>
              <ul className="footer-links">
                {companyLinks.map((link, idx) => (
                  <li key={idx}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="footer-column">
              <h4 className="footer-column-title">Follow Us</h4>
              <div className="footer-socials">
                <a
                  href="https://www.linkedin.com/company/petolife/"
                  className="footer-social"
                  aria-label="LinkedIn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M4.98 3.5C4.98 4.88 3.86 6 2.48 6S0 4.88 0 3.5 1.12 1 2.48 1s2.5 1.12 2.5 2.5zM0 8h5v16H0V8zm7.5 0h4.79v2.19h.07c.67-1.27 2.31-2.61 4.76-2.61 5.09 0 6.03 3.35 6.03 7.7V24h-5v-7.08c0-1.69-.03-3.86-2.35-3.86-2.35 0-2.71 1.84-2.71 3.74V24h-5V8z" />
                  </svg>
                </a>
                <a href="#" className="footer-social" aria-label="Instagram">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </a>
              </div>
              <div className="footer-contact">
                <p>tech@petolife.com</p>
              </div>
            </div>
            <div className="footer-bottom">
              <p>
                &copy; {new Date().getFullYear()} PetOlife. All rights reserved.
              </p>
              <div className="footer-legal">
                <a href="#">Privacy Policy</a>
                <span className="footer-divider">|</span>
                <a href="#">Terms of Service</a>
                <span className="footer-divider">|</span>
                <a href="#">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// ---------- RegistrationModal ----------
import { submitPetParentForm, submitVetForm } from "../../api/endpoints";
const RegistrationModal = ({ isOpen, onClose, type, onRegisterSuccess }) => {
  const isVet = type === "vet";
  const [vetData, setVetData] = useState({
    doctorName: "",
    clinicName: "",
    mobile: "",
    email: "",
    city: "",
    earlyAccess: true,
  });
  const [parentData, setParentData] = useState({
    name: "",
    mobile: "",
    email: "",
    city: "",
    petType: "",
    hasPet: true,
    earlyAccess: true,
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ msg: "", ok: null });
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);
  useEffect(() => {
    if (isOpen) setStatus({ msg: "", ok: null });
  }, [isOpen]);
  if (!isOpen) return null;
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ msg: "", ok: null });
    const res = isVet
      ? await submitVetForm(vetData)
      : await submitPetParentForm(parentData);
    setLoading(false);
    setStatus({ msg: res.message, ok: res.success });
    if (res.success && onRegisterSuccess) {
      onRegisterSuccess(type);
    }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
        <h3 className="modal-title">
          {isVet ? "Veterinarian Interest Form" : "Pet Parent Interest Form"}
        </h3>
        <p className="modal-subtitle">
          {isVet
            ? "Join us to shape the future of pet healthcare."
            : "Join early to organize your pet's health identity."}
        </p>
        <form className="modal-form" onSubmit={handleSubmit}>
          {isVet ? (
            <>
              {" "}
              {/* Vet fields */}
              <div className="form-group">
                <label>Doctor Name</label>
                <input
                  type="text"
                  placeholder="Dr. Akash Jha"
                  required
                  value={vetData.doctorName}
                  onChange={(e) =>
                    setVetData({ ...vetData, doctorName: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Clinic Name</label>
                <input
                  type="text"
                  placeholder="Happy Pets Clinic"
                  required
                  value={vetData.clinicName}
                  onChange={(e) =>
                    setVetData({ ...vetData, clinicName: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Mobile Number</label>
                <input
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  required
                  value={vetData.mobile}
                  onChange={(e) =>
                    setVetData({ ...vetData, mobile: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="akash@happypets.com"
                  required
                  value={vetData.email}
                  onChange={(e) =>
                    setVetData({ ...vetData, email: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  placeholder="e.g., Chennai"
                  required
                  value={vetData.city}
                  onChange={(e) =>
                    setVetData({ ...vetData, city: e.target.value })
                  }
                />
              </div>
              <div className="form-checkbox">
                <input
                  type="checkbox"
                  id="vet-early"
                  checked={vetData.earlyAccess}
                  onChange={(e) =>
                    setVetData({ ...vetData, earlyAccess: e.target.checked })
                  }
                />
                <label htmlFor="vet-early">Interested in Early Access?</label>
              </div>
            </>
          ) : (
            <>
              {" "}
              {/* Parent fields */}
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  placeholder="Ram Charan"
                  required
                  value={parentData.name}
                  onChange={(e) =>
                    setParentData({ ...parentData, name: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Mobile Number</label>
                <input
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  required
                  value={parentData.mobile}
                  onChange={(e) =>
                    setParentData({ ...parentData, mobile: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="ram@example.com"
                  required
                  value={parentData.email}
                  onChange={(e) =>
                    setParentData({ ...parentData, email: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  placeholder="e.g., Chennai"
                  required
                  value={parentData.city}
                  onChange={(e) =>
                    setParentData({ ...parentData, city: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Pet Type</label>
                <div className="pet-type-pills">
                  {["dog", "cat", "other"].map((pet) => (
                    <label className="pet-pill" key={pet}>
                      <input
                        type="radio"
                        name="petType"
                        value={pet}
                        required
                        checked={parentData.petType === pet}
                        onChange={(e) =>
                          setParentData({
                            ...parentData,
                            petType: e.target.value,
                          })
                        }
                      />
                      <span>{pet.charAt(0).toUpperCase() + pet.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-checkbox">
                <input
                  type="checkbox"
                  id="parent-have-pet"
                  checked={parentData.hasPet}
                  onChange={(e) =>
                    setParentData({ ...parentData, hasPet: e.target.checked })
                  }
                />
                <label htmlFor="parent-have-pet">Already Have a Pet?</label>
              </div>
              <div className="form-checkbox">
                <input
                  type="checkbox"
                  id="parent-early"
                  checked={parentData.earlyAccess}
                  onChange={(e) =>
                    setParentData({
                      ...parentData,
                      earlyAccess: e.target.checked,
                    })
                  }
                />
                <label htmlFor="parent-early">
                  Interested in Early Access?
                </label>
              </div>
            </>
          )}
          {status.msg && (
            <p
              style={{
                textAlign: "center",
                fontSize: "0.875rem",
                color: status.ok ? "var(--color-teal)" : "#e53e3e",
                margin: "0",
              }}
            >
              {status.msg}
            </p>
          )}
          <button
            type="submit"
            className="btn btn-primary modal-submit"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
};

// ---------- ThankYouModal ----------
const ThankYouModal = ({ isOpen, onClose, type }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  const isVet = type === "vet";
  return (
    <div className="thank-overlay">
      <div className="thank-modal">
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
        <div className="success-icon">{isVet ? "🩺" : "🐾"}</div>
        <h2>
          {isVet
            ? "Thank You for Joining VetConnect!"
            : "Welcome to the PetOlife Family!"}
        </h2>
        <h4>Your registration has been received.</h4>
        <div className="status-list">
          <p>✅ Our team will review your details.</p>
          <p>✅ You'll receive updates as we move closer to launch.</p>
          <p>✅ Stay connected and follow our journey.</p>
        </div>
        <div className="social-buttons">
          <a href="https://www.instagram.com/petolife.care/" target="_blank">
            📸 Follow Instagram
          </a>{" "}
          <a href="https://www.linkedin.com/company/petolife/" target="_blank">
            💼 Follow LinkedIn
          </a>
        </div>
        <button className="home-btn" onClick={onClose}>
          Return Home
        </button>
      </div>
    </div>
  );
};

// ---------- Main Homepg Component ----------
function LandingPg() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("parent");
  const [showThankYou, setShowThankYou] = useState(false);
  const [thankType, setThankType] = useState("parent");
  const openModal = (type) => {
    setModalType(type);
    setModalOpen(true);
  };
  const handleRegisterSuccess = (type) => {
    setModalOpen(false);
    setThankType(type);
    setShowThankYou(true);
  };
  const handleJoinPetParent = () => navigate("/login");
  return (
    <>
      <Navbar openModal={openModal} />
      <main>
        <Hero openModal={openModal} onJoinPetParent={handleJoinPetParent} />

        <Workingprocess />
        <VetTimeline />
        <BeforeAfter />
        <Categories openModal={openModal} />
        <Trust openModal={openModal} />
      </main>
      <Footer />
      <RegistrationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalType}
        onRegisterSuccess={handleRegisterSuccess}
      />
      <ThankYouModal
        isOpen={showThankYou}
        type={thankType}
        onClose={() => setShowThankYou(false)}
      />
    </>
  );
}

export default LandingPg;
