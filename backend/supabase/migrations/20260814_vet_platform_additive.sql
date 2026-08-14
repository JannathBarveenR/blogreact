-- ============================================================================
-- PetOLife Vet Platform Additive Migration
-- Non-breaking additive schema for Vet Consultation and Patient Medical Records
-- ============================================================================

-- 1. Multi-role support: A user can be 'pet_parent', 'vet', and/or 'clinic_admin'
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('pet_parent', 'vet', 'clinic_admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);

-- 2. Authenticated Doctor Profile
CREATE TABLE IF NOT EXISTS public.vet_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_name text NOT NULL,
  qualification text,
  registration_number text,
  phone text,
  primary_clinic_id uuid REFERENCES public.clinic_database(id),
  photo_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vet_profiles_user ON public.vet_profiles(user_id);

-- 3. Vet Medicine / Stock Preferences (items toggled on in Start Visit)
CREATE TABLE IF NOT EXISTS public.vet_medicine_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vet_id uuid NOT NULL REFERENCES public.vet_profiles(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('medicine', 'vaccine', 'shampoo')),
  item_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vet_id, item_type, item_id)
);
CREATE INDEX IF NOT EXISTS idx_vet_medicine_stock_vet ON public.vet_medicine_stock(vet_id) WHERE is_active = true;

-- 4. Additive columns to pet_profiles for Walk-in / Unclaimed patients
ALTER TABLE public.pet_profiles
  ADD COLUMN IF NOT EXISTS created_by_vet_id uuid REFERENCES public.vet_profiles(id),
  ADD COLUMN IF NOT EXISTS claim_status text NOT NULL DEFAULT 'claimed' CHECK (claim_status IN ('claimed', 'pending_claim')),
  ADD COLUMN IF NOT EXISTS claim_phone text,
  ADD COLUMN IF NOT EXISTS claim_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS claim_invited_at timestamptz;

-- Allow user_id to be nullable for walk-ins before the pet parent registers/claims
ALTER TABLE public.pet_profiles ALTER COLUMN user_id DROP NOT NULL;

-- 5. Additive columns to medical_events
ALTER TABLE public.medical_events
  ADD COLUMN IF NOT EXISTS created_by_vet_id uuid REFERENCES public.vet_profiles(id),
  ADD COLUMN IF NOT EXISTS signed_at timestamptz;

-- Extend source constraint if present
DO $$
BEGIN
  ALTER TABLE public.medical_events DROP CONSTRAINT IF EXISTS medical_events_source_check;
  ALTER TABLE public.medical_events ADD CONSTRAINT medical_events_source_check
    CHECK (source = ANY (ARRAY['manual'::text, 'ai_extracted'::text, 'vet_portal'::text]));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 6. Additive column to reminders (know follow-up was set by vet)
ALTER TABLE public.reminders
  ADD COLUMN IF NOT EXISTS created_by_vet_id uuid REFERENCES public.vet_profiles(id);

-- 7. High performance query indexes
CREATE INDEX IF NOT EXISTS idx_medical_events_pet_date ON public.medical_events (pet_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_medical_events_vet ON public.medical_events (created_by_vet_id);
CREATE INDEX IF NOT EXISTS idx_pet_profiles_claim_phone ON public.pet_profiles (claim_phone) WHERE claim_status = 'pending_claim';
CREATE INDEX IF NOT EXISTS idx_pet_profiles_claim_token ON public.pet_profiles (claim_token) WHERE claim_token IS NOT NULL;
