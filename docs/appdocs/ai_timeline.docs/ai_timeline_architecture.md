# @SAD_v0.5

# AI Timeline — Software Architecture Document (SAD)

## Phase 1 — Draft 5 (Manual-First, Logic-Driven Core / AI-Optional Overlay)

**Version:** 0.5
**Status:** Architectural Design — Major Pivot
**Previous Version:** 0.4 (2-Call AI-first Architecture)

**Change Summary (v0.4 → v0.5):**
This is a foundational architectural pivot, not an incremental change.

- The product is re-scoped to a **PetNoter-parity medical record app**: pet profiles, manual vet-visit/vaccination/medication logging, a documents vault, a deterministic reminder engine, and shareable PDF reports. This is now **Phase 1 — the entire functional product**, and it ships with **zero AI dependency**.
- All data entry in Phase 1 is **manual**, via a structured **Vet Visit Form** filled by the human after every appointment. There is no OCR, no extraction, no "diary upload" in Phase 1.
- The Timeline is now **category-first**, not date-first. Medical Event Nodes are grouped by category (Vet Visit, Vaccination, Medication, Deworming, Anti-tick, Weight, Lab/Test, Surgery, Custom); date ordering happens *within* each category, not across the whole timeline by default.
- The Reminder Engine and Timeline Engine are pure logic — no Gemini involvement anywhere in Phase 1.
- Everything AI-related from v0.4 (Gemini Vision extraction, per-node insights, collective insight, AI-interpreted reminders, the 2-call constraint, async task infra, fallback-mode framing) is **not removed** — it is **demoted to Phase 2**, an optional overlay bolted on top of the Phase 1 foundation. Phase 2 reuses the 2-call design from v0.4 almost unchanged, but re-framed: AI now *feeds into* the same manual form and the same medical_events table, instead of being a parallel pipeline with its own fallback story.
- Because Phase 1 has no AI, there is no more "fallback mode" concept — Phase 1 *is* the baseline experience. Phase 2 simply adds an assistive layer on top when Gemini is configured and available.

---

# Ch. 1 — Vision & Scope

## Vision

The AI Timeline (internally still named for continuity) is PetOLife's medical record system. Its job, in order of priority, is to be a **complete, dependable, manual medical log first**, and an **AI-assisted convenience layer second**.

A pet owner should be able to use the entire product — profile, visit logging, vaccination tracking, medication tracking, documents, reminders, PDF export — without ever touching an AI feature, without an API key configured, and without any degradation in reliability.

## Goals — Phase 1 (Core, No AI)

- A structured, per-pet medical record built entirely from human-entered data
- A category-first timeline (Vaccinations, Medications, Vet Visits, Deworming/Anti-tick, Weight, Documents, Custom)
- A deterministic reminder engine that never depends on an external service
- A documents vault for certificates, reports, and lab results
- A shareable PDF summary for vets, boarding facilities, or a new clinic

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
| **F2 — Manual Vet Visit Form** | The single data-entry surface for every medical event: vet visit, vaccination, medication, deworming, anti-tick, weight, lab test, surgery, or custom note. |
| **F3 — Documents Vault** | Upload and store certificates, vet reports, lab results, health passports, invoices — attached to a pet or to a specific event. |
| **F4 — Category Timeline Engine** | Groups Medical Event Nodes by category (not date) as the default view; chronological "all events" view available as a toggle. |
| **F5 — Reminder Engine (Rule-Based)** | Deterministic scheduling: vaccination boosters, deworming, anti-tick, medication end-dates, explicit follow-up dates. Push/notification-ready. |
| **F6 — PDF Export** | Generates a shareable, vet-ready summary from selected medical records. |

Everything else — Gemini extraction, AI insights, community insights — is **Phase 2** and is described starting at Ch. 11. None of it is required for F1–F6 to work.

---

# Ch. 4 — Category-First Data Model

## Why category-first

