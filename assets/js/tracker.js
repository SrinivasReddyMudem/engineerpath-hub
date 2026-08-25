/**
 * Application Tracker — Company / Role / Status, localStorage only.
 * Strategy doc §8: "a second, distinct localStorage tool" from the
 * Journey Tracker (Phase 2) — this one is in V1.
 */

const TRACKER_KEY = "engineerpath_applications";
const STATUSES = ["Saved", "Applied", "Interview", "Rejected", "Offer"];

function loadApplications() {
  try {
    const raw = localStorage.getItem(TRACKER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return []; // private browsing / storage blocked — degrade to empty, don't crash
  }
}

function saveApplications(apps) {
  try {
    localStorage.setItem(TRACKER_KEY, JSON.stringify(apps));
  } catch {
    // storage unavailable — silently no-op, the UI still works for the session
  }
}

function initTracker(rowsContainerId, addButtonId) {
  const rowsEl = document.getElementById(rowsContainerId);
  const addBtn = document.getElementById(addButtonId);
  if (!rowsEl || !addBtn) return;

  let apps = loadApplications();
  if (apps.length === 0) {
    apps = [{ company: "", role: "", status: "Saved" }];
  }

  function render() {
    rowsEl.innerHTML = apps.map((app, i) => `
      <tr>
        <td><input type="text" value="${escapeAttr(app.company)}" placeholder="Company" data-i="${i}" data-field="company"></td>
        <td><input type="text" value="${escapeAttr(app.role)}" placeholder="Role" data-i="${i}" data-field="role"></td>
        <td>
          <select data-i="${i}" data-field="status">
            ${STATUSES.map((s) => `<option value="${s}" ${s === app.status ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </td>
        <td><button class="rm" data-i="${i}" title="Remove">✕</button></td>
      </tr>
    `).join("");

    rowsEl.querySelectorAll("input, select").forEach((el) => {
      el.addEventListener("input", (e) => {
        const i = Number(e.target.dataset.i);
        apps[i][e.target.dataset.field] = e.target.value;
        saveApplications(apps);
      });
    });
    rowsEl.querySelectorAll(".rm").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        apps.splice(Number(e.target.dataset.i), 1);
        saveApplications(apps);
        render();
      });
    });
  }

  function escapeAttr(str) {
    return (str ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  }

  addBtn.addEventListener("click", () => {
    apps.push({ company: "", role: "", status: "Saved" });
    saveApplications(apps);
    render();
  });

  render();
}
