# -*- coding: utf-8 -*-
"""
PetOLife Backend - Automated Integration Test Suite
=====================================================
Tests all API endpoints against a running backend instance.

Usage:
    1. Ensure backend is running: cd backend && uvicorn app.main:app --reload
    2. Set ENVIRONMENT=development in .env (for /docs access)
    3. Run: python test_backend.py

The script will:
  - Test public endpoints (health, location, public pet data)
  - Create a test user via signup → login → get JWT token
  - Test all authenticated CRUD operations
  - Test V2 timeline endpoints
  - Test V2 unified records endpoints (raw log=0 and timeline-linked log=1)
  - Clean up test data at the end
  - Print a PASS/FAIL summary

Requires: pip install httpx
"""

import asyncio
import sys
import time
import json
import traceback
from datetime import date, timedelta

import os
os.environ.setdefault("PYTHONIOENCODING", "utf-8")

try:
    import httpx
except ImportError:
    print("ERROR: httpx is required. Run: pip install httpx")
    sys.exit(1)

# ==============================================================================
# CONFIG
# ==============================================================================
BASE_URL = "http://localhost:8000"
TEST_EMAIL = f"petolife_test_{int(time.time())}@test.com"
TEST_PASSWORD = "TestPass123!"
TIMEOUT = 15.0

# ==============================================================================
# TEST RESULTS TRACKER
# ==============================================================================
results = []

def record(name: str, passed: bool, detail: str = "", resp=None):
    status = "[PASS]" if passed else "[FAIL]"
    
    if not passed and resp and hasattr(resp, 'status_code') and resp.status_code != 200:
        detail = f"status={resp.status_code} body={resp.text[:500]} {detail}"
        
    results.append({"name": name, "passed": passed, "detail": detail})
    print(f"  {status} | {name}" + (f" -- {detail}" if detail and not passed else ""))


# ==============================================================================
# HELPER
# ==============================================================================
async def safe_request(client: httpx.AsyncClient, method: str, url: str, **kwargs):
    """Make a request and return (response, error_string)."""  # noqa
    try:
        kwargs.setdefault("follow_redirects", True)
        resp = await client.request(method, url, timeout=TIMEOUT, **kwargs)
        if resp.status_code >= 400:
            print(f"[ERROR] {method} {url} returned {resp.status_code}: {resp.text[:500]}")
        return resp, None
    except Exception as e:
        err_msg = str(e) or repr(e) or f"Exception of type {type(e).__name__}"
        return None, err_msg


# ==============================================================================
# TEST GROUPS
# ==============================================================================

async def test_01_health_check(client: httpx.AsyncClient):
    """Test root health endpoint."""
    print("\n-- 1. Health Check --")
    resp, err = await safe_request(client, "GET", f"{BASE_URL}/")
    if err:
        record("GET /", False, err)
        return
    record("GET / -- status 200", resp.status_code == 200)
    data = resp.json()
    record("GET / -- returns status field", "status" in data)
    record("GET / -- version is 2.0.0", data.get("version") == "2.0.0")


async def test_02_swagger_docs(client: httpx.AsyncClient):
    """Test that Swagger UI is accessible (requires ENVIRONMENT=development)."""
    print("\n-- 2. Swagger UI --")
    resp, err = await safe_request(client, "GET", f"{BASE_URL}/docs")
    if err:
        record("GET /docs accessible", False, err)
        return
    record("GET /docs accessible", resp.status_code == 200, 
           f"status={resp.status_code}" if resp.status_code != 200 else "")
    
    resp2, _ = await safe_request(client, "GET", f"{BASE_URL}/openapi.json")
    if resp2:
        record("GET /openapi.json accessible", resp2.status_code == 200)
    else:
        record("GET /openapi.json accessible", False, "Request failed")


