"""
Supabase client singleton.
All routers should import `supabase` and `supabase_admin` from this module.
"""

from supabase import create_client, Client
from app.config import SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ENVIRONMENT

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) if SUPABASE_SERVICE_ROLE_KEY else supabase

# Startup diagnostic — only in development (avoid leaking infra info in prod logs)
if ENVIRONMENT != "production":
    _url = SUPABASE_URL or ""
    print(f"[Supabase] URL: {_url[:30]}...")
    print(f"[Supabase] Service-role key loaded: {'Yes' if SUPABASE_SERVICE_ROLE_KEY else 'NO - MISSING!'}")
