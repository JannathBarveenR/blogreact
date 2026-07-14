// Homepg.jsx - Consolidated standalone component
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPg.css"; // merged stylesheet

// ---------- Navbar ----------
import logo from "../../assets/logo-with-tagline.webp";
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
import heroPets from "../../assets/hero-pets.webp";

const Hero = ({ openModal, onJoinPetParent }) => {
  const fullText = "Building a Health Identity for Every Pet";
  const part1 = "Building a Health Identity ";
  const [typedText, setTypedText] = useState("");
  const [isTypingDone, setIsTypingDone] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);

  useEffect(() => {
    const charDelay = 75; // 40 characters in 3 seconds (3000 / 40 = 75ms)
    let index = 0;
    const intervalId = setInterval(() => {
      setTypedText(fullText.substring(0, index + 1));
      index++;
      if (index >= fullText.length) {
        clearInterval(intervalId);
        setIsTypingDone(true);
        setShowSubtitle(true);
      }
    }, charDelay);

    return () => clearInterval(intervalId);
  }, []);

  const renderTitle = () => {
    if (typedText.length <= part1.length) {
      return (
        <>
          {typedText}
          {!isTypingDone && <span className="typewriter-cursor">|</span>}
        </>
      );
    } else {
      const typedPart2 = typedText.substring(part1.length);
      return (
        <>
          {part1}
          <span className="text-green-accent">{typedPart2}</span>
          {!isTypingDone && <span className="typewriter-cursor">|</span>}
        </>
      );
    }
  };

  return (
    <section id="home" className="hero">
      <div className="hero-bg">
        <img src={heroPets} alt="" className="hero-bg-image" />
      </div>

      <div className="hero-text-overlay">
        <h1 className="hero-title-typewriter">
          {renderTitle()}
        </h1>
        <p className={`hero-subtitle-fadein ${showSubtitle ? "visible" : ""}`}>
          Helping pet parents organize health records, track care routines, and stay connected with trusted veterinary care.
        </p>
      </div>

      <div className="hero-bottom-actions">
        <button className="btn btn-primary" onClick={onJoinPetParent}>
          Join as Pet Parent
        </button>

        <button className="btn btn-secondary" onClick={() => openModal("vet")}>
          Join as Veterinarian
        </button>
      </div>
    </section>
  );
};

// ---------- Workingprocess ----------
import petProfileImg from "../../assets/pet-profile.webp";
import healthRecordsImg from "../../assets/health-records.webp";
import healthTimelineImg from "../../assets/health-timeline.webp";

const steps = [
  {
    id: "01",
    image: petProfileImg,
    alt: "Pet Profile",
    title: "Create Pet Profile",
    description:
      "Add your pet's basic details and medical information to get started.",
  },
  {
    id: "02",
    image: healthRecordsImg,
    alt: "Health Records",
    title: "Upload Records",
    description:
      "Store vaccination records, prescriptions, and other important health documents securely.",
  },
  {
    id: "03",
    image: healthTimelineImg,
    alt: "Health Timeline",
    title: "Track Health",
    description:
      "Receive smart reminders and track your pet's complete healthcare journey in one place.",
  },
];

