
# HANDOFF SECTION — Backend Contract for Frontend & DB Teams

> **Purpose:** This section is a self-contained snapshot of everything the backend exposes, so the frontend and DB teams can connect without reading the whole build guide. It covers (1) the complete endpoint reference, (2) the backend structure — services and utility functions with their signatures, and (3) the exact database changes. Everything below is **Phase 1** unless marked `[Phase 2]`.

## H0. At-a-glance

- **Base URL:** `${VITE_API_BASE_URL}` (e.g. `http://localhost:8000` in dev). All new endpoints are under `/api/v2/…`. V1 `/api/…` endpoints are unchanged.
- **Auth:** every V2 endpoint requires `Authorization: Bearer <supabase_access_token>` (the same token the frontend already stores in `localStorage.access_token` and injects via `fetchWithAuth`). Missing/invalid token → `401`.
- **Ownership:** every pet-scoped endpoint verifies the JWT user owns `{pet_id}`. Foreign pet → `404` (deliberately not `403`, to avoid leaking existence).
- **Content type:** JSON in/out, except file uploads (`multipart/form-data`) and export downloads (binary blob).
- **IDs:** all IDs are UUID strings.
- **what i shipped:**

```
M1  DB migration + reference-data seed
M2  Shared service layer (refactor V1 pet/medical-record DB access)
M3  V2 routing skeleton + Pydantic schemas (3 form types) + service stubs
M4  Master Vet Visit Form backend (event_service, dedupe, reference_data)
M5  Category Timeline engine (category-grouped + chronological + visit reconstruct)
M6  Reminder engine (auto + manual + recurring)
M7  Documents vault
M8  Export engine (PDF/CSV/Excel + preview)
```

---

## H1. Complete Endpoint Reference

### H1.1 Pet Profile (V2)
| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/api/v2/pets` | pet create fields | created pet |
| GET | `/api/v2/pets` | — | `{ pets: [...] }` |
| GET | `/api/v2/pets/{pet_id}` | — | pet object |
| PUT | `/api/v2/pets/{pet_id}` | `pet_type`, `breed`, `date_of_birth`, `health_conditions` | updated pet |

> V2 pet writes map onto existing V1 columns: `date_of_birth → birth_date`, `breed → breed`, `pet_type → pet_type`. The only new column is `health_conditions`.The frontend can keep using the V1 pet-create wizard; these V2 fields are additive.

### H1.2 Medical Events (Master Vet Visit Form)
| Method | Path | Body / Query | Returns | Notes |
|---|---|---|---|---|
| POST | `/api/v2/pets/{pet_id}/medical-events` | `MedicalEventCreate` (see H1.9) | `201` `{ duplicate:false, event, reminders:[...] }` | On same-day duplicate → `409` `{ detail:{ message, candidates:[{entry_index, hash, candidate_event_id}] } }`. Resubmit with `"force": true` to save anyway. |
| GET | `/api/v2/pets/{pet_id}/medical-events` | `?category=` (optional) | `{ events: [...] }` | Newest first. `category` filters to visits containing that category. |
| GET | `/api/v2/pets/{pet_id}/medical-events/{event_id}` | — | event object | Full row incl. `category_entries`. |
| PUT | `/api/v2/pets/{pet_id}/medical-events/{event_id}` | `MedicalEventUpdate` (partial) | updated event | Writes an `edit_history` row; re-runs reminder engine if a due-date field changed. |
| DELETE | `/api/v2/pets/{pet_id}/medical-events/{event_id}` | — | `{ deleted:true }` | Soft delete (`is_deleted=true`); cascades linked reminders. |
| POST | `/api/v2/pets/{pet_id}/medical-events/{event_id}/entries` | one `CategoryEntry` | updated event | Appends a category entry to an existing visit. |

### H1.3 Timeline (read model)
| Method | Path | Query | Returns |
|---|---|---|---|
| GET | `/api/v2/pets/{pet_id}/timeline` | `?view=category` (default) | `{ view:"category", buckets:{ diagnosis:[...], medication:[...], vaccination:[...], deworming:[...], anti_tick_flea:[...], grooming:[...], other:[...] } }` |
| GET | `/api/v2/pets/{pet_id}/timeline` | `?view=chronological` | `{ view:"chronological", events:[...] }` (flat, date-desc) |
| GET | `/api/v2/pets/{pet_id}/timeline/visit/{visit_group_id}` | — | `{ visit_group_id, events:[...] }` (all rows of one physical visit) |

Each item in a bucket / the flat feed is a **summary card object** (see H1.10).

### H1.4 Reminders
| Method | Path | Body / Query | Returns |
|---|---|---|---|
| GET | `/api/v2/pets/{pet_id}/reminders` | `?type=&status=` | `{ reminders:[...] }` (due_date asc) |
| POST | `/api/v2/pets/{pet_id}/reminders` | `ReminderCreate` (H1.11) | created reminder |
| PUT | `/api/v2/pets/{pet_id}/reminders/{reminder_id}` | partial `ReminderUpdate` | updated reminder |
| PUT | `/api/v2/pets/{pet_id}/reminders/{reminder_id}/complete` | — | `{ completed:<id>, next_occurrence:<reminder|null> }` |
| PUT | `/api/v2/pets/{pet_id}/reminders/{reminder_id}/snooze` | `{ new_date:"YYYY-MM-DD" }` | updated reminder (status `snoozed`) |
| DELETE | `/api/v2/pets/{pet_id}/reminders/{reminder_id}` | — | `{ deleted:true }` |

Completing a recurring reminder auto-creates the next occurrence (respecting `end_repeat_*`) and returns it in `next_occurrence`.

### H1.5 Documents Vault
| Method | Path | Body / Query | Returns |
|---|---|---|---|
| POST | `/api/v2/pets/{pet_id}/documents/upload` | `multipart/form-data`: `file` (required), `event_id` (opt), `label` (opt) | created document row |
| GET | `/api/v2/pets/{pet_id}/documents` | `?event_id=` (opt) | `{ documents:[...] }` |
| DELETE | `/api/v2/pets/{pet_id}/documents/{doc_id}` | — | `{ deleted:true }` |

Upload without `event_id` = pet-level document; with `event_id` = attached to that visit. **Do not set `Content-Type` manually** for the upload — let the browser set the multipart boundary.

### H1.6 Export
| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/api/v2/pets/{pet_id}/export` | `ExportReq` (H1.12) | binary file (`application/pdf` \| `text/csv` \| `xlsx` mime) with `Content-Disposition: attachment` |
| POST | `/api/v2/pets/{pet_id}/export/preview` | `ExportReq` | `{ total_entries:int, sample:[{date,category,item,status}, …≤10] }` |

