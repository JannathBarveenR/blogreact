-- ============================================================================
-- VET & MATERNITY PLATFORM DATABASE SCHEMA (NON-DESTRUCTIVE)
-- Safe, additive-only migration for Supabase / PostgreSQL.
-- Does NOT drop tables, alter existing data, or delete existing structures.
-- ============================================================================

-- 1. USER ROLES TABLE (RBAC)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    role text NOT NULL CHECK (role = ANY (ARRAY['pet_owner'::text, 'vet'::text, 'supervisor'::text, 'staff'::text])),
    assigned_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_roles_pkey PRIMARY KEY (id),
    CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role)
);

-- Index for fast RBAC role checks
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- 2. VET PROFILES TABLE (Doctor Profile for Online Consultations)
CREATE TABLE IF NOT EXISTS public.vet_profiles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid UNIQUE,
    doctor_name text NOT NULL,
    specialization text NOT NULL DEFAULT 'General Veterinary Medicine',
    license_number text,
    bio text,
    clinic_name text,
    city text,
    calendly_url text, -- Online consultation scheduling URL
    calendly_event_type_uri text,
    consultation_fee numeric(10,2) DEFAULT 0.00,
    is_verified boolean NOT NULL DEFAULT false,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT vet_profiles_pkey PRIMARY KEY (id),
    CONSTRAINT vet_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vet_profiles_user_id ON public.vet_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_vet_profiles_is_verified ON public.vet_profiles(is_verified);

-- 3. ONLINE CONSULTATIONS TABLE (NOTE: In-Person Consultation REMOVED completely)
CREATE TABLE IF NOT EXISTS public.online_consultations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    pet_id uuid NOT NULL,
    user_id uuid NOT NULL, -- Pet owner (parent)
    vet_id uuid NOT NULL,  -- Attending doctor/vet
    consultation_type text NOT NULL DEFAULT 'online_video' CHECK (consultation_type = 'online_video'),
    calendly_event_id text,
    calendly_invitee_id text,
    meeting_link text,     -- Google Meet / Zoom / Calendly video link
    status text NOT NULL DEFAULT 'scheduled' CHECK (status = ANY (ARRAY['scheduled'::text, 'completed'::text, 'cancelled'::text, 'rescheduled'::text])),
    scheduled_start_time timestamp with time zone NOT NULL,
    scheduled_end_time timestamp with time zone,
    reason_for_consultation text NOT NULL,
    clinical_notes text,
    prescription_summary text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT online_consultations_pkey PRIMARY KEY (id),
    CONSTRAINT online_consultations_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pet_profiles(id) ON DELETE CASCADE,
    CONSTRAINT online_consultations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT online_consultations_vet_id_fkey FOREIGN KEY (vet_id) REFERENCES public.vet_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_online_consultations_pet_id ON public.online_consultations(pet_id);
CREATE INDEX IF NOT EXISTS idx_online_consultations_user_id ON public.online_consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_online_consultations_vet_id ON public.online_consultations(vet_id);
CREATE INDEX IF NOT EXISTS idx_online_consultations_status ON public.online_consultations(status);

-- 4. MATERNITY RECORDS TABLE (Pregnancy / Breeding / Maternity Tracking)
CREATE TABLE IF NOT EXISTS public.maternity_records (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    pet_id uuid NOT NULL,
    user_id uuid NOT NULL, -- Pet owner
    stage text NOT NULL DEFAULT 'gestation' CHECK (stage = ANY (ARRAY['mating'::text, 'gestation'::text, 'whelping'::text, 'postpartum'::text, 'lactation'::text])),
    mating_date date,
    expected_delivery_date date,
    actual_delivery_date date,
    litter_size_expected integer DEFAULT 0,
    litter_size_actual integer DEFAULT 0,
    health_notes text,
    ultrasound_findings text,
    attending_vet_id uuid,
    status text NOT NULL DEFAULT 'active' CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'archived'::text])),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT maternity_records_pkey PRIMARY KEY (id),
    CONSTRAINT maternity_records_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pet_profiles(id) ON DELETE CASCADE,
    CONSTRAINT maternity_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT maternity_records_attending_vet_id_fkey FOREIGN KEY (attending_vet_id) REFERENCES public.vet_profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_maternity_records_pet_id ON public.maternity_records(pet_id);
CREATE INDEX IF NOT EXISTS idx_maternity_records_user_id ON public.maternity_records(user_id);
CREATE INDEX IF NOT EXISTS idx_maternity_records_stage ON public.maternity_records(stage);

-- 5. MATERNITY MILESTONES TABLE (Growth, Checkups, Deworming, Ultrasound Logs)
CREATE TABLE IF NOT EXISTS public.maternity_milestones (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    maternity_record_id uuid NOT NULL,
    milestone_date date NOT NULL,
    title text NOT NULL,
    milestone_type text NOT NULL CHECK (milestone_type = ANY (ARRAY['ultrasound'::text, 'blood_test'::text, 'weight_check'::text, 'deworming'::text, 'whelping_prep'::text, 'custom'::text])),
    notes text,
    vitals jsonb DEFAULT '{}'::jsonb, -- e.g. {"maternal_weight": "12.5kg", "fetal_heartbeat": "present"}
    completed boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT maternity_milestones_pkey PRIMARY KEY (id),
    CONSTRAINT maternity_milestones_record_fkey FOREIGN KEY (maternity_record_id) REFERENCES public.maternity_records(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_maternity_milestones_record_id ON public.maternity_milestones(maternity_record_id);

-- Enable RLS on new tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vet_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maternity_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maternity_milestones ENABLE ROW LEVEL SECURITY;
