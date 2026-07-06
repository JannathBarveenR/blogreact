"""
Supabase client singleton.
All routers should import `supabase` from this module.
"""

from supabase import create_client, Client
from app.config import SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) if SUPABASE_SERVICE_ROLE_KEY else supabase


# Startup diagnostic
_url = SUPABASE_URL or ""
print(f"[Supabase] URL: {_url[:30]}...")
print(f"[Supabase] Key loaded: {'Yes' if SUPABASE_SERVICE_ROLE_KEY else 'NO — MISSING!'}")
