"""SmartRecruiters public postings API source adapter.

Verified live (2026-08-24) against api.smartrecruiters.com for VolocopterGmbH:
company identifier confirmed correct (careers.smartrecruiters.com/VolocopterGmbH
returns 200), API wiring confirmed working — currently 0 open postings, which
is a real hiring-pipeline state, not an integration failure. Will start
contributing the moment Volocopter opens a role, with no code change.
"""
import urllib.request
import json

API_BASE = "https://api.smartrecruiters.com/v1/companies"


def fetch_raw_jobs(company_id: str) -> list[dict]:
    url = f"{API_BASE}/{company_id}/postings"
    req = urllib.request.Request(url, headers={"User-Agent": "engineerpath-germany/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.load(resp)
    return data.get("content", [])


def fetch_posting_detail(company_id: str, posting_id: str) -> dict:
    """Full description text isn't in the list response — fetch per-posting,
    only called for postings that pass the Germany filter."""
    url = f"{API_BASE}/{company_id}/postings/{posting_id}"
    req = urllib.request.Request(url, headers={"User-Agent": "engineerpath-germany/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.load(resp)


def to_common_shape(raw_posting: dict, company_name: str, company_id: str) -> dict:
    location = raw_posting.get("location", {}) or {}
    city = location.get("city", "")
    country = location.get("country", "")
    return {
        "title": raw_posting.get("name", "").strip(),
        "company": company_name,
        "location": city,
        "_country_code": country,
        "employment_type": "Full-time",
        "source": "SmartRecruiters",
        "source_url": raw_posting.get("ref", "") or f"https://careers.smartrecruiters.com/{company_id}/jobs/{raw_posting.get('id', '')}",
        "published_at": raw_posting.get("releasedDate", ""),
        "description": "",  # filled in by fetch_posting_detail when needed
        "_source_id": str(raw_posting.get("id", "")),
        "_company_id": company_id,
    }
