import { useNavigate } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import "./HeroSection.css";

export default function HeroSection({
  pets = [],
  surveyCompleted = true,
  checkingSurvey = false,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const userName = user?.user_metadata?.full_name || user?.name || "Pet Parent";
  
  const hours = new Date().getHours();
  let greeting;
  let themeClass;
  
  if (hours >= 5 && hours < 12) {
    greeting = "Good morning";
    themeClass = "morning-theme";
  } else if (hours >= 12 && hours < 17) {
    greeting = "Happy afternoon";
    themeClass = "afternoon-theme";
  } else if (hours >= 17 && hours < 21) {
    greeting = "Good evening";
    themeClass = "evening-theme";
  } else {
    greeting = "Good night";
    themeClass = "night-theme";
  }

  const hasPets = pets && pets.length > 0;
  const quote = "Until one has loved an animal, a part of one's soul remains unawakened.";

  return (
    <section className={`dashboard-hero ${themeClass}`}>

      <h1 className="dashboard-hero-title">
        {greeting}, <span className="dashboard-hero-username">{userName}</span>!
      </h1>

      {!hasPets ? (
        <p className="dashboard-hero-subtitle quote-style">
          "{quote}"
        </p>
      ) : !surveyCompleted && !checkingSurvey ? (
        <div className="hero-survey-cta">
          <p className="dashboard-hero-subtitle">
            Help us understand your pet better. It only takes a minute.
          </p>
          <button className="hero-survey-btn" onClick={() => navigate(`/survey/${pets[0].id}`, { state: { pet: pets[0] } })}>Let's Begin</button>
        </div>
      ) : (
        <p className="dashboard-hero-subtitle">
          Your all-in-one personalized pet health dashboard is ready.
        </p>
      )}
    </section>
  );
}