async def test_03_auth_flow(client: httpx.AsyncClient) -> dict:
    """Test signup, login, and /me endpoints. Returns auth context."""
    print("\n-- 3. Auth Flow --")
    ctx = {"token": None, "user_id": None}

    # 3a. Signup
    resp, err = await safe_request(client, "POST", f"{BASE_URL}/api/auth/signup", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "full_name": "Test User PetOLife",
        "city": "Coimbatore",
    })
    if err:
        record("POST /api/auth/signup", False, err)
        return ctx
    
    if resp and resp.status_code == 200:
        data = resp.json()
        record("POST /api/auth/signup -- 200", True)
        record("Signup returns user ID", bool(data.get("user", {}).get("id")))
    elif resp and resp.status_code == 400 and "already registered" in resp.text.lower():
        record("POST /api/auth/signup -- user exists (expected on re-run)", True)
    else:
        record("POST /api/auth/signup", False, f"status={resp.status_code if resp else 'none'} body={resp.text[:200] if resp else err}")

    # 3b. Login
    resp, err = await safe_request(client, "POST", f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
    })
    if err:
        record("POST /api/auth/login", False, err)
        return ctx
    
    if resp and resp.status_code == 200:
        data = resp.json()
        ctx["token"] = data.get("access_token")
        ctx["user_id"] = data.get("user", {}).get("id")
        record("POST /api/auth/login -- 200", True)
        record("Login returns access_token", bool(ctx["token"]))
        record("Login returns user.id", bool(ctx["user_id"]))
    else:
        record("POST /api/auth/login", False, f"status={resp.status_code if resp else 'none'} body={resp.text[:200] if resp else err}")
        return ctx

    # 3c. Get current user (/me)
    headers = {"Authorization": f"Bearer {ctx['token']}"}
    resp, err = await safe_request(client, "GET", f"{BASE_URL}/api/auth/me", headers=headers)
    if err:
        record("GET /api/auth/me", False, err)
    elif resp and resp.status_code == 200:
        record("GET /api/auth/me -- 200", True)
        record("/me returns email", resp.json().get("email") == TEST_EMAIL)
    else:
        record("GET /api/auth/me", False, f"status={resp.status_code if resp else 'none'} {resp.text[:200] if resp else err}")

    # 3d. Test 401 without token
    resp, _ = await safe_request(client, "GET", f"{BASE_URL}/api/auth/me")
    record("GET /me without token → 401", resp and resp.status_code == 401)

    return ctx


async def test_04_user_profile(client: httpx.AsyncClient, ctx: dict):
    """Test user profile CRUD."""
    print("\n-- 4. User Profile --")
    if not ctx["token"]:
        record("User Profile tests", False, "No auth token available")
        return

    headers = {"Authorization": f"Bearer {ctx['token']}"}
    uid = ctx["user_id"]

    # 4a. Get profile
    resp, err = await safe_request(client, "GET", f"{BASE_URL}/api/user-profile/{uid}", headers=headers)
    if err:
        record("GET /api/user-profile/{uid}", False, err)
        return
    record("GET /api/user-profile -- 200", resp.status_code == 200)

    # 4b. Update profile
    resp, err = await safe_request(client, "PUT", f"{BASE_URL}/api/user-profile/{uid}", 
                                    headers=headers,
                                    json={"full_name": "Test User Updated", "city": "Chennai"})
    if resp:
        record("PUT /api/user-profile -- 200", resp.status_code == 200,
               f"status={resp.status_code}" if resp.status_code != 200 else "")
    else:
        record("PUT /api/user-profile", False, err)

    # 4c. Ownership enforcement -- try to read another user's profile
    resp, _ = await safe_request(client, "GET", 
                                  f"{BASE_URL}/api/user-profile/00000000-0000-0000-0000-000000000000",
                                  headers=headers)
    record("Ownership: GET other user → 403", resp and resp.status_code == 403)


async def test_05_pet_profile(client: httpx.AsyncClient, ctx: dict) -> dict:
    """Test pet profile CRUD. Returns pet context."""
    print("\n-- 5. Pet Profile --")
    pet_ctx = {"pet_id": None, "petolife_id": None}
    if not ctx["token"]:
        record("Pet Profile tests", False, "No auth token available")
        return pet_ctx

    headers = {"Authorization": f"Bearer {ctx['token']}"}

    # 5a. Create pet (multipart form)
    resp, err = await safe_request(client, "POST", f"{BASE_URL}/api/pet-profile",
                                    headers=headers,
                                    data={
                                        "pet_type": "dog",
                                        "pet_name": "TestBuddy",
                                        "city": "Coimbatore",
                                        "breed": "Labrador",
                                        "gender": "male",
                                        "approx_age": "2 Years",
                                    })
    if err:
        record("POST /api/pet-profile (create)", False, err)
        return pet_ctx
    if resp.status_code == 200:
        data = resp.json()
        pet_ctx["pet_id"] = data.get("pet_profile_id")
        pet_ctx["petolife_id"] = data.get("petolife_id")
        record("POST /api/pet-profile -- 200", True)
        record("Pet has petolife_id", bool(pet_ctx["petolife_id"]))
        record("PetOLife ID format PET-XXX-XXX-XXXXXX", 
               bool(pet_ctx["petolife_id"] and pet_ctx["petolife_id"].startswith("PET-")))
    else:
        record("POST /api/pet-profile", False, f"status={resp.status_code} body={resp.text[:300]}")
        return pet_ctx

    # 5b. List pets
    resp, _ = await safe_request(client, "GET", f"{BASE_URL}/api/pet-profile", headers=headers)
    if resp and resp.status_code == 200:
        pets = resp.json()
        record("GET /api/pet-profile -- returns list", isinstance(pets, list) and len(pets) > 0)
        if pets:
            record("Pet has 'age' field (enrichment)", "age" in pets[0])
            record("Pet has 'owner_name' (enrichment)", "owner_name" in pets[0])
    else:
        record("GET /api/pet-profile", False, "Failed")

    # 5c. Get single pet
    resp, _ = await safe_request(client, "GET", f"{BASE_URL}/api/pet-profile/{pet_ctx['pet_id']}", 
                                  headers=headers)
    record("GET /api/pet-profile/{id} -- 200", resp and resp.status_code == 200)

    # 5d. Update pet
    resp, _ = await safe_request(client, "PATCH", f"{BASE_URL}/api/pet-profile/{pet_ctx['pet_id']}",
                                  headers=headers, json={"breed": "Golden Retriever"})
    record("PATCH /api/pet-profile/{id} -- 200", resp and resp.status_code == 200)

    # 5e. Public pet data (no auth)
    if pet_ctx["petolife_id"]:
        resp, _ = await safe_request(client, "GET", 
                                      f"{BASE_URL}/api/pet-profile/public/{pet_ctx['petolife_id']}")
        record("GET /api/pet-profile/public/{id} -- 200 (no auth)", resp and resp.status_code == 200)

    return pet_ctx


