# @SAD_v0.4

# AI Timeline — Software Architecture Document (SAD)

## Phase 1 — Draft 4 (2-Call Architecture)

**Version:** 0.4
**Status:** Architectural Design — Updated
**Previous Version:** 0.3
**Change Summary:** Collapsed Gemini call chain from N+2 calls to exactly 2 calls per upload. Added async processing queue, `medical_event_insights` table, structured `pol_analyses` columns, defined duplicate similarity thresholds, scoped AI vs rule-based reminder boundary, and added timeline rollback design.

---

# Ch. 1 — Vision & Scope

## Vision

The AI Timeline is the medical intelligence layer of PetOLife.

Instead of storing medical reports as isolated files, the system transforms them into an organized medical history that continuously grows throughout a pet's lifetime.

The generated timeline becomes the foundation for future features such as:

- Smart reminders
- Vet-friendly history navigation
- AI health summaries
- Pattern understanding
- Predictive health analysis (Future)
- AI veterinarian assistant (Future)

## Goals

Transform uploaded medical records into:

- Verified structured data
- Chronological timeline
- Medical event summaries
- Collective medical understanding
- Smart reminders

while keeping human verification at the center of the pipeline.

## Non Goals

Phase 1 will NOT:

- Diagnose diseases
- Prescribe medicines
- Replace veterinarians
- Perform predictive healthcare
- Perform risk scoring

Every AI output is informational and must contain appropriate medical disclaimers.

---

# Ch. 2 — High-Level Architecture

## Architectural Principles

- **Human verified AI** — no AI reasoning occurs until user confirms extracted data
- **AI assists, backend controls** — AI proposes, backend applies all mutations
- **Immutable timeline versions** — append-only history, no overwrites
- **Incremental updates** — only new records trigger new Gemini calls
- **2-Call Gemini constraint** — every upload produces exactly two Gemini calls, regardless of visit count
- **Async AI processing** — Gemini calls never block HTTP request threads
- **AI abstraction layer** — all Gemini calls pass through a provider-agnostic adapter
- **Modular services** — each engine is independently replaceable

---

# Ch. 3 — Functional Scope

The AI Timeline consists of seven logical modules.

**M1 — Document Acquisition**
Input: PDFs, Images, Existing uploaded records

**M2 — Gemini Unified Extraction (Call 1)**
Produces: ExtractionBundle JSON — OCR text and structured medical events for all visits in one call.

**M3 — Timeline Builder**
Creates Medical Event Nodes from verified extraction data.

**M4 — Insight Generation (Call 2)**
Creates per-node insights, collective insight, and AI-interpreted reminders — all in one call.

**M5 — Collective Insight Engine**
Builds complete understanding of the pet's medical history from Call 2 output.

**M6 — Timeline Engine**
Produces chronological timeline from verified Medical Event Nodes.

**M7 — Reminder Engine**
Hybrid: rule engine generates routine reminders independently; AI-interpreted reminders come from Call 2 output.

---

# Ch. 4 — Data Acquisition Layer

Two independent data sources are supported.

## A — Pet Diary Upload

Primary entry path for the entire pipeline. Recommended for first-time timeline generation.

Requirements:
- PDF or Multiple Images
- Maximum upload 10 MB
- Multiple pages supported

The Pet Diary should ideally contain at least **5 verified medical visits** before a complete AI Timeline can be generated. If fewer visits exist, the system informs the user that the generated timeline may be incomplete.

## B — Existing Medical Records

For records already uploaded to PetOLife. No re-upload required. Users select existing records or upload a single record. Leads to a minimal insights generation path (Call 2 only, since events are already extracted).

---

# Ch. 5 — Gemini Vision & Verification Layer (2-Call Architecture)

## Core Constraint

> One upload = exactly two Gemini calls, always.

This replaces the previous architecture that generated N+2 calls per upload (where N = number of medical visits).

| Scenario | Old Call Count | New Call Count |
|---|---|---|
| Pet Diary with 5 visits | 8–9 calls | **2 calls** |
| Pet Diary with 10 visits | 13–14 calls | **2 calls** |
| Incremental update (1 new record) | 3–4 calls | **2 calls** |
| AI unavailable | Fails | 0 calls (rule-based fallback) |

---

## Call 1 — Unified Extraction Call

**Purpose:** Replace the separate OCR step and Medical JSON generation step with a single multimodal call.

