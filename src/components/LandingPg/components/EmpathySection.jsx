import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Dog, Cat, AlertTriangle, Heart } from "lucide-react";
import empthyImg from "../../../assets/empthy.png";

const bubbles = [
  { id: 1, Icon: Dog,  tag: "Prescription",    quote: "My prescription is somewhere in WhatsApp...",             sub: "Lost medical files during emergencies" },
  { id: 2, Icon: Cat,  tag: "Prevention",       quote: "I think I missed my deworming...",                       sub: "Forgotten preventive care schedule" },
  { id: 3, Icon: Dog,  tag: "Medical History",  quote: "The new doctor doesn't know my story.",                  sub: "Fragmented history at new clinics" },
  { id: 4, Icon: Cat,  tag: "Care Sync",        quote: "My family doesn't know what happened at my last visit.", sub: "Unclear communication between co-parents" },
  { id: 5, Icon: Dog,  tag: "Lifelong Profile", quote: "I wish someone remembered everything about me.",         sub: "A single identity for health and memories" },
];

const EmpathySection = ({ openModal }) => (
  <section id="empathy" className="empathy-section">
    <div className="empathy-container">

      {/* Header */}
      <div className="section-header text-center">
        <motion.div
          className="section-eyebrow"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <MessageSquare size={15} /> If only I could tell you...
        </motion.div>

        <motion.h2
          className="section-title"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.08 }}
        >
          There are things your pet wishes you{" "}
          <em className="text-gradient-leaf">never had to forget.</em>
        </motion.h2>

        <motion.p
          className="section-description"
          style={{ margin: "0 auto", maxWidth: 580 }}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.14 }}
        >
          Paper records get lost, prescriptions drift into chats, vital details are forgotten.
          Pets trust us with everything—we owe them better.
        </motion.p>
      </div>

      {/* Grid */}
      <div className="empathy-grid">
        {/* Bubbles */}
        <div className="speech-bubbles-column">
          {bubbles.map(({ id, Icon, tag, quote, sub }, idx) => (
            <motion.div
              key={id}
              className="speech-bubble-card"
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.07 * idx }}
            >
              <div className="bubble-avatar">
                <Icon size={20} />
              </div>
              <div className="bubble-body">
                <span className="bubble-tag">{tag}</span>
                <p className="bubble-quote">"{quote}"</p>
                <span className="bubble-sub">{sub}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Illustration */}
        <motion.div
          className="empathy-media-column"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="empathy-image-card" data-image-id="DOG_OWNER_PAPERS">
            <img
              src={empthyImg}
              alt="Pet parent sorting through scattered health records"
              className="empathy-img-src"
            />
            <div className="empathy-card-glass-caption">
              <AlertTriangle size={16} style={{ color: "#f4a01c", flexShrink: 0 }} />
              Scattered receipts &amp; lost WhatsApp files make emergency visits stressful.
            </div>
          </div>
        </motion.div>
      </div>

      {/* Callout */}
      <motion.div
        className="empathy-callout-banner"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55 }}
      >
        <div className="callout-content">
          <Heart className="callout-icon" size={30} />
          <div className="callout-text-wrapper">
            <h3 className="callout-heading">
              Your pet can't remind you.{" "}
              <span style={{ color: "#84b662" }}>PetOlife can.</span>
            </h3>
            <p className="callout-subtext">
              Turn scattered medical receipts into one permanent digital timeline.
            </p>
          </div>
        </div>
        <button className="btn-callout-primary" onClick={() => openModal("parent")}>
          Create Free Pet Profile
        </button>
      </motion.div>

    </div>
  </section>
);

export default EmpathySection;
