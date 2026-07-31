# PetOLife MVP V2 — Exhaustive Project Context Protocol

This document is the absolute **Single Source of Truth** for the PetOLife MVP V2 application. It contains an exhaustive, file-by-file breakdown of the entire codebase, covering frontend rendering flows, state variables, component logic, backend API definitions, and database schemas.

Any AI or developer reading this document will have complete context of every single small detail in the system and should NOT need to analyze the codebase manually.

---

## 1. System Stack Overview
- **Frontend Framework**: React 19 (Vite build system).
- **Routing**: `react-router-dom` (v7.11.0).
- **Styling**: Tailwind CSS v4 is integrated as the base utility layer, but strict custom Vanilla CSS (`.css` files adjacent to components) is used for component-level styling and overrides.
- **State Management & Caching**: TanStack Query / React Query v5 (`@tanstack/react-query`) is used for caching, background refetching, and cache invalidation of timeline feed, reminders, medical events, records, and reference data. Redux or React Context are not used for global app data.
- **Backend Framework**: FastAPI (Python 3.10+).
- **Database & Storage**: Supabase (PostgreSQL, Supabase Auth) and S3 bucket integrations for private document storage (referenced as `medical-docs` bucket name).
- **Server Deployment**: Backend runs via `uvicorn app.main:app`. Frontend runs via `npm run dev` in local environments.

---

## 2. Frontend Exhaustive File-by-File Analysis

### 2.1. Root Files & Configuration
- **`src/main.jsx`**: Main entry point. Mounts the React app inside `React.StrictMode` with TanStack Query's `QueryClientProvider` wrapping the root router.
- **`src/App.jsx`**: Contains routing definition using standard lazy loading.
  - **PKCE OAuth Interceptor**: On mount, if URL query parameters contain `code=` or `access_token=`, it intercepts and forwards the request to `/auth/callback` to process the OAuth code exchange.
  - **Routes**:
    - `/` -> Redirects to `/landing`.
    - `/landing` -> `<LandingPg />` (early interest signup for vets/parents).
    - `/login` -> `<Login />` (auth entry containing login, signup, forgot password forms).
    - `/reset-password` -> `<ResetPassword />` (captures access token from reset links and changes passwords).
    - `/pet/:id` -> `<PublicPetProfile />` (public read-only page fetched via public endpoint).
    - `/auth/callback` -> `<AuthCallback />` (exchanges PKCE OAuth codes with Supabase and sets tokens).
    - `/home` -> renders `<MainLayout />` with active tab `"home"`.
    - `/timeline` -> renders `<MainLayout />` with active tab `"timeline"`.
    - `/records` -> renders `<MainLayout />` with active tab `"records"`.
    - `/profile` -> renders `<MainLayout />` with active tab `"profile"`.
    - `/create-pet-profile` -> `<ProfileCreate />` (Wizard steps 1 to 4).
    - `/parent-profile` -> `<ParentProfile />` (Onboarding / profile completion form).
    - `/reminders` -> `<RemindersPage />` (Full active and completed reminders dashboard).
    - `/timeline/event/:eventId` & `/records/event/:eventId` -> `<EventDetailPage />` (Display details of a medical event).
    - `/survey/:petId` -> `<PetLifestyleSurveyPage />` (Lifestyle habits questionnaire).
    - `/pet-parent-academy` & `/pet-parent-academy/blogs/:id` -> `<Blog />` (Articles hub).
    - `*` -> `<NotFoundPage />` (Standard 404 handler).

### 2.2. Utilities & Hooks
- **`src/hooks/useAuth.js`**: Authentication manager.
  - **State**: `user`, `token`, `isAuthenticated`, `loading`.
  - **Functions**: `login()`, `logout()`, `validateSession()` (validates access token via `/api/auth/me`).
- **`src/hooks/usePetsQuery.js`**: TanStack Query wrappers for pet profiles.
  - `usePets(userId)`: Queries `/api/pet-profile/by-user/{userId}`. Cached for 5 minutes.
  - `useInvalidatePets()`: Helper to invalidate pets query cache after creation, updates, or deletion.