Frontend reads the `/export` response as a **blob** and triggers a download (code sample in §9.6 of this guide).

### H1.7 Reference Data (user-scoped, no `{pet_id}`)
| Method | Path | Query | Returns |
|---|---|---|---|
| GET | `/api/v2/reference/medicines` | `?q=&type=&limit=` | `{ medicines:[{id, brand_name, composition, medicine_type, strength}] }` |
| GET | `/api/v2/reference/vaccines` | `?animal_type=dog\|cat` (optional) | `{ vaccines:[{id, vaccine_name, animal_type, default_interval_days}] }` |
| GET | `/api/v2/reference/shampoos` | `?category=` | `{ shampoos:[{id, brand_name, category}] }` |
| GET | `/api/v2/reference/clinics` | `?q=&limit=` | `{ clinics:[{id, name, address, phone}] }` |
| POST | `/api/v2/reference/clinics` | `{ name, address?, phone? }` | created clinic |
| GET | `/api/v2/reference/diagnoses` | `?category=` | `{ diagnoses:[...] }` (names for a category, or the full taxonomy map if no `category`) |
| GET | `/api/v2/reference/injection-sites` | `?route=iv\|im\|sc` | `{ sites:[...] }` |

### H1.8 `[Phase 2]` AI (only mounted when `GEMINI_API_KEY` is set)
| Method | Path | Notes |
|---|---|---|
| POST | `/api/v2/pets/{pet_id}/ai/documents/upload` | upload diary file |
| POST | `/api/v2/pets/{pet_id}/ai/documents/{doc_id}/extract` | `202`; background Call 1; inserts `source='ai_extracted'`, `verification_status='pending'` events |
| GET | `/api/v2/pets/{pet_id}/ai/documents/{doc_id}/status` | poll `ocr_status` |
| — | *verify a draft* | **reuses** `PUT /medical-events/{id}` with `verification_status:'verified'` — no separate endpoint |
| POST | `/api/v2/pets/{pet_id}/ai/insights/generate` | `202`; background Call 2 |
| GET | `/api/v2/pets/{pet_id}/ai/insights/status` | poll |
| GET | `/api/v2/pets/{pet_id}/ai/insights/node/{event_id}` | single node insight |
| GET | `/api/v2/pets/{pet_id}/ai/insights/collective` | current `pol_analyses` |
| PUT | `/api/v2/pets/{pet_id}/ai/community/consent` | `[Phase 3]` toggle only |