async def test_06_pet_health_id(client: httpx.AsyncClient, ctx: dict, pet_ctx: dict):
    """Test health ID generation."""
    print("\n-- 6. Pet Health ID --")
    
    # 6a. Preview (public)
    resp, _ = await safe_request(client, "GET", f"{BASE_URL}/api/pet-health-id/preview/Chennai/cat")
    if resp and resp.status_code == 200:
        data = resp.json()
        record("GET /preview -- 200", True)
        record("Preview ID starts with PET-", data.get("preview", "").startswith("PET-"))
    else:
        record("GET /preview", False, f"status={resp.status_code if resp else 'no response'}")

    # 6b. Generate (authenticated)
    if ctx["token"] and pet_ctx["pet_id"]:
        headers = {"Authorization": f"Bearer {ctx['token']}"}
        resp, _ = await safe_request(client, "POST", f"{BASE_URL}/api/pet-health-id/generate",
                                      headers=headers, json={
                                          "city": "Bangalore",
                                          "pet_type": "dog",
                                          "pet_profile_id": pet_ctx["pet_id"],
                                      })
        record("POST /generate -- 200", resp and resp.status_code == 200)


async def test_07_location(client: httpx.AsyncClient):
    """Test location/pincode lookup."""
    print("\n-- 7. Location --")
    
    # 7a. POST lookup -- common pincode
    resp, _ = await safe_request(client, "POST", f"{BASE_URL}/api/location/lookup", 
                                  json={"pincode": "641001"})
    if resp and resp.status_code == 200:
        data = resp.json()
        record("POST /lookup 641001 -- 200", True)
        record("Returns Coimbatore", data.get("city") == "Coimbatore")
    else:
        record("POST /lookup", False)

    # 7b. GET pincode -- same
    resp, _ = await safe_request(client, "GET", f"{BASE_URL}/api/location/pincode/560001")
    record("GET /pincode/560001 -- 200", resp and resp.status_code == 200)

    # 7c. Invalid pincode
    resp, _ = await safe_request(client, "POST", f"{BASE_URL}/api/location/lookup", 
                                  json={"pincode": "123"})
    record("POST /lookup invalid → 400", resp and resp.status_code == 400)


async def test_08_checklist(client: httpx.AsyncClient, ctx: dict, pet_ctx: dict):
    """Test checklist endpoints."""
    print("\n-- 8. Checklist --")
    if not ctx["token"] or not pet_ctx["pet_id"]:
        record("Checklist tests", False, "Missing auth or pet")
        return

    headers = {"Authorization": f"Bearer {ctx['token']}"}
    today = date.today().isoformat()

    # 8a. Get checklist
    resp, _ = await safe_request(client, "GET", 
                                  f"{BASE_URL}/api/checklist/{pet_ctx['pet_id']}?date={today}",
                                  headers=headers)
    record("GET /checklist/{pet_id} -- 200", resp and resp.status_code == 200)

    # 8b. Post checklist update
    resp, _ = await safe_request(client, "POST", f"{BASE_URL}/api/checklist/{pet_ctx['pet_id']}",
                                  headers=headers, json={
                                      "task_id": 1,
                                      "task_title": "Morning Walk",
                                      "completed": True,
                                      "date": today,
                                  })
    record("POST /checklist/{pet_id} -- 200", resp and resp.status_code == 200)


