import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import FormSection from "./shared/FormSection";
import DocumentUpload from "./shared/DocumentUpload";
import SaveConfirmation from "./shared/SaveConfirmation";
import CustomSelect from "./shared/CustomSelect";
import CustomDatePicker from "./shared/CustomDatePicker";
import CustomStepper from "./shared/CustomStepper";
import CustomTimePicker from "./shared/CustomTimePicker";
import { useQueryClient } from "@tanstack/react-query";
import { timelineKeys } from "../../../hooks/useTimelineQueries";
import { createMedicalEvent, updateMedicalEvent, searchMedicines, uploadEventRecord, createReminder } from "../../../api/timelineApi";

const MEDICINE_TYPES = [
  { value: "tablet", label: "Tablet / Pill" },
  { value: "syrup", label: "Syrup / Liquid" },
  { value: "eye_drop", label: "Drops (Eye / Ear)" },
  { value: "injection", label: "Injection" },
  { value: "ointment", label: "Ointment / Topical" },
];

const TYPE_TO_ALLOWED_UNITS = {
  tablet: [
    { value: "tablet", label: "tablet(s)" },
    { value: "mg", label: "mg" },
  ],
  syrup: [
    { value: "ml", label: "ml" },
    { value: "tsp", label: "tsp (5ml)" },
  ],
  eye_drop: [
    { value: "drops", label: "drop(s)" },
  ],
  injection: [
    { value: "ml", label: "ml" },
    { value: "mg", label: "mg" },
  ],
  ointment: [
    { value: "application", label: "application(s)" },
  ],
};

const DOSAGE_QTY_PRESETS = {
  tablet: [
    { value: "0.5", label: "0.5 (Half tablet)" },
    { value: "1", label: "1 tablet" },
    { value: "1.5", label: "1.5 tablets" },
    { value: "2", label: "2 tablets" },
    { value: "3", label: "3 tablets" },
  ],
  syrup: [
    { value: "1", label: "1 ml" },
    { value: "2.5", label: "2.5 ml" },
    { value: "5", label: "5 ml (1 tsp)" },
    { value: "10", label: "10 ml (2 tsp)" },
    { value: "15", label: "15 ml" },
    { value: "50", label: "50 ml" },
  ],
  eye_drop: [
    { value: "1", label: "1 drop" },
    { value: "1.5", label: "1.5 drops" },
    { value: "2", label: "2 drops" },
    { value: "3", label: "3 drops" },
    { value: "4", label: "4 drops" },
    { value: "5", label: "5 drops" },
  ],
  injection: [
    { value: "0.5", label: "0.5 ml" },
    { value: "1", label: "1 ml" },
    { value: "2", label: "2 ml" },
    { value: "5", label: "5 ml" },
  ],
  ointment: [
    { value: "1", label: "1 (Thin Layer)" },
    { value: "2", label: "2 (Moderate Coat)" },
    { value: "3", label: "3 (Thick / Heavy Layer)" },
  ],
};

const UNIT_OPTIONS = [
  { value: "tablet", label: "tablet(s)" },
  { value: "ml", label: "ml" },
  { value: "drops", label: "drop(s)" },
  { value: "mg", label: "mg" },
  { value: "tsp", label: "tsp" },
  { value: "application", label: "application(s)" },
];

const FREQUENCY_OPTIONS = [
  { value: "Daily (Once)", label: "Once Daily" },
  { value: "Twice Daily", label: "Twice Daily" },
  { value: "Thrice Daily", label: "Thrice Daily" },
  { value: "Custom Hours", label: "Custom Hours" },
];

const FOOD_RELATION_OPTIONS = [
  { value: "after_food", label: "After Food" },
  { value: "before_food", label: "Before Food" },
  { value: "with_food", label: "With Food" },
];

