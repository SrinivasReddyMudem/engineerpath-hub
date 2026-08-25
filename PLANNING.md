# EngineerPath.hub

**LIVE:** https://srinivasreddymudem.github.io/engineerpath-hub/ (GitHub Pages, deployed 2026-08-25) — real, public, permanent, verified working (homepage + roadmap/devops/ + germany/study/ + jobs/ + all CSS/JS/data assets all return HTTP 200 on the actual deployed URL, not just localhost).

**Repo:** https://github.com/SrinivasReddyMudem/engineerpath-hub — public (required for free-tier Pages), separate from the `manimations` repo (the Instagram Reel-generation pipeline, unrelated tech stack) — kept as two repos deliberately, confirmed with the user rather than assumed: different purpose/stack, `manimations` may be private and shouldn't be forced public just to get this site live, and mixing large video-render history with website commit history would make both messier.

**Rebranded from "EngineerPath Germany" on 2026-08-24.** Broader positioning now: an engineering career platform — "Learn. Build. Prepare. Grow." — for engineering students and early-career engineers generally. Germany is one specialized pathway inside it (`/germany/`), not the site's identity; it must not dominate the homepage. Repo/folder renamed `engineerpath-germany` → `engineerpath-hub` to match. Note: `EngineerPath.hub` is the brand *wordmark* only — `.hub` is still not a real, working domain (Web3-only, confirmed earlier), so the actual deployed URL stays a real free subdomain until a proper domain is bought.

Everything below from the original Germany-focused plan is still valid and reused — the jobs pipeline, the compliance rules, the monetization model — just recontextualized as one pathway (`/germany/study/`, `/germany/work/`) rather than the whole product.

This file exists so a new session (or a new Claude Code tab) opened in this folder knows the plan without re-deriving it. Full reasoning lives in two Claude artifacts (still under their original "Germany" titles/URLs — the content applies, just read it through the new positioning) — read these before making any strategy or architecture change:

- **Strategy:** https://claude.ai/code/artifact/e06158cc-f2b7-4601-9df6-547cf31a9f6c — positioning, the 8-stage journey, audience psychology, monetization (1:1 support / affiliate / ads, in that readiness order — not sequential gates), compliance (GDPR, Impressum, no fake urgency, no immigration-advice framing), 30-day plan, KPIs.
- **Tech spec:** https://claude.ai/code/artifact/b98d076c-e842-4471-a925-0df6f251e0b3 — job JSON schema, source-adapter pipeline, category taxonomy, readiness-scoring weights, analytics events, repo structure, deploy process.

## Locked decisions (verified live, not guessed — don't re-research these)

- **4 companies confirmed on a supported ATS by actually running the API call**, not just trusting a search result — a 5th (Vector Informatik, token `govector`) was in an earlier draft but 404'd on direct testing and was dropped:
  | Company | ATS | Board | Germany roles live now |
  |---|---|---|---|
  | Isar Aerospace | Greenhouse | `isaraerospace` | 88 |
  | Celonis | Greenhouse | `celonis` | 56 |
  | Contentful | Greenhouse | `contentful` | 0 (correctly wired, no current openings) |
  | Volocopter | SmartRecruiters | `VolocopterGmbH` | 0 (correctly wired, confirmed via careers page — genuinely 0 open roles) |
- Large legacy OEMs (BMW confirmed on SAP SuccessFactors; Bosch/Continental/ZF likely same class) are **ruled out** as V1 targets — don't default back to big names, verify each candidate's ATS by actually calling its API before adding it.
- StepStone and Google for Jobs have **no free public read-API** — ruled out.
- Never label a job "visa sponsor" on inference — only on an explicit keyword match in the posting text (`visa sponsorship`, `relocation support`, `work permit`, `visa assistance`); default is `Not stated`.
- Form backend: **Tally**, not Formspree (Formspree's free tier caps at 50 submissions/month; Tally's is uncapped — verified live).
- Cover-letter tool: template-based, no AI API call — keeps it $0.
- Hosting + automation: **GitHub Pages + GitHub Actions** (daily schedule), one platform, no separate host, no VPS/DB.
- The website only ever reads `data/jobs.json` as a flat file — completely decoupled from how it was produced, so nothing in the HTML/JS needs to change when a source adapter is added or swapped.
- `.hub` is currently a Web3-only domain extension and won't open in a normal browser — not usable. No domain owned yet; launch on the GitHub Pages URL.
- Application Tracker (Company/Role/Status, localStorage, no backend) is in **V1** scope, not deferred.
- Explicitly **not** V1: salary/rent calculator, the separate Journey Tracker, newsletter, WhatsApp community, AI-assisted intake classification, affiliate links, ads.

