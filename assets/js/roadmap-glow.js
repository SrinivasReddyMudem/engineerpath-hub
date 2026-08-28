/**
 * DevOps Engineer roadmap — glow-path renderer.
 *
 * A dedicated visual treatment for this one roadmap (not the shared
 * accordion component in roadmap-render.js, which the other 4 roadmaps
 * still use). Content — titles, what/why/learn — is read live from
 * assets/data/roadmaps.json, not duplicated here, so editing the JSON
 * is still the one place roadmap content changes. What lives only in
 * this file is presentation: which items get grouped into one visual
 * node (the 3 order-free tracks become one "Foundations" stop; Terraform
 * is folded into Cloud as a detail rather than shown as its own stop),
 * the fixed 7-node spline layout, and the outcome job-title list.
 */

// Two perfectly horizontal 3-node rows, connected by a genuine looping
// arc (with a dot marker at the apex) at each turn — matching the
// reference's actual rhythm: straight row, loop, straight row, loop, final.
const GLOW_PATH_D = "M 100 115 L 290 115 L 480 115 C 560 135, 560 275, 480 295 L 290 295 L 100 295 C 20 325, 20 445, 290 445";
const GLOW_VB_W = 600, GLOW_VB_H = 470;
const GLOW_WAYPOINTS = [
  { left: 90.0, top: 43.6 },
  { left: 10.6, top: 81.1 },
];
// Fixed positions for exactly this 7-node shape: Foundations, Docker,
// Cloud, CI/CD, Kubernetes, Projects, then the final outcome node.
const GLOW_POSITIONS = [
  { x: 100, y: 115 },
  { x: 290, y: 115 },
  { x: 480, y: 115 },
  { x: 480, y: 295 },
  { x: 290, y: 295 },
  { x: 100, y: 295 },
  { x: 290, y: 445 },
];

const GLOW_OUTCOME_JOBS = {
  devops: ["DevOps Engineer", "Site Reliability Engineer", "Platform Engineer", "Cloud Engineer", "Infrastructure Engineer"],
};

// roadmaps.json only carries an icon at the roadmap level, not per skill —
// this fills the gap for the individual stops this renderer draws.
const GLOW_NODE_ICONS = {
  linux: "🐧", git: "🔀", networking: "🌐",
  docker: "🐳", cloud: "☁️", cicd: "🔁", terraform: "🏗️",
  kubernetes: "⚓", projects: "🚀", "interview-ready": "🎯",
};

function buildGlowNodes(roadmap) {
  const tracks = roadmap.tracks || [];
  const chain = (roadmap.chain || []).slice();
  const terraformIdx = chain.findIndex((n) => n.id === "terraform");
  const terraform = terraformIdx >= 0 ? chain.splice(terraformIdx, 1)[0] : null;
  const cloudIdx = chain.findIndex((n) => n.id === "cloud");

  if (terraform && cloudIdx >= 0) {
    const cloud = chain[cloudIdx];
    chain[cloudIdx] = {
      ...cloud,
      title: `${cloud.title} + Terraform`,
      why: `${cloud.why} Once the console feels familiar, Terraform is how you stop clicking and start version-controlling your infrastructure.`,
      learn: (cloud.learn || []).concat(["HCL syntax & state management (Terraform)"]),
    };
  }

  const nodes = [];
  nodes.push({
    id: "foundations",
    icon: GLOW_NODE_ICONS[(tracks[0] && tracks[0].id) || "linux"],
    title: tracks.map((t) => t.title).join(" · "),
    what: "The things everything else in this roadmap assumes you already have.",
    why: "They don't depend on each other — learn them in any order — but nothing after this works without them.",
    learnGroups: tracks.map((t) => ({ title: t.title, items: t.learn || [] })),
  });

  chain.forEach((n) => {
    if (n.final) {
      nodes.push({
        id: n.id,
        icon: GLOW_NODE_ICONS[n.id] || "🎯",
        title: roadmap.title,
        what: n.subtitle || `You're ready to interview for ${roadmap.title} roles.`,
        final: true,
      });
    } else {
      nodes.push({
        id: n.id,
        icon: GLOW_NODE_ICONS[n.id] || "⚙️",
        title: n.title,
        what: n.what,
        why: n.why,
        learn: n.learn,
        build: n.build,
      });
    }
  });

  return nodes;
}

function glowDetailHTML(node) {
  let html = `<h4>${node.title}</h4>`;
  if (node.what) html += `<p><strong>What:</strong> ${node.what}</p>`;
  if (node.why) html += `<p><strong>Why:</strong> ${node.why}</p>`;
  if (node.learn && node.learn.length) {
    html += `<ul>${node.learn.map((l) => `<li>${l}</li>`).join("")}</ul>`;
  }
  if (node.learnGroups) {
    node.learnGroups.forEach((g) => {
      html += `<p style="margin:10px 0 2px;"><strong>${g.title}:</strong></p><ul>${g.items.map((l) => `<li>${l}</li>`).join("")}</ul>`;
    });
  }
  if (node.build) html += `<p><strong>Build:</strong> ${node.build}</p>`;
  return html;
}