Frontend should hide all AI entry points unless the backend reports AI is enabled.

### H1.9 Request body — `MedicalEventCreate`
```jsonc
{
  "event_date": "2025-03-04",            // required
  "event_time": "10:30",                 // optional "HH:MM"
  "clinic_id": "uuid|null",              // optional (existing clinic)
  "clinic_name": "New Clinic Name",      // optional (denormalised display / new clinic)
  "vet_name": "Dr. Smith",               // optional
  "visit_type": ["routine_checkup","vaccination"], // multi-select chips
  "reason_for_visit": "…",               // optional, ≤500
  "overall_notes": "…",                  // optional, ≤1000
  "follow_up_date": "2025-03-18",        // optional
  "follow_up_notes": "…",                // optional, ≤300
  "attachments": ["doc-id-1"],           // optional (document ids)
  "force": false,                        // set true to bypass duplicate 409
  "category_entries": [ /* 1..n CategoryEntry, see below */ ]
}
```

**`CategoryEntry`** (shared 70% + `category_fields` 30%):
```jsonc
{
  "entry_id": "uuid",                    // server-generated if omitted
  "category": "medication",              // diagnosis|medication|vaccination|deworming|anti_tick_flea|grooming|other
  "form_type": "treatment_medication",   // auto-derived from category if omitted
  "item_name": "Cephalexin",             // required
  "date_logged": "2025-03-04",           // required (defaults to event_date on the client)
  "status": "active",
  "next_due_date": "2025-03-14",         // server pre-fills a suggestion; editable
  "notes": "…",
  "attachments": ["doc-id"],
  "category_fields": { /* per form_type — see H2.4 schemas */ }
}
```

### H1.10 Response object — timeline **summary card**
```jsonc
{
  "entry_id": "uuid", "category": "vaccination", "item_name": "Rabies",
  "status": "up_to_date", "date_logged": "2025-03-04", "next_due_date": "2026-03-04",
  "event_id": "uuid", "visit_group_id": "uuid",
  // exactly one of the following, by form type:
  "vitals":    { "weight": 12.5, "weight_unit": "kg", "temperature": 38.5 },
  "treatment": { "dose": "1", "dose_unit": "tablet", "route": "oral",
                 "frequency": ["morning","night"], "duration": 10, "duration_unit": "days" },
  "procedure": { "procedure_type": "cbc" }
}
```

### H1.11 Request body — `ReminderCreate`
```jsonc
{
  "title": "Monthly Flea Treatment",     // required ≤100
  "type": "anti_tick",                   // see enum in H2.x
  "description": "Apply Frontline Plus", // ≤300
  "due_date": "2025-04-01",              // required
  "due_time": "09:00",
  "priority": "medium",                  // high|medium|low
  "repeat_type": "monthly",              // none|daily|weekly|bi_weekly|monthly|quarterly|bi_annually|annually|custom
  "custom_repeat_interval": null,        // required when repeat_type=custom
  "custom_repeat_unit": null,            // days|weeks|months (with custom)
  "end_repeat_type": "never",            // never|after_count|on_date
  "end_repeat_date": null,
  "end_repeat_count": null,
  "linked_event_id": null,
  "notes": "Apply between shoulder blades"
}
```

### H1.12 Request body — `ExportReq`
```jsonc
{
  "format": "pdf",                       // pdf|csv|excel
  "template": "full_report",             // pdf only: full_report|summary_only|vaccination_card|medication_list
  "date_from": "2024-01-01",             // optional
  "date_to": "2025-03-04",               // optional
  "categories": ["vaccination","medication"], // optional; omit = all
  "include_attachments": true,
  "include_vet_notes": true
}
```

