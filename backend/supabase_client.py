"""
backend/supabase_client.py

Single shared Supabase connection for the whole team.
Everyone imports from this file instead of creating their own client.

Setup (one-time, each person):
    pip install supabase python-dotenv
    Copy backend/.env.example to backend/.env
    Fill in your real SUPABASE_URL and SUPABASE_KEY (get these from
    Supabase project -> Settings -> API. Use the service_role key for
    write access, not the anon key.)
"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client

_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(dotenv_path=_env_path)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError(
        "Missing SUPABASE_URL or SUPABASE_KEY. "
        "Copy backend/.env.example to backend/.env and fill in your real values."
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

TABLE_NAME = "predictions"  # <-- confirm this matches your actual table name in Supabase


def upsert_prediction(record: dict):
    """
    Insert or update one mine's prediction row.
    `record` keys must exactly match your Supabase column names:

    mine_name, mine_id, mine_type, operating_depth_m,
    prospectivity_classification, prospectivity_confidence_pct,
    predicted_grade_pct, grade_confidence, monthly_target_tonnes,
    predicted_production_tonnes, predicted_shortfall_tonnes,
    predicted_shortfall_pct, risk_level, key_constraints,
    corrective_actions, ai_summary, updated_at
    """
    return supabase.table(TABLE_NAME).upsert(record, on_conflict="mine_id").execute()


def upsert_all_predictions(records: list[dict]):
    """Bulk upsert — pass a list of record dicts (one per mine)."""
    return supabase.table(TABLE_NAME).upsert(records, on_conflict="mine_id").execute()


def get_all_predictions():
    """Fetch every row from the predictions table as a list of dicts."""
    response = supabase.table(TABLE_NAME).select("*").execute()
    return response.data


def get_prediction_by_mine_id(mine_id: str):
    """Fetch a single mine's prediction row."""
    response = supabase.table(TABLE_NAME).select("*").eq("mine_id", mine_id).execute()
    data = response.data
    return data[0] if data else None


if __name__ == "__main__":
    # quick manual test: run `python backend/supabase_client.py` to sanity-check the connection
    rows = get_all_predictions()
    print(f"Connected. Found {len(rows)} rows in '{TABLE_NAME}'.")
    for r in rows[:3]:
        print(r.get("mine_name"), "-", r.get("risk_level"))