import re
from typing import Optional, Any, Dict
from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel, Field
from services.user_store import (
    create_user,
    authenticate_user,
    create_session,
    get_user_by_token,
    delete_session,
    update_user_profile,
    get_saved_property_ids,
    save_property_for_user,
    remove_saved_property_for_user,
    save_user_agreement,
    get_user_agreements,
    delete_user_agreement,
)
from services.property_store import get_property

router = APIRouter(prefix="/auth", tags=["auth"])

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def validate_email(email: str) -> str:
    cleaned = email.strip().lower()
    if not EMAIL_REGEX.match(cleaned):
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    return cleaned


class SignupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=3, max_length=150)
    password: str = Field(min_length=6, max_length=128)
    role: str = Field(default="customer")  # "customer" or "broker"
    phone: Optional[str] = Field(default="", max_length=30)
    agency_name: Optional[str] = Field(default="", max_length=150)


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=150)
    password: str = Field(min_length=1)
    expected_role: Optional[str] = None  # optional check if logging in for a specific portal


def get_optional_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        return None
    token = authorization.replace("Bearer ", "").strip()
    if not token:
        return None
    return get_user_by_token(token)


def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication token required.")
    token = authorization.replace("Bearer ", "").strip()
    user = get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Session expired or invalid. Please log in again.")
    return user


class ProfileUpdateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    phone: Optional[str] = Field(default="", max_length=30)


class SaveAgreementRequest(BaseModel):
    document_id: str = Field(min_length=1, max_length=120)
    filename: str = Field(min_length=1, max_length=255)
    location: Optional[str] = Field(default="", max_length=150)
    analysis: Dict[str, Any]


@router.post("/signup")
def signup(payload: SignupRequest):
    valid_email = validate_email(payload.email)
    role = payload.role.strip().lower()
    if role not in {"customer", "broker"}:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'customer' or 'broker'.")

    try:
        user = create_user(
            name=payload.name,
            email=valid_email,
            password=payload.password,
            role=role,
            phone=payload.phone or "",
            agency_name=payload.agency_name or "",
        )
        token = create_session(user["id"])
        return {"user": user, "token": token, "message": "Account created successfully."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred while creating your account.")


@router.post("/login")
def login(payload: LoginRequest):
    valid_email = validate_email(payload.email)
    user = authenticate_user(valid_email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if payload.expected_role and payload.expected_role.lower() != user["role"].lower():
        role_label = "Customer" if user["role"] == "customer" else "Broker"
        portal_label = "Customer Portal" if payload.expected_role.lower() == "customer" else "Broker Portal"
        raise HTTPException(
            status_code=403,
            detail=f"This account is registered as a {role_label}, but you are logging in to the {portal_label}. Please use a {payload.expected_role.capitalize()} account or switch portals."
        )

    token = create_session(user["id"])
    return {"user": user, "token": token, "message": "Login successful."}


@router.get("/me")
def me(user: dict = Depends(get_current_user)):
    return {"user": user}


@router.post("/logout")
def logout(authorization: Optional[str] = Header(None)):
    if authorization:
        token = authorization.replace("Bearer ", "").strip()
        delete_session(token)
    return {"status": "ok", "message": "Logged out successfully."}


@router.get("/demo-accounts")
def demo_accounts():
    return {
        "customer": {
            "name": "Rahul Sharma",
            "email": "customer@rentwise.com",
            "password": "password123",
            "role": "customer",
            "phone": "+91 98201 12345",
            "description": "Customer / General User account for agreement analysis, property search, and listings"
        },
        "broker": {
            "name": "Amit Patel",
            "email": "broker@rentwise.com",
            "password": "password123",
            "role": "broker",
            "agency_name": "Metro Prime Realty Advisors",
            "phone": "+91 98230 45678",
            "description": "Commercial & Residential licensed broker account with active leads"
        }
    }


@router.put("/profile")
def update_profile(payload: ProfileUpdateRequest, user: dict = Depends(get_current_user)):
    updated = update_user_profile(user["id"], payload.name, payload.phone or "")
    return {"user": updated, "message": "Profile updated successfully."}


@router.get("/saved-properties")
def list_saved_properties(user: dict = Depends(get_current_user)):
    saved_ids = get_saved_property_ids(user["id"])
    properties = []
    for pid in saved_ids:
        prop = get_property(pid)
        if prop:
            properties.append(prop)
    return {"saved_ids": [p["id"] for p in properties], "properties": properties}


@router.post("/saved-properties/{property_id}")
def save_property(property_id: str, user: dict = Depends(get_current_user)):
    prop = get_property(property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")
    saved_ids = save_property_for_user(user["id"], property_id)
    return {"saved_ids": saved_ids, "message": "Property saved to your account."}


@router.delete("/saved-properties/{property_id}")
def unsave_property(property_id: str, user: dict = Depends(get_current_user)):
    saved_ids = remove_saved_property_for_user(user["id"], property_id)
    return {"saved_ids": saved_ids, "message": "Property removed from saved list."}


@router.get("/agreements")
def list_saved_agreements(user: dict = Depends(get_current_user)):
    return {"agreements": get_user_agreements(user["id"])}


@router.post("/agreements")
def save_agreement(payload: SaveAgreementRequest, user: dict = Depends(get_current_user)):
    saved = save_user_agreement(
        user_id=user["id"],
        document_id=payload.document_id,
        filename=payload.filename,
        location=payload.location or "",
        analysis=payload.analysis,
    )
    return {"agreement": saved, "message": "Agreement saved to My Account."}


@router.delete("/agreements/{agreement_id}")
def remove_saved_agreement(agreement_id: str, user: dict = Depends(get_current_user)):
    deleted = delete_user_agreement(user["id"], agreement_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Saved agreement not found.")
    return {"status": "ok", "message": "Agreement deleted from your account."}