async def test_09_v2_raw_records(client: httpx.AsyncClient, ctx: dict, pet_ctx: dict) -> dict:
    """
    Test the new unified V2 records endpoint — raw upload path (log=0).
    Replaces the old test_09_medical_records which used /api/medical-records/*.
    """
    print("\n-- 9. V2 Records — Raw Upload (log=0) --")
    rec_ctx = {"record_id": None}

    if not ctx["token"] or not pet_ctx["pet_id"]:
        record("V2 Raw Records tests", False, "Missing auth or pet")
        return rec_ctx

    headers = {"Authorization": f"Bearer {ctx['token']}"}
    pid = pet_ctx["pet_id"]

    # 9a. Upload a raw record (log=0)
    files = {"file": ("test_report.txt", b"This is a test lab report content", "text/plain")}
    data = {
        "title": "Blood Test June 2026",
        "category": "Lab Reports",
        "notes": "Fasted sample, taken at 7am",
    }
    resp, err = await safe_request(
        client, "POST", f"{BASE_URL}/api/v2/pets/{pid}/records",
        headers=headers, data=data, files=files
    )
    if resp and resp.status_code == 201:
        body = resp.json()
        rec = body.get("record", {})
        rec_ctx["record_id"] = rec.get("id")
        record("POST /api/v2/pets/{pid}/records -- 201", True)
        record("Raw record returns id", bool(rec_ctx["record_id"]))
        record("Raw record log=0", rec.get("log") == 0)
        record("Raw record event_id is null", rec.get("event_id") is None)
        record("Raw record title saved", rec.get("title") == "Blood Test June 2026")
        record("Raw record notes saved", rec.get("notes") == "Fasted sample, taken at 7am")
        record("Raw record has file_url", bool(rec.get("file_url")))
        record("Raw record has storage_path", bool(rec.get("storage_path")))
    else:
        record("POST /api/v2/pets/{pid}/records", False,
               f"status={resp.status_code if resp else 'none'} {resp.text[:300] if resp else err}")
        return rec_ctx

    # 9b. List all records for pet (no filter)
    resp, _ = await safe_request(client, "GET", f"{BASE_URL}/api/v2/pets/{pid}/records",
                                  headers=headers)
    if resp and resp.status_code == 200:
        rows = resp.json()
        record("GET /records (no filter) -- 200", True)
        record("Records list is non-empty", isinstance(rows, list) and len(rows) > 0)
    else:
        record("GET /records (no filter)", False)

    # 9c. List filtered by log=0
    resp, _ = await safe_request(client, "GET", f"{BASE_URL}/api/v2/pets/{pid}/records?log=0",
                                  headers=headers)
    if resp and resp.status_code == 200:
        rows = resp.json()
        record("GET /records?log=0 -- 200", True)
        record("All returned records have log=0", all(r.get("log") == 0 for r in rows))
    else:
        record("GET /records?log=0", False)

    # 9d. Get single record (fresh presigned URL)
    if rec_ctx["record_id"]:
        resp, _ = await safe_request(
            client, "GET",
            f"{BASE_URL}/api/v2/pets/{pid}/records/{rec_ctx['record_id']}",
            headers=headers
        )
        if resp and resp.status_code == 200:
            r = resp.json()
            record("GET /records/{id} -- 200", True)
            record("Single record has fresh file_url", bool(r.get("file_url")))
        else:
            record("GET /records/{id}", False)

    # 9e. Toggle favorite
    if rec_ctx["record_id"]:
        resp, _ = await safe_request(
            client, "PATCH",
            f"{BASE_URL}/api/v2/pets/{pid}/records/{rec_ctx['record_id']}/favorite",
            headers=headers
        )
        if resp and resp.status_code == 200:
            body = resp.json()
            record("PATCH /records/{id}/favorite -- 200", True)
            record("Favorite toggled to True", body.get("is_favorite") is True)
        else:
            record("PATCH /records/{id}/favorite", False)

    # 9f. Verify old /api/medical-records/* is GONE (404 or 405)
    resp, _ = await safe_request(
        client, "POST", f"{BASE_URL}/api/medical-records/upload",
        headers=headers,
        data={"pet_profile_id": pid, "title": "Old", "category": "Other"},
        files={"file": ("x.txt", b"x", "text/plain")}
    )
    record(
        "Old endpoint POST /api/medical-records/upload is removed (404/405)",
        resp is None or resp.status_code in (404, 405, 422)
    )

    return rec_ctx