**Input:** Raw file sent via Gemini File API URI.

**What Gemini does in one shot:**
- Performs vision understanding on the entire document
- Identifies and separates individual medical visits
- Produces structured Medical JSON for all visits
- Embeds the raw OCR text it read per visit

**Output — `ExtractionBundle` JSON:**

```json
{
  "extraction_metadata": {
    "total_visits_detected": 8,
    "confidence_overall": 0.91,
    "document_quality": "good",
    "pages_processed": 12
  },
  "medical_events": [
    {
      "visit_index": 1,
      "source_page_range": [1, 2],
      "ocr_raw_text": "...",
      "pet": {
        "name": "", "species": "", "breed": "", "age": "", "sex": ""
      },
      "visit": {
        "date": "", "doctor": "", "clinic": "", "reason": ""
      },
      "diagnosis": [],
      "medications": [],
      "vaccinations": [],
      "deworming": [],
      "anti_tick": [],
      "weight": "",
      "follow_up": "",
      "doctor_notes": "",
      "confidence": {
        "date": 0.95,
        "diagnosis": 0.88,
        "medications": 0.92,
        "vaccinations": 0.97
      },
      "misc": []
    }
  ]
}
```

**Key design points:**
- `ocr_raw_text` is preserved per event — nothing extracted is ever discarded
- `source_page_range` maps each event to its source pages, enabling precise human verification in the UI
- `confidence` is per-field (not global), so the frontend can highlight low-confidence fields for user attention
- `misc[]` captures unrecognised entities and unmapped text for later user review
- The entire diary is processed in one network round-trip to Gemini

**Async processing:** Call 1 is enqueued as a background task immediately after upload. The endpoint returns `202 Accepted`. The frontend polls `ocr_status` or receives a WebSocket notification when extraction completes.

---

## Human Verification Stage (Between Call 1 and Call 2)

This is not a Gemini call. It is the mandatory human gate.

The `ExtractionBundle` is stored in the database with `ocr_status = 'extracted'`. The frontend renders each medical event for the user to review and correct. Fields with `confidence < 0.75` are flagged for mandatory review. Only after the user confirms all events does the backend proceed to Call 2.

**This gate is inviolable: Call 2 only ever receives verified data.**

---

## Call 2 — Unified Intelligence Call

**Purpose:** Replace all per-node insight calls, the collective insight call, and the AI reminder interpretation call with a single batched call.

**Input:** All verified `medical_event` rows for this pet, retrieved from the database (not from Call 1 output — Call 1 output may have been edited by the user during verification).

**What Gemini does in one shot:**
- Generates per-node insights for every verified event
- Generates a collective insight summarising the pet's complete medical history
- Generates an AI reminder note for visits requiring interpretation (conditional follow-ups, monitoring instructions — not routine vaccines)

**Output — `IntelligenceBundle` JSON:**

```json
{
  "node_insights": [
    {
      "event_id": "uuid-of-verified-medical-event",
      "human_summary": "...",
      "visit_understanding": "...",
      "suggested_actions": [
        { "type": "continue_medication", "detail": "..." },
        { "type": "follow_up", "detail": "..." }
      ],
      "medical_disclaimer": "This is informational only and not a substitute for veterinary advice."
    }
  ],
  "collective_insight": {
    "overall_summary": "...",
    "hierarchical_summary": {
      "by_year": {},
      "by_condition": {},
      "treatment_progression": ""
    },
    "active_conditions": [],
    "vaccination_status": {}
  },
  "reminder_note": {
    "identified_reminders": [
      {
        "type": "follow_up",
        "title": "...",
        "due_date": "YYYY-MM-DD",
        "source_event_id": "uuid",
        "confidence": 0.95,
        "ai_generated": true
      }
    ]
  }
}
```

**Key design points:**
- `node_insights[]` is keyed by `event_id` so the backend can route each insight to its corresponding event row without ambiguity
- `reminder_note` produces a typed array that the backend maps directly to `reminders` table rows with `is_ai_generated = true`
- `collective_insight` maps directly to the structured columns in `pol_analyses`
- `medical_disclaimer` is mandatory on every node insight — never omitted

**Async processing:** Call 2 is also enqueued as a background task after the user completes verification. The endpoint returns `202 Accepted`. The frontend receives a notification when the IntelligenceBundle is ready.

---

## How Both JSONs Flow Into the Database

