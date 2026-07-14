# @SAD_v0.6

# PetNoter-Style Medical Timeline — Software Architecture Document (SAD)

## Phase 1 Rebuild — Manual-First Foundation, AI as an Optional Layer

**Version:** 0.6
**Status:** Architectural Pivot — Superseded v0.4/v0.5 (2-Call AI-Centric Draft)
**Previous Version:** 0.4 (2-Call Gemini Architecture)

**Change Summary (v0.4/0.5 → v0.6):**
This is a full architectural pivot, not an incremental patch, IR. The previous drafts treated Gemini extraction and insight generation as the spine of the product, with a rule-based path only as a *fallback*. That relationship is now inverted:

- **The core product is now 100% manual, logic-driven, and AI-free.** Pet profile, vet-visit logging, vaccination logging, medication logging, document storage, category-based timeline, and reminder scheduling all work without ever calling an LLM.
- **AI (Gemini) becomes an additive Phase 2 layer**, bolted on top of the same data model, used only for (a) auto-extracting vet visits from an uploaded pet diary to pre-fill the manual pipeline, and (b) generating AI/community insight notes on top of already-existing medical events.
- **Medical Event Nodes are now sorted primarily by category**, not strictly by date. Date remains the secondary sort key inside each category.
- Scope has been trimmed to PetNoter's core medical workflow: pet profile → health record logging → reminders → shareable PDF report. Community insights, rollback-as-a-first-class-endpoint, and heavy AI infra are demoted to explicitly-optional Phase 2/3 add-ons.

---

# Ch. 1 — Vision & Scope

## Vision

The Medical Timeline is the health-record backbone of the app. Its job, in the simplest possible terms, is this:

> Enter a medical event → save it against the pet's profile → attach documents if any → schedule the right reminder → notify the owner → export a clean history when visiting the vet.

That loop is the entire product. Everything else (AI extraction, AI insights, community layer) is decoration added *on top* of that loop later — never a prerequisite for it.

## Goals (Phase 1 — Manual Core)

- A pet profile that holds identity data and owns a completely separate medical history per pet.
- A structured form-based entry point for every medical event type: vet visit, vaccination, medication, deworming/anti-tick, and general health note.
- A category-first medical timeline (not a strictly chronological feed).
- A document vault for certificates, lab reports, and health passports.
- A fully rule-based reminder engine — no AI dependency at all.
- A vet-ready PDF export.

## Goals (Phase 2 — AI Layer, Optional)

- Auto-extract vet visits from an uploaded pet diary (PDF/images) using the Gemini API, pre-filling the same manual form fields for human confirmation.
- Generate AI (and later, AI + community) insight notes attached to existing medical events — never replacing the human-entered data, only annotating it.

## Non-Goals (Both Phases)

- Diagnosing disease, prescribing medication, or replacing a veterinarian.
- Predictive health analytics or risk scoring.
- Making AI a required step anywhere in the core flow. If Gemini is disabled, deleted, or never configured, the app must work exactly the same — same forms, same timeline, same reminders, same PDF.

---

# Ch. 2 — High-Level Architecture

## Architectural Principles

- **Manual-first, functional-first** — the entire medical workflow is built and fully usable with zero AI involvement.
- **Human is the primary data source** — a vet-visit form filled by the owner is trusted data, not a "verification pending" AI output. It is saved as `verified` the moment it's submitted.
- **Category as the primary organizing axis** — medical nodes are grouped and sorted by category first (vaccination, medication, vet visit, deworming/anti-tick, document, general note), and by date only within a category.
- **Deterministic engines own the product** — the Timeline Engine and the Reminder Engine are pure logic: no LLM call anywhere in their execution path.
- **AI is additive, never load-bearing** — Gemini extraction and Gemini insights write into the *same* tables a human would write into. Nothing downstream (timeline, reminders, PDF export) needs to know or care whether a row came from a form or from an AI extraction.
- **Single unified schema** — `medical_events` has one shape for both manually-entered and AI-extracted rows, distinguished only by an `entry_source` field.
- **Modular services** — Timeline Engine, Reminder Engine, Document Vault, and PDF Export Engine are independently replaceable and have no dependency on the AI adapter.

---

# Ch. 3 — Functional Scope

## Phase 1 — Manual Core (no AI, ships first)

**M1 — Pet Profile**
Name, species, breed, date of birth, sex, weight baseline. Each pet owns a fully isolated medical history.

**M2 — Manual Entry Forms**
One structured form per event category: Vet Visit, Vaccination, Medication, Deworming/Anti-tick, General Health Note. Each form maps directly onto the unified `medical_events` schema.

