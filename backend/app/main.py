import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import PORT, FRONTEND_URL
from app.routers import auth, location, pet_profile, pet_health_id, medical_records, checklist, user_profile
from app.supabase_client import supabase

app = FastAPI(
    title="PetOLife API",
    description="Backend API for PetOLife — pet health profile management",
    version="2.0.0",
)

from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(ProxyHeadersMiddleware, trusted_hosts=["127.0.0.1", "localhost"])
app.add_middleware(GZipMiddleware, minimum_size=500)

# ---------------------------------------------------------------------------
# CORS — tightly scoped: only allow known frontend origins.
# Never use wildcard "*" with allow_credentials=True — browsers block it and
# it is a security hole that lets any site make credentialed requests.
# ---------------------------------------------------------------------------
_raw_origins = os.getenv("ALLOWED_ORIGINS", "")
_extra_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

ALLOWED_ORIGINS = list(
    {
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        *([FRONTEND_URL] if FRONTEND_URL else []),
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

# Register routers
app.include_router(auth.router,            prefix="/api/auth",            tags=["Auth"])
app.include_router(pet_profile.router,     prefix="/api/pet-profile",     tags=["Pet Profile"])
app.include_router(location.router,        prefix="/api/location",        tags=["Location"])
app.include_router(pet_health_id.router,   prefix="/api/pet-health-id",   tags=["Pet Health ID"])
app.include_router(medical_records.router, prefix="/api/medical-records", tags=["Medical Records"])
app.include_router(checklist.router,       prefix="/api/checklist",       tags=["Checklist"])
app.include_router(user_profile.router,    prefix="/api/user-profile",    tags=["User Profile"])


@app.get("/")
async def root():
    return {
        "status": "PetOLife backend is running",
        "engine": "FastAPI",
        "version": "2.0.0",
    }


@app.on_event("startup")
async def startup_check():
    """Quick connectivity test on startup."""
    try:
        supabase.table("pet_profiles").select("id").limit(1).execute()
        print("[Supabase] Connection test OK — pet_profiles table exists")
    except Exception as e:
        print(f"[Supabase] Connection test FAILED: {e}")
        print(
            "[Supabase] Hint: Make sure you ran schema.sql in the Supabase SQL Editor "
            "and the SUPABASE_URL is correct (should look like: https://xxxxx.supabase.co)"
        )
    
    # Initialize Redis Cache
    try:
        from fastapi_cache import FastAPICache
        from fastapi_cache.backends.redis import RedisBackend
        from redis import asyncio as aioredis
        
        # Redis running on default localhost:6379
        redis = aioredis.from_url("redis://localhost", encoding="utf8", decode_responses=True)
        FastAPICache.init(RedisBackend(redis), prefix="petolife-cache")
        print("[Redis] Cache initialized successfully")
    except ImportError:
        print("[Redis] Cache not initialized (fastapi-cache2 or redis missing)")
    except Exception as e:
        print(f"[Redis] Cache initialization failed: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT, reload=True)
