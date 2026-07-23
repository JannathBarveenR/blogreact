# PetOlife — Paw Note MVP

## 1. Overview

**Paw Note** is the core health-recording feature of the PetOlife MVP.

It allows pet parents to quickly record important events related to their pet's health and care. Every Paw Note becomes part of the pet's **Health Timeline**, creating a chronological history that the pet parent can refer to later.

The MVP should focus on making data entry extremely simple while still allowing detailed health information to build up over time.

The core principle is:

> **Minimum effort while creating a Paw Note. Maximum useful health history over time.**

Paw Notes can optionally be connected to one another. For example, a pet parent may first notice a change in their pet, later visit a veterinarian, receive medication, and finally attend a follow-up visit.

These records can form a connected health journey without forcing the user to create all the records at once.

---

# 2. Paw Note Categories

The MVP will support the following categories:

* Vaccination
* Change in Pet
* Routine Care
* Deworming
* Medication
* Vet Visit
* Treatment / Operation
* Other

Every category creates an individual record in the pet's Health Timeline.

Records can optionally be linked when they are related.

---

# 3. Common Paw Note Flow

When the pet parent selects **Add Paw Note**, the first screen asks:

> **What would you like to record?**

The user selects one of the available categories.

After selecting the category, only fields relevant to that category are displayed.

The common structure across categories is:

1. Select Category
2. Enter What Happened
3. Select Date
4. Add Category-Specific Details
5. Upload Photos or Documents
6. Set Next Due / Follow-up Date
7. Enable Reminder
8. Save to Health Timeline

The form should use **progressive disclosure** so users are not presented with unnecessary fields.

---

# 4. Category: Vaccination

### Example

> "Bruno received his Rabies vaccination today. I uploaded the vaccination certificate and added the next vaccination date provided by the vet."

### Information to Capture

* Category: Vaccination
* Vaccine Name
* Date Given
* Dose / Dosage, if available
* Batch / Lot Number, if available
* Vet / Clinic Name, optional
* Vaccination Certificate
* Prescription, optional
* Next Due Date
* Notes, optional
* Reminder: On / Off
* Linked Vet Visit, optional

### Timeline Example

**Vaccination — Rabies**

Given: 18 July 2026
Next Due: Date entered by pet parent
Certificate: 1 attachment
Reminder: Active

### Reminder Behaviour

The application should not independently determine medical vaccination schedules.

The next due date should preferably come from:

* The veterinarian
* Vaccination certificate
* Prescription
* Information entered by the pet parent

The application uses this date to create the reminder.

---

# 5. Category: Change in Pet

### Example

> "Bruno hasn't been eating properly for the last two days. He also seems less active than usual. I want to record this and remind myself to visit the vet tomorrow."

This category captures observations made directly by the pet parent.

It should not attempt to diagnose the pet.

### Information to Capture

* Category: Change in Pet
* Title — What did you notice?
* Observed Date
* Description, optional
* Photos, optional
* Status:

  * Just Noticed
  * Still Happening
  * Improving
  * Resolved
* Reminder Type:

  * Check Again
  * Visit Vet
* Reminder Date & Time
* Linked Vet Visit, optional

### Example Changes

* Not eating properly
* Drinking more or less than usual
* Vomiting
* Skin rash
* Hair loss
* Limping
* Unusual behaviour
* Low activity
* Excessive scratching
* Visible swelling

### Timeline Example

**Change in Pet — Not Eating Properly**

Started: 18 July
Status: Still Happening
Photos: 2
Vet Visit Reminder: Tomorrow

If the pet parent later visits a veterinarian, the Vet Visit can optionally be linked to this Paw Note.

---

# 6. Category: Routine Care

### Example

> "Bruno had his regular grooming and nail trimming today. I want to remember when the next grooming is due."

### Information to Capture

* Category: Routine Care
* Care Type:

  * Grooming
  * Bath
  * Nail Trim
  * Ear Cleaning
  * Dental Care
  * Tick & Flea Care
  * Other
* Date Completed
* Product Used, optional
* Service Provider, optional
* Photos, optional
* Notes, optional
* Next Due Date, optional
* Recurring Reminder: On / Off

### Timeline Example

**Routine Care — Grooming**

Completed: 18 July
Services: Grooming, Nail Trim
Next Due: 18 August
Reminder: Active

---

# 7. Category: Deworming

### Example

> "Bruno was given his scheduled deworming medicine at home today. I recorded the medicine and dosage and added the next date recommended by the vet."

### Information to Capture

* Category: Deworming
* Medicine / Product Name
* Date Given
* Dosage, if known
* Pet Weight at Time of Dose, optional
* Given At:

  * Home
  * Vet Clinic
* Prescription, optional
* Medicine / Product Photo, optional
* Next Due Date
* Notes, optional
* Reminder: On / Off
* Linked Vet Visit, optional

