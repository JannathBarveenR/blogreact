"""
Auth routes — Supabase Auth with Google OAuth + email/password.

POST /api/auth/signup              — Email+password signup
POST /api/auth/login               — Email+password login
GET  /api/auth/google              — Returns Google OAuth redirect URL
GET  /api/auth/me                  — Get current user from access token
POST /api/auth/register-interest   — Early-access interest form (landing page)
"""

from typing import Optional, Literal
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from app.supabase_client import supabase
from app.config import FRONTEND_URL, SUPABASE_URL, SUPABASE_ANON_KEY

router = APIRouter()


class SignupRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str
    full_name: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None


class LoginRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str


class RegisterInterestRequest(BaseModel):
    type: Literal["pet_parent", "veterinarian"]
    # Shared
    name: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    earlyAccess: Optional[bool] = True
    # Pet-parent only
    petType: Optional[str] = None
    hasPet: Optional[bool] = None
    # Vet only
    doctorName: Optional[str] = None
    clinicName: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    access_token: str
    new_password: str


@router.post("/signup")
async def signup(body: SignupRequest):
    """Create a new user account with email/phone and password."""
    try:
        if not body.email and not body.phone:
            raise HTTPException(status_code=400, detail="Either email or phone must be provided")

        admin_payload = {
            "password": body.password,
            "email_confirm": True,
            "phone_confirm": True,
            "user_metadata": {
                "full_name": body.full_name or "",
            },
        }
        if body.email:
            admin_payload["email"] = body.email
        if body.phone:
            admin_payload["phone"] = body.phone

        result = supabase.auth.admin.create_user(admin_payload)

        if result.user is None:
            raise HTTPException(status_code=400, detail="Signup failed — invalid details.")

        # Save to user_profiles so pet public page can show owner contact info
        try:
            supabase.table("user_profiles").upsert({
                "id": result.user.id,
                "full_name": body.full_name or "",
                "phone": body.phone or "",
                "email": body.email or "",
                "city": body.city or "",
                "state": body.state or "",
                "pincode": body.pincode or "",
            }).execute()
        except Exception as profile_err:
            print(f"[Auth] Warning: Could not save user_profile: {profile_err}")

        return {
            "message": "Account created successfully",
            "user": {
                "id": result.user.id,
                "email": result.user.email,
                "user_metadata": result.user.user_metadata,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        print(f"Signup error: {error_msg}")
        # Provide user-friendly error for duplicate phone/email
        if "already been registered" in error_msg.lower() or "already exists" in error_msg.lower() or "duplicate" in error_msg.lower():
            raise HTTPException(
                status_code=400,
                detail="This phone number or email is already registered. Please login instead."
            )
        raise HTTPException(status_code=400, detail="Signup failed. Please try again.")


@router.post("/login")
async def login(body: LoginRequest):
    """Log in with email/phone and password."""
    try:
        if not body.email and not body.phone:
            raise HTTPException(status_code=400, detail="Either email or phone must be provided")

        credentials = {"password": body.password}
        if body.email:
            credentials["email"] = body.email
        if body.phone:
            credentials["phone"] = body.phone

        # Use anon key (with service role fallback) for sign_in_with_password
        from supabase import create_client
        auth_key = SUPABASE_ANON_KEY
        if not auth_key:
            print("[Auth] WARNING: Neither SUPABASE_ANON_KEY nor SUPABASE_SERVICE_ROLE_KEY is set")
            raise HTTPException(status_code=500, detail="Server configuration error: Supabase key not set")
        temp_supabase = create_client(SUPABASE_URL, auth_key)

        result = temp_supabase.auth.sign_in_with_password(credentials)

        if result.session is None:
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        return {
            "message": "Login successful",
            "access_token": result.session.access_token,
            "refresh_token": result.session.refresh_token,
            "user": {
                "id": result.user.id,
                "email": result.user.email,
                "user_metadata": result.user.user_metadata,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        print(f"Login error: {error_msg}")
        raise HTTPException(status_code=401, detail="Invalid credentials. Please try again.")


@router.get("/google")
async def google_oauth():
    """Returns the Google OAuth URL for the frontend to redirect to."""
    try:
        result = supabase.auth.sign_in_with_oauth(
            {
                "provider": "google",
                "options": {
                    "redirect_to": f"{FRONTEND_URL}/auth/callback",
                },
            }
        )

        if result and result.url:
            return {"url": result.url}

        raise HTTPException(
            status_code=503,
            detail="Google OAuth is not configured. Please set up Google provider in Supabase Dashboard.",
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Google OAuth error: {e}")
        raise HTTPException(
            status_code=503,
            detail="Google OAuth is not configured yet. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env and configure Google provider in Supabase Dashboard.",
        )


@router.get("/me")
async def get_current_user(authorization: Optional[str] = Header(None)):
    """Get current user profile from the access token."""
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization header provided")

    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization

    try:
        result = supabase.auth.get_user(token)

        if result.user is None:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        return {
            "id": result.user.id,
            "email": result.user.email,
            "user_metadata": result.user.user_metadata,
            "app_metadata": getattr(result.user, "app_metadata", {}),
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Get user error: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.post("/register-interest")
async def register_interest(body: RegisterInterestRequest):
    """
    Store early-access registration interest from the landing page modal.
    Used by both Pet Parent and Veterinarian interest forms.
    """
    try:
        display_name = body.doctorName if body.type == "veterinarian" else body.name
        record = {
            "type": body.type,
            "name": display_name,
            "clinic_name": body.clinicName,
            "mobile": body.mobile,
            "email": body.email,
            "city": body.city,
            "pet_type": body.petType,
            "early_access": body.earlyAccess if body.earlyAccess is not None else True,
        }
        supabase.table("early_access_registrations").insert(record).execute()
        return {"message": "Thanks! You're on the early access list. We'll reach out soon."}
    except Exception as e:
        print(f"[register-interest] Error saving record: {e}")
        return {"message": "Thanks! You're on the early access list. We'll reach out soon."}

@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    """Send a password reset email."""
    try:
        # Supabase API for reset password
        supabase.auth.reset_password_for_email(body.email, {"redirect_to": f"{FRONTEND_URL}/reset-password"})
        return {"message": "Password reset email sent successfully."}
    except Exception as e:
        error_msg = str(e)
        print(f"Forgot password error: {error_msg}")
        raise HTTPException(status_code=400, detail="Failed to send reset email. Please try again.")


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest):
    """Reset user password using the access token from the reset email link."""
    try:
        if not body.new_password or len(body.new_password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

        # Get user from access token to find user_id
        user_result = supabase.auth.get_user(body.access_token)
        if not user_result or not user_result.user:
            raise HTTPException(status_code=401, detail="Invalid or expired reset token.")

        user_id = user_result.user.id

        # Update password via admin API
        supabase.auth.admin.update_user_by_id(
            user_id,
            {"password": body.new_password}
        )

        return {"message": "Password reset successfully. You can now login with your new password."}
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        print(f"Reset password error: {error_msg}")
        raise HTTPException(status_code=400, detail="Failed to reset password. Please try again.")