### H1.13 Standard error shapes
| Status | Meaning | Body |
|---|---|---|
| 401 | missing/invalid token | `{ "detail": "..." }` |
| 404 | pet/event/reminder/doc not found or not owned | `{ "detail": "..." }` |
| 409 | same-day duplicate on create | `{ "detail": { "message": "...", "candidates": [...] } }` |
| 422 | Pydantic validation failure | FastAPI validation error array |

---

## H2. Backend Structure — services & utility functions

### H2.1 Folder map (what exists after Phase 1)
```
backend/app/
├── main.py                        # mounts all V2 routers + guarded [Phase 2] AI block
├── utils/
│   └── auth.py                    # get_current_user (shared JWT dependency)
├── services/                      # SHARED layer (used by V1 refactor + V2)
│   ├── pet_service.py             # PetService
│   └── medical_record_service.py  # MedicalRecordService (Supabase Storage)
├── routers/v2/                    # V2 HTTP layer (thin; delegates to timeline services)
│   ├── pet_profile.py  medical_events.py  timeline.py
│   ├── reminders.py    documents.py       export.py
│   └── reference_data.py
└── timeline/                      # Phase 1 domain logic (imports NOTHING from ai/)
    ├── schemas/                   # Pydantic request/response models
    │   ├── category_entry.py  medical_event.py  reminder.py  reference_data.py
    └── services/
        ├── event_service.py        category_engine.py    reminder_engine.py
        ├── document_service.py     export_service.py     dedupe_service.py
        └── reference_data_service.py
```
`[Phase 2]` adds `app/timeline/ai/` and `app/routers/v2/ai/`, both deletable without affecting Phase 1.

### H2.2 Utility functions (`app/utils/auth.py`)
| Function | Signature | Purpose |
|---|---|---|
| `get_current_user` | `async (authorization: str=Header) -> {id,email}` | Validates the Supabase JWT, returns the user. FastAPI dependency used by every V2 route. `401` on failure. |

### H2.3 Shared services (`app/services/`)
**`PetService`** (`pet_service.py`)
| Method | Signature | Purpose |
|---|---|---|
| `get_all_user_pets` | `(user_id) -> list` | All pets for a user. |
| `get_pet_by_id` | `(pet_id) -> dict\|None` | Single pet. |
| `verify_ownership` | `(pet_id, user_id) -> bool` | Ownership guard used by all V2 routers. |
| `update_v2_fields` | `(pet_id, *, pet_type, breed, date_of_birth, health_conditions) -> dict` | Maps onto existing V1 columns; only `health_conditions` is new. No `species`. |

**`MedicalRecordService`** (`medical_record_service.py`)
| Method | Signature | Purpose |
|---|---|---|
| `ensure_bucket` | `() -> None` | Idempotent bucket creation (`medical-docs`). |
| `upload_file` | `(file_bytes, filename, content_type=None) -> (public_url, storage_path)` | Uploads to Supabase Storage with a random path. |
| `delete_file` | `(storage_path) -> None` | Removes a stored file. |

### H2.4 Domain services (`app/timeline/services/`)
**`event_service.EventService`**
| Method | Signature | Purpose / side effects |
|---|---|---|
| `create_event` | `(pet_id, payload) -> {duplicate, event?, reminders?, candidates?}` | Normalises entries, dedupe check, pre-fills due dates, inserts row, fires reminder engine. |
| `get_event` | `(pet_id, event_id) -> dict\|None` | Single non-deleted event. |
| `list_events` | `(pet_id, category=None) -> list` | Newest-first, optional category filter. |
| `update_event` | `(pet_id, event_id, patch) -> dict\|None` | Writes `edit_history`; recomputes reminders on due-date change. |
| `delete_event` | `(pet_id, event_id) -> True` | Soft delete + cascade reminders. |
| `add_category_entry` | `(pet_id, event_id, entry) -> dict\|None` | Appends an entry; recomputes reminders. |

**`dedupe_service`**
| Function | Signature | Purpose |
|---|---|---|
| `compute_entry_hash` | `(pet_id, entry, event_date) -> sha256 hex` | `SHA256(pet_id|category|date|primary_field)`. |
| `DedupeService.find_same_day_duplicates` | `(pet_id, entries, event_date) -> list` | Returns duplicate candidates per entry. |

**`category_engine.CategoryEngine`**
| Method | Signature | Returns |
|---|---|---|
| `get_category_grouped` | `(pet_id)` | 7 category buckets of summary cards. |
| `get_chronological` | `(pet_id)` | Flat date-desc feed of summary cards. |
| `get_visit_group` | `(pet_id, visit_group_id)` | All rows sharing a visit. |

