import React, { useState } from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import EmpathySection from "./components/EmpathySection";
import ProductSection from "./components/ProductSection";
import FounderBeliefSection from "./components/FounderBeliefSection";
import FinalCTASection from "./components/FinalCTASection";
import { LoginModal } from "../Login/Login";
import VetInterestModal from "./components/VetInterestModal";
import Footer from "./components/Footer";
import "./LandingPg.css";

const LandingPg = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("register");

  const openModal = (type = "register") => {
    setModalType(type);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  return (
    <div className="landing-page-root">
      {/* 1. Header Navigation */}
      <Navbar openModal={openModal} />

      <main className="landing-main-content">
        {/* 2. Hero Section (Section 1: Emotion + Curiosity + Promise) */}
        <HeroSection openModal={openModal} />

        {/* 3. Empathy & Problem Section (Section 2: If only I could tell you...) */}
        <EmpathySection openModal={openModal} />

        {/* 4. Solution & Product Section (Section 3: One Home For Your Pet's Entire Health Journey) */}
        <ProductSection openModal={openModal} />

        {/* 5. Founder's Belief & Mission */}
        <FounderBeliefSection />

        {/* 6. Final Call-to-Action Section */}
        <FinalCTASection openModal={openModal} />
      </main>

      {/* 7. Footer */}
      <Footer openModal={openModal} />

      {/* 8. Auth / Signup / Login Popup */}
      <LoginModal
        isOpen={modalOpen && modalType !== "vet"}
        initialScreen={modalType === "login" ? "login" : "register"}
        onClose={closeModal}
      />

      {/* 9. Veterinarian Interest Modal */}
      <VetInterestModal
        isOpen={modalOpen && modalType === "vet"}
        onClose={closeModal}
      />
    </div>
  );
};

export default LandingPg;
