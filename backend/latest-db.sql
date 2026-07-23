-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.pet_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  petolife_id text NOT NULL UNIQUE,
  pet_type text NOT NULL,
  pet_name text NOT NULL,
  breed text,
  gender text,
  birth_date date,
  weight numeric,
  blood_group text,
  identification_marks text,
  pet_photo_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  pet_health_id text,
  health_conditions jsonb DEFAULT '[]'::jsonb,
  pet_attributes jsonb DEFAULT '[]'::jsonb,
  identification_ids jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT pet_profiles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_profiles (
  id uuid NOT NULL,
  phone text UNIQUE,
  full_name text,
  email text,
  phone_verified boolean DEFAULT false,
  auth_provider text DEFAULT 'phone'::text,
  city text,
  state text,
  pincode text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  avatar_url text,
  is_seller boolean DEFAULT false,
  address text,
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.medical_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pet_profile_id uuid,
  title text NOT NULL,
  category text NOT NULL,
  file_url text NOT NULL,
  storage_path text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  is_favorite boolean DEFAULT false,
  file_name text,
  file_type text,
  file_size integer,
  CONSTRAINT medical_records_pkey PRIMARY KEY (id),
  CONSTRAINT medical_records_pet_profile_id_fkey FOREIGN KEY (pet_profile_id) REFERENCES public.pet_profiles(id),
  CONSTRAINT medical_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.vets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  doctor_name text,
  clinic_name text,
  mobile text,
  email text,
  city text,
  early_access boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vets_pkey PRIMARY KEY (id)
);
CREATE TABLE public.clinic_database (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  phone text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT clinic_database_pkey PRIMARY KEY (id),
  CONSTRAINT clinic_database_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.medicine_database (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand_name text NOT NULL,
  composition text,
  medicine_type text NOT NULL CHECK (medicine_type = ANY (ARRAY['tablet'::text, 'syrup'::text, 'injection'::text, 'eye_drop'::text, 'ointment'::text, 'shampoo'::text])),
  strength text,
  is_preloaded boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT medicine_database_pkey PRIMARY KEY (id)
);
CREATE TABLE public.vaccine_database (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vaccine_name text NOT NULL,
  animal_type text CHECK (animal_type IS NULL OR (animal_type = ANY (ARRAY['dog'::text, 'cat'::text]))),
  default_interval_days integer NOT NULL,
  is_preloaded boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT vaccine_database_pkey PRIMARY KEY (id)
);
CREATE TABLE public.shampoo_database (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand_name text NOT NULL,
  category text NOT NULL CHECK (category = ANY (ARRAY['anti_fungal'::text, 'tick_flea'::text, 'anti_itch'::text, 'anti_dandruff'::text, 'general'::text])),
  is_preloaded boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT shampoo_database_pkey PRIMARY KEY (id)
);
CREATE TABLE public.medical_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL,
  visit_group_id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_date date NOT NULL,
  event_time time without time zone,
  clinic_id uuid,
  clinic_name text,
  vet_name text,
  visit_type jsonb NOT NULL DEFAULT '[]'::jsonb,
  reason_for_visit text,
  overall_notes text,
  follow_up_date date,
  follow_up_notes text,
  category_entries jsonb NOT NULL DEFAULT '[]'::jsonb,
  event_hash character varying,
  source text NOT NULL DEFAULT 'manual'::text CHECK (source = ANY (ARRAY['manual'::text, 'ai_extracted'::text])),
  verification_status text NOT NULL DEFAULT 'verified'::text CHECK (verification_status = ANY (ARRAY['verified'::text, 'pending'::text, 'rejected'::text])),
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  linked_events jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT medical_events_pkey PRIMARY KEY (id),
  CONSTRAINT medical_events_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pet_profiles(id),
  CONSTRAINT medical_events_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinic_database(id)
);
CREATE TABLE public.medical_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL,
  event_id uuid,
  file_url text NOT NULL,
  file_type text,
  label text,
  storage_path text,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT medical_documents_pkey PRIMARY KEY (id),
  CONSTRAINT medical_documents_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pet_profiles(id),
  CONSTRAINT medical_documents_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.medical_events(id)
);
CREATE TABLE public.edit_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  pet_id uuid NOT NULL,
  previous_value jsonb NOT NULL,
  changed_fields jsonb NOT NULL,
  changed_by text NOT NULL DEFAULT 'user'::text,
  changed_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT edit_history_pkey PRIMARY KEY (id),
  CONSTRAINT edit_history_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.medical_events(id),
  CONSTRAINT edit_history_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pet_profiles(id)
);
CREATE TABLE public.reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL,
  source_event_id uuid,
  linked_event_id uuid,
  type text NOT NULL CHECK (type = ANY (ARRAY['vaccination'::text, 'deworming'::text, 'anti_tick'::text, 'medication_end'::text, 'follow_up'::text, 'medication'::text, 'vet_visit'::text, 'grooming'::text, 'weight_check'::text, 'custom'::text, 'monitoring'::text, 'conditional'::text])),
  title text NOT NULL,
  description text,
  due_date date NOT NULL,
  due_time time without time zone,
  priority text NOT NULL DEFAULT 'medium'::text CHECK (priority = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text])),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'missed'::text, 'snoozed'::text])),
  repeat_type text NOT NULL DEFAULT 'none'::text CHECK (repeat_type = ANY (ARRAY['none'::text, 'daily'::text, 'weekly'::text, 'bi_weekly'::text, 'monthly'::text, 'quarterly'::text, 'bi_annually'::text, 'annually'::text, 'custom'::text])),
  custom_repeat_interval integer,
  custom_repeat_unit text CHECK (custom_repeat_unit IS NULL OR (custom_repeat_unit = ANY (ARRAY['days'::text, 'weeks'::text, 'months'::text]))),
  end_repeat_type text DEFAULT 'never'::text CHECK (end_repeat_type = ANY (ARRAY['never'::text, 'after_count'::text, 'on_date'::text])),
  end_repeat_date date,
  end_repeat_count integer,
  notes text,
  recurrence_group_id uuid,
  is_ai_generated boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reminders_pkey PRIMARY KEY (id),
  CONSTRAINT reminders_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pet_profiles(id),
  CONSTRAINT reminders_source_event_id_fkey FOREIGN KEY (source_event_id) REFERENCES public.medical_events(id),
  CONSTRAINT reminders_linked_event_id_fkey FOREIGN KEY (linked_event_id) REFERENCES public.medical_events(id)
);
CREATE TABLE public.backup_event_registrations_coimbatore (
  id uuid,
  pet_name text,
  owner_name text,
  owner_phone text,
  pet_health_id text,
  linked boolean,
  linked_user_id uuid,
  created_at timestamp with time zone
);
CREATE TABLE public.backup_early_access_registrations (
  id uuid,
  type text,
  name text,
  clinic_name text,
  mobile text,
  email text,
  city text,
  pet_type text,
  early_access boolean,
  created_at timestamp with time zone
);