**M3 — Medical Event Node Builder**
Converts a submitted form directly into a `medical_events` row. No extraction step, no confidence scoring, no verification gate — the row is created as `verification_status = 'verified'` on submission because a human authored it.

**M4 — Category-Based Timeline Engine**
Groups Medical Event Nodes by `category`, sorted by date (descending) within each category. A secondary "All Events (chronological)" view remains available for users who want the classic date-ordered feed.

**M5 — Reminder Engine (Rule-Based)**
Generates every reminder deterministically from form data: vaccination boosters, deworming cycles, anti-tick schedules, medication end-dates, and explicit follow-up dates.

**M6 — Document Vault**
Stores certificates, lab reports, and health passports, attached to a specific medical event or to the pet profile generally.

**M7 — PDF Export Engine**
Produces a vet-ready summary PDF from selected (or all) medical events, grouped by category.

## Phase 2 — AI Layer (optional, additive)

**M8 — Gemini Unified Extraction (Call 1)**
Given an uploaded pet diary, produces a set of *candidate* medical events — pre-filled versions of the same manual form, routed through the normal human-verification screen before they become real `medical_events` rows.

**M9 — AI / Community Insight Layer (Call 2)**
Given existing (already-verified) medical events, generates a human-readable insight note per node, a collective summary across the pet's history, and optionally cross-references anonymized community data. Purely additive — deleting all insight rows changes nothing about the timeline or reminders.

---

# Ch. 4 — Manual Data Acquisition Layer (The Core of Phase 1)

This is the actual foundation of the product, IR — everything else sits on top of it.

## Vet Visit Form

The primary entry point. Fields:

| Field | Type | Notes |
|---|---|---|
| `visit_date` | date | required |
| `clinic_name` | text | optional |
| `doctor_name` | text | optional |
| `reason_for_visit` | text | required |
| `diagnosis` | text / list | optional, free text or tag list |
| `treatment_plan` | text | optional |
| `tests_done` | text / list | optional |
| `prescriptions` | list of {name, dosage, frequency, duration} | optional |
| `weight_at_visit` | number (kg) | optional |
| `follow_up_date` | date | optional |
| `doctor_notes` | text | optional |
| `attachments` | file[] | optional — routes to Document Vault |

## Vaccination Form

| Field | Type | Notes |
|---|---|---|
| `vaccine_name` | text (DHPP, Rabies, Bordetella, FVRCP, FeLV, custom) | required |
| `date_given` | date | required |
| `dose` | text | optional |
| `vet_details` | text | optional |
| `next_due_date` | date | auto-suggested from a booster interval table, editable |
| `recurrence` | enum (weekly / monthly / yearly / custom) | drives the reminder |

## Medication Form

| Field | Type | Notes |
|---|---|---|
| `medication_name` | text | required |
| `dosage` | text | required |
| `frequency` | text | required |
| `start_date` | date | required |
| `end_date` | date | optional — drives the medication-end reminder |
| `linked_visit_id` | uuid (optional FK) | links back to the originating vet visit, if any |

## Deworming / Anti-tick Form

| Field | Type | Notes |
|---|---|---|
| `treatment_type` | enum (deworming / anti_tick) | required |
| `date_given` | date | required |
| `next_due_date` | date | auto-suggested (deworming = +90 days by default), editable |

## General Health Note

Free-form entry for anything that doesn't fit the above — allergy info, spay/neuter record, ad-hoc weight log, custom note. Still becomes a first-class `medical_events` row with `category = 'general_note'`.

**Design intent:** every one of these forms is a thin UI shell over the exact same backend contract. There is no "AI schema" and a separate "manual schema" — there's one schema, and the manual forms simply populate it directly, synchronously, with no background job in between.

---

# Ch. 5 — Medical Event Node Architecture (Unified)

Every Medical Event Node — whether typed in by a human or later extracted by Gemini in Phase 2 — is the canonical unit of the timeline. It stores:

- All structured fields for its category (see Ch. 4 tables)
- `category` — the primary sort/group key: `vaccination | medication | vet_visit | deworming | anti_tick | document | general_note`
- `entry_source` — `manual | ai_extracted`
- `event_hash` (SHA-256) — still used for duplicate detection, computed the same way regardless of source
- `verification_status` — `manual` rows are created as `verified` immediately; `ai_extracted` rows (Phase 2 only) start as `pending` until a human confirms them, at which point they become indistinguishable from a manually-entered row
- `confidence` — `null`/`1.0` for manual rows (there is nothing to have low confidence about — a human typed it); per-field confidence scores only exist for `ai_extracted` rows pre-confirmation

Nodes are editable. An edit updates the row directly (no forced immutable versioning chain for the manual core — see Ch. 10 for what's kept from the old versioning model and what's simplified away).