**`reminder_engine`** (module-level functions)
| Function | Signature | Purpose |
|---|---|---|
| `get_vaccine_interval` | `(vaccine_name, animal_type=None) -> int` | DB lookup by name (animal_type optional) w/ name-keyed fallback. |
| `suggest_next_due` | `(entry, event_date) -> str\|None` | Pure due-date suggestion for form pre-fill. |
| `generate_for_event` | `(event) -> list` | Auto reminders (vaccination/deworming/anti_tick/medication_end/follow_up). |
| `recompute_for_event` | `(event) -> list` | Deletes only this event's auto reminders, regenerates. |
| `create_manual_reminder` | `(pet_id, body) -> dict` | Manual/recurring create. |
| `update_reminder` / `delete_reminder` | `(pet_id, id[, patch]) -> …` | Edit / delete. |
| `complete_reminder` | `(pet_id, id) -> {completed, next_occurrence}` | Marks done; spawns next occurrence for recurring. |
| `snooze_reminder` | `(pet_id, id, new_date) -> dict` | Reschedule. |
| `list_reminders` | `(pet_id, type=None, status=None) -> list` | Filtered list. |

**`document_service.DocumentService`** — `upload / list / delete` (reuses `MedicalRecordService` for storage).

**`export_service.ExportService`** — `to_csv / to_excel / to_pdf / preview` (pure rendering from `medical_events`).

**`reference_data_service.ReferenceDataService`** — `search_medicines / get_vaccines / search_shampoos / search_clinics / create_clinic / get_diagnoses / get_injection_sites`, plus module constants `DIAGNOSIS_TAXONOMY`, `INJECTION_SITES`.

### H2.5 Enum reference (for both teams' validation/UI)
- **category:** `diagnosis, medication, vaccination, deworming, anti_tick_flea, grooming, other`
- **form_type:** `consultation_vitals, treatment_medication, procedure_diagnostics`
- **reminder.type:** `vaccination, deworming, anti_tick, medication_end, follow_up, medication, vet_visit, grooming, weight_check, custom` (+ `[Phase 2]` `monitoring, conditional`)
- **reminder.priority:** `high, medium, low`  •  **reminder.status:** `pending, completed, missed, snoozed`
- **repeat_type:** `none, daily, weekly, bi_weekly, monthly, quarterly, bi_annually, annually, custom`
- **event.source:** `manual` (+ `[Phase 2]` `ai_extracted`)  •  **verification_status:** `verified, pending, rejected`
- **auto due-date rules:** vaccine = `vaccine_database.default_interval_days` (matched by vaccine name; `animal_type` optional); deworming +90d; anti_tick +30d; medication_end = start+duration; follow_up = explicit date.

---

## H3. Database Changes (for the DB team)

All changes are **additive and idempotent** (`IF NOT EXISTS`). No V1 table is dropped or altered destructively. Full DDL is in Milestone 1 of this guide; this is the summary the DB team needs to provision, index, and reason about.

### H3.1 Altered existing table
**`pet_profiles`** — added columns only:
| Column | Type | Notes |
|---|---|---|
| `health_conditions` | JSONB default `'[]'` | **only new column** |
| *(reuses)* `pet_type`, `breed`, `birth_date` | — | animal type / breed / DOB map here; **not** re-created. **No `species` column.** |

`[Phase 2]` also adds to **`medical_records`**: `ocr_status` (enum), `extracted_json` (JSONB).