The previous design treated the Medical Event Node as a chronological unit first, with category views generated at read time as a secondary index. That is now inverted: **category is the primary lens** a pet owner uses ("show me all vaccinations", "show me current medications"), and date ordering happens inside that lens.

## Categories

```
vet_visit     — general appointment: diagnosis, treatment plan, follow-up
vaccination   — vaccine name, dose, next due date
medication    — drug name, dosage, frequency, start/end
deworming     — product, date, next due
anti_tick     — product, date, next due
weight        — weight value + unit, for trend tracking
lab_test      — test type, result summary, report upload
surgery       — procedure name, surgeon/clinic, recovery notes
custom        — free-form title + notes for anything uncategorised
```

## The Medical Event Node

Every submission of the Vet Visit Form creates one Medical Event Node. It stores:

- `category` — the single category this node belongs to (drives which fields were shown/required in the form)
- `visit_group_id` — an optional shared identifier linking multiple nodes created from the *same physical appointment* (e.g. a visit where the vet gave a vaccination **and** started a medication produces two nodes, both tagged with the same `visit_group_id`, so the UI can still show "everything from the March 4th visit" when needed)
- All category-relevant structured fields (see Ch. 5)
- `source` — `manual` or `ai_extracted` (Phase 2 only)
- `verification_status` — `verified` (manual entries are verified on save) or `pending`/`rejected` (AI-extracted entries awaiting human confirmation, Phase 2 only)
- `event_hash` — for duplicate detection
- `created_at` / `updated_at`

Manual entries are **directly editable** — Phase 1 does not need an immutable append-only versioning system, because there is no untrusted AI writer to guard against. A lightweight `edit_history` audit table (Ch. 8) is enough to answer "what changed and when," without the complexity of timeline version pointers and rollback endpoints. That machinery returns in Phase 2, scoped specifically to AI-originated data (Ch. 13).

---

# Ch. 5 — Manual Vet Visit Form (Core Phase 1 Deliverable)

This is the single most important screen in Phase 1. It replaces AI extraction entirely as the way data enters the system.

## Design principle: progressive disclosure by category

The form is one screen, not a wizard. It always shows a **Category selector** at the top. Selecting a category reveals only the fields relevant to that category. This avoids presenting one giant form with mostly-irrelevant fields.

## Fields shown for every category (common block)

| Field | Type | Required |
|---|---|---|
| Event Date | date picker, defaults to today | Yes |
| Clinic / Vet Name | text | No |
| Attachments | file upload (image/PDF) | No |
| Notes | free text | No |

## Category-specific fields

**Vet Visit / Diagnosis**
- Reason for visit (required)
- Diagnosis (tag input, multiple values)
- Treatment plan (text)
- Follow-up date (optional — feeds the reminder engine directly, no AI interpretation needed)
- Treatment status (Ongoing / Completed)

**Vaccination**
- Vaccine name (autocomplete: Rabies, DHPP, Bordetella, FVRCP, FeLV, Custom)
- Dose / batch number (optional)
- Next due date — **auto-suggested** by the rule engine from the vaccine type's booster interval, editable by the user

**Medication**
- Medication name (required)
- Dosage (required)
- Frequency (dropdown: once daily, twice daily, custom)
- Start date (required) + Duration (days) — auto-computes an end date, which feeds the `medication_end` reminder
- Linked diagnosis (optional)

**Deworming / Anti-tick**
- Product name (required)
- Date given (required)
- Next due date — auto-suggested (default +90 days for deworming; editable), following the same pattern as vaccination

**Weight**
- Weight value + unit (kg/lb) — plotted automatically on a weight-trend view

**Lab Test / Report**
- Test type
- Result summary
- Report upload (encouraged, not strictly required)

**Surgery / Procedure**
- Procedure name
- Surgeon / clinic
- Recovery notes
- Follow-up date

**Custom / Other**
- Free-form title + notes — the safety valve for anything that doesn't fit a defined category, so nothing is ever blocked from being logged

## Multi-category visits

