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
  color text,
  blood_group text,
  identification_marks text,
  pet_photo_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  household_id uuid,
  pet_health_id text,
  city text,
  state text,
  pincode text,
  owner_name text,
  owner_phone text,
  CONSTRAINT pet_profiles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.task_activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL,
  pet_id uuid NOT NULL,
  task_id text NOT NULL,
  task_title text NOT NULL,
  member_id uuid NOT NULL,
  member_name text NOT NULL,
  action text NOT NULL,
  timestamp timestamp with time zone DEFAULT now(),
  CONSTRAINT task_activity_log_pkey PRIMARY KEY (id),
  CONSTRAINT task_activity_log_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pet_profiles(id)
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
CREATE TABLE public.pet_health_ids (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  health_id text NOT NULL UNIQUE,
  pet_profile_id uuid,
  city_code text NOT NULL,
  pet_type_code text NOT NULL,
  sequence_number integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  owner_phone text,
  pet_name text,
  CONSTRAINT pet_health_ids_pkey PRIMARY KEY (id),
  CONSTRAINT pet_health_ids_pet_profile_id_fkey FOREIGN KEY (pet_profile_id) REFERENCES public.pet_profiles(id)
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
CREATE TABLE public.event_registrations_coimbatore (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pet_name text NOT NULL,
  owner_name text,
  owner_phone text NOT NULL,
  pet_health_id text,
  linked boolean DEFAULT false,
  linked_user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_registrations_coimbatore_pkey PRIMARY KEY (id),
  CONSTRAINT pet_registrations_staging_linked_user_id_fkey FOREIGN KEY (linked_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.early_access_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type text NOT NULL,
  name text,
  clinic_name text,
  mobile text,
  email text,
  city text,
  pet_type text,
  early_access boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT early_access_registrations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.pet_parents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text,
  mobile text,
  email text,
  city text,
  pet_type text,
  pet_name text,
  has_pet boolean,
  early_access boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pet_parents_pkey PRIMARY KEY (id)
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
CREATE TABLE public.pet_ids (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pet_profile_id uuid,
  id_name text NOT NULL,
  id_number text NOT NULL,
  CONSTRAINT pet_ids_pkey PRIMARY KEY (id),
  CONSTRAINT pet_ids_pet_profile_id_fkey FOREIGN KEY (pet_profile_id) REFERENCES public.pet_profiles(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  seller_id uuid,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  category text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES auth.users(id)
);
CREATE TABLE public.product_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid,
  image_url text NOT NULL,
  sort_order integer DEFAULT 0,
  CONSTRAINT product_images_pkey PRIMARY KEY (id),
  CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);