async def test_09b_v2_event_records(
    client: httpx.AsyncClient, ctx: dict, pet_ctx: dict, event_ctx: dict
) -> dict:
    """
    Test the new V2 records endpoint — timeline-linked upload path (log=1).
    Verifies that the record ID is stored in medical_events.document_ids.
    """
    print("\n-- 9b. V2 Records — Timeline-Linked Upload (log=1) --")
    linked_rec_ctx = {"record_id": None}

    if not ctx["token"] or not pet_ctx["pet_id"] or not event_ctx.get("event_id"):
        record("V2 Event Records tests", False, "Missing auth, pet, or event_id — run after test_11")
        return linked_rec_ctx

    headers = {"Authorization": f"Bearer {ctx['token']}"}
    pid = pet_ctx["pet_id"]
    eid = event_ctx["event_id"]

    # 9b-a. Upload a timeline-linked record (log=1)
    files = {"file": ("prescription.txt", b"Amoxicillin 250mg twice daily", "text/plain")}
    data = {
        "label": "Vet Prescription / Report",
        "category": "Prescription",
    }
    resp, err = await safe_request(
        client, "POST",
        f"{BASE_URL}/api/v2/pets/{pid}/medical-events/{eid}/records",
        headers=headers, data=data, files=files
    )
    if resp and resp.status_code == 201:
        body = resp.json()
        rec = body.get("record", {})
        linked_rec_ctx["record_id"] = rec.get("id")
        record("POST /medical-events/{eid}/records -- 201", True)
        record("Linked record returns id", bool(linked_rec_ctx["record_id"]))
        record("Linked record log=1", rec.get("log") == 1)
        record("Linked record event_id matches", rec.get("event_id") == eid)
        record("Linked record label saved", rec.get("label") == "Vet Prescription / Report")
        record("Linked record has file_url", bool(rec.get("file_url")))
        record("Linked record has storage_path", bool(rec.get("storage_path")))
    else:
        record("POST /medical-events/{eid}/records", False,
               f"status={resp.status_code if resp else 'none'} {resp.text[:300] if resp else err}")
        return linked_rec_ctx

    # 9b-b. Verify document_ids was updated on the event
    if linked_rec_ctx["record_id"]:
        resp, _ = await safe_request(
            client, "GET",
            f"{BASE_URL}/api/v2/pets/{pid}/medical-events/{eid}",
            headers=headers
        )
        if resp and resp.status_code == 200:
            ev = resp.json()
            doc_ids = ev.get("document_ids", [])
            record("Event document_ids updated", linked_rec_ctx["record_id"] in doc_ids)
        else:
            record("Verify event document_ids — GET event", False)

    # 9b-c. List records filtered by log=1 for this event
    resp, _ = await safe_request(
        client, "GET",
        f"{BASE_URL}/api/v2/pets/{pid}/records?log=1&event_id={eid}",
        headers=headers
    )
    if resp and resp.status_code == 200:
        rows = resp.json()
        record("GET /records?log=1&event_id -- 200", True)
        record("All returned records have log=1", all(r.get("log") == 1 for r in rows))
        record("Linked record appears in filtered list",
               any(r.get("id") == linked_rec_ctx["record_id"] for r in rows))
    else:
        record("GET /records?log=1&event_id", False)

    # 9b-d. Verify old /api/v2/pets/{pid}/documents is GONE
    resp, _ = await safe_request(
        client, "GET",
        f"{BASE_URL}/api/v2/pets/{pid}/documents",
        headers=headers
    )
    record(
        "Old endpoint GET /api/v2/pets/{pid}/documents is removed (404/405)",
        resp is None or resp.status_code in (404, 405)
    )

    return linked_rec_ctx


async def test_10_v2_reference_data(client: httpx.AsyncClient, ctx: dict):
    """Test V2 reference data endpoints."""
    print("\n-- 10. V2 Reference Data --")
    if not ctx["token"]:
        record("V2 Reference Data tests", False, "Missing auth")
        return

    headers = {"Authorization": f"Bearer {ctx['token']}"}

    for endpoint, name in [
        ("/api/v2/reference/medicines", "medicines"),
        ("/api/v2/reference/vaccines", "vaccines"),
        ("/api/v2/reference/shampoos", "shampoos"),
        ("/api/v2/reference/clinics", "clinics"),
        ("/api/v2/reference/diagnoses", "diagnoses"),
        ("/api/v2/reference/injection-sites", "injection-sites"),
    ]:
        resp, err = await safe_request(client, "GET", f"{BASE_URL}{endpoint}", headers=headers)
        record(f"GET {endpoint} -- 200", resp and resp.status_code == 200,
               f"status={resp.status_code}" if resp and resp.status_code != 200 else (err or ""))