After Call 1 completes:
- Full `ExtractionBundle` stored in `medical_records.extracted_json`
- Each visit in `medical_events[]` inserted as a row in `medical_events` with `verification_status = 'pending'`

After user verification and Call 2 completes:
- `IntelligenceBundle.node_insights[]` → each row upserted into `medical_event_insights` (keyed by `event_id`)
- `IntelligenceBundle.collective_insight` → stored into structured columns in `pol_analyses`
- `IntelligenceBundle.reminder_note.identified_reminders[]` → inserted as rows in `reminders` with `is_ai_generated = true`

The backend then independently runs the rule engine to generate rule-based reminders (`is_ai_generated = false`). Both sets are merged and deduplicated before any frontend query.

---

# Ch. 6 — Standardized Medical JSON Schema

The extraction pipeline converts every uploaded document into a unified schema:

```json
{
  "pet": {
    "name": "", "species": "", "breed": "", "age": "", "sex": ""
  },
  "visit": {
    "date": "", "doctor": "", "clinic": "", "reason": ""
  },
  "diagnosis": [],
  "medications": [],
  "vaccinations": [],
  "deworming": [],
  "anti_tick": [],
  "weight": "",
  "follow_up": "",
  "doctor_notes": "",
  "confidence": {},
  "misc": []
}
```

## Misc Field

The `misc` section stores unknown entities, unmapped text, and unsupported observations. Nothing extracted is ever discarded. These entries can be mapped to known fields later through user review.

---

# Ch. 7 — Timeline Builder Engine

**Purpose:** Transform verified JSON into timeline nodes.

**Chosen approach: Medical Event Nodes.** Every hospital visit becomes one node containing: visit date, diagnosis, medication, vaccination, doctor notes, follow-up, weight, and observations.

This preserves visit context, enables natural chronology, supports better AI reasoning, and makes vet navigation straightforward.

Category views (by medication, by vaccination, etc.) are generated through indexing and query filtering at read time — not through a separate storage architecture.

---

# Ch. 8 — Medical Event Node Architecture

Each Medical Event Node is the canonical unit of the timeline. It stores:

- All structured fields from the verified Medical JSON
- `event_hash` (SHA-256) for duplicate detection
- `source_page_range` linking back to the original document pages
- `verification_status` — only `verified` nodes appear in the timeline
- `timeline_version` — the version at which this node was appended
- `ai_version` — which model version generated the extraction

Nodes are immutable once verified. Corrections create a new version of the node; the previous version is marked `superseded` and preserved in audit history.

---

# Ch. 9 — AI Insight Generation Engine

Per-node insights are generated as part of **Call 2** — not as individual calls. All verified nodes are sent together in one request. Gemini returns an `IntelligenceBundle` containing a `node_insights[]` array, one entry per `event_id`.

Each node insight contains:
- **Human Summary** — simple plain-language explanation of the visit
- **Visit Understanding** — "What happened during this visit?"
- **Suggested Actions** — informational only (continue medication, follow vaccination schedule, monitor weight, revisit veterinarian)
- **Medical Disclaimer** — mandatory on every node

Node insights are stored in the `medical_event_insights` table, keyed by `event_id`. The backend serves them independently per node to the frontend.

---

# Ch. 10 — Collective Insight Engine

**Purpose:** Understand the complete medical history.

Generated as part of **Call 2** inside `IntelligenceBundle.collective_insight`. Gemini receives all verified Medical Event Nodes together (the same payload already sent for node insights — no additional call needed).

## Generated Outputs

**Hierarchical Summary:** Organised by years, medical conditions, and treatment progression.

**Overall Summary:** One concise understanding of the pet's complete medical history (capped at 200 words by prompt instruction).

## Incremental Update Rule

Future updates never regenerate the entire Collective Insight. Instead:

> Existing `pol_analyses` record (structured columns) + New verified Medical Event Nodes → Call 2 → Updated `pol_analyses` version

This minimises token usage while preserving continuity. The existing structured summary is passed as context to Call 2 on subsequent uploads.

## Storage

Collective insight is stored in structured columns in `pol_analyses` (not as a single wide JSONB blob):
- `overall_summary TEXT`
- `hierarchical_summary JSONB`
- `active_conditions JSONB`
- `vaccination_status JSONB`
- `insight_version INTEGER`
- `token_count INTEGER` (for cost tracking)

---

# Ch. 11 — POL Bot Analysis Architecture

