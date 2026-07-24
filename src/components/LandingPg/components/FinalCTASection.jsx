import React from "react";
import { motion } from "framer-motion";
import { Heart, ArrowRight, Stethoscope, ShieldCheck, Sparkles } from "lucide-react";

const FinalCTASection = ({ openModal }) => (
  <section className="final-cta-section">
    <div className="final-cta-container">
      <motion.div
        className="final-cta-card"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65 }}
        data-image-id="FINAL_CTA_PETS"
      >
        <div className="cta-bg-glow" />

        <div className="badge cta-badge">
          <Sparkles size={13} /> Give Your Pet Their Identity Today
        </div>

        <h2 className="cta-headline">
          Every pet deserves one place <br className="hidden-mobile" />
          that's <span style={{ color: "#84b662" }}>truly theirs.</span>
        </h2>

        <p className="cta-subtitle">
          Today it's just a health record. Tomorrow it becomes a lifetime of memories.
          Give your pet the identity they'll carry for life.
        </p>

        <div className="cta-button-group">
          <button className="btn-cta-primary" onClick={() => openModal("parent")}>
            <Heart size={18} /> Get My Pet Health ID <ArrowRight size={18} />
          </button>
          <button className="btn-cta-secondary" onClick={() => openModal("vet")}>
            <Stethoscope size={18} /> I'm a Veterinarian
          </button>
        </div>

        <p className="cta-trust-note">
          <ShieldCheck size={15} style={{ color: "#84b662" }} />
          Instant Access &bull; 100% Free Lifetime Pet Profile &bull; Secure Privacy
        </p>
      </motion.div>
    </div>
  </section>
);

export default FinalCTASection;