### Timeline Example

**Deworming — Drontal**

Given: 18 July
Dosage: Recorded
Given At: Home
Next Due: Date entered by pet parent
Reminder: Active

The application should not automatically recommend a deworming frequency as medical advice.

The next due date should be entered based on the pet parent's existing schedule or veterinarian's recommendation.

---

# 8. Category: Medication

Medication should work as an independent record while also supporting connections to Vet Visits and Treatments.

This allows two scenarios.

### Scenario A — Medication From Vet Visit

A veterinarian prescribes medication during a consultation.

**Vet Visit → Medication**

### Scenario B — Existing / Ongoing Medication

The pet parent wants to track an existing medication without creating a new Vet Visit.

**Medication → Independent Record**

### Example

> "The vet prescribed Bruno medication for five days. I added the medicine details and enabled daily dose reminders."

### Information to Capture

* Category: Medication
* Medicine Name
* Dosage
* Medicine Form:

  * Tablet
  * Syrup
  * Drops
  * Injection
  * Topical
  * Other
* Start Date
* Duration / End Date
* Frequency
* Timing:

  * Morning
  * Afternoon
  * Evening
  * Custom
* Food Instructions, optional:

  * Before Food
  * With Food
  * After Food
* Special Instructions, optional
* Prescription Upload
* Medicine Photo, optional
* Dose Reminder: On / Off
* Linked Vet Visit, optional
* Linked Treatment / Operation, optional

### Timeline Example

**Medication — Medicine Name**

Started: 18 July
Duration: 5 Days
Dosage: Recorded
Reminder: Morning & Evening
Prescription: Attached

Daily medication reminders should not create individual Timeline records unless the user specifically chooses to record them.

The Timeline should primarily show when the medication started and when it was completed.

---

# 9. Category: Vet Visit

### Example

> "Bruno visited Happy Paws Clinic because he wasn't eating properly. The vet examined him, provided a diagnosis and prescribed medication."

The Vet Visit is one of the richest Paw Note categories because it can connect multiple parts of the pet's health journey.

### Information to Capture

* Category: Vet Visit
* Visit Date
* Reason for Visit
* Vet / Clinic Name
* Vet Name, optional
* Visit Notes — What happened?
* Diagnosis, if provided by the veterinarian
* Prescription Upload
* Lab Reports, optional
* Medical Documents, optional
* Photos, optional
* Medications Prescribed
* Treatment / Procedure Performed, optional
* Next Vet Visit / Follow-up Date, optional
* Follow-up Reminder: On / Off
* Linked Change in Pet, optional

### Medication Handling

If medication was prescribed during the visit, the user should be able to:

* Add medication directly from the Vet Visit
* Create a Medication record
* Automatically link the Medication to the Vet Visit
* Configure medication reminders

This prevents duplicate data entry.

### Timeline Example

**Vet Visit — Happy Paws Clinic**

18 July 2026

Reason: Loss of appetite
Diagnosis: Added by pet parent from vet's information
Prescription: Attached
Medications: 2
Follow-up: 25 July

---

# 10. Category: Treatment / Operation

### Example

> "Bruno underwent a minor procedure today. I uploaded the treatment documents and added the follow-up date provided by the vet."

### Information to Capture

* Category: Treatment / Operation
* Treatment / Procedure Name
* Date
* Reason for Treatment
* Vet / Clinic Name
* What Was Done?
* Treatment Notes
* Post-treatment / Recovery Instructions
* Photos, optional
* Discharge Summary
* Prescription
* Reports, optional
* Medications
* Follow-up Date
* Follow-up Reminder: On / Off
* Status:

  * Treatment Completed
  * Recovering
  * Follow-up Required
  * Completed
* Linked Vet Visit, optional
* Linked Change in Pet, optional

### Timeline Example

**Treatment — Minor Skin Procedure**

Date: 18 July
Clinic: Happy Paws Clinic
Status: Recovering
Medications: 1
Follow-up: 25 July
Documents: 2

---

# 11. Category: Other

### Example

> "Bruno's diet was changed today from his regular food to a new brand. I want to keep this information in his health timeline."

### Information to Capture

* Category: Other
* Title
* Date
* Description
* Photos, optional
* Documents, optional
* Next Action / Follow-up, optional
* Reminder Date, optional
* Reminder: On / Off

This category provides flexibility without adding more categories to the main Paw Note selection screen.

---

# 12. Connecting Paw Notes

Paw Notes should work independently.

Linking records should always be **optional**.

A simple health journey may look like:

**Change in Pet**

"Not eating properly for two days."

↓

**Vet Visit**

"Visited Happy Paws Clinic."

↓

**Medication**

"Medication prescribed for five days."

↓

