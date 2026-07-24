import React from "react";
import { motion } from "framer-motion";
import { Compass, Quote, ShieldCheck, Heart, Sparkles } from "lucide-react";

const FounderBeliefSection = () => (
  <section id="vision" className="founder-section">
    <div className="founder-container">
      <motion.div
        className="founder-quote-banner-full"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65 }}
      >
        <div className="quote-background-watermark">
          <Quote size={140} />
        </div>

        <div className="badge founder-badge">
          <Compass size={15} style={{ color: "#004b49" }} /> Our Core Belief
        </div>

        <h2 className="founder-headline">Why We Started PetOlife</h2>

        <p className="founder-quote-large-text">
          "Every pet deserves a lifelong health identity—not because technology is exciting,
          but because no pet should receive fragmented care simply because their medical history
          was forgotten, lost, or inaccessible."
        </p>

        <p className="founder-quote-large-subtext">
          That's why we're building a future where every pet carries one trusted
          health identity for life.
        </p>

        <div className="brand-slogan-pills">
          <span className="slogan-pill"><Heart size={16} style={{ color: "#004b49" }} /> Every Pet</span>
          <span className="slogan-pill"><ShieldCheck size={16} style={{ color: "#84b662" }} /> One Identity</span>
          <span className="slogan-pill"><Sparkles size={16} style={{ color: "#a16207" }} /> Better Care</span>
        </div>
      </motion.div>
    </div>
  </section>
);

export default FounderBeliefSection;
