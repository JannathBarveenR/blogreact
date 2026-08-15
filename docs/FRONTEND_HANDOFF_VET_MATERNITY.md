# Frontend Handoff Documentation: Vet & Maternity Platform

**Target Audience:** Abhishek (Frontend Lead) & Frontend Development Team  
**Platform Version:** PetOLife MVP V2 (Backend & Database Release)  
**Branch:** `feat/vet-platform`  
**Date:** August 15, 2026  

---

## 1. System Overview & Core Directives

This document specifies the backend API contracts, database schemas, and Role-Based Access Control (RBAC) rules for the **Vet Platform & Maternity Platform** in PetOLife MVP V2.

> [!IMPORTANT]
> **Modality Change:**
> - **In-Person Consultations are REMOVED COMPLETELY**. Do not render any option, tab, or form for in-person clinic visits.
> - **Online Video Consultations ARE ACTIVE** via Calendly Python service integration. All booking flows generate a personalized Calendly scheduling link that pre-fills user and pet information and syncs meeting links automatically via webhooks.

---

## 2. Role-Based Access Control (RBAC) Matrix

The system enforces strict RBAC at both the FastAPI backend middleware layer and Supabase Row Level Security (RLS) policies.

| Role | Description | Access Scope |
| :--- | :--- | :--- |
| `pet_owner` | Default role for pet parents | Can book online consultations for their own pets, view their own maternity records & milestones. |
| `vet` | Verified Veterinary Doctor | Can view assigned online consultations, add/update clinical notes & prescriptions, view assigned patient maternity records. |
| `supervisor` | Platform Admin / Supervisor | Full administrative access: role management, verifying doctors, system-wide audits, and overrides. |
| `staff` | Clinic / Platform Support Staff | Operational access for assisting pet parents and doctors. |

### Authentication Header Format
All requests to `/api/*` endpoints require the Supabase JWT token:
```http
Authorization: Bearer <SUPABASE_JWT_ACCESS_TOKEN>
Content-Type: application/json
```

---

## 3. API Endpoints Specification

### A. Online Vet Consultations (`/api/vet/*`)

#### 1. List Available Verified Vets
- **Method:** `GET`
- **Endpoint:** `/api/vet/doctors`
- **Access:** All authenticated users (`pet_owner`, `vet`, `supervisor`, `staff`)
- **Response `200 OK`:**
```json
[
  {
    "id": "c1f7a4b8-4d5e-4e6f-8a9b-0c1d2e3f4a5b",
    "user_id": "a9b8c7d6-e5f4-3a2b-1c0d-9e8f7a6b5c4d",
    "doctor_name": "Dr. Sarah Jenkins",
    "specialization": "Small Animal & Reproductive Medicine",
    "license_number": "VET-IN-2026-8812",
    "bio": "Experienced vet specializing in pet pregnancy and online care.",
    "clinic_name": "PetOLife Virtual Clinic",
    "city": "Coimbatore",
    "calendly_url": "https://calendly.com/dr-sarah-petolife/online-consultation",
    "consultation_fee": 500.00,
    "is_verified": true,
    "is_active": true,
    "created_at": "2026-08-15T10:00:00Z"
  }
]
```

---

#### 2. Generate Online Consultation Booking Link
- **Method:** `POST`
- **Endpoint:** `/api/vet/consultations/online/book-link`
- **Access:** `pet_owner`, `supervisor`
- **Request Body:**
```json
{
  "pet_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "vet_id": "c1f7a4b8-4d5e-4e6f-8a9b-0c1d2e3f4a5b",
  "reason_for_consultation": "General maternity checkup and diet consultation",
  "scheduled_start_time": "2026-08-18T14:00:00Z"
}
```
- **Response `200 OK`:**
```json
{
  "consultation_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "pet_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "vet_id": "c1f7a4b8-4d5e-4e6f-8a9b-0c1d2e3f4a5b",
  "consultation_type": "online_video",
  "booking_url": "https://calendly.com/dr-sarah-petolife/online-consultation?name=John+Doe&email=owner%40example.com&a1=Pet+Name%3A+Bella&a2=Consultation+ID%3A+9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "status": "scheduled"
}
```
*Frontend Guidance:* Redirect or open `booking_url` in an iframe / popup modal for the user to pick their exact time slot on Calendly.

---

#### 3. List Online Consultations
- **Method:** `GET`
- **Endpoint:** `/api/vet/consultations`
- **Query Params:** `pet_id` (optional)
- **Access:** `pet_owner` (own pets), `vet` (assigned consultations), `supervisor` (all)
- **Response `200 OK`:**
```json
[
  {
    "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "pet_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "user_id": "11111111-2222-3333-4444-555555555555",
    "vet_id": "c1f7a4b8-4d5e-4e6f-8a9b-0c1d2e3f4a5b",
    "consultation_type": "online_video",
    "calendly_event_id": "evt_998877",
    "meeting_link": "https://meet.google.com/xyz-abc-def",
    "status": "scheduled",
    "scheduled_start_time": "2026-08-18T14:00:00Z",
    "scheduled_end_time": "2026-08-18T14:30:00Z",
    "reason_for_consultation": "General maternity checkup and diet consultation",
    "clinical_notes": null,
    "prescription_summary": null,
    "created_at": "2026-08-15T12:00:00Z"
  }
]
```

