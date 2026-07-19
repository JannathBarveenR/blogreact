import useAuth from "../../../hooks/useAuth";
import "./HeroSection.css";

export default function HeroSection({
  pets = [],
  checklistTasks = [],
  checkedTasks = {},
  onToggleTask,
}) {
  const { user } = useAuth();
  
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
  const hasChecklist = hasPets && checklistTasks.length > 0;
  const quote = "Until one has loved an animal, a part of one's soul remains unawakened.";

  let checklistPrompt = "Have you checked on your pet today?";
  if (hasPets) {
    if (pets.length === 1) {
      const petName = pets[0]?.pet_name || pets[0]?.name;
      if (petName) {
        checklistPrompt = `Have you checked on ${petName} today?`;
      } else {
        checklistPrompt = "Have you checked on your pet today?";
      }
    } else {
      checklistPrompt = "Have you checked on your pets today?";
    }
  }

  return (
    <section className={`dashboard-hero ${themeClass}`}>

      <h1 className="dashboard-hero-title">
        {greeting}, <span className="dashboard-hero-username">{userName}</span>!
      </h1>

      {!hasPets ? (
   
        <p className="dashboard-hero-subtitle quote-style">
          "{quote}"
        </p>
     
      ) : hasChecklist ? (
        <>
          <p className="dashboard-hero-subtitle">{checklistPrompt}</p>
          <div className="hero-checklist">
            {checklistTasks.map((task) => {
              const isChecked = !!checkedTasks[task.id];
              return (
                <div
                  key={task.id}
                  className={`hero-checklist-item ${isChecked ? "checked" : ""}`}
                  onClick={() => onToggleTask && onToggleTask(task.id)}
                >
                  <div className="hero-checklist-checkbox">
                    {isChecked && <span className="hero-check-mark">✓</span>}
                  </div>
                  <span className="hero-checklist-text">{formatTaskLabel(task.label, pets)}</span>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p className="dashboard-hero-subtitle">
          Your all-in-one personalized pet health dashboard is ready.
        </p>
      )}
    </section>
  );
}

function formatTaskLabel(label, pets = []) {
  const hasPets = pets && pets.length > 0;
  let subject = "your pet";
  let isPlural = false;
  
  if (hasPets) {
    if (pets.length === 1) {
      subject = pets[0].pet_name || pets[0].name || "your pet";
    } else {
      subject = "your pets";
      isPlural = true;
    }
  }
  
  const cleanLabel = label.toLowerCase().trim();
  let result = label; // fallback
  
  if (cleanLabel === "had breakfast") {
    result = `${subject} had breakfast`;
  } else if (cleanLabel === "had dinner") {
    result = `${subject} had dinner`;
  } else if (cleanLabel === "fresh water ready") {
    result = `Fresh water ready for ${subject}`;
  } else if (cleanLabel === "water is topped up") {
    result = `Water is topped up for ${subject}`;
  } else if (cleanLabel === "water ready for the night") {
    result = `Water ready for ${subject} for the night`;
  } else if (cleanLabel === "feeling active") {
    result = isPlural ? `Your pets are feeling active` : `${subject} is feeling active`;
  } else if (cleanLabel === "feeling okay before bed") {
    result = isPlural ? `Your pets are feeling okay before bed` : `${subject} is feeling okay before bed`;
  } else if (cleanLabel === "looking healthy") {
    result = isPlural ? `Your pets are looking healthy` : `${subject} is looking healthy`;
  } else if (cleanLabel === "eating well") {
    result = isPlural ? `Your pets are eating well` : `${subject} is eating well`;
  } else if (cleanLabel === "moving around normally") {
    result = isPlural ? `Your pets are moving around normally` : `${subject} is moving around normally`;
  } else if (cleanLabel === "comfortable and relaxed") {
    result = isPlural ? `Your pets are comfortable and relaxed` : `${subject} is comfortable and relaxed`;
  } else if (cleanLabel === "had some play or activity") {
    result = isPlural ? `Your pets had some play or activity` : `${subject} had some play or activity`;
  } else if (cleanLabel === "had enough activity") {
    result = isPlural ? `Your pets had enough activity` : `${subject} had enough activity`;
  } else if (cleanLabel === "clean and comfortable") {
    result = isPlural ? `Your pets are clean and comfortable` : `${subject} is clean and comfortable`;
  } else if (cleanLabel === "no unusual behavior") {
    result = `No unusual behavior from ${subject}`;
  } else if (cleanLabel === "sleeping spot is comfortable") {
    result = isPlural ? `Your pets' sleeping spot is comfortable` : `${subject}'s sleeping spot is comfortable`;
  } else if (cleanLabel === "medicines or daily care done") {
    result = isPlural ? `Your pets' medicines or daily care done` : `${subject}'s medicines or daily care done`;
  } else if (cleanLabel === "safe and settled in") {
    result = isPlural ? `Your pets are safe and settled in` : `${subject} is safe and settled in`;
  } else if (cleanLabel === "potty looks normal") {
    result = isPlural ? `Your pets' potty looks normal` : `${subject}'s potty looks normal`;
  }
  
  // Capitalize first letter
  return result.charAt(0).toUpperCase() + result.slice(1);
}

// eslint-disable-next-line no-unused-vars
function PawIcon({ className = "", filled = false }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill={filled ? "currentColor" : "none"} stroke={filled ? "none" : "currentColor"} strokeWidth={filled ? 0 : 3}>
      <ellipse cx="32" cy="42" rx="14" ry="11" />
      <ellipse cx="14" cy="26" rx="6" ry="8" />
      <ellipse cx="50" cy="26" rx="6" ry="8" />
      <ellipse cx="23" cy="14" rx="5.5" ry="7" />
      <ellipse cx="41" cy="14" rx="5.5" ry="7" />
    </svg>
  );
}