function glowPageHTML(roadmap) {
  const nodes = buildGlowNodes(roadmap);
  const nodesHTML = nodes
    .map((n, i) => {
      const pos = GLOW_POSITIONS[i];
      return `
      <button class="glow-node${n.final ? " final" : ""}${i === 0 ? " start" : ""}" data-idx="${i}" data-x="${pos.x}" data-y="${pos.y}">
        <span class="glow-medallion"><span class="icon">${n.icon}</span></span>
        <span class="glow-node-label"><span class="glow-label-tick">✓</span>${n.title}</span>
      </button>`;
    })
    .join("");

  const waypointsHTML = GLOW_WAYPOINTS.map((w) => `<div class="glow-waypoint-dot" style="left:${w.left}%; top:${w.top}%;"></div>`).join("");
  const jobsHTML = (GLOW_OUTCOME_JOBS[roadmap.id] || [])
    .map((j) => `<span>${j}</span>`)
    .join("");
  const finalTitle = nodes[nodes.length - 1].title;

  return `
    <section class="hero" style="padding-top:3rem; padding-bottom:1rem;">
      <div class="wrap-narrow">
        <span class="eyebrow">${roadmap.icon} Career Roadmap</span>
        <h1 style="font-size:clamp(2rem,5vw,2.8rem);">${roadmap.title}</h1>
        <p class="dek">${roadmap.tagline} Press any step to see what it means, or watch the path light up on its own.</p>
      </div>
    </section>
    <section class="section">
      <div class="wrap-narrow">
        <div class="glow-page" id="glow-page">
          <div class="glow-inner">
            <div class="glow-controls">
              <button class="glow-replay-btn" id="glow-replay-btn">↻ Replay the journey</button>
            </div>
            <p class="glow-order-note">Related tools are grouped under the skill they belong to — press a stop to see everything it covers.</p>

            <div class="glow-detail-card" id="glow-detail-card"><button class="glow-close-detail" id="glow-close-detail" aria-label="Close">×</button><div id="glow-detail-body"></div></div>

            <div class="glow-chain-wrap" id="glow-chain-wrap">
              <svg id="glow-svg" viewBox="0 0 ${GLOW_VB_W} ${GLOW_VB_H}" preserveAspectRatio="xMidYMin meet" aria-hidden="true">
                <defs>
                  <linearGradient id="glowPathGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#7c76ea" />
                    <stop offset="100%" stop-color="#5fb0a0" />
                  </linearGradient>
                </defs>
                <path id="glow-path" class="glow-path-bg" d="${GLOW_PATH_D}" />
                <path id="glow-path-glow" class="glow-path-glow" d="${GLOW_PATH_D}" pathLength="1" />
                <g id="glow-travel-dot" opacity="0">
                  <g class="glow-dot-pulse">
                    <circle r="30" class="glow-dot-halo-outer"></circle>
                    <circle r="16" class="glow-dot-halo-inner"></circle>
                    <circle r="6" class="glow-dot-core"></circle>
                  </g>
                </g>
              </svg>
              ${waypointsHTML}
              <div class="glow-arrival-layer" id="glow-arrival-layer" style="position:absolute; inset:0;"></div>
              <div class="glow-chain-nodes" id="glow-chain-nodes">${nodesHTML}</div>
            </div>

            <div class="glow-outcome-panel" id="glow-outcome-panel">
              <div class="glow-badge">🎯</div>
              <h3>${finalTitle} — Interview Ready</h3>
              <p>This exact skill set is what these job titles actually ask for:</p>
              <div class="glow-outcome-jobs">${jobsHTML}</div>
            </div>

          </div>
        </div>
        <div class="nudge"><a href="../../" class="btn btn-outline">← Back to all paths</a></div>
      </div>
    </section>`;
}