A single real appointment often spans more than one category (e.g. an annual checkup that also includes a booster shot). The form supports **"Add another entry for this visit"**, which:
1. Keeps the just-entered Date and Clinic pre-filled
2. Lets the user pick a new category and fill only that category's fields
3. Tags the new node with the same `visit_group_id` as the first

This keeps category as the atomic sorting/storage unit while still letting the UI reconstruct "everything that happened on this visit" on demand.

## How it's showcased

- **Entry point:** a prominent "+ Log a Visit" action from the pet's profile screen
- **Category chips** at the top of the form (icon + label), single-select, drives field visibility
- **Inline auto-suggestions** for due dates (vaccination/deworming/anti-tick) shown as an editable pre-filled value, not a locked field — the user can always override the rule engine's suggestion
- **Confirmation toast** on save: "Added to [Category] · Next reminder: [date]" — ties the form directly to the reminder it just created, reinforcing that reminders come from data the user just entered, not a black box

---

# Ch. 6 — Category Timeline Engine

**Purpose:** Transform Medical Event Nodes into the views the user actually browses.

## Default view — Category Grouped

```
Vet Visits        [newest → oldest]
Vaccinations      [newest → oldest]
Medications       [newest → oldest]
Deworming / Anti-tick   [newest → oldest]
Weight            [chart + list, newest → oldest]
Lab Tests         [newest → oldest]
Surgery           [newest → oldest]
Custom            [newest → oldest]
```

Each category is its own scrollable/tabbed section. Within a category, sorting is strictly by `event_date` descending. This is the default landing view.

## Secondary view — All (Chronological)

A toggle merges every category into one date-sorted feed, for users who want a single narrative view or are preparing for a vet visit and want "everything in order." This is the *old* default view from v0.4 — it still exists, it's just no longer the primary one.

## Implementation note

Category grouping is a **read-time query**, not a separate storage structure — `SELECT ... WHERE pet_id = ? AND category = ? ORDER BY event_date DESC`, backed by a composite index on `(pet_id, category, event_date DESC)`. No duplication of data between views.

---

# Ch. 7 — Reminder Engine (Rule-Based, Phase 1)

## Architecture

Pure logic. No AI call of any kind is involved in Phase 1.

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

## Reminder Object Schema

```
Reminder {
  id UUID,
  pet_id UUID,
  source_event_id UUID,
  type TEXT,               -- vaccination | deworming | anti_tick | medication_end | follow_up
  title TEXT,
  due_date DATE,
  frequency TEXT,
  priority TEXT,            -- high | medium | low
  status TEXT,               -- pending | completed | missed
  is_ai_generated BOOLEAN,   -- always false in Phase 1
  created_at TIMESTAMPTZ
}
```

## Priority

- **High:** missed follow-up, medication ending with an active condition
- **Medium:** vaccination/deworming/anti-tick due
- **Low:** routine weight check-in

## Notification & Calendar

Push notification when a due date approaches (configurable lead time). Calendar views: Daily, Weekly, Monthly, Quarterly, Yearly — unchanged from v0.4.

---

# Ch. 8 — Documents Vault & Edit History

## Documents Vault

Any category can carry an attachment (vaccination certificate, lab report, invoice, health passport scan). Documents can be attached to a specific Medical Event Node or to the pet profile directly (e.g. a general health passport not tied to one visit).

## Edit History (replaces v0.4's immutable versioning for Phase 1 data)

Manual entries are directly editable. Every update to a `medical_events` row writes one row to `edit_history` (previous value snapshot, changed fields, timestamp, `changed_by = 'user'`). This gives an audit trail without the overhead of timeline version pointers, which Phase 1 does not need since there's no untrusted writer to protect against.

---

# Ch. 9 — PDF Export

Generates a shareable, vet-ready PDF from selected Medical Event Nodes — either a full history, a single category (e.g. "vaccination record only"), or a date range. Pure backend rendering; no AI involvement. Useful for boarding facilities, new vets, or travel documentation.

---

# Ch. 10 — Duplicate Detection (Simplified for Manual Entry)

