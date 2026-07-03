# PetOLife MVP V2 — Exhaustive Project Context Protocol

This document is the absolute **Single Source of Truth** for the PetOLife MVP V2 application. It contains an exhaustive, file-by-file breakdown of the entire codebase, covering frontend rendering flows, state variables, component logic, backend API definitions, and database schemas.

Any AI or developer reading this document will have complete context of every single small detail in the system and should NOT need to analyze the codebase manually.

---

## 1. System Stack Overview
- **Frontend Framework**: React 18 (Vite build system).
- **Routing**: `react-router-dom` (v6).
- **Styling**: Strict Vanilla CSS (`.css` files adjacent to components). **Tailwind is NOT used.**
- **Backend Framework**: FastAPI (Python 3).
- **Database & Auth**: Supabase (PostgreSQL, Supabase Storage, Supabase Auth).
- **Server Deployment**: Backend runs via `uvicorn app.main:app`. Frontend runs via `npm run dev`.

---

## 2. Frontend Exhaustive File-by-File Analysis

### 2.1. Root Files & Configuration
- **`src/main.jsx`**: Standard React entry point. Renders `<App />` inside `React.StrictMode`.
- **`src/App.jsx`**: The Root Router. Uses `React.lazy` for code splitting.
  - **Routes**:
    - `/` -> `<LandingPg />`
    - `/login`, `/register`, `/reset-password` -> Auth screens.
    - `/home` -> `<ProtectedRoute><MainLayout /></ProtectedRoute>`
    - `/create-pet-profile` -> `<ProtectedRoute><ProfileCreate /></ProtectedRoute>`
    - `/pet/:petolife_id` -> `<PostIdScreen />`
- **`vite.config.js`**: Standard Vite config.
- **`eslint.config.js`**: Standard ESLint config.

### 2.2. Utilities & Hooks
- **`src/hooks/useAuth.js`**: Centralized authentication hook. 
  - **State**: `user` (local storage/memory), `token` (access_token), `isAuthenticated` (boolean), `loading`.
  - **Functions**: `login()` (saves session to localStorage), `logout()` (clears localStorage, calls Supabase API), `validateSession()` (calls `/api/auth/me`).
- **`src/utils/fetchWithAuth.js`**: A custom wrapper around `fetch`. Automatically retrieves `access_token` from `localStorage` and injects it into the `Authorization: Bearer <token>` header for backend requests.

