# PetOLife Security & Vulnerability Audit

## 1. Executive Summary
This document outlines the security improvements implemented during Phase 1 & 2 of the PetOLife MVP_V2 refactor, along with an audit of outstanding vulnerabilities and a roadmap for enterprise-grade security hardening. 

Our core focus is protecting user PII (Personally Identifiable Information), Pet Health Records, and securing the authentication flow against common web vulnerabilities (XSS, CSRF, Token Hijacking).

---

## 2. Completed Security Implementations (Phase 2 & 3.1)

### 2.1 Session Management & Route Protection
*   **Centralized `useAuth` Hook:** Replaced scattered token checks with a robust `useAuth.js` hook that handles token validation, silent refresh, and local caching.
*   **Strict Route Guarding:** Implemented `ProtectedRoute.jsx` in `App.jsx`. All internal pages (`/home`, `/create-pet-profile`) are now protected. Unauthenticated users are strictly redirected to `/login`.
*   **API Interceptor (`fetchWithAuth.js`):** Created a wrapper for `fetch` that automatically attaches the `Bearer` token and handles `401 Unauthorized` responses by immediately purging local sessions and redirecting to login.
*   **Public Route Whitelisting:** `/pet/:id` was explicitly whitelisted for public QR scanning, preventing unauthorized access to other components while ensuring the ID card remains shareable.

### 2.2 Client-Side Validation
*   **Medical Records Payload Limiting:** Added a 10MB strict limit on file uploads in `MedicalRecords.jsx` to prevent client-side hanging and mitigate potential Denial of Service (DoS) attacks via oversized payloads.
*   **MIME Type Checking:** Enforced strict `image/*` and `.pdf` checks before uploading to prevent malicious script injection via fake file extensions.
*   **Input Sanitization:** Added regex stripping on mobile numbers (`\D/g`) and trim checks on the Login/Registration forms to prevent leading/trailing space errors and basic injection vectors.

---

## 3. Vulnerability Audit & Identified Risks

While the MVP is currently functional, several security paradigms rely on basic implementations that must be upgraded for a production environment handling medical data.

### 3.1 LocalStorage Token Vulnerability (High Risk)
*   **Current State:** Both `access_token` and `refresh_token` are stored in `localStorage`.
*   **Vulnerability:** Any Cross-Site Scripting (XSS) vulnerability in the app (or third-party NPM packages) allows an attacker to easily extract these tokens using `window.localStorage`.
*   **Action Plan:** Move authentication to `HttpOnly`, `Secure`, `SameSite=Strict` cookies. The backend FastAPI server must set these cookies, and the frontend must rely on cookies rather than passing tokens in the `Authorization` header.

### 3.2 Refresh Token Rotation (Medium Risk)
*   **Current State:** Supabase handles refresh tokens, but the frontend does not proactively rotate them before expiration.
*   **Vulnerability:** If a token expires mid-session, the user receives a 401 and is logged out abruptly, leading to poor UX. Furthermore, stolen refresh tokens have a longer lifespan.
*   **Action Plan:** Implement a silent refresh mechanism using an invisible `iframe` or a periodic background worker (e.g., `setInterval`) that hits a `/refresh` endpoint 5 minutes before token expiry.

### 3.3 Rate Limiting & Brute Force (Medium Risk)
*   **Current State:** The backend authentication endpoints (`/login`, `/signup`, `/forgot-password`) lack strict rate limiting at the application layer.
*   **Vulnerability:** Attackers can attempt credential stuffing or brute-force OTP/Password endpoints.
*   **Action Plan:** Implement `slowapi` (or similar rate limiter) on the FastAPI backend, restricting `/login` to 5 attempts per 15 minutes per IP. 

### 3.4 IDOR (Insecure Direct Object Reference) on Medical Records (High Risk)
*   **Current State:** `pet_id` is passed from the frontend to fetch records. 
*   **Vulnerability:** If the backend does not strictly verify that the `user_id` extracted from the JWT token actually *owns* the requested `pet_id`, a malicious user could fetch records for another person's pet by guessing the `pet_id`.
*   **Action Plan:** Review `backend/app/routers/medical_records.py`. Ensure every SQL query includes `.eq('user_id', current_user.id)` alongside the `pet_id` filter.

---

## 4. Best Practice Security Suggestions for Production

1.  **Content Security Policy (CSP):** Implement strict CSP headers on the production deployment (e.g., Vercel/Netlify) to block unauthorized inline scripts and restrict image/API domains exclusively to trusted sources (e.g., your Supabase URL).
2.  **Turn off Detailed Error Messages:** Ensure FastAPI runs with `DEBUG=False` in production. Detailed stack traces must never leak to the frontend.
3.  **Role-Based Access Control (RBAC):** For the upcoming `FamilyAccess` feature, rely on PostgreSQL Row-Level Security (RLS) on Supabase rather than just hiding UI elements. If a user is a "Caregiver," RLS should physically prevent them from deleting a pet profile, even if they spoof the API call.
4.  **Audit Logging:** For sensitive actions (e.g., deleting a pet, sharing medical records), implement an `audit_logs` table to track the user ID, timestamp, and action taken for accountability.
