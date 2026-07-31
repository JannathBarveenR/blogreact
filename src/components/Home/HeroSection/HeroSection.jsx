import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  ChevronRight,
  Clock,
  FileText,
  PawPrint,
  Sparkles,
} from "lucide-react";
import useAuth from "../../../hooks/useAuth";
import welcomeImg from "../../../assets/Welcomeimg.jpeg";
import "./HeroSection.css";

export default function HeroSection({
  pets = [],
  selectedPet = null,
  surveyCompleted = false,
  checkingSurvey = false,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const carouselRef = useRef(null);
  const [activeDot, setActiveDot] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const userName =
    user?.user_metadata?.full_name || user?.name || "Sania Mehek";

  const hours = new Date().getHours();
  let greeting;

  if (hours >= 5 && hours < 12) {
    greeting = "Happy morning";
  } else if (hours >= 12 && hours < 17) {
    greeting = "Happy afternoon";
  } else if (hours >= 17 && hours < 21) {
    greeting = "Happy evening";
  } else {
    greeting = "Happy night";
  }

  const targetPet = selectedPet || (pets && pets.length > 0 ? pets[0] : null);

  const handleTakeSurvey = () => {
    if (targetPet?.id) {
      navigate(`/survey/${targetPet.id}`, { state: { pet: targetPet } });
    } else if (pets && pets.length > 0) {
      navigate(`/survey/${pets[0].id}`, { state: { pet: pets[0] } });
    } else {
      navigate("/survey/new");
    }
  };

  // Automatic slide movement every 3 seconds
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setActiveDot((prevDot) => {
        const nextDot = prevDot === 0 ? 1 : 0;
        if (carouselRef.current) {
          carouselRef.current.scrollTo({
            left: nextDot * carouselRef.current.clientWidth,
            behavior: "smooth",
          });
        }
        return nextDot;
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [isPaused]);

  const handleScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, clientWidth } = carouselRef.current;
      if (clientWidth > 0) {
        const slideIndex = Math.round(scrollLeft / clientWidth);
        setActiveDot(Math.min(1, Math.max(0, slideIndex)));
      }
    }
  };

  const goToSlide = (slideIndex) => {
    if (carouselRef.current) {
      carouselRef.current.scrollTo({
        left: slideIndex * carouselRef.current.clientWidth,
        behavior: "smooth",
      });
      setActiveDot(slideIndex);
    }
  };

  return (
    <div className="welcome-card">
      {/* Top Banner Section */}
      <div className="welcome-hero-banner">
        <div className="welcome-text-content">
          <h2 className="welcome-greeting">{greeting},</h2>
          <h2 className="welcome-username">{userName}!</h2>
          <div className="welcome-green-divider" />

          <p className="welcome-subtitle">
            Help us understand your pet better. It only takes a minute.
          </p>

          <button
            className="welcome-take-survey-btn"
            onClick={handleTakeSurvey}
            type="button"
          >
            <ClipboardList className="btn-survey-icon" size={17} strokeWidth={2.2} />
            <span>Take Survey</span>
            <ChevronRight className="btn-chevron-icon" size={17} strokeWidth={2.5} />
          </button>
        </div>

        <div className="welcome-image-wrapper">
          <img
            src={welcomeImg}
            alt="Pet Healthcare"
            className="welcome-bg-image"
          />
        </div>
      </div>

      {/* Bottom Features Carousel Section */}
      <div
        className="welcome-features-wrapper"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className="welcome-features-track"
          ref={carouselRef}
          onScroll={handleScroll}
        >
          {/* Slide 1: 2 Active Features */}
          <div className="feature-slide">
            <div className="feature-item">
              <div className="feature-icon-badge badge-clock">
                <Clock size={19} strokeWidth={2.2} />
              </div>
              <div className="feature-text">
                <h4 className="feature-title">Timely Reminders</h4>
                <p className="feature-desc">Never miss an important date</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-badge badge-records">
                <FileText size={19} strokeWidth={2.2} />
              </div>
              <div className="feature-text">
                <h4 className="feature-title">All-in-One Records</h4>
                <p className="feature-desc">Store everything in one secure place</p>
              </div>
            </div>
          </div>

          {/* Slide 2: 2 Features with Coming Soon Badges */}
          <div className="feature-slide">
            <div className="feature-item">
              <div className="feature-icon-badge badge-insights">
                <PawPrint size={19} strokeWidth={2.2} />
                <span className="coming-soon-chip">Coming Soon</span>
              </div>
              <div className="feature-text">
                <h4 className="feature-title">Family Access</h4>
                <p className="feature-desc">Shared pet care together</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-badge badge-ai">
                <Sparkles size={19} strokeWidth={2.2} />
                <span className="coming-soon-chip">Coming Soon</span>
              </div>
              <div className="feature-text">
                <h4 className="feature-title">AI Timeline</h4>
                <p className="feature-desc">Personalised health insights for your pet</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="carousel-dots">
        <span
          className={`dot ${activeDot === 0 ? "active" : ""}`}
          onClick={() => goToSlide(0)}
          role="button"
          tabIndex={0}
          aria-label="Slide 1"
        />
        <span
          className={`dot ${activeDot === 1 ? "active" : ""}`}
          onClick={() => goToSlide(1)}
          role="button"
          tabIndex={0}
          aria-label="Slide 2"
        />
      </div>
    </div>
  );
}