- **`src/hooks/useTimelineQueries.js`**: TanStack Query wrapper suite for medical events, reminders, records, and autocomplete reference lookups.
  - `useTimeline(petId, view)`: Fetches chronological or category-grouped feeds from `/api/v2/pets/{petId}/timeline`.
  - `useMedicalEvent(petId, eventId)`: Fetches single event details.
  - `useCreateMedicalEvent(petId)`, `useUpdateMedicalEvent(petId)`, `useDeleteMedicalEvent(petId)`: Medical event mutations. Invalidates all timeline queries on success.
  - `useReminders(petId)`, `useCreateReminder(petId)`, `useCompleteReminder(petId)`, `useSnoozeReminder(petId)`: Reminder mutations.
  - `useRecords(petId, { log, eventId })`: Fetches unified records.
  - `useUploadEventRecord(petId)`: Uploads document linked to event (log=1).
  - `useUploadRawRecord(petId)`: Uploads standalone document (log=0).
  - `useDeleteRecord(petId)`: Deletes records.
  - `useToggleRecordFavorite(petId)`: Favorites records.
  - `useVaccines()`, `useMedicines()`, `useShampoos()`, `useClinics()`: Reference databases fetchers.
- **`src/utils/fetchWithAuth.js`**: Authenticated HTTP client wrapper that injects the `Authorization: Bearer <access_token>` header on all requests.

### 2.3. The App Shell (`src/components/MainLayout/`)
- **`MainLayout.jsx`**: Container for authenticated views.
  - **State**: `activeTab` (home, timeline, records, profile) initialized based on URL route.
  - **Logic**: Integrates `usePets(user.id)` to pull user's pets and caches active pet ID in `localStorage`. Automatically switches view panel and passes down `pets`, `activePetId`, and query refetch utilities.
- **`MainLayout.css`**: Fixed layout positioning containing top headers, responsive scroll areas, and sticky footer.

### 2.4. Navigation Components (`src/components/common/`)
- **`TopNav/TopNav.jsx`**: Top header bar containing PetOLife brand logotype and navigation buttons.
- **`BottomNav/BottomNav.jsx`**: Footer navigation menu containing Home, Timeline, records vault, Profile tabs, and floating Action Button.
- **`PetAvatar.jsx`**: Renders pet photos or matches species names (Dog, Cat, etc.) to fallback SVG designs.

### 2.5. Onboarding, Home & Survey
- **`src/components/ParentProfile/ParentProfile.jsx`**: Onboarding profile wizard. Required before accessing `/home`. Resolves Indian postal pincode to City/State via location service and updates the user profile.
- **`src/components/Home/Home.jsx`**: Conditional router for dashboard views. Displays promotional setup cards if `pets.length === 0`, otherwise renders `PetDashboard`.
- **`src/components/Home/PetDashboard.jsx`**: Renders summary widget cards, including:
  - `ProfileCard`: Displays selected pet age/breed details and custom dropdown selector.
  - `QuickActions`: Navigation panel.
  - `NoRecordsCard`: Visual overview of latest records.
  - Education Banner: Invites user to complete `PetLifestyleSurveyPage` and access the Academy blog.
- **`src/components/Home/PetLifestyleSurveyPage.jsx`**: Multi-page habit logging form. Submits questionnaire responses to `/api/pet-profile/{petId}/lifestyle` to earn badges and unlock customized tips.

### 2.6. User Profile Management (`src/components/UserProfile/`)
- **`UserProfile.jsx`**: Displays overall settings panel. Imports `EditableUserCard` and `EditablePetCard`.
- **`EditableUserCard.jsx`**: Form to edit parent name, phone, pincode, and address. Posts user avatar uploads to `/api/user-profile/{userId}/avatar`.
- **`EditablePetCard.jsx`**: Form to edit weight, blood group, identification marks, and colors. Handles pet deletion via `DELETE /api/pet-profile/{petId}` and photo updates.