const Workingprocess = () => {
  return (
    <section className="working-process">
      <div className="working-process-container">
        {/* Heading */}
        <div className="working-header">
          <span className="working-badge">🐾 3 steps to pet parenthood 😊</span>

          <h2 className="working-title">
            <span className="title-dark">How </span>
            <span className="title-green">PetOlife Works</span>
          </h2>

          <p className="working-subtitle-how">
            Keep your furry friends healthy with just three simple steps.
          </p>
        </div>

        {/* Cards */}
        <div className="working-cards">
          {steps.map((step) => (
            <div className="working-card" key={step.id}>
              {/* Glowing floating orbs */}
              <span className="glow-orb glow-orb-1"></span>
              <span className="glow-orb glow-orb-2"></span>
              <span className="glow-orb glow-orb-3"></span>
              {/* Left */}
              <div className="working-image">
                <img src={step.image} alt={step.alt} loading="lazy" />
              </div>
              {/* Right */}
              <div className="working-content">
                <div className="working-number">{step.id}</div>
                <h3 className="working-card-title">{step.title}</h3>
                <p className="working-card-description">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="working-banner">
          <div className="banner-icon">💚</div>
          <p className="banner-text">
            Smart reminders, secure records, and a lifelong health timeline —
            all in one place.
          </p>
        </div>
      </div>
    </section>
  );
};

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
        <h2 className="working-title">
          <span className="title-dark">Built for </span>
          <span className="title-green">Better Veterinary Care</span>
        </h2>

        <p>One connected workflow for smarter and continuous pet healthcare.</p>
      </div>
      <div className="timelineWrapper">
        <div className="timelineLine"></div>
        {vetSteps.map((item, index) => (
          <div className="timelineItem" key={index}>
            <div className="timelineCircle">
              <img src={item.image} alt={item.title} loading="lazy" />
            </div>
            <h4>{item.title}</h4>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ---------- BeforeAfter ----------
import problemSolutionImg from "../../assets/problem-solution.webp";
const BeforeAfter = () => (
  <section className="section ba-section">
    <div className="container">
      <div className="ba-header">
        <h2 className="section-title">
          Struggling with <span className="text-teal">Pet Care?</span>
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
          loading="lazy"
        />
      </div>
    </div>
  </section>
);

// ---------- Categories ----------
import firstImg from "../../assets/firstimg.webp";
import thirdImg from "../../assets/thirdimg.webp";
import {
  FaFileMedical,
  FaSyringe,
  FaPills,
  FaChartLine,
  FaShieldDog,
  FaClipboardCheck,
  FaUserDoctor,
  FaBell,
  FaNotesMedical,
  FaHeartPulse,
} from "react-icons/fa6";

const Categories = ({ openModal }) => (
  <section id="veterinarians" className="bg-white py-10 md:py-20">
    <div className="max-w-[1300px] mx-auto px-4 md:px-6">
      <div className="flex flex-col gap-3 md:gap-8">
        {/* ---------------- Header ---------------- */}
        <div className="cat-header">
          <span className="section-label">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Who Is It For
          </span>
          <h2 className="section-title">
            Made for Every <span className="text-green">Pet Journey</span>
          </h2>
          <p className="section-subtitle">
            Whether you're a dedicated pet parent or a practising veterinarian —
            PetOlife is built with you in mind.
          </p>
        </div>

        {/* ---------------- Parent Card ---------------- */}

        <div className="parent-card">
          <div className="parent-content">
            <span className="card-badgepet">Happy Pets. Healthy Future.</span>

            <h3 className="card-titlepet">
              Built for Responsible <br />
              Pet Parenting
            </h3>

            <ul className="card-list">
              <li>
                <span className="check-iconpet">
                  <FaFileMedical />
                </span>
                Store health records
              </li>

              <li>
                <span className="check-iconpet">
                  <FaSyringe />
                </span>
                Track vaccinations
              </li>

              <li>
                <span className="check-iconpet">
                  <FaPills />
                </span>
                Reminders for Medicine
              </li>

              <li>
                <span className="check-iconpet">
                  <FaChartLine />
                </span>
                Growth tracking
              </li>

              <li>
                <span className="check-iconpet">
                  <FaShieldDog />
                </span>
                Emergency access
              </li>
            </ul>

            {/* BACKEND LOGIC */}

            <button className="parent-btn" onClick={() => openModal("parent")}>
              Join as Pet Parent
            </button>
          </div>

          <div className="parent-image">
            <img src={firstImg} alt="Pet Parent" loading="lazy" />
          </div>
        </div>

        {/* ---------------- Vet Card ---------------- */}

        <div className="vet-card">
          <div className="vet-image">
            <img src={thirdImg} alt="Veterinarian" loading="lazy" />
          </div>

          <div className="vet-content">
            <span className="card-badgepet">Professional Veterinary Care</span>

            <h3 className="card-titlepet">
              Designed with <br />
              Veterinary Feedback
            </h3>

            <ul className="card-list">
              <li>
                <span className="check-iconpet">
                  <FaClipboardCheck />
                </span>
                Complete medical history
              </li>

              <li>
                <span className="check-iconpet">
                  <FaUserDoctor />
                </span>
                Faster consultations
              </li>

              <li>
                <span className="check-iconpet">
                  <FaBell />
                </span>
                Follow-up reminders
              </li>

              <li>
                <span className="check-iconpet">
                  <FaNotesMedical />
                </span>
                Treatment timeline
              </li>

              <li>
                <span className="check-iconpet">
                  <FaHeartPulse />
                </span>
                Better patient care
              </li>
            </ul>

            {/* BACKEND LOGIC */}

            <button className="parent-btn" onClick={() => openModal("vet")}>
              Join as a Veterinarian
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ---------- Trust ----------
import communityImg from "../../assets/community.webp";
import clinicImg from "../../assets/real-clinic.webp";
import feedbackImg from "../../assets/vet-feedback.webp";

const trustIndicators = [
  {
    icon: (
      <img
        src={feedbackImg}
        alt="Veterinary Feedback"
        className="trust-icon-image"
        loading="lazy"
      />
    ),
    label: "Veterinary Feedback",
    desc: "Shaped by insights from practising veterinarians.",
  },
  {
    icon: <img src={clinicImg} alt="clinic" className="trust-icon-image" loading="lazy" />,
    label: "Real Clinic Learnings",
    desc: "Built on real-world clinic workflows and challenges.",
  },
  {
    icon: (
      <img
        src={communityImg}
        alt="communityImg people"
        className="trust-icon-image community-icon"
        loading="lazy"
      />
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
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        <path d="m9 12 2 2 4-4" />
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
        <p>Building a Health Identity for Every Pet.</p>
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
import footerLogo from "../../assets/logo.webp";
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
              <img src={footerLogo} alt="PetOlife" className="footer-logo" loading="lazy" />
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
              <center>
                <p>
                  &copy; {new Date().getFullYear()} PetOlife. All rights
                  reserved.
                </p>
              </center>
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
