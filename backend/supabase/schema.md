## DB latest state schema

## Table `pet_profiles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  Nullable |
| `petolife_id` | `text` |  Unique |
| `pet_type` | `text` |  |
| `pet_name` | `text` |  |
| `breed` | `text` |  Nullable |
| `gender` | `text` |  Nullable |
| `birth_date` | `date` |  Nullable |
| `weight` | `numeric` |  Nullable |
| `blood_group` | `text` |  Nullable |
| `identification_marks` | `text` |  Nullable |
| `pet_photo_url` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |
| `pet_health_id` | `text` |  Nullable |
| `health_conditions` | `jsonb` |  Nullable |
| `pet_attributes` | `jsonb` |  Nullable |
| `identification_ids` | `jsonb` |  Nullable |
| `approx_age` | `text` |  Nullable |

## Table `user_profiles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `phone` | `text` |  Nullable Unique |
| `full_name` | `text` |  Nullable |
| `email` | `text` |  Nullable |
| `phone_verified` | `bool` |  Nullable |
| `auth_provider` | `text` |  Nullable |
| `city` | `text` |  Nullable |
| `state` | `text` |  Nullable |
| `pincode` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |
| `avatar_url` | `text` |  Nullable |
| `is_seller` | `bool` |  Nullable |
| `address` | `text` |  Nullable |

## Table `vets`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `doctor_name` | `text` |  Nullable |
| `clinic_name` | `text` |  Nullable |
| `mobile` | `text` |  Nullable |
| `email` | `text` |  Nullable |
| `city` | `text` |  Nullable |
| `early_access` | `bool` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `clinic_database`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `text` |  |
| `address` | `text` |  Nullable |
| `phone` | `text` |  Nullable |
| `created_by` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  |

## Table `medicine_database`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `brand_name` | `text` |  |
| `composition` | `text` |  Nullable |
| `medicine_type` | `text` |  |
| `strength` | `text` |  Nullable |
| `is_preloaded` | `bool` |  |
| `created_at` | `timestamptz` |  |

## Table `vaccine_database`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `vaccine_name` | `text` |  |
| `animal_type` | `text` |  Nullable |
| `default_interval_days` | `int4` |  |
| `is_preloaded` | `bool` |  |
| `created_at` | `timestamptz` |  |

## Table `shampoo_database`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `brand_name` | `text` |  |
| `category` | `text` |  |
| `is_preloaded` | `bool` |  |
| `created_at` | `timestamptz` |  |

## Table `medical_events`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `pet_id` | `uuid` |  |
| `visit_group_id` | `uuid` |  |
| `event_date` | `date` |  |
| `event_time` | `time` |  Nullable |
| `clinic_id` | `uuid` |  Nullable |
| `clinic_name` | `text` |  Nullable |
| `vet_name` | `text` |  Nullable |
| `visit_type` | `jsonb` |  |
| `reason_for_visit` | `text` |  Nullable |
| `overall_notes` | `text` |  Nullable |
| `follow_up_date` | `date` |  Nullable |
| `follow_up_notes` | `text` |  Nullable |
| `category_entries` | `jsonb` |  |
| `event_hash` | `varchar` |  Nullable |
| `source` | `text` |  |
| `verification_status` | `text` |  |
| `is_deleted` | `bool` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |
| `linked_events` | `jsonb` |  Nullable |
| `document_ids` | `jsonb` |  |

## Table `edit_history`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `event_id` | `uuid` |  |
| `pet_id` | `uuid` |  |
| `previous_value` | `jsonb` |  |
| `changed_fields` | `jsonb` |  |
| `changed_by` | `text` |  |
| `changed_at` | `timestamptz` |  |

