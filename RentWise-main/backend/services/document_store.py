import os
import sqlite3
from pathlib import Path

DEFAULT_DB = Path(__file__).resolve().parents[1] / "data" / "rentwise.db"
DB_PATH = Path(os.getenv("RENTWISE_DB_PATH", str(DEFAULT_DB)))


def _connect():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.execute(
        "CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, text TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"
    )
    connection.commit()
    return connection


def save_document(document_id, text):
    with _connect() as connection:
        connection.execute("INSERT INTO documents (id, text) VALUES (?, ?)", (document_id, text))
        connection.commit()


def get_document(document_id):
    with _connect() as connection:
        row = connection.execute("SELECT text FROM documents WHERE id = ?", (document_id,)).fetchone()
    return row[0] if row else None
