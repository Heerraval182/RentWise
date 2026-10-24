import os
import json
import sqlite3
from pathlib import Path
from uuid import uuid4
from datetime import datetime

DEFAULT_DB = Path(__file__).resolve().parents[1] / "data" / "rentwise.db"
DB_PATH = Path(os.getenv("RENTWISE_DB_PATH", str(DEFAULT_DB)))

INITIAL_PROPERTIES = [
    {
        "id": "prop-seed-1",
        "title": "Luxury 3 BHK High-Rise with Balcony View",
        "listing_type": "rent",
        "property_type": "Apartment",
        "city": "Pune",
        "locality": "Koregaon Park",
        "address": "Lane 5, Near German Bakery, Koregaon Park",
        "pincode": "411001",
        "price": 45000,
        "deposit": 120000,
        "maintenance": 3500,
        "bhk": "3 BHK",
        "bathrooms": 3,
        "balconies": 2,
        "area_sqft": 1650,
        "furnishing": "Fully Furnished",
        "floor": "9th of 14 Floors",
        "parking": "Covered 4-wheeler",
        "available_from": "Immediate",
        "preferred_tenant": "Family or Working Professionals",
        "amenities": json.dumps(["Lift", "Gym", "Swimming Pool", "24x7 Security", "Power Backup", "Club House", "Reserved Parking"]),
        "description": "Premium 3 BHK apartment with designer Italian marble flooring, modular kitchen with chimney, AC in all bedrooms, and spacious balcony offering serene tree-lined views. Gated community with 24/7 security.",
        "owner_name": "Rajesh Mehta",
        "owner_phone": "+91 98230 45678",
        "owner_email": "rajesh.mehta@example.com",
        "image_url": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
        "status": "available",
        "created_at": "2026-03-10 10:00:00"
    },
    {
        "id": "prop-seed-2",
        "title": "Modern 2 BHK Gated Community Flat",
        "listing_type": "rent",
        "property_type": "Apartment",
        "city": "Pune",
        "locality": "Wakad",
        "address": "Datta Mandir Road, Near Hinjewadi Flyover",
        "pincode": "411057",
        "price": 28000,
        "deposit": 60000,
        "maintenance": 2200,
        "bhk": "2 BHK",
        "bathrooms": 2,
        "balconies": 1,
        "area_sqft": 1100,
        "furnishing": "Semi Furnished",
        "floor": "4th of 12 Floors",
        "parking": "Covered 4-wheeler + 2-wheeler",
        "available_from": "Within 15 Days",
        "preferred_tenant": "Any",
        "amenities": json.dumps(["Lift", "Power Backup", "24x7 Security", "Children's Play Area", "Reserved Parking", "High Speed Internet"]),
        "description": "Well-ventilated 2 BHK flat very close to Hinjewadi IT Park Phase 1. Features modular kitchen, wardrobes in both bedrooms, geysers, and piped gas connection.",
        "owner_name": "Pooja Kulkarni",
        "owner_phone": "+91 97654 32109",
        "owner_email": "pooja.k@example.com",
        "image_url": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
        "status": "available",
        "created_at": "2026-03-12 11:30:00"
    },
    {
        "id": "prop-seed-3",
        "title": "Spacious 4 BHK Independent Villa with Private Garden",
        "listing_type": "sale",
        "property_type": "Villa / House",
        "city": "Pune",
        "locality": "Baner",
        "address": "Pan Card Club Road, Baner Hills",
        "pincode": "411045",
        "price": 27500000,
        "deposit": 0,
        "maintenance": 4500,
        "bhk": "4 BHK",
        "bathrooms": 4,
        "balconies": 3,
        "area_sqft": 3200,
        "furnishing": "Semi Furnished",
        "floor": "Ground + 2 Floors",
        "parking": "Private 2 Car Garage",
        "available_from": "Immediate",
        "preferred_tenant": "Any",
        "amenities": json.dumps(["Private Garden", "Power Backup", "Gated Community", "24x7 Security", "Pet Friendly", "Solar Water Heating", "Club House"]),
        "description": "Luxurious 4 BHK villa with lush private landscaped lawn, servant quarter, double-height ceiling living hall, and private terrace. Clear title, OC received, Vastu compliant.",
        "owner_name": "Sunil Deshmukh",
        "owner_phone": "+91 94220 11223",
        "owner_email": "sunil.deshmukh@example.com",
        "image_url": "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
        "status": "available",
        "created_at": "2026-03-15 14:15:00"
    },
    {
        "id": "prop-seed-4",
        "title": "Compact 1 BHK Cozy Studio Flat",
        "listing_type": "rent",
        "property_type": "Studio / 1RK",
        "city": "Bengaluru",
        "locality": "Koramangala",
        "address": "5th Block, 80 Feet Road, Koramangala",
        "pincode": "560095",
        "price": 22000,
        "deposit": 50000,
        "maintenance": 1500,
        "bhk": "1 BHK",
        "bathrooms": 1,
        "balconies": 1,
        "area_sqft": 620,
        "furnishing": "Fully Furnished",
        "floor": "2nd of 4 Floors",
        "parking": "2-wheeler",
        "available_from": "Immediate",
        "preferred_tenant": "Bachelors or Working Professionals",
        "amenities": json.dumps(["Power Backup", "High Speed Internet", "Lift", "24x7 Security", "Water Purifier"]),
        "description": "Fully furnished 1 BHK in prime Koramangala 5th block. Walkable distance to top cafes, startups, and transit points. Includes smart TV, fridge, washing machine, and bed with mattress.",
        "owner_name": "Arun Kumar",
        "owner_phone": "+91 99001 88234",
        "owner_email": "arun.kr@example.com",
        "image_url": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
        "status": "available",
        "created_at": "2026-03-18 09:20:00"
    },
    {
        "id": "prop-seed-5",
        "title": "Prime 3 BHK High-End Flat for Sale in Indiranagar",
        "listing_type": "sale",
        "property_type": "Apartment",
        "city": "Bengaluru",
        "locality": "Indiranagar",
        "address": "100 Feet Road, HAL 2nd Stage",
        "pincode": "560038",
        "price": 18500000,
        "deposit": 0,
        "maintenance": 4000,
        "bhk": "3 BHK",
        "bathrooms": 3,
        "balconies": 2,
        "area_sqft": 1950,
        "furnishing": "Unfurnished",
        "floor": "6th of 10 Floors",
        "parking": "2 Covered Car Parks",
        "available_from": "Immediate",
        "preferred_tenant": "Any",
        "amenities": json.dumps(["Lift", "Swimming Pool", "Gym", "Club House", "Power Backup", "24x7 Security", "Gas Pipeline"]),
        "description": "Rare 3 BHK ready-to-move apartment located in one of Bengaluru's most sought-after upscale neighborhoods. 100% power backup, premium CP fittings, and high appreciation potential.",
        "owner_name": "Deepa Nambiar",
        "owner_phone": "+91 98450 67123",
        "owner_email": "deepa.nambiar@example.com",
        "image_url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
        "status": "available",
        "created_at": "2026-03-20 16:40:00"
    },
    {
        "id": "prop-seed-6",
        "title": "Sea-View 2 BHK Premium Flat for Rent",
        "listing_type": "rent",
        "property_type": "Apartment",
        "city": "Mumbai",
        "locality": "Bandra West",
        "address": "Perry Cross Road, Near Carter Road Promenade",
        "pincode": "400050",
        "price": 95000,
        "deposit": 300000,
        "maintenance": 6000,
        "bhk": "2 BHK",
        "bathrooms": 2,
        "balconies": 1,
        "area_sqft": 1050,
        "furnishing": "Fully Furnished",
        "floor": "11th of 18 Floors",
        "parking": "Covered 4-wheeler",
        "available_from": "1st of Next Month",
        "preferred_tenant": "Family or Expats",
        "amenities": json.dumps(["Sea Facing", "Lift", "Gym", "24x7 Security", "Power Backup", "Pet Friendly", "Reserved Parking"]),
        "description": "Breathtaking Arabian sea breeze and partial sea view from master bedroom. Ultra-modern interiors, imported fittings, soundproof double-glazed windows, and prime Bandra location.",
        "owner_name": "Farhan Merchant",
        "owner_phone": "+91 98201 55432",
        "owner_email": "farhan.m@example.com",
        "image_url": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
        "status": "available",
        "created_at": "2026-03-22 12:10:00"
    },
    {
        "id": "prop-seed-7",
        "title": "Spacious 3 BHK Family Apartment for Sale",
        "listing_type": "sale",
        "property_type": "Apartment",
        "city": "Mumbai",
        "locality": "Powai",
        "address": "Hiranandani Gardens, Powai",
        "pincode": "400076",
        "price": 31000000,
        "deposit": 0,
        "maintenance": 5500,
        "bhk": "3 BHK",
        "bathrooms": 3,
        "balconies": 2,
        "area_sqft": 1580,
        "furnishing": "Semi Furnished",
        "floor": "14th of 24 Floors",
        "parking": "Covered 4-wheeler",
        "available_from": "Immediate",
        "preferred_tenant": "Any",
        "amenities": json.dumps(["Lift", "Swimming Pool", "Gym", "Club House", "Power Backup", "Children's Play Area", "24x7 Security", "Gated Community"]),
        "description": "Elegant neoclassical architecture building in Hiranandani Powai. Close to international schools, hospital, lakeside promenade, and corporate hubs. OC received.",
        "owner_name": "Vikram Singhania",
        "owner_phone": "+91 98190 77889",
        "owner_email": "vikram.s@example.com",
        "image_url": "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
        "status": "available",
        "created_at": "2026-03-24 15:00:00"
    },
    {
        "id": "prop-seed-8",
        "title": "Affordable 2 BHK Flat Near Metro Station",
        "listing_type": "rent",
        "property_type": "Apartment",
        "city": "Delhi NCR",
        "locality": "Noida Sector 62",
        "address": "Sector 62, Near Electronic City Metro Station",
        "pincode": "201309",
        "price": 20000,
        "deposit": 40000,
        "maintenance": 1800,
        "bhk": "2 BHK",
        "bathrooms": 2,
        "balconies": 2,
        "area_sqft": 1020,
        "furnishing": "Semi Furnished",
        "floor": "5th of 14 Floors",
        "parking": "Covered 4-wheeler",
        "available_from": "Immediate",
        "preferred_tenant": "Family or Working Professionals",
        "amenities": json.dumps(["Lift", "Power Backup", "24x7 Security", "Gated Community", "Park / Garden", "Reserved Parking"]),
        "description": "5 minutes walking distance to Noida Electronic City Blue Line metro station. Well-maintained society with central park, badminton court, and daily needs convenience store.",
        "owner_name": "Amitabh Sharma",
        "owner_phone": "+91 99112 33445",
        "owner_email": "amitabh.s@example.com",
        "image_url": "https://images.unsplash.com/photo-1502005229762-ee1b2b8ab98f?auto=format&fit=crop&w=800&q=80",
        "status": "available",
        "created_at": "2026-03-25 09:45:00"
    }
]

