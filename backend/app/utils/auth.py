"""
Shared authentication dependencies for FastAPI routes.
Extracts and validates the user from the JWT Bearer token.
"""

from typing import Optional
from fastapi import Header, HTTPException, Depends
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



async def get_user_roles(user_id: str) -> list[str]:
    """Retrieve all roles assigned to the user from public.user_roles."""
    try:
        from app.supabase_client import supabase_admin
        res = supabase_admin.table("user_roles").select("role").eq("user_id", user_id).execute()
        roles = [r["role"] for r in (res.data or [])]
        # If no role explicitly assigned yet, default to pet_parent
        if not roles:
            roles = ["pet_parent"]
        return roles
    except Exception as e:
        print(f"[Auth] Error fetching roles for user {user_id}: {e}")
        return ["pet_parent"]


def require_role(role: str):
    """Dependency that ensures the authenticated user has a specific role."""
    async def _role_checker(user: dict = Depends(get_current_user)):
        roles = await get_user_roles(user["id"])
        if role not in roles:
            raise HTTPException(status_code=403, detail=f"Access denied. Requires '{role}' role.")
        user["roles"] = roles
        return user
    return _role_checker


async def get_user_supabase(authorization: Optional[str] = Header(None)) -> Client:
    """
    FastAPI dependency - returns a Supabase client authenticated as the user.
    """
    token = _extract_token(authorization)
    options = ClientOptions(
        headers={"Authorization": f"Bearer {token}"}
    )
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY, options=options)

