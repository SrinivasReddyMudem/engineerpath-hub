/**
 * Shared homepage interactions. No backend, no analytics dependency —
 * everything here is pure client-side DOM behavior. Respects
 * prefers-reduced-motion by relying on CSS transitions (which the
 * stylesheet already zeroes out under that media query) rather than
 * duplicating the check in JS.
 */

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initJourneyAccordion();
  initScrollReveal();
  initAudiencePlans();
  initCareerCardSpotlight();
  const playGit = initGitGraphModule();
  const playDocker = initFlowModule("docker-flow", "play-docker");
  const playCicd = initFlowModule("cicd-flow", "play-cicd");
  initLearnBySeeingAutoPlay([playGit, playDocker, playCicd]);
});

/**
 * The Git branch/merge diagram — a real SVG that draws in on click, not a
 * static picture. Tells one specific, correct story: main keeps running
 * while a feature branch splits off, gets its own commits, then merges
 * back — nothing on main changes until the merge itself.
 * Returns the play() function so it can also be triggered automatically
 * (see initLearnBySeeingAutoPlay) — the button stays for a manual replay.
 */
function initGitGraphModule() {
  const btn = document.getElementById("play-git");
  if (!btn) return null;
  const ids = ["gg-p-main", "gg-d1", "gg-p-feature", "gg-d2", "gg-d3", "gg-p-merge", "gg-d4"];
  const delays = [0, 500, 750, 1300, 1550, 1850, 2350];

  function reset() {
    ids.forEach((id) => {
      const el = document.getElementById(id);
      el.classList.remove("drawn", "shown");
    });
  }

  function play() {
    reset();
    ids.forEach((id, i) => {
      setTimeout(() => {
        const el = document.getElementById(id);
        el.classList.add(el.tagName === "circle" ? "shown" : "drawn");
      }, delays[i]);
    });
  }

  btn.addEventListener("click", play);
  return play;
}

/** Shared driver for the simple box-and-arrow flow diagrams (Docker, CI/CD)
 * — each stage lights up in sequence and stays lit, since it represents a
 * build actually passing through each stage, not a menu to choose from.
 * Returns play() for the same auto-trigger reason as initGitGraphModule. */
function initFlowModule(containerId, buttonId) {
  const container = document.getElementById(containerId);
  const btn = document.getElementById(buttonId);
  if (!container || !btn) return null;
  const steps = [...container.querySelectorAll("[data-step]")];
  const maxStep = Math.max(...steps.map((s) => Number(s.dataset.step)));

  function play() {
    steps.forEach((s) => s.classList.remove("active"));
    for (let step = 0; step <= maxStep; step++) {
      setTimeout(() => {
        steps.filter((s) => Number(s.dataset.step) === step).forEach((s) => s.classList.add("active"));
      }, step * 550);
    }
  }

  btn.addEventListener("click", play);
  return play;
}

/**
 * Plays all three Learn-by-Seeing modules automatically, once, the first
 * time a visitor scrolls the section into view — a "Play" button that
 * requires a deliberate click is friction most scrollers won't bother
 * with. The button stays on each module for a manual replay afterward.
 * Staggered starts so the three diagrams don't all animate at once.
 */
function initLearnBySeeingAutoPlay(playFns) {
  const section = document.getElementById("learn-by-seeing");
  const fns = playFns.filter(Boolean);
  if (!section || !fns.length) return;

  function playAll() {
    fns.forEach((play, i) => setTimeout(play, i * 400));
  }

  if (!("IntersectionObserver" in window)) {
    playAll();
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          playAll();
          observer.disconnect();
        }
      });
    },
    { threshold: 0.35 }
  );
  observer.observe(section);
}

/**
 * One career card at a time gets a traveling gradient-glow "spotlight,"
 * and that card's own skill-chain pops through node by node while it's
 * lit — reusing real page content as the animation, not decoration. JS
 * drives the timing directly rather than staggered CSS keyframes, which
 * was fiddly to get right for a coordinated card-to-card handoff.
 */
function initCareerCardSpotlight() {
  const cards = document.querySelectorAll("#paths .career-card");
  if (!cards.length) return;

  cards.forEach((c) => c.querySelectorAll(".skill-chain").forEach((chain) => chain.classList.add("animate")));

  let index = 0;
  let popTimeouts = [];
  let cycleTimer = null;

  // Each node's pop transition takes 0.5s (see CSS) — the stagger between
  // nodes must be at least that long, or the next node fires mid-transition
  // and nothing ever visibly settles. STAGGER sits comfortably above it so
  // each pop finishes and holds before the next one starts.
  const STAGGER = 700;
  const HOLD_AFTER_COMPLETE = 2200;

  function clearPops(card) {
    popTimeouts.forEach((t) => clearTimeout(t));
    popTimeouts = [];
    card.querySelectorAll(".chain-node.pop, .chain-arrow.pop, .chain-node.done, .chain-arrow.done").forEach((el) => el.classList.remove("pop", "done"));
  }

  function activate(i) {
    if (cycleTimer) clearTimeout(cycleTimer);
    cards.forEach((c) => c.classList.remove("spotlight"));
    const card = cards[i];
    card.classList.add("spotlight");
    const els = card.querySelectorAll(".chain-node, .chain-arrow");
    els.forEach((el, idx) => {
      popTimeouts.push(
        setTimeout(() => {
          // demote whichever element was "current" to "done" (smaller,
          // settled) before promoting this one — only one element is ever
          // at full pop-scale at a time, so the chain reads as a
          // progression instead of everything lighting up and staying lit.
          if (idx > 0) {
            els[idx - 1].classList.remove("pop");
            els[idx - 1].classList.add("done");
          }
          el.classList.add("pop");
        }, idx * STAGGER)
      );
    });

    // Total time this card needs: every node staggers in, then a real hold
    // so a viewer can actually read the completed chain before it moves on
    // — the duration adapts to how many nodes this specific card has,
    // instead of a fixed cycle length that cuts long chains off early.
    const cardDuration = els.length * STAGGER + HOLD_AFTER_COMPLETE;
    cycleTimer = setTimeout(() => {
      clearPops(cards[index]);
      index = (index + 1) % cards.length;
      activate(index);
    }, cardDuration);
  }

  function start() {
    activate(index);

    // Hovering a card takes over immediately rather than waiting for its
    // turn — the auto-cycle just resumes from there afterward, since it
    // reads the same shared `index` the hover handler updates.
    cards.forEach((card, i) => {
      card.addEventListener("mouseenter", () => {
        if (i === index) return;
        clearPops(cards[index]);
        index = i;
        activate(index);
      });
    });
  }

  if ("IntersectionObserver" in window) {
    const section = document.getElementById("paths");
    if (!section) { start(); return; }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            start();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(section);
  } else {
    start();
  }
}

function initMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.textContent = isOpen ? "✕" : "☰";
  });
}

function initJourneyAccordion() {
  const stages = document.querySelectorAll(".journey-stage");
  stages.forEach((stage) => {
    stage.addEventListener("click", () => {
      const isOpen = stage.getAttribute("aria-expanded") === "true";
      // accordion: close the others, open this one (toggle if already open)
      stages.forEach((s) => {
        s.setAttribute("aria-expanded", "false");
        s.querySelector(".journey-detail")?.classList.remove("open");
      });
      if (!isOpen) {
        stage.setAttribute("aria-expanded", "true");
        stage.querySelector(".journey-detail")?.classList.add("open");
      }
    });
  });
}

const AUDIENCE_PLANS = {
  student: {
    label: "You're a student. Here's where to start:",
    steps: [
      "Choose a career path",
      "Learn the fundamentals",
      "Build 2–3 projects",
      "Prepare your CV",
      "Practice interviews",
      "Start applying",
    ],
  },
  jobseeker: {
    label: "You're looking for a job. Here's where to start:",
    steps: [
      "Sharpen your CV",
      "Practice interview questions",
      "Search the right platforms",
      "Track your applications",
      "Prepare for technical rounds",
    ],
  },
  working: {
    label: "You're already working in tech. Here's where to start:",
    steps: [
      "Identify skill gaps for your next role",
      "Build a project that proves it",
      "Update your CV and LinkedIn",
      "Start exploring new opportunities",
    ],
  },
  switching: {
    label: "You're switching roles. Here's where to start:",
    steps: [
      "Pick your target career path",
      "Map your transferable skills",
      "Close the gaps with focused learning",
      "Build a portfolio project in the new area",
      "Reframe your CV around the new direction",
    ],
  },
};

const AUDIENCE_SESSION_KEY = "engineerpath_audience_choice";

function showAudiencePlan(key, buttons, planEl, scroll) {
  const plan = AUDIENCE_PLANS[key];
  if (!plan) return;
  buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.audience === key)));
  const steps = plan.steps
    .map((s, i) => `<div class="step"><span class="num">${String(i + 1).padStart(2, "0")}</span>${s}</div>`)
    .join("");
  planEl.innerHTML = `
    <div class="tag">Your EngineerPath recommendation</div>
    <h4>${plan.label}</h4>
    ${steps}
    <a href="#paths" class="btn btn-primary">Start my roadmap →</a>
  `;
  planEl.classList.add("open");
  if (scroll) planEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function initAudiencePlans() {
  const buttons = document.querySelectorAll(".audience-btn");
  const planEl = document.getElementById("audience-plan");
  if (!buttons.length || !planEl) return;

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      showAudiencePlan(btn.dataset.audience, buttons, planEl, true);
      try {
        sessionStorage.setItem(AUDIENCE_SESSION_KEY, btn.dataset.audience);
      } catch {
        // storage unavailable (private browsing, blocked) — the click still works for this view
      }
    });
  });

  // Remember the choice for the rest of the session — if they already told
  // us "I'm a student" and navigate back to the homepage, show that
  // recommendation again instead of making them pick a second time.
  try {
    const remembered = sessionStorage.getItem(AUDIENCE_SESSION_KEY);
    if (remembered && AUDIENCE_PLANS[remembered]) {
      showAudiencePlan(remembered, buttons, planEl, false);
    }
  } catch {
    // storage unavailable — just start unselected, no error
  }
}

function initScrollReveal() {
  const targets = document.querySelectorAll(".reveal");
  if (!targets.length) return;
  if (!("IntersectionObserver" in window)) {
    targets.forEach((t) => t.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  targets.forEach((t) => observer.observe(t));

  // Safety net: if a section somehow never intersects (e.g. a very short
  // viewport, a jump-scroll that skips the trigger, or an observer quirk),
  // force everything visible after a few seconds rather than leave content
  // permanently hidden — the animation is a nicety, not a gate on content.
  setTimeout(() => {
    document.querySelectorAll(".reveal:not(.is-visible)").forEach((el) => el.classList.add("is-visible"));
  }, 3000);
}