## Purpose

The POL Bot Analysis is the **persistent AI intelligence layer** for each pet. It is a structured, version-controlled representation of the AI Timeline's complete understanding of the pet's medical history — not a conversation history.

## Design Principles

- One persistent POL Bot Analysis per pet
- Version-controlled after every accepted timeline update
- Stores structured outputs only — never prompts or raw extracted text
- Acts as the authoritative AI context for future Call 2 executions
- Designed to remain model-agnostic for future migration beyond Gemini

## Stored Components

Each POL Bot Analysis version contains:
- Current Timeline Version
- Overall Summary (text)
- Hierarchical Medical Summary (JSONB)
- Active Medical Conditions (JSONB)
- Vaccination Status (JSONB)
- Medication History (via `medical_events` join)
- Reminder Dataset (via `reminders` join)
- Insight Version number
- Token count (for cost monitoring)

## AI Context Strategy

Gemini receives only:
- Current POL Bot Analysis structured columns (not raw prompts)
- Newly verified Medical Event Nodes

Gemini does not receive: previous prompts, previous extracted text, or previous raw documents.

---

# Ch. 12 — Incremental Update Pipeline

## Objective

Avoid rebuilding the AI Timeline from scratch whenever a new medical record is uploaded. Only new information is processed.

## Processing Logic

Only newly uploaded records undergo:
- Call 1 (Gemini Unified Extraction)
- Human verification
- Event node creation

For Call 2, the existing `pol_analyses` structured summary is passed as context alongside the new verified nodes. Gemini incrementally updates the collective insight — it does not reprocess the entire history.

The existing timeline remains untouched until the mutation engine approves the new version.

## Benefits

- Faster generation (smaller payload to Gemini on updates)
- Lower token usage (existing history is passed as structured summary, not raw records)
- Preserves historical consistency
- Easier rollback
- Lower processing cost

---

# Ch. 13 — Deterministic Timeline Mutation Engine

## Purpose

Gemini must never directly modify the timeline. AI proposes insights — backend applies updates.

## Mutation Rules

**Allowed mutations:**
- Append new Medical Event Node
- Update reminder schedule
- Update treatment continuity
- Extend medication history
- Update vaccination status
- Increment timeline version

**Forbidden mutations:**
- Delete historical visits
- Rewrite previous diagnoses
- Modify verified node content
- Change timeline chronology
- Write directly to `medical_events` without passing through `mutation_engine.py`

## Why Deterministic?

AI outputs may vary. Timeline consistency cannot. AI understands — backend decides.

---

# Ch. 14 — Conflict Resolution & Duplicate Detection

## Duplicate Detection

Each Medical Event receives an Event Hash generated from:
- Visit Date
- Doctor
- Diagnosis
- Medication
- Source Document ID

`event_hash = SHA256(visit_date + doctor + diagnosis_list + medication_list + source_doc_id)`

If identical hashes exist → the record is treated as a duplicate and rejected.

## Near-Duplicate Detection

If hashes differ but records are similar, the backend performs similarity checks using defined thresholds:

```python
NEAR_DUPLICATE_CONFIG = {
    "date_proximity_days": 3,
    "doctor_similarity_score": 0.80,
    "diagnosis_overlap_pct": 0.60,
    "medication_overlap_pct": 0.50
}
```

- All four conditions exceed threshold → auto-merge
- Two or three conditions exceed threshold → flag for manual user review
- Fewer than two conditions exceed threshold → treat as a distinct new event

## Conflict Detection & Resolution

**Example:** Doc A records Weight = 18 kg; Doc B records Weight = 21 kg for the same visit date → conflict detected.

**Resolution priority:**
1. Verified User Data
2. Latest Verified Correction
3. Higher field-level confidence score
4. Latest Document Upload
5. Original Record (if unresolved)

**Resolution strategy:** Backend never deletes conflicting data.
- Keep original node
- Create corrected node version
- Mark previous node as `superseded`
- Preserve full audit history

---

# Ch. 15 — Reminder Engine

## Architecture

Hybrid: Rule Engine + AI Assistance (from Call 2) = Reminder Objects

```python
# Boundary definition — enforced in reminder_engine.py

RULE_ENGINE_OWNS = [
    "vaccination",      # Annual / schedule-based intervals
    "deworming",        # Every 90 days
    "anti_tick",        # Schedule-based
    "medication_end",   # End-of-course reminder from medication duration
]

AI_REMINDER_INTERPRETS = [
    "follow_up",        # Doctor note implies future review without an explicit date
    "monitoring",       # Doctor note implies weight or condition monitoring
    "conditional",      # "Review if symptoms persist" style notes
]
```

