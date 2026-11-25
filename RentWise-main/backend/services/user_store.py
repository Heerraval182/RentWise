import os
import json
import sqlite3
import hashlib
import secrets
from pathlib import Path
from uuid import uuid4

DEFAULT_DB = Path(__file__).resolve().parents[1] / "data" / "rentwise.db"
DB_PATH = Path(os.getenv("RENTWISE_DB_PATH", str(DEFAULT_DB)))


def _connect():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    _init_schema(conn)
    return conn


def _hash_password(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()


def _init_schema(conn: sqlite3.Connection):
    conn.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        role TEXT NOT NULL,
        phone TEXT,
        agency_name TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.execute("""
    CREATE TABLE IF NOT EXISTS user_sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)

    conn.execute("""
    CREATE TABLE IF NOT EXISTS saved_properties (
        user_id TEXT NOT NULL,
        property_id TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, property_id),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)

    conn.execute("""
    CREATE TABLE IF NOT EXISTS user_agreements (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        document_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        location TEXT DEFAULT '',
        fairness_score INTEGER DEFAULT 0,
        fairness_label TEXT DEFAULT '',
        monthly_rent TEXT DEFAULT '',
        security_deposit TEXT DEFAULT '',
        risk_count INTEGER DEFAULT 0,
        analysis_json TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, document_id),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)
    conn.commit()

    # Seed demo users if table is empty
    count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    if count == 0:
        demo_accounts = [
            {
                "id": "usr-demo-customer",
                "name": "Rahul Sharma",
                "email": "customer@rentwise.com",
                "password": "password123",
                "role": "customer",
                "phone": "+91 98201 12345",
                "agency_name": "",
            },
            {
                "id": "usr-demo-broker",
                "name": "Amit Patel",
                "email": "broker@rentwise.com",
                "password": "password123",
                "role": "broker",
                "phone": "+91 98230 45678",
                "agency_name": "Metro Prime Realty Advisors",
            },
        ]
        for acc in demo_accounts:
            salt = secrets.token_hex(16)
            pwd_hash = _hash_password(acc["password"], salt)
            conn.execute("""
            INSERT INTO users (id, name, email, password_hash, salt, role, phone, agency_name)
            VALUES (?, ?, LOWER(?), ?, ?, ?, ?, ?)
            """, (acc["id"], acc["name"], acc["email"], pwd_hash, salt, acc["role"], acc["phone"], acc["agency_name"]))
        conn.commit()


def _user_dict(row):
    if not row:
        return None
    d = dict(row)
    d.pop("password_hash", None)
    d.pop("salt", None)
    return d


def create_user(name: str, email: str, password: str, role: str, phone: str = "", agency_name: str = ""):
    email_clean = email.strip().lower()
    role_clean = role.strip().lower()
    if role_clean not in {"customer", "broker"}:
        role_clean = "customer"

    with _connect() as conn:
        existing = conn.execute("SELECT id FROM users WHERE LOWER(email) = ?", (email_clean,)).fetchone()
        if existing:
            raise ValueError("An account with this email address already exists.")

        user_id = f"usr-{uuid4()}"
        salt = secrets.token_hex(16)
        pwd_hash = _hash_password(password, salt)

        conn.execute("""
        INSERT INTO users (id, name, email, password_hash, salt, role, phone, agency_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, name.strip(), email_clean, pwd_hash, salt, role_clean, phone.strip(), agency_name.strip()))
        conn.commit()

        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return _user_dict(row)


def authenticate_user(email: str, password: str):
    email_clean = email.strip().lower()
    with _connect() as conn:
        row = conn.execute("SELECT * FROM users WHERE LOWER(email) = ?", (email_clean,)).fetchone()
        if not row:
            return None

        salt = row["salt"]
        expected_hash = row["password_hash"]
        actual_hash = _hash_password(password, salt)

        if secrets.compare_digest(expected_hash, actual_hash):
            return _user_dict(row)
        return None


def create_session(user_id: str) -> str:
    token = secrets.token_urlsafe(32)
    with _connect() as conn:
        conn.execute("INSERT INTO user_sessions (token, user_id) VALUES (?, ?)", (token, user_id))
        conn.commit()
    return token


def get_user_by_token(token: str):
    if not token:
        return None
    with _connect() as conn:
        row = conn.execute("""
        SELECT u.* FROM users u
        JOIN user_sessions s ON u.id = s.user_id
        WHERE s.token = ?
        """, (token,)).fetchone()
        return _user_dict(row)


def delete_session(token: str):
    if not token:
        return
    with _connect() as conn:
        conn.execute("DELETE FROM user_sessions WHERE token = ?", (token,))
        conn.commit()


def get_user_by_id(user_id: str):
    with _connect() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return _user_dict(row)


def update_user_profile(user_id: str, name: str, phone: str = ""):
    with _connect() as conn:
        conn.execute(
            "UPDATE users SET name = ?, phone = ? WHERE id = ?",
            (name.strip(), phone.strip(), user_id),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return _user_dict(row)


def get_saved_property_ids(user_id: str):
    with _connect() as conn:
        rows = conn.execute(
            "SELECT property_id FROM saved_properties WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()
        return [r["property_id"] for r in rows]


def save_property_for_user(user_id: str, property_id: str):
    with _connect() as conn:
        conn.execute(
            "INSERT OR IGNORE INTO saved_properties (user_id, property_id) VALUES (?, ?)",
            (user_id, property_id),
        )
        conn.commit()
    return get_saved_property_ids(user_id)


def remove_saved_property_for_user(user_id: str, property_id: str):
    with _connect() as conn:
        conn.execute(
            "DELETE FROM saved_properties WHERE user_id = ? AND property_id = ?",
            (user_id, property_id),
        )
        conn.commit()
    return get_saved_property_ids(user_id)


def save_user_agreement(user_id: str, document_id: str, filename: str, location: str, analysis: dict):
    info = analysis.get("information") or {}
    fairness = analysis.get("fairness") or {}
    risks = analysis.get("risks") or []
    agreement_id = f"agr-{uuid4()}"

    with _connect() as conn:
        existing = conn.execute(
            "SELECT id FROM user_agreements WHERE user_id = ? AND document_id = ?",
            (user_id, document_id),
        ).fetchone()
        if existing:
            agreement_id = existing["id"]
            conn.execute(
                """
                UPDATE user_agreements
                SET filename = ?, location = ?, fairness_score = ?, fairness_label = ?,
                    monthly_rent = ?, security_deposit = ?, risk_count = ?, analysis_json = ?
                WHERE id = ?
                """,
                (
                    filename,
                    location or "",
                    int(fairness.get("score") or 0),
                    str(fairness.get("label") or ""),
                    str(info.get("monthly_rent") or "Not Found"),
                    str(info.get("security_deposit") or "Not Found"),
                    len(risks),
                    json.dumps(analysis),
                    agreement_id,
                ),
            )
        else:
            conn.execute(
                """
                INSERT INTO user_agreements (
                    id, user_id, document_id, filename, location,
                    fairness_score, fairness_label, monthly_rent, security_deposit,
                    risk_count, analysis_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    agreement_id,
                    user_id,
                    document_id,
                    filename,
                    location or "",
                    int(fairness.get("score") or 0),
                    str(fairness.get("label") or ""),
                    str(info.get("monthly_rent") or "Not Found"),
                    str(info.get("security_deposit") or "Not Found"),
                    len(risks),
                    json.dumps(analysis),
                ),
            )
        conn.commit()
        row = conn.execute("SELECT * FROM user_agreements WHERE id = ?", (agreement_id,)).fetchone()
        return _agreement_dict(row)


def _agreement_dict(row):
    if not row:
        return None
    d = dict(row)
    raw_json = d.pop("analysis_json", "{}")
    try:
        d["analysis"] = json.loads(raw_json)
    except Exception:
        d["analysis"] = {}
    return d


def get_user_agreements(user_id: str):
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM user_agreements WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()
        return [_agreement_dict(r) for r in rows]


def delete_user_agreement(user_id: str, agreement_id: str) -> bool:
    with _connect() as conn:
        cur = conn.execute(
            "DELETE FROM user_agreements WHERE user_id = ? AND id = ?",
            (user_id, agreement_id),
        )
        conn.commit()
        return cur.rowcount > 0
