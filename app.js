// State
const state = { steels: [], index: [] };

// Normalize strings for fuzzy search
const norm = (s) => s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");

// Parse HRC optimal to a numeric value (handles "62+", "61–62 / 61", etc.)
function parseHrcOptimal(s) {
  if (!s) return Number.NEGATIVE_INFINITY;
  // Extract first number in the string
  const m = String(s).match(/(\d+(\.\d+)?)/);
  return m ? parseFloat(m[1]) : Number.NEGATIVE_INFINITY;
}

// Build index for search
function buildIndex(steels) {
  state.index = steels.map((s) => ({
    key: norm(`${s.name} ${s.aliases?.join(" ") || ""}`),
    ref: s
  }));
}

// Simple scoring for fuzzy search
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

// Suggestions dropdown
function renderSuggestions(list) {
  const ul = document.getElementById("suggestions");
  ul.innerHTML = "";
  if (list.length === 0) { ul.classList.remove("show"); return; }
  list.forEach((steel) => {
    const li = document.createElement("li");
    li.textContent = steel.name;
    li.role = "option";
    li.addEventListener("click", () => {
      document.getElementById("steelSearch").value = steel.name;
      ul.classList.remove("show");
      renderCards([steel]);
      scrollToCards();
    });
    ul.appendChild(li);
  });
  ul.classList.add("show");
}

function scrollToCards() {
  const el = document.getElementById("cards");
  if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Card node
function cardNode(s) {
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <div class="card-head">
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
      `).join("")}
    </div>
  `;
  return div;
}

// Render grouped panels with ascending HRC
function renderGrouped(steels) {
  const root = document.getElementById("cards");
  root.innerHTML = "";

  const finishes = [
    { key: "Polished", cls: "panel-polished", title: "Polished Finish" },
    { key: "Toothy",   cls: "panel-toothy",   title: "Toothy Finish" },
    { key: "Balanced", cls: "panel-balanced", title: "Balanced Finish" }
  ];

  finishes.forEach(({ key, cls, title }) => {
    const section = document.createElement("section");
    section.className = `panel ${cls}`;
    section.innerHTML = `<h2 class="panel-header">${title}</h2>`;

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

// Render search results in a consistent grid (no full-width card)
function renderCards(steels) {
  const root = document.getElementById("cards");
  root.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "card-grid";
  steels.forEach((s) => grid.appendChild(cardNode(s)));
  root.appendChild(grid);
}

// Init
async function init() {
  const resp = await fetch("steels.json");
  state.steels = await resp.json();
  buildIndex(state.steels);

  // Default: full grouped view (3 panels side by side, sorted ascending HRC)
  renderGrouped(state.steels);

  const input = document.getElementById("steelSearch");

  input.addEventListener("input", (e) => {
    const q = e.target.value;
    if (!q) { renderSuggestions([]); renderGrouped(state.steels); return; }
    renderSuggestions(fuzzyFind(q));
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const q = e.target.value;
      const results = fuzzyFind(q, 50);
      renderSuggestions([]);
      if (results.length) {
        renderCards(results);
      } else {
        renderGrouped(state.steels);
      }
      scrollToCards();
    }
  });

  document.addEventListener("click", (e) => {
    const s = document.getElementById("suggestions");
    const wrap = document.querySelector(".search-wrap");
    if (s && wrap && !wrap.contains(e.target)) s.classList.remove("show");
  });
}

init();
