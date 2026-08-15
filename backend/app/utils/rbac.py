"""
Role-Based Access Control (RBAC) Module for PetOLife Vet Platform.

Supported Roles:
- 'pet_owner': Default role for pet parents. Access to own pets & consultations.
- 'vet': Registered veterinarian / doctor. Access to assigned patient consultations & clinical notes.
- 'supervisor': Administrative supervisor / platform admin. Full system access.
- 'staff': Clinic / platform staff. Assisted read-only or operational access.
"""

from typing import List, Callable, Dict, Any, Optional
from fastapi import Depends, HTTPException, status, Header
from app.utils.auth import get_current_user
from app.supabase_client import supabase


async def get_user_roles_from_db(user_id: str) -> List[str]:
    """Fetch assigned roles for a given user ID from database."""
    try:
        res = supabase.table("user_roles").select("role").eq("user_id", user_id).execute()
        if res.data and len(res.data) > 0:
            return [item["role"] for item in res.data]
    except Exception as e:
        print(f"[RBAC] Error fetching user roles: {e}")
    
    # Default fallback role
    return ["pet_owner"]


async def get_current_user_with_roles(
    authorization: Optional[str] = Header(None)
) -> Dict[str, Any]:
    """
    FastAPI Dependency — validates JWT and attaches user's assigned RBAC roles.
    """
    user = await get_current_user(authorization)
    roles = await get_user_roles_from_db(user["id"])
    user["roles"] = roles
    return user


def require_role(allowed_roles: List[str]) -> Callable:
    """
    FastAPI Dependency Generator — enforces role permissions on endpoints.
    Allows access if user possesses ANY of the specified allowed_roles (or 'supervisor').
    
    Usage:
        @router.get("/doctor-only", dependencies=[Depends(require_role(["vet"]))])
    """
    async def role_checker(
        current_user: Dict[str, Any] = Depends(get_current_user_with_roles)
    ) -> Dict[str, Any]:
        user_roles = current_user.get("roles", ["pet_owner"])
        
        # 'supervisor' always has administrative override access
        if "supervisor" in user_roles:
            return current_user
        
        # Check matching roles
        has_permission = any(role in user_roles for role in allowed_roles)
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {allowed_roles}"
            )
        return current_user

    return role_checker
