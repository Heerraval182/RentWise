from typing import Optional, List, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from services.property_store import (
    get_all_properties,
    get_property,
    create_property,
    update_property,
    delete_property,
    match_properties,
    get_all_leads,
    create_lead,
    delete_lead
)

router = APIRouter()


class PropertyCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    listing_type: str = Field(description="'rent' or 'sale'")
    property_type: str = Field(default="Apartment")
    city: str = Field(min_length=1, max_length=100)
    locality: str = Field(min_length=1, max_length=150)
    address: Optional[str] = ""
    pincode: Optional[str] = ""
    price: float = Field(gt=0)
    deposit: Optional[float] = 0
    maintenance: Optional[float] = 0
    bhk: Optional[str] = "2 BHK"
    bathrooms: Optional[int] = 1
    balconies: Optional[int] = 0
    area_sqft: Optional[float] = 0
    furnishing: Optional[str] = "Semi Furnished"
    floor: Optional[str] = ""
    parking: Optional[str] = "Covered"
    available_from: Optional[str] = "Immediate"
    preferred_tenant: Optional[str] = "Any"
    amenities: Optional[List[str]] = []
    description: Optional[str] = ""
    owner_name: str = Field(min_length=1, max_length=120)
    owner_phone: str = Field(min_length=5, max_length=30)
    owner_email: Optional[str] = ""
    image_url: Optional[str] = ""
    status: Optional[str] = "available"


class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    listing_type: Optional[str] = None
    property_type: Optional[str] = None
    city: Optional[str] = None
    locality: Optional[str] = None
    address: Optional[str] = None
    pincode: Optional[str] = None
    price: Optional[float] = None
    deposit: Optional[float] = None
    maintenance: Optional[float] = None
    bhk: Optional[str] = None
    bathrooms: Optional[int] = None
    balconies: Optional[int] = None
    area_sqft: Optional[float] = None
    furnishing: Optional[str] = None
    floor: Optional[str] = None
    parking: Optional[str] = None
    available_from: Optional[str] = None
    preferred_tenant: Optional[str] = None
    amenities: Optional[List[str]] = None
    description: Optional[str] = None
    owner_name: Optional[str] = None
    owner_phone: Optional[str] = None
    owner_email: Optional[str] = None
    image_url: Optional[str] = None
    status: Optional[str] = None


class MatchCriteria(BaseModel):
    purpose: str = Field(default="rent", description="'rent' or 'sale'/'buy'")
    city: Optional[str] = ""
    locality: Optional[str] = ""
    preferred_localities: Optional[str] = ""
    property_type: Optional[str] = "Any"
    bhk: Optional[str] = "Any"
    min_budget: Optional[float] = 0
    max_budget: Optional[float] = 0
    furnishing: Optional[str] = "Any"
    preferred_amenities: Optional[List[str]] = []


class LeadCreate(BaseModel):
    client_name: str = Field(min_length=1, max_length=120)
    client_phone: Optional[str] = ""
    client_email: Optional[str] = ""
    purpose: str = Field(default="rent")
    city: Optional[str] = ""
    preferred_localities: Optional[str] = ""
    property_type: Optional[str] = "Apartment"
    bhk: Optional[str] = "2 BHK"
    min_budget: Optional[float] = 0
    max_budget: Optional[float] = 0
    furnishing: Optional[str] = "Any"
    preferred_amenities: Optional[List[str]] = []
    notes: Optional[str] = ""


# Properties Endpoints
@router.get("/properties")
def list_properties(
    listing_type: Optional[str] = None,
    city: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None
):
    return {"properties": get_all_properties(listing_type, city, status, search)}


@router.get("/properties/{property_id}")
def retrieve_property(property_id: str):
    prop = get_property(property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop


@router.post("/properties", status_code=201)
def add_property(payload: PropertyCreate):
    created = create_property(payload.model_dump())
    return created


@router.put("/properties/{property_id}")
def edit_property(property_id: str, payload: PropertyUpdate):
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    updated = update_property(property_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Property not found")
    return updated


@router.delete("/properties/{property_id}")
def remove_property(property_id: str):
    success = delete_property(property_id)
    if not success:
        raise HTTPException(status_code=404, detail="Property not found")
    return {"status": "success", "message": "Property deleted successfully"}


# Broker Matching & Leads
@router.post("/broker/match")
def broker_match(criteria: MatchCriteria):
    matches = match_properties(criteria.model_dump())
    return {
        "criteria": criteria.model_dump(),
        "total_matched": len(matches),
        "results": matches
    }


@router.get("/broker/leads")
def list_leads():
    return {"leads": get_all_leads()}


@router.post("/broker/leads", status_code=201)
def save_lead(payload: LeadCreate):
    lead = create_lead(payload.model_dump())
    # Also find immediate matches for this new lead
    match_req = {
        "purpose": lead["purpose"],
        "city": lead["city"],
        "locality": lead["preferred_localities"],
        "property_type": lead["property_type"],
        "bhk": lead["bhk"],
        "min_budget": lead["min_budget"],
        "max_budget": lead["max_budget"],
        "furnishing": lead["furnishing"],
        "preferred_amenities": lead["preferred_amenities"]
    }
    matched = match_properties(match_req)
    return {
        "lead": lead,
        "matched_properties": matched
    }


@router.delete("/broker/leads/{lead_id}")
def remove_lead(lead_id: str):
    success = delete_lead(lead_id)
    if not success:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"status": "success", "message": "Lead deleted successfully"}
