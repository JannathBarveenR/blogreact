# PetOLife — Supabase Database Setup Guide

Complete instructions for setting up the Supabase database tables required for the Household-based Family Access system.

---

## Prerequisites

- A Supabase project with Auth enabled
- Access to the **SQL Editor** (Dashboard → SQL Editor → New Query)
- Service Role Key configured in your backend `.env`

---

## Step 1: Create Household Tables

Run this SQL to create the new household, members, invite, and activity tables:

```sql
-- Create households table
CREATE TABLE IF NOT EXISTS households (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_households_owner ON households(owner_user_id);
```

---

## Step 2: Create Household Members Table

```sql
-- Create household_members table
CREATE TABLE IF NOT EXISTS household_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'family_member',
  status TEXT NOT NULL DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(household_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_hm_household ON household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_hm_user ON household_members(user_id);
```

**Role values:** `owner`, `family_member`, `caregiver`
**Status values:** `active`, `invited`, `expired`, `removed`

---

## Step 3: Create Invite Tokens Table

```sql
-- Create invite_tokens table
CREATE TABLE IF NOT EXISTS invite_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'family_member',
  invited_by TEXT NOT NULL,
  invitee_name TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INT DEFAULT 1,
  used_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invite_token ON invite_tokens(token);
```

---

## Step 4: Create Task Activity Log Table

```sql
-- Create task_activity_log table
CREATE TABLE IF NOT EXISTS task_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  task_title TEXT NOT NULL,
  member_id UUID NOT NULL REFERENCES household_members(id),
  member_name TEXT NOT NULL,
  action TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_household ON task_activity_log(household_id);
CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON task_activity_log(timestamp);
```

**Action values:** `completed`, `skipped`, `reverted`

---

## Step 5: Add `household_id` Column to `pet_profiles`

```sql
-- Add household_id to existing pet_profiles table
ALTER TABLE pet_profiles
ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id);

CREATE INDEX IF NOT EXISTS idx_pet_profiles_household ON pet_profiles(household_id);
```

> **Note:** Existing pet profiles will have `household_id = NULL`. When the owner next creates a pet, a household will be auto-created. To manually backfill existing pets, see Step 7.

---

## Step 6: Enable Row Level Security

```sql
-- Enable RLS on new tables
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_activity_log ENABLE ROW LEVEL SECURITY;

-- Backend uses service_role key which bypasses RLS automatically.
-- No additional policies are needed for backend access.
```

---

## Step 7: (Optional) Backfill Existing Pets

If you already have pets in `pet_profiles` and want to create households for them:

```sql
-- For each distinct user_id in pet_profiles that doesn't have a household yet,
-- create a household and link the pets.
-- Run this only if needed:

DO $$
DECLARE
  r RECORD;
  hh_id UUID;
BEGIN
  FOR r IN
    SELECT DISTINCT user_id
    FROM pet_profiles
    WHERE user_id IS NOT NULL
      AND household_id IS NULL
  LOOP
    -- Create household
    INSERT INTO households (name, owner_user_id)
    VALUES (r.user_id || '''s Family', r.user_id)
    RETURNING id INTO hh_id;

    -- Add owner member
    INSERT INTO household_members (household_id, user_id, display_name, role, status)
    VALUES (hh_id, r.user_id, 'Owner', 'owner', 'active');

    -- Link all pets
    UPDATE pet_profiles
    SET household_id = hh_id
    WHERE user_id = r.user_id AND household_id IS NULL;
  END LOOP;
END $$;
```

---

## Step 8: Verify Setup

Run these queries to verify everything was created correctly:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('households', 'household_members', 'invite_tokens', 'task_activity_log')
ORDER BY table_name;

-- Check pet_profiles has household_id column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'pet_profiles'
  AND column_name = 'household_id';
```

Expected output: 4 tables listed, and `household_id` column of type `uuid`.

---

## Complete Schema Overview (Live Supabase Schema)

The following tables exist on the live Supabase instance (`https://olmpcmvgvdsgvnwiriut.supabase.co`). This documentation has been updated to reflect the exact columns, primary keys, foreign keys, and datatypes retrieved directly from the live database.

---