---

# Ch. 6 — Category-Based Timeline Engine

## Why Category-First

Chronological-only feeds are good for "what happened recently" but bad for "what's this pet's vaccination history" or "what medications has this pet been on." A category-first view answers the second question directly, which is what an owner or a new vet actually needs when reviewing a pet's file.

## Sorting Logic

```
1. Group all verified medical_events by category:
     vaccination, medication, vet_visit, deworming, anti_tick, document, general_note
2. Within each category group, sort by event date, descending (most recent first)
3. Categories are displayed in a fixed, sensible order:
     vet_visit → vaccination → medication → deworming/anti_tick → document → general_note
4. A secondary "All Events" view is still available:
     flattens all categories into one list, sorted purely by date, descending
```

This is pure backend query logic (grouped index + filter), not a separate storage structure — `medical_events(pet_id, category, event_date)` is simply indexed for both access patterns.

## Category View vs. Chronological View

| View | Primary sort | Use case |
|---|---|---|
| Category view (default) | category, then date | "Show me every vaccination this pet has had" |
| Chronological view (secondary) | date only | "What happened to this pet in the last 6 months" |

---

# Ch. 7 — Reminder Engine (Rule-Based, Always-On)

The Reminder Engine in Phase 1 has **no AI involvement whatsoever.** It runs synchronously the moment a form is submitted — there is no async task, no background worker, because there's no external API call to wait on.

```python
# reminder_engine.py — Phase 1 (manual-only)

REMINDER_RULES = {
    "vaccination":  lambda event: event.next_due_date or (event.date_given + recurrence_offset(event.recurrence)),
    "deworming":    lambda event: event.next_due_date or (event.date_given + timedelta(days=90)),
    "anti_tick":    lambda event: event.next_due_date,
    "medication":   lambda event: event.end_date,          # "medication ending" reminder
    "vet_visit":    lambda event: event.follow_up_date,     # only if the user entered one
}
```

- Every reminder is generated the instant its source form is saved.
- Priority: **High** = missed follow-up / medication ending soon, **Medium** = vaccination due, **Low** = routine/weight monitoring.
- Calendar views: daily, weekly, monthly, yearly — same as before, unchanged.
- `is_ai_generated` remains a column on `reminders` for forward-compatibility with Phase 2, but in Phase 1 it is always `false`.

---

# Ch. 8 — Document Vault

Certificates, lab reports, health passports, and vet-visit attachments are stored in object storage and linked either to a specific `medical_events` row (via `source_event_id`) or generally to the pet profile. No processing happens on upload in Phase 1 — files are stored as-is and surfaced in the UI next to the event they belong to.

---

# Ch. 9 — PDF Export Engine

Generates a shareable summary for a new vet, boarding facility, or specialist. The export:

- Groups events by category (matching the in-app category-first view)
- Includes vaccination history, medication history, vet-visit notes, and any attached documents
- Is generated entirely from `medical_events` + `documents` — no AI involvement, no dependency on `medical_event_insights` (those, if present, are optionally appended as a supplementary "AI Notes" section, clearly labeled as informational)

---

# Ch. 10 — Versioning, Kept Simple

The old draft's heavy immutable timeline-version-per-upload model existed because AI extraction needed a clear "what changed on this run" boundary. That boundary mostly disappears once entry is manual and synchronous. What's kept:

- Every edit to a `medical_events` row is logged in an `event_edit_history` table (previous value, new value, timestamp) — enough for an audit trail without a full parallel version-number system.
- `timeline_versions` and a dedicated `/rollback` endpoint are **demoted to Phase 2/3** — they become genuinely useful once AI-driven batch changes (Call 1 re-extraction) can affect many rows at once. For the manual core, a simple edit history is sufficient and much cheaper to build.

---

# Ch. 11 — Phase 2: Gemini Unified Extraction Layer (Call 1)

This is additive on top of Ch. 4–6, not a replacement. Nothing here is required for the app to function.

**Trigger:** user uploads a Pet Diary (PDF/images) and opts into AI extraction.

**What it does:** one Gemini call performs OCR + visit segmentation + structuring in a single pass, producing candidate events in the **same shape** as the manual forms in Ch. 4, with `category` auto-assigned and `entry_source = 'ai_extracted'`.

**Output — `ExtractionBundle` JSON** (unchanged from the earlier draft, still per-field confidence, still `ocr_raw_text` preserved, still `source_page_range` for traceability):