### H3.2 New tables (Phase 1)
| Table | Key columns | FKs | Purpose |
|---|---|---|---|
| `medical_events` | `id`, `pet_id`, `visit_group_id`, common fields, `category_entries` JSONB, `event_hash`, `source`, `verification_status`, `is_deleted`, timestamps | `pet_id → pet_profiles(id)` CASCADE; `clinic_id → clinic_database(id)` SET NULL | One row per visit; multi-category via JSONB array. |
| `medical_documents` | `id`, `pet_id`, `event_id`, `file_url`, `storage_path`, `label` | `pet_id` CASCADE; `event_id → medical_events(id)` SET NULL | Vault; pet-level or event-level. |
| `edit_history` | `id`, `event_id`, `pet_id`, `previous_value` JSONB, `changed_fields` JSONB, `changed_by` | `event_id`, `pet_id` CASCADE | Audit of edits. |
| `reminders` | `id`, `pet_id`, `source_event_id`, `linked_event_id`, `type`, `due_date`, recurring fields, `priority`, `status`, `is_ai_generated` | `pet_id` CASCADE; `source_event_id` CASCADE; `linked_event_id` SET NULL | Auto + manual + recurring. |
| `clinic_database` | `id`, `name`, `address`, `phone`, `created_by` | `created_by → auth.users(id)` | Searchable clinics. |
| `medicine_database` | `id`, `brand_name`, `composition`, `medicine_type`, `strength`, `is_preloaded` | — | Seeded + user-extendable. |
| `vaccine_database` | `id`, `vaccine_name`, `animal_type` (nullable), `default_interval_days`, `is_preloaded` | — | Drives auto due-dates (matched by name; `animal_type` optional). Seeded 8 rows. |
| `shampoo_database` | `id`, `brand_name`, `category`, `is_preloaded` | — | Seeded 20 rows. |

### H3.3 Indexes to expect
- `medical_events`: `(pet_id, event_date DESC)`, `(visit_group_id)`, `(pet_id, event_hash)`, `(pet_id, verification_status)`, **GIN** on `category_entries jsonb_path_ops`.
- `reminders`: `(pet_id, due_date)`, `(pet_id, status)`, `(pet_id, type)`.
- `medical_documents`: `(pet_id)`, `(event_id)`.  •  `edit_history`: `(event_id)`.
- reference: GIN full-text on `clinic_database.name` and `medicine_database.brand_name`; btree on `medicine_type`, `vaccine_database.animal_type`, `shampoo_database.category`.

### H3.4 Triggers, RLS, seed
- **Trigger:** `medical_events.updated_at` auto-set via `set_updated_at()` on UPDATE.
- **RLS:** enabled on all new tables; the backend uses the **service_role key** which bypasses RLS (same model as your existing V1 tables). No client reads new tables directly — everything goes through the API. If the DB team later wants client-side reads, policies must be authored then.
- **Seed migration:** 8 vaccines (5 dog + 3 cat with intervals), 20 shampoos (5 categories), a few starter medicines. `ON CONFLICT DO NOTHING` so re-runs are safe.

### H3.5 Data-flow notes the DB team should know
- `category_entries` is the **atomic storage unit**; category "views" are read-time queries/JSONB extraction, not separate tables — no data duplication across views.
- `visit_group_id` groups rows from one physical appointment (currently one row per visit holds all its entries; the field also supports `[Phase 2]` multi-row visits from diary extraction).
- Deletes on events are **soft** (`is_deleted=true`); reminders tied to an event are hard-deleted on event delete.
- `source` / `verification_status` already exist in Phase 1 so `[Phase 2]` needs **no core-table migration** — only additive tables (`medical_event_insights`, `pol_analyses`, `ai_token_logs`) and the two `medical_records` columns.

---

## H4. Quick-start for each team

**Frontend team:**
1. Use `fetchWithAuth` (token + base URL already handled) via the provided `src/services/timelineApi.js`.
2. Mount `TimelineHome` on the existing Timeline tab in `MainLayout` (one import + one `case`). No new route, no new global store.
3. Build to the request/response contracts in H1.9–H1.13 and the enums in H2.5. Handle `409` (duplicate → "save anyway" → resubmit with `force:true`) and read `/export` as a blob.

**DB team:**
1. Run `…_add_v2_core_tables.sql` then `…_seed_reference_data.sql` (both idempotent) on dev → staging → prod.
2. Verify with the queries in Milestone 1 (`8 vaccines, 20 shampoos, 8 new tables`).
3. Keep the backend on the service_role key; do not add client-facing RLS policies unless client-direct reads are introduced.
4. `[Phase 2]` migrations are separate and applied only when AI is turned on.


**Important integration rules for both teams to remember.**