### 1. `user_profiles`
Holds extended user metadata for authenticated accounts (linked to Supabase `auth.users`).

| Column Name | Datatype | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, FK to `auth.users.id` | Handled during email/OAuth signup |
| `full_name` | `text` | Nullable | Full name of the pet parent |
| `phone` | `text` | Nullable | Registered mobile number |
| `email` | `text` | Nullable | Registered email address |
| `phone_verified` | `boolean` | Nullable | Flag indicating if phone OTP completed |
| `auth_provider` | `text` | Nullable | Method used (e.g. email, google) |
| `city` | `text` | Nullable | Resolved pincode lookup |
| `state` | `text` | Nullable | Resolved pincode lookup |
| `pincode` | `text` | Nullable | Indian 6-digit postal code |
| `avatar_url` | `text` | Nullable | Pulled from Supabase Storage `avatars` bucket |
| `created_at` | `timestamptz` | Default `now()` | Registration timestamp |
| `updated_at` | `timestamptz` | Default `now()` | Auto-updated on profile edit |

---

### 2. `pet_profiles`
Core entity representing pet profiles.

| Column Name | Datatype | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | Generated automatically |
| `user_id` | `uuid` | FK to `user_profiles.id` | Scopes ownership of the pet |
| `petolife_id` | `text` | Unique, Not Null | Generated unique code (e.g., `PET-CBE-DOG-000001`) |
| `pet_type` | `text` | Not Null | Dog, Cat, Bird, Rabbit, etc. |
| `pet_name` | `text` | Not Null | Pet's name |
| `breed` | `text` | Nullable | Pet's breed |
| `gender` | `text` | Nullable | Male or Female |
| `birth_date` | `date` | Nullable | Date of birth |
| `weight` | `numeric` | Nullable | Weight in kilograms |
| `color` | `text` | Nullable | Fur color/markings |
| `blood_group` | `text` | Nullable | Blood type |
| `identification_marks` | `text` | Nullable | Distinct markings |
| `pet_photo_url` | `text` | Nullable | Storage URL in `pet-photos` bucket |
| `household_id` | `uuid` | Nullable | Linked family household |
| `pet_health_id` | `text` | Nullable | Redundant reference string |
| `city` | `text` | Nullable | City registered |
| `state` | `text` | Nullable | State registered |
| `pincode` | `text` | Nullable | Pincode |
| `owner_name` | `text` | Nullable | Flat copy of parent full name |
| `owner_phone` | `text` | Nullable | Flat copy of parent mobile |
| `created_at` | `timestamptz` | Default `now()` | Profile creation time |
| `updated_at` | `timestamptz` | Default `now()` | Profile update time |

---

### 3. `medical_records`
Metadata for health documents, prescriptions, and diagnostics uploaded by the user.

| Column Name | Datatype | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | Generated automatically |
| `pet_profile_id` | `uuid` | FK to `pet_profiles.id` (CASCADE) | Links record to the specific pet |
| `user_id` | `uuid` | Nullable, FK to `user_profiles.id` | Owner authorization scoping |
| `title` | `text` | Not Null | User-assigned or parsed title |
| `category` | `text` | Not Null | e.g. Prescription, Lab Reports, Vaccination |
| `file_url` | `text` | Not Null | Storage URL in `medical-docs` bucket |
| `file_name` | `text` | Nullable | Original local filename |
| `file_type` | `text` | Nullable | MIME-type (e.g. application/pdf, image/jpeg) |
| `file_size` | `integer` | Nullable | Size in bytes |
| `storage_path` | `text` | Not Null | Bucket location path |
| `is_favorite` | `boolean` | Default `false` | Favorite filter flag |
| `created_at` | `timestamptz` | Default `now()` | Upload time |

---

### 4. `pet_health_ids`
Internal tracker for sequential Pet Health ID generation per city.

