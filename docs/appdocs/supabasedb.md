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

## Complete Schema Overview (Updated)

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `households` | Core household entity | `owner_user_id` → auth user |
| `household_members` | Users in a household | `household_id` → households, `user_id` → auth user |
| `invite_tokens` | Secure invite links | `household_id` → households |
| `task_activity_log` | Immutable task event log | `household_id` → households, `pet_id` → pet_profiles, `member_id` → household_members |
| `pet_profiles` | Core pet data | `user_id` → auth user, `household_id` → households |
| `pet_ids` | External IDs (KCI, microchip) | `pet_profile_id` → pet_profiles |
| `care_team` | Vet + emergency contacts | `pet_profile_id` → pet_profiles (1:1) |
| `daily_task_logs` | Daily care tasks per pet | `pet_profile_id` → pet_profiles |
| `daily_streaks` | Streak tracking per pet | `pet_profile_id` → pet_profiles (1:1) |

### Entity Relationship (Updated)

```
auth.users (Supabase Auth)
    │
    │ user_id (TEXT)
    │
    ├─── household_members ──── households ──── invite_tokens
    │                              │
    │                              │ household_id
    │                              │
    v                              v
pet_profiles ──────┬────── pet_ids (1:many)
                   │
                   ├────── care_team (1:1)
                   │
                   ├────── daily_task_logs (1:many, per day)
                   │
                   ├────── daily_streaks (1:1)
                   │
                   └────── task_activity_log (1:many, per action)
```

---

## Quick Copy: Run Everything at Once

Copy and paste this entire block into the Supabase SQL Editor to set up everything in one go:

```sql
-- 1. Households
CREATE TABLE IF NOT EXISTS households (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_households_owner ON households(owner_user_id);

-- 2. Household Members
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

-- 3. Invite Tokens
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

-- 4. Task Activity Log
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

-- 5. Add household_id to pet_profiles
ALTER TABLE pet_profiles
ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id);
CREATE INDEX IF NOT EXISTS idx_pet_profiles_household ON pet_profiles(household_id);

-- 6. Enable RLS
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_activity_log ENABLE ROW LEVEL SECURITY;
```
