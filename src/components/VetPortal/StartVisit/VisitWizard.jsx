import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StepVitals from "./StepVitals";
import StepDiagnosis from "./StepDiagnosis";
import StepPrescription from "./StepPrescription";
import StepSign from "./StepSign";
import "../VetPortal.css";

const STEPS = ["Vitals", "Diagnosis", "Prescription", "Sign & Save"];

export default function VisitWizard() {
  const { petId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const [vitals, setVitals] = useState({ weight: "", temp: "", heartRate: "", respRate: "", behavior: "normal" });
  const [diagnoses, setDiagnoses] = useState([{ category: "General", name: "", status: "suspected", notes: "" }]);
  const [medications, setMedications] = useState([]);
  const [injections, setInjections] = useState([]);
  const [shampoos, setShampoos] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [followUp, setFollowUp] = useState({ date: "", notes: "" });

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => {
    if (step === 0) navigate(-1);
    else setStep((s) => s - 1);
  };

  const wizardProps = {
    petId, vitals, setVitals,
    diagnoses, setDiagnoses,
    medications, setMedications,
    injections, setInjections,
    shampoos, setShampoos,
    vaccines, setVaccines,
    followUp, setFollowUp,
    next, back,
  };

  return (
    <div>
      {/* Back */}
      <button onClick={back} style={{ background: "none", border: "none", fontSize: 13, color: "var(--vet-text-muted)", cursor: "pointer", marginBottom: 12 }}>
        ← {step === 0 ? "Back to Patient" : STEPS[step - 1]}
      </button>

      {/* Step Indicator */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {STEPS.map((label, i) => (
          <div key={label} style={{ flex: 1 }}>
            <div style={{
              height: 4, borderRadius: 4,
              background: i <= step ? "var(--vet-green)" : "var(--vet-border)",
              transition: "background 0.3s",
            }} />
            <div style={{ fontSize: 9, color: i <= step ? "var(--vet-green-dark)" : "var(--vet-text-muteder)", fontWeight: 700, marginTop: 3, textAlign: "center" }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {step === 0 && <StepVitals {...wizardProps} />}
      {step === 1 && <StepDiagnosis {...wizardProps} />}
      {step === 2 && <StepPrescription {...wizardProps} />}
      {step === 3 && <StepSign {...wizardProps} onDone={() => navigate(`/vet/patients/${petId}`)} />}
    </div>
  );
}