```json
{
  "extraction_metadata": {
    "total_visits_detected": 8,
    "confidence_overall": 0.91,
    "document_quality": "good"
  },
  "medical_events": [
    {
      "category": "vet_visit",
      "entry_source": "ai_extracted",
      "source_page_range": [1, 2],
      "ocr_raw_text": "...",
      "visit": { "date": "", "doctor": "", "clinic": "", "reason": "" },
      "diagnosis": [],
      "medications": [],
      "vaccinations": [],
      "confidence": { "date": 0.95, "diagnosis": 0.88 },
      "misc": []
    }
  ]
}
```

**Critical design point:** the extraction output lands the user on the **exact same verification screen used for manual editing** — it's the vet-visit / vaccination / medication forms from Ch. 4, just pre-filled. Confirming one is functionally identical to typing it in by hand: the row becomes `verification_status = 'verified'`, `entry_source` stays `'ai_extracted'` for provenance, and it now behaves identically to a manual row everywhere downstream (timeline, reminders, PDF export).

---

# Ch. 12 — Phase 2: AI + Community Insight Layer (Call 2)

Also additive. Given a set of already-verified medical events (manual or AI-extracted, no distinction at this point), one Gemini call produces:

- A per-node insight (human summary, "what happened," suggested actions, mandatory medical disclaimer) — stored in `medical_event_insights`, keyed by `event_id`
- A collective summary across the pet's whole history — stored in `pol_analyses`
- Optionally, anonymized community cross-referencing (Ch. 21 of the earlier draft) — explicitly Phase 3, not required for Phase 2 to ship

None of this can mutate `medical_events`, the timeline grouping, or the reminder set. It is read-only annotation layered on top.

---

# Ch. 13 — Unified Data Model Compatibility

The single most important invariant carried through this pivot:

> `medical_events` has exactly one schema. A row created by a human filling in the Vet Visit form and a row created by Gemini Call 1 and then confirmed by a human are structurally identical, except for `entry_source`.

This is what makes AI a true "layer" rather than a parallel system: the Timeline Engine, Reminder Engine, and PDF Export Engine never need an `if ai_extracted` branch anywhere in their logic.

---

# Ch. 14 — Security & Privacy (Brief)

- Row-Level Security (RLS) scoped to `pet_id` → `user_id` ownership on every medical table.
- Document Vault files stored in a private bucket, signed URLs only.
- Phase 3 community anonymization (one-way hash `anonymous_pet_id`, PII stripped) carried over unchanged from the earlier draft, but deferred until Phase 3.

---

# Ch. 15 — Architecture Invariants

1. The app is fully functional — profile, forms, category timeline, reminders, PDF export — with the Gemini adapter never configured or entirely absent.
2. Manual form submissions are saved as `verified` synchronously. There is no pending/verification gate for human-authored data.
3. `medical_events.category` is the primary sort key everywhere the timeline is rendered by default; date is always the secondary key.
4. AI-extracted rows only become real, reminder-generating, PDF-exportable data after passing through the same human confirmation screen used for manual entry.
5. `medical_event_insights` and `pol_analyses` are strictly additive read-layers; deleting every row in both tables must not change the timeline, the reminders, or the PDF export in any way.
6. The Reminder Engine's rule-based rules (Ch. 7) run identically regardless of whether AI is enabled for that pet.

---

# Ch. 16 — End-to-End Flow, Phase 1 (Manual Core)

```
User fills Vet Visit / Vaccination / Medication / Deworming form
        │
        ▼
Medical Event Node Builder
  → Insert medical_events row (category set, entry_source='manual',
     verification_status='verified')
        │
        ▼
Reminder Engine (synchronous, rule-based)
  → Insert reminders row(s) tied to source_event_id
        │
        ▼
Category-Based Timeline Engine
  → Groups & serves events by category, date-desc within category
        │
        ▼
Document Vault (if attachments present)
        │
        ▼
PDF Export Engine (on demand)
  → Vet-ready summary, grouped by category
```

---

# Ch. 17 — End-to-End Flow, Phase 2 (AI-Augmented, Optional)

```
User uploads Pet Diary (opt-in AI extraction)
        │
        ▼
[GEMINI CALL 1] Unified Extraction
  → Candidate medical_events (entry_source='ai_extracted', verification_status='pending')
        │
        ▼
Human Verification Screen (same UI as manual forms, pre-filled)
  → User edits/confirms → verification_status='verified'
  → Row now behaves identically to a manual row
        │
        ▼
[Same Phase 1 pipeline runs unchanged from here]
Reminder Engine → Category Timeline → PDF Export
        │
        ▼
[GEMINI CALL 2] Unified Intelligence (optional, on demand)
  → medical_event_insights (per event) + pol_analyses (collective)
  → Purely additive annotation layer, never mutates core data
```

---