The rule engine always runs first and generates reminders for `RULE_ENGINE_OWNS` types deterministically. Call 2's `reminder_note` output only generates `reminders` rows for `AI_REMINDER_INTERPRETS` types. Both sets are merged and deduplicated before frontend queries.

## Reminder Object Schema

```
Reminder {
  id UUID,
  pet_id UUID,
  source_event_id UUID,
  type TEXT,
  title TEXT,
  due_date DATE,
  frequency TEXT,
  status TEXT,
  is_ai_generated BOOLEAN,
  created_at TIMESTAMPTZ
}
```

## Reminder Priority

- **High:** Missed follow-up, critical medication ending
- **Medium:** Vaccination due
- **Low:** Weight monitoring, routine check-up

## Calendar Views

Generated reminders support: Daily, Weekly, Monthly, Quarterly, Yearly.

---

# Ch. 16 — Timeline Lifecycle, Versioning & Rollback

## Lifecycle States

Each AI Timeline progresses through: `initialising → processing → extracted → verification_pending → verified → insight_generating → active → updating`

## Timeline Version History

Every accepted update creates:
- New `timeline_versions` row
- New `pol_analyses` version row
- Updated reminders in `reminders` table

Nothing is overwritten. All previous versions remain readable.

## Rollback Design

Rollback is a first-class operation, not future work.

**Endpoint:**
```
POST /api/v2/pets/{pet_id}/timeline/rollback
Body: { "target_version": N }
```

**Logic:**
1. Set pet's `active_timeline_version = N` in `pet_profiles`
2. Filter `medical_events WHERE timeline_version <= N`
3. Recompute reminders from those events only
4. Retrieve `pol_analyses WHERE version = N`
5. Return timeline at version N

No data is deleted. `active_timeline_version` is a pointer, not a destructive state change.

---

# Ch. 17 — Async Processing Architecture

All Gemini calls are backgrounded. They never block HTTP request threads.

## Call 1 Flow

```
POST /api/v2/pets/{pet_id}/documents/{doc_id}/ocr
→ Update ocr_status = 'processing'
→ Return 202 Accepted immediately

Background task (FastAPI BackgroundTasks / Celery):
→ Execute Call 1 (Gemini Unified Extraction)
→ Store ExtractionBundle in medical_records.extracted_json
→ Insert N rows into medical_events (status: 'pending')
→ Update ocr_status = 'extracted'
→ Notify frontend via WebSocket / SSE
```

## Call 2 Flow

```
POST /api/v2/pets/{pet_id}/timeline/generate-insights
→ Return 202 Accepted immediately

Background task:
→ Fetch all verified medical_events for this pet
→ Fetch current pol_analyses structured summary (incremental context)
→ Execute Call 2 (Gemini Unified Intelligence)
→ Upsert IntelligenceBundle.node_insights → medical_event_insights
→ Update pol_analyses (new version)
→ Insert AI reminders → reminders (is_ai_generated=true)
→ Run rule engine → insert rule-based reminders (is_ai_generated=false)
→ Run mutation_engine.py → increment timeline_version
→ Notify frontend via WebSocket / SSE
```

**Phase 1:** Use FastAPI `BackgroundTasks`.
**Scale path:** Migrate to Celery + Redis if concurrent upload volume grows.

---

# Ch. 18 — Service Decomposition & API Flow

## Text Extraction Service (`ocr_service.py`)
- Upload handling and file parsing
- Gemini File API upload
- Call 1 prompt execution and response parsing
- ExtractionBundle storage

## Verification Service
- JSON validation
- User edits application
- Verification status transitions
- SHA-256 event hash computation

## Timeline Builder Service (`event_builder.py`)
- Medical Event Node creation from verified JSON
- Metadata assignment
- Source page mapping

## Insight Service (`insight_engine.py`)
- Call 2 prompt execution
- IntelligenceBundle parsing
- `medical_event_insights` upsert
- `pol_analyses` structured update

## Mutation Service (`mutation_engine.py`)
- Conflict and duplicate detection (using defined thresholds)
- Timeline version increment
- Append-only history enforcement