1. **Never edit a V1 route or table destructively.** V1 endpoints stay at `/api/...`. Everything new is under `/api/v2/...`. All SQL is `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`.
2. **Reuse, don't duplicate.** DB access for pets/documents goes through `app/services/` (shared by V1 and V2). Frontend API calls go through the existing `fetchWithAuth`. Pet list/active-pet state stays owned by `MainLayout.jsx` and is drilled down as props — **no Redux/Zustand/Context**, per your existing rule.
3. **Phase 1 imports nothing AI.** No file under `app/timeline/services/` may import from `app/timeline/ai/`. Enforced by a CI check (Milestone 10). Phase 1 must run with `app/timeline/ai/` and `app/routers/v2/ai/` entirely deleted.
4. **Vanilla CSS only.** Each component in its own folder with an adjacent `.css`. No Tailwind.
5. **One data model, two entry paths.** Manual and (later) AI‑extracted events are the same `medical_events` row shape; only `source` / `verification_status` differ. Phase 1 only ever writes `source='manual'`, `verification_status='verified'`.
6. **Category is the atomic unit.** A visit = one `medical_events` row holding a `category_entries` JSONB array. Multi‑category visits share one `visit_group_id`.
7. **Rule engine is pure logic.** Reminder due‑dates are computed deterministically from data the form already captured. No AI in Phase 1 reminders.
---

# H5. Security & Data-Scoping Guarantees (READ THIS)

This section is the explicit answer to: *"is every vet visit, reminder, timeline entry, and document always bound to the logged-in pet parent and the selected pet — for both writes and reads — with no cross-pet leakage?"* **Yes, by construction.** Here is exactly how, at three independent layers.

## H5.1 The scoping model in one picture

```
Request  ─►  Authorization: Bearer <JWT>          (identifies the PET PARENT)
             │
             ▼
   get_current_user()  ── validates JWT ──►  user = {id, email}     [Layer 1: identity]
             │
             ▼
   URL path /api/v2/pets/{pet_id}/...        (identifies the SELECTED PET)
             │
             ▼
   _guard(pet_id, user):
       PetService.verify_ownership(pet_id, user.id)   ── false ─► 404   [Layer 2: ownership]
             │  (true: this user owns this pet)
             ▼
   Service call ALWAYS uses the path pet_id:
       .eq("pet_id", pet_id)  on every read
       {"pet_id": pet_id, ...} on every write            [Layer 3: query scoping]
             │
             ▼
   Row(s) belonging ONLY to (this parent, this pet)
```

The pet parent is **never** taken from the request body — only from the verified JWT. The pet is **never** taken from the body — only from the URL path, and only after ownership is proven. So an attacker cannot "add a vet visit without considering the logged-in user and selected pet," and cannot read another pet's data, because there is no code path that lets a body-supplied id override the path/JWT-derived ones.

## H5.2 Layer 1 — Identity (who is the parent?)

- Every V2 endpoint takes `user = Depends(get_current_user)`. That dependency validates the Supabase JWT and returns the user, or raises `401`. No token, bad token, expired token → `401`, request never reaches any DB code.
- The user id used for ownership is the JWT's `user.id`, **not** anything the client sends.

## H5.3 Layer 2 — Ownership (does this parent own this pet?)

