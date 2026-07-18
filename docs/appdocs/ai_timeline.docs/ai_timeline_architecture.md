# @SAD_v0.6

# AI Timeline — Software Architecture Document (SAD)

## Phase 1 — Draft 6 (Manual-First, Logic-Driven Core / AI-Optional Overlay)

**Version:** 0.6
**Status:** Architectural Design — Vet Visit Form Architecture Pivot
**Previous Version:** 0.5 (Category-first, single-category-per-entry form)

**Change Summary (v0.5 → v0.6):**
This is a form architecture pivot that restructures how visit data is entered, categorised, and stored — while preserving the Phase 1 manual-first / Phase 2 AI-overlay split unchanged.

- The Vet Visit Form is restructured from a single-category-per-submission model to a **Master Form** with **Common Fields** at the top (pet, date, time, clinic, vet, visit type, reason, attachments, follow-up) and **dynamically added Category Sections** (Diagnosis, Medication, Vaccination, Deworming, Anti-Tick/Flea, Grooming, Other) added via chip selection — the user can add multiple category sections within a single visit submission.
- Category Sections now use **3 Generalized Form Types** sharing ~70% core fields with ~30% context-specific fields: (1) General Consultation & Vitals, (2) Treatment & Medication, (3) Procedure & Diagnostics. This consolidation reduces form complexity while covering all medical scenarios.
- Rich **Reference Data Models** are introduced: a Medicine Database (brand name, composition, type-specific dosing for tablets/syrups/eye drops/ointments/injections/medicated shampoos), a Vaccine Database with species-specific auto-due-date rules, an Injection Module with route/site specifics (IV/IM/SC), and a Diagnosis taxonomy — all preloaded and searchable via dropdowns.
- The Reminder Engine expands from auto-generated-only to **3 reminder types**: auto-generated (from visit logs), manual (user-created), and recurring (repeating schedules) — with a full Add/Edit Reminder form.
- PDF Export is expanded with format options (PDF/CSV/Excel), template selection (Full Report, Summary Only, Vaccination Card, Medication List), category filtering, attachment/notes toggles, and an in-app preview.
- The old standalone categories (`vet_visit`, `weight`, `lab_test`, `surgery`) are absorbed: weight/vitals into the Diagnosis category (Consultation & Vitals form), lab tests and surgeries into Procedure & Diagnostics form (accessible via Grooming or Other categories).

---

# Ch. 1 — Vision & Scope

## Vision

The AI Timeline (internally still named for continuity) is PetOLife's medical record system. Its job, in order of priority, is to be a **complete, dependable, manual medical log first**, and an **AI-assisted convenience layer second**.

A pet owner should be able to use the entire product — profile, visit logging, vaccination tracking, medication tracking, documents, reminders, PDF export — without ever touching an AI feature, without an API key configured, and without any degradation in reliability.

## Goals — Phase 1 (Core, No AI)

- A structured, per-pet medical record built entirely from human-entered data
- A category-first timeline (Diagnosis, Medications, Vaccinations, Deworming, Anti-Tick/Flea, Grooming, Other)
- A deterministic reminder engine (auto-generated + manual + recurring) that never depends on an external service
- A documents vault for certificates, reports, and lab results
- A shareable PDF/CSV/Excel export for vets, boarding facilities, or a new clinic

## Goals — Phase 2 (Optional AI Overlay)

- Auto-extract vet visits from an uploaded Pet Diary (PDF/images) and pre-fill the *same* manual form for human confirmation — extraction never bypasses verification
- Add AI-generated (and, later, community-informed) insight notes to individual medical events and to the pet's overall history
- AI-interpreted reminders (e.g. an implied follow-up in doctor's notes) layered on top of the rule-based reminders — never replacing them

## Non-Goals (both phases)

- Diagnose diseases
- Prescribe medicines
- Replace veterinarians
- Perform predictive healthcare or risk scoring

Any AI output, wherever it appears, is informational only and must carry a medical disclaimer.

---

# Ch. 2 — Architectural Principles

- **Functional before intelligent** — the product must be 100% usable, valuable, and complete with AI turned off
- **Human-entered is first-class, not a fallback** — manual data is the primary data source, not a degraded backup path
- **Category-first data organisation** — the timeline's default grouping is category, not chronology; chronology is a secondary view
- **Deterministic core** — the Timeline Engine and Reminder Engine are pure logic, testable without mocking any external API
- **AI is additive, never load-bearing** — when Phase 2 is enabled, AI proposes data (extraction) or commentary (insights); it never becomes the only path to a working feature
- **One data model, two entry paths** — manually entered and AI-extracted medical events live in the same table with the same shape; only a `source` flag differs
- **AI abstraction layer** — when present, all Gemini calls pass through a provider-agnostic adapter (kept from v0.4, unchanged in spirit)
- **Modular services** — each engine (timeline, reminders, documents, PDF export, extraction, insights) is independently replaceable

---

# Ch. 3 — Functional Scope (Phase 1 — What Actually Ships First)

Phase 1 is scoped directly against PetNoter's medical-only workflow: pet profiles, health record logging, reminders, and shareable reports.

| Module | Purpose |
|---|---|
| **F1 — Pet Profile** | Name, species, breed, date of birth, health conditions. Each pet has its own isolated medical space. |
| **F2 — Master Vet Visit Form** | One master form with **Common Fields** at top (pet, date, time, clinic, vet, visit type, reason, attachments, follow-up) and **Category Sections** added dynamically via chips (Diagnosis, Medication, Vaccination, Deworming, Anti-Tick/Flea, Grooming, Other). Category sections use 3 generalized form types sharing 70% core fields. |
| **F3 — Documents Vault** | Upload and store certificates, vet reports, lab results, health passports, invoices — attached to a pet or to a specific event. |
| **F4 — Category Timeline Engine** | Groups Medical Event Nodes by category (not date) as the default view; chronological "all events" view available as a toggle. |
| **F5 — Reminder Engine (Auto + Manual + Recurring)** | Three reminder types: auto-generated from visit logs (vaccines, medications, follow-ups, deworming), manual user-created reminders, and recurring schedules (monthly flea treatment, quarterly deworming). Push/notification-ready. Full Add/Edit Reminder form. |
| **F6 — Export Engine** | Generates shareable reports from selected medical records. Supports PDF, CSV, and Excel formats with template options (Full Report, Summary Only, Vaccination Card, Medication List). In-app preview before download/share. |

Everything else — Gemini extraction, AI insights, community insights — is **Phase 2** and is described starting at Ch. 11. None of it is required for F1–F6 to work.

---

# Ch. 4 — Category-First Data Model

## Why category-first

The previous design treated the Medical Event Node as a chronological unit first, with category views generated at read time as a secondary index. That is now inverted: **category is the primary lens** a pet owner uses ("show me all vaccinations", "show me current medications"), and date ordering happens inside that lens.

## Categories

```
diagnosis       — illness observation, clinical assessment, vitals recording, condition tracking
medication      — tablets, syrups, eye drops, ointments, injections, medicated shampoos
vaccination     — vaccine administration with auto-due-date rules
deworming       — deworming product administration with schedule tracking
anti_tick_flea  — anti-tick/anti-flea preventative application
grooming        — grooming procedures, baths, coat care
other           — lab tests, surgeries, X-rays, blood work, custom medical events
```

## Category-to-Form-Type Mapping

Each category maps to one of three Generalized Form Types (Ch. 5, §5.5–5.7):

| Category | Form Type |
|---|---|
| `diagnosis` | General Consultation & Vitals |
| `medication` | Treatment & Medication |
| `vaccination` | Treatment & Medication |
| `deworming` | Treatment & Medication |
| `anti_tick_flea` | Treatment & Medication |
| `grooming` | Procedure & Diagnostics |
| `other` | Procedure & Diagnostics |

## The Medical Event Node

Every submission of the Master Vet Visit Form creates one Medical Event Node per visit. A single visit can contain **multiple category entries** — e.g. a visit where the vet diagnosed a condition **and** prescribed a medication **and** gave a vaccination produces one visit-level record with three category entries, all stored under the same `visit_group_id`.

The Medical Event Node stores:

- **Visit-level common fields** — pet, event date/time, clinic, vet name, visit type, reason, overall notes, follow-up date/notes, attachments
- **Category entries** — an array of category-specific records, each carrying its own category tag, shared core fields (item name, status, next due date, notes, attachments), and the form-type-specific fields (vitals, dosing, procedure details)
- `source` — `manual` or `ai_extracted` (Phase 2 only)
- `verification_status` — `verified` (manual entries are verified on save) or `pending`/`rejected` (AI-extracted entries awaiting human confirmation, Phase 2 only)
- `event_hash` — for duplicate detection
- `created_at` / `updated_at`

Manual entries are **directly editable** — Phase 1 does not need an immutable append-only versioning system, because there is no untrusted AI writer to guard against. A lightweight `edit_history` audit table (Ch. 8) is enough to answer "what changed and when," without the complexity of timeline version pointers and rollback endpoints. That machinery returns in Phase 2, scoped specifically to AI-originated data (Ch. 13).

---

# Ch. 5 — Master Vet Visit Form (Core Phase 1 Deliverable)

This is the single most important screen in Phase 1. It replaces AI extraction entirely as the way data enters the system.

## 5.1 Visit Form Architecture

**Concept:** One master form with **Common Fields** at the top, then **Category Sections** that the user adds dynamically via chips. The user fills the visit-level context once, then adds as many category-specific entries as needed — all saved as one visit.

## 5.2 Common Fields (Top of Form)

These fields appear at the top of every visit submission, regardless of which categories the user adds.

| Field | Type | Required | Options / Notes |
|-------|------|----------|-----------------|
| Pet | Dropdown | Yes | Pre-selected if navigated from pet profile, else list of user's pets |
| Event Date | Date Picker | Yes | Default: Today. Calendar icon. |
| Event Time | Time Picker | No | Default: Current time |
| Clinic Name | Searchable Dropdown | Yes | From clinic database + "Add New" option. Editable after save. |
| Vet Name | Text Input | No | Specific doctor who attended |
| Visit Type | Multi-select Chips | Yes | Routine Checkup, Emergency, Follow-up, Vaccination, Surgery, Grooming, Other |
| Reason for Visit | Text Area | No | Max 500 chars |
| Overall Notes | Text Area | No | Max 1000 chars |
| Attachments | File Upload | No | Photos, PDFs, docs. Multiple allowed. Preview thumbnails. |
| Follow-up Date | Date Picker | No | Quick buttons: 3 Days, 7 Days, 14 Days, 30 Days, Custom |
| Follow-up Notes | Text Area | No | Max 300 chars |

## 5.3 Category Selector ("What happened at this visit?")

Below the common fields, a chip selector lets the user add one or more category sections. Each chip adds a collapsible section with the appropriate form fields.

**Available Categories:**
1. 🩺 Diagnosis
2. 💊 Medication
3. 💉 Vaccination
4. 🐛 Deworming
5. 🪲 Anti-Tick / Anti-Flea
6. 🛁 Grooming
7. 📝 Other

Multiple categories can be added to the same visit. Each category section can also have **multiple entries** (e.g. two different medications prescribed at the same visit).

## 5.4 Shared Core Fields (Present Across All 3 Form Types — The 70%)

Every category entry, regardless of which form type it uses, includes these shared fields:

| Field | Type | Required | Options / Values |
|-------|------|----------|-----------------|
| Record Type / Category | Dropdown | Yes | Specific category from above (auto-set from the chip selected) |
| Item Name / Title | Searchable Dropdown | Yes | Diagnosis Name, Medicine Brand, Vaccine Name, Test Name — sourced from reference data (§5.8) |
| Date Logged | Date Picker | Yes | Default: Visit date from common fields |
| Status / Result | Segmented Control | Yes | Context-dependent: Normal/Abnormal, Active/Completed, Suspected/Confirmed |
| Next Due Date / Follow-up | Date Picker | No | Auto-calculates based on type (vaccine booster interval, deworming +90d, etc.), editable |
| General Notes & Instructions | Text Area | No | Max 1000 chars |
| Attachments | File Upload | No | Photos, PDFs, X-rays, Prescriptions |

## 5.5 Form Type 1: General Consultation & Vitals

**Use Case:** Routine checkups, illness observation, weight checks, diagnosing conditions.
**Maps to Category:** `diagnosis`

**Context-Specific Fields (The 30%):**

| Field | Type | Required | Options / Values |
|-------|------|----------|-----------------|
| Weight | Number + Unit | No | kg / lbs |
| Temperature | Number + Unit | No | °C / °F |
| Body Condition Score | Slider | No | 1–9 scale |

**Advanced Vitals (optional expandable section):**

| Field | Type | Required | Options / Values |
|-------|------|----------|-----------------|
| Heart Rate | Number | No | bpm |
| Respiration Rate | Number | No | breaths/min |
| Hydration | Segmented Control | No | Normal / Abnormal |
| Behaviour | Segmented Control | No | Normal / Abnormal |
| Mucous Membrane | Segmented Control | No | Normal / Abnormal |

**Diagnosis Sub-entries (multiple allowed):**

| Field | Type | Required | Options / Values |
|-------|------|----------|-----------------|
| Diagnosis Category | Dropdown | Yes | Respiratory, Gastrointestinal, Dermatological, Musculoskeletal, Neurological, General |
| Diagnosis Name | Searchable Dropdown | Yes | Per-category options (e.g. Respiratory: Kennel Cough, Pneumonia; GI: Gastritis, Vomiting; Dermatological: Pyoderma; Musculoskeletal: Arthritis; Neurological: Epilepsy; General: Fever, etc.) |
| Status | Segmented Control | Yes | Suspected, Confirmed, Rule Out |
| Clinical Notes | Text Area | No | Max 500 chars |
| Attachment | File Upload | No | Single attachment per diagnosis entry |

**Summary Card Display:**
- Title (Category + Item Name)
- Status badge (e.g. "Confirmed")
- Vitals snapshot (Weight, Temp)
- Follow-up date

## 5.6 Form Type 2: Treatment & Medication

**Use Case:** Prescribing tablets, syrups, drops, ointments, injections, medicated shampoos, vaccines, deworming products, and anti-tick/flea preventatives.
**Maps to Categories:** `medication`, `vaccination`, `deworming`, `anti_tick_flea`

**Context-Specific Fields (The 30%):**

| Field | Type | Required | Options / Values |
|-------|------|----------|-----------------|
| Dose / Amount | Number + Unit | Yes | mg, ml, drops, tablets, application amount |
| Frequency / Timing | Dropdown / Chips | Yes | Morning, Afternoon, Night, Once daily, Twice daily, As needed, etc. |
| Duration | Number + Unit | Yes | Days, Weeks, Months, Ongoing |
| Route / Method | Dropdown | Yes | Oral, Topical, Injection, Subcutaneous, Intramuscular, etc. |
| Food Relation | Segmented Control | No | Before Food, With Food, After Food |

**Sub-type-specific field variations** (driven by Medicine Type from the reference database):

**Tablet:**
- Dose: ¼, ½, 1, 2 tablets
- Timing: Morning, Afternoon, Night (multi-select)
- Food: Before Food / After Food
- Duration: Days

**Syrup:**
- Dose: number + unit (Auto / ml)
- Timing: (same as tablet)
- Duration: Days

**Eye Drops:**
- Drops: 1, 2
- Eye: Left, Right, Both
- Frequency: number of times per day
- Duration: Days

**Ointment:**
- Application Frequency: Once, Twice, Thrice daily
- Duration: Days

**Injection** (under Medication, not a separate category):
- Injection Name: Searchable Dropdown
- Dose: number
- Unit: Auto, ml, mg
- Route: IV, IM, SC
  - IV sites: Cephalic Vein, Saphenous Vein, Jugular Vein
  - IM sites: Epaxial Muscles, Quadriceps, Hamstrings, Triceps
  - SC sites: Scruff, Flank, Lateral Thorax
- Site: Optional dropdown (populated based on route selection)

**Medicated Shampoo** (under Medication — deticking/therapeutic shampoos):
- Shampoo Category: Anti Fungal, Tick & Flea, Anti Itch, Anti Dandruff, General
- Brand: Searchable Dropdown (preloaded: Ketochlor, Micodin, Ketohex, Malaseb, Sebolytic, Erina EP, Scaboma, Tick Free, Clinar M, Allermyl, Dermavet, Canifur, Himalaya Erina Coat Cleanser, Sebolytic Plus, Selco, Coatex, Virbac Epi-Soothe, Petben, Savavet Kiskin, Vetoquinol Skingel)
- Frequency: Once Weekly, Twice Weekly, Alternate Days
- Duration: Weeks
- Instructions: Leave 5–10 minutes, Avoid Eyes, Rinse Thoroughly (multi-select)

**Vaccination-specific fields** (when category = `vaccination`):
- Vaccine Name: Dropdown (species-filtered, see §5.8)
- Dose / Batch Number: Text
- Site: Text
- Next Due Date: Auto-calculated from vaccine auto-rules (see §5.8), editable

**Summary Card Display:**
- Title (Medicine / Product Name)
- Dose: [Value] | Route: [Method] | Timing: [Frequency]
- Duration: [X] days
- Status badge (e.g. "Active" / "Up to Date")

## 5.7 Form Type 3: Procedure & Diagnostics

**Use Case:** Lab tests, blood work, surgeries, X-rays, grooming procedures, and custom medical events.
**Maps to Categories:** `grooming`, `other`

**Context-Specific Fields (The 30%):**

| Field | Type | Required | Options / Values |
|-------|------|----------|-----------------|
| Procedure / Test Type | Dropdown | Yes | Elective Surgery, Emergency Surgery, Blood Chemistry, CBC, Urinalysis, X-Ray, Ultrasound, Grooming, Dental Cleaning, Custom |
| Detailed Findings / Results | Text Area | No | Test results, post-op conditions, abnormal findings |

**Summary Card Display:**
- Title (Procedure / Test Name)
- Result/Status badge (e.g. "Abnormal" / "Recovering")
- "View Full Results" link

## 5.8 Reference Data Models

These are preloaded, searchable databases that populate the Item Name / Title dropdowns and drive auto-calculations across the form.

### Medicine Database

| Field | Type | Notes |
|-------|------|-------|
| Brand Name | Text | Searchable dropdown |
| Composition | Text | Active ingredients |
| Medicine Type | Enum | Tablet, Syrup, Injection, Eye Drop, Ointment, Shampoo |
| Strength | Text | e.g. "500mg", "10ml" |

The Medicine Type selection drives which sub-type-specific fields appear (§5.6).

### Vaccine Database

**Dogs:** Rabies, DHPP, Leptospirosis, Bordetella, Canine Influenza
**Cats:** Rabies, FVRCP, FeLV

**Auto-Due-Date Rules:**

| Vaccine | Next Due |
|---------|----------|
| Rabies | +1 Year |
| DHPP | +1 Year |
| Leptospirosis | +1 Year |
| Bordetella | +6 Months |
| Canine Influenza | +1 Year |
| FVRCP | +1 Year |
| FeLV | +1 Year |

All auto-calculated dates are **editable** — the user can always override.

### Diagnosis Taxonomy

| Category | Example Diagnoses |
|----------|-------------------|
| Respiratory | Kennel Cough, Pneumonia |
| Gastrointestinal | Gastritis, Vomiting |
| Dermatological | Pyoderma |
| Musculoskeletal | Arthritis |
| Neurological | Epilepsy |
| General | Fever, etc. |

### Injection Route & Site Reference

| Route | Available Sites |
|-------|----------------|
| IV (Intravenous) | Cephalic Vein, Saphenous Vein, Jugular Vein |
| IM (Intramuscular) | Epaxial Muscles, Quadriceps, Hamstrings, Triceps |
| SC (Subcutaneous) | Scruff, Flank, Lateral Thorax |

### Medicated Shampoo Database

**Categories:** Anti Fungal, Tick & Flea, Anti Itch, Anti Dandruff, General

**Preloaded Brands:** Ketochlor, Micodin, Ketohex, Malaseb, Sebolytic, Erina EP, Scaboma, Tick Free, Clinar M, Allermyl, Dermavet, Canifur, Himalaya Erina Coat Cleanser, Sebolytic Plus, Selco, Coatex, Virbac Epi-Soothe, Petben, Savavet Kiskin, Vetoquinol Skingel

## 5.9 Multi-Category Visits

A single real appointment often spans more than one category (e.g. an annual checkup that also includes a booster shot and a new medication). The master form natively supports this:

1. The user fills the common fields (date, clinic, vet, etc.) once
2. They add category chips — each chip adds a collapsible section with the appropriate form fields
3. Multiple entries within the same category are also supported (e.g. two different medications)
4. All entries share the same `visit_group_id`

This keeps category as the atomic sorting/storage unit while still letting the UI reconstruct "everything that happened on this visit" on demand.

## 5.10 How It's Showcased

- **Entry point:** a prominent "+ Log a Visit" action from the pet's profile screen
- **Common fields** always visible at the top
- **Category chips** below common fields (emoji + label), multi-select, each chip adds a collapsible form section
- **Searchable dropdowns** for medicine names, vaccine names, clinic names — pulling from the reference databases (§5.8)
- **Inline auto-suggestions** for due dates (vaccination/deworming/anti-tick) shown as an editable pre-filled value, not a locked field — the user can always override the rule engine's suggestion
- **Confirmation toast** on save: "Added to [Category] · Next reminder: [date]" — ties the form directly to the reminder it just created, reinforcing that reminders come from data the user just entered, not a black box

---

# Ch. 6 — Category Timeline Engine

**Purpose:** Transform Medical Event Nodes into the views the user actually browses.

## Default view — Category Grouped

```
Diagnosis             [newest → oldest]
Medications           [newest → oldest]
Vaccinations          [newest → oldest]
Deworming             [newest → oldest]
Anti-Tick / Anti-Flea [newest → oldest]
Grooming              [newest → oldest]
Other                 [newest → oldest]
```

Each category is its own scrollable/tabbed section. Within a category, sorting is strictly by `event_date` descending. This is the default landing view.

## Secondary view — All (Chronological)

A toggle merges every category into one date-sorted feed, for users who want a single narrative view or are preparing for a vet visit and want "everything in order." This is the *old* default view from v0.4 — it still exists, it's just no longer the primary one.

## Implementation note

Category grouping is a **read-time query**, not a separate storage structure — `SELECT ... WHERE pet_id = ? AND category = ? ORDER BY event_date DESC`, backed by a composite index on `(pet_id, category, event_date DESC)`. No duplication of data between views.

---

# Ch. 7 — Reminder Engine (Phase 1)

## 7.1 Architecture

**Concept:** Centralized reminder system that auto-generates from visit logs (vaccines, medications, follow-ups, deworming) **plus** user-created manual reminders **plus** recurring schedules. Pure logic — no AI call of any kind is involved in Phase 1.

**Reminder Types:**
1. **Auto-generated:** Created automatically when a visit log entry has a due-date-bearing field (vaccine booster, deworming next-due, medication end-date, explicit follow-up date)
2. **Manual:** User-created reminders (vet appointment, grooming, custom task) — independent of any visit log
3. **Recurring:** Repeating reminders (monthly flea treatment, quarterly deworming) with configurable repeat intervals

```python
# app/timeline/services/reminder_engine.py

RULE_ENGINE_OWNS = [
    "vaccination",      # from vaccine type's booster interval (e.g. Rabies +365d)
    "deworming",         # +90 days from date given
    "anti_tick",         # per product schedule
    "medication_end",    # start_date + duration
    "follow_up",         # explicit follow_up_date entered in the form
]
```

Because the Phase 1 form always captures an explicit date for anything reminder-worthy (booster interval, medication duration, or an explicit follow-up date field), there is no need for AI interpretation of ambiguous notes in Phase 1 — that class of problem (implied, undated follow-ups buried in doctor's notes) only exists once free-text diary extraction is introduced in Phase 2, which is exactly where `AI_REMINDER_INTERPRETS` (Ch. 14) picks up.

## 7.2 Reminder Object Schema

```
Reminder {
  id UUID,
  pet_id UUID,
  source_event_id UUID,             -- NULL for manual reminders
  linked_event_id UUID,             -- optional link to existing timeline event
  type TEXT,                         -- vaccination | deworming | anti_tick | medication_end | follow_up |
                                    --   medication | vet_visit | grooming | weight_check | custom |
                                    --   monitoring | conditional (Phase 2 only)
  title TEXT,
  description TEXT,
  due_date DATE,
  due_time TIME,
  priority TEXT,                     -- high | medium | low
  status TEXT,                       -- pending | completed | missed | snoozed
  repeat_type TEXT,                  -- none | daily | weekly | bi_weekly | monthly | quarterly |
                                    --   bi_annually | annually | custom
  custom_repeat_interval INTEGER,   -- Every [X]...
  custom_repeat_unit TEXT,           -- days | weeks | months
  end_repeat_type TEXT,              -- never | after_count | on_date
  end_repeat_date DATE,
  end_repeat_count INTEGER,
  notes TEXT,
  is_ai_generated BOOLEAN,          -- always false in Phase 1
  created_at TIMESTAMPTZ
}
```

## 7.3 Add/Edit Reminder Form

| Field | Type | Required | Options / Values |
|-------|------|----------|-----------------|
| Pet | Dropdown | Yes | User's pets |
| Reminder Title | Text Input | Yes | Max 100 chars |
| Reminder Type | Dropdown | Yes | Medication, Vaccination, Vet Visit, Grooming, Deworming, Anti-Tick, Weight Check, Custom |
| Description | Text Area | No | Max 300 chars |
| Due Date | Date Picker | Yes | Calendar |
| Due Time | Time Picker | No | — |
| Priority | Segmented Control | Yes | Low (Teal), Medium (Amber), High (Red) |
| Repeat | Dropdown | No | None, Daily, Weekly, Bi-weekly, Monthly, Quarterly, Bi-annually, Annually, Custom |
| Custom Repeat | Number + Unit | Conditional | Every [X] [Days/Weeks/Months] — shown only when Repeat = Custom |
| End Repeat | Date Picker / Number | No | Never, After [X] occurrences, On [Date] |
| Link to Event | Dropdown | No | Link to existing timeline event |
| Notes | Text Area | No | Max 300 chars |

## 7.4 Priority

- **High (Red):** missed follow-up, medication ending with an active condition, overdue vaccination
- **Medium (Amber):** vaccination/deworming/anti-tick due within the window
- **Low (Teal):** routine weight check-in, grooming, general reminders

## 7.5 Notification & Calendar

Push notification when a due date approaches (configurable lead time). Calendar views: Daily, Weekly, Monthly, Quarterly, Yearly. Recurring reminders auto-generate the next occurrence on completion.

---

# Ch. 8 — Documents Vault & Edit History

## Documents Vault

Any category can carry an attachment (vaccination certificate, lab report, invoice, health passport scan). Documents can be attached to a specific Medical Event Node or to the pet profile directly (e.g. a general health passport not tied to one visit).

## Edit History (replaces v0.4's immutable versioning for Phase 1 data)

Manual entries are directly editable. Every update to a `medical_events` row writes one row to `edit_history` (previous value snapshot, changed fields, timestamp, `changed_by = 'user'`). This gives an audit trail without the overhead of timeline version pointers, which Phase 1 does not need since there's no untrusted writer to protect against.

---

# Ch. 9 — PDF Export & Sharing

## 9.1 Export Screen

- **Header:** "Export Records" — Dark Green, 20px
- **Pet Selector:** Dropdown

**Export Options:**

| Option | Type | Details |
|--------|------|---------|
| Date Range | Date Range Picker | All time, Last year, Last 6 months, Custom |
| Categories | Multi-select Chips | All categories, or select specific (Diagnosis, Medication, Vaccination, etc.) |
| Include Attachments | Toggle | Yes/No — affects file size |
| Include Vet Notes | Toggle | Yes/No |
| Format | Segmented Control | PDF, CSV, Excel |
| PDF Template | Dropdown | Full Report, Summary Only, Vaccination Card, Medication List |

- **Preview Button:** "Preview" — Teal outline button
- **Export Button:** "Generate & Download" — Teal solid button
- **Share Button:** "Share via..." — system share sheet

## 9.2 PDF Preview

- **Header:** "Preview" — Dark Green
- **Content:** In-app PDF viewer with page navigation
- **Pages:**
  1. **Cover:** Pet Name, Photo, Owner Info, Generation Date
  2. **Summary:** Pet profile, health stats, active treatments
  3. **Timeline:** Chronological events (selected categories)
  4. **Details:** Full event details per category
  5. **Attachments:** Thumbnails of linked documents
- **Actions:** "Download PDF", "Share", "Print"

## 9.3 Implementation

Pure backend rendering; no AI involvement. Template engine renders from selected `medical_events` rows (full history, single category, date range, or combination). CSV/Excel exports use the same query pipeline with different output formatters. Useful for boarding facilities, new vets, or travel documentation.

---

# Ch. 10 — Duplicate Detection (Simplified for Manual Entry)

Because data is human-entered and verified at the point of entry, duplicate risk is lower than in the old AI-extraction pipeline, but accidental double-submission still happens (e.g. resubmitting a form after a slow network response).

```
event_hash = SHA256(pet_id + category + event_date + primary_field)
```

Where `primary_field` is category-dependent (vaccine name for vaccination, medication name for medication, diagnosis name for diagnosis, etc.). If an identical hash exists for the same pet within the same day, the UI warns "This looks like a duplicate of an entry from today — save anyway?" rather than silently blocking. The heavier near-duplicate scoring system from v0.4 (multi-field similarity thresholds) is deferred to Phase 2, where it becomes genuinely necessary again because AI-extracted diary entries are not human-typed and carry real ambiguity.

---

# Ch. 11 — Phase 2 Overview: The AI-Optional Overlay

Everything below this point is **optional**. It requires a configured Gemini API key and is entirely absent from the Phase 1 product experience if that key is not set — there is no "fallback mode" messaging needed, because Phase 1 is not a fallback, it's the product.

Phase 2 adds exactly two capabilities, both reusing the 2-call design already proven out in v0.4:

**(a) Diary Auto-Extraction (Call 1)** — upload a Pet Diary (PDF/images spanning multiple past visits) and have Gemini pre-fill the *same* Master Vet Visit Form for each detected visit, instead of typing them all by hand. The user still reviews and confirms every field before anything is saved — extraction never writes directly to the medical record.

**(b) AI & Community Insight Notes (Call 2)** — once events exist (manually entered or AI-extracted, it doesn't matter which), Gemini can generate a plain-language summary and suggested-actions note for each event, plus one overall summary for the pet, plus AI-interpreted reminders for the class of due-dates a form can't capture (implied follow-ups in free text). Community-sourced context is a further layer on top of this, described in Ch. 16.

---

# Ch. 12 — Call 1: Unified Diary Extraction (Phase 2)

## Core constraint (unchanged from v0.4)

> One diary upload = exactly one Gemini call, regardless of how many visits it contains.

**Input:** Raw file via Gemini File API URI.

**What Gemini does in one shot:** vision understanding of the whole document, visit segmentation, and structured JSON output per visit — including a **category classification per sub-entry**, so extraction output maps directly onto the Phase 1 category model instead of a separate schema.

**Output — `ExtractionBundle` JSON** (per visit, may fan out into multiple category-tagged draft nodes sharing a `visit_group_id`, exactly like a multi-category manual entry):

```json
{
  "extraction_metadata": {
    "total_visits_detected": 8,
    "confidence_overall": 0.91,
    "document_quality": "good"
  },
  "draft_events": [
    {
      "visit_group_id": "generated-uuid",
      "category": "vaccination",
      "source_page_range": [1, 2],
      "ocr_raw_text": "...",
      "event_date": "",
      "clinic": "",
      "doctor": "",
      "fields": { "vaccine_name": "", "dose": "", "next_due_date": "" },
      "confidence": { "event_date": 0.95, "vaccine_name": 0.9 },
      "misc": []
    }
  ]
}
```

## Where the draft lands

Each `draft_events[]` entry is inserted as a `medical_events` row with `source = 'ai_extracted'`, `verification_status = 'pending'`. **It renders inside the exact same Master Vet Visit Form UI used for manual entry** — pre-filled instead of blank, with low-confidence fields (`confidence < 0.75`) highlighted for mandatory review. The user edits or confirms, and on save the row flips to `verification_status = 'verified'`. From that point on it is indistinguishable from a manually entered node except for the `source` flag — same table, same category engine, same reminder engine, same edit history.

**Async processing:** Call 1 runs as a background task; the endpoint returns `202 Accepted` immediately and the frontend is notified when extraction completes.

---

# Ch. 13 — Call 2: Unified Intelligence (Phase 2)

## Core constraint (unchanged from v0.4)

> One insight generation run = exactly one Gemini call for the whole pet, regardless of event count.

**Input:** All verified `medical_events` rows for the pet (manual and AI-extracted alike — the engine does not distinguish).

**What Gemini does in one shot:** per-node insights for every verified event, one collective insight for the pet's whole history, and AI-interpreted reminders for the small set of cases a structured form cannot capture.

**Output — `IntelligenceBundle` JSON:** unchanged in shape from v0.4 (`node_insights[]`, `collective_insight`, `reminder_note.identified_reminders[]`) — see v0.4 Ch. 5 for the full schema; it is reused as-is here.

## Storage

- `node_insights[]` → `medical_event_insights` table (new in Phase 2), keyed by `event_id`
- `collective_insight` → structured columns in `pol_analyses` (new in Phase 2)
- `reminder_note.identified_reminders[]` → `reminders` rows with `is_ai_generated = true`

This is the only place AI writes anything reminder-shaped; it is strictly additive to the Phase 1 rule-based reminders, never a replacement.

---

# Ch. 14 — Reminder Boundary (Rule Engine vs AI, Phase 2)

```python
RULE_ENGINE_OWNS = [
    "vaccination", "deworming", "anti_tick", "medication_end", "follow_up",
]  # unchanged from Phase 1 — always active, AI or no AI

AI_REMINDER_INTERPRETS = [
    "monitoring",    # doctor's note implies weight/condition monitoring, no explicit date
    "conditional",   # "review if symptoms persist" style notes
]  # only reachable through Call 2 output, only relevant to AI-extracted diary text
```

`follow_up` moved fully into `RULE_ENGINE_OWNS` in Phase 1 because the manual form always asks for an explicit follow-up date — there is no ambiguity left for AI to resolve there. Only `monitoring` and `conditional` remain genuinely AI-only, because they only arise from free-text doctor's notes inside an uploaded diary, which the manual form doesn't produce.

---

# Ch. 15 — Behaviour When AI Is Off or Unavailable

There is no special "fallback pipeline" to design in Phase 2, because Phase 1 never assumed AI in the first place. If no Gemini key is configured, or Gemini is down:

- The Master Vet Visit Form, Category Timeline, Reminder Engine, Documents Vault, and PDF/CSV/Excel Export all work exactly as normal — nothing about them depends on AI.
- The "Upload a Pet Diary" entry point is simply hidden or shown as disabled with an explanatory tooltip.
- Existing `node_insights` / `collective_insight` content (if previously generated) remains visible and readable; it just stops updating until AI is available again.

This is a strictly simpler story than v0.4's fallback design, because there is nothing to fail over *to* — the baseline already is the fully-functional product.

---

# Ch. 16 — Community-Powered Insights (Phase 3, Deferred)

Unchanged in concept from v0.4 Ch. 21: Medical Records → AI → Community Knowledge → Personalised Insights, with one-way hashed `anonymous_pet_id`, PII stripped, and a minimum cohort size before any community data is surfaced. This remains out of scope until Phase 1 and Phase 2 are both stable in production.

---

# Ch. 17 — AI Abstraction Layer (Phase 2)

Unchanged from v0.4 Ch. 23. All Gemini interactions pass through `ai_provider_base.py` → `gemini_adapter.py`, standardising request format, response schema, error handling, token accounting, and future provider switching. Token logging (`ai_token_logs`) is mandatory on every Phase 2 call.

---

# Ch. 18 — Architecture Invariants

1. Phase 1 (F1–F6) has zero runtime dependency on Gemini or any external AI provider. It must pass all tests with the AI adapter entirely absent from the environment.
2. Manual entries are `verified` on save; AI-extracted entries are `pending` until a human confirms them through the same form used for manual entry.
3. Category is a required field on every category entry and is the default grouping key for the timeline; chronological view is secondary.
4. The rule engine always runs for `RULE_ENGINE_OWNS` types, in both phases, with or without AI configured.
5. AI never writes directly to `medical_events`, `reminders`, or any user-facing table — `mutation_engine.py` / `insight_engine.py` apply all writes, and AI-originated draft rows require human verification before they count as real records.
6. Every AI-generated insight carries a mandatory `medical_disclaimer`, enforced at the schema level.
7. `anonymous_pet_id` (Phase 3) is always a one-way hash, never a reversible reference.
8. Reference data models (Medicine DB, Vaccine DB, Shampoo DB, Diagnosis taxonomy) are preloaded and available offline — they do not depend on any external API.

---

# Ch. 19 — Open Questions

1. Should `visit_group_id` be exposed as a first-class "Visit" entity in a future version, or remain a soft grouping key?
2. What is the right lead time (days before due date) for reminder notifications, and should it be user-configurable per reminder type?
3. Cold storage strategy for pets with years of history.
4. Long-term AI abstraction for multiple LLM providers beyond Gemini.
5. Minimum cohort threshold for Phase 3 community data sharing.
6. Multi-pet household timeline views.
7. Vet-facing collaborative editing (a vet directly logging into a client's pet record).
8. Reference data update strategy — how to push new medicines/vaccines to existing installs without overwriting user customisations.

---

# Ch. 20 — Final End-to-End Summary

## Flow A — Manual Entry (Phase 1, the only flow that has to exist)

```
User taps "+ Log a Visit"
        │
        ▼
Common Fields: Pet, Date, Time, Clinic (searchable),
Vet Name, Visit Type (chips), Reason, Notes
        │
        ▼
Category Selector: user adds chips
(Diagnosis, Medication, Vaccination, Deworming,
 Anti-Tick/Flea, Grooming, Other)
        │
        ▼
Each chip reveals its form section (one of 3 types):
  - Consultation & Vitals (diagnosis)
  - Treatment & Medication (medication/vaccination/deworming/anti-tick)
  - Procedure & Diagnostics (grooming/other)
Shared core fields (70%) + context-specific fields (30%)
Reference data dropdowns for names, dosing, vaccines
        │
        ▼
User fills entries, optionally adds more categories/entries,
optionally attaches documents, sets follow-up date
        │
        ▼
Save → medical_events row inserted with category_entries JSONB
        (source='manual', verification_status='verified')
        │
        ▼
Rule Engine fires immediately → reminders created for
vaccination / deworming / anti_tick / medication_end / follow_up
(auto-generated type)
        │
        ▼
Category Timeline Engine renders entries
in their respective category buckets, newest-first
        │
        ▼
User can create manual/recurring reminders independently
        │
        ▼
User can export a PDF/CSV/Excel summary at any time
with template, category, and date-range selection + preview
```

## Flow B — AI-Assisted Entry (Phase 2, entirely optional)

```
User uploads a Pet Diary (PDF/images)
        │
        ▼
[GEMINI CALL 1] Unified Extraction (async, one call)
Output: draft_events[] — category-tagged, per visit
        │
        ▼
Each draft renders inside the SAME Master Vet Visit Form,
pre-filled, low-confidence fields flagged
        │
        ▼
User reviews and confirms → verification_status='verified'
        (from here on, identical to Flow A)
        │
        ▼
[GEMINI CALL 2] Unified Intelligence (async, one call,
across all verified events for the pet — manual + AI alike)
Output: node_insights[] + collective_insight + AI reminder_note
        │
        ▼
Insight cards render alongside the timeline;
AI reminders (monitoring/conditional) merge with rule-based ones
```

## Five Core Principles

1. **Functional before intelligent** — the full product works with AI switched off
2. **Category-first, chronology-second** — the timeline organises by what the data *is* before it organises by when it happened
3. **One form, two entry paths** — manual typing and AI extraction both terminate in the same verified `medical_events` row shape
4. **Deterministic reminders, AI-augmented (optionally)** — the rule engine owns every date-bearing field the form already captures; AI only interprets what free text can produce
5. **2-Call Gemini constraint (Phase 2 only)** — when AI is enabled, extraction is one call and intelligence is one call, regardless of volume
