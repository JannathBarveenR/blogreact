# PetOLife — Performance & Lag Fix Plan (No TanStack)

> **Goal**: Eliminate loading latency, tab-switch lag, duplicate fetches, and render choppiness using only what's already in the stack — React 18, native fetch, localStorage, and FastAPI.

---

## 1. fetchWithAuth — Complete Usage Audit

### 1.1 Where it is used right now

| # | File | Line | Endpoint | HTTP Method | Auth Required? |
|---|------|------|----------|-------------|----------------|
| 1 | [MainLayout.jsx](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/src/components/MainLayout/MainLayout.jsx#L50) | L50 | `/api/pet-profile/by-user/{userId}` | GET | ✅ Yes — private |
| 2 | [EditableUserCard.jsx](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/src/components/UserProfile/EditableUserCard.jsx#L32) | L32 | `/api/user-profile/{userId}` | GET | ✅ Yes — private |
| 3 | [EditableUserCard.jsx](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/src/components/UserProfile/EditableUserCard.jsx#L70) | L70 | `/api/user-profile/{userId}/avatar` | POST | ✅ Yes — private |
| 4 | [EditableUserCard.jsx](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/src/components/UserProfile/EditableUserCard.jsx#L104) | L104 | `/api/user-profile/{userId}` | PUT | ✅ Yes — private |
| 5 | [EditablePetCard.jsx](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/src/components/UserProfile/EditablePetCard.jsx#L82) | L82 | `/api/pet-profile/{petId}/photo` | POST | ✅ Yes — private |
| 6 | [EditablePetCard.jsx](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/src/components/UserProfile/EditablePetCard.jsx#L122) | L122 | `/api/pet-profile/{petId}` | PATCH | ✅ Yes — private |
| 7 | [EditablePetCard.jsx](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/src/components/UserProfile/EditablePetCard.jsx#L152) | L152 | `/api/pet-profile/{petId}` | DELETE | ✅ Yes — private |
| 8 | [MedicalRecords.jsx](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/src/components/medical/MedicalRecords.jsx#L81) | L81 | `/api/medical-records/{petId}` | GET | ✅ Yes — private |
| 9 | [MedicalRecords.jsx](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/src/components/medical/MedicalRecords.jsx#L127) | L127 | `/api/medical-records/upload` | POST | ✅ Yes — private |
| 10 | [MedicalRecords.jsx](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/src/components/medical/MedicalRecords.jsx#L174) | L174 | `/api/medical-records/upload` | POST | ✅ Yes — private |
| 11 | [MedicalRecords.jsx](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/src/components/medical/MedicalRecords.jsx#L210) | L210 | `/api/medical-records/{recordId}` | DELETE | ✅ Yes — private |
| 12 | [MedicalRecords.jsx](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/src/components/medical/MedicalRecords.jsx#L229) | L229 | `/api/medical-records/{recordId}/favorite` | PATCH | ✅ Yes — private |
| 13 | [Step4.jsx](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/src/components/ProfileCreation/Step4/Step4.jsx#L75) | L75 | `/api/pet-profile/` | POST | ✅ Yes — private |

### 1.2 Where raw `fetch()` is used instead of fetchWithAuth — and whether it should be

| File | Endpoint | Auth Needed? | Problem |
|------|----------|-------------|---------|
| [NoRecordsCard.jsx L24](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/src/components/Home/NoRecordsCard/NoRecordsCard.jsx#L24) | `/api/medical-records/{petId}` | ✅ Yes | **Bug**: Uses raw `fetch()` instead of `fetchWithAuth`. Manually reads token from localStorage. Should be `fetchWithAuth`. Also **duplicates** the same fetch already done in MedicalRecords.jsx |
| [petcard.jsx L16](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/src/components/petcard/petcard.jsx#L16) | `/api/pet-profile/public/{id}` | ❌ No | Raw fetch is correct here — public endpoint, no auth token needed |
| [Login.jsx L117–L475](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/src/components/Login/Login.jsx) | `/api/auth/*`, `/api/location/lookup` | ❌ No | Raw fetch is correct — auth flows run before a token exists |
| [useAuth.js L68](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/src/hooks/useAuth.js#L68) | `/api/auth/me` | ❌ No | Correct — manually injects token for session validation |
| [ResetPassword.jsx L65](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/src/components/Login/ResetPassword.jsx#L65) | `/api/auth/reset-password` | ❌ No | Correct — uses a one-time reset token not a session token |
| [endpoints.js L9, L27](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/src/api/endpoints.js) | `/api/auth/register-interest` | ❌ No | Correct — public pre-registration endpoint |

### 1.3 What to fix immediately

- **Fix NoRecordsCard.jsx** — replace raw `fetch()` with `fetchWithAuth()`. This is both a security issue (inconsistent auth) and a performance issue (causes a second independent API call for the same data that MedicalRecords already fetches).
- **All 13 `fetchWithAuth` usages above are correct** — every one of them hits a protected endpoint and must use auth headers. Do not remove any of them.
- The right optimization is not to reduce `fetchWithAuth` calls, but to **prevent the same endpoint from being called multiple times** via caching — covered in Section 2.

---

## 2. Data Prefetching & In-App Cache Strategy

### 2.1 The core problem

Every time a user **navigates to a tab**, the component mounts fresh and fires its `useEffect` fetch. There is no memory between tab visits. This causes visible loading spinners on **every single tab switch** — even for data that hasn't changed.

### 2.2 Solution: A lightweight in-memory cache module

Build a single `src/utils/appCache.js` — a module-level JS object that persists across component remounts (unlike `useState`, which resets on unmount). This is React's own recommendation before reaching for external libraries.

```javascript
// src/utils/appCache.js
// Module-level store — lives as long as the browser tab is open.
// Cleared automatically on logout.

const store = {};
const TTL = {
  pets: 5 * 60 * 1000,           // 5 minutes — pets rarely change
  userProfile: 10 * 60 * 1000,   // 10 minutes — profile edits are intentional
  medicalRecords: 2 * 60 * 1000, // 2 minutes — records may be added more often
};

export const appCache = {
  set(key, data) {
    store[key] = { data, ts: Date.now() };
  },

  get(key, ttlMs) {
    const entry = store[key];
    if (!entry) return null;
    if (Date.now() - entry.ts > ttlMs) {
      delete store[key];
      return null; // expired
    }
    return entry.data;
  },

  invalidate(key) {
    delete store[key];
  },

  invalidateAll() {
    Object.keys(store).forEach(k => delete store[k]);
  },

  // Convenience: invalidate everything for a specific pet
  invalidatePet(petId) {
    this.invalidate('pets');
    this.invalidate(`records_${petId}`);
  },
};

export const CACHE_KEYS = {
  pets: (userId) => `pets_${userId}`,
  userProfile: (userId) => `userProfile_${userId}`,
  medicalRecords: (petId) => `records_${petId}`,
};

export { TTL };
```

### 2.3 How to use the cache in each component

#### MainLayout.jsx — Pets list (the most critical fix)

```javascript
// BEFORE (current) — fetches every time user logs in or tab refreshes
const fetchPets = async () => {
  setLoadingPets(true);
  const res = await fetchWithAuth(`/api/pet-profile/by-user/${user.id}`);
  const data = await res.json();
  setPets(data);
  setLoadingPets(false);
};
```

```javascript
// AFTER — serve from cache instantly, revalidate in background
import { appCache, CACHE_KEYS, TTL } from '../../utils/appCache';

const fetchPets = async (forceRefresh = false) => {
  const cacheKey = CACHE_KEYS.pets(user.id);

  // 1. If cache is valid and not forced, use it immediately — zero lag
  if (!forceRefresh) {
    const cached = appCache.get(cacheKey, TTL.pets);
    if (cached) {
      setPets(cached);
      setLoadingPets(false);
      return; // No API call — instant render
    }
  }

  // 2. Show loading only when truly fetching fresh
  setLoadingPets(true);
  try {
    const res = await fetchWithAuth(`/api/pet-profile/by-user/${user.id}`);
    if (res.ok) {
      const data = await res.json();
      appCache.set(cacheKey, data);  // Store in memory cache
      localStorage.setItem(`pets_${user.id}`, JSON.stringify(data)); // Persist for cold start
      setPets(data);
    }
  } catch (err) {
    console.error('Failed to fetch pets', err);
  } finally {
    setLoadingPets(false);
  }
};
```

#### EditableUserCard.jsx — User profile

```javascript
// After mount: check cache first, fetch only if stale
const fetchProfile = async () => {
  const cacheKey = CACHE_KEYS.userProfile(user.id);
  const cached = appCache.get(cacheKey, TTL.userProfile);
  if (cached) {
    setProfile({ ...cached });
    setLoading(false);
    return;
  }
  setLoading(true);
  const res = await fetchWithAuth(`/api/user-profile/${user.id}`);
  if (res.ok) {
    const data = await res.json();
    appCache.set(cacheKey, data);
    setProfile({ ...data });
  }
  setLoading(false);
};

// After a successful save, invalidate the profile cache so next visit refetches
const handleSave = async () => {
  // ... existing save logic ...
  if (res.ok) {
    appCache.invalidate(CACHE_KEYS.userProfile(user.id)); // bust cache
    setIsEditing(false);
  }
};
```

#### MedicalRecords.jsx — Records list

```javascript
const fetchRecords = async (forceRefresh = false) => {
  if (!activePetId) return;
  const cacheKey = CACHE_KEYS.medicalRecords(activePetId);

  if (!forceRefresh) {
    const cached = appCache.get(cacheKey, TTL.medicalRecords);
    if (cached) {
      setAllRecords(cached);
      setLoadingRecords(false);
      return; // instant
    }
  }

  setLoadingRecords(true);
  const res = await fetchWithAuth(`/api/medical-records/${activePetId}`);
  if (res.ok) {
    const data = await res.json();
    appCache.set(cacheKey, data);
    setAllRecords(data);
  }
  setLoadingRecords(false);
};

// After upload/delete/favorite — call fetchRecords(true) to force refresh
const startUpload = async (file) => {
  // ... upload logic ...
  if (res.ok) {
    appCache.invalidate(CACHE_KEYS.medicalRecords(activePetId));
    await fetchRecords(true); // force fresh data
  }
};
```

#### NoRecordsCard.jsx — Eliminate the duplicate fetch

`NoRecordsCard` currently makes an **independent API call** to the same `/api/medical-records/{petId}` endpoint that `MedicalRecords.jsx` also calls. With the shared in-memory cache, this is solved with zero API calls:

```javascript
// NoRecordsCard.jsx — AFTER
import { appCache, CACHE_KEYS, TTL } from '../../../utils/appCache';

useEffect(() => {
  if (!petId) return;
  
  // Try cache first — will almost always hit because MedicalRecords already populated it
  const cached = appCache.get(CACHE_KEYS.medicalRecords(petId), TTL.medicalRecords);
  if (cached) {
    setRecords(cached);
    setLoading(false);
    return;
  }

  // Fallback: fetch if not in cache (e.g., cold dashboard load)
  let isMounted = true;
  const fetchPetRecords = async () => {
    setLoading(true);
    const res = await fetchWithAuth(`/api/medical-records/${petId}`);
    if (res.ok && isMounted) {
      const data = await res.json();
      appCache.set(CACHE_KEYS.medicalRecords(petId), data);
      setRecords(data);
    }
    if (isMounted) setLoading(false);
  };
  fetchPetRecords();
  return () => { isMounted = false; };
}, [petId]);
```

### 2.4 Data Prefetching — load before the user gets there

After pets are loaded in `MainLayout`, immediately trigger background prefetches for the data the user will need in other tabs. The user is on the Home tab — meanwhile, silently fetch records and profile in the background.

```javascript
// MainLayout.jsx — add this after fetchPets() succeeds
const prefetchSecondaryData = async (userId, pets) => {
  // Prefetch user profile in background (Profile tab)
  if (!appCache.get(CACHE_KEYS.userProfile(userId), TTL.userProfile)) {
    fetchWithAuth(`/api/user-profile/${userId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) appCache.set(CACHE_KEYS.userProfile(userId), data); })
      .catch(() => {}); // silent — user isn't on this tab yet
  }

  // Prefetch medical records for the active pet (Medical Records tab)
  if (pets.length > 0) {
    const activePet = pets[0];
    if (!appCache.get(CACHE_KEYS.medicalRecords(activePet.id), TTL.medicalRecords)) {
      fetchWithAuth(`/api/medical-records/${activePet.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) appCache.set(CACHE_KEYS.medicalRecords(activePet.id), data); })
        .catch(() => {});
    }
  }
};

// Call after pets are loaded:
// appCache.set(cacheKey, data);
// setPets(data);
// prefetchSecondaryData(user.id, data); // ← add this line
```

**Result**: By the time the user taps the Profile or Medical Records tab, the data is already cached. The tab renders **instantly** with zero visible loading.

### 2.5 Cold start: use localStorage as a persistent fallback

The existing `localStorage.setItem('pets_...')` pattern is already in place. Combine it with the in-memory cache for the best of both:

- **First render after browser reload** → read from `localStorage` into state (immediate paint), then populate in-memory cache.
- **Subsequent tab switches** → in-memory cache, no localStorage read.
- **After data changes** → invalidate in-memory cache AND update localStorage.

---

## 3. Lazy Loading — Current State & Improvements

### 3.1 What is lazy-loaded right now

Only **5 top-level route components** in [App.jsx](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/src/App.jsx#L8-L12) are lazy-loaded:

| Component | Bundle Split? | Benefit |
|-----------|--------------|---------|
| `LandingPg` | ✅ | Good — large marketing page |
| `MainLayout` | ✅ | Good — authenticated shell |
| `ProfileCreate` | ✅ | Good — wizard is large |
| `PetCard` | ✅ | Good — public page |
| `ResetPassword` | ✅ | Good — rarely visited |

**`Login` is NOT lazy-loaded** — it's eagerly imported. Since Login is the first screen most new users hit, this is fine.

### 3.2 What should also be lazy-loaded

Inside `MainLayout`, all four tab views are **eagerly imported** and parsed on initial load, even though the user only sees one at a time:

```javascript
// MainLayout.jsx — currently, all of these are eager imports
import MedicalRecords from "../medical/MedicalRecords";    // 21KB JSX
import Home from "../Home/Home";
import TimelinePage from "../Timeline/TimelinePage";
import UserProfile from "../UserProfile/UserProfile";
```

These all load when the user hits `/home`, even if they never visit Timeline or Medical Records in that session.

**Fix — convert them to lazy imports inside MainLayout:**

```javascript
// MainLayout.jsx — after fix
import { lazy, Suspense } from "react";

const Home = lazy(() => import("../Home/Home"));
const MedicalRecords = lazy(() => import("../medical/MedicalRecords"));
const TimelinePage = lazy(() => import("../Timeline/TimelinePage"));
const UserProfile = lazy(() => import("../UserProfile/UserProfile"));

// In renderContent(), wrap the returned component:
const renderContent = () => {
  let content;
  if (activeTab === "home") {
    content = <Home pets={pets} activePetId={activePetId} onPetSelect={handlePetSelect} onAddPet={handleAddPet} />;
  } else if (activeTab === "medicalrecords") {
    content = <MedicalRecords pets={pets} activePetId={activePetId} onPetSelect={handlePetSelect} onAddPet={handleAddPet} />;
  } else if (activeTab === "profile") {
    content = <UserProfile pets={pets} activePetId={activePetId} onPetSelect={handlePetSelect} onAddPet={handleAddPet} refreshPets={fetchPets} />;
  } else {
    content = <TimelinePage />;
  }
  return (
    <div style={{ paddingBottom: '70px', height: '100vh', overflowY: 'auto' }}>
      <TopNav />
      <Suspense fallback={<TabLoadingSpinner />}>{content}</Suspense>
    </div>
  );
};
```

> Note: The **first** tab switch to each section will still download its bundle once. After that, it's cached by the browser. Combined with the data cache from Section 2, subsequent visits feel instant.

### 3.3 Prefetch bundles on hover (link preloading)

The user can signal which tab they're about to visit by hovering over the bottom nav icon. Use this to pre-download the bundle:

```javascript
// BottomNav.jsx — add onMouseEnter to each nav item
<button
  onMouseEnter={() => {
    // Preload the bundle 300ms before the user actually clicks
    if (item.key === 'medicalrecords') import('../medical/MedicalRecords');
    if (item.key === 'profile') import('../UserProfile/UserProfile');
  }}
  onClick={() => onNavigate(item.key)}
>
```

This preloads the JS bundle while the user's finger/cursor is still moving — so by the time they click, the module is already downloaded.

### 3.4 Image lazy loading

Every `<img>` tag in the app currently loads eagerly. Add `loading="lazy"` to all non-hero images:

```jsx
// ProfileCard, NoRecordsCard, PetDashboard, MedicalRecords record list
<img src={pet.pet_photo_url} loading="lazy" alt={pet.pet_name} />
```

Pet photos in the record list and the pet switcher dropdown are the highest-impact targets since they can be several hundred KB each.

---

## 4. Complete App Optimization Strategies (Implementable Now)

### 4.1 Eliminate re-renders with React.memo

Currently, **zero components** use `React.memo`, `useMemo`, or `useCallback` for rendering optimization. Every time `MainLayout` updates `pets` or `activePetId`, every child component in the tree re-renders — even components that don't use those values.

**Priority targets:**

```javascript
// HealthBanner.jsx — static, never needs to re-render
export default React.memo(function HealthBanner() {
  return <div className="health-banner">...</div>;
});

// ReminderCard.jsx — static UI
export default React.memo(function ReminderCard({ onNavigateTab }) {
  // ...
});

// QuickActions.jsx — only re-renders if onNavigateTab changes
export default React.memo(function QuickActions({ onNavigateTab }) {
  // ...
});

// ProfileCard.jsx — only re-renders if pets/selectedPet changes
export default React.memo(function ProfileCard({ pets, selectedPet, ... }) {
  // ...
});
```

**Stabilize callback props with useCallback in MainLayout:**

```javascript
// MainLayout.jsx
const handlePetSelect = useCallback((selectedPet) => {
  if (!selectedPet) return;
  setActivePetId(selectedPet.id);
  if (user?.id) localStorage.setItem(`active_pet_id_${user.id}`, selectedPet.id);
}, [user?.id]);

const handleAddPet = useCallback(() => navigate("/create-pet-profile"), [navigate]);
const handleFab = useCallback(() => navigate("/create-pet-profile"), [navigate]);
```

Without `useCallback`, every render of `MainLayout` creates new function references, which breaks `React.memo` comparisons for all children.

### 4.2 Replace alert() with non-blocking inline feedback

The app has **8+ `alert()`** calls. `alert()` is a synchronous, browser-blocking dialog that **freezes the entire JS event loop** until dismissed. On mobile, this is especially jarring.

Replace with a simple in-app toast using a small `useToast` hook:

```javascript
// src/hooks/useToast.js
import { useState, useCallback } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), duration);
  }, []);

  return { toast, showToast };
}
```

```jsx
// Toast display component — add once to MainLayout and once to Login
function ToastDisplay({ toast }) {
  if (!toast) return null;
  return (
    <div
      style={{
        position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
        background: toast.type === 'error' ? '#dc2626' : '#0D5254',
        color: '#fff', padding: '12px 20px', borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 9999,
        fontSize: '14px', fontWeight: 500, maxWidth: '90vw',
        animation: 'slideUp 0.2s ease',
      }}
    >
      {toast.message}
    </div>
  );
}
```

Replace all `alert("Upload failed: ...")` with `showToast("Upload failed: ...", "error")`.

### 4.3 Prevent re-mounting of tab content

Currently, every tab switch **unmounts the current tab's component and mounts the new one from scratch**. This means every visit to Medical Records triggers `useEffect` + API fetch from scratch, all animations re-run, and scroll position is lost.

The fix is to keep all tabs mounted but only **show/hide** them with CSS:

```jsx
// MainLayout.jsx — render all tabs, hide inactive ones
return (
  <>
    <div style={{ paddingBottom: '70px', height: '100vh', overflowY: 'auto' }}>
      <TopNav />
      {/* Always mounted — just hidden when not active */}
      <div style={{ display: activeTab === 'home' ? 'block' : 'none' }}>
        <Home pets={pets} activePetId={activePetId} onPetSelect={handlePetSelect} onAddPet={handleAddPet} />
      </div>
      <div style={{ display: activeTab === 'medicalrecords' ? 'block' : 'none' }}>
        <MedicalRecords pets={pets} activePetId={activePetId} onPetSelect={handlePetSelect} onAddPet={handleAddPet} />
      </div>
      <div style={{ display: activeTab === 'profile' ? 'block' : 'none' }}>
        <UserProfile pets={pets} activePetId={activePetId} onPetSelect={handlePetSelect} onAddPet={handleAddPet} refreshPets={fetchPets} />
      </div>
      <div style={{ display: activeTab === 'timeline' ? 'block' : 'none' }}>
        <TimelinePage />
      </div>
    </div>
    <BottomNav active={activeTab} onNavigate={setActiveTab} onFabPress={handleFab} />
  </>
);
```

**What this gives you**: After the first visit to Medical Records, switching back to it is **instantaneous** — zero re-fetch, zero re-mount, preserved scroll position. The data fetch in `useEffect` only runs once per session.

> **Trade-off**: All four tab components are in the DOM simultaneously. This increases memory usage slightly but eliminates all tab-switch lag. For PetOLife's scale, this is worth it.

### 4.4 Optimistic UI for favorite toggle and pet select

Currently, toggling a favorite heart requires: `PATCH /api/.../favorite` → wait for response → call `fetchRecords()` → re-render.

**Replace with instant UI update:**

```javascript
// MedicalRecords.jsx — optimistic favorite toggle
const toggleFavorite = async (recordId) => {
  // 1. Update UI instantly — no waiting
  setAllRecords(prev =>
    prev.map(r => r.id === recordId ? { ...r, is_favorite: !r.is_favorite } : r)
  );
  // Also update cache
  const cached = appCache.get(CACHE_KEYS.medicalRecords(activePetId), TTL.medicalRecords);
  if (cached) {
    appCache.set(CACHE_KEYS.medicalRecords(activePetId), 
      cached.map(r => r.id === recordId ? { ...r, is_favorite: !r.is_favorite } : r)
    );
  }

  // 2. Fire API in background
  try {
    const res = await fetchWithAuth(`/api/medical-records/${recordId}/favorite`, { method: 'PATCH' });
    if (!res.ok) {
      // Rollback on failure
      setAllRecords(prev =>
        prev.map(r => r.id === recordId ? { ...r, is_favorite: !r.is_favorite } : r)
      );
    }
  } catch {
    // Rollback on network error
    setAllRecords(prev =>
      prev.map(r => r.id === recordId ? { ...r, is_favorite: !r.is_favorite } : r)
    );
  }
};
```

The heart now toggles instantly. If the server fails, it silently rolls back. No re-fetch of all records for one toggle.

### 4.5 Clear localStorage pet cache on logout

The current `logout()` in [useAuth.js](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/src/hooks/useAuth.js#L39) already removes `pets_{userId}` and `active_pet_id_{userId}`. Add the in-memory cache clear:

```javascript
const logout = useCallback(() => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  const userId = user?.id;
  if (userId) {
    localStorage.removeItem(`pets_${userId}`);
    localStorage.removeItem(`active_pet_id_${userId}`);
  }
  appCache.invalidateAll(); // ← add this
  setToken(null);
  setUser(null);
  setIsAuthenticated(false);
  navigate("/login", { replace: true });
}, [navigate, user?.id]);
```

### 4.6 Collapse the double `useEffect` data flow in Home.jsx

[Home.jsx](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/src/components/Home/Home.jsx) has two separate `useEffect` hooks that both set `selectedPet`, causing two renders instead of one whenever `propPets` or `propActivePetId` changes. Merge them:

```javascript
// Home.jsx — single useMemo instead of two useEffects
const selectedPet = useMemo(() => {
  if (incomingPet) return incomingPet;
  if (propPets && propPets.length > 0) {
    return propActivePetId
      ? propPets.find(p => p.id === propActivePetId) || propPets[0]
      : propPets[0];
  }
  return localPets[0] || null;
}, [propPets, propActivePetId, incomingPet, localPets]);
```

This is one computed value from one `useMemo` instead of two `useEffect`s + two `setState` calls.

---

## 5. Backend & DB Optimization Strategies

### 5.1 Eliminate the extra DB query in `_verify_pet_ownership`

Every mutation endpoint in [pet_profile.py](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/backend/app/routers/pet_profile.py#L38-L47) calls `_verify_pet_ownership`, which makes a separate `SELECT user_id FROM pet_profiles WHERE id = ?` query **before** the actual mutation. Then many endpoints do **another** `SELECT *` query to get the full row.

For `DELETE /{profile_id}` this is 3 sequential DB roundtrips:
1. `_verify_pet_ownership` → SELECT user_id
2. SELECT pet_photo_url for cleanup
3. DELETE

**Fix**: Fetch the full row once and check ownership in that same result:

```python
# pet_profile.py — updated delete endpoint (pattern applies to PATCH, POST photo too)
@router.delete("/{profile_id}")
async def delete_pet_profile(profile_id: str, user_id: str = Depends(get_current_user_id)):
    # ONE query to get everything needed
    result = supabase.table("pet_profiles").select("id, user_id, pet_photo_url").eq("id", profile_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Pet profile not found")
    profile = result.data[0]
    if profile["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Now proceed with delete — no extra SELECT needed
    photo_url = profile.get("pet_photo_url")
    # ... rest of delete logic
```

**Saves 1 extra DB roundtrip on every PATCH, DELETE, and photo upload**.

### 5.2 The double ownership check in medical_records.py

In [medical_records.py](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/backend/app/routers/medical_records.py#L116-L133), the `GET /medical-records/{pet_profile_id}` endpoint does:

1. `SELECT user_id FROM pet_profiles WHERE id = pet_profile_id` — ownership check
2. `SELECT * FROM medical_records WHERE pet_profile_id = ?` — actual data

These are 2 sequential DB calls. For a health-related app where records are frequently read, this doubles the DB load on every records fetch.

**Fix**: Trust the JWT-based `user_id` and add it to the records query directly:

```python
@router.get("/{pet_profile_id}")
async def get_medical_records(pet_profile_id: str, user_id: str = Depends(get_current_user_id)):
    # One query — only return records owned by this user AND matching this pet
    # This is secure because user_id in medical_records is set at upload time
    res = (
        supabase.table("medical_records")
        .select("*")
        .eq("pet_profile_id", pet_profile_id)
        .eq("user_id", user_id)          # ← security + data filter in ONE query
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []
```

This eliminates the extra `pet_profiles` ownership lookup on every records fetch. The filter `WHERE pet_profile_id = X AND user_id = Y` is secure because if the pet doesn't belong to the user, no records will match.

> **Prerequisite**: `user_id` must be reliably set on all `medical_records` rows. The current upload endpoint already does this, but check for existing rows where it might be null (the code already handles this fallback).

### 5.3 Add database indexes for the most common queries

The following queries happen on every single user session but are likely doing full table scans:

| Table | Column | Query | Fix |
|-------|--------|-------|-----|
| `pet_profiles` | `user_id` | `SELECT * FROM pet_profiles WHERE user_id = ?` | `CREATE INDEX idx_pet_profiles_user_id ON pet_profiles(user_id)` |
| `medical_records` | `pet_profile_id` | `SELECT * FROM medical_records WHERE pet_profile_id = ?` | `CREATE INDEX idx_medical_records_pet_profile_id ON medical_records(pet_profile_id)` |
| `medical_records` | `user_id` | `SELECT * FROM medical_records WHERE user_id = ?` | `CREATE INDEX idx_medical_records_user_id ON medical_records(user_id)` |
| `pet_ids` | `pet_profile_id` | `SELECT * FROM pet_ids WHERE pet_profile_id = ?` | `CREATE INDEX idx_pet_ids_pet_profile_id ON pet_ids(pet_profile_id)` |

**Run in Supabase SQL Editor:**

```sql
-- Run once — indexes are non-breaking, zero downtime
CREATE INDEX IF NOT EXISTS idx_pet_profiles_user_id ON pet_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_pet_profile_id ON medical_records(pet_profile_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_user_id ON medical_records(user_id);
CREATE INDEX IF NOT EXISTS idx_pet_ids_pet_profile_id ON pet_ids(pet_profile_id);
```

These are the most impactful single-line changes you can make to backend performance. Supabase (PostgreSQL) without indexes on FK columns does sequential scans even for small tables.

### 5.4 Return only needed columns (SELECT optimization)

Every fetch currently uses `SELECT *` which returns every column including fields not needed by the frontend. This increases response payload size and serialization time.

| Endpoint | Current | Optimized |
|----------|---------|-----------|
| `GET /pet-profile/by-user/{id}` | `select("*")` | `select("id, petolife_id, pet_name, pet_type, breed, gender, birth_date, weight, pet_photo_url, created_at")` |
| `GET /medical-records/{pet_id}` | `select("*")` | `select("id, title, file_name, file_url, file_type, file_size, category, is_favorite, created_at, pet_profile_id")` |
| `GET /user-profile/{id}` | `select("*")` | `select("id, full_name, phone, email, city, state, pincode, avatar_url")` |

**Eliminates unused fields like `storage_path`, `identification_marks`, raw timestamps from the wire.**

### 5.5 Enable HTTP response compression on the FastAPI server

Add gzip compression middleware so all JSON responses are compressed before they hit the network:

```python
# main.py — add above the CORS middleware
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=500)  # compress responses > 500 bytes
```

Medical records with 20+ items can be a several-KB JSON payload. Gzip typically reduces JSON payloads by 60–70%, directly cutting network transfer time.

### 5.6 Add HTTP cache headers to the public pet card endpoint

The `GET /api/pet-profile/public/{petolife_id}` endpoint serves public, read-only data that barely ever changes. It currently has no cache headers, so every QR code scan makes a full DB round trip.

```python
# pet_profile.py
from fastapi.responses import JSONResponse

@router.get("/public/{petolife_id:path}")
async def get_public_pet_data(petolife_id: str):
    # ... existing query logic ...
    return JSONResponse(
        content={**profile, "pet_ids": ids_result.data or [], "owner_info": owner_info},
        headers={
            "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
            # Cache for 5 minutes. CDN/browser serves directly without hitting FastAPI.
        }
    )
```

### 5.7 Use `select("id")` for ownership checks instead of `select("*")`

The ownership check in `_verify_pet_ownership` currently does `select("user_id")` which is already lean, but in `medical_records.py` toggle_favorite does `select("*")` to check ownership — fetching all columns just to read `user_id`:

```python
# medical_records.py — toggle_favorite and delete_record
# BEFORE
res = supabase.table("medical_records").select("*").eq("id", record_id).execute()

# AFTER — fetch only what's needed for the ownership check + the operation
res = supabase.table("medical_records").select("id, user_id, pet_profile_id, is_favorite, storage_path").eq("id", record_id).execute()
```

---

## 6. Frontend React & Component Performance

### 6.1 Memoize expensive pure computations

`normalizePet()` in [ProfileCard.jsx](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/src/components/Home/ProfileCard/ProfileCard.jsx#L10-L41) runs on every render, including those triggered by unrelated state changes. Since it's a pure function of the `pets` array:

```javascript
// ProfileCard.jsx — before
const normalizedPets = (pets || []).map(normalizePet).filter(Boolean);

// ProfileCard.jsx — after
const normalizedPets = useMemo(
  () => (pets || []).map(normalizePet).filter(Boolean),
  [pets]
);
```

### 6.2 Remove the duplicate click-outside useEffect

Both [ProfileCard.jsx](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/src/components/Home/ProfileCard/ProfileCard.jsx#L77) and [PetDashboard.jsx](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/src/components/Home/PetDashboard.jsx#L35) each attach a `mousedown` listener to `document` for the same pet dropdown. This means **two** event listeners fire on every click anywhere in the app.

Since `PetDashboard` controls the `showPetDropdown` state and passes it down to `ProfileCard`, only `PetDashboard` needs the outside-click listener. Remove the one in `ProfileCard`.

### 6.3 Fix CSS scroll performance

Currently, `.main-layout-container` and each tab wrapper uses `height: 100vh; overflow-y: auto`. On mobile WebKit, overflowed containers inside non-body elements scroll choppily without GPU acceleration.

Add this to the scrollable containers in [MainLayout.css](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/src/components/MainLayout/MainLayout.css):

```css
/* MainLayout.css — or whichever div wraps the scrollable content */
.tab-content-wrapper {
  -webkit-overflow-scrolling: touch; /* smooth momentum scrolling on iOS */
  overflow-y: auto;
  height: 100%;
  will-change: scroll-position;  /* hint to browser to GPU-composite this layer */
}
```

And in [MedicalRecords.css](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/src/components/medical/MedicalRecords.css):

```css
.category-scroll {
  -webkit-overflow-scrolling: touch; /* horizontal scroll of category chips */
  scroll-snap-type: x mandatory;    /* snappy category chip scrolling */
}
```

### 6.4 Avoid object creation inside JSX render

In [EditablePetCard.jsx](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/src/components/UserProfile/EditablePetCard.jsx), every render creates 15+ new inline style objects:

```jsx
// Every render creates new objects — React has to compare all of them
<div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
<label style={{ cursor: 'pointer', background: '#138a36', color: 'white', ... }}>
```

Move these to the CSS file. Even if the styling stays the same, removing inline objects reduces React's reconciler work.

### 6.5 Use `key` correctly to avoid unnecessary unmounts

In [MedicalRecords.jsx](file:///c:/Users/Irfan%20IR/Documents/IR%20Projects/PetOLife/Module1_petprofile/MVP_V2/src/components/medical/MedicalRecords.jsx#L366-L396), records list uses `key={record.id || index}`. The `|| index` fallback is dangerous — if `record.id` is undefined, React uses index keys, causing incorrect reconciliation and visual glitches when records are deleted or reordered.

```jsx
// Ensure record.id is always used — it comes from Supabase UUID, so it's always defined
{currentRecords.map((record) => (
  <div key={record.id} className="record-card" onClick={() => setViewFile(record)}>
```

---

## 7. Implementation Priority Order

Execute in this sequence for maximum visible impact with minimum risk:

| Priority | Change | Impact | Effort | Risk |
|----------|--------|--------|--------|------|
| **P0** | Build `appCache.js` + use in MainLayout | Eliminates pet list reload on every tab switch | 2 hrs | Low |
| **P0** | Fix NoRecordsCard to use cache (not raw fetch) | Eliminates duplicate API call | 30 min | Low |
| **P0** | Add DB indexes (Supabase SQL Editor) | Faster queries for every user session | 5 min | Zero |
| **P1** | Prefetch records + profile after pets load | Records tab opens instantly | 1 hr | Low |
| **P1** | Keep-alive tabs via display:none | Eliminates all tab-switch re-mounts | 1 hr | Low-Medium |
| **P1** | Add `GZipMiddleware` to FastAPI | Smaller payloads on every request | 10 min | Zero |
| **P1** | Eliminate double DB roundtrip in ownership checks | Faster all mutation endpoints | 2 hrs | Low |
| **P2** | Optimistic favorite toggle | Instant heart feedback | 1 hr | Low |
| **P2** | `React.memo` + `useCallback` on static widgets | Fewer re-renders | 2 hrs | Low |
| **P2** | Lazy-load tab components inside MainLayout | Faster initial load | 1 hr | Low |
| **P2** | Replace `alert()` with inline toast | Better UX, no thread blocking | 2 hrs | Low |
| **P3** | Column-selective `SELECT` in backend | Smaller DB responses | 1 hr | Low |
| **P3** | CSS scroll fixes (`-webkit-overflow-scrolling`) | Smoother scroll on mobile | 30 min | Zero |
| **P3** | Bundle prefetch on BottomNav hover | Near-instant tab bundle load | 30 min | Low |
| **P3** | Cache headers on public pet endpoint | Faster QR card loads | 30 min | Zero |

---

## 8. Should You Consider TanStack Query?

After implementing Sections 2–7 above, you will have solved the root cause of every performance issue identified in this app — through patterns that are native to React and require zero new dependencies.

However, TanStack Query is worth considering **if any of the following are true at that point**:

1. **The manual cache logic in `appCache.js` grows complex** — multiple developers start writing inconsistent invalidation patterns, cache keys drift, and bugs appear from stale data being shown.

2. **The app gains real-time needs** — if you add Supabase Realtime subscriptions (live pet health data, vet-side updates), TanStack Query's background refetch and subscription integration become genuinely useful.

3. **You add pagination or infinite scroll** — the Medical Records list grows to 50+ items and you need cursor-based pagination. TanStack Query has `useInfiniteQuery` built in.

4. **Multiple users or vet-side views are added** — when the same data is needed across many more components simultaneously, the shared query cache scales better than a manual module store.

If none of the above apply to your current MVP scope, the manual approach in this document is sufficient, simpler to understand, and easier to debug — which matters most for a small team moving fast.

> TanStack Query is not magic — it implements the exact same patterns described in Sections 2–4 of this document, but with a well-tested, team-maintained API surface. The underlying logic is identical.
