"""Greenhouse public job board source adapter.

Verified live (2026-08-24) against boards-api.greenhouse.io for:
  celonis (56 Germany roles), contentful (0 currently), isaraerospace (88 Germany roles).
"govector" (assumed Vector Informatik) returned 404 and was dropped — never confirmed.
"""
import urllib.request
import json

API_BASE = "https://boards-api.greenhouse.io/v1/boards"


def fetch_raw_jobs(board_token: str) -> list[dict]:
    """Fetch all open jobs for a Greenhouse board, with full content inline."""
    url = f"{API_BASE}/{board_token}/jobs?content=true"
    req = urllib.request.Request(url, headers={"User-Agent": "engineerpath-germany/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.load(resp)
    return data.get("jobs", [])


def to_common_shape(raw_job: dict, company_name: str, board_token: str) -> dict:
    """Map a raw Greenhouse job record onto the locked schema fields this
    source can actually fill in. normalize.py finishes the rest (category,
    sponsorship, id, status)."""
    location_name = (raw_job.get("location") or {}).get("name", "")
    return {
        "title": raw_job.get("title", "").strip(),
        "company": company_name,
        "location": location_name,
        "employment_type": "Full-time",
        "source": "Greenhouse",
        "source_url": raw_job.get("absolute_url", ""),
        "published_at": raw_job.get("updated_at", ""),
        "description": raw_job.get("content", ""),
        "_source_id": str(raw_job.get("id", "")),
        "_board_token": board_token,
    }