---

#### 4. Update Clinical Notes & Prescription (Vet/Supervisor Only)
- **Method:** `PATCH`
- **Endpoint:** `/api/vet/consultations/{consultation_id}/notes`
- **Access:** `vet` (Doctor), `supervisor`
- **Request Body:**
```json
{
  "clinical_notes": "Patient Bella is in week 5 of gestation. Fetal development is normal. Advised calcium supplements.",
  "prescription_summary": "Tab. PetCal 1 tab daily after meals for 30 days.",
  "status": "completed"
}
```

---

### B. Maternity Platform (`/api/maternity/*`)

#### 1. Create Maternity Record
- **Method:** `POST`
- **Endpoint:** `/api/maternity/records`
- **Access:** `pet_owner`, `vet`, `supervisor`
- **Request Body:**
```json
{
  "pet_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "stage": "gestation",
  "mating_date": "2026-07-10",
  "expected_delivery_date": "2026-09-12",
  "litter_size_expected": 5,
  "health_notes": "Golden Retriever first litter.",
  "attending_vet_id": "c1f7a4b8-4d5e-4e6f-8a9b-0c1d2e3f4a5b"
}
```

---

#### 2. Get Detailed Maternity Record & Milestones
- **Method:** `GET`
- **Endpoint:** `/api/maternity/records/{record_id}`
- **Access:** `pet_owner`, `vet`, `supervisor`
- **Response `200 OK`:**
```json
{
  "id": "m1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
  "pet_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "user_id": "11111111-2222-3333-4444-555555555555",
  "stage": "gestation",
  "mating_date": "2026-07-10",
  "expected_delivery_date": "2026-09-12",
  "actual_delivery_date": null,
  "litter_size_expected": 5,
  "litter_size_actual": 0,
  "health_notes": "Golden Retriever first litter.",
  "ultrasound_findings": "5 active gestational sacs observed at day 30.",
  "attending_vet_id": "c1f7a4b8-4d5e-4e6f-8a9b-0c1d2e3f4a5b",
  "status": "active",
  "created_at": "2026-07-11T09:00:00Z",
  "milestones": [
    {
      "id": "ms-101",
      "maternity_record_id": "m1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
      "milestone_date": "2026-08-10",
      "title": "30-Day Ultrasound Check",
      "milestone_type": "ultrasound",
      "notes": "Confirmed pregnancy and sac counts.",
      "vitals": {"maternal_weight": "24.5 kg", "fetal_heartbeat": "detected"},
      "completed": true,
      "created_at": "2026-07-11T09:05:00Z"
    }
  ]
}
```

---

#### 3. Add Maternity Milestone
- **Method:** `POST`
- **Endpoint:** `/api/maternity/records/{record_id}/milestones`
- **Access:** `pet_owner`, `vet`, `supervisor`
- **Request Body:**
```json
{
  "milestone_date": "2026-08-25",
  "title": "Pre-whelping Deworming & Nutrition Check",
  "milestone_type": "deworming",
  "notes": "Administer prescribed dewormer prior to birth.",
  "vitals": {"target_weight": "26.0 kg"}
}
```

---

### C. Supervisor Administration (`/api/supervisor/*`)

#### 1. Assign User RBAC Role
- **Method:** `POST`
- **Endpoint:** `/api/supervisor/assign-role`
- **Access:** `supervisor` ONLY
- **Request Body:**
```json
{
  "user_id": "a9b8c7d6-e5f4-3a2b-1c0d-9e8f7a6b5c4d",
  "role": "vet"
}
```

#### 2. Verify Vet Profile
- **Method:** `POST`
- **Endpoint:** `/api/supervisor/vets/{vet_id}/verify?is_verified=true`
- **Access:** `supervisor` ONLY

---

## 4. Database SQL Files Included in Commit

1. **Schema Migration SQL:** `backend/supabase/migrations/vet_maternity_platform_schema.sql`
   - Safe, non-destructive SQL creating `user_roles`, `vet_profiles`, `online_consultations`, `maternity_records`, `maternity_milestones`.
2. **Supervisor RBAC SQL:** `backend/supabase/supervisor_rbac_setup.sql`
   - Contains RPC functions `assign_user_role()`, `is_supervisor()`, `is_vet()`, and complete Supabase RLS security policies.

---

## 5. Summary of Frontend Directives

1. **Remove In-Person Consultation components completely**.
2. **Implement Online Video Consultation modal** using the `booking_url` returned by `/api/vet/consultations/online/book-link`.
3. **Display Calendly video links** (`meeting_link`) in the user's upcoming consultations view.
4. **Use RBAC roles** (`pet_owner`, `vet`, `supervisor`) to conditionally show Doctor Notes controls or Admin Role Assignment dashboards.
