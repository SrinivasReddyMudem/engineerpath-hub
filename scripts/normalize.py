"""Finishes the schema (tech spec §3) that source adapters leave partial:
deterministic id, is-it-actually-Germany, sponsorship keyword match,
experience-band guess, and the fields that don't vary by source.
"""
import html
import re
from datetime import date, datetime, timezone

from classify import classify

GERMANY_MARKERS = [
    "germany", "deutschland",
    "berlin", "munich", "münchen", "stuttgart", "hamburg", "frankfurt",
    "cologne", "köln", "düsseldorf", "dusseldorf", "leipzig", "dresden",
    "ottobrunn", "gilching", "paderborn", "bruchsal", "wolfsburg",
]

SPONSORSHIP_KEYWORDS = [
    "visa sponsorship", "visa support", "relocation support", "relocation assistance",
    "work permit assistance", "work permit support", "visa assistance",
]

EXPERIENCE_MARKERS = [
    ("Internship / Student", ["intern", "working student", "werkstudent", "praktikum"]),
    ("Entry-level (0-2 years)", ["junior", "graduate", "entry level", "early career"]),
    ("Senior (6+ years)", ["senior", "principal", "staff", "lead ", "head of"]),
]


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return re.sub(r"-{2,}", "-", text).strip("-")


def is_germany(location: str, country_code: str = "") -> bool:
    if country_code and country_code.upper() in ("DE", "DEU"):
        return True
    loc = (location or "").lower()
    return any(marker in loc for marker in GERMANY_MARKERS)


def detect_sponsorship(description: str) -> str:
    text = (description or "").lower()
    return "Verified" if any(kw in text for kw in SPONSORSHIP_KEYWORDS) else "Not stated"


def guess_experience(title: str) -> str:
    t = title.lower()
    for band, markers in EXPERIENCE_MARKERS:
        if any(m in t for m in markers):
            return band
    return "Mid-level (3-5 years)"  # honest default — most listings don't say, this isn't a claim of certainty


def to_schema_record(common: dict) -> dict:
    """common: the partial dict a source adapter produced (see sources/*.py).
    Returns a full record matching tech spec §3, or None if it's not Germany."""
    country_code = common.get("_country_code", "")
    if not is_germany(common.get("location", ""), country_code):
        return None

    title = common["title"]
    company = common["company"]
    # Greenhouse's `content` field comes back HTML-entity-escaped (literal
    # "&lt;div&gt;" instead of "<div>") — unescape once so it's real,
    # renderable HTML rather than escaped text a reader would see verbatim.
    description = html.unescape(common.get("description", ""))
    today = date.today().isoformat()

    return {
        "id": f"{slugify(company)}-{slugify(title)}-{common.get('_source_id', '')[:8]}",
        "title": title,
        "company": company,
        "location": common.get("location", "") or "Germany",
        "country": "Germany",
        "category": classify(title, description),
        "experience": guess_experience(title),
        "employment_type": common.get("employment_type", "Full-time"),
        "english_possible": "Unknown",
        "sponsorship": detect_sponsorship(description),
        "source": common["source"],
        "source_url": common["source_url"],
        "company_url": common.get("company_url", ""),
        "published_at": common.get("published_at", "") or today,
        "last_seen_at": today,
        "description": description,
        "status": "open",
    }
