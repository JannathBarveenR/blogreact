-- ============================================================
-- PetOLife V2 (AI Timeline) — Phase 1 core schema. ADDITIVE ONLY.
-- ============================================================

-- 1) pet_profiles: additive column ONLY (existing rows keep default)
--    NO `species` column. The pet's animal type lives in the existing V1
--    `pet_type` column and its breed in the existing V1 `breed` column.
ALTER TABLE pet_profiles
  ADD COLUMN IF NOT EXISTS health_conditions JSONB DEFAULT '[]';

-- NOTE: pet_profiles already has `pet_type`, `breed`, and `birth_date` (V1).
-- V2 REUSES all three: animal type -> existing `pet_type`, breed -> existing
-- `breed`, date_of_birth -> existing `birth_date`. The only new column V2 adds
-- to this table is `health_conditions`. There is deliberately NO `species`
-- column on pet_profiles — species/breed are one concept here, held by
-- `pet_type` + `breed`.

-- 2) Reference data tables (seeded in the second migration) -----------

CREATE TABLE IF NOT EXISTS clinic_database (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  address    TEXT,
  phone      TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_clinic_name
  ON clinic_database USING GIN (to_tsvector('english', name));

CREATE TABLE IF NOT EXISTS medicine_database (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name    TEXT NOT NULL,
  composition   TEXT,
  medicine_type TEXT NOT NULL CHECK (medicine_type IN
                  ('tablet','syrup','injection','eye_drop','ointment','shampoo')),
  strength      TEXT,
  is_preloaded  BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_medicine_brand
  ON medicine_database USING GIN (to_tsvector('english', brand_name));
CREATE INDEX IF NOT EXISTS idx_medicine_type ON medicine_database(medicine_type);

-- `animal_type` below is a property of the VACCINE ROW (which animal the
-- vaccine is for), NOT a column on the pet. It only exists so "Rabies (dog)"
-- and "Rabies (cat)" can carry different rows/intervals. The pet is never
-- required to declare a species — see reminder_engine fallback in M6.
CREATE TABLE IF NOT EXISTS vaccine_database (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaccine_name          TEXT NOT NULL,
  animal_type           TEXT CHECK (animal_type IS NULL OR animal_type IN ('dog','cat')),
  default_interval_days INTEGER NOT NULL,
  is_preloaded          BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vaccine_animal_type ON vaccine_database(animal_type);

CREATE TABLE IF NOT EXISTS shampoo_database (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name   TEXT NOT NULL,
  category     TEXT NOT NULL CHECK (category IN
                ('anti_fungal','tick_flea','anti_itch','anti_dandruff','general')),
  is_preloaded BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shampoo_category ON shampoo_database(category);

-- 3) medical_events (Master Form model) ------------------------------
CREATE TABLE IF NOT EXISTS medical_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id              UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  visit_group_id      UUID NOT NULL DEFAULT gen_random_uuid(),

  event_date          DATE NOT NULL,
  event_time          TIME,
  clinic_id           UUID REFERENCES clinic_database(id) ON DELETE SET NULL,
  clinic_name         TEXT,
  vet_name            TEXT,
  visit_type          JSONB NOT NULL DEFAULT '[]',
  reason_for_visit    TEXT,
  overall_notes       TEXT,
  follow_up_date      DATE,
  follow_up_notes     TEXT,

  category_entries    JSONB NOT NULL DEFAULT '[]',

  event_hash          VARCHAR(64),
  source              TEXT NOT NULL DEFAULT 'manual'
                        CHECK (source IN ('manual','ai_extracted')),
  verification_status TEXT NOT NULL DEFAULT 'verified'
                        CHECK (verification_status IN ('verified','pending','rejected')),
  is_deleted          BOOLEAN NOT NULL DEFAULT false,  -- soft delete
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_medical_events_pet_date
  ON medical_events(pet_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_medical_events_visit_group
  ON medical_events(visit_group_id);
CREATE INDEX IF NOT EXISTS idx_medical_events_hash
  ON medical_events(pet_id, event_hash);
CREATE INDEX IF NOT EXISTS idx_medical_events_status
  ON medical_events(pet_id, verification_status);
CREATE INDEX IF NOT EXISTS idx_medical_events_categories
  ON medical_events USING GIN (category_entries jsonb_path_ops);

-- 4) medical_documents ----------------------------------------------
CREATE TABLE IF NOT EXISTS medical_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id      UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  event_id    UUID REFERENCES medical_events(id) ON DELETE SET NULL,
  file_url    TEXT NOT NULL,
  file_type   TEXT,
  label       TEXT,
  storage_path TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_documents_pet   ON medical_documents(pet_id);
CREATE INDEX IF NOT EXISTS idx_documents_event ON medical_documents(event_id);

-- 5) edit_history ----------------------------------------------------
CREATE TABLE IF NOT EXISTS edit_history (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       UUID NOT NULL REFERENCES medical_events(id) ON DELETE CASCADE,
  pet_id         UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  previous_value JSONB NOT NULL,
  changed_fields JSONB NOT NULL,
  changed_by     TEXT NOT NULL DEFAULT 'user',
  changed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_edit_history_event ON edit_history(event_id);

-- 6) reminders (auto + manual + recurring) ---------------------------
CREATE TABLE IF NOT EXISTS reminders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id          UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  source_event_id UUID REFERENCES medical_events(id) ON DELETE CASCADE,
  linked_event_id UUID REFERENCES medical_events(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN (
    'vaccination','deworming','anti_tick','medication_end','follow_up',
    'medication','vet_visit','grooming','weight_check','custom',
    'monitoring','conditional'
  )),
  title       TEXT NOT NULL,
  description TEXT,
  due_date    DATE NOT NULL,
  due_time    TIME,
  priority    TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','completed','missed','snoozed')),
  repeat_type TEXT NOT NULL DEFAULT 'none' CHECK (repeat_type IN
                ('none','daily','weekly','bi_weekly','monthly',
                 'quarterly','bi_annually','annually','custom')),
  custom_repeat_interval INTEGER,
  custom_repeat_unit     TEXT CHECK (custom_repeat_unit IS NULL
                          OR custom_repeat_unit IN ('days','weeks','months')),
  end_repeat_type  TEXT DEFAULT 'never'
                    CHECK (end_repeat_type IN ('never','after_count','on_date')),
  end_repeat_date  DATE,
  end_repeat_count INTEGER,
  notes           TEXT,
  recurrence_group_id UUID,   -- stable id shared across a recurring chain (set = own id on first create)
  is_ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reminders_pet_date   ON reminders(pet_id, due_date);
CREATE INDEX IF NOT EXISTS idx_reminders_pet_status ON reminders(pet_id, status);
CREATE INDEX IF NOT EXISTS idx_reminders_pet_type   ON reminders(pet_id, type);
CREATE INDEX IF NOT EXISTS idx_reminders_chain      ON reminders(pet_id, recurrence_group_id);

-- 7) auto-update updated_at on medical_events
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_medical_events_updated ON medical_events;
CREATE TRIGGER trg_medical_events_updated
  BEFORE UPDATE ON medical_events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 8) RLS: enable, but backend uses service_role which bypasses it (matches your V1 model)
ALTER TABLE medical_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE edit_history      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_database   ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccine_database  ENABLE ROW LEVEL SECURITY;
ALTER TABLE shampoo_database  ENABLE ROW LEVEL SECURITY;
-- Reference tables are readable by everyone via the backend; no client-side reads.