### 2.7. Timeline & Event Details (`src/components/Timeline/`)
- **`TimelinePage.jsx`**: Lists chronological or category-filtered logs of medical history. Features `FilterChips` to select specific categories (diagnosis, medication, vaccination, deworming, anti_tick_flea, grooming).
- **`TimelineCard.jsx`**: Standardized card block displaying summary info for diagnoses, treatments, or vaccines. Clicking navigates to event detail page.
- **`EventDetailPage/EventDetailPage.jsx`**: Detail page displaying a vet visit event with all its category entries, attachments, clinic details, and actions.
- **`AddPawNote/AddPawNote.jsx`**: Interactive overlay launcher that lets user pick category types and launches one of the forms under `src/components/Timeline/Forms/`.
- **Forms Suite (`src/components/Timeline/Forms/`)**:
  - `VetVisitForm.jsx`: The **Master Form** containing top fields (Date, Time, Clinic, Vet Name, Visit Type, Reason, Overall Notes, Follow-up Date/Notes).
  - `VaccinationForm.jsx`: Sub-category form containing vaccine search, dosage sites, next due date suggestion, and reminders.
  - `MedicationForm.jsx`: Sub-category form featuring medicine database search, repeat schedules (daily, custom slots), and dosage units.
  - `DewormingForm.jsx` / `OtherForm.jsx`: Specialized logging inputs.
  - `shared/`: Autocomplete selectors, timepickers, datepickers, multi-file document upload boxes, and reminder switches.

### 2.8. Medical Records Vault (`src/components/medical/`)
- **`MedicalRecords.jsx`**: Vault dashboard displaying all documents. Uses TanStack Query to manage listings, standalone log=0 uploads, deletion, and toggle favorites.

### 2.9. Profile Creation Wizard (`src/components/ProfileCreation/`)
- **`ProfileCreation.jsx`**: Step 1 to 4 form launcher creating a new pet.
  - Merges breed, type, microchip number, dates of birth, and profile photos into a single `FormData` payload submitted to `POST /api/pet-profile/`.

### 2.10. Public QR Profiles & Blog
- **`src/components/PublicPetProfile/PublicPetProfile.jsx`**: Public-facing profile card displayed on mobile scanning of POL tags. Shows vaccination history, primary identification, care notes, and masked owner contact info.
- **`src/components/petcard/petcard.jsx`**: Public Pet ID card UI logic.
- **`src/components/Blog/Blog.jsx`**: Standard reading hub rendering articles for health, training, nutrition, and everyday care.

---

## 3. Backend Exhaustive File-by-File Analysis (FastAPI)

### 3.1. Core Configuration
- **`app/main.py`**: Initializes the FastAPI app, sets up Trusted Host proxy headers middleware, handles production/dev CORS, and mounts V1 routers and V2 routers.
- **`app/config.py`**: Validates server environments and loads secrets (Supabase URLs, service role keys, S3 credentials).
- **`app/supabase_client.py`**: Creates two client singletons: `supabase` (Anon role) and `supabase_admin` (Service role key to bypass row-level security for admin operations).
- **`app/s3_client.py`**: Manages secure file uploads, deletion, and presigned 1-hour access links inside private S3 storage.

### 3.2. Shared Service Layer (`app/services/`)
- **`pet_service.py`**:
  - `get_all_user_pets(user_id)`: Fetches pets from `pet_profiles`.
  - `verify_ownership(pet_id, user_id)`: Verifies if a pet is owned by a given user.
- **`medical_record_service.py`**:
  - `save_record(pet_id, user_id, file_bytes, filename, ...)`: Handles private S3 uploads and inserts records to `medical_records` table, automatically computing the `log` type.
  - `fresh_url(storage_path)`: Resolves fresh access links on read.

### 3.3. Timeline V2 Core Package (`app/timeline/`)
- **`services/event_service.py`**: Contains CRUD actions for `medical_events` table. Runs same-day hashing checks via `DedupeService`, queries suggested due dates from the rule engine, writes logs to `edit_history` table, and soft deletes.
- **`services/category_engine.py`**: Aggregates `medical_events` and attaches their `medical_records` files. Outputs category-grouped buckets or flat chronological lists.
- **`services/reminder_engine.py`**:
  - `suggest_next_due(entry, event_date)`: Predicts booster dates (e.g. 90 days for deworming, 30 days for anti-tick, vaccine interval mapping).
  - `generate_for_event(event)`: Creates auto-reminders for medical event entries.
  - `create_manual_reminder(pet_id, body)`: Inserts manual/recurring reminders. Generates `recurrence_group_id` for repeating chains.
  - `generate_dose_schedule(pet_id, payload)`: Generates detailed dose reminders per frequency/day.
- **`services/dedupe_service.py`**: SHA-256 duplicate calculation to prevent duplicate entries on the same day.
- **`services/reference_data_service.py`**: Performs lookup queries on medicines, vaccines, shampoos, and clinics.
- **`services/export_service.py`**: Flat CSV output formatting and ReportLab-based PDF summary report generation.

