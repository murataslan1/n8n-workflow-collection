/* n8n Workflow Collection — App Logic */

const PER_PAGE = 24;
let allWorkflows = [];
let filteredWorkflows = [];
let currentPage = 1;
let currentCategory = "all";
let searchQuery = "";
let data = null;

// ── Helpers ──
function cleanNodeName(node) {
  return node
    .replace("@n8n/n8n-nodes-langchain.", "")
    .replace("n8n-nodes-base.", "")
    .replace(/([A-Z])/g, " $1")
    .trim();
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ── Data Loading ──
async function loadData() {
  try {
    const resp = await fetch("data/workflows.json");
    data = await resp.json();
    allWorkflows = data.workflows;
    filteredWorkflows = [...allWorkflows];

    renderStats();
    renderCategories();
    renderWorkflows();
  } catch (err) {
    document.getElementById("workflowGrid").innerHTML =
      `<div class="empty-state"><span class="emoji">❌</span>Failed to load workflows. Please try again.</div>`;
    console.error(err);
  }
}

// ── Stats ──
function renderStats() {
  document.getElementById("statWorkflows").textContent = data.totalWorkflows.toLocaleString();
  document.getElementById("statCategories").textContent = data.totalCategories;
  document.getElementById("statIntegrations").textContent = data.totalIntegrations;
}

// ── Categories ──
function renderCategories() {
  const container = document.getElementById("categoryFilters");
  const allBtn = container.querySelector('[data-category="all"]');
  allBtn.textContent = `All (${data.totalWorkflows})`;

  data.categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "cat-btn";
    btn.dataset.category = cat.name;
    btn.textContent = `${cat.name} (${cat.count})`;
    btn.addEventListener("click", () => selectCategory(cat.name));
    container.appendChild(btn);
  });

  allBtn.addEventListener("click", () => selectCategory("all"));
}

function selectCategory(cat) {
  currentCategory = cat;
  currentPage = 1;
  document.querySelectorAll(".cat-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.category === cat)
  );
  applyFilters();
}

// ── Search ──
function applyFilters() {
  const q = searchQuery.toLowerCase();

  filteredWorkflows = allWorkflows.filter(wf => {
    // Category filter
    if (currentCategory !== "all") {
      if (!wf.categories.includes(currentCategory)) return false;
    }

    // Search filter
    if (q) {
      const haystack = [
        wf.title,
        wf.name,
        wf.author,
        ...wf.categories,
        ...wf.nodes.map(cleanNodeName),
      ].join(" ").toLowerCase();
      return haystack.includes(q);
    }
    return true;
  });

  renderWorkflows();
}

// ── Render Workflow Cards ──
function renderWorkflows() {
  const grid = document.getElementById("workflowGrid");
  const start = (currentPage - 1) * PER_PAGE;
  const page = filteredWorkflows.slice(start, start + PER_PAGE);

  // Update search count
  const countEl = document.getElementById("searchCount");
  if (searchQuery || currentCategory !== "all") {
    countEl.textContent = `${filteredWorkflows.length} results`;
  } else {
    countEl.textContent = "";
  }

  if (page.length === 0) {
    grid.innerHTML = `<div class="empty-state"><span class="emoji">🔍</span>No workflows found. Try a different search or category.</div>`;
    document.getElementById("pagination").innerHTML = "";
    return;
  }

  grid.innerHTML = page.map(wf => {
    const cats = wf.categories.slice(0, 3).map(c => `<span class="tag">${c}</span>`).join("");
    const topNodes = wf.nodes.slice(0, 4).map(n => `<span class="node">${cleanNodeName(n)}</span>`).join("");
    const moreNodes = wf.nodes.length > 4 ? `<span class="node">+${wf.nodes.length - 4}</span>` : "";

    const n8nLink = wf.urlN8n || wf.url;
    const viewBtn = n8nLink
      ? `<a href="${n8nLink}" class="btn btn-primary" target="_blank" rel="noopener">View ↗</a>`
      : "";

    const downloadBtn = wf.json
      ? `<a href="${wf.json}" class="btn btn-secondary" download>Download JSON</a>`
      : "";

    return `
      <div class="wf-card">
        <div class="wf-card-title">${escapeHtml(wf.title)}</div>
        <div class="wf-card-categories">${cats}</div>
        <div class="wf-card-nodes">${topNodes}${moreNodes}</div>
        <div class="wf-card-meta">
          ${wf.author ? `<span>by ${escapeHtml(wf.author)}</span>` : ""}
          ${wf.nodeCount ? `<span>· ${wf.nodeCount} nodes</span>` : ""}
        </div>
        <div class="wf-card-actions">
          ${viewBtn}
          ${downloadBtn}
        </div>
      </div>
    `;
  }).join("");

  renderPagination();
  window.scrollTo({ top: document.querySelector(".controls").offsetTop - 60, behavior: "smooth" });
}

function escapeHtml(str) {
  const el = document.createElement("span");
  el.textContent = str || "";
  return el.innerHTML;
}

// ── Pagination ──
function renderPagination() {
  const container = document.getElementById("pagination");
  const totalPages = Math.ceil(filteredWorkflows.length / PER_PAGE);

  if (totalPages <= 1) { container.innerHTML = ""; return; }

  let html = `<button class="page-btn" ${currentPage === 1 ? "disabled" : ""} onclick="goToPage(${currentPage - 1})">← Prev</button>`;

  const range = getPageRange(currentPage, totalPages);
  range.forEach(p => {
    if (p === "...") {
      html += `<span class="page-btn" style="border:none;cursor:default">…</span>`;
    } else {
      html += `<button class="page-btn${p === currentPage ? " active" : ""}" onclick="goToPage(${p})">${p}</button>`;
    }
  });

  html += `<button class="page-btn" ${currentPage === totalPages ? "disabled" : ""} onclick="goToPage(${currentPage + 1})">Next →</button>`;
  container.innerHTML = html;
}

function getPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, "...", total];
  if (current >= total - 2) return [1, "...", total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
}

window.goToPage = function(p) {
  const totalPages = Math.ceil(filteredWorkflows.length / PER_PAGE);
  if (p < 1 || p > totalPages) return;
  currentPage = p;
  renderWorkflows();
};

// ── Theme Toggle ──
function initTheme() {
  const saved = localStorage.getItem("wf-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");
  document.documentElement.dataset.theme = theme;
  updateThemeIcon(theme);

  document.getElementById("themeToggle").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("wf-theme", next);
    updateThemeIcon(next);
  });
}

function updateThemeIcon(theme) {
  document.querySelector(".theme-icon").textContent = theme === "dark" ? "☀️" : "🌙";
}

// ── Init ──
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  loadData();

  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", debounce(e => {
    searchQuery = e.target.value.trim();
    currentPage = 1;
    applyFilters();
  }, 250));
});