## Status

Planning complete across 7 rounds of review. **The jobs pipeline is real and working** — `scripts/fetch_jobs.py`, `sources/greenhouse.py`, `sources/smartrecruiters.py`, `scripts/normalize.py`, `scripts/classify.py`, `scripts/deduplicate.py` all exist and run, producing `data/jobs.json` with 31 honestly-categorized Germany roles. Three real bugs were found and fixed by actually running it (not caught by inspection):
1. Category matching against full description text mislabeled a marketing role as "Embedded & Automotive" from an unrelated use of the word "embedded" — fixed to title-only matching.
2. Naive substring keyword match: `"ecu"` matched inside `"Executive"`, mislabeling sales roles — fixed to regex word-boundary matching.
3. Titles that didn't honestly match any category were defaulting to "Software Development" — fixed to drop them instead of guessing (118 of 144 fetched roles were correctly excluded this way).

`js/readiness.js` and `js/grade-converter.js` are also now real, validated code:
- **Readiness scoring** ran against 3 sample profiles and caught a real design bug: picking "weakest factor" by raw score alone let German (which floors at 10 for anyone who doesn't speak it) dominate the recommendation almost every time, even when 0-years-experience or a poor role-target-match were more actionable. Fixed: weakest factor is now picked by weighted improvement potential (`weight * (100 - score)`), which produced three genuinely distinct, situation-specific recommendations across the 3 test profiles.
- **Grade converter** (Modified Bavarian Formula) validated against its own mathematical invariants — 100%/perfect CGPA must convert to exactly German 1.0, minimum-passing must convert to exactly German 4.0. Both hold exactly.

**Only remaining Phase 0 item: the Tally form.** Needs a human — creating a free Tally account and building the form isn't something that can be done without you. Fields (already locked, tech spec §10):
```
Name, Email
I'm looking for: [ ] Germany jobs  [ ] CV  [ ] Interview  [ ] Career
                 [ ] Technical     [ ] Git/Software  [ ] Other
Experience:      Student / 0-2 / 3-5 / 6-10 / 10+
What are you trying to achieve?  [free text]
Would you like personal help?    No / Maybe / Yes
```
Once that exists, submit one real test entry and confirm it's received — then Phase 0 is fully closed.

## Pages built so far (post-rebrand, clean-URL structure)

**Phase 1 homepage build is done and browser-verified** — served locally, driven with real headless Chromium (Playwright: desktop, mobile viewport, reduced-motion, no-JS, keyboard), not assumed to work from the code alone. New visual system: Space Grotesk (display) + Inter (body) + IBM Plex Mono (data), restrained indigo accent, Linear/GitHub/Notion-inspired — no gradients, no fake stats.

Built: `index.html` (hero, 8-stage journey accordion, audience-path cards with client-side personalized recs, 6 Explore cards, Popular Right Now, Job Search Hub preview pulling real data, Germany pathway preview, trust section, footer), `jobs/index.html` (full search guide + filterable real feed + Application Tracker), `legal/privacy/` and `legal/impressum/` (real content, Impressum has explicit `<!-- FILL IN -->` placeholders for legal name/address — cannot be fabricated), and stub "coming soon" pages for every other nav destination (`learn/`, `interview/`, `career/`, `tools/readiness/`, `germany/`, `germany/study/`, `germany/work/`, `ask/`) so nothing 404s.

**Two real bugs found and fixed by actually testing in a browser, not just writing the code:**
1. Mobile horizontal overflow — the off-canvas nav menu was a full-viewport-width `position:fixed` box hidden via `transform: translateX(100%)`; that transform still counted toward `document.documentElement.scrollWidth` in the real browser even though it was visually off-screen. Fixed by making the drawer a fixed 300px/82vw width instead of full-viewport, plus `overflow-x:hidden` on `html`.
2. **More serious**: scroll-reveal sections (`.reveal`, opacity:0 until scrolled into view) had no fallback — if JavaScript ever failed to load, that content (audience cards, Explore, Popular, jobs preview, Germany pathway, trust section) would stay invisible **forever**, violating the explicit "works if JS fails for core content" requirement. Fixed with progressive enhancement: `.reveal` hiding is scoped to `html.js` only (added by an inline head script before paint), so no-JS visitors see everything immediately; plus a 3-second `setTimeout` safety net in case the scroll observer ever misses a section. Verified all three paths: normal scroll, the timeout fallback with zero scrolling, and JS fully disabled.

Also confirmed *not* a bug: "Application Product Manager - AI System Transformations" at Celonis appears twice in the feed — two genuinely distinct Greenhouse job IDs, real separate postings.

**Homepage architecture revised (2026-08-24, same day):** the 8-stage accordion and the "Where are you right now?" audience-card section were both removed after review — replaced with a "What do you want to become?" grid of 5 career-path cards (Software Engineer / DevOps / Embedded / AI-ML / Cybersecurity), each with a skill-chain preview and a link to a dedicated roadmap page. Hero rewritten with 4 CTA cards (Learn / Find a Job / Interviews / Explore) instead of two generic buttons. Jobs section repositioned lower with new framing + a static platform-chips row. Germany section toned down (no more full shaded panel — just a bordered strip, equal visual weight to other sections). Trust section reworked into 3 named pillars (Practical / Visual / Honest).

**New signature feature, built as the reference design**: `roadmap/devops/index.html` — a real interactive roadmap (3 parallel starting nodes — Linux/Git/Networking — converging into a single chain: Docker → Cloud → CI/CD → Terraform → Kubernetes → Projects → Interview Ready). Nodes are an accordion (click or keyboard Enter/Space to expand), scroll-reveal as you scroll down, with the same no-JS/timeout safety net as the homepage. The Git node embeds a real 2-minute Git explainer video, reused from the existing `manimations/` project (`git_how_git_works_scene`, copied to `assets/media/git-how-it-works.mp4`) — played on click, not autoplayed. The other 4 career paths get honest "coming soon, DevOps is the reference design" stub pages at `roadmap/{software-engineer,embedded,ai-ml,cybersecurity}/` — Phase 2, not built yet, per the user's own explicit sequencing ("don't build all 5 roadmaps at once").

**One real bug this round, caught only by actually running it in a browser**: the Git node's video-watch button is a real `<button>` nested inside the node's own `<button>` wrapper — invalid HTML (buttons can't nest), which made the browser silently restructure the DOM and broke the click handler (`closest()` returned null). Fixed by converting `.roadmap-node` to the proper ARIA pattern (`div role="button" tabindex="0"`) with manual Enter/Space keyboard handling, verified working via real keyboard-triggered activation, not just click.

Note: `manimations/` (the separate Reel-series project) has a large pile of uncommitted changes and is 1 commit behind origin — unrelated to this project, flagged to the user, not touched.

**Roadmap architecture rebuilt as data-driven (2026-08-25):** replaced five (planned) hand-authored roadmap HTML files with one reusable renderer. Content now lives in `assets/data/roadmaps.json`; every `roadmap/{slug}/index.html` is a thin wrapper (`<main id="roadmap-mount">` + `<script>renderRoadmap("slug","roadmap-mount")</script>`) that fetches the JSON and builds the DOM via `assets/js/roadmap-render.js`. Adding a 6th career path is now a JSON edit, not new markup. Node schema enriched per this round's decision: `what` / `why` / `learn[]` / `build` / `video` / `resources`, rendered generically — the video-trigger pattern from the Git node is no longer DevOps-specific, any node in any future roadmap can carry a `video` field and get the same "▶ Watch" behavior.

**Content decisions locked this round:**
- 5th career path: **Cybersecurity Engineer → Cloud Engineer** (`Linux → Networking → Cloud → Containers → IaC`). The old `roadmap/cybersecurity/` stub was deleted, not left as a dead orphan.
- Embedded roadmap skill chain upgraded to the domain-specific version: `C/C++ → MCU → RTOS → CAN → AUTOSAR`.
- Germany **stays** as hero door #4, equal visual weight to the other 3 — explicitly reconfirmed after earlier back-and-forth on this exact point.
- Audience-plan section (student/job-seeker/working/switching) keeps its full 5–6 step numbered plans — explicitly not simplified to one-liners.
- New "Learn by Seeing" homepage section added, honestly scoped: only the Git card links to real content (the actual video, via the DevOps roadmap) — Docker and CI/CD cards are visibly labeled "Coming soon" rather than linking to explainers that don't exist yet.
- One tasteful visual exception added: a very low-opacity radial glow behind the hero only (`--accent-soft`) — the one deliberate departure from "no gradients," confined to a single spot, not used elsewhere.

**Real regression caught by testing, not shipped silently:** the data-driven rendering is 100% JS-driven (`fetch` + `innerHTML`), so a no-JS visitor to any roadmap page now sees nothing without a fallback — a real step backward from the no-JS discipline built into the rest of the site. True full parity would need server-side rendering, which contradicts the "no framework/backend" rule already locked for this project, so the fix is a `<noscript>` block with an honest message + a link back to the homepage (plus a `<style>` inside the `noscript` to hide the JS-only "Loading roadmap…" placeholder, so the two don't show stacked together). Documented here as a known, accepted limitation of the data-driven approach — not something to consider "fixed," just handled honestly.

Everything above was re-verified in a real browser after the rebuild (desktop, mobile, no-JS, scroll-through, keyboard) — not assumed to still work just because the old hardcoded version did.

**Skill-chain animation — went through 3 real iterations, not accepted on the first pass:**
1. First version: plain text color/glow shift per node, CSS-only, one-shot on scroll + hover-replay. User feedback: technically running (confirmed via computed-style sampling) but not humanly noticeable — 0.76rem mono text is too small a canvas for a color flicker.
2. Second version: made it loop continuously (`animation-iteration-count: infinite`, all 5 cards' chains looping independently and simultaneously). User feedback: this read as "busy," not "wow."
3. **Final version, adopted**: a single traveling "spotlight" — one career card at a time gets a gradient-glow border (`linear-gradient(135deg, var(--accent), var(--de-accent))` via the standard two-layer background-clip border trick) + lift + soft ambient shadow, cycling card-to-card every 2.6s (JS-driven `setInterval`, not staggered CSS keyframes — far easier to get a coordinated handoff right). While a card is lit, its own skill-chain pops through node-by-node as solid gradient-filled pills. Calmer overall (only one focal point of motion at a time) while still continuously catching the eye, and it reuses real page content as the animation rather than being pure decoration.

All three versions were verified in a real browser, not just written — the final one confirmed: spotlight actually advances Software Engineer → DevOps → Embedded on schedule, chain nodes visibly pop in the currently-lit card, a lit card still exists (state, if not motion) under `prefers-reduced-motion`, and the chain degrades to plain readable static text with JS off.

**UX/value-hierarchy pass (2026-08-25, after a design/UX-strategist review round):** mostly validated what was already built — the hero copy, 5 career paths, jobs framing, Germany restraint, and roadmaps.json architecture were all confirmed as-is, not reworked. Concrete changes made:
- Hero doors reworded to first-person framing ("I don't know where to start" / "I want to become an engineer" / "I'm preparing for a job" / "I'm exploring Germany") — self-identification reads stronger than imperative copy.
- Roadmap's final "Interview Ready" node now gets the same gradient-border/glow treatment as the career-card spotlight — it's the actual finish line, not another step.
- Audience-plan recommendation box restyled to feel generated (gradient border, "Your EngineerPath recommendation" tag, numbered 01/02/03 steps) instead of a flat tip box.
- Career-card spotlight: hovering a card now interrupts the auto-cycle and lights that card immediately; auto-cycling resumes from there after.
- Audience persona choice (student/job-hunter/tech-professional/career-switcher — relabeled from the earlier version) is now remembered for the session via `sessionStorage` — reload the homepage and the same recommendation reappears instead of asking again.
- `germany/`, `germany/study/`, `germany/work/` went from bare "coming soon" stubs to real content, using sources already verified earlier in this project (DAAD International Programmes, DAAD Scholarships, uni-assist, Make it in Germany, Make it in Germany's work-rules page, DSW) — no new research needed, just wiring in what was already confirmed live.
- Trust section reworded — briefly went to a 4-point version, then a *later* message in the same round explicitly reverted to a simpler 3-point one ("Practical, not generic / Honest by design / Sources, not guesses" + "Built by an engineer. For engineers."). Caught before implementing the 4-point version, so no wasted rework.
- "What's next" nudges added to `jobs/` (→ interview prep) and `germany/study/` (→ the work path).

Explicitly NOT built this round, consistent with the standing scoping discipline: the path-comparison table (explicitly flagged by the user as "valuable later," not now), a founder bio/photo (would require fabricating content — needs the user's real input), and "why this job fits you" reasoning on job cards (would need a real skill-matching feature that doesn't exist — no fake relevance text).

Still to build: real content for `learn/`, `interview/`, `career/`, `tools/readiness/` (the readiness.js logic exists and is validated, just not wired into a page yet), the 4 remaining roadmaps' full node content (currently "coming soon" stubs — DevOps is the only one with real per-node data in `roadmaps.json`), the Ask EngineerPath form (blocked on the user creating the Tally form), and `.github/workflows/update-jobs.yml`. Aspirational, explicitly deferred: real teaching animations (Git branch/merge, Docker packaging, CI/CD pipeline flow) and an actual animated SVG "path draws itself" scroll effect — both described in review briefs but not built; the only real animated asset remains the pre-rendered Git video.

## Repo layout (post-rebrand, clean URLs — supersedes the old flat structure)

```
engineerpath-hub/
├── index.html                                                            ✓ built, browser-verified — hero, career cards (animated chains),
│                                                                            Learn-by-Seeing, audience plans, jobs/Germany/trust
├── jobs/index.html                                                       ✓ built, browser-verified
├── roadmap/{software-engineer,devops,embedded,ai-ml,cloud}/index.html    ✓ thin wrappers — data-driven, see roadmaps.json (devops = "live", rest = "coming-soon")
├── legal/privacy/, legal/impressum/                                      ✓ real content, Impressum needs the user's legal details
├── learn/, interview/, career/, tools/readiness/,                        ✓ "coming soon" stubs, no dead links
│   germany/, germany/study/, germany/work/, ask/
├── assets/css/style.css                                                  ✓ Linear/GitHub/Notion-inspired system + one hero glow exception
├── assets/js/site.js                                                     ✓ mobile nav, scroll reveal, audience plans, skill-chain animation
├── assets/js/roadmap-render.js                                           ✓ data-driven roadmap renderer (reads assets/data/roadmaps.json)
├── assets/js/render-jobs.js, tracker.js                                  ✓ built and browser-verified
├── assets/js/readiness.js, grade-converter.js                            ✓ built and validated (not wired into a page yet)
├── assets/data/roadmaps.json                                             ✓ real, DevOps fully populated, other 4 have preview-only data
├── assets/media/git-how-it-works.mp4                                     ✓ reused from manimations/git_how_git_works_scene
├── data/jobs.json                                                        ✓ real, 31 roles
├── scripts/fetch_jobs.py, normalize.py, classify.py, deduplicate.py      ✓ built and run
├── sources/greenhouse.py, smartrecruiters.py                             ✓ built and run
└── .github/workflows/update-jobs.yml                                     ← not built yet (daily schedule, tech spec §13)
```

Note: as of this writing, `node_modules/` (Playwright, installed repeatedly for browser testing) and some `scratch_*` test files are sitting in the repo root — cleanup was requested once this session and the user declined that specific attempt, so they're intentionally left in place rather than force-removed. Worth clearing before any real `git add`/push (already covered by `.gitignore` for `node_modules`, but the `scratch_*` files are not).