### 3.4. V2 Endpoints (`app/routers/v2/`)
- **`timeline.py`**: GET `/api/v2/pets/{pet_id}/timeline` (flat or grouped) and `/api/v2/pets/{pet_id}/timeline/visit/{visit_group_id}`.
- **`medical_events.py`**: POST/GET/PUT/DELETE for `/api/v2/pets/{pet_id}/medical-events` and links events together.
- **`reminders.py`**: GET/POST/PUT/DELETE for `/api/v2/pets/{pet_id}/reminders`. Complete, snooze, mark-missed, and dose scheduler endpoints.
- **`records.py`**:
  - Unified GET `/api/v2/pets/{pet_id}/records` and DELETE.
  - POST `/api/v2/pets/{pet_id}/records` (log=0 standalone upload).
  - POST `/api/v2/pets/{pet_id}/medical-events/{event_id}/records` (log=1 event attachments).
- **`reference_data.py`**: Lookups for `/api/v2/reference/` categories.
- **`export.py`**: PDF and CSV download routes.

### 3.5. V1 Routers (`app/routers/`)
- **`auth.py`**: signup, login, password recovery, interest collection.
- **`user_profile.py`**: CRUD for parent user details.
- **`location.py`**: wrapper that fetches city and state details from Indian postal codes.
- **`pet_health_id.py`**: generates formatted sequential health IDs (e.g., `POL-COIM-DOG-001`).
- **`pet_profile.py`**: POST `/api/pet-profile/` (creates pet), PATCH (updates), GET public profile details, and lifestyle upsert/fetch endpoints.
- **`checklist.py`**: *LEGACY/DEAD ENDPOINTS*. Querying these endpoints causes database crashes because the database tables `daily_task_logs` and `pet_streaks` do not exist.

---

## 4. Exhaustive Database Schema (Supabase)

### 4.1. Core Tables

#### `user_profiles`
- `id`: UUID (Primary Key, FK to `auth.users.id` with `ON DELETE CASCADE`).
- `full_name`: Text.
- `phone`: Text.
- `email`: Text.
- `phone_verified`: Boolean.
- `auth_provider`: Text.
- `city`, `state`, `pincode`: Text.
- `avatar_url`: Text.
- `created_at`, `updated_at`: Timestamp.

#### `pet_profiles`
- `id`: UUID (Primary Key).
- `user_id`: UUID (FK to `user_profiles.id` with `ON DELETE CASCADE`).
- `petolife_id`: Text.
- `pet_type`: Text.
- `pet_name`: Text.
- `breed`: Text.
- `gender`: Text.
- `birth_date`: Date.
- `weight`: Numeric.
- `color`: Text.
- `blood_group`: Text.
- `identification_marks`: Text.
- `pet_photo_url`: Text.
- `household_id`: UUID.
- `pet_health_id`: Text.
- `city`, `state`, `pincode`: Text.
- `owner_name`, `owner_phone`: Text.
- `created_at`, `updated_at`: Timestamp.

#### `pet_ids`
- `id`: UUID (Primary Key).
- `pet_profile_id`: UUID (FK to `pet_profiles.id` with `ON DELETE CASCADE`).
- `id_name`: Text.
- `id_number`: Text.

#### `medical_events`
- `id`: UUID (Primary Key).
- `pet_id`: UUID (FK to `pet_profiles.id` with `ON DELETE CASCADE`).
- `visit_group_id`: UUID.
- `event_date`: Date.
- `event_time`: Time.
- `clinic_id`: UUID (FK to `clinic_database.id` on delete null).
- `clinic_name`: Text.
- `vet_name`: Text.
- `visit_type`: JSONB (Multi-select types array).
- `reason_for_visit`: Text (max 500 chars).
- `overall_notes`: Text (max 1000 chars).
- `follow_up_date`: Date.
- `follow_up_notes`: Text.
- `category_entries`: JSONB (JSON array containing logged categories).
- `event_hash`: VARCHAR(64).
- `source`: Text.
- `verification_status`: Text.
- `document_ids`: JSONB (Array of linked record IDs).
- `linked_events`: JSONB.
- `is_deleted`: Boolean (default: False).
- `created_at`, `updated_at`: Timestamp.