- Every pet-scoped route begins with `_guard(pet_id, user)`, which calls `PetService.verify_ownership(pet_id, user["id"])`. That checks `pet_profiles.user_id == user.id` for the `pet_id` in the URL.
- Not owned (or nonexistent) → `404` (deliberately not `403`, so we don't reveal that a pet id exists).
- **Verified:** every one of the 21 pet-scoped handlers (medical-events ×6, timeline ×2, reminders ×6, documents ×3, export ×2, pet-profile ×2) calls `_guard` as its first line. The only unguarded routes are `/api/v2/reference/*`, which return preloaded catalog data (medicines, vaccines, shampoos, clinics, diagnosis taxonomy, injection sites) and contain **no pet or user data** — they are safe to expose to any authenticated user.

## H5.4 Layer 3 — Query scoping (defense in depth)

Even if a guard were ever accidentally omitted on a future route, the service layer independently refuses to cross pets:

- **Reads** always filter by the path `pet_id`:
  - `EventService.get_event / list_events` → `.eq("pet_id", pet_id)` (+ `.eq("is_deleted", False)`)
  - `CategoryEngine.get_category_grouped / get_chronological / get_visit_group` → all rows fetched with `.eq("pet_id", pet_id)`; the timeline can only ever contain the selected pet's entries.
  - `reminder_engine.list_reminders` → `.eq("pet_id", pet_id)`
  - `DocumentService.list` → `.eq("pet_id", pet_id)`
  - `ExportService._events` → `.eq("pet_id", pet_id)` — a PDF/CSV/Excel can only contain the selected pet.
- **Writes** always bind the row to the path `pet_id` and never trust a client id:
  - `EventService.create_event` builds the row with `"pet_id": pet_id`; `MedicalEventCreate` has **no** `pet_id` field, so a client literally cannot submit one.
  - `create_manual_reminder` forces `"pet_id": pet_id` and `row.pop("id")` (client cannot set the PK).
  - Auto reminders are inserted with the parent event's `pet_id`.
- **Updates/deletes** scope by both id **and** `pet_id`:
  - `update_event` / `delete_event` operate on rows already fetched via `get_event(pet_id, event_id)` (so a foreign event returns 404 before any write).
  - `update_reminder`, `delete_reminder`, `complete_reminder` (both the status write and the recurrence-count query), `snooze_reminder` → all carry `.eq("pet_id", pet_id)`.
  - `DocumentService.delete` verifies `id + pet_id`, then deletes with `id + pet_id`.

## H5.5 Cross-object link safety

A visit, reminder, or document can reference another object. Those links are validated to stay within the same pet:

- `documents.upload(event_id=...)` → if an `event_id` is supplied, it must resolve to a non-deleted event **of the same pet**, else `400`. You cannot attach a document to another pet's visit.
- `create_manual_reminder(linked_event_id=...)` → same check; a reminder cannot link to another pet's event, else `400`.
- FK `ON DELETE CASCADE` on `pet_id` means deleting a pet (or a user, which cascades to their pets via the existing V1 `pet_profiles.user_id` FK) removes all that pet's events, reminders, documents, and edit history — no orphaned medical data survives.

## H5.6 Recurring-chain scoping

Recurring reminders use a `recurrence_group_id` (seeded to the first occurrence's own id, per pet) to count completions and decide when to stop. This is **never** keyed on `title`, so two different pets that happen to share a reminder title ("Monthly Flea Treatment") never interfere with each other's recurrence counts.

## H5.7 What the frontend must do (and must NOT do)

- **Must:** always call these endpoints with the currently selected pet's id in the URL (`activePetId` from `MainLayout`). The `timelineApi.js` wrappers already take `petId` as the first argument for every pet-scoped call — pass `pet.id`, never a hard-coded or cached foreign id.
- **Must:** rely on `fetchWithAuth`, which attaches the logged-in parent's bearer token automatically.
- **Must NOT:** send `pet_id`, `user_id`, or any row `id` in a request body expecting it to take effect — the backend ignores/forbids body-supplied ids by design. Scoping comes from the token + URL only.
- **Result:** switching the active pet in the UI switches the entire timeline/reminders/documents/export view, and no screen can ever render another pet's rows because the backend won't return them.

## H5.8 Optional DB-level hardening (recommended for production) — for the DB team

The backend uses the Supabase **service_role** key (same as your V1 tables), which bypasses RLS; scoping is enforced in FastAPI as described above. If you want a **fourth** layer that holds even against a backend bug, add RLS policies keyed on the JWT user. These are additive and safe to apply after Phase 1 is stable:

```sql
-- Example: only allow a row to be seen/changed if the pet belongs to the JWT user.
-- (auth.uid() is the Supabase-authenticated user id.)

CREATE POLICY medical_events_owner ON medical_events
  USING (EXISTS (SELECT 1 FROM pet_profiles p
                 WHERE p.id = medical_events.pet_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM pet_profiles p
                      WHERE p.id = medical_events.pet_id AND p.user_id = auth.uid()));

-- Repeat the same pattern for: reminders, medical_documents, edit_history
-- (all have pet_id → pet_profiles → user_id). Reference tables
-- (clinic/medicine/vaccine/shampoo) need only a "authenticated can read" policy.
```

> Only enable these once you also stop using the service_role key for user-scoped reads (or they'll be bypassed). For Phase 1 as written, Layers 1–3 in FastAPI are the enforced guarantee; RLS is optional depth.

## H5.9 One-line summary for both teams

> Every write is bound to `(JWT user, URL pet_id)` after an ownership check; every read is filtered by `pet_id`; no body-supplied id can override either; cross-object links are validated to the same pet; and a missing guard still can't leak because the service layer filters by `pet_id` on every query. A pet parent sees and mutates only their own selected pet's medical data.
