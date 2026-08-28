/**
 * Data-driven career roadmap renderer. Reads assets/data/roadmaps.json and
 * builds the DOM for whichever roadmap a page asks for — one component,
 * reused by every roadmap/{slug}/index.html instead of five hand-authored
 * HTML files. Adding a 6th career path later is a JSON edit, not new markup.
 */

const CIRCLED = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩","⑪","⑫","⑬","⑭","⑮","⑯","⑰","⑱","⑲","⑳"];
function circledNum(n) { return CIRCLED[n - 1] || `${n}.`; }

function nodeHTML(node, num, isTrack) {
  if (node.final) {
    const subtitle = node.subtitle ? `<div class="final-subtitle">${node.subtitle}</div>` : "";
    return `
      <a class="roadmap-node final" href="${node.link}" style="text-decoration:none; display:block;">
        <div class="row"><span class="node-n">🎯</span><span class="label">${node.title}</span><span class="chev">→</span></div>
        ${subtitle}
      </a>`;
  }
  const learnList = (node.learn && node.learn.length)
    ? `<div style="margin-top:0.6rem;"><strong>What to learn:</strong><ul style="margin:0.4rem 0 0; padding-left:1.1rem;">${node.learn.map((l) => `<li>${l}</li>`).join("")}</ul></div>`
    : "";
  const buildBlock = node.build ? `<div style="margin-top:0.6rem;"><strong>Build:</strong> ${node.build}</div>` : "";
  const videoBlock = node.video
    ? `<div class="inline-video" data-src="${node.video}"><button class="btn btn-outline inline-video-trigger" style="margin-top:0.8rem; font-size:0.85rem; padding:0.5rem 0.9rem;">${node.videoLabel || "▶ Watch"}</button></div>`
    : "";
  const resourcesBlock = node.resources ? `<div style="margin-top:0.6rem;"><a href="${node.resources}">EngineerPath resources →</a></div>` : "";

  return `
    <div class="roadmap-node${isTrack ? " track-node" : ""}" role="button" tabindex="0" aria-expanded="false">
      <div class="row"><span class="node-n">${circledNum(num)}</span><span class="label">${node.title}</span><span class="chev">⌄</span></div>
      <div class="roadmap-node-detail"><div><div class="roadmap-node-detail-inner">
        <p style="margin:0;"><strong>What:</strong> ${node.what}</p>
        <p style="margin:0.5rem 0 0;"><strong>Why:</strong> ${node.why}</p>
        ${learnList}${buildBlock}${videoBlock}${resourcesBlock}
      </div></div></div>
    </div>`;
}

function liveRoadmapHTML(roadmap) {
  let n = 0;
  const tracksHTML = (roadmap.tracks || []).map((t) => nodeHTML(t, ++n, true)).join("");
  const chainHTML = (roadmap.chain || [])
    .map((node) => (node.final ? nodeHTML(node, 0, false) : nodeHTML(node, ++n, false)))
    .join('<div class="roadmap-connector"></div>');

  return `
    <section class="hero" style="padding-top:3rem; padding-bottom:1rem;">
      <div class="wrap-narrow">
        <span class="eyebrow">${roadmap.icon} Career Roadmap</span>
        <h1 style="font-size:clamp(2rem,5vw,2.8rem);">${roadmap.title}</h1>
        <p class="dek">${roadmap.tagline} Click any step to see what it means and where to start.</p>
      </div>
    </section>
    <section class="section">
      <div class="wrap">
        <div class="roadmap-start-chip"><span>🚀 Start here</span></div>
        <p class="roadmap-section-label">Pick any of these ${roadmap.tracks.length} first — learn them in any order, they don't depend on each other.</p>
        <div class="roadmap-tracks">${tracksHTML}</div>
        <div class="roadmap-converge">↓ once you're comfortable with all ${roadmap.tracks.length} ↓</div>
        <p class="roadmap-section-label">From here it's a straight line — each step needs the one before it.</p>
        <div class="roadmap-chain">${chainHTML}</div>
        <div class="nudge"><a href="../../" class="btn btn-outline">← Back to all paths</a></div>
      </div>
    </section>`;
}

function comingSoonHTML(roadmap) {
  const chain = (roadmap.skillChainPreview || []).join(" → ");
  return `
    <section class="placeholder-hero wrap-narrow">
      <span class="icon">${roadmap.icon}</span>
      <h1>${roadmap.title} Roadmap</h1>
      <p style="font-family:'IBM Plex Mono',monospace; font-size:0.85rem; color:var(--accent);">${chain}</p>
      <p>The full interactive roadmap is coming soon — the <a href="../devops/">DevOps Engineer roadmap</a> is live now as the reference design this one will follow.</p>
      <a href="../../ask/" class="btn btn-outline" style="margin-top:1.2rem;">Ask what you need →</a>
    </section>`;
}

async function renderRoadmap(roadmapId, mountId) {
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

  document.title = `${roadmap.title} Roadmap — EngineerPath.hub`;
  mount.innerHTML = roadmap.status === "live" ? liveRoadmapHTML(roadmap) : comingSoonHTML(roadmap);

  if (roadmap.status === "live") {
    initRoadmapNodes();
    initRoadmapReveal();
    initInlineVideo();
  }
}

function initRoadmapNodes() {
  // Nodes are `div role="button"` (not a real <button>), because a node
  // can contain a real nested <button> (the video trigger) — nesting a
  // <button> inside a <button> is invalid HTML and browsers silently
  // restructure the DOM when they hit it, which broke this once already.
  const nodes = document.querySelectorAll('.roadmap-node[role="button"]');
  const toggle = (node) => {
    const isOpen = node.getAttribute("aria-expanded") === "true";
    node.setAttribute("aria-expanded", String(!isOpen));
    node.querySelector(".roadmap-node-detail")?.classList.toggle("open", !isOpen);
  };
  nodes.forEach((node) => {
    node.addEventListener("click", (e) => {
      if (e.target.closest(".inline-video-trigger")) return;
      toggle(node);
    });
    node.addEventListener("keydown", (e) => {
      if (e.target.closest(".inline-video-trigger")) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle(node);
      }
    });
  });
}

function initRoadmapReveal() {
  const targets = document.querySelectorAll(".roadmap-node");
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
    { threshold: 0.15 }
  );
  targets.forEach((t) => observer.observe(t));

  setTimeout(() => {
    document.querySelectorAll(".roadmap-node:not(.is-visible)").forEach((el) => el.classList.add("is-visible"));
  }, 3000);
}

function initInlineVideo() {
  document.querySelectorAll(".inline-video-trigger").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const wrap = btn.closest(".inline-video");
      const src = wrap.dataset.src;
      if (wrap.querySelector("video")) return;
      const video = document.createElement("video");
      video.src = src;
      video.controls = true;
      video.playsInline = true;
      video.style.cssText = "width:100%; max-width:220px; border-radius:10px; display:block; margin-top:0.7rem;";
      wrap.appendChild(video);
      video.play().catch(() => {});
      btn.style.display = "none";
    });
  });
}