INITIAL_LEADS = [
    {
        "id": "lead-seed-1",
        "client_name": "Rohan & Sneha Joshi",
        "client_phone": "+91 98901 22334",
        "client_email": "rohan.joshi@example.com",
        "purpose": "rent",
        "city": "Pune",
        "preferred_localities": "Koregaon Park, Kalyani Nagar, Viman Nagar",
        "property_type": "Apartment",
        "bhk": "3 BHK",
        "min_budget": 35000,
        "max_budget": 50000,
        "furnishing": "Fully Furnished",
        "preferred_amenities": json.dumps(["Lift", "Gym", "Power Backup", "Reserved Parking"]),
        "notes": "Looking for a spacious 3 BHK near Koregaon Park or Kalyani Nagar. Both working from home, need quiet balcony and high-speed fiber internet.",
        "created_at": "2026-03-26 11:00:00"
    },
    {
        "id": "lead-seed-2",
        "client_name": "Abhishek Verma",
        "client_phone": "+91 98110 99887",
        "client_email": "abhishek.v@example.com",
        "purpose": "rent",
        "city": "Pune",
        "preferred_localities": "Wakad, Hinjewadi, Baner",
        "property_type": "Apartment",
        "bhk": "2 BHK",
        "min_budget": 22000,
        "max_budget": 32000,
        "furnishing": "Semi Furnished",
        "preferred_amenities": json.dumps(["Lift", "Power Backup", "Reserved Parking"]),
        "notes": "Senior Software Engineer moving to Hinjewadi Phase 1. Needs covered car parking and move-in within 10 days.",
        "created_at": "2026-03-26 14:30:00"
    },
    {
        "id": "lead-seed-3",
        "client_name": "Karthik Srinivasan",
        "client_phone": "+91 98402 77665",
        "client_email": "karthik.s@example.com",
        "purpose": "sale",
        "city": "Bengaluru",
        "preferred_localities": "Indiranagar, Domlur, HAL",
        "property_type": "Apartment",
        "bhk": "3 BHK",
        "min_budget": 15000000,
        "max_budget": 22000000,
        "furnishing": "Any",
        "preferred_amenities": json.dumps(["Swimming Pool", "Gym", "Power Backup"]),
        "notes": "Looking to purchase 3 BHK luxury apartment in Central/East Bengaluru for self-occupancy with family. Pre-approved home loan in place.",
        "created_at": "2026-03-27 10:15:00"
    }
]