**Follow-up Vet Visit**

"Pet's condition improved."

↓

**Change in Pet**

Status updated to "Resolved."

The application should allow users to connect these records without forcing them to do so.

---

# 13. Linking Rules

### Change in Pet

Can optionally link to:

* Vet Visit
* Treatment / Operation

### Vet Visit

Can optionally link to:

* Change in Pet
* Medication
* Treatment / Operation

### Medication

Can optionally link to:

* Vet Visit
* Treatment / Operation

### Treatment / Operation

Can optionally link to:

* Change in Pet
* Vet Visit
* Medication

### Vaccination

Can optionally link to:

* Vet Visit

### Deworming

Can optionally link to:

* Vet Visit

### Routine Care

Usually works independently.

---

# 14. Documents and Attachments

The MVP should support storing important health documents within Paw Notes.

### Document Types

* Prescription
* Vaccination Certificate
* Lab Report
* Medical Report
* Discharge Summary
* Invoice / Bill
* Medicine Photo
* Treatment Photo
* Health Observation Photo
* Other Document

Documents should remain connected to the Paw Note where they were originally uploaded.

For example:

**Vet Visit**

* Prescription
* Lab Report

**Vaccination**

* Vaccination Certificate

**Change in Pet**

* Skin rash photos

**Treatment**

* Discharge Summary
* Treatment Report

---

# 15. Reminder System

Reminders should be generated from information entered by the pet parent rather than the application independently providing medical schedules.

### Reminder Types

* Vaccination Due
* Deworming Due
* Medication Dose
* Medication Completion
* Check Pet Again
* Schedule / Attend Vet Visit
* Vet Follow-up
* Treatment Follow-up
* Routine Care

### Example

**Change in Pet**

"Bruno is not eating."

→ Remind me tomorrow to check again.

→ Remind me tomorrow to visit the vet.

**Vet Visit**

"Follow-up recommended after 7 days."

→ Follow-up reminder.

**Medication**

"Medicine for 5 days."

→ Daily dose reminders.

**Vaccination**

"Next vaccination date entered."

→ Vaccination due reminder.

---

# 16. Health Timeline

Every Paw Note becomes part of the pet's Health Timeline.

The Timeline should answer three simple questions:

> **What happened?**

> **When did it happen?**

> **What needs to happen next?**

A Timeline card should display:

* Category
* Event Title
* Date
* Short Summary
* Status, if applicable
* Number of Attachments
* Related Reminder / Next Due Date
* Linked Paw Notes, if available

### Example Timeline

**18 July — Change in Pet**
Bruno is not eating properly.
Status: Still Happening
Photos: 2

↓

**20 July — Vet Visit**
Visited Happy Paws Clinic.
Prescription: Attached
Linked to: Not Eating Properly

↓

**20 July — Medication Started**
Medicine prescribed for 5 days.
Daily Reminder: Active
Linked to: Vet Visit

↓

**25 July — Follow-up**
Bruno's condition has improved.

↓

**25 July — Change in Pet**
Not Eating Properly — Resolved

---

# 17. MVP Data Flow

The overall Paw Note experience should follow:

**Capture → Store → Connect → Remind → Track**

### Capture

The pet parent records what happened.

### Store

The information, photos, and documents are saved as a Paw Note.

### Connect

Related Paw Notes can optionally be linked.

### Remind

Relevant reminders are created based on dates entered by the pet parent.

### Track

All records appear chronologically in the Health Timeline.

---

# 18. Future AI Enhancement

AI is not required for the Paw Note MVP.

However, the MVP should collect structured information that can support AI features in future phases.

Future AI capabilities could include:

* Extracting medication information from uploaded prescriptions
* Extracting vaccination details from vaccination certificates
* Extracting follow-up dates from documents
* Automatically organizing uploaded medical documents
* Suggesting connections between related Paw Notes
* Summarizing a pet's health history
* Generating a Vet Visit summary from stored records
* Identifying repeated health observations from the Timeline
* Helping users search their pet's historical records using natural language

For example:

> "Show me all the times Bruno had a skin problem."

The system could retrieve related Change in Pet records, Vet Visits, treatments, photos, and medications.

AI should primarily help users **organize, retrieve, and understand their existing records**, rather than independently diagnosing medical conditions.

---

# 19. Final MVP Structure

The Paw Note MVP consists of eight categories:

1. Vaccination
2. Change in Pet
3. Routine Care
4. Deworming
5. Medication
6. Vet Visit
7. Treatment / Operation
8. Other

The key product principle is:

> **Every health event can exist independently, but related events can be connected.**

A user should be able to create a simple Paw Note in seconds.

Users who want more detailed records can add documents, medications, reminders, follow-ups, and links between related events.

Over time, these small individual records build a complete and meaningful **Health Timeline for the pet**.
