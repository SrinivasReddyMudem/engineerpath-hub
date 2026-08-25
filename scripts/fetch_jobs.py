"""Orchestrates the pipeline locked in the tech spec §4:
source adapter -> normalize -> Germany filter -> classify -> dedupe -> jobs.json

Run from the scripts/ directory (or with sources/ and scripts/ both on
sys.path): python fetch_jobs.py

Companies here are only ones with a *directly verified* working API call
(see sources/greenhouse.py and sources/smartrecruiters.py for verification
notes) — never add one on a guess. "govector" (assumed Vector Informatik)
was tried and dropped after it 404'd on both the API and the page itself.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "sources"))

import greenhouse  # noqa: E402
import smartrecruiters  # noqa: E402
from normalize import to_schema_record  # noqa: E402
from deduplicate import merge_jobs  # noqa: E402

DATA_PATH = Path(__file__).parent.parent / "data" / "jobs.json"

GREENHOUSE_COMPANIES = [
    {"board_token": "celonis", "company_name": "Celonis", "company_url": "https://www.celonis.com"},
    {"board_token": "contentful", "company_name": "Contentful", "company_url": "https://www.contentful.com"},
    {"board_token": "isaraerospace", "company_name": "Isar Aerospace", "company_url": "https://www.isaraerospace.com"},
]

SMARTRECRUITERS_COMPANIES = [
    {"company_id": "VolocopterGmbH", "company_name": "Volocopter", "company_url": "https://www.volocopter.com"},
]


def collect_greenhouse() -> list[dict]:
    records = []
    for cfg in GREENHOUSE_COMPANIES:
        try:
            raw_jobs = greenhouse.fetch_raw_jobs(cfg["board_token"])
        except Exception as exc:
            print(f"  [greenhouse:{cfg['board_token']}] fetch failed: {exc}")
            continue
        for raw in raw_jobs:
            common = greenhouse.to_common_shape(raw, cfg["company_name"], cfg["board_token"])
            common["company_url"] = cfg["company_url"]
            record = to_schema_record(common)
            if record:
                records.append(record)
        print(f"  [greenhouse:{cfg['board_token']}] {len(raw_jobs)} total, "
              f"{sum(1 for r in records if r['company'] == cfg['company_name'])} in Germany")
    return records


def collect_smartrecruiters() -> list[dict]:
    records = []
    for cfg in SMARTRECRUITERS_COMPANIES:
        try:
            raw_postings = smartrecruiters.fetch_raw_jobs(cfg["company_id"])
        except Exception as exc:
            print(f"  [smartrecruiters:{cfg['company_id']}] fetch failed: {exc}")
            continue
        for raw in raw_postings:
            common = smartrecruiters.to_common_shape(raw, cfg["company_name"], cfg["company_id"])
            common["company_url"] = cfg["company_url"]
            # description isn't in the list response — only fetch detail for
            # postings that look Germany-based, to keep API calls reasonable
            record = to_schema_record(common)
            if record:
                try:
                    detail = smartrecruiters.fetch_posting_detail(cfg["company_id"], common["_source_id"])
                    record["description"] = detail.get("jobAd", {}).get("sections", {}).get("jobDescription", {}).get("text", "")
                except Exception:
                    pass  # keep the record even if the detail call fails
                records.append(record)
        print(f"  [smartrecruiters:{cfg['company_id']}] {len(raw_postings)} total, "
              f"{sum(1 for r in records if r['company'] == cfg['company_name'])} in Germany")
    return records


def main():
    print("Fetching from verified sources...")
    fresh = collect_greenhouse() + collect_smartrecruiters()

    existing = []
    if DATA_PATH.exists():
        existing = json.loads(DATA_PATH.read_text(encoding="utf-8"))

    merged = merge_jobs(existing, fresh)
    before = len(merged)
    merged = [r for r in merged if r["category"] != "Uncategorized"]
    dropped = before - len(merged)
    if dropped:
        print(f"\nDropped {dropped} role(s) that didn't honestly match a category "
              f"(e.g. manufacturing/structural titles) rather than mislabel them.")
    merged.sort(key=lambda r: r["published_at"], reverse=True)

    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    DATA_PATH.write_text(json.dumps(merged, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"\n{len(merged)} Germany engineering roles written to {DATA_PATH}")
    by_category = {}
    for r in merged:
        by_category[r["category"]] = by_category.get(r["category"], 0) + 1
    for cat, count in sorted(by_category.items(), key=lambda x: -x[1]):
        print(f"  {cat}: {count}")


if __name__ == "__main__":
    main()
