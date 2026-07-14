# PetNoter-Style Medical Timeline — Backend & Database Implementation Specification
## Version 6.0 (Manual-First Foundation + Optional AI Layer)

**Previous Version:** 5.0 (2-Call AI-Centric Architecture)

**Change Summary (v5.0 → v6.0), IR:**
- Unified `medical_events` schema now serves manual entries and AI-extracted entries identically — added `category` and `entry_source` columns, made `confidence`/`field_confidence` nullable, defaulted `verification_status = 'verified'` for manual rows.
- New synchronous manual-entry routers: `vet_visits.py`, `vaccinations.py`, `medications.py`, `deworming_anti_tick.py`, `general_notes.py` — all write directly to `medical_events`, no background task involved.
- Reminder Engine now runs synchronously on form submission (no async task needed — there's no external API call in Phase 1).
- Timeline endpoint now defaults to `group_by=category`, with `group_by=date` as an explicit alternate query param.
- `ocr.py`, `insights.py`, and the async Gemini task infrastructure are retained but re-scoped as **Phase 2, feature-flagged, entirely optional** — a pet/account can run with `ai_enabled = false` forever.
- `timeline_versions` + `/rollback` demoted to Phase 2/3; a lightweight `event_edit_history` table replaces it for Phase 1 audit needs.
- Community tables (`community_consent`, `experience_cards`) demoted to Phase 3.

---

## 1. System Overview & Integration Strategy

1. **Manual-first routing:** `/api/v2/pets/{pet_id}/vet-visits`, `/vaccinations`, `/medications`, `/deworming`, `/general-notes` are synchronous, single-request-response endpoints. No `202 Accepted`, no background worker — the request completes with the created row and its generated reminders in one round trip.
2. **AI routing is isolated and optional:** everything Gemini-related lives under `/api/v2/pets/{pet_id}/ai/...` and is gated by a per-pet or per-account `ai_enabled` flag. If `ai_enabled = false`, these routes 403 with a clear "AI features not enabled for this pet" message — they never silently no-op into the core pipeline.
3. **Shared Service Layer unchanged in spirit:** common CRUD still lives in `app/services/`.
4. **Database Backward Compatibility:** all changes remain additive. Existing `medical_events` rows (if any existed from the old 2-call draft) simply get `entry_source = 'ai_extracted'` backfilled and `category` backfilled from `event_type`.

---

## 2. Integrated Backend Folder Architecture

```text
backend/
├── app/
│   ├── main.py                              # Mounts V2 routers; AI routers mounted under /ai
│   ├── config.py                            # SUPABASE_URL, GEMINI_API_KEY (optional, may be unset)
│   ├── supabase_client.py
│   ├── services/
│   │   ├── pet_service.py
│   │   ├── medical_event_service.py         # [NEW] shared insert/update logic for ALL categories
│   │   ├── reminder_service.py              # [NEW] rule-based reminder generation, called synchronously
│   │   └── pdf_export_service.py            # [NEW] category-grouped PDF generation
│   └── routers/
│       └── v2/
│           ├── pet_profile.py
│           ├── vet_visits.py                # [NEW] manual vet-visit form endpoint
│           ├── vaccinations.py              # [NEW] manual vaccination form endpoint
│           ├── medications.py               # [NEW] manual medication form endpoint
│           ├── deworming_anti_tick.py       # [NEW] manual deworming/anti-tick form endpoint
│           ├── general_notes.py             # [NEW] manual general health note endpoint
│           ├── documents.py                 # document vault upload/list/delete
│           ├── timeline.py                  # category-first + chronological views
│           ├── reminders.py                 # calendar + list views
│           ├── export.py                    # [NEW] PDF export endpoint
│           └── ai/                          # [Phase 2 — feature-flagged]
│               ├── ocr.py                   # Gemini Call 1 — Unified Extraction
│               ├── insights.py              # Gemini Call 2 — Unified Intelligence
│               └── community.py             # [Phase 3] anonymised community insights
├── timeline/
│   ├── schemas/
│   │   ├── medical_event.py                 # [NEW] single unified Pydantic model, all categories
│   │   ├── extraction.py                    # Phase 2 — ExtractionBundle
│   │   └── intelligence.py                  # Phase 2 — IntelligenceBundle
│   ├── services/
│   │   ├── event_builder.py                 # form/AI output → medical_events row (shared by both paths)
│   │   ├── reminder_engine.py               # pure rule-based logic, no AI dependency
│   │   ├── ocr_service.py                   # Phase 2 — Call 1 orchestration
│   │   └── insight_engine.py                # Phase 2 — Call 2 orchestration
│   └── adapters/
│       ├── ai_provider_base.py              # Phase 2 — abstract interface
│       └── gemini_adapter.py                # Phase 2 — only imported if ai_enabled
└── utils/
    └── auth.py
```

---

## 3. Unified Medical Event Schema (Core Contract)

Every manual form and every Gemini extraction converges on this one Pydantic model:

```python
# app/timeline/schemas/medical_event.py

class MedicalEventNode(BaseModel):
    pet_id: UUID
    category: Literal[
        "vet_visit", "vaccination", "medication",
        "deworming", "anti_tick", "document", "general_note"
    ]
    entry_source: Literal["manual", "ai_extracted"] = "manual"
    event_date: date
    event_data: dict          # category-specific structured fields (see Ch.4 of architecture doc)
    linked_visit_id: UUID | None = None
    verification_status: Literal["verified", "pending", "rejected", "superseded"] = "verified"
    confidence: float | None = None            # null for manual rows
    field_confidence: dict | None = None       # null for manual rows
    source_document_id: UUID | None = None
    event_hash: str | None = None              # computed server-side
```

Manual routers construct this model with `entry_source="manual"` and `verification_status="verified"` and hand it to the **same** `event_builder.build_and_insert()` function that Phase 2's `ocr_service.py` eventually calls after a user confirms an AI-extracted candidate.

---

## 4. Manual Entry Endpoints (Phase 1 Core — Synchronous, No AI)

### 4.1. Vet Visit

```
POST /api/v2/pets/{pet_id}/vet-visits
Body: { visit_date, clinic_name?, doctor_name?, reason_for_visit, diagnosis?,
        treatment_plan?, tests_done?, prescriptions?, weight_at_visit?,
        follow_up_date?, doctor_notes?, attachments?[] }

→ event_builder.build_and_insert(category="vet_visit", entry_source="manual")
→ reminder_engine.generate_for_event(event)   # synchronous — no queue
→ 201 Created { medical_event, reminders_created[] }
```

### 4.2. Vaccination

```
POST /api/v2/pets/{pet_id}/vaccinations
Body: { vaccine_name, date_given, dose?, vet_details?, next_due_date?, recurrence? }

→ if next_due_date omitted, backend computes it from recurrence (or default booster table)
→ event_builder.build_and_insert(category="vaccination", entry_source="manual")
→ reminder_engine.generate_for_event(event)
→ 201 Created
```

### 4.3. Medication

```
POST /api/v2/pets/{pet_id}/medications
Body: { medication_name, dosage, frequency, start_date, end_date?, linked_visit_id? }

→ event_builder.build_and_insert(category="medication", entry_source="manual")
→ reminder_engine.generate_for_event(event)   # medication_end reminder if end_date present
→ 201 Created
```

### 4.4. Deworming / Anti-tick

```
POST /api/v2/pets/{pet_id}/deworming
Body: { treatment_type: "deworming" | "anti_tick", date_given, next_due_date? }

→ default next_due_date = date_given + 90 days for deworming, if omitted
→ event_builder.build_and_insert(category=treatment_type, entry_source="manual")
→ reminder_engine.generate_for_event(event)
→ 201 Created
```

### 4.5. General Health Note

```
POST /api/v2/pets/{pet_id}/general-notes
Body: { note_date, title?, note_text, tags?[] }

→ event_builder.build_and_insert(category="general_note", entry_source="manual")
→ 201 Created   # no reminder generated for this category
```

### 4.6. Editing an Existing Event

```
PATCH /api/v2/pets/{pet_id}/medical-events/{event_id}
Body: { any subset of category fields }

→ Logs previous + new value into event_edit_history
→ Updates medical_events row in place
→ Re-runs reminder_engine.generate_for_event(event) if a reminder-relevant field changed
→ 200 OK
```

---

## 5. Timeline & Documents Endpoints

```
GET /api/v2/pets/{pet_id}/timeline?group_by=category   (default)
GET /api/v2/pets/{pet_id}/timeline?group_by=date        (chronological "All Events" view)

→ Default response shape:
{
  "vet_visit":   [ ...events, date-desc... ],
  "vaccination": [ ...events, date-desc... ],
  "medication":  [ ... ],
  "deworming":   [ ... ],
  "anti_tick":   [ ... ],
  "document":    [ ... ],
  "general_note":[ ... ]
}
```

```
POST /api/v2/pets/{pet_id}/documents/upload      # attach to a specific medical_events row or pet-level
GET  /api/v2/pets/{pet_id}/documents
DELETE /api/v2/pets/{pet_id}/documents/{doc_id}
```

---

## 6. Reminder Engine Endpoints

```
GET /api/v2/pets/{pet_id}/reminders?type=&status=&range=monthly
→ Returns rows from `reminders` table. In Phase 1, every row has is_ai_generated=false.
```

Rule table (unchanged logic from the architecture doc, now the *only* source of reminders in Phase 1):

```python
REMINDER_RULES = {
    "vaccination": lambda e: e.next_due_date or (e.date_given + recurrence_offset(e.recurrence)),
    "deworming":   lambda e: e.next_due_date or (e.date_given + timedelta(days=90)),
    "anti_tick":   lambda e: e.next_due_date,
    "medication":  lambda e: e.end_date,
    "vet_visit":   lambda e: e.follow_up_date,   # only if user supplied one
}
```

---

## 7. PDF Export Endpoint

```
GET /api/v2/pets/{pet_id}/export/pdf?categories=all
→ pdf_export_service.generate(pet_id, categories)
→ Groups events by category (matching the in-app view)
→ If ai_enabled and medical_event_insights exist, appends an optional
  "AI Notes (Informational Only)" section at the end — never mixed into
  the core category sections
→ Returns application/pdf
```

---

## 8. Database Schema

### 8.1. `medical_events` (Unified — Manual + AI)

```sql
CREATE TABLE IF NOT EXISTS medical_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN (
        'vet_visit', 'vaccination', 'medication',
        'deworming', 'anti_tick', 'document', 'general_note'
    )),
    entry_source TEXT NOT NULL DEFAULT 'manual'
        CHECK (entry_source IN ('manual', 'ai_extracted')),
    event_date DATE NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}',
    linked_visit_id UUID REFERENCES medical_events(id) ON DELETE SET NULL,
    verification_status TEXT NOT NULL DEFAULT 'verified'
        CHECK (verification_status IN ('verified', 'pending', 'rejected', 'superseded')),
    confidence FLOAT,                          -- NULL for manual rows
    field_confidence JSONB,                     -- NULL for manual rows
    source_document_id UUID REFERENCES medical_records(id) ON DELETE SET NULL,
    event_hash VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Category-first is the default access pattern, so it is the leading index
CREATE INDEX IF NOT EXISTS idx_events_pet_category_date ON medical_events(pet_id, category, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_pet_date ON medical_events(pet_id, event_date DESC); -- chronological view
CREATE INDEX IF NOT EXISTS idx_events_hash ON medical_events(event_hash);
CREATE INDEX IF NOT EXISTS idx_events_data ON medical_events USING gin (event_data);
```

### 8.2. `event_edit_history` (Lightweight audit, replaces heavy versioning for Phase 1)

```sql
CREATE TABLE IF NOT EXISTS event_edit_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES medical_events(id) ON DELETE CASCADE,
    previous_data JSONB NOT NULL,
    new_data JSONB NOT NULL,
    edited_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_edit_history_event ON event_edit_history(event_id);
```

### 8.3. `reminders`

```sql
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
    source_event_id UUID REFERENCES medical_events(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'vaccination', 'deworming', 'anti_tick', 'medication_end',
        'follow_up', 'monitoring', 'conditional'
    )),
    title TEXT NOT NULL,
    due_date DATE NOT NULL,
    frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed')),
    is_ai_generated BOOLEAN NOT NULL DEFAULT false,   -- always false in Phase 1
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminders_pet_date ON reminders(pet_id, due_date);
CREATE INDEX IF NOT EXISTS idx_reminders_pet_status ON reminders(pet_id, status);
```

### 8.4. `documents`

```sql
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
    source_event_id UUID REFERENCES medical_events(id) ON DELETE SET NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    label TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_pet ON documents(pet_id);
```

### 8.5. `pet_profiles` (additive column)

```sql
ALTER TABLE pet_profiles
ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN NOT NULL DEFAULT false;
-- Phase 2 features are entirely gated behind this flag, per pet.
```

---

## 9. Phase 2 — AI Layer Tables & Endpoints (Feature-Flagged, Optional)

Everything below only activates when `pet_profiles.ai_enabled = true`. If false, these endpoints 403.

### 9.1. Endpoints

```
POST /api/v2/pets/{pet_id}/ai/documents/{doc_id}/ocr       # Call 1 — Unified Extraction (async, 202)
GET  /api/v2/pets/{pet_id}/ai/documents/{doc_id}/ocr       # poll ExtractionBundle
PUT  /api/v2/pets/{pet_id}/ai/documents/{doc_id}/verify    # confirm candidates → real medical_events rows
POST /api/v2/pets/{pet_id}/ai/timeline/generate-insights   # Call 2 — Unified Intelligence (async, 202)
GET  /api/v2/pets/{pet_id}/ai/insights/node/{event_id}
GET  /api/v2/pets/{pet_id}/ai/insights/collective
```

`PUT .../verify` is the critical bridge: confirmed candidates are handed to the **same** `event_builder.build_and_insert()` used by the manual routers, with `entry_source="ai_extracted"` and `verification_status="verified"`. From that point on they're indistinguishable from manual rows to the Timeline Engine, Reminder Engine, and PDF Export Engine.

### 9.2. `medical_event_insights`

```sql
CREATE TABLE IF NOT EXISTS medical_event_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES medical_events(id) ON DELETE CASCADE,
    pet_id UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
    human_summary TEXT,
    visit_understanding TEXT,
    suggested_actions JSONB NOT NULL DEFAULT '[]',
    medical_disclaimer TEXT NOT NULL
        DEFAULT 'This is informational only and not a substitute for veterinary advice.',
    insight_type TEXT NOT NULL DEFAULT 'ai' CHECK (insight_type IN ('ai', 'ai_community')),
    ai_model_version VARCHAR(32),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(event_id)
);
```

### 9.3. `pol_analyses`

```sql
CREATE TABLE IF NOT EXISTS pol_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    overall_summary TEXT,
    hierarchical_summary JSONB NOT NULL DEFAULT '{}',
    active_conditions JSONB NOT NULL DEFAULT '[]',
    vaccination_status JSONB NOT NULL DEFAULT '{}',
    token_count INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(pet_id, version)
);
```

### 9.4. `ai_token_logs`

```sql
CREATE TABLE IF NOT EXISTS ai_token_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation TEXT NOT NULL,   -- 'call_1_extraction' | 'call_2_intelligence'
    pet_id UUID REFERENCES pet_profiles(id) ON DELETE SET NULL,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    model_version VARCHAR(32),
    logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 9.5. Phase 3 (deferred entirely): `community_consent`, `experience_cards`, `timeline_versions`, `/rollback`

These remain designed on paper (see the earlier v0.4 draft for full definitions) but are explicitly out of scope until Phase 3, once the manual core and the AI layer are both stable in production.

---

## 10. Migration & Deployment Order

1. Apply `medical_events` unified schema (with `category`, `entry_source`) — additive.
2. Deploy manual routers + `reminder_engine.py` (synchronous) — this alone is a shippable product.
3. Deploy `documents.py`, `export.py` (PDF).
4. Only once the above is stable: deploy the `ai_enabled` flag, `ai/` router namespace, and the Phase 2 Gemini adapter — fully optional, off by default for every pet until explicitly turned on.