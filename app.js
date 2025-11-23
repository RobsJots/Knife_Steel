// State
const state = {
  steels: [],
  index: []
};

// Normalize strings for fuzzy search
const norm = (s) => s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");

// Build index
function buildIndex(steels) {
  state.index = steels.map((s) => ({
    key: norm(`${s.name} ${s.aliases?.join(" ") || ""}`),
    ref: s
  }));
}

// Scoring
function score(key, q) {
  if (key.includes(q)) return 3;
  const qTokens = q.split(/\s+/).filter(Boolean);
  const kTokens = key.split(/\s+/).filter(Boolean);
  const overlap = qTokens.filter((t) => kTokens.includes(t)).length;
  if (overlap) return 2 + overlap * 0.25;
  if (key.startsWith(q)) return 2;
  return 0;
}

// Fuzzy find
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

// Render grouped panels
function renderGrouped(steels) {
  const root = document.getElementById("cards");
  root.innerHTML = "";

  const finishes = ["Polished", "Toothy", "Balanced"];
  finishes.forEach((finish) => {
    const section = document.createElement("section");
    section.className = "panel";
    section.innerHTML = `<h2 class="panel-header">${finish} Finish</h2>`;
    const grid = document.createElement("div");
    grid.className = "card-grid";

    steels.filter((s) => s.finish === finish).forEach((s) => {
      grid.appendChild(cardNode(s));
    });

    section.appendChild(grid);
    root.appendChild(section);
  });
}

// Render flat list (for search results)
function renderCards(steels) {
  const root = document.getElementById("cards");
  root.innerHTML = "";
  steels.forEach((s) => root.appendChild(cardNode(s)));
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

// Init
async function init() {
  const resp = await fetch("steels.json");
  state.steels = await resp.json();
  buildIndex(state.steels);

  // Show all steels grouped by finish
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
    if (!document.querySelector(".search-wrap").contains(e.target)) s.classList.remove("show");
  });
}

init();
