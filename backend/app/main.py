import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

from app.config import PORT, FRONTEND_URL, ENVIRONMENT
from app.routers import auth, location, pet_profile, pet_health_id, checklist, user_profile, feedback, vet_consultation, maternity, admin_supervisor
from app.routers.v2 import medical_events, reference_data, timeline, reminders, records, export
from app.supabase_client import supabase

_is_production = ENVIRONMENT == "production"
 
 
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager — verifies database connectivity on startup."""
    try:
        supabase.table("pet_profiles").select("id").limit(1).execute()
    except Exception:
        pass
    yield


app = FastAPI(
    title="PetOLife API",
    description="Backend API for PetOLife — Pet Health & Vet Maternity Platform",
    version="2.0.0",
    docs_url=None if _is_production else "/docs",
    redoc_url=None if _is_production else "/redoc",
    openapi_url=None if _is_production else "/openapi.json",
    lifespan=lifespan,
)

# Trust VPC internal reverse proxies (Nginx / ALB / CloudFront)
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts=["127.0.0.1", "10.*", "172.16.*", "192.168.*"])

# ---------------------------------------------------------------------------
# CORS — Production Security Hardening
# In production, ONLY allow explicit CloudFront CDN / domain origins.
# ---------------------------------------------------------------------------
_default_dev_origins = [] if _is_production else [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

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
        *_default_dev_origins,
        *_frontend_origins,
        *_extra_origins,
    }
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=None if _is_production else r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
    max_age=86400,
)

# V1 Routers
app.include_router(auth.router,            prefix="/api/auth",            tags=["Auth"])
app.include_router(pet_profile.router,     prefix="/api/pet-profile",     tags=["Pet Profile"])
app.include_router(location.router,        prefix="/api/location",        tags=["Location"])
app.include_router(pet_health_id.router,   prefix="/api/pet-health-id",   tags=["Pet Health ID"])
app.include_router(checklist.router,       prefix="/api/checklist",       tags=["Checklist"])
app.include_router(user_profile.router,    prefix="/api/user-profile",    tags=["User Profile"])
app.include_router(feedback.router,        prefix="/api/feedback",        tags=["Feedback"])

# Vet & Maternity Platform Routers (V1/V2 Integrated)
app.include_router(vet_consultation.router)
app.include_router(maternity.router)
app.include_router(admin_supervisor.router)

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
