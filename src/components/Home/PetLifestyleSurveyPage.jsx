import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { FiX, FiCheck } from 'react-icons/fi';
import fetchWithAuth from '../../utils/fetchWithAuth';
import polLogo from "../../assets/logo.webp";
import ppacBannerImg from "../../assets/ppac.png";
import './PetDashboard.css'; // Import for education banner styles
import './PetLifestyleSurveyPage.css';

const PetLifestyleSurveyPage = () => {
  const { petId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [pet, setPet] = useState(location.state?.pet || null);

  useEffect(() => {
    // If we didn't get pet from router state, we should ideally fetch it.
    // For MVP, if there's no pet, we just use a generic name.
    if (!pet && petId) {
       // Placeholder in case we hit it directly
       setPet({ id: petId, pet_name: 'your pet', pet_type: 'Unknown' });
    }
  }, [pet, petId]);
  
  const petName = pet?.pet_name || pet?.name || 'your pet';
  const isDog = (pet?.pet_type || pet?.type || '').toLowerCase() === 'dog';

  // Form State
  const [answers, setAnswers] = useState({
    meals_per_day: '',
    walks_per_day: '',
    water_refresh_freq: '',
    quality_time_freq: '',
    regular_play_exercise: '',
    undergoing_training: '',
    grooming_activities: [],
    long_term_medication: '',
    regular_activities: [],
    custom_activity: ''
  });

  const handleSelect = (field, value) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
  };

  const handleMultiSelect = (field, value) => {
    setAnswers(prev => {
      const current = prev[field];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(item => item !== value) };
      }
      return { ...prev, [field]: [...current, value] };
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const payloadAnswers = { ...answers };
      if (payloadAnswers.regular_activities.includes('Others') && payloadAnswers.custom_activity) {
        payloadAnswers.regular_activities = payloadAnswers.regular_activities.filter(a => a !== 'Others');
        payloadAnswers.regular_activities.push(payloadAnswers.custom_activity);
      }
      delete payloadAnswers.custom_activity; 

      const res = await fetchWithAuth(`/api/pet-profile/${petId}/lifestyle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers: payloadAnswers })
      });

      if (!res.ok) {
        throw new Error("Failed to save survey");
      }

      setShowCompletion(true);
      // Removed auto-redirect
      
    } catch (err) {
      console.error(err);
      alert("Something went wrong saving the survey.");
    } finally {
      setLoading(false);
    }
  };

  if (showCompletion) {
    return (
      <div className="survey-page-container">
        <div className="survey-page completion-modal">
          <div className="completion-icon">🎉</div>
          <h2>Congratulations!</h2>
          <p>{petName} has earned the</p>
          <div className="badge-box">
            <span className="badge-icon">🏅</span>
            <span className="badge-text">Well Known Star</span>
          </div>
          
          <div className="completion-why-section">
            <h4 className="why-title">Why?</h4>
            <p className="completion-subtext">
              PetOlife now understands {petName}'s daily lifestyle, making future care more personalized.
            </p>
          </div>

          <button onClick={() => navigate('/home')} className="survey-primary-btn">
            Back to Dashboard Now
          </button>
          
          {/* Education Banner on Completion Screen */}
          <div className="education-section survey-education-banner">
            <h3 className="education-title">Be the Best Pet Parent</h3>
            <div 
              className="education-card" 
              style={{ backgroundImage: `url(${ppacBannerImg})` }}
              onClick={() => window.open(`${window.location.origin}/pet-parent-academy`, "_blank")}
            >
              <div className="education-card-content">
                <button 
                  className="education-learn-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`${window.location.origin}/pet-parent-academy`, "_blank");
                  }}
                >
                  Learn now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="survey-page-container">
      <div className="survey-page">
        <div className="survey-header">
          <h2>Getting to know {petName}</h2>
          <button className="close-btn" onClick={() => navigate('/home')}><FiX /></button>
        </div>
        
        <div className="survey-body">
          {/* Q1 */}
          <div className="survey-question">
            <label>How many meals does {petName} enjoy each day?</label>
            <div className="options-grid">
              {['Once', 'Twice', 'Three times'].map(opt => (
                <button key={opt} className={`option-btn ${answers.meals_per_day === opt ? 'selected' : ''}`} onClick={() => handleSelect('meals_per_day', opt)}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Q2: Dogs Only */}
          {isDog && (
            <div className="survey-question">
              <label>How many walks does {petName} usually go on?</label>
              <div className="options-grid">
                {['No Walk', 'Once', 'Twice', 'Three times'].map(opt => (
                  <button key={opt} className={`option-btn ${answers.walks_per_day === opt ? 'selected' : ''}`} onClick={() => handleSelect('walks_per_day', opt)}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Q3 */}
          <div className="survey-question">
            <label>How often do you refresh {petName}'s water bowl?</label>
            <div className="options-grid">
              {['Once', 'Twice', 'Three times', 'Whenever Needed'].map(opt => (
                <button key={opt} className={`option-btn ${answers.water_refresh_freq === opt ? 'selected' : ''}`} onClick={() => handleSelect('water_refresh_freq', opt)}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Q4 */}
          <div className="survey-question">
            <label>How often do you spend quality time together?</label>
            <p className="question-hint">Playing, cuddling, relaxing together.</p>
            <div className="options-grid">
              {['Once', 'Twice', 'Three times', 'Throughout the day'].map(opt => (
                <button key={opt} className={`option-btn ${answers.quality_time_freq === opt ? 'selected' : ''}`} onClick={() => handleSelect('quality_time_freq', opt)}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Q5 */}
          <div className="survey-question">
            <label>Does {petName} have regular playtime or exercise?</label>
            <div className="options-grid">
              {['Yes', 'No'].map(opt => (
                <button key={opt} className={`option-btn ${answers.regular_play_exercise === opt ? 'selected' : ''}`} onClick={() => handleSelect('regular_play_exercise', opt)}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Q6 */}
          <div className="survey-question">
            <label>Is {petName} currently learning any new skills?</label>
            <div className="options-grid">
              {['Yes', 'No'].map(opt => (
                <button key={opt} className={`option-btn ${answers.undergoing_training === opt ? 'selected' : ''}`} onClick={() => handleSelect('undergoing_training', opt)}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Q7: Multi-Select */}
          <div className="survey-question">
            <label>Which grooming activities are part of {petName}'s routine?</label>
            <p className="question-hint">(Select all that apply)</p>
            <div className="options-grid multi">
              {['Bath', 'Coat Brushing', 'Teeth Brushing', 'Ear Cleaning', 'Nail Trimming'].map(opt => {
                const isSelected = answers.grooming_activities.includes(opt);
                return (
                  <button key={opt} className={`option-btn multi-btn ${isSelected ? 'selected' : ''}`} onClick={() => handleMultiSelect('grooming_activities', opt)}>
                    {isSelected && <FiCheck className="check-icon" />} {opt}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Q8 */}
          <div className="survey-question">
            <label>Is {petName} taking any long-term medication?</label>
            <div className="options-grid">
              {['Yes', 'No'].map(opt => (
                <button key={opt} className={`option-btn ${answers.long_term_medication === opt ? 'selected' : ''}`} onClick={() => handleSelect('long_term_medication', opt)}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Q9 */}
          <div className="survey-question">
            <label>Anything special you'd like us to know about {petName}'s routine?</label>
            <p className="question-hint">(Select all that apply)</p>
            <div className="options-grid multi">
              {['Swimming', 'Physiotherapy', 'Special Diet', 'Supplements', 'Others'].map(opt => {
                const isSelected = answers.regular_activities.includes(opt);
                return (
                  <button key={opt} className={`option-btn multi-btn ${isSelected ? 'selected' : ''}`} onClick={() => handleMultiSelect('regular_activities', opt)}>
                    {isSelected && <FiCheck className="check-icon" />} {opt}
                  </button>
                )
              })}
            </div>
            {answers.regular_activities.includes('Others') && (
              <input 
                type="text" 
                className="custom-activity-input" 
                placeholder="Please specify..."
                value={answers.custom_activity}
                onChange={(e) => handleSelect('custom_activity', e.target.value)}
              />
            )}
          </div>

        </div>

        <div className="survey-footer">
          <button className="survey-primary-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Finish & Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PetLifestyleSurveyPage;
