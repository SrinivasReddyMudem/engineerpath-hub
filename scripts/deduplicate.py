"""Implements the update/remove logic locked in the strategy doc §5:
new -> add, changed -> update, missing from today's fetch -> remove,
same id seen twice in one run -> merge (keep first, skip the repeat).
This is what stops a "posted 4 months ago" listing from lingering.
"""
from datetime import date


def merge_jobs(existing: list[dict], freshly_fetched: list[dict]) -> list[dict]:
    fresh_by_id = {}
    for job in freshly_fetched:
        if job["id"] in fresh_by_id:
            continue  # duplicate within this run -> merge by keeping the first
        fresh_by_id[job["id"]] = job

    existing_by_id = {job["id"]: job for job in existing}
    today = date.today().isoformat()
    result = []

    for job_id, fresh_job in fresh_by_id.items():
        if job_id in existing_by_id:
            # still open -> update, but keep the original published_at
            fresh_job["published_at"] = existing_by_id[job_id].get("published_at", fresh_job["published_at"])
        fresh_job["last_seen_at"] = today
        fresh_job["status"] = "open"
        result.append(fresh_job)

    # anything that existed before but wasn't in today's fetch is gone from
    # the source -> drop it entirely, don't just mark it closed and keep it around
    return result