async def test_11_v2_medical_events(client: httpx.AsyncClient, ctx: dict, pet_ctx: dict) -> dict:
    """Test V2 medical event CRUD."""
    print("\n-- 11. V2 Medical Events --")
    event_ctx = {"event_id": None}
    if not ctx["token"] or not pet_ctx["pet_id"]:
        record("V2 Medical Events tests", False, "Missing auth or pet")
        return event_ctx

    headers = {"Authorization": f"Bearer {ctx['token']}"}
    pid = pet_ctx["pet_id"]

    # 11a. Create event
    event_payload = {
        "event_date": date.today().isoformat(),
        "clinic_name": "Test Vet Clinic",
        "vet_name": "Dr. Test",
        "visit_type": ["checkup"],
        "reason_for_visit": "Routine checkup",
        "overall_notes": "All good",
        "follow_up_date": (date.today() + timedelta(days=30)).isoformat(),
        "follow_up_notes": "Re-check weight",
        "category_entries": [
            {
                "category": "vaccination",
                "item_name": "Rabies",
                "date_logged": date.today().isoformat(),
                "status": "completed",
                "notes": "Annual vaccine",
                "category_fields": {
                    "vaccine_details": {
                        "vaccine_name": "Rabies",
                        "batch_number": "RB-2026-001",
                        "site": "Left thigh",
                    }
                },
            }
        ],
        "force": True,
    }
    resp, err = await safe_request(client, "POST", f"{BASE_URL}/api/v2/pets/{pid}/medical-events",
                                    headers=headers, json=event_payload)
    if resp and resp.status_code == 201:
        data = resp.json()
        event_ctx["event_id"] = data.get("event", {}).get("id")
        record("POST medical-events -- 201", True)
        record("Event has auto-generated reminders", bool(data.get("reminders")))
        # Verify new document_ids field is present and starts as []
        ev = data.get("event", {})
        record("Event has document_ids field", "document_ids" in ev)
        record("Event document_ids starts empty", ev.get("document_ids") == [])
    else:
        record("POST medical-events", False, 
               f"status={resp.status_code if resp else 'none'} body={resp.text[:300] if resp else err}")
        return event_ctx

    # 11b. List events
    resp, _ = await safe_request(client, "GET", f"{BASE_URL}/api/v2/pets/{pid}/medical-events",
                                  headers=headers)
    record("GET medical-events -- 200", resp and resp.status_code == 200)
    if resp and resp.status_code == 200:
        events = resp.json().get("events", [])
        record("Events list is non-empty", len(events) > 0)

    # 11c. Get single event
    if event_ctx["event_id"]:
        resp, _ = await safe_request(client, "GET", 
                                      f"{BASE_URL}/api/v2/pets/{pid}/medical-events/{event_ctx['event_id']}",
                                      headers=headers)
        record("GET single event -- 200", resp and resp.status_code == 200)

    # 11d. Update event
    if event_ctx["event_id"]:
        resp, _ = await safe_request(client, "PUT", 
                                      f"{BASE_URL}/api/v2/pets/{pid}/medical-events/{event_ctx['event_id']}",
                                      headers=headers, json={"overall_notes": "Updated test notes"})
        record("PUT update event -- 200", resp and resp.status_code == 200)

    return event_ctx


async def test_12_v2_reminders(client: httpx.AsyncClient, ctx: dict, pet_ctx: dict):
    """Test V2 reminder CRUD."""
    print("\n-- 12. V2 Reminders --")
    if not ctx["token"] or not pet_ctx["pet_id"]:
        record("V2 Reminders tests", False, "Missing auth or pet")
        return

    headers = {"Authorization": f"Bearer {ctx['token']}"}
    pid = pet_ctx["pet_id"]
    reminder_id = None

    # 12a. List reminders (should include auto-generated from event test)
    resp, _ = await safe_request(client, "GET", f"{BASE_URL}/api/v2/pets/{pid}/reminders",
                                  headers=headers)
    record("GET reminders -- 200", resp and resp.status_code == 200)

    # 12b. Create manual reminder
    resp, err = await safe_request(client, "POST", f"{BASE_URL}/api/v2/pets/{pid}/reminders",
                                    headers=headers, json={
                                        "title": "Deworming Due",
                                        "type": "deworming",
                                        "due_date": (date.today() + timedelta(days=7)).isoformat(),
                                        "priority": "medium",
                                        "repeat_type": "none",
                                    })
    if resp and resp.status_code == 201:
        reminder_id = resp.json().get("id")
        record("POST create reminder -- 201", True)
    else:
        record("POST create reminder", False, 
               f"status={resp.status_code if resp else 'none'} {resp.text[:200] if resp else err}")

    # 12c. Complete reminder
    if reminder_id:
        resp, _ = await safe_request(client, "PUT", 
                                      f"{BASE_URL}/api/v2/pets/{pid}/reminders/{reminder_id}/complete",
                                      headers=headers)
        record("PUT complete reminder -- 200", resp and resp.status_code == 200)

    # 12d. Delete reminder
    if reminder_id:
        resp, _ = await safe_request(client, "DELETE", 
                                      f"{BASE_URL}/api/v2/pets/{pid}/reminders/{reminder_id}",
                                      headers=headers)
        record("DELETE reminder -- 200", resp and resp.status_code == 200)


async def test_13_v2_timeline(client: httpx.AsyncClient, ctx: dict, pet_ctx: dict):
    """Test V2 timeline views."""
    print("\n-- 13. V2 Timeline --")
    if not ctx["token"] or not pet_ctx["pet_id"]:
        record("V2 Timeline tests", False, "Missing auth or pet")
        return

    headers = {"Authorization": f"Bearer {ctx['token']}"}
    pid = pet_ctx["pet_id"]

    # 13a. Category view
    resp, _ = await safe_request(client, "GET", f"{BASE_URL}/api/v2/pets/{pid}/timeline?view=category",
                                  headers=headers)
    if resp and resp.status_code == 200:
        data = resp.json()
        record("GET timeline (category) -- 200", True)
        record("Timeline has 'buckets' key", "buckets" in data)
    else:
        record("GET timeline (category)", False)

    # 13b. Chronological view
    resp, _ = await safe_request(client, "GET", 
                                  f"{BASE_URL}/api/v2/pets/{pid}/timeline?view=chronological",
                                  headers=headers)
    if resp and resp.status_code == 200:
        data = resp.json()
        record("GET timeline (chronological) -- 200", True)
        record("Timeline has 'events' key", "events" in data)
    else:
        record("GET timeline (chronological)", False)