#### `medical_records`
- `id`: UUID (Primary Key).
- `pet_profile_id`: UUID (FK to `pet_profiles.id` with `ON DELETE CASCADE`).
- `user_id`: UUID (FK to `user_profiles.id` with `ON DELETE CASCADE`).
- `log`: Integer (0 = Standalone record, 1 = Timeline-linked record).
- `category`: Text.
- `file_url`: Text.
- `storage_path`: Text.
- `title`: Text (optional, log=0 only).
- `notes`: Text (optional, log=0 only).
- `event_id`: UUID (optional, log=1 only, FK to `medical_events.id`).
- `label`: Text (optional, log=1 only).
- `is_favorite`: Boolean (default: False).
- `created_at`: Timestamp.

#### `reminders`
- `id`: UUID (Primary Key).
- `pet_id`: UUID (FK to `pet_profiles.id` with `ON DELETE CASCADE`).
- `source_event_id`: UUID (FK to `medical_events.id` on delete cascade).
- `type`: Text (vaccination, deworming, anti_tick, medication_end, medication_dose, follow_up, custom).
- `title`: Text.
- `description`: Text.
- `due_date`: Date.
- `due_time`: Time.
- `priority`: Text (low, medium, high).
- `status`: Text (pending, completed, missed, snoozed).
- `is_ai_generated`: Boolean.
- `repeat_type`: Text (none, daily, weekly, monthly, custom).
- `custom_repeat_interval`: Integer.
- `custom_repeat_unit`: Text.
- `end_repeat_type`: Text.
- `recurrence_group_id`: UUID.
- `time_slot`: Text (morning, afternoon, night, custom).
- `created_at`, `updated_at`: Timestamp.

#### `pet_lifestyle`
- `id`: UUID (Primary Key).
- `pet_id`: UUID (FK to `pet_profiles.id` with `ON DELETE CASCADE`).
- `answers`: JSONB (survey questions mapping).
- `created_at`, `updated_at`: Timestamp.

#### `edit_history`
- `id`: UUID (Primary Key).
- `event_id`: UUID (FK to `medical_events.id`).
- `pet_id`: UUID (FK to `pet_profiles.id`).
- `previous_value`: JSONB.
- `changed_fields`: JSONB.
- `changed_by`: Text.
- `changed_at`: Timestamp.

#### `vaccine_database`
- `id`: UUID (Primary Key).
- `vaccine_name`: Text.
- `animal_type`: Text.
- `default_interval_days`: Integer.

#### `medicine_database`
- `id`: UUID (Primary Key).
- `brand_name`: Text.
- `composition`: Text.
- `medicine_type`: Text.

#### `shampoo_database`
- `id`: UUID (Primary Key).
- `brand_name`: Text.
- `category`: Text.

#### `clinic_database`
- `id`: UUID (Primary Key).
- `name`: Text.
- `address`: Text.
- `phone`: Text.
- `created_by`: UUID.

### 4.2. Storage Buckets
1. **`avatars`**: Public bucket for parent profile pictures.
2. **`pet-photos`**: Public bucket for pet pictures.
3. Private bucket configured in `s3_client` for medical files (referred to as `medical-docs`).

---

## 5. Critical Development Guidelines & Rules

1. **Routing Strategy (React)**: Always define sub-routes under the `<Route element={<ProtectedRoute />}>` nested list wrapper. The `MainLayout.jsx` orchestrates pet switches and handles active selections via props.
2. **Styling Rules**: Customize and add styles in local `.css` files adjacent to the `.jsx` files. Rely on Tailwind CSS v4 only for basic layout utilities (flex, grid, spacing, layers).
3. **State Management**: Manage and fetch API payloads via TanStack Query hooks. Always mutate states using `useMutation` and invalidate related queries on success.
4. **API Client**: Always route authenticated endpoints via `fetchWithAuth(endpoint, options)`.

---

## Appendix A: Raw Frontend Code Signatures