## Reminder Service (`reminder_engine.py`)
- Rule engine execution for `RULE_ENGINE_OWNS` types
- AI reminder insertion from Call 2 output for `AI_REMINDER_INTERPRETS` types
- Deduplication and merge of both sets
- Calendar generation

## Token Logging (`gemini_adapter.py`)
Every Gemini call logs: operation name, pet_id, input token count, output token count, model version, and timestamp. This enables cost dashboards and quota alerting without a schema change later.

---

# Ch. 19 — Fallback Architecture

## Goal

Provide uninterrupted timeline generation even when Gemini is unavailable (quota exhausted, API down, rate limited, or internet issues). Users never see "AI unavailable."

## Detection

Before every AI call: health check → Gemini available?

```
If true  → AI Pipeline (2-call architecture)
If false → Rule-Based Fallback Pipeline
```

The frontend never changes. Only backend routing changes. `X-Timeline-Mode: AI` or `X-Timeline-Mode: Fallback` header informs the frontend which mode is active.

## Fallback Data Sources

Known pet information from Pet Profile (name, species, breed, age, gender, weight, owner) and a manual Quick Vet Visit form.

**Suggested fallback form fields:** Visit Date, Clinic (optional), Reason for Visit, Diagnosis, Medication, Vaccination Given, Weight, Follow-up Date, Doctor Notes, Treatment Status.

## Fallback Processing

```
Medical Events
→ Sort by Date (deterministic)
→ Generate Timeline Cards (raw field display, no AI summary)
```

Reminder Engine in fallback mode: entirely rule-based. Example: Rabies Vaccination → +365 days, Deworming → +90 days, Follow-up exists → reminder on follow-up date, Medication → end-date reminder.

Both pipelines produce identical `medical_events` schema rows. When Gemini recovers, the backend automatically upgrades Basic Timeline entries to AI Timeline entries without requiring any user re-entry.

---

# Ch. 20 — Compare & Analysis

## Text Extraction Architecture

**Google File API + Gemini Vision (Recommended)**
- Native multimodal understanding, excellent document comprehension, handles PDFs and images, minimal preprocessing
- Trade-off: vendor dependency, token costs

**Separate OCR Engine (PaddleOCR, TrOCR, DocTR)**
- Full control, self-hostable, lower long-term cost
- Trade-off: additional infrastructure, lower document understanding without an LLM layer

## Prompt Storage vs Structured Output Storage

**Store Structured Outputs Only (Recommended)**
- Smaller storage, model-independent, easier migration, cleaner architecture, better privacy
- Trade-off: harder prompt debugging (mitigated by token logging in the adapter)

---

# Ch. 21 — Community-Powered Insights

Instead of: Medical Records → AI → Insights

PetOLife AI Timeline becomes: Medical Records → AI → Community Knowledge → Personalised Insights

The AI reasons about your pet while the community provides context from similar pets. Architecture for Community + AI Insights: `CommXai_architecture`.

**Anonymisation:** `anonymous_pet_id` is a one-way SHA-256 hash of the real `pet_id` — not reversible. PII stripped: pet name, owner name, clinic name, doctor name, and source documents are never included in `experience_cards`. Combination of breed + diagnosis + age is considered quasi-identifier and is only shared when the cohort size exceeds a minimum threshold (to be defined before Milestone 10).

---

# Ch. 22 — Fall Back Mechanisms

Covered in Ch. 19. See async fallback flow and rule-based timeline cards.

---

# Ch. 23 — Future Architecture & AI Abstraction Layer

All AI interactions pass through `ai_provider_base.py`:

```
Timeline Service
→ AI Adapter (ai_provider_base.py)
→ Gemini (Phase 1)
→ PetOLife Model (Future)
→ Other LLM Providers (Optional)
```

The AI Adapter standardises: request format, response schema, error handling, token accounting, and provider switching.

Future enhancements: in-house medical language models, Retrieval-Augmented Generation (RAG), vector embeddings for semantic history search, predictive health analytics, vet-facing clinical copilots.

---

# Ch. 24 — Open Questions (Think More)

1. Migration strategy from Gemini to PetOLife proprietary models
2. Long-term AI abstraction layer for multiple LLM providers
3. Cold storage strategy for archived medical records
4. Efficient retrieval strategy for pets with hundreds of medical visits
5. Embedding-based semantic retrieval for future AI assistants
6. Multi-pet shared household timeline architecture
7. Veterinary collaborative editing workflows
8. Fine-grained permission models for clinics and pet owners
9. Minimum cohort threshold for community anonymised data sharing
10. Event sourcing versus snapshot storage for timeline reconstruction

