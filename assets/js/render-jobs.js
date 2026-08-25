/**
 * Shared job-card rendering, used by index.html (preview) and
 * jobs/index.html (full list + filters). Reads data/jobs.json directly —
 * the page has no idea whether that file was produced by hand or by the
 * automated pipeline, by design (tech spec §4).
 */

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function jobCardHtml(job) {
  const sponsorshipLabel = job.sponsorship === "Verified" ? "🛂 Sponsorship mentioned" : "🛂 Sponsorship not stated";
  return `
    <article class="job-preview-card">
      <h4>${escapeHtml(job.title)}</h4>
      <div class="company">${escapeHtml(job.company)}</div>
      <div class="meta">
        <span class="pill accent">${escapeHtml(job.category)}</span>
        <span class="pill">📍 ${escapeHtml(job.location)}</span>
        <span class="pill">${escapeHtml(job.experience)}</span>
        <span class="pill">${sponsorshipLabel}</span>
      </div>
      <div style="margin-top:0.8rem;">
        <a href="${escapeHtml(job.source_url)}" target="_blank" rel="noopener" data-track="job_apply_click" data-job-id="${escapeHtml(job.id)}" style="font-weight:600; font-size:0.88rem;">Apply at ${escapeHtml(job.company)} →</a>
      </div>
    </article>`;
}

/**
 * options: { containerId, limit, category, keyword, experience, emptyMessage, dataPath }
 */
async function renderJobList(options) {
  const container = document.getElementById(options.containerId);
  if (!container) return;

  let jobs;
  try {
    const res = await fetch(options.dataPath || "data/jobs.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`jobs.json fetch failed: ${res.status}`);
    jobs = await res.json();
  } catch (err) {
    container.innerHTML = `<p style="grid-column:1/-1; color:var(--text-soft);">Couldn't load jobs right now — try refreshing.</p>`;
    console.error(err);
    return;
  }

  if (options.category && options.category !== "All") {
    jobs = jobs.filter((j) => j.category === options.category);
  }
  if (options.keyword) {
    const kw = options.keyword.toLowerCase();
    jobs = jobs.filter((j) => `${j.title} ${j.company}`.toLowerCase().includes(kw));
  }
  if (options.experience && options.experience !== "All") {
    jobs = jobs.filter((j) => j.experience === options.experience);
  }

  if (options.limit) jobs = jobs.slice(0, options.limit);

  if (jobs.length === 0) {
    container.innerHTML = `<p style="grid-column:1/-1; color:var(--text-soft);">${options.emptyMessage || "No matching roles right now."}</p>`;
    return;
  }

  container.innerHTML = jobs.map(jobCardHtml).join("");

  // Analytics events (tech spec §7) — no-op until an analytics tool is
  // actually wired in; the hook exists now so nothing needs restructuring later.
  container.querySelectorAll("[data-track]").forEach((el) => {
    el.addEventListener("click", () => {
      if (window.trackEvent) window.trackEvent(el.dataset.track, { jobId: el.dataset.jobId });
    });
  });
}

async function getAllCategories(dataPath) {
  const res = await fetch(dataPath || "data/jobs.json", { cache: "no-store" });
  const jobs = await res.json();
  return [...new Set(jobs.map((j) => j.category))].sort();
}
