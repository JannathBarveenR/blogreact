import React from "react";
import { motion } from "framer-motion";
import {
  Brain, FileText, Bell, Stethoscope,
  Sparkles, CheckCircle2, Shield, QrCode
} from "lucide-react";
import timelineImg  from "../../../assets/health-timeline.webp";
import recordsImg   from "../../../assets/health-records.webp";
import petProfileImg from "../../../assets/pet-profile.webp";

const features = [
  {
    id: "timeline", Icon: Brain,
    badge: "Smart Automation",
    title: "AI-Powered Health Timeline",
    headline: "Every milestone, symptom & visit organized automatically.",
    description: "PetOlife's AI extracts lab values, vaccine dates, and prescriptions from uploaded PDFs or photos into a clean visual timeline.",
    points: ["Automatic PDF & image scan extraction", "Chronological health event tracking"],
    image: timelineImg, imageId: "APP_TIMELINE_MOCKUP",
  },
  {
    id: "records", Icon: FileText,
    badge: "Digital Vault",
    title: "Lifetime Medical Records",
    headline: "Never lose a prescription or blood test report again.",
    description: "All historical medical records stored securely in the cloud. Access prescriptions instantly during emergency visits or checkups.",
    points: ["Full resolution document storage", "Instant search by medication or clinic"],
    image: recordsImg, imageId: "APP_RECORDS_MOCKUP",
  },
  {
    id: "reminders", Icon: Bell,
    badge: "Zero Missed Care",
    title: "Automated Care Alerts",
    headline: "Smart alerts for vaccines, deworming & medication.",
    description: "Timely notification alerts for recurring booster shots, tick treatments, and daily medications so your pet stays 100% protected.",
    points: ["Vaccination booster countdowns", "Deworming & flea control schedules"],
    image: petProfileImg, imageId: "APP_REMINDERS_MOCKUP",
  },
  {
    id: "vet", Icon: Stethoscope,
    badge: "One-Tap QR Share",
    title: "Instant Clinic Care Pass",
    headline: "Share full medical history with any clinic in seconds.",
    description: "Show a secure QR code at the clinic desk—eliminating repetitive paperwork and misdiagnoses at every new visit.",
    points: ["Instant QR code scanning at clinic", "Exportable PDF summary for vets"],
    image: timelineImg, imageId: "APP_VET_MOCKUP",
  },
];

const ProductSection = ({ openModal }) => (
  <section id="features" className="product-section">
    <div className="product-container">

      {/* Header */}
      <div className="section-header text-center">
        <motion.div
          className="section-eyebrow"
          style={{ justifyContent: "center" }}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Sparkles size={15} /> The PetOlife Platform
        </motion.div>

        <motion.h2
          className="section-title"
          style={{ textAlign: "center", margin: "8px auto 10px" }}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.08 }}
        >
          One Home For Your Pet's{" "}
          <em className="text-gradient-leaf">Entire Health Journey</em>
        </motion.h2>

        <motion.p
          className="section-description"
          style={{ textAlign: "center", margin: "0 auto", maxWidth: 580 }}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.14 }}
        >
          Built to bring order, clarity, and peace of mind to pet parents and veterinarians.
        </motion.p>
      </div>

      {/* 2x2 Feature Cards Grid */}
      <div className="product-2x2-grid">
        {features.map((item, idx) => {
          const { id, Icon, badge, title, headline, description, points, image, imageId } = item;
          return (
            <motion.div
              key={id}
              className="feature-card-2x2"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.08 * idx }}
            >
              {/* Content (Left) */}
              <div className="feature-card-content">
                <div className="feature-card-badge">
                  <Icon size={13} /> {badge}
                </div>
                <h3 className="feature-card-title">{title}</h3>
                <p className="feature-card-desc">{description}</p>

                <ul className="feature-card-points">
                  {points.map((pt, i) => (
                    <li key={i} className="feature-card-point-item">
                      <CheckCircle2 size={15} style={{ color: "#84b662", flexShrink: 0 }} />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Image (Right) */}
              <div className="feature-card-media">
                <div className="feature-card-img-frame" data-image-id={imageId}>
                  <img src={image} alt={title} className="feature-card-img" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

    </div>
  </section>
);

export default ProductSection;
