-- =============================================================================
-- Migration: Unify Medical Records
-- Drops the old `medical_records` and `medical_documents` tables.
-- Creates a single unified `medical_records` table.
-- Adds `document_ids` column to `medical_events`.
--
-- NOTE: This is a destructive migration. Back up existing data before running.
-- =============================================================================

-- STEP 1: Drop old tables (CASCADE removes dependent constraints)
DROP TABLE IF EXISTS public.medical_documents CASCADE;
DROP TABLE IF EXISTS public.medical_records CASCADE;

-- STEP 2: Create unified medical_records table
--   log = 0  → raw standalone upload (Medical Records tab)
--   log = 1  → attached to a timeline log entry (event_id is set)
--
--   File metadata (type, size, filename) is not stored here.
--   AWS S3 stores file metadata natively on the object itself.
--
CREATE TABLE public.medical_records (
  id              uuid        NOT NULL DEFAULT gen_random_uuid(),
  pet_profile_id  uuid        NOT NULL,
  user_id         uuid,

  -- Routing flag: 0=raw upload · 1=timeline-linked
  log             smallint    NOT NULL DEFAULT 0,

  -- Set when log=1; references the medical_events row this file belongs to
  event_id        uuid,

  -- Raw-upload fields (log=0)
  title           text,                        -- user-supplied record name
  category        text        NOT NULL DEFAULT 'Other',
  notes           text,
  is_favorite     boolean     NOT NULL DEFAULT false,

  -- Timeline-upload fields (log=1)
  label           text,                        -- e.g. "Vet Prescription / Report"

  -- Storage (both paths)
  file_url        text        NOT NULL,        -- presigned S3 URL (regenerated on fetch)
  storage_path    text        NOT NULL,        -- permanent S3 object key

  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT medical_records_pkey       PRIMARY KEY (id),
  CONSTRAINT medical_records_pet_fkey   FOREIGN KEY (pet_profile_id)
             REFERENCES public.pet_profiles(id) ON DELETE CASCADE,
  CONSTRAINT medical_records_user_fkey  FOREIGN KEY (user_id)
             REFERENCES auth.users(id),
  CONSTRAINT medical_records_event_fkey FOREIGN KEY (event_id)
             REFERENCES public.medical_events(id) ON DELETE SET NULL,
  CONSTRAINT medical_records_log_check  CHECK (log IN (0, 1))
);

-- STEP 3: Indexes for common query patterns
CREATE INDEX idx_medical_records_pet
  ON public.medical_records(pet_profile_id);

CREATE INDEX idx_medical_records_event
  ON public.medical_records(event_id)
  WHERE event_id IS NOT NULL;

CREATE INDEX idx_medical_records_pet_log
  ON public.medical_records(pet_profile_id, log);

-- STEP 4: Add document_ids to medical_events
--   Stores the list of medical_records.id values uploaded against this event.
--   Kept as a JSONB array for fast read access without a JOIN.
ALTER TABLE public.medical_events
  ADD COLUMN IF NOT EXISTS document_ids jsonb NOT NULL DEFAULT '[]'::jsonb;