---

# Ch. 25 — Architecture Invariants (Answers to Things That Sound Off)

1. Timeline generation is blocked or clearly marked as limited if fewer than five verified medical visits are available.
2. Call 2 is never triggered until the user has completed the human verification stage for all events from Call 1.
3. Mutation logic remains entirely deterministic. AI output from Call 2 is never written directly to any table — `mutation_engine.py` and `insight_engine.py` apply all writes.
4. Every AI-generated suggestion in `node_insights` carries a mandatory `medical_disclaimer` field. This is enforced at the Pydantic schema level — missing disclaimers cause the response to be rejected.
5. `pol_analyses` never stores raw prompts, raw extracted text, or the `ExtractionBundle`. Only structured insight output is persisted.
6. The rule engine always runs for `RULE_ENGINE_OWNS` reminder types regardless of whether Gemini is available.
7. `anonymous_pet_id` in `experience_cards` is always a one-way hash — never a foreign key or reversible reference to `pet_profiles`.

---

# Ch. 26 — Phase 1 Scope Diversions

1. Async background task architecture (Ch. 17) extends the stated MVP scope but is required to prevent HTTP timeouts on large diary uploads. It must be included in Phase 1.
2. Token logging in the Gemini adapter is a Phase 1 addition not in the original roadmap. Its cost is negligible; its value for cost monitoring is immediate.
3. Rollback endpoint (Ch. 16) is a Phase 1 first-class design, not future work, because the versioning data is already being stored.
4. POL Bot Analysis persistence extends beyond the stated MVP but is required to make Call 2's incremental context strategy work.
5. Community-Powered Insights (Ch. 21) remain Phase 2.
6. Predictive health analytics and AI veterinarian assistant remain Future phases.

---

# Ch. 27 — Final End-to-End Architecture Summary (2-Call Architecture)

```
           Data Source
   (Pet Diary / Existing Records)
                │
                ▼
  [M1] Document Acquisition
  Store file → Insert medical_records row
                │
                ▼
  [GEMINI CALL 1] — Unified Extraction       ← Async background task
  Input:  Raw file (PDF/Images)
  Output: ExtractionBundle JSON
          - ocr_raw_text per visit
          - Structured medical event per visit
          - Per-field confidence scores
                │
                ▼
  Backend stores ExtractionBundle
  Inserts N rows → medical_events (status: pending)
  ocr_status = 'extracted'
                │
                ▼
  [Human Verification Stage]
  Frontend renders each event for review
  User edits, confirms, or rejects fields
  Fields with confidence < 0.75 flagged
  Backend updates medical_events (status: verified)
                │
                ▼
  [GEMINI CALL 2] — Unified Intelligence     ← Async background task
  Input:  All verified medical_event rows
          + Current pol_analyses summary (incremental context)
  Output: IntelligenceBundle JSON
          - node_insights[] (one per event_id)
          - collective_insight
          - reminder_note (AI-interpreted reminders only)
                │
                ▼
  Backend stores IntelligenceBundle
  Upsert → medical_event_insights (per event)
  Update → pol_analyses (new version, structured columns)
  Insert → reminders (is_ai_generated=true)
                │
                ▼
  [Deterministic Backend Processing]
  Rule engine → reminders (is_ai_generated=false)
  Mutation engine → timeline version increment
  Deduplication + conflict resolution
                │
                ▼
  [M6] Timeline Engine
  Chronological sort of verified events
  Timeline version finalised
                │
                ▼
  [M7] Reminder Engine
  Rule-based + AI reminder sets merged
                │
                ▼
  Frontend: Timeline UI + Insight Cards + Reminder Calendar
```

## Five Core Principles

1. **Verified before intelligent** — no AI reasoning occurs until extracted data is user-confirmed
2. **Medical Event Nodes as the canonical data model** — preserving chronological context for users and veterinarians
3. **2-Call Gemini constraint** — every upload produces exactly two Gemini calls regardless of diary size
4. **Deterministic backend control** — AI proposes, backend governs all mutations, conflicts, and timeline integrity
5. **Modular, future-ready architecture** — enabling migration from Gemini to PetOLife's own AI models without redesigning the surrounding system