Because data is human-entered and verified at the point of entry, duplicate risk is lower than in the old AI-extraction pipeline, but accidental double-submission still happens (e.g. resubmitting a form after a slow network response).

```
event_hash = SHA256(pet_id + category + event_date + primary_field)
```

Where `primary_field` is category-dependent (vaccine name for vaccination, medication name for medication, etc.). If an identical hash exists for the same pet within the same day, the UI warns "This looks like a duplicate of an entry from today — save anyway?" rather than silently blocking. The heavier near-duplicate scoring system from v0.4 (multi-field similarity thresholds) is deferred to Phase 2, where it becomes genuinely necessary again because AI-extracted diary entries are not human-typed and carry real ambiguity.

---

# Ch. 11 — Phase 2 Overview: The AI-Optional Overlay

Everything below this point is **optional**. It requires a configured Gemini API key and is entirely absent from the Phase 1 product experience if that key is not set — there is no "fallback mode" messaging needed, because Phase 1 is not a fallback, it's the product.

Phase 2 adds exactly two capabilities, both reusing the 2-call design already proven out in v0.4:

**(a) Diary Auto-Extraction (Call 1)** — upload a Pet Diary (PDF/images spanning multiple past visits) and have Gemini pre-fill the *same* Manual Vet Visit Form for each detected visit, instead of typing them all by hand. The user still reviews and confirms every field before anything is saved — extraction never writes directly to the medical record.

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

Each `draft_events[]` entry is inserted as a `medical_events` row with `source = 'ai_extracted'`, `verification_status = 'pending'`. **It renders inside the exact same Vet Visit Form UI used for manual entry** — pre-filled instead of blank, with low-confidence fields (`confidence < 0.75`) highlighted for mandatory review. The user edits or confirms, and on save the row flips to `verification_status = 'verified'`. From that point on it is indistinguishable from a manually entered node except for the `source` flag — same table, same category engine, same reminder engine, same edit history.

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

- The Manual Vet Visit Form, Category Timeline, Reminder Engine, Documents Vault, and PDF Export all work exactly as normal — nothing about them depends on AI.
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
3. Category is a required field on every `medical_events` row and is the default grouping key for the timeline; chronological view is secondary.
4. The rule engine always runs for `RULE_ENGINE_OWNS` types, in both phases, with or without AI configured.
5. AI never writes directly to `medical_events`, `reminders`, or any user-facing table — `mutation_engine.py` / `insight_engine.py` apply all writes, and AI-originated draft rows require human verification before they count as real records.
6. Every AI-generated insight carries a mandatory `medical_disclaimer`, enforced at the schema level.
7. `anonymous_pet_id` (Phase 3) is always a one-way hash, never a reversible reference.

---

# Ch. 19 — Open Questions

1. Should `visit_group_id` be exposed as a first-class "Visit" entity in a future version, or remain a soft grouping key?
2. What is the right lead time (days before due date) for reminder notifications, and should it be user-configurable per reminder type?
3. Cold storage strategy for pets with years of history.
4. Long-term AI abstraction for multiple LLM providers beyond Gemini.
5. Minimum cohort threshold for Phase 3 community data sharing.
6. Multi-pet household timeline views.
7. Vet-facing collaborative editing (a vet directly logging into a client's pet record).

---

# Ch. 20 — Final End-to-End Summary

## Flow A — Manual Entry (Phase 1, the only flow that has to exist)

```
User taps "+ Log a Visit"
        │
        ▼
Category selector → category-specific fields revealed
        │
        ▼
User fills form, optionally attaches a document,
optionally adds another category entry for the same visit_group_id
        │
        ▼
Save → medical_events row inserted
        (source='manual', verification_status='verified')
        │
        ▼
Rule Engine fires immediately → reminders created for
vaccination / deworming / anti_tick / medication_end / follow_up
        │
        ▼
Category Timeline Engine renders the new node
in its category bucket, newest-first
        │
        ▼
User can export a PDF summary at any time
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
Each draft renders inside the SAME Manual Vet Visit Form,
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