async def test_14_v2_export(client: httpx.AsyncClient, ctx: dict, pet_ctx: dict):
    """Test V2 export endpoints."""
    print("\n-- 14. V2 Export --")
    if not ctx["token"] or not pet_ctx["pet_id"]:
        record("V2 Export tests", False, "Missing auth or pet")
        return

    headers = {"Authorization": f"Bearer {ctx['token']}"}
    pid = pet_ctx["pet_id"]

    # 14a. CSV export
    resp, _ = await safe_request(client, "GET", f"{BASE_URL}/api/v2/pets/{pid}/export/csv",
                                  headers=headers)
    record("GET export/csv -- 200", resp and resp.status_code == 200)
    if resp and resp.status_code == 200:
        record("CSV has Content-Disposition header", 
               "content-disposition" in resp.headers)

    # 14b. PDF export
    resp, _ = await safe_request(client, "GET", f"{BASE_URL}/api/v2/pets/{pid}/export/pdf",
                                  headers=headers)
    record("GET export/pdf -- 200", resp and resp.status_code == 200)


async def test_15_auth_security(client: httpx.AsyncClient, ctx: dict, pet_ctx: dict):
    """Test security: unauthorized access, IDOR, removed old endpoints."""
    print("\n-- 15. Security & Removed Endpoints --")
    
    # 15a. No token → 401 on protected endpoints
    for endpoint in [
        "/api/pet-profile",
        "/api/user-profile/test-id",
        "/api/checklist/test-id?date=2026-01-01",
    ]:
        resp, _ = await safe_request(client, "GET", f"{BASE_URL}{endpoint}")
        record(f"No auth: GET {endpoint} → 401", resp and resp.status_code == 401)

    # 15b. IDOR: try to access another user's pet (fake UUID)
    if ctx["token"]:
        headers = {"Authorization": f"Bearer {ctx['token']}"}
        fake_pet_id = "00000000-0000-0000-0000-000000000000"
        resp, _ = await safe_request(client, "GET", 
                                      f"{BASE_URL}/api/pet-profile/{fake_pet_id}",
                                      headers=headers)
        record("IDOR: GET fake pet → 403 or 404", resp and resp.status_code in (403, 404))

        # V2 IDOR
        resp, _ = await safe_request(client, "GET", 
                                      f"{BASE_URL}/api/v2/pets/{fake_pet_id}/medical-events",
                                      headers=headers)
        record("IDOR: V2 events fake pet → 404", resp and resp.status_code == 404)

        # 15c. Confirm all retired endpoints return 404 / 405
        retired = [
            ("GET",    f"/api/medical-records/{pet_ctx.get('pet_id', 'x')}"),
            ("DELETE", f"/api/medical-records/00000000-0000-0000-0000-000000000001"),
            ("PATCH",  f"/api/medical-records/00000000-0000-0000-0000-000000000001/favorite"),
            ("GET",    f"/api/v2/pets/{pet_ctx.get('pet_id', 'x')}/documents"),
        ]
        for method, path in retired:
            resp, _ = await safe_request(client, method, f"{BASE_URL}{path}", headers=headers)
            record(
                f"Retired {method} {path} → 404/405",
                resp is None or resp.status_code in (404, 405)
            )

        # 15d. New records endpoint requires auth
        resp, _ = await safe_request(
            client, "GET",
            f"{BASE_URL}/api/v2/pets/{pet_ctx.get('pet_id', 'x')}/records"
        )
        record("No auth: GET /v2/pets/{pid}/records → 401", resp and resp.status_code == 401)


async def test_16_v2_records_delete(
    client: httpx.AsyncClient, ctx: dict, pet_ctx: dict,
    rec_ctx: dict, linked_rec_ctx: dict, event_ctx: dict
):
    """Test deletion of both record types and verify event document_ids cleanup."""
    print("\n-- 16. V2 Records — Delete & Cleanup Verification --")
    if not ctx["token"] or not pet_ctx["pet_id"]:
        record("V2 Records Delete tests", False, "Missing auth or pet")
        return

    headers = {"Authorization": f"Bearer {ctx['token']}"}
    pid = pet_ctx["pet_id"]

    # 16a. Delete the timeline-linked record and verify document_ids is cleaned
    if linked_rec_ctx.get("record_id") and event_ctx.get("event_id"):
        eid = event_ctx["event_id"]
        resp, _ = await safe_request(
            client, "DELETE",
            f"{BASE_URL}/api/v2/pets/{pid}/records/{linked_rec_ctx['record_id']}",
            headers=headers
        )
        record("DELETE linked record (log=1) -- 200", resp and resp.status_code == 200)

        # Verify document_ids was cleaned from the event
        resp, _ = await safe_request(
            client, "GET",
            f"{BASE_URL}/api/v2/pets/{pid}/medical-events/{eid}",
            headers=headers
        )
        if resp and resp.status_code == 200:
            ev = resp.json()
            doc_ids = ev.get("document_ids", [])
            record(
                "Event document_ids cleaned after record delete",
                linked_rec_ctx["record_id"] not in doc_ids
            )
        else:
            record("Verify event document_ids after delete — GET event", False)

    # 16b. Delete the raw record (log=0)
    if rec_ctx.get("record_id"):
        resp, _ = await safe_request(
            client, "DELETE",
            f"{BASE_URL}/api/v2/pets/{pid}/records/{rec_ctx['record_id']}",
            headers=headers
        )
        record("DELETE raw record (log=0) -- 200", resp and resp.status_code == 200)

        # Verify it's gone
        resp, _ = await safe_request(
            client, "GET",
            f"{BASE_URL}/api/v2/pets/{pid}/records/{rec_ctx['record_id']}",
            headers=headers
        )
        record("Deleted record returns 404", resp and resp.status_code == 404)


