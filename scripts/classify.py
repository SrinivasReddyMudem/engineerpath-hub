"""Keyword-based category classification against the locked taxonomy
(strategy doc §2 / tech spec §2). Matches against the job title only —
matching full description text mislabeled a Celonis marketing role as
"Embedded & Automotive" from an unrelated ordinary-English use of the word
"embedded" in its body text. First category with a hit wins, checked in an
order that puts more specific categories before generic ones.
"""
import re

CATEGORY_KEYWORDS = [
    ("Embedded & Automotive", [
        "embedded", "autosar", "ecu", "can bus", "automotive", "firmware",
        "rtos", "microcontroller", "diagnostics", "functional safety",
    ]),
    ("DevOps & Cloud", [
        "devops", "kubernetes", "docker", "terraform", "ci/cd", "cloud engineer",
        "site reliability", "aws", "azure", "gcp",
    ]),
    ("Data & AI", [
        "machine learning", "data scientist", "data science", " ai ", "artificial intelligence",
        "computer vision", "nlp", "data engineer",
    ]),
    ("Cybersecurity", [
        "security engineer", "cybersecurity", "penetration test", "infosec", "application security",
    ]),
    ("Testing & QA", [
        "qa engineer", "test engineer", "quality assurance", "test automation",
    ]),
    ("Systems / Engineering", [
        "systems engineer", "avionics", "propulsion", "aerospace", "hardware engineer",
        "electrical engineer", "mechanical engineer",
    ]),
    ("Software Development", [
        "software engineer", "backend", "frontend", "full stack", "full-stack",
        "software developer", "application engineer",
    ]),
]


def classify(title: str, description: str = "") -> str:
    # Title only. An earlier version matched full description text and
    # mis-tagged a Celonis "Executive Briefing Center Lead" role as
    # "Embedded & Automotive" — some unrelated sentence in the body used the
    # word "embedded" in its ordinary English sense. Title is a much cleaner
    # signal; a false positive there is far less likely.
    text = title.lower()
    for category, keywords in CATEGORY_KEYWORDS:
        # Word-boundary match, not substring containment — a naive `in`
        # check on "ecu" matched inside "Executive", mistagging an
        # "Executive Briefing Center Lead" and two "Account Executive"
        # roles as Embedded & Automotive. \b anchors stop that class of bug
        # for every keyword, not just the ones caught by hand so far.
        if any(re.search(rf"\b{re.escape(kw.strip())}\b", text) for kw in keywords):
            return category
    # No honest match. Earlier this defaulted to "Software Development",
    # which mislabeled real non-software roles (Isar Aerospace manufacturing
    # technicians, structural engineers) into a category their audience
    # would trust and click expecting a coding job. Uncategorized instead —
    # fetch_jobs.py drops these rather than publish a guess as a fact.
    return "Uncategorized"
