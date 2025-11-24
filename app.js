// Knife Steel Reference v3.6.0 core (forward-facing version label is v3.6.1)

// State
const state = { steels: [], index: [] };

const norm = (s) => s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");

function parseHrcOptimal(s) {
  if (!s) return Number.NEGATIVE_INFINITY;
  const m = String(s).match(/(\d+(\.\d+)?)/);
  return m ? parseFloat(m[1]) : Number.NEGATIVE_INFINITY;
}

function buildIndex(steels) {
  state.index = steels.map((s) => ({
    key: norm(`${s.name} ${s.aliases?.join(" ") || ""}`),
    ref: s
  }));
}

function score(key, q) {
  if (key.includes(q)) return 3;
  const qTokens = q.split(/\s+/).filter(Boolean);
  const kTokens = key.split(/\s+/).filter(Boolean);
  const overlap = qTokens.filter((t) => kTokens.includes(t)).length;
  if (overlap) return 2 + overlap * 0.25;
  if (key.startsWith(q)) return 2;
  return 0;
}

function fuzzyFind(query, limit = 50) {
  const q = norm(query);
  if (!q) return [];
  return state.index
    .map(({ key, ref }) => ({ ref, score: score(key, q) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ ref }) => ref);
}

function renderSuggestions(list) {
  const ul = document.getElementById("suggestions");
  ul.innerHTML = "";
  if (list.length === 0) { ul.classList.remove("show"); return; }
  list.forEach((steel) => {
    const li = document.createElement("li");
    li.textContent = steel.name;
    li.role = "option";
    li.addEventListener("click", () => {
      const input = document.getElementById("steelSearch");
      input.value = steel.name;
      document.getElementById("clearSearch").style.display = "inline-block";
      ul.classList.remove("show");
      renderCards([steel], true);
      scrollToCards();
    });
    ul.appendChild(li);
  });
  ul.classList.add("show");
}

function scrollToCards() {
  const el = document.getElementById("cards");
  if (el && typeof el.scrollIntoView === "function") {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function cardNode(s, forceOpen = false) {
  const div = document.createElement("div");
  div.className = "card";

  const details = document.createElement("details");
  const isDesktop = window.innerWidth >= 769;
  details.open = isDesktop || !!forceOpen;

  const summary = document.createElement("summary");
  summary.innerHTML = `
    <div class="card-head">
      <div class="name">${s.name}</div>
      <div class="hrc">${s.hrcRange} / ${s.hrcOptimal}</div>
    </div>
    <div class="summary-toggle"><span class="chev">▼</span> Tap to ${details.open ? "collapse" : "expand"}</div>
  `;

  const body = document.createElement("div");
  body.className = "card-body";
  body.innerHTML = `
    <div class="card-title">
      <div class="name">${s.name}</div>
      <div class="hrc">${s.hrcRange} / ${s.hrcOptimal}</div>
    </div>
    <div class="process">Process: ${s.process}</div>
    <ul class="traits">
      ${s.traits.map((t) => `<li>${t}</li>`).join("")}
    </ul>
    <div class="mfg">🏭 ${s.mfg}</div>
    <span class="grit-pill">${s.grit}</span>
    <div class="dps">
      ${s.dps.map((row) => `
        <div class="dps-row">
          <div class="${row.bar}"></div>
          <div>${row.text}</div>
        </div>
      ).join("")}
    </div>
  `;

  details.addEventListener("toggle", () => {
    const txt = details.open ? "collapse" : "expand";
    const toggle = summary.querySelector(".summary-toggle");
    if (toggle) toggle.innerHTML = `<span class="chev">▼</span> Tap to ${txt}`;
  });

  details.appendChild(summary);
  details.appendChild(body);
  div.appendChild(details);
  return div;
}

function renderGrouped(steels) {
  const root = document.getElementById("cards");
  root.innerHTML = "";

  const panels = [
    { key: "Polished", cls: "panel-polished", title: "Polished" },
    { key: "Toothy",   cls: "panel-toothy",   title: "Toothy" }
  ];

  panels.forEach(({ key, cls, title }) => {
    const section = document.createElement("section");
    section.className = `panel ${cls}`;

    const header = document.createElement("h2");
    header.className = "panel-header";
    header.textContent = title;
    section.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "card-grid";

    steels
      .filter((s) => s.finish === key)
      .sort((a, b) => parseHrcOptimal(a.hrcOptimal) - parseHrcOptimal(b.hrcOptimal))
      .forEach((s) => grid.appendChild(cardNode(s)));

    section.appendChild(grid);
    root.appendChild(section);
  });
}

function renderCards(steels, forceOpen = true) {
  const root = document.getElementById("cards");
  root.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "card-grid";
  steels.forEach((s) => grid.appendChild(cardNode(s, forceOpen)));
  root.appendChild(grid);
}

function expandAllCards() {
  document.querySelectorAll(".card details").forEach(d => { d.open = true; });
}
function collapseAllCards() {
  if (window.innerWidth < 769) {
    document.querySelectorAll(".card details").forEach(d => { d.open = false; });
  }
}

async function init() {
  try {
    const resp = await fetch("steels.json", { cache: "no-store" });
    state.steels = await resp.json();
  } catch {
    state.steels = [];
  }
  buildIndex(state.steels);
  renderGrouped(state.steels);

  const input = document.getElementById("steelSearch");
  const clearBtn = document.getElementById("clearSearch");
  const expandBtn = document.getElementById("expandAll");
  const collapseBtn = document.getElementById("collapseAll");

  function updateClearVisibility() {
    clearBtn.style.display = input.value.trim().length ? "inline-block" : "none";
  }
  updateClearVisibility();

  input.addEventListener("input", (e) => {
    const q = e.target.value;
    updateClearVisibility();

    if (!q) {
      renderSuggestions([]);
      renderGrouped(state.steels);
      return;
    }
    renderSuggestions(fuzzyFind(q));
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const q = e.target.value;
      const results = fuzzyFind(q, 50);
      renderSuggestions([]);
      if (results.length) {
        renderCards(results, true);
      } else {
        renderGrouped(state.steels);
      }
      scrollToCards();
    }
  });

  clearBtn.addEventListener("click", () => {
    input.value = "";
    updateClearVisibility();
    renderSuggestions([]);
    renderGrouped(state.steels);
    scrollToCards();
  });

  expandBtn.addEventListener("click", expandAllCards);
  collapseBtn.addEventListener("click", collapseAllCards);

  document.addEventListener("click", (e) => {
    const s = document.getElementById("suggestions");
    const wrap = document.querySelector(".search-wrap");
    if (s && wrap && !wrap.contains(e.target)) s.classList.remove("show");
  });

  let prevIsDesktop = window.innerWidth >= 769;
  window.addEventListener("resize", () => {
    const nowIsDesktop = window.innerWidth >= 769;
    if (nowIsDesktop !== prevIsDesktop) {
      prevIsDesktop = nowIsDesktop;
      const query = input.value.trim();
      if (query) {
        renderCards(fuzzyFind(query), true);
      } else {
        renderGrouped(state.steels);
      }
    }
  });
}

init();