async def test_99_cleanup(
    client: httpx.AsyncClient, ctx: dict, pet_ctx: dict, event_ctx: dict
):
    """Clean up test data."""
    print("\n-- 99. Cleanup --")
    if not ctx["token"]:
        record("Cleanup", False, "No auth token")
        return

    headers = {"Authorization": f"Bearer {ctx['token']}"}

    # Delete test event
    if event_ctx.get("event_id") and pet_ctx.get("pet_id"):
        resp, _ = await safe_request(client, "DELETE", 
            f"{BASE_URL}/api/v2/pets/{pet_ctx['pet_id']}/medical-events/{event_ctx['event_id']}",
            headers=headers)
        record("Delete test event", resp and resp.status_code == 200)

    # Delete test pet
    if pet_ctx.get("pet_id"):
        resp, _ = await safe_request(client, "DELETE",
                                      f"{BASE_URL}/api/pet-profile/{pet_ctx['pet_id']}",
                                      headers=headers)
        record("Delete test pet", resp and resp.status_code == 200)

    print("  [INFO]  Note: Test user (auth.users row) cannot be deleted via API — clean up manually if needed.")


# ==============================================================================
# MAIN RUNNER
# ==============================================================================
async def main():
    print("=" * 70)
    print("  PetOLife Backend -- Automated Integration Test Suite")
    print(f"  Target: {BASE_URL}")
    print(f"  Test User: {TEST_EMAIL}")
    print("=" * 70)

    async with httpx.AsyncClient(follow_redirects=False) as client:
        # Check server is up
        try:
            resp = await client.get(f"{BASE_URL}/", timeout=5.0)
        except Exception as e:
            print(f"\n[FAIL] FATAL: Cannot connect to {BASE_URL}")
            print(f"   Error: {e}")
            print(f"   Make sure the backend is running: cd backend && uvicorn app.main:app --reload")
            sys.exit(1)

        await test_01_health_check(client)
        await test_02_swagger_docs(client)
        ctx      = await test_03_auth_flow(client)
        await test_04_user_profile(client, ctx)
        pet_ctx  = await test_05_pet_profile(client, ctx)
        await test_06_pet_health_id(client, ctx, pet_ctx)
        await test_07_location(client)
        await test_08_checklist(client, ctx, pet_ctx)

        # ── Records tests ──────────────────────────────────────────────────────
        # Run raw-upload test BEFORE event tests so we can also verify
        # the old /api/medical-records/* 404 checks independently
        rec_ctx  = await test_09_v2_raw_records(client, ctx, pet_ctx)

        await test_10_v2_reference_data(client, ctx)
        event_ctx = await test_11_v2_medical_events(client, ctx, pet_ctx)

        # Timeline-linked upload test (needs event_id from test_11)
        linked_rec_ctx = await test_09b_v2_event_records(client, ctx, pet_ctx, event_ctx)

        await test_12_v2_reminders(client, ctx, pet_ctx)
        await test_13_v2_timeline(client, ctx, pet_ctx)
        await test_14_v2_export(client, ctx, pet_ctx)
        await test_15_auth_security(client, ctx, pet_ctx)

        # Delete records + verify cleanup (after all read tests)
        await test_16_v2_records_delete(client, ctx, pet_ctx, rec_ctx, linked_rec_ctx, event_ctx)

        await test_99_cleanup(client, ctx, pet_ctx, event_ctx)

    # -- SUMMARY --
    print("\n" + "=" * 70)
    total = len(results)
    passed = sum(1 for r in results if r["passed"])
    failed = total - passed
    print(f"  RESULTS: {passed}/{total} passed  |  {failed} failed")
    print("=" * 70)

    if failed > 0:
        print("\n  Failed tests:")
        for r in results:
            if not r["passed"]:
                print(f"    [FAIL] {r['name']}" + (f" -- {r['detail']}" if r["detail"] else ""))
    
    print()
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    asyncio.run(main())