```text
--- File: src\App.jsx ---
L29: function App() {
L37:     if (pathname !== "/auth/callback" && (search.includes("code=") || hash.includes("access_token="))) {
L38:       window.location.href = `/auth/callback${search}${hash}`;
L45:         <Routes>
L48:           <Route path="/landing" element={<LandingPg />} />
L51:           <Route path="/pet/:id" element={<PublicPetProfile />} />
L52:           <Route path="/auth/callback" element={<AuthCallback />} />
L55:           <Route element={<ProtectedRoute />}>
L56:             <Route path="/home" element={<MainLayout />} />
L59:             <Route path="/records" element={<MainLayout />} />
L60:             <Route path="/profile" element={<MainLayout />} />
L61:             <Route path="/create-pet-profile" element={<ProfileCreate />} />
L62:             <Route path="/parent-profile" element={<ParentProfile />} />
L63:             <Route path="/reminders" element={<RemindersPage />} />

--- File: src\hooks\useTimelineQueries.js ---
L15: export const timelineKeys = {
L16:   all: (petId) => ["timeline", petId],
L17:   feed: (petId, view) => ["timeline", petId, "feed", view],
L18:   events: (petId, category) => ["timeline", petId, "events", category ?? "all"],
L22:   records: (petId, log, eventId) => ["records", petId, log ?? "all", eventId ?? "all"],
L30: export function useTimeline(petId, view = "chronological") {
L39: export function useMedicalEvents(petId, category = null) {
L55: export function useCreateMedicalEvent(petId) {
L87: export function useReminders(petId, type = null, status = null) {
L143: export function useRecords(petId, { log, eventId } = {}) {
L164: export function useUploadRawRecord(petId) {

--- File: src\api\timelineApi.js ---
L7: export async function getTimeline(petId, view = "chronological") {
L8:   const res = await fetchWithAuth(`/api/v2/pets/${petId}/timeline?view=${view}`);
L20: export async function createMedicalEvent(petId, payload) {
L21:   const res = await fetchWithAuth(`/api/v2/pets/${petId}/medical-events`, {
L162: export async function uploadEventRecord(petId, eventId, file, label, category = "Other") {
L181: export async function uploadRawRecord(petId, formData) {

--- File: src\components\AuthCallback\AuthCallback.jsx ---
L14: export default function AuthCallback() {
L23:         const { data, error } = await supabase.auth.getSession();
L42:             const profileRes = await fetch(`${API_BASE}/api/user-profile/${user.id}`, {

--- File: src\components\ParentProfile\ParentProfile.jsx ---
L15: export default function ParentProfile() {
L141:       const res = await fetch(`${API_BASE}/api/user-profile/${user.id}`, {
L142:         method: "PUT",
```

---

## Appendix B: Raw Backend Code Signatures

```text
--- File: backend/app\main.py ---
L80: app.include_router(auth.router,            prefix="/api/auth",            tags=["Auth"])
L81: app.include_router(pet_profile.router,     prefix="/api/pet-profile",     tags=["Pet Profile"])
L87: # V2 AI Timeline Routers
L88: app.include_router(reference_data.router)
L89: app.include_router(medical_events.router)
L90: app.include_router(timeline.router)
L91: app.include_router(reminders.router)
L92: app.include_router(records.router)
L93: app.include_router(export.router)

--- File: backend/app\routers\v2\timeline.py ---
L7: router = APIRouter(prefix="/api/v2/pets", tags=["v2-timeline"])
L13: @router.get("/{pet_id}/timeline")
L14: async def timeline(pet_id: str, view: str = "category", user=Depends(get_current_user)):

--- File: backend/app\routers\v2\medical_events.py ---
L9: router = APIRouter(prefix="/api/v2/pets", tags=["v2-medical-events"])
L15: @router.post("/{pet_id}/medical-events", status_code=201)
L26: @router.get("/{pet_id}/medical-events")

--- File: backend/app\routers\v2\records.py ---
L33: router = APIRouter(prefix="/api/v2/pets", tags=["v2-records"])
L47: @router.post("/{pet_id}/records", status_code=201)
L91: @router.post("/{pet_id}/medical-events/{event_id}/records", status_code=201)

--- File: backend/app\timeline\services\event_service.py ---
L17: class EventService:
L19:     def create_event(pet_id: str, payload: dict):
L75:     def update_event(pet_id: str, event_id: str, patch: dict):

--- File: backend/app\timeline\services\reminder_engine.py ---
L83: def generate_for_event(event: dict):
L113: def recompute_for_event(event: dict):
L122: def create_manual_reminder(pet_id: str, body: dict):
```