def _connect():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    _init_schema(conn)
    return conn


def _init_schema(conn: sqlite3.Connection):
    conn.execute("""
    CREATE TABLE IF NOT EXISTS properties (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        listing_type TEXT NOT NULL,
        property_type TEXT NOT NULL,
        city TEXT NOT NULL,
        locality TEXT NOT NULL,
        address TEXT,
        pincode TEXT,
        price REAL NOT NULL,
        deposit REAL DEFAULT 0,
        maintenance REAL DEFAULT 0,
        bhk TEXT,
        bathrooms INTEGER DEFAULT 1,
        balconies INTEGER DEFAULT 0,
        area_sqft REAL,
        furnishing TEXT,
        floor TEXT,
        parking TEXT,
        available_from TEXT,
        preferred_tenant TEXT,
        amenities TEXT,
        description TEXT,
        owner_name TEXT NOT NULL,
        owner_phone TEXT NOT NULL,
        owner_email TEXT,
        image_url TEXT,
        status TEXT DEFAULT 'available',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.execute("""
    CREATE TABLE IF NOT EXISTS broker_leads (
        id TEXT PRIMARY KEY,
        client_name TEXT NOT NULL,
        client_phone TEXT,
        client_email TEXT,
        purpose TEXT NOT NULL,
        city TEXT,
        preferred_localities TEXT,
        property_type TEXT,
        bhk TEXT,
        min_budget REAL DEFAULT 0,
        max_budget REAL DEFAULT 0,
        furnishing TEXT,
        preferred_amenities TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)
    conn.commit()

    # Seed initial properties if empty
    count = conn.execute("SELECT COUNT(*) FROM properties").fetchone()[0]
    if count == 0:
        for p in INITIAL_PROPERTIES:
            conn.execute("""
            INSERT INTO properties (
                id, title, listing_type, property_type, city, locality, address, pincode,
                price, deposit, maintenance, bhk, bathrooms, balconies, area_sqft,
                furnishing, floor, parking, available_from, preferred_tenant, amenities,
                description, owner_name, owner_phone, owner_email, image_url, status, created_at
            ) VALUES (
                :id, :title, :listing_type, :property_type, :city, :locality, :address, :pincode,
                :price, :deposit, :maintenance, :bhk, :bathrooms, :balconies, :area_sqft,
                :furnishing, :floor, :parking, :available_from, :preferred_tenant, :amenities,
                :description, :owner_name, :owner_phone, :owner_email, :image_url, :status, :created_at
            )
            """, p)
        conn.commit()

    # Seed initial broker leads if empty
    leads_count = conn.execute("SELECT COUNT(*) FROM broker_leads").fetchone()[0]
    if leads_count == 0:
        for lead in INITIAL_LEADS:
            conn.execute("""
            INSERT INTO broker_leads (
                id, client_name, client_phone, client_email, purpose, city,
                preferred_localities, property_type, bhk, min_budget, max_budget,
                furnishing, preferred_amenities, notes, created_at
            ) VALUES (
                :id, :client_name, :client_phone, :client_email, :purpose, :city,
                :preferred_localities, :property_type, :bhk, :min_budget, :max_budget,
                :furnishing, :preferred_amenities, :notes, :created_at
            )
            """, lead)
        conn.commit()


def _row_to_dict(row):
    if not row:
        return None
    d = dict(row)
    if "amenities" in d and d["amenities"]:
        try:
            d["amenities"] = json.loads(d["amenities"])
        except Exception:
            if isinstance(d["amenities"], str):
                d["amenities"] = [a.strip() for a in d["amenities"].split(",") if a.strip()]
    else:
        d["amenities"] = []
    return d


def get_all_properties(listing_type=None, city=None, status=None, search=None):
    with _connect() as conn:
        query = "SELECT * FROM properties WHERE 1=1"
        params = []
        if listing_type and isinstance(listing_type, str) and listing_type.lower() != "all":
            query += " AND LOWER(listing_type) = LOWER(?)"
            params.append(listing_type)
        if city and isinstance(city, str) and city.lower() != "all" and city.strip():
            query += " AND LOWER(city) LIKE LOWER(?)"
            params.append(f"%{city.strip()}%")
        if status and isinstance(status, str) and status.lower() != "all":
            query += " AND LOWER(status) = LOWER(?)"
            params.append(status)
        if search and isinstance(search, str) and search.strip():
            s = f"%{search.strip()}%"
            query += " AND (LOWER(title) LIKE LOWER(?) OR LOWER(locality) LIKE LOWER(?) OR LOWER(city) LIKE LOWER(?) OR LOWER(bhk) LIKE LOWER(?))"
            params.extend([s, s, s, s])

        query += " ORDER BY created_at DESC"
        rows = conn.execute(query, params).fetchall()
        return [_row_to_dict(r) for r in rows]


def get_property(property_id):
    with _connect() as conn:
        row = conn.execute("SELECT * FROM properties WHERE id = ?", (property_id,)).fetchone()
        return _row_to_dict(row)


def create_property(data: dict):
    prop_id = str(uuid4())
    amenities = data.get("amenities", [])
    if isinstance(amenities, list):
        amenities_str = json.dumps(amenities)
    else:
        amenities_str = str(amenities)

    image_url = data.get("image_url", "").strip()
    if not image_url:
        # Default aesthetic real-estate images based on type
        ptype = data.get("property_type", "").lower()
        if "villa" in ptype or "house" in ptype:
            image_url = "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80"
        elif "studio" in ptype:
            image_url = "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80"
        else:
            image_url = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80"

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    with _connect() as conn:
        conn.execute("""
        INSERT INTO properties (
            id, title, listing_type, property_type, city, locality, address, pincode,
            price, deposit, maintenance, bhk, bathrooms, balconies, area_sqft,
            furnishing, floor, parking, available_from, preferred_tenant, amenities,
            description, owner_name, owner_phone, owner_email, image_url, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            prop_id,
            data.get("title", "Untitled Property").strip(),
            data.get("listing_type", "rent").strip().lower(),
            data.get("property_type", "Apartment").strip(),
            data.get("city", "").strip(),
            data.get("locality", "").strip(),
            data.get("address", "").strip(),
            data.get("pincode", "").strip(),
            float(data.get("price") or 0),
            float(data.get("deposit") or 0),
            float(data.get("maintenance") or 0),
            data.get("bhk", "2 BHK").strip(),
            int(data.get("bathrooms") or 1),
            int(data.get("balconies") or 0),
            float(data.get("area_sqft") or 0),
            data.get("furnishing", "Semi Furnished").strip(),
            data.get("floor", "").strip(),
            data.get("parking", "Covered").strip(),
            data.get("available_from", "Immediate").strip(),
            data.get("preferred_tenant", "Any").strip(),
            amenities_str,
            data.get("description", "").strip(),
            data.get("owner_name", "").strip(),
            data.get("owner_phone", "").strip(),
            data.get("owner_email", "").strip(),
            image_url,
            data.get("status", "available").strip().lower(),
            now
        ))
        conn.commit()

    return get_property(prop_id)


def update_property(property_id: str, data: dict):
    existing = get_property(property_id)
    if not existing:
        return None

    amenities = data.get("amenities", existing.get("amenities", []))
    if isinstance(amenities, list):
        amenities_str = json.dumps(amenities)
    else:
        amenities_str = str(amenities)

    with _connect() as conn:
        conn.execute("""
        UPDATE properties SET
            title = ?, listing_type = ?, property_type = ?, city = ?, locality = ?,
            address = ?, pincode = ?, price = ?, deposit = ?, maintenance = ?,
            bhk = ?, bathrooms = ?, balconies = ?, area_sqft = ?, furnishing = ?,
            floor = ?, parking = ?, available_from = ?, preferred_tenant = ?,
            amenities = ?, description = ?, owner_name = ?, owner_phone = ?,
            owner_email = ?, image_url = ?, status = ?
        WHERE id = ?
        """, (
            data.get("title", existing["title"]),
            data.get("listing_type", existing["listing_type"]).lower(),
            data.get("property_type", existing["property_type"]),
            data.get("city", existing["city"]),
            data.get("locality", existing["locality"]),
            data.get("address", existing.get("address", "")),
            data.get("pincode", existing.get("pincode", "")),
            float(data.get("price", existing["price"])),
            float(data.get("deposit", existing.get("deposit", 0))),
            float(data.get("maintenance", existing.get("maintenance", 0))),
            data.get("bhk", existing.get("bhk", "")),
            int(data.get("bathrooms", existing.get("bathrooms", 1))),
            int(data.get("balconies", existing.get("balconies", 0))),
            float(data.get("area_sqft", existing.get("area_sqft", 0))),
            data.get("furnishing", existing.get("furnishing", "")),
            data.get("floor", existing.get("floor", "")),
            data.get("parking", existing.get("parking", "")),
            data.get("available_from", existing.get("available_from", "")),
            data.get("preferred_tenant", existing.get("preferred_tenant", "")),
            amenities_str,
            data.get("description", existing.get("description", "")),
            data.get("owner_name", existing["owner_name"]),
            data.get("owner_phone", existing["owner_phone"]),
            data.get("owner_email", existing.get("owner_email", "")),
            data.get("image_url", existing.get("image_url", "")),
            data.get("status", existing.get("status", "available")).lower(),
            property_id
        ))
        conn.commit()

    return get_property(property_id)


def delete_property(property_id: str):
    with _connect() as conn:
        cur = conn.execute("DELETE FROM properties WHERE id = ?", (property_id,))
        conn.commit()
        return cur.rowcount > 0


def match_properties(criteria: dict):
    """
    Intelligent broker matching algorithm:
    Matches properties according to customer requirement specifications:
    - purpose: 'rent' or 'sale'/'buy'
    - city: e.g. 'Pune'
    - locality: string or comma-separated preferred areas e.g. 'Koregaon Park, Kalyani Nagar'
    - property_type: 'Apartment', 'Villa / House', 'Studio / 1RK', or 'Any'
    - bhk: e.g. '2 BHK', '3 BHK', or 'Any'
    - min_budget: numeric minimum budget
    - max_budget: numeric maximum budget
    - furnishing: 'Fully Furnished', 'Semi Furnished', 'Unfurnished', or 'Any'
    - preferred_amenities: list of desired amenities
    """
    purpose = criteria.get("purpose", "").strip().lower()
    if purpose in ["buy", "purchase", "sale"]:
        req_listing_type = "sale"
    elif purpose in ["rent", "lease"]:
        req_listing_type = "rent"
    else:
        req_listing_type = None

    city = criteria.get("city", "").strip()
    locality = criteria.get("locality", "").strip() or criteria.get("preferred_localities", "").strip()
    property_type = criteria.get("property_type", "").strip()
    bhk = criteria.get("bhk", "").strip()
    furnishing = criteria.get("furnishing", "").strip()
    min_budget = float(criteria.get("min_budget") or 0)
    max_budget = float(criteria.get("max_budget") or 0)
    preferred_amenities = criteria.get("preferred_amenities", [])
    if isinstance(preferred_amenities, str):
        try:
            preferred_amenities = json.loads(preferred_amenities)
        except Exception:
            preferred_amenities = [a.strip() for a in preferred_amenities.split(",") if a.strip()]

    # Fetch all properties (filter by active status or all available)
    with _connect() as conn:
        rows = conn.execute("SELECT * FROM properties WHERE status != 'sold' AND status != 'rented' ORDER BY created_at DESC").fetchall()
        all_props = [_row_to_dict(r) for r in rows]

    matched_results = []

    locality_tokens = [loc.strip().lower() for loc in locality.replace(",", " ").split() if len(loc.strip()) > 2]

    for prop in all_props:
        score = 0
        match_reasons = []
        tags = []
        budget_status = "neutral"

        # 1. Purpose / Listing Type Match (Essential weight: 30 pts)
        if req_listing_type:
            if prop["listing_type"].lower() == req_listing_type:
                score += 30
                tags.append("For " + ("Rent" if req_listing_type == "rent" else "Sale"))
                match_reasons.append(f"Listing matches required purpose ({req_listing_type.capitalize()})")
            else:
                # If purpose is completely opposite (looking for rent but prop is for sale), significant penalty
                score -= 40
        else:
            score += 15

        # 2. City Match (Weight: 20 pts)
        if city:
            if city.lower() in prop["city"].lower() or prop["city"].lower() in city.lower():
                score += 20
                tags.append(prop["city"])
                match_reasons.append(f"Located in desired city ({prop['city']})")
            else:
                score -= 15
        else:
            score += 10

        # 3. Locality Match (Weight: 15 pts)
        prop_loc_lower = (prop["locality"] + " " + (prop.get("address") or "")).lower()
        if locality_tokens:
            hit = any(token in prop_loc_lower for token in locality_tokens)
            if hit:
                score += 15
                tags.append(f"Locality: {prop['locality']}")
                match_reasons.append(f"Matches preferred area/locality ({prop['locality']})")
        elif city:
            score += 5

        # 4. BHK Match (Weight: 15 pts)
        if bhk and bhk.lower() != "any":
            prop_bhk = (prop.get("bhk") or "").lower()
            if bhk.lower() in prop_bhk or prop_bhk in bhk.lower():
                score += 15
                tags.append(prop["bhk"])
                match_reasons.append(f"Exact configuration match ({prop['bhk']})")
            else:
                score += 0
        else:
            score += 10
            if prop.get("bhk"):
                tags.append(prop["bhk"])

        # 5. Property Type Match (Weight: 10 pts)
        if property_type and property_type.lower() != "any":
            if property_type.lower() in prop["property_type"].lower():
                score += 10
                tags.append(prop["property_type"])
                match_reasons.append(f"Matches desired property type ({prop['property_type']})")
            else:
                score += 0
        else:
            score += 5

        # 6. Budget Match (Weight: 20 pts)
        prop_price = float(prop["price"])
        if max_budget > 0:
            if min_budget > 0 and prop_price >= min_budget and prop_price <= max_budget:
                score += 20
                budget_status = "within"
                tags.append("Within Budget")
                match_reasons.append(f"Price ₹{prop_price:,.0f} perfectly fits client budget (₹{min_budget:,.0f} - ₹{max_budget:,.0f})")
            elif prop_price <= max_budget:
                score += 20
                budget_status = "within"
                tags.append("Within Budget")
                diff = max_budget - prop_price
                if diff > 0 and max_budget > 0:
                    saving_pct = (diff / max_budget) * 100
                    if saving_pct >= 5:
                        budget_status = "below"
                        tags.append(f"Great Deal ({saving_pct:.0f}% Below Max)")
                        match_reasons.append(f"Priced ₹{prop_price:,.0f} - excellent value, {saving_pct:.0f}% below client's max budget")
                    else:
                        match_reasons.append(f"Price ₹{prop_price:,.0f} is within client's max budget (₹{max_budget:,.0f})")
                else:
                    match_reasons.append(f"Price ₹{prop_price:,.0f} matches budget")
            elif prop_price <= max_budget * 1.12:
                # Up to 12% above budget (negotiable range)
                score += 8
                budget_status = "slightly_above"
                excess = prop_price - max_budget
                tags.append("Slightly Above Budget")
                match_reasons.append(f"Price ₹{prop_price:,.0f} is slightly above max budget (+₹{excess:,.0f}, potential for negotiation)")
            else:
                score -= 10
                budget_status = "above"
        else:
            score += 10

        # 7. Furnishing Match (Weight: 5 pts)
        if furnishing and furnishing.lower() != "any":
            if furnishing.lower() in (prop.get("furnishing") or "").lower():
                score += 5
                tags.append(prop["furnishing"])
                match_reasons.append(f"Furnishing matches preference ({prop['furnishing']})")
        else:
            score += 2

        # 8. Amenities Overlap (Up to 10 pts)
        prop_amenities = prop.get("amenities") or []
        if preferred_amenities and prop_amenities:
            matched_amenities = [a for a in preferred_amenities if any(a.lower() in pa.lower() for pa in prop_amenities)]
            if matched_amenities:
                amenity_score = min(10, int((len(matched_amenities) / len(preferred_amenities)) * 10))
                score += amenity_score
                match_reasons.append(f"Includes {len(matched_amenities)} desired amenities: {', '.join(matched_amenities[:3])}")

        # Normalize score between 0 and 100
        final_score = max(5, min(100, score))

        matched_results.append({
            **prop,
            "match_score": final_score,
            "match_reasons": match_reasons,
            "matched_tags": list(dict.fromkeys(tags)),
            "budget_status": budget_status
        })

    # Sort by match_score descending
    matched_results.sort(key=lambda x: x["match_score"], reverse=True)
    return matched_results


# Broker Leads Management
def get_all_leads():
    with _connect() as conn:
        rows = conn.execute("SELECT * FROM broker_leads ORDER BY created_at DESC").fetchall()
        leads = []
        for r in rows:
            d = dict(r)
            if "preferred_amenities" in d and d["preferred_amenities"]:
                try:
                    d["preferred_amenities"] = json.loads(d["preferred_amenities"])
                except Exception:
                    d["preferred_amenities"] = []
            else:
                d["preferred_amenities"] = []
            leads.append(d)
        return leads


def create_lead(data: dict):
    lead_id = str(uuid4())
    amenities = data.get("preferred_amenities", [])
    if isinstance(amenities, list):
        amenities_str = json.dumps(amenities)
    else:
        amenities_str = str(amenities)

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    with _connect() as conn:
        conn.execute("""
        INSERT INTO broker_leads (
            id, client_name, client_phone, client_email, purpose, city,
            preferred_localities, property_type, bhk, min_budget, max_budget,
            furnishing, preferred_amenities, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            lead_id,
            data.get("client_name", "Prospective Client").strip(),
            data.get("client_phone", "").strip(),
            data.get("client_email", "").strip(),
            data.get("purpose", "rent").strip().lower(),
            data.get("city", "").strip(),
            data.get("preferred_localities", "").strip(),
            data.get("property_type", "Apartment").strip(),
            data.get("bhk", "2 BHK").strip(),
            float(data.get("min_budget") or 0),
            float(data.get("max_budget") or 0),
            data.get("furnishing", "Any").strip(),
            amenities_str,
            data.get("notes", "").strip(),
            now
        ))
        conn.commit()

    # Return created lead
    with _connect() as conn:
        r = conn.execute("SELECT * FROM broker_leads WHERE id = ?", (lead_id,)).fetchone()
        d = dict(r)
        d["preferred_amenities"] = json.loads(d["preferred_amenities"]) if d.get("preferred_amenities") else []
        return d


def delete_lead(lead_id: str):
    with _connect() as conn:
        cur = conn.execute("DELETE FROM broker_leads WHERE id = ?", (lead_id,))
        conn.commit()
        return cur.rowcount > 0