function initGlowInteractions(roadmap) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nodes = buildGlowNodes(roadmap);

  const chainWrap = document.getElementById("glow-chain-wrap");
  const svg = document.getElementById("glow-svg");
  const pathEl = document.getElementById("glow-path-glow");
  const dot = document.getElementById("glow-travel-dot");
  const arrivalLayer = document.getElementById("glow-arrival-layer");
  const outcomePanel = document.getElementById("glow-outcome-panel");
  const detailCard = document.getElementById("glow-detail-card");
  const detailBody = document.getElementById("glow-detail-body");
  const allNodeEls = Array.prototype.slice.call(document.querySelectorAll(".glow-node"));

  allNodeEls.forEach((el) => {
    const x = parseFloat(el.dataset.x), y = parseFloat(el.dataset.y);
    el.style.left = (x / GLOW_VB_W * 100) + "%";
    el.style.top = (y / GLOW_VB_H * 100) + "%";
  });
  function sizeChainWrap() {
    const w = svg.clientWidth;
    chainWrap.style.height = (w * GLOW_VB_H / GLOW_VB_W) + "px";
  }
  window.addEventListener("resize", sizeChainWrap);
  sizeChainWrap();

  allNodeEls.forEach((el) => {
    el.addEventListener("click", () => {
      el.classList.add("pressed");
      setTimeout(() => el.classList.remove("pressed"), 160);
      const node = nodes[parseInt(el.dataset.idx, 10)];
      detailBody.innerHTML = glowDetailHTML(node);
      detailCard.classList.add("open");
      detailCard.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
    });
  });
  document.getElementById("glow-close-detail").addEventListener("click", () => detailCard.classList.remove("open"));

  function fractionAtPoint(px, py) {
    const total = pathEl.getTotalLength();
    const steps = 600;
    let best = 0, bestDist = Infinity;
    for (let i = 0; i <= steps; i++) {
      const len = total * i / steps;
      const pt = pathEl.getPointAtLength(len);
      const d = Math.hypot(pt.x - px, pt.y - py);
      if (d < bestDist) { bestDist = d; best = len; }
    }
    return best / total;
  }
  const nodeFractions = allNodeEls.map((el) => ({ el, frac: fractionAtPoint(parseFloat(el.dataset.x), parseFloat(el.dataset.y)) }));

  function spawnBurst(el) {
    const burst = document.createElement("div");
    burst.className = "glow-arrival-burst";
    burst.style.left = el.style.left;
    burst.style.top = el.style.top;
    arrivalLayer.appendChild(burst);
    setTimeout(() => burst.remove(), 650);
  }

  let played = false;
  let rafId = null;
  function playJourney() {
    if (rafId) cancelAnimationFrame(rafId);
    allNodeEls.forEach((n) => n.classList.remove("ticked"));
    outcomePanel.classList.remove("show");
    pathEl.style.transition = "none";
    pathEl.style.strokeDashoffset = "1";
    dot.style.opacity = "0";

    if (reduceMotion) {
      allNodeEls.forEach((n) => n.classList.add("ticked"));
      outcomePanel.classList.add("show");
      pathEl.style.strokeDashoffset = "0";
      return;
    }

    const travelDuration = 5200;
    const startDelay = 500;
    const total = pathEl.getTotalLength();
    const ticked = new Set();

    setTimeout(() => {
      pathEl.style.transition = `stroke-dashoffset ${travelDuration}ms linear`;
      pathEl.style.strokeDashoffset = "0";
      dot.style.opacity = "1";

      const start = performance.now();
      function frame(now) {
        const frac = Math.min((now - start) / travelDuration, 1);
        const pt = pathEl.getPointAtLength(frac * total);
        dot.setAttribute("transform", `translate(${pt.x}, ${pt.y})`);

        nodeFractions.forEach((item) => {
          if (!ticked.has(item.el) && frac >= item.frac) {
            ticked.add(item.el);
            item.el.classList.add("ticked");
            spawnBurst(item.el);
          }
        });

        if (frac < 1) {
          rafId = requestAnimationFrame(frame);
        } else {
          dot.style.opacity = "0";
          outcomePanel.classList.add("show");
        }
      }
      rafId = requestAnimationFrame(frame);
    }, startDelay);
  }

  document.getElementById("glow-replay-btn").addEventListener("click", playJourney);

  if (!("IntersectionObserver" in window)) {
    playJourney();
  } else {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !played) {
            played = true;
            playJourney();
            obs.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );
    obs.observe(chainWrap);
  }
}

async function renderGlowRoadmap(roadmapId, mountId) {
  const mount = document.getElementById(mountId);
  if (!mount) return;
  let data;
  try {
    const res = await fetch("../../assets/data/roadmaps.json", { cache: "no-store" });
    data = await res.json();
  } catch (err) {
    mount.innerHTML = `<section class="placeholder-hero wrap-narrow"><p>Couldn't load this roadmap right now — try refreshing.</p></section>`;
    console.error(err);
    return;
  }
  const roadmap = data[roadmapId];
  if (!roadmap) {
    mount.innerHTML = `<section class="placeholder-hero wrap-narrow"><p>Roadmap not found.</p></section>`;
    return;
  }
  roadmap.id = roadmapId;

  document.title = `${roadmap.title} Roadmap — EngineerPath.hub`;
  mount.innerHTML = glowPageHTML(roadmap);
  initGlowInteractions(roadmap);
}