## Table `reminders`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `pet_id` | `uuid` |  |
| `source_event_id` | `uuid` |  Nullable |
| `linked_event_id` | `uuid` |  Nullable |
| `type` | `text` |  |
| `title` | `text` |  |
| `description` | `text` |  Nullable |
| `due_date` | `date` |  |
| `due_time` | `time` |  Nullable |
| `priority` | `text` |  |
| `status` | `text` |  |
| `repeat_type` | `text` |  |
| `custom_repeat_interval` | `int4` |  Nullable |
| `custom_repeat_unit` | `text` |  Nullable |
| `end_repeat_type` | `text` |  Nullable |
| `end_repeat_date` | `date` |  Nullable |
| `end_repeat_count` | `int4` |  Nullable |
| `notes` | `text` |  Nullable |
| `recurrence_group_id` | `uuid` |  Nullable |
| `is_ai_generated` | `bool` |  |
| `created_at` | `timestamptz` |  |

## Table `backup_event_registrations_coimbatore`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` |  Nullable |
| `pet_name` | `text` |  Nullable |
| `owner_name` | `text` |  Nullable |
| `owner_phone` | `text` |  Nullable |
| `pet_health_id` | `text` |  Nullable |
| `linked` | `bool` |  Nullable |
| `linked_user_id` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `backup_early_access_registrations`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` |  Nullable |
| `type` | `text` |  Nullable |
| `name` | `text` |  Nullable |
| `clinic_name` | `text` |  Nullable |
| `mobile` | `text` |  Nullable |
| `email` | `text` |  Nullable |
| `city` | `text` |  Nullable |
| `pet_type` | `text` |  Nullable |
| `early_access` | `bool` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `pet_lifestyle`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `pet_id` | `uuid` |  Unique |
| `answers` | `jsonb` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `backup_medical_records_pre_unify`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` |  Nullable |
| `pet_profile_id` | `uuid` |  Nullable |
| `title` | `text` |  Nullable |
| `category` | `text` |  Nullable |
| `file_url` | `text` |  Nullable |
| `storage_path` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `user_id` | `uuid` |  Nullable |
| `is_favorite` | `bool` |  Nullable |
| `file_name` | `text` |  Nullable |
| `file_type` | `text` |  Nullable |
| `file_size` | `int4` |  Nullable |

## Table `backup_medical_documents_pre_unify`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` |  Nullable |
| `pet_id` | `uuid` |  Nullable |
| `event_id` | `uuid` |  Nullable |
| `file_url` | `text` |  Nullable |
| `file_type` | `text` |  Nullable |
| `label` | `text` |  Nullable |
| `storage_path` | `text` |  Nullable |
| `uploaded_at` | `timestamptz` |  Nullable |

## Table `medical_records`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `pet_profile_id` | `uuid` |  |
| `user_id` | `uuid` |  Nullable |
| `log` | `int2` |  |
| `event_id` | `uuid` |  Nullable |
| `title` | `text` |  Nullable |
| `category` | `text` |  |
| `notes` | `text` |  Nullable |
| `is_favorite` | `bool` |  |
| `label` | `text` |  Nullable |
| `file_url` | `text` |  |
| `storage_path` | `text` |  |
| `created_at` | `timestamptz` |  |

## RLS Policies

### `pet_lifestyle`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Users can manage their own pet's lifestyle` | ALL | public | PERMISSIVE | `(pet_id IN ( SELECT pet_profiles.id    FROM pet_profiles   WHERE (pet_profiles.user_id = auth.uid())))` | `(pet_id IN ( SELECT pet_profiles.id    FROM pet_profiles   WHERE (pet_profiles.user_id = auth.uid())))` |

### `user_profiles`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Users can manage their own profile` | ALL | authenticated | PERMISSIVE | `(auth.uid() = id)` | `(auth.uid() = id)` |

### `pet_profiles`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Users can manage their own pets` | ALL | authenticated | PERMISSIVE | `(auth.uid() = user_id)` | `(auth.uid() = user_id)` |
| `Anyone can view pet profiles` | SELECT | anon, authenticated | PERMISSIVE | `true` | — |

### `vets`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Anyone can register as vet` | INSERT | anon, authenticated | PERMISSIVE | — | `true` |