const REMINDER_EVENT_TYPES = [
  { value: "vet_visit", label: "Vet Visit (Follow-up Checkup)" },
  { value: "another_medication", label: "Another Set of Medication" },
  { value: "vaccination", label: "Vaccination" },
  { value: "other", label: "Other Reminder" },
];

function get1HourPriorTime(timeStr) {
  if (!timeStr) return null;
  const [hhStr, mmStr] = timeStr.split(":");
  let hh = parseInt(hhStr || "0", 10);
  let mm = parseInt(mmStr || "0", 10);
  let notifH = (hh - 1 + 24) % 24;
  const period = notifH >= 12 ? "PM" : "AM";
  let h12 = notifH % 12;
  if (h12 === 0) h12 = 12;
  return `${String(h12).padStart(2, "0")}:${String(mm).padStart(2, "0")} ${period}`;
}

export default function MedicationForm({ petId, petName, onClose, onSaved, editData }) {
  const queryClient = useQueryClient();
  // Prescription documents (AT THE TOP)
  const [files, setFiles] = useState([]);

  // Added list of medicines under this single medication prescription
  const [addedMedicines, setAddedMedicines] = useState([]);
  const [ackMessage, setAckMessage] = useState("");

  // Inputs for adding a medicine item
  const [medName, setMedName] = useState("");
  const [medType, setMedType] = useState("tablet");
  const [doseQty, setDoseQty] = useState("1");
  const [doseUnit, setDoseUnit] = useState("tablet");
  const [durationDays, setDurationDays] = useState(5);
  const [frequency, setFrequency] = useState("Daily (Once)");
  const [foodRelation, setFoodRelation] = useState("after_food");
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Optional Dose Times (up to 3 boxes based on frequency)
  const [time1, setTime1] = useState("");
  const [time2, setTime2] = useState("");
  const [time3, setTime3] = useState("");
  const [customHours, setCustomHours] = useState("8");

  // Search suggestions
  const [medsList, setMedsList] = useState([]);
  const [showMeds, setShowMeds] = useState(false);

  // Global schedule dates (At the back)
  const [startDate, setStartDate] = useState(new Date().toLocaleDateString("en-CA"));

  // Follow-up Reminder configuration (At the back)
  const [followUpEnabled, setFollowUpEnabled] = useState(false);
  const [followUpType, setFollowUpType] = useState("vet_visit");
  const [followUpDate, setFollowUpDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split("T")[0];
  });
  const [followUpNotes, setFollowUpNotes] = useState("");

  // Submit & Save state
  const [submitting, setSubmitting] = useState(false);
  const [savedData, setSavedData] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  // Pre-fill fields if editing an existing record
  useEffect(() => {
    if (!editData) return;
    const catEntry = (editData.category_entries || [])[0] || {};
    const cFields = catEntry.category_fields || {};
    const mList = cFields.medicines_list || [];

    if (editData.event_date || catEntry.date_logged) {
      setStartDate(editData.event_date || catEntry.date_logged);
    }
    if (mList.length > 0) {
      const mapped = mList.map((m, i) => ({
        id: m.id || String(i),
        name: m.name || "",
        type: m.type || "tablet",
        doseQty: m.dose_qty || "1",
        doseUnit: m.dose_unit || "tablet",
        durationDays: m.duration_days || 5,
        frequency: m.frequency || "Daily (Once)",
        foodRelation: m.food_relation || "after_food",
        doseTimes: m.dose_times || [],
        specialInstructions: m.special_instructions || "",
      }));
      setAddedMedicines(mapped);
    }
    const hasFollowUp = Boolean(editData.follow_up_date || catEntry.next_due_date);
    setFollowUpEnabled(hasFollowUp);
    if (hasFollowUp) {
      setFollowUpDate(editData.follow_up_date || catEntry.next_due_date);
    }
    if (editData.follow_up_notes) {
      setFollowUpNotes(editData.follow_up_notes);
    }
  }, [editData]);

  // Auto-switch default dose unit and default preset when medicine type changes
  const handleMedTypeChange = (newType) => {
    setMedType(newType);
    const allowedUnits = TYPE_TO_ALLOWED_UNITS[newType];
    if (allowedUnits && allowedUnits.length > 0) {
      setDoseUnit(allowedUnits[0].value);
    }
    const presets = DOSAGE_QTY_PRESETS[newType];
    if (presets && presets.length > 0) {
      setDoseQty(presets[0].value);
    }
  };

  // Update follow-up default date when start date or duration changes
  useEffect(() => {
    if (startDate && durationDays) {
      const start = new Date(startDate + "T00:00:00");
      const end = new Date(start);
      end.setDate(end.getDate() + Number(durationDays));
      setFollowUpDate(end.toISOString().split("T")[0]);
    }
  }, [startDate, durationDays]);

  const handleMedChange = async (val) => {
    setMedName(val);
    if (val.trim().length > 1) {
      try {
        const res = await searchMedicines(val);
        setMedsList(res.medicines || []);
        setShowMeds(true);
      } catch (e) {
        console.error(e);
      }
    } else {
      setShowMeds(false);
    }
  };

  // Handler to add current medicine input into addedMedicines list
  const handleAddMedicineToList = () => {
    if (!medName.trim()) return;

    const finalFreq = frequency === "Custom Hours" ? `Every ${customHours} Hours` : frequency;
    const doseTimes = [time1, time2, time3].filter(Boolean);

    const newItem = {
      id: Date.now().toString(),
      name: medName.trim(),
      type: medType,
      doseQty: doseQty || "1",
      doseUnit: doseUnit,
      durationDays: Number(durationDays) || 5,
      frequency: finalFreq,
      foodRelation: foodRelation,
      doseTimes: doseTimes,
      specialInstructions: specialInstructions.trim(),
    };

    setAddedMedicines((prev) => [...prev, newItem]);
    setIsDirty(true);
    
    // Clear item form inputs
    setMedName("");
    setSpecialInstructions("");
    setTime1("");
    setTime2("");
    setTime3("");
    setShowMeds(false);

    // Show temporary clear acknowledgment toast
    setAckMessage(`✓ Added "${newItem.name}" (${newItem.doseQty} ${newItem.doseUnit}) to prescription list!`);
    setTimeout(() => setAckMessage(""), 3500);
  };

  const handleRemoveMedicine = (idToRemove) => {
    setAddedMedicines((prev) => prev.filter((item) => item.id !== idToRemove));
    setIsDirty(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // If user filled in a medicine name but didn't click "+ Add Medicine", auto-add it
    let finalMedicines = [...addedMedicines];
    if (medName.trim()) {
      const doseTimes = [time1, time2, time3].filter(Boolean);
      const finalFreq = frequency === "Custom Hours" ? `Every ${customHours} Hours` : frequency;
      finalMedicines.push({
        id: Date.now().toString(),
        name: medName.trim(),
        type: medType,
        doseQty: doseQty || "1",
        doseUnit: doseUnit,
        durationDays: Number(durationDays) || 5,
        frequency: finalFreq,
        foodRelation: foodRelation,
        doseTimes: doseTimes,
        specialInstructions: specialInstructions.trim(),
      });
    }

    if (finalMedicines.length === 0) {
      alert("Please add at least one medicine (tablet, syrup, or drops) to the medication list.");
      return;
    }

    setSubmitting(true);
    try {
      // ── Build JSON Array of all medicines for backend category_fields column ──
      const medicinesJsonList = finalMedicines.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        dose_qty: item.doseQty,
        dose_unit: item.doseUnit,
        dose_combined: `${item.doseQty} ${item.doseUnit}`,
        frequency: item.frequency,
        food_relation: item.foodRelation,
        dose_times: item.doseTimes || [],
        duration_days: Number(item.durationDays),
        special_instructions: item.specialInstructions || "",
      }));

      const formattedStartDate = new Date(startDate + "T00:00:00").toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      // Main summary category entry holding the full medicines_list JSON array
      const mainCategoryEntry = {
        category: "medication",
        item_name: formattedStartDate || startDate,
        date_logged: startDate,
        next_due_date: followUpEnabled && followUpDate ? followUpDate : null,
        notes: finalMedicines.map((m) => `${m.name}: ${m.doseQty} ${m.doseUnit} (${m.frequency})`).join("\n"),
        category_fields: {
          medicine_type: finalMedicines[0].type,
          dose: `${finalMedicines[0].doseQty} ${finalMedicines[0].doseUnit}`,
          frequency: [finalMedicines[0].frequency],
          food_relation: finalMedicines[0].foodRelation,
          duration: Number(finalMedicines[0].durationDays),
          duration_unit: "days",
          medicines_list: medicinesJsonList,
          total_items: finalMedicines.length,
        },
      };

      const payload = {
        event_date: startDate,
        category_entries: [mainCategoryEntry],
      };

      if (editData) {
        const targetEventId = editData.id || editData.event_id || editData.medical_event_id;
        await updateMedicalEvent(petId, targetEventId, payload);
        queryClient.invalidateQueries({ queryKey: timelineKeys.all(petId) });
        if (onSaved) onSaved("✓ Medication record updated successfully!");
        else if (onClose) onClose();
        return;
      }

      const res = await createMedicalEvent(petId, payload);
      const createdEvent = res.event || res;

      // Create Daily Dose Schedule Reminders for each prescribed medicine across its duration
      for (const med of finalMedicines) {
        const dur = Number(med.durationDays) || 5;
        const [year, month, day] = startDate.split("-").map(Number);
        const baseDate = new Date(year, month - 1, day);

        const foodLabelMap = {
          before_food: "Before Food",
          after_food: "After Food",
          with_food: "With Food",
        };
        const foodLabel = foodLabelMap[med.foodRelation] || "After Food";

        const customTimes = med.doseTimes || [];

        for (let i = 0; i < dur; i++) {
          const d = new Date(baseDate);
          d.setDate(d.getDate() + i);
          const dueDateStr = d.toLocaleDateString("en-CA");

          if (customTimes.length > 0) {
            // User provided specific time(s)
            for (const t of customTimes) {
              const notifTime = get1HourPriorTime(t);
              const hh = parseInt(t.split(":")[0], 10);
              let slot = "morning";
              if (hh >= 12 && hh < 17) slot = "afternoon";
              if (hh >= 17) slot = "night";

              const remPayload = {
                title: `${med.name} (${med.doseQty} ${med.doseUnit})`,
                type: "medication",
                time_slot: slot,
                due_date: dueDateStr,
                due_time: `${t}:00`,
                notes: `💊 Take: ${foodLabel}${notifTime ? ` | 🔔 Alert: 1 hr before (${notifTime})` : ""}`,
                linked_event_id: createdEvent?.id || null,
              };

              try {
                await createReminder(petId, remPayload);
              } catch (doseErr) {
                console.error("Failed to create dose reminder:", doseErr);
              }
            }
          } else {
            // No time specified — default schedule based on frequency
            let defaultSlots = [{ slot: "morning", time: "08:00:00" }];
            if (med.frequency === "Twice Daily") {
              defaultSlots = [
                { slot: "morning", time: "08:00:00" },
                { slot: "night", time: "20:00:00" },
              ];
            } else if (med.frequency === "Thrice Daily" || med.frequency === "Every 8 Hours") {
              defaultSlots = [
                { slot: "morning", time: "08:00:00" },
                { slot: "afternoon", time: "14:00:00" },
                { slot: "night", time: "20:00:00" },
              ];
            }

            for (const s of defaultSlots) {
              const remPayload = {
                title: `${med.name} (${med.doseQty} ${med.doseUnit})`,
                type: "medication",
                time_slot: s.slot,
                due_date: dueDateStr,
                due_time: s.time,
                notes: `💊 Take: ${foodLabel}`,
                linked_event_id: createdEvent?.id || null,
              };

              try {
                await createReminder(petId, remPayload);
              } catch (doseErr) {
                console.error("Failed to create dose reminder:", doseErr);
              }
            }
          }
        }
      }

      // Create Follow-up Reminder if enabled
      if (followUpEnabled && followUpDate) {
        try {
          const typeLabelMap = {
            vet_visit: "Vet Visit",
            another_medication: "Next Medication Set",
            vaccination: "Vaccination",
            other: "Reminder",
          };

          const remPayload = {
            title: `Follow-up ${typeLabelMap[followUpType] || "Checkup"} for ${petName}`,
            type: followUpType === "vet_visit" ? "vet_visit" : followUpType === "another_medication" ? "medication" : followUpType === "vaccination" ? "vaccination" : "custom",
            due_date: followUpDate,
            due_time: "09:00:00",
            notes: followUpNotes || `Follow-up after medication (${finalMedicines.map((m) => m.name).join(", ")})`,
            linked_event_id: createdEvent?.id || null,
          };

          await createReminder(petId, remPayload);
        } catch (remErr) {
          console.error("Failed to save follow-up reminder:", remErr);
        }
      }

      // Upload Prescription document if attached
      if (files.length > 0 && createdEvent.id) {
        for (const f of files) {
          try {
            await uploadEventRecord(petId, createdEvent.id, f, "Prescription");
          } catch (docErr) {
            console.error("Doc upload error:", docErr);
          }
        }
      }

      // Invalidate timeline cache so pet notes and medications appear immediately
      try {
        queryClient.invalidateQueries({ queryKey: timelineKeys.all(petId) });
      } catch (cacheErr) {
        console.error("Cache invalidation error:", cacheErr);
      }

      setSavedData({
        title: `Medication (${finalMedicines.length} Item${finalMedicines.length > 1 ? "s" : ""})`,
        date: startDate,
        details: [
          { icon: "pill", label: finalMedicines.map((m) => `${m.name} (${m.doseQty} ${m.doseUnit})`).join(", ") },
          { icon: "schedule", label: `Start Date: ${startDate}` },
          ...(followUpEnabled && followUpDate ? [{ icon: "event", label: `Follow-up Reminder: ${followUpDate}` }] : []),
        ],
      });
    } catch (err) {
      console.error("Failed to save medication:", err);
      alert("Failed to save medication. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (savedData) {
    return (
      <SaveConfirmation
        petName={petName}
        categoryLabel="Medication"
        summary={savedData}
        onViewTimeline={onSaved}
        onAddAnother={() => {
          setSavedData(null);
          setAddedMedicines([]);
          setMedName("");
          setFiles([]);
        }}
      />
    );
  }

  const currentPresets = DOSAGE_QTY_PRESETS[medType] || [];

  const handleHeaderClose = () => {
    if (editData && isDirty) {
      setShowUnsavedPrompt(true);
    } else {
      onClose();
    }
  };

  return (
    <div className="pn-form-container">
      {toastMessage && (
        <div style={{
          position: "fixed",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          background: "#004b23",
          color: "#ffffff",
          padding: "10px 20px",
          borderRadius: "20px",
          fontWeight: "700",
          fontSize: "14px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span>
          {toastMessage}
        </div>
      )}

      {/* Unsaved Changes Confirmation Modal */}
      {showUnsavedPrompt && createPortal(
        <div className="ev-modal-overlay" onClick={() => setShowUnsavedPrompt(false)}>
          <div className="ev-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <div className="ev-modal-icon-wrap" style={{ background: "#fef3c7", color: "#d97706" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 28 }}>warning</span>
            </div>
            <h3 className="ev-modal-title">Unsaved Changes</h3>
            <p className="ev-modal-desc">
              You have modified this medical record. Would you like to save your updates before leaving?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", marginTop: 8 }}>
              <button
                type="button"
                className="ev-primary-btn"
                style={{ width: "100%", height: 46, borderRadius: 14, fontSize: 15, fontWeight: 700, background: "#004b23", border: "none" }}
                onClick={(e) => {
                  setShowUnsavedPrompt(false);
                  handleSubmit(e);
                }}
              >
                Save Changes
              </button>
              <button
                type="button"
                style={{ width: "100%", height: 46, borderRadius: 14, fontSize: 15, fontWeight: 700, background: "#ef4444", color: "#ffffff", border: "none", cursor: "pointer" }}
                onClick={() => {
                  setShowUnsavedPrompt(false);
                  onClose();
                }}
              >
                Discard Changes
              </button>
              <button
                type="button"
                style={{ background: "transparent", border: "none", color: "#64748b", fontWeight: 600, fontSize: 14, cursor: "pointer", padding: "6px" }}
                onClick={() => setShowUnsavedPrompt(false)}
              >
                Keep Editing
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Form Top Navigation ── */}
      <div className="pn-form-header">
        <div className="pn-form-header__left">
          <button className="pn-form-header__back" onClick={handleHeaderClose} type="button">
            <span className="material-symbols-outlined">{editData ? "close" : "arrow_back"}</span>
          </button>
          <h2 className="pn-form-header__title">{editData ? "Edit Medication" : "Add Medication"}</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        
        {/* ── 1. PRESCRIBED MEDICINES LIST (TOP ACKNOWLEDGED SECTION) ── */}
        <FormSection title={`Prescribed Medicines (${addedMedicines.length})`} accentColor="#004b23">
          {ackMessage && (
            <div style={{ background: "#eaf5e5", color: "#004b23", border: "1px solid #84b662", borderRadius: 12, padding: "10px 14px", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
              {ackMessage}
            </div>
          )}

          {addedMedicines.length === 0 ? (
            <div style={{ background: "#f8faf7", border: "1px dashed #cfe3c9", borderRadius: 14, padding: "14px", textAlign: "center", color: "#53755b", fontSize: 13 }}>
              No medicines added yet. Fill out the fields below and click <strong>"+ Add Medicine to List"</strong> to include multiple tablets or syrups.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {addedMedicines.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    background: "#ffffff",
                    border: "1.5px solid #84b662",
                    borderRadius: 14,
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    boxShadow: "0 4px 12px rgba(0, 75, 73, 0.06)",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: "#004b23" }}>
                        {index + 1}. {item.name}
                      </span>
                      <span style={{ background: "#eaf5e5", color: "#004b23", borderRadius: 8, padding: "2px 8px", fontSize: 11, fontWeight: 700, textTransform: "capitalize" }}>
                        {item.type}
                      </span>
                    </div>

                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#4d6051" }}>
                      Dosage: <strong>{item.doseQty} {item.doseUnit}</strong> • {item.frequency} ({item.durationDays} Days)
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: "#15803d", marginTop: 2 }}>
                      Relation: {item.foodRelation === "before_food" ? "Before Food" : item.foodRelation === "after_food" ? "After Food" : "With Food"}
                      {item.doseTimes && item.doseTimes.length > 0 ? ` • Times: ${item.doseTimes.join(", ")}` : ""}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveMedicine(item.id)}
                    style={{ background: "#fee2e2", border: "none", color: "#dc2626", borderRadius: 10, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                    title="Remove medicine"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </FormSection>

        {/* ── 2. ADD MEDICINE ITEM FORM ── */}
        <FormSection title="Add Medicine Item" accentColor="#7c3aed">
          <div className="pn-field" style={{ position: "relative" }}>
            <label className="pn-field__label">Medicine Name *</label>
            <div className="pn-input-wrap">
              <input
                type="text"
                className="pn-input pn-input--with-icon"
                placeholder="e.g. Amoxyclav, Meloxicam"
                value={medName}
                onChange={(e) => handleMedChange(e.target.value)}
              />
              <span className="material-symbols-outlined pn-input-icon">pill</span>
            </div>

            {showMeds && medsList.length > 0 && (
              <div className="pn-suggestions">
                {medsList.map((m) => (
                  <div
                    key={m.id || m.brand_name}
                    className="pn-suggestion-item"
                    onClick={() => {
                      setMedName(m.brand_name);
                      if (m.medicine_type) handleMedTypeChange(m.medicine_type);
                      setShowMeds(false);
                    }}
                  >
                    {m.brand_name} {m.strength ? `(${m.strength})` : ""}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Line 2: Medicine Type */}
          <div className="pn-field">
            <label className="pn-field__label">Medicine Type</label>
            <CustomSelect
              value={medType}
              options={MEDICINE_TYPES}
              onChange={handleMedTypeChange}
            />
          </div>

          {/* Line 3: Dosage & Quantity (Custom Stepper + Direct Inline Edit) */}
          <div className="pn-field">
            <label className="pn-field__label">Dosage & Quantity</label>
            <CustomStepper
              value={doseQty}
              unit={TYPE_TO_ALLOWED_UNITS[medType]?.[0]?.label || doseUnit}
              onChange={setDoseQty}
              onUnitChange={setDoseUnit}
              allowedUnits={TYPE_TO_ALLOWED_UNITS[medType] || []}
            />
          </div>

          {/* Line 4: Frequency & Food Relation */}
          <div className="pn-grid-2">
            <div className="pn-field">
              <label className="pn-field__label">Frequency</label>
              <CustomSelect
                value={frequency}
                options={FREQUENCY_OPTIONS}
                onChange={setFrequency}
              />
            </div>

            <div className="pn-field">
              <label className="pn-field__label">Food Relation</label>
              <CustomSelect
                value={foodRelation}
                options={FOOD_RELATION_OPTIONS}
                onChange={setFoodRelation}
              />
            </div>
          </div>

          {/* Line 5: Interval (Custom Hours) OR Time (Optional) */}
          {frequency === "Custom Hours" ? (
            <div className="pn-field">
              <label className="pn-field__label">Interval (Every X Hours)</label>
              <CustomStepper
                value={customHours}
                unit="Hours"
                onChange={setCustomHours}
              />
            </div>
          ) : (
            <div className="pn-field">
              <label className="pn-field__label">Time (Optional)</label>
              {frequency === "Twice Daily" ? (
                <div style={{ display: "flex", gap: 8, width: "100%", minWidth: 0 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <CustomTimePicker
                      value={time1}
                      onChange={setTime1}
                      placeholder="Dose 1 Time"
                      label="Select 1st Dose Time"
                      sublabel="1st Dose"
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <CustomTimePicker
                      value={time2}
                      onChange={setTime2}
                      placeholder="Dose 2 Time"
                      label="Select 2nd Dose Time"
                      sublabel="2nd Dose"
                    />
                  </div>
                </div>
              ) : frequency === "Thrice Daily" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", minWidth: 0 }}>
                  <div style={{ width: "100%", minWidth: 0 }}>
                    <CustomTimePicker
                      value={time1}
                      onChange={setTime1}
                      placeholder="1st Dose Time"
                      label="Select 1st Dose Time"
                      sublabel="1st Dose"
                    />
                  </div>
                  <div style={{ width: "100%", minWidth: 0 }}>
                    <CustomTimePicker
                      value={time2}
                      onChange={setTime2}
                      placeholder="2nd Dose Time"
                      label="Select 2nd Dose Time"
                      sublabel="2nd Dose"
                    />
                  </div>
                  <div style={{ width: "100%", minWidth: 0 }}>
                    <CustomTimePicker
                      value={time3}
                      onChange={setTime3}
                      placeholder="3rd Dose Time"
                      label="Select 3rd Dose Time"
                      sublabel="3rd Dose"
                    />
                  </div>
                </div>
              ) : (
                <div style={{ width: "100%", minWidth: 0 }}>
                  <CustomTimePicker
                    value={time1}
                    onChange={setTime1}
                    placeholder="Select Dose Time (Optional)"
                    label="Select Dose Time"
                    sublabel="Optional Time"
                  />
                </div>
              )}
            </div>
          )}

          <div className="pn-grid-2">
            <div className="pn-field">
              <label className="pn-field__label">Duration (Days)</label>
              <input
                type="number"
                min="1"
                max="365"
                className="pn-input"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
              />
            </div>

            <div className="pn-field">
              <label className="pn-field__label">Special Instructions</label>
              <input
                type="text"
                className="pn-input"
                placeholder="e.g. Keep refrigerated"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddMedicineToList}
            disabled={!medName.trim()}
            style={{
              width: "100%",
              height: 44,
              borderRadius: 12,
              background: medName.trim() ? "linear-gradient(90deg, #84b662 0%, #004b23 100%)" : "#e2e8f0",
              color: medName.trim() ? "#ffffff" : "#94a3b8",
              border: "none",
              fontWeight: 800,
              fontSize: 14,
              cursor: medName.trim() ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              boxShadow: medName.trim() ? "0 6px 16px rgba(0, 75, 73, 0.15)" : "none",
              transition: "all 0.2s ease",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
            + Add Medicine to List
          </button>
        </FormSection>

        {/* ── 3. UPLOAD PRESCRIPTION ── */}
        <DocumentUpload files={files} onFilesChange={setFiles} label="Upload Prescription" />

        {/* ── 4. SCHEDULE & FOLLOW-UP REMINDERS (REMINDER SECTION AT THE BACK) ── */}
        <FormSection title="Schedule & Follow-up Reminders" accentColor="#64748b">
          <div className="pn-field">
            <label className="pn-field__label">Medication Start Date</label>
            <CustomDatePicker
              value={startDate}
              onChange={setStartDate}
              placeholder="Start Date"
              label="Select Start Date"
            />
          </div>

          <div style={{ background: "#f8faf7", border: "1px solid #cfe3c9", borderRadius: 14, padding: "14px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ fontSize: 14, fontWeight: 700, color: "#004b23" }}>Set Follow-up Reminder</label>
              <input
                type="checkbox"
                checked={followUpEnabled}
                onChange={(e) => setFollowUpEnabled(e.target.checked)}
                style={{ width: 20, height: 20, accentColor: "#004b23", cursor: "pointer" }}
              />
            </div>

            {followUpEnabled && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
                <div className="pn-field">
                  <label className="pn-field__label">Follow-up Event Type</label>
                  <CustomSelect
                    value={followUpType}
                    options={REMINDER_EVENT_TYPES}
                    onChange={setFollowUpType}
                  />
                </div>

                <div className="pn-field">
                  <label className="pn-field__label">Reminder Date</label>
                  <CustomDatePicker
                    value={followUpDate}
                    onChange={setFollowUpDate}
                    placeholder="Reminder Date"
                    label="Select Follow-up Date"
                  />
                </div>

                <div className="pn-field">
                  <label className="pn-field__label">Reminder Notes (Optional)</label>
                  <input
                    type="text"
                    className="pn-input"
                    placeholder="e.g. Follow-up vet visit for post-treatment review"
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </FormSection>

        {/* ── 5. SUBMIT BUTTON ── */}
        <button
          type="submit"
          className="pn-submit-btn"
          disabled={submitting || (addedMedicines.length === 0 && !medName.trim())}
        >
          <span className="material-symbols-outlined">save</span>
          {submitting
            ? "Saving Medication..."
            : `Save Medication (${addedMedicines.length + (medName.trim() ? 1 : 0)} Item${addedMedicines.length + (medName.trim() ? 1 : 0) !== 1 ? "s" : ""})`}
        </button>
      </form>
    </div>
  );
}
