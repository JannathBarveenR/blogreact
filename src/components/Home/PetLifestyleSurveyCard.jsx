import React from 'react';
import './PetLifestyleSurveyCard.css';

const PetLifestyleSurveyCard = ({ onStart }) => {
  return (
    <div className="pet-lifestyle-survey-card">
      <div className="survey-content">
        <h3>Let's Get to Know Your Pet</h3>
        <p>Help us understand your pet better. It only takes a minute.</p>
        <button onClick={onStart} className="start-survey-btn">
          Let's Begin
        </button>
      </div>
      <div className="survey-illustration">
        {/* Placeholder for illustration if needed */}
      </div>
    </div>
  );
};

export default PetLifestyleSurveyCard;
