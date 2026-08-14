"""
Shared authentication dependencies for FastAPI routes.
Extracts and validates the user from the JWT Bearer token.
"""

from typing import Optional
from fastapi import Header, HTTPException
from supabase import create_client, Client, ClientOptions
from app.supabase_client import supabase
from app.config import SUPABASE_URL, SUPABASE_ANON_KEY


def _extract_token(authorization: Optional[str]) -> str:
    """Extract and return the raw JWT from the Authorization header."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header is required")
    return authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization


def _validate_token(token: str):
    """Validate JWT via Supabase and return the user object. Raises 401 on failure."""
    try:
        result = supabase.auth.get_user(token)
        if result.user is None:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return result.user
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Auth Dependency] Token validation error: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """
    FastAPI dependency — returns full user profile dict including metadata.
    Used by both V1 and V2 routers.
    """
    token = _extract_token(authorization)
    user = _validate_token(token)
    return {
        "id": user.id,
        "email": user.email,
        "user_metadata": getattr(user, "user_metadata", {}) or {},
        "app_metadata": getattr(user, "app_metadata", {}) or {},
    }


async def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    """
    FastAPI dependency — returns just the user's UUID string.
    Convenience wrapper for V1 routers that only need the ID.
    """
    user = await get_current_user(authorization)
    return user["id"]


async def get_user_supabase(authorization: Optional[str] = Header(None)) -> Client:
    """
    FastAPI dependency — returns a Supabase client configured with the
    user's JWT for Row-Level Security (RLS) enforcement.
    """
    token = _extract_token(authorization)
    try:
        options = ClientOptions(headers={"Authorization": f"Bearer {token}"})
        return create_client(SUPABASE_URL, SUPABASE_ANON_KEY, options=options)
    except Exception as e:
        print(f"[Auth Dependency] Client creation error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
