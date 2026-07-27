import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

from app.config import PORT, FRONTEND_URL, ENVIRONMENT
from app.routers import auth, location, pet_profile, pet_health_id, checklist, user_profile
from app.routers.v2 import medical_events, reference_data, timeline, reminders, records, export
from app.supabase_client import supabase

_is_production = ENVIRONMENT == "production"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager — performs startup connectivity checks."""
    try:
        supabase.table("pet_profiles").select("id").limit(1).execute()
        print("[Supabase] Connection test OK — pet_profiles table exists")
    except Exception as e:
        print(f"[Supabase] Connection test FAILED: {e}")
        print(
            "[Supabase] Hint: Make sure you ran schema.sql in the Supabase SQL Editor "
            "and the SUPABASE_URL is correct (should look like: https://xxxxx.supabase.co)"
        )
    yield
    # Cleanup on shutdown if needed


app = FastAPI(
    title="PetOLife API",
    description="Backend API for PetOLife — pet health profile management",
    version="2.0.0",
    docs_url=None if _is_production else "/docs",
    redoc_url=None if _is_production else "/redoc",
    openapi_url=None if _is_production else "/openapi.json",
    lifespan=lifespan,
)

# Trust Docker internal network / nginx reverse proxy.
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts=["*"])

# ---------------------------------------------------------------------------
# CORS — tightly scoped: only allow known frontend origins.
# Never use wildcard "*" with allow_credentials=True.
# ---------------------------------------------------------------------------
_raw_origins = os.getenv("ALLOWED_ORIGINS", "")
_extra_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

_frontend_origins = []
if FRONTEND_URL:
    _clean_url = FRONTEND_URL.rstrip("/")
    _frontend_origins.append(_clean_url)
    if "://www." in _clean_url:
        _frontend_origins.append(_clean_url.replace("://www.", "://"))
    elif "://" in _clean_url:
        _frontend_origins.append(_clean_url.replace("://", "://www."))

ALLOWED_ORIGINS = list(
    {
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        *_frontend_origins,
        *_extra_origins,
    }
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
    max_age=600,
)

# V1 Routers
app.include_router(auth.router,            prefix="/api/auth",            tags=["Auth"])
app.include_router(pet_profile.router,     prefix="/api/pet-profile",     tags=["Pet Profile"])
app.include_router(location.router,        prefix="/api/location",        tags=["Location"])
app.include_router(pet_health_id.router,   prefix="/api/pet-health-id",   tags=["Pet Health ID"])
app.include_router(checklist.router,       prefix="/api/checklist",       tags=["Checklist"])
app.include_router(user_profile.router,    prefix="/api/user-profile",    tags=["User Profile"])

# V2 AI Timeline Routers
app.include_router(reference_data.router)
app.include_router(medical_events.router)
app.include_router(timeline.router)
app.include_router(reminders.router)
app.include_router(records.router)
app.include_router(export.router)


@app.get("/")
async def root():
    return {
        "status": "PetOLife backend is running",
        "engine": "FastAPI",
        "version": "2.0.0",
    }