### 2.3. The App Shell (`src/components/MainLayout/`)
- **`MainLayout.jsx`**: The core architectural piece for authenticated users.
  - **State**: `activeTab` (home, timeline, medicalrecords, profile), `pets` (array of user's pets), `activePetId`, `loadingPets`.
  - **On Mount**: Fetches `/api/pet-profile/`. Caches in `localStorage('pets_{user_id}')`. Sets `activePetId`.
  - **Logic**: Handles tab switching via `BottomNav`. Drills `pets`, `activePetId`, and `refreshPets` down to child components.
- **`MainLayout.css`**: Defines `.main-layout-container` for fixed header/footer routing.

### 2.4. Navigation Components (`src/components/common/`)
- **`TopNav/TopNav.jsx`**: Sticky header containing the PetOLife logo and Sparkles icon.
- **`BottomNav/BottomNav.jsx`**: Fixed footer tab bar. 
  - **Props**: `active` (current tab), `onNavigate` (tab switch callback), `onFabPress` (+ FAB callback to add pet).
  - **Tabs**: Home, Timeline, Medical Records, Profile.
- **`PetAvatar.jsx`**: Global helper to dynamically load a pet's photo or a scalable 60% SVG fallback (Dog, Cat, etc.) using `lucide-react`.

### 2.5. Dashboard & Home (`src/components/Home/`)
- **`Home.jsx`**: Conditional renderer for the dashboard.
  - **Props**: `pets`, `activePetId`, `onPetSelect`, `onAddPet`.
  - **Logic**: If `pets.length === 0`, renders Promo Onboarding (`HeroSection`, `AddPetCard`, `HealthBanner`). If `pets.length > 0`, renders `PetDashboard`.
- **`PetDashboard.jsx`**: The main interface for pet parents. Renders widgets sequentially.
- **Widgets**:
  - **`ProfileCard/ProfileCard.jsx`**: Top card displaying active pet summary (normalized age/gender). Includes a dropdown to switch `activePetId`.
  - **`HealthBanner/HealthBanner.jsx`**: Static "Health Status: Good" banner.
  - **`QuickActions/QuickActions.jsx`**: Navigational buttons to Timeline and Records.
  - **`ReminderCard/ReminderCard.jsx`**: Static UI for "Upcoming Vaccines".
  - **`NoRecordsCard/NoRecordsCard.jsx`**: Fetches `/api/medical-records/{pet_id}`. Shows a preview of the latest record or an "Upload Now" prompt.
  - **`HeroSection` & `AddPetCard`**: Promo UI for users with no pets.

### 2.6. Profile Dashboard (`src/components/UserProfile/`)
- **`UserProfile.jsx`**: Replaces standard form with an interactive Dashboard UI.
  - **Logic**: Iterates down `pets` array to find `activePetId`.
  - Uses `refreshPets` callback to silently fetch data instead of page reloads.
  - Renders `EditableUserCard`, `EditablePetCard`, and standard widgets (`HealthBanner`, `QuickActions`, etc.) at the bottom.
  - Renders `PetAvatar` for default pet images dynamically instead of static placeholders.
  - **Logout Logic**: Clears `localStorage` and calls `signOut`.
- **`EditableUserCard.jsx`**: Displays user data. 
  - **State**: `profile` (full_name, phone, email, city, etc.), `isEditing`.
  - **Logic**: Toggles to form inputs. Calls `PUT /api/user-profile/{id}` to save text, `POST /api/user-profile/{id}/avatar` for images.
- **`EditablePetCard.jsx`**: Displays active pet data.
  - **State**: `profile` (pet_name, breed, gender, birth_date, weight, etc.), `isEditing`.
  - **Logic**: Calls `PATCH /api/pet-profile/{pet_id}` to save text, `POST /api/pet-profile/{pet_id}/photo` for images. Now supports `DELETE /api/pet-profile/{pet_id}` for complete pet profile removal. Includes dynamic breed dropdowns, DOB validation, and styled `.error-text` visual fixes.

### 2.7. Medical Records (`src/components/medical/`)
- **`MedicalRecords.jsx`**:
  - **State**: `activeCategory` (Quick Access, Vaccination, etc.), `dbRecords`, `showUploadSheet`, `selectedFile`, `uploadProgress`.
  - **Logic**: Fetches `/api/medical-records/{pet_profile_id}`.
  - **Upload**: Posts `FormData` to `POST /api/medical-records/upload`. Ensures uploaded records are tied to the `activePetId`.

### 2.8. Profile Creation Wizard (`src/components/ProfileCreation/`)
- **`ProfileCreation.jsx`**: Parent component tracking wizard state.
  - **State**: `step` (1 to 4), `petData` (merged form data).
- **`Step1.jsx`**: Pet Photo upload. Generates a temporary blob URL.
- **`Step2.jsx`**: Type, Breed, Gender, Name. Fetches standard breed arrays from `constants.js`. Supports custom breed inputs. Includes KCI/Microchip inputs.
- **`Step3.jsx`**: Age tracking (DOB vs Approx Age).
- **`Step4.jsx`**: Final generation screen. Submits `FormData` (including the image blob and JSON stringified arrays) to `POST /api/pet-profile/`. Generates unique PetOLife ID on backend.

### 2.9. Landing & Auth (`src/components/LandingPg/` & `src/components/Login/`)
- **`LandingPg.jsx`**: Marketing promo page. Uses modals to collect early-access emails (Posting to `/api/auth/register-interest`).
- **`Login.jsx`**: The core authentication screen.
  - **State**: `screen` ('register', 'login', 'forgot'), `form` data.
  - **Flows**: Email/Password Sign Up (`/api/auth/signup`), Log In (`/api/auth/login`), Pincode Lookup (`/api/location/lookup`), and Google OAuth (`/api/auth/google`). Ensures `SuccessScreen` is exported for use by `ProtectedRoute`.
- **`ResetPassword.jsx`**: Catches Supabase hash `#access_token=...` from emails. Submits new password to `/api/auth/reset-password`.

### 2.10. Public QR Pet Card (`src/components/postidscreen/` & `src/components/petcard/`)
- **`postidscreen.jsx`**: Public facing pet profile. Receives `petolifeId` from URL.
  - **Logic**: Read-only display of pet details, medical history (dummy/public safe), and parent contact. Includes native sharing links and WhatsApp triggers.
- **`petcard.jsx`**: The Pet ID card UI logic. Now uses responsive native CSS SVG scaling (`size="100%"`) for its `PetAvatar` container to gracefully handle circular fallbacks across varying device sizes.

---

## 3. Backend Exhaustive File-by-File Analysis (FastAPI)

### 3.1. Core Configuration
- **`app/main.py`**: FastAPI app entry point. Defines CORS middleware allowing all origins (`*`).
- **`app/config.py`**: Loads `.env` variables (`SUPABASE_URL`, `SUPABASE_KEY`).
- **`app/supabase_client.py`**: Instantiates the Supabase client. (Often uses the Service Role key to bypass RLS, putting security enforcement on FastAPI endpoints).

### 3.2. Authentication (`app/routers/auth.py`)
- **Pydantic Models**: `SignupRequest`, `LoginRequest`, `RegisterInterestRequest`, `ForgotPasswordRequest`, `ResetPasswordRequest`.
- **Endpoints**:
  - `POST /signup`: Calls `supabase.auth.sign_up`. Also manually inserts user into `user_profiles`.
  - `POST /login`: Calls `supabase.auth.sign_in_with_password`.
  - `GET /google`: Returns Supabase OAuth URL.
  - `GET /me`: Extracts JWT token, validates user in `auth.users`, and returns `user_profiles` data.
  - `POST /register-interest`: Early access waitlist endpoint.
  - `POST /forgot-password` & `POST /reset-password`: Account recovery logic.

### 3.3. User Profiles (`app/routers/user_profile.py`)
- **Endpoints**:
  - `GET /{user_id}`: Retrieves profile details.
  - `PUT /{user_id}`: Overwrites text fields (`full_name`, `phone`, `city`, etc.).
  - `POST /{user_id}/avatar`: Uploads multipart file to Supabase Storage (`avatars` bucket). Generates a random filename based on timestamp to avoid cache issues, then updates `user_profiles.avatar_url`.

### 3.4. Pet Profiles (`app/routers/pet_profile.py`)
- **Endpoints**:
  - `POST /`: Creates a new pet.
    - Resolves location (city/state).
    - Calls `generate_pet_health_id()` from `pet_health_id.py` (e.g. `POL-COIM-DOG-001`).
    - Uploads photo to `pet-photos` bucket.
    - Inserts core data into `pet_profiles` table.
    - Inserts external IDs (Microchip, KCI) into `pet_ids` table linked by FK.
  - `GET /`: Returns all pets owned by the authenticated JWT user.
  - `PATCH /{profile_id}`: Updates subset of text fields. Ignores `None` values to prevent erasing unchanged fields.
  - `POST /{profile_id}/photo`: Re-uploads and updates `pet_photo_url` in the DB.
  - `DELETE /{profile_id}`: Hard deletes the pet profile, cascade-deletes related `pet_ids`, and permanently removes the pet's photo from the storage bucket (ownership enforced).
  - `GET /by-petolife-id/{petolife_id}`: Redirect endpoint. Used by physical QR codes. Redirects HTTP to frontend URL `/pet/{petolife_id}`.
  - `GET /public/{petolife_id}`: Data endpoint for the public Pet Card. Returns aggregated pet data without requiring auth.

### 3.5. Pet Health ID Generator (`app/routers/pet_health_id.py`)
- **Logic**: Highly specialized script to generate sequential POL IDs.
  - Calculates 4-letter city code (e.g., Coimbatore -> COIM).
  - Calculates 3-letter pet type (e.g., Dog -> DOG).
  - Queries DB for max sequence and increments (e.g., 001).
  - Final string: `POL-COIM-DOG-001`.
- **Endpoints**: `POST /generate`, `GET /preview/{city}/{pet_type}`.

### 3.6. Medical Records (`app/routers/medical_records.py`)
- **Endpoints**:
  - `POST /upload`: Uploads PDF/Image to `medical-records` bucket. Inserts DB row with file metadata (`file_url`, `category`, `user_id`, `pet_profile_id`).
  - `GET /{pet_profile_id}`: Retrieves array of medical documents for a specific pet.
  - `DELETE /{record_id}`: Hard deletes the DB row and removes the file from the storage bucket.
  - `PATCH /{record_id}/favorite`: Toggles the favorite status of a medical record.

### 3.7. Location (`app/routers/location.py`)
- **Endpoints**:
  - `POST /lookup` & `GET /pincode/{pincode}`: External API wrapper to resolve an Indian postal pincode into a valid City, State, District format.

### 3.8. Checklist (`app/routers/checklist.py`)
- Legacy/Dead Endpoints. Currently unused in the MVP V2 frontend, but exists as scaffolding (`GET /{pet_id}`, `POST /{pet_id}`).

---

## 4. Exhaustive Database Schema (Supabase)

### 4.1. Core Tables

**`user_profiles`** (Extended user attributes)
- `id`: UUID (Primary Key, Foreign Key to `auth.users`).
- `full_name`: Text.
- `phone`: Text.
- `email`: Text.
- `city`, `state`, `pincode`: Text.
- `avatar_url`: Text.

**`pet_profiles`** (Core pet data)
- `id`: UUID (Primary Key).
- `user_id`: UUID (Foreign Key to `user_profiles`).
- `petolife_id`: Text (Unique. Example: POL-BLR-CAT-012).
- `pet_type`: Text (Dog, Cat, Bird, etc.).
- `pet_name`, `breed`, `gender`, `color`, `blood_group`, `identification_marks`: Text.
- `birth_date`: Date.
- `weight`: Numeric.
- `pet_photo_url`: Text (Public URL from storage).
- `created_at`: Timestamp.

**`pet_ids`** (Official Registration Numbers)
- `id`: UUID (Primary Key).
- `pet_profile_id`: UUID (Foreign Key to `pet_profiles` with `ON DELETE CASCADE`).
- `id_name`: Text (e.g., "Microchip", "KCI Registration").
- `id_number`: Text.

**`medical_records`** (Uploaded Health Documents)
- `id`: UUID (Primary Key).
- `user_id`: UUID (Foreign Key to `user_profiles`).
- `pet_profile_id`: UUID (Foreign Key to `pet_profiles` with `ON DELETE CASCADE`).
- `category`: Text (e.g., "Vaccination", "Prescription", "Lab Report").
- `file_url`: Text.
- `file_name`: Text.
- `created_at`: Timestamp.

### 4.2. Storage Buckets (Public Configuration)
All buckets are configured with public access, meaning Supabase returns a `public_url` directly used in `<img src={url} />` or PDF previews.
1. **`avatars`**: Stores user profile pictures.
2. **`pet-photos`**: Stores initial and updated pet profile pictures.
3. **`medical-records`**: Stores PDF/JPG/PNG files uploaded from the Medical Records tab.

---

## 5. Critical Development Guidelines & Rules

1. **Routing Strategy (React)**: Do NOT introduce Redux, Zustand, or React Context for global app state. The `MainLayout.jsx` acts as the single source of truth orchestrator. If a tab needs data, pass it via props from `MainLayout`.
2. **Styling Rules**: 
   - Write standard CSS. Use `import "./MyComponent.css"` inside the component file.
   - **DO NOT USE Tailwind CSS.**
3. **API Utility**: Always use `fetchWithAuth(url, options)` from `src/utils/fetchWithAuth.js` when making authenticated requests to the backend. This automatically attaches the `Authorization: Bearer <token>` header and handles domain prefixes automatically.
4. **Backend Validation**: FastAPI uses strictly typed Pydantic models. Ensure frontend JSON payloads perfectly match these models. For file uploads, use `multipart/form-data` and FastAPI's `UploadFile = File(...)`.
5. **Component Scoping**: Each UI component MUST reside in its own folder (e.g., `src/components/UserProfile/EditableUserCard/EditableUserCard.jsx` alongside `EditableUserCard.css`). Avoid dumping random `.jsx` files directly into `components/`.


## Appendix A: Raw Frontend Code Signatures (codebase_summary.txt)

```text
--- File: eslint.config.js ---
L7: export default defineConfig([

--- File: vite.config.js ---
L6: export default defineConfig({

--- File: src\App.jsx ---
L8: const LandingPg = lazy(() => import("./components/LandingPg/LandingPg"));
L9: const MainLayout = lazy(() => import("./components/MainLayout/MainLayout"));
L10: const ProfileCreate = lazy(() => import("./components/ProfileCreation/ProfileCreation/ProfileCreation"));
L11: const PetCard = lazy(() => import("./components/petcard/petcard"));
L12: const ResetPassword = lazy(() => import("./components/Login/ResetPassword"));
L14: function LoadingFallback() {
L22: function App() {
L48: export default App;

--- File: src\main.jsx ---

--- File: src\api\endpoints.js ---
L5: const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
L7: export async function submitPetParentForm(data) {
L9: const res = await fetch(`${API_BASE}/api/auth/register-interest`, {
L14: const result = await res.json();
L25: export async function submitVetForm(data) {
L27: const res = await fetch(`${API_BASE}/api/auth/register-interest`, {
L32: const result = await res.json();

--- File: src\components\ProtectedRoute.jsx ---
L5: export default function ProtectedRoute() {
L6: const { isAuthenticated, loading } = useAuth();

--- File: src\components\common\BottomNav\BottomNav.jsx ---
L4: const NAV_ITEMS = [
L62: const BottomNav = ({ active = "home", onNavigate, onFabPress }) => {
L82: const isActive = active === item.key;
L100: export default BottomNav;

--- File: src\components\common\TopNav\TopNav.jsx ---
L10: const TopNav = () => {
L27: export default TopNav;

--- File: src\components\Home\Home.jsx ---
L5: export default function Home({ pets: propPets, activePetId: propActivePetId, onPetSelect, onAddPet }) {
L6: const location = useLocation();
L7: const navigate = useNavigate();
L9: const incomingPet = location.state?.newPet || null;
L12: const [localPets, setLocalPets] = useState([]);
L13: const [selectedPet, setSelectedPet] = useState(null);
L15: const pets = propPets && propPets.length > 0 ? propPets : localPets;
L27: const active = propActivePetId
L34: const handleSelect = (pet) => {
L41: const handleAddPet = () => {

--- File: src\components\Home\PetDashboard.jsx ---
L17: export default function PetHome({
L23: const [showPetDropdown, setShowPetDropdown] = useState(false);
L24: const dropdownRef = useRef(null);
L26: const selectedPet = propSelectedPet || (pets.length > 0 ? pets[0] : null);
L28: const handlePetSelect = (pet) => {
L36: const handleClickOutside = (event) => {

--- File: src\components\Home\AddPetCard\AddPetCard.jsx ---
L6: const AddPetCard = ({ onAddPet }) => {
L40: export default AddPetCard;

--- File: src\components\Home\HealthBanner\HealthBanner.jsx ---
L5: export default function HealthBanner() {

--- File: src\components\Home\HeroSection\HeroSection.jsx ---
L10: const HeroSection = () => {
L32: export default HeroSection;

--- File: src\components\Home\NoRecordsCard\NoRecordsCard.jsx ---
L6: const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
L8: export default function NoRecordsCard({ selectedPet, onNavigateTab }) {
L9: const navigate = useNavigate();
L10: const [records, setRecords] = useState([]);
L11: const [loading, setLoading] = useState(false);
L13: const petId = selectedPet?.id || selectedPet?.pet_profile_id;
L18: const fetchPetRecords = async () => {
L21: const token = localStorage.getItem("access_token");
L22: const res = await fetch(`${API_BASE}/api/medical-records/${petId}`, {
L26: const data = await res.json();
L39: const handleGoToRecords = () => {

--- File: src\components\Home\ProfileCard\ProfileCard.jsx ---
L9: function normalizePet(pet) {
L15: const birth = new Date(pet.birth_date);
L16: const now = new Date();
L17: const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
L19: const years = Math.floor(months / 12);
L41: export default function ProfileCard({
L50: const [internalShowDropdown, setInternalShowDropdown] = useState(false);
L51: const internalRef = useRef(null);
L53: const isDropdownOpen = propShowPetDropdown !== undefined ? propShowPetDropdown : internalShowDropdown;
L54: const toggleDropdown = () => {
L62: const activeRef = propDropdownRef || internalRef;
L64: const onSelect = (pet) => {
L76: const handleClickOutside = (event) => {
L89: const selectedPet = normalizePet(rawSelectedPet) || {
L98: const normalizedPets = (pets || []).map(normalizePet).filter(Boolean);
L100: const genderIcon =
L150: const originalPet = pets[idx] || pet;
L151: const petGenderIcon =

--- File: src\components\Home\QuickActions\QuickActions.jsx ---
L8: export default function QuickActions({ onNavigateTab }) {
L9: const navigate = useNavigate();
L11: const handleTimeline = () => {
L19: const handleRecords = () => {

--- File: src\components\Home\ReminderCard\ReminderCard.jsx ---
L6: export default function ReminderCard({ onNavigateTab }) {
L7: const navigate = useNavigate();
L9: const handleTimeline = () => {

--- File: src\components\LandingPg\LandingPg.jsx ---
L8: const Navbar = ({ openModal }) => {
L9: const [menuOpen, setMenuOpen] = useState(false);
L10: const [scrolled, setScrolled] = useState(false);
L11: const navLinks = [
L18: const handleScroll = () => setScrolled(window.scrollY > 10);
L26: const closeMenu = () => setMenuOpen(false);
L65: const Hero = ({ openModal, onJoinPetParent }) => (
L114: const problems = [
L120: const solutions = [
L126: const Solution = () => (
L170: const steps = [
L175: const Workingprocess = () => (
L203: const vetSteps = [
L209: const VetTimeline = () => (
L231: const BeforeAfter = () => (
L248: const petParentBenefits = ['Store health records','Track vaccines','Track medications','Receive reminders','Stay organized'];
L249: const vetBenefits = ['Access complete history','Improve treatment continuity','Support follow-up care','Shape future workflows'];
L250: const Categories = ({ openModal }) => (
L292: const trustIndicators = [
L298: const Trust = ({ openModal }) => (
L328: const Footer = () => {
L329: const companyLinks = [{ label: "About Us", href: "#about" },{ label: "Our Mission", href: "#home" },{ label: "Contact Us", href: "mailto:tech@petolife.com" }];
L330: const productLinks = [{ label: "How It Works", href: "#pet-parents" },{ label: "For Pet Parents", href: "#veterinarians" },{ label: "For Veterinarians", href: "#veterinarians" },{ label: "Trust & Mission", href: "#about" }];
L349: const RegistrationModal = ({ isOpen, onClose, type, onRegisterSuccess }) => {
L350: const isVet = type === 'vet';
L351: const [vetData, setVetData] = useState({ doctorName: '', clinicName: '', mobile: '', email: '', city: '', earlyAccess: true });
L352: const [parentData, setParentData] = useState({ name: '', mobile: '', email: '', city: '', petType: '', hasPet: true, earlyAccess: true });
L353: const [loading, setLoading] = useState(false);
L354: const [status, setStatus] = useState({ msg: '', ok: null });
L358: const handleSubmit = async (e) => {
L362: const res = isVet ? await submitVetForm(vetData) : await submitPetParentForm(parentData);
L403: const ThankYouModal = ({ isOpen, onClose, type }) => {
L406: const timer = setTimeout(() => { onClose(); }, 8000);
L411: const isVet = type === 'vet';
L425: function LandingPg() {
L426: const navigate = useNavigate();
L427: const [modalOpen, setModalOpen] = useState(false);
L428: const [modalType, setModalType] = useState('parent');
L429: const [showThankYou, setShowThankYou] = useState(false);
L430: const [thankType, setThankType] = useState('parent');
L431: const openModal = (type) => { setModalType(type); setModalOpen(true); };
L432: const handleRegisterSuccess = (type) => { setModalOpen(false); setThankType(type); setShowThankYou(true); };
L433: const handleJoinPetParent = () => navigate('/login');
L453: export default LandingPg;

--- File: src\components\Login\Login.jsx ---
L7: const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
L10: function Logo() {
L18: function GoogleIcon() {
L29: function EyeIcon({ open }) {
L44: function BackBtn({ onClick }) {
L54: function SmallSpinner() {
L59: function SuccessScreen({ type, userName, onContinue }) {
L60: const isSignup = type === "signup";
L61: const [countdown, setCountdown] = useState(3);
L65: const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
L103: function RegistrationScreen({ onLogin, onSuccess }) {
L104: const [form, setForm] = useState({
L112: const [showPass, setShowPass] = useState(false);
L113: const [error, setError] = useState("");
L114: const [loading, setLoading] = useState(false);
L115: const [pincodeLoading, setPincodeLoading] = useState(false);
L116: const [pincodeError, setPincodeError] = useState("");
L118: const set = (k) => (e) => {
L119: const val = e.target.value;
L131: const lookupPincode = useCallback(async (pincode) => {
L136: const res = await fetch(`${API_BASE}/api/location/lookup`, {
L142: const data = await res.json().catch(() => ({}));
L145: const data = await res.json();
L165: const handleRegister = async () => {
L184: const userPassword = form.password;
L188: const signupRes = await fetch(`${API_BASE}/api/auth/signup`, {
L200: const signupData = await signupRes.json();
L204: const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
L209: const loginData = await loginRes.json();
L217: const enrichedUser = {
L237: const handleGoogleSignup = async () => {
L239: const res = await fetch(`${API_BASE}/api/auth/google`);
L240: const data = await res.json();
L284: const val = e.target.value.replace(/\D/g, "").slice(0, 10);
L322: const val = e.target.value.replace(/\D/g, "").slice(0, 6);
L385: function LoginScreen({ onSignUp, onSuccess }) {
L386: const [showPass, setShowPass] = useState(false);
L387: const [identifier, setIdentifier] = useState("");
L388: const [password, setPassword] = useState("");
L389: const [error, setError] = useState("");
L390: const [loading, setLoading] = useState(false);
L391: const [showForgot, setShowForgot] = useState(false);
L393: const handleLogin = async () => {
L398: const isEmail = identifier.includes("@");
L399: const payload = { password };
L413: const res = await fetch(`${API_BASE}/api/auth/login`, {
L418: const data = await res.json();
L432: const handleGoogleLogin = async () => {
L434: const res = await fetch(`${API_BASE}/api/auth/google`);
L435: const data = await res.json();
L497: function ForgotPasswordForm({ onBack }) {
L498: const [email, setEmail] = useState("");
L499: const [loading, setLoading] = useState(false);
L500: const [sent, setSent] = useState(false);
L501: const [error, setError] = useState("");
L503: const handleReset = async () => {
L511: const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
L516: const data = await res.json();
L563: export default function Login() {
L564: const navigate = useNavigate();
L566: const [screen, setScreen] = useState("register");
L567: const [successData, setSuccessData] = useState(null);
L569: const handleSuccess = (data) => {
L574: const handleSuccessContinue = () => {

--- File: src\components\Login\ResetPassword.jsx ---
L6: const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
L8: function EyeIcon({ open }) {
L23: export default function ResetPassword() {
L24: const navigate = useNavigate();
L25: const [accessToken, setAccessToken] = useState("");
L26: const [password, setPassword] = useState("");
L27: const [confirmPassword, setConfirmPassword] = useState("");
L28: const [showPass, setShowPass] = useState(false);
L29: const [loading, setLoading] = useState(false);
L30: const [error, setError] = useState("");
L31: const [success, setSuccess] = useState(false);
L32: const [tokenError, setTokenError] = useState(false);
L36: const hash = window.location.hash.substring(1);
L37: const params = new URLSearchParams(hash);
L38: const token = params.get("access_token");
L39: const type = params.get("type");
L51: const handleReset = async () => {
L65: const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
L73: const data = await res.json();

--- File: src\components\MainLayout\MainLayout.jsx ---
L14: const MainLayout = () => {
L15: const navigate = useNavigate();
L16: const location = useLocation();
L17: const { user } = useAuth();
L20: const [activeTab, setActiveTab] = useState(location.state?.tab || "home");
L22: const [pets, setPets] = useState([]);
L23: const [activePetId, setActivePetId] = useState(null);
L24: const [loadingPets, setLoadingPets] = useState(true);
L33: const fetchPets = async () => {
L38: const localPets = localStorage.getItem(`pets_${user.id}`);
L40: const parsed = JSON.parse(localPets);
L42: const savedActive = localStorage.getItem(`active_pet_id_${user.id}`);
L51: const res = await fetchWithAuth("/api/pet-profile/");
L53: const data = await res.json();
L57: const savedActive = localStorage.getItem(`active_pet_id_${user.id}`);
L74: const handleAddPet = () => {
L78: const handleFab = () => {
L82: const handlePetSelect = (selectedPet) => {
L90: const renderContent = () => {
L148: export default MainLayout;

--- File: src\components\medical\MedicalRecords.jsx ---
L24: const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
L26: const categories = [
L38: export default function MedicalRecords({ pets, activePetId, onPetSelect, onAddPet }) {
L39: const [activeCategory, setActiveCategory] = useState("Quick Access");
L40: const [showUploadSheet, setShowUploadSheet] = useState(false);
L41: const imageInputRef = useRef(null);
L42: const pdfInputRef = useRef(null);
L43: const cameraInputRef = useRef(null);
L44: const handleChooseImage = () => {
L47: const handleChoosePDF = () => {
L50: const handleTakePhoto = () => {
L53: const [selectedFile, setSelectedFile] = useState(null);
L54: const [showUploadProgress, setShowUploadProgress] = useState(false);
L55: const [uploadType, setUploadType] = useState("");
L56: const [progress, setProgress] = useState(0);
L57: const [showPreview, setShowPreview] = useState(false);
L58: const [viewRecord, setViewRecord] = useState(null);
L61: const [dbRecords, setDbRecords] = useState([]);
L62: const [loadingRecords, setLoadingRecords] = useState(false);
L64: const activePet = pets?.find((p) => p.id === activePetId) || pets?.[0];
L65: const petProfileId = activePet?.id;
L68: const fetchRecords = useCallback(async () => {
L72: const token = localStorage.getItem("access_token");
L73: const res = await fetch(
L80: const data = await res.json();
L95: const getRecordsForCategory = (cat) => {
L99: const target = cat.toLowerCase().trim();
L101: const recCat = (r.category || "").toLowerCase().trim();
L106: const currentRecords = getRecordsForCategory(activeCategory);
L109: const uploadToBackend = async (file, title, category) => {
L112: const formData = new FormData();
L118: const token = localStorage.getItem("access_token");
L119: const res = await fetch(`${API_BASE}/api/medical-records/upload`, {
L136: const startUpload = (file) => {
L144: const timer = setInterval(() => {
L155: const [showMetaForm, setShowMetaForm] = useState(false);
L156: const [formData, setFormData] = useState({
L164: const [showCategoryPicker, setShowCategoryPicker] = useState(false);
L166: const allCategories = [
L177: const saveCategoryRecord = async () => {
L180: const category = formData.category || "Other";
L181: const title = formData.recordName || selectedFile.name;
L184: const success = await uploadToBackend(selectedFile, title, category);
L202: const handleFormChange = (e) => {
L203: const { name, value } = e.target;
L210: const EmptyState = ({ message }) => (
L218: const deleteRecord = async (recordId) => {
L221: const token = localStorage.getItem("access_token");
L222: const res = await fetch(`${API_BASE}/api/medical-records/${recordId}`, {
L235: const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
L238: const formatSize = (bytes) => {
L463: const file = e.target.files?.[0];
L488: const file = e.target.files?.[0];
L513: const file = e.target.files?.[0];

--- File: src\components\petcard\petcard.jsx ---
L6: export default function PetCard({ petData: propPetData }) {
L7: const [fullProfile, setFullProfile] = useState(null);
L8: const [loading, setLoading] = useState(true);
L9: const [ownerInfo, setOwnerInfo] = useState(null);
L12: const fetchFullProfile = async (petolifeId) => {
L14: const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
L15: const res = await fetch(`${API_BASE}/api/pet-profile/public/${encodeURIComponent(petolifeId)}`);
L17: const data = await res.json();
L31: const localUser = localStorage.getItem('user');
L32: const userId = localUser ? JSON.parse(localUser).id : 'guest';
L33: const storedPets = JSON.parse(localStorage.getItem(`pets_${userId}`)) || [];
L34: const activeId = localStorage.getItem(`active_pet_id_${userId}`);
L35: const active = storedPets.find((p) => p.id === activeId) || storedPets[0];
L50: const localUser = localStorage.getItem('user');
L52: const parsed = JSON.parse(localUser);
L67: const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
L68: const qrUrl = fullProfile.petolife_id
L73: const getAge = (birthDate) => {
L75: const birth = new Date(birthDate);
L76: const now = new Date();
L77: const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
L79: const years = Math.floor(months / 12);
L85: const age = getAge(fullProfile.birth_date);
L88: const microchipId = fullProfile.pet_ids?.find(
L93: const regDate = fullProfile.created_at
L102: const backendOwner = fullProfile.owner_info;
L103: const ownerPhone = backendOwner?.phone || ownerInfo?.phone || fullProfile.care_team?.owner_phone || '';
L104: const ownerEmail = backendOwner?.email || ownerInfo?.email || '';
L226: function InfoRow({ icon, label, value, bold }) {
L237: function ParentRow({ icon, label, value }) {
L250: function PawIcon({ size = 20 }) {
L258: function PawShieldIcon({ small }) {
L259: const s = small ? 18 : 24;
L268: function CalendarIcon() {
L276: function GenderIcon() {
L284: function IdIcon() {
L292: function ChipIcon() {
L300: function RegIcon() {
L308: function ParentIcon() {
L316: function PhoneIcon() {
L324: function MailIcon() {
L332: function CurvedArrow() {

--- File: src\components\postidscreen\postidscreen.jsx ---
L21: export default function PostIdScreen({ inlineData }) {
L22: const location = useLocation();
L23: const navigate = useNavigate();
L25: const [showShareModal, setShowShareModal] = useState(false);
L26: const [copied, setCopied] = useState(false);
L28: const dataToUse = inlineData || location.state || {};
L30: const {
L37: const qrValue = `${window.location.origin}/api/pet-profile/by-petolife-id/${encodeURIComponent(petolifeId)}`;
L38: const shareUrl = `${window.location.origin}/pet/${encodeURIComponent(petolifeId)}`;
L39: const shareText = `Try petolife and see my pet card: ${shareUrl}`;
L41: const handleCopy = () => {
L47: const handleWhatsApp = () => {
L48: const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
L52: const handleNativeShare = () => {
L65: const useConfetti = (count = 26) => {
L67: const colors = ['var(--gold)', 'var(--gold-soft)', 'var(--green-500)', '#cfe9d6'];
L69: const rand = () => {
L86: const ConfettiLayer = () => {
L87: const pieces = useConfetti();
L110: const PawWatermarks = () => {
L111: const positions = [
L127: const ActionButton = ({ tone, icon, label, onClick }) => (

--- File: src\components\ProfileCreation\constants.js ---
L3: export const TOTAL_STEPS = 4;
L5: export const API_BASE =
L8: export const PAW_IMG =
L11: export const dogBreeds = [
L29: export const catBreeds = [
L40: export const birdBreeds = [
L55: export const rabbitBreeds = [
L66: export const breedData = {
L73: export const petTypes = [

--- File: src\components\ProfileCreation\icons.jsx ---
L3: export const FiArrowRight = () => (
L10: export const FiArrowLeft = () => (
L17: export const FiCamera = () => (
L24: export const FiSkipForward = () => (
L31: export const FiCalendar = ({ className }) => (
L40: export const FiEdit2 = () => (

--- File: src\components\ProfileCreation\ProfileCreation\ProfileCreation.jsx ---
L26: function ProfileCreation({ onNavigateBack, onNavigateToPetHome }) {
L27: const [step, setStep]               = useState(1);
L28: const [petData, setPetData]         = useState({});
L29: const [isSubmitting, setIsSubmitting] = useState(false);
L30: const [submitError, setSubmitError]   = useState("");
L32: const navigateBack = () => {
L40: const navigateToPetHome = (state) => {
L49: const goNext = (data) => {
L54: const goBack = () => setStep((s) => Math.max(1, s - 1));
L92: const createdPet = {
L117: export default ProfileCreation;

--- File: src\components\ProfileCreation\Step1\Step1.jsx ---
L8: function Step1({ goNext, onNavigateBack }) {
L9: const [image, setImage] = useState(null);
L10: const [photoFile, setPhotoFile] = useState(null);
L11: const [photoUploaded, setPhotoUploaded] = useState(false);
L13: const progress = photoUploaded ? 25 : 0;
L15: const handleImageUpload = (e) => {
L16: const file = e.target.files[0];
L74: export default Step1;

--- File: src\components\ProfileCreation\Step2\Step2.jsx ---
L7: function Step2({ goNext, goBack, petData }) {
L8: const [selectedPet, setSelectedPet] = useState(petData.petType || "");
L9: const [selectedPetCard, setSelectedPetCard] = useState(
L17: const [selectedBreed, setSelectedBreed] = useState(petData.breed || "");
L18: const [breedSearch, setBreedSearch] = useState("");
L19: const [showBreedDropdown, setShowBreedDropdown] = useState(false);
L20: const [selectedGender, setSelectedGender] = useState(petData.gender || "");
L21: const [petName, setPetName] = useState(petData.petName || "");
L22: const [showOtherPopup, setShowOtherPopup] = useState(false);
L23: const [showOtherBreedPopup, setShowOtherBreedPopup] = useState(false);
L24: const [customPetType, setCustomPetType] = useState("");
L25: const [customBreed, setCustomBreed] = useState("");
L26: const [localError, setLocalError] = useState("");
L27: const breedBoxRef = React.useRef(null);
L29: const [petIds, setPetIds] = useState(
L33: const progress = 50;
L35: const filteredBreeds =
L41: const handleClickOutside = (e) => {
L50: const handleNext = () => {
L279: export default Step2;

--- File: src\components\ProfileCreation\Step3\Step3.jsx ---
L7: function Step3({ goNext, goBack, petData }) {
L8: const [knowDOB, setKnowDOB] = useState(!!petData.birthDate);
L9: const [dob, setDob] = useState(petData.birthDate || "");
L11: const getApproxYears = () => {
L13: const match = petData.approxAge.match(/(\d+)y/);
L17: const getApproxMonths = () => {
L19: const match = petData.approxAge.match(/(\d+)m/);
L23: const [years, setYears] = useState(getApproxYears());
L24: const [months, setMonths] = useState(getApproxMonths());
L25: const progress = 75;
L141: export default Step3;

--- File: src\components\ProfileCreation\Step4\Step4.jsx ---
L8: function Step4({ goBack, petData, setStep, isSubmitting, setIsSubmitting, submitError, setSubmitError, onNavigateToPetHome }) {
L9: const progress = 100;
L11: const handleGenerate = async () => {
L16: const formData = new FormData();
L25: const storedUserData = localStorage.getItem("user");
L28: const userObj = JSON.parse(storedUserData);
L33: const validIds = (petData.petIds || []).filter(
L40: const response = await fetch(`${API_BASE}/api/pet-profile/`, {
L45: const profileData = await response.json();
L53: const petProfileId = profileData.pet_profile_id;
L54: const petolifeId   = profileData.petolife_id;
L56: const localUser   = localStorage.getItem("user");
L57: const userId      = localUser ? JSON.parse(localUser).id : "guest";
L58: const storageKey  = `pets_${userId}`;
L60: const newPet = {
L71: const existingPetsStr = localStorage.getItem(storageKey);
L72: const existingPets    = existingPetsStr ? JSON.parse(existingPetsStr) : [];
L75: const petForHome = {
L96: const petAgeValue = petData.birthDate || petData.approxAge || "[Not Added]";
L178: export default Step4;

--- File: src\components\ProfileCreation\StepHeaderBar\StepHeaderBar.jsx ---
L5: function StepHeaderBar({ onBack }) {
L16: export default StepHeaderBar;

--- File: src\components\ProfileCreation\StepProgress\StepProgress.jsx ---
L5: function StepProgress({ progress, stepNumber }) {
L35: export default StepProgress;

--- File: src\components\Timeline\TimelinePage.jsx ---
L5: export default function TimelinePage() {

--- File: src\components\UserProfile\EditablePetCard.jsx ---
L11: const EditablePetCard = ({ pet, onUpdate }) => {
L12: const [profile, setProfile] = useState({
L23: const [isEditing, setIsEditing] = useState(false);
L24: const [saving, setSaving] = useState(false);
L25: const [error, setError] = useState(null);
L42: const handleChange = (e) => {
L43: const { name, value } = e.target;
L47: const handlePhotoChange = async (e) => {
L48: const file = e.target.files[0];
L52: const objectUrl = URL.createObjectURL(file);
L55: const formData = new FormData();
L59: const res = await fetchWithAuth(`/api/pet-profile/${pet.id}/photo`, {
L65: const data = await res.json();
L76: const handleSave = async () => {
L81: const updatePayload = {
L91: const res = await fetchWithAuth(`/api/pet-profile/${pet.id}`, {
L113: const cancelEdit = () => {
L132: const genderIcon = profile.gender?.toLowerCase() === "female" ? femaleIcon : maleIcon;
L255: export default EditablePetCard;

--- File: src\components\UserProfile\EditableUserCard.jsx ---
L6: const EditableUserCard = ({ user }) => {
L7: const [profile, setProfile] = useState({
L17: const [isEditing, setIsEditing] = useState(false);
L18: const [loading, setLoading] = useState(true);
L19: const [saving, setSaving] = useState(false);
L20: const [error, setError] = useState(null);
L28: const fetchProfile = async () => {
L30: const res = await fetchWithAuth(`/api/user-profile/${user.id}`);
L32: const data = await res.json();
L50: const handleChange = (e) => {
L51: const { name, value } = e.target;
L55: const handleAvatarChange = async (e) => {
L56: const file = e.target.files[0];
L60: const objectUrl = URL.createObjectURL(file);
L63: const formData = new FormData();
L67: const res = await fetchWithAuth(`/api/user-profile/${user.id}/avatar`, {
L73: const data = await res.json();
L83: const handleSave = async () => {
L87: const updatePayload = {
L96: const res = await fetchWithAuth(`/api/user-profile/${user.id}`, {
L117: const cancelEdit = () => {
L213: export default EditableUserCard;

--- File: src\components\UserProfile\UserProfile.jsx ---
L12: const UserProfile = ({ pets = [], activePetId, onPetSelect, onAddPet }) => {
L13: const { user, signOut } = useAuth();
L14: const navigate = useNavigate();
L15: const [showLogoutModal, setShowLogoutModal] = useState(false);
L18: const selectedPet = pets.find(p => p.id === activePetId) || (pets.length > 0 ? pets[0] : null);
L20: const confirmLogout = async () => {
L36: const handlePetUpdate = () => {
L93: export default UserProfile;

--- File: src\hooks\useAuth.js ---
L10: const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
L12: export default function useAuth() {
L13: const navigate = useNavigate();
L14: const [user, setUser] = useState(() => {
L16: const stored = localStorage.getItem("user");
L20: const [token, setToken] = useState(() => localStorage.getItem("access_token") || null);
L21: const [isAuthenticated, setIsAuthenticated] = useState(!!token);
L22: const [loading, setLoading] = useState(true);
L27: const login = useCallback((accessToken, refreshToken, userData) => {
L39: const logout = useCallback(() => {
L45: const userId = user?.id;
L60: const validateSession = useCallback(async () => {
L61: const storedToken = localStorage.getItem("access_token");
L68: const res = await fetch(`${API_BASE}/api/auth/me`, {
L72: const userData = await res.json();

--- File: src\services\QRService.js ---
L22: export async function generateQR(canvas, url) {
L40: export async function generateQRDataURL(url) {
L58: export async function generateQRBlob(url) {
L59: const dataUrl = await generateQRDataURL(url);
L60: const response = await fetch(dataUrl);

--- File: src\utils\fetchWithAuth.js ---
L6: const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
L8: export default async function fetchWithAuth(endpoint, options = {}) {
L9: const token = localStorage.getItem("access_token");
L10: const headers = {
L23: const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
L25: const res = await fetch(url, { ...options, headers });
```

---


## Appendix B: Raw Backend Code Signatures (backend_summary.txt)

`python
--- File: backend/app\config.py ---

--- File: backend/app\main.py ---
L56: @app.get("/")
L65: @app.on_event("startup")

--- File: backend/app\supabase_client.py ---

--- File: backend/app\__init__.py ---

--- File: backend/app\routers\auth.py ---
L20: class SignupRequest(BaseModel):
L30: class LoginRequest(BaseModel):
L36: class RegisterInterestRequest(BaseModel):
L52: class ForgotPasswordRequest(BaseModel):
L56: class ResetPasswordRequest(BaseModel):
L61: @router.post("/signup")
L123: @router.post("/login")
L168: @router.get("/google")
L199: @router.get("/me")
L226: @router.post("/register-interest")
L250: @router.post("/forgot-password")
L263: @router.post("/reset-password")

--- File: backend/app\routers\checklist.py ---
L9: class TaskLogRequest(BaseModel):
L15: @router.get("/{pet_id}")
L25: @router.post("/{pet_id}")

--- File: backend/app\routers\location.py ---
L5: class PincodeRequest(BaseModel):
L29: @router.post("/lookup")
L59: @router.get("/pincode/{pincode}")

--- File: backend/app\routers\medical_records.py ---
L19: def ensure_bucket_exists():
L29: @router.post("/upload")
L116: @router.get("/{pet_profile_id}")
L141: @router.delete("/{record_id}")
L184: @router.patch("/{record_id}/favorite")

--- File: backend/app\routers\pet_health_id.py ---
L257: def get_city_code(city_name: str) -> str:
L268: def get_pet_type_code(pet_type: str) -> str:
L278: def get_next_sequence(city_code: str, pet_type_code: str) -> int:
L299: def generate_pet_health_id(city_name: str, pet_type: str) -> str:
L308: def store_pet_health_id(health_id: str, pet_profile_id: str) -> bool:
L332: def generate_and_store(city_name: str, pet_type: str, pet_profile_id: str) -> str:
L346: class GenerateHealthIdRequest(BaseModel):
L352: @router.post("/generate")
L387: @router.get("/preview/{city}/{pet_type}")

--- File: backend/app\routers\pet_profile.py ---
L22: class PetProfileUpdate(BaseModel):
L38: def _verify_pet_ownership(profile_id: str, user_id: str):
L50: @router.post("/")
L175: @router.get("/")
L192: @router.get("/by-user/{user_id}")
L211: @router.get("/by-petolife-id/{petolife_id:path}")
L219: @router.get("/public/{petolife_id:path}")
L262: @router.get("/{profile_id}")
L282: @router.patch("/{profile_id}")
L306: @router.post("/{profile_id}/photo")
L335: @router.delete("/{profile_id}")

--- File: backend/app\routers\user_profile.py ---
L18: class UserProfileUpdate(BaseModel):
L26: def ensure_avatars_bucket_exists():
L36: @router.get("/{user_id}")
L52: @router.put("/{user_id}")
L105: @router.post("/{user_id}/avatar")

--- File: backend/app\utils\auth.py ---

--- File: backend/app\utils\__init__.py ---

`