| Column Name | Datatype | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | Generated automatically |
| `health_id` | `text` | Unique, Not Null | Full generated ID (e.g., `PET-CBE-DOG-000001`) |
| `pet_profile_id` | `uuid` | FK to `pet_profiles.id` (CASCADE) | Backlink to owner profile |
| `city_code` | `text` | Not Null | 3-letter city prefix (e.g. `CBE`) |
| `pet_type_code` | `text` | Not Null | 3-letter type code (e.g. `DOG`) |
| `sequence_number` | `integer` | Not Null | Counter sequence used for generation |
| `pet_name` | `text` | Nullable | Copy of pet name |
| `owner_phone` | `text` | Nullable | Copy of owner phone |
| `created_at` | `timestamptz` | Default `now()` | ID generation time |

---

### 5. `pet_ids`
Official registration details (e.g., Microchip number, KCI, etc.).

| Column Name | Datatype | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | Generated automatically |
| `pet_profile_id` | `uuid` | FK to `pet_profiles.id` (CASCADE) | Linked pet profile |
| `id_name` | `text` | Not Null | Type of registration (e.g. `Microchip`) |
| `id_number` | `text` | Not Null | Identifier sequence |

---

### 6. `early_access_registrations`
Submissions from the early-access interest landing page forms.

| Column Name | Datatype | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | Generated automatically |
| `type` | `text` | Not Null | `pet_parent` or `veterinarian` |
| `name` | `text` | Nullable | Full name of contact |
| `clinic_name` | `text` | Nullable | Vet clinic name if applicable |
| `mobile` | `text` | Nullable | Contact number |
| `email` | `text` | Nullable | Contact email |
| `city` | `text` | Nullable | User location city |
| `pet_type` | `text` | Nullable | Specified pet interest |
| `early_access` | `boolean` | Default `true` | Requesting early launch code |
| `created_at` | `timestamptz` | Default `now()` | Interest submission time |

---

### 7. `task_activity_log`
Audit trails of completed tasks and family activities.

| Column Name | Datatype | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | Generated automatically |
| `household_id` | `uuid` | Not Null | Associated household ID |
| `pet_id` | `uuid` | FK to `pet_profiles.id` (CASCADE) | Associated pet ID |
| `task_id` | `text` | Not Null | Identifier of daily chore |
| `task_title` | `text` | Not Null | Title of activity |
| `member_id` | `uuid` | Not Null | Member user uuid |
| `member_name` | `text` | Not Null | Member display name |
| `action` | `text` | Not Null | Action type (e.g. `completed`) |
| `timestamp` | `timestamptz` | Default `now()` | Execution log time |

---

### 8. `pet_parents`
Marketing / early access registration records for pet owners.

| Column Name | Datatype | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | Generated automatically |
| `name` | `text` | Nullable | Name of owner |
| `mobile` | `text` | Nullable | Mobile number |
| `email` | `text` | Nullable | Email address |
| `city` | `text` | Nullable | Home city |
| `pet_type` | `text` | Nullable | Type of pet owned |
| `pet_name` | `text` | Nullable | Pet's name |
| `has_pet` | `boolean` | Nullable | Flag indicating if currently owns pet |
| `early_access` | `boolean` | Nullable | Requesting early access |
| `created_at` | `timestamptz` | Default `now()` | Creation date |

---

### 9. `vets`
Marketing / early access registration records for veterinarians.

| Column Name | Datatype | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | Generated automatically |
| `doctor_name` | `text` | Nullable | Vet name |
| `clinic_name` | `text` | Nullable | Clinic name |
| `mobile` | `text` | Nullable | Contact number |
| `email` | `text` | Nullable | Email |
| `city` | `text` | Nullable | Practice city |
| `early_access` | `boolean` | Nullable | Requesting early access |
| `created_at` | `timestamptz` | Default `now()` | Registration date |

---

### 10. `event_registrations_coimbatore`
Event registration details specific to the Coimbatore city launch campaign.

| Column Name | Datatype | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | Generated automatically |
| `pet_name` | `text` | Not Null | Registered pet name |
| `owner_name` | `text` | Nullable | Registered owner name |
| `owner_phone` | `text` | Not Null | Registered owner mobile |
| `pet_health_id` | `text` | Nullable | Coimbatore campaign health ID |
| `linked` | `boolean` | Nullable | Indicates if linked to core profile |
| `linked_user_id` | `uuid` | Nullable | Linked auth user |
| `created_at` | `timestamptz` | Default `now()` | Registration date |

