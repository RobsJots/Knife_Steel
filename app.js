// Knife Steel Reference v4.0.0 — production-ready
// Robust, data-driven, supports grindRecommendations, global grind filter (#grindSelect),
// per-card grind selector, compare tray, pull-to-refresh hook.
// Defensive rendering so cards never disappear; clear error/empty states.

(function () {
  "use strict";

  // --- Utilities ---
  function el(id) { return document.getElementById(id); }
  function safeText(s) { return String(s == null ? "" : s); }
  function norm(s) {
    if (!s) return "";
    try { return String(s).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, ""); }
    catch (e) { return String(s).toLowerCase(); }
  }
  function parseHrcOptimal(s) {
    if (!s) return Number.NEGATIVE_INFINITY;
    var m = String(s).match(/(\d+(\.\d+)?)/);
    return m ? parseFloat(m[1]) : Number.NEGATIVE_INFINITY;
  }

  // --- State ---
  var state = {
    steels: [],
    index: [],
    compare: [],
    activeGlobalGrind: "",
    appVersion: readAppVersion()
  };

  function readAppVersion() {
    var body = document.body;
    return body && body.getAttribute("data-app-version") ? body.getAttribute("data-app-version") : "4.0.0";
  }

  // --- Defaults maps (used when grindRecommendations missing) ---
  var defaultBySteelClass = {
    vanadiumHeavy: {
      fullFlat: { dpsStyle: "toothy", gritRange: "400–800", microbevel: { angle: "0.5°–1°", grit: "800–1000" }, notes: "Favor toothiness to preserve bite around hard vanadium carbides." },
      hollow: { dpsStyle: "toothy", gritRange: "600–1000", microbevel: { angle: "0.5°", grit: "1000" }, notes: "Thin hollows risk microchipping; keep some tooth." },
      convex: { dpsStyle: "toothy", gritRange: "400–800", microbevel: { angle: "1°", grit: "800" }, notes: "Convex strength allows slightly finer finish but keep bite." },
      saber: { dpsStyle: "toothy", gritRange: "400–800", microbevel: { angle: "1°", grit: "800" }, notes: "Thicker wedge needs bite." },
      scandi: { dpsStyle: "toothy", gritRange: "400–800", microbevel: { angle: "0.5°–1°", grit: "800" }, notes: "Scandi benefits from bite." },
      chisel: { dpsStyle: "toothy", gritRange: "400–800", microbevel: { angle: "0.5°–1°", grit: "800" }, notes: "Single-side geometry amplifies bite." },
      compound: { dpsStyle: "toothy", gritRange: "400–1000", microbevel: { angle: "0.5°–1°", grit: "800–1000" }, notes: "Match the working bevel." },
      tanto: { dpsStyle: "toothy", gritRange: "400–800", microbevel: { angle: "0.5°–1°", grit: "800" }, notes: "Tip strength and bite are critical." },
      microbevel: { dpsStyle: "toothy", gritRange: "400–800", microbevel: { angle: "0.5°–1.5°", grit: "800–1000" }, notes: "Polish microbevel conservatively." }
    },
    fineCarbide: {
      fullFlat: { dpsStyle: "balanced", gritRange: "800–1500", microbevel: { angle: "0.5°–1°", grit: "1500–3000" }, notes: "Fine carbides tolerate higher polish for slicing." },
      hollow: { dpsStyle: "polished", gritRange: "1000–3000", microbevel: { angle: "0.5°", grit: "3000+" }, notes: "Thin hollows benefit from high polish." },
      convex: { dpsStyle: "balanced", gritRange: "800–1500", microbevel: { angle: "0.5°–1°", grit: "1500" }, notes: "Convex strength allows finer finish." },
      saber: { dpsStyle: "balanced", gritRange: "800–1200", microbevel: { angle: "1°", grit: "1200" }, notes: "Thicker wedge needs some bite." },
      scandi: { dpsStyle: "balanced", gritRange: "800–1200", microbevel: { angle: "0.5°–1°", grit: "1200" }, notes: "Scandi can be balanced for clean woodwork." },
      chisel: { dpsStyle: "balanced", gritRange: "800–1200", microbevel: { angle: "0.5°–1°", grit: "1200" }, notes: "Single-side geometry; adjust for use." },
      compound: { dpsStyle: "balanced", gritRange: "800–1500", microbevel: { angle: "0.5°–1°", grit: "1500" }, notes: "Match working bevel." },
      tanto: { dpsStyle: "balanced", gritRange: "800–1200", microbevel: { angle: "0.5°–1°", grit: "1200" }, notes: "Tip may need slightly coarser finish." },
      microbevel: { dpsStyle: "polished", gritRange: "1000–3000", microbevel: { angle: "0.5°", grit: "3000+" }, notes: "Polish microbevel for slicing." }
    },
    toolSteel: {
      fullFlat: { dpsStyle: "toothy", gritRange: "400–800", microbevel: { angle: "0.5°–1°", grit: "800–1000" }, notes: "Tool steels favor toothy finishes for bite and durability." },
      hollow: { dpsStyle: "toothy", gritRange: "600–1000", microbevel: { angle: "0.5°", grit: "1000" }, notes: "Thin hollows risk chipping; keep some tooth." },
      convex: { dpsStyle: "toothy", gritRange: "400–800", microbevel: { angle: "1°", grit: "800" }, notes: "Convex helps strength; keep bite." },
      saber: { dpsStyle: "toothy", gritRange: "400–800", microbevel: { angle: "1°", grit: "800" }, notes: "Durable wedge needs bite." },
      scandi: { dpsStyle: "toothy", gritRange: "400–800", microbevel: { angle: "0.5°–1°", grit: "800" }, notes: "Scandi benefits from bite." },
      chisel: { dpsStyle: "toothy", gritRange: "400–800", microbevel: { angle: "0.5°–1°", grit: "800" }, notes: "Single-side geometry amplifies bite." },
      compound: { dpsStyle: "toothy", gritRange: "400–1000", microbevel: { angle: "0.5°–1°", grit: "800–1000" }, notes: "Match the working bevel." },
      tanto: { dpsStyle: "toothy", gritRange: "400–800", microbevel: { angle: "0.5°–1°", grit: "800" }, notes: "Tip strength and bite are critical." },
      microbevel: { dpsStyle: "toothy", gritRange: "400–800", microbevel: { angle: "0.5°–1.5°", grit: "800–1000" }, notes: "Polish microbevel conservatively." }
    },
    nitrogenSteel: {
      fullFlat: { dpsStyle: "balanced", gritRange: "800–1500", microbevel: { angle: "0.5°–1°", grit: "1500–3000" }, notes: "Nitrogen steels take polish well and remain tough." },
      hollow: { dpsStyle: "polished", gritRange: "1000–3000", microbevel: { angle: "0.5°", grit: "3000+" }, notes: "Thin hollows benefit from high polish." },
      convex: { dpsStyle: "balanced", gritRange: "800–1500", microbevel: { angle: "0.5°–1°", grit: "1500" }, notes: "Convex strength allows finer finish." },
      saber: { dpsStyle: "balanced", gritRange: "800–1200", microbevel: { angle: "1°", grit: "1200" }, notes: "Thicker wedge needs some bite." },
      scandi: { dpsStyle: "balanced", gritRange: "800–1200", microbevel: { angle: "0.5°–1°", grit: "1200" }, notes: "Scandi can be balanced for clean woodwork." },
      chisel: { dpsStyle: "balanced", gritRange: "800–1200", microbevel: { angle: "0.5°–1°", grit: "1200" }, notes: "Single-side geometry; adjust for use." },
      compound: { dpsStyle: "balanced", gritRange: "800–1500", microbevel: { angle: "0.5°–1°", grit: "1500" }, notes: "Match working bevel." },
      tanto: { dpsStyle: "balanced", gritRange: "800–1200", microbevel: { angle: "0.5°–1°", grit: "1200" }, notes: "Tip may need slightly coarser finish." },
      microbevel: { dpsStyle: "polished", gritRange: "1000–3000", microbevel: { angle: "0.5°", grit: "3000+" }, notes: "Polish microbevel for slicing." }
    }
  };

  var defaultByGrind = {
    fullFlat: { dpsStyle: "balanced", gritRange: "800–1500", microbevel: { angle: "0.5°–1°", grit: "1000–1500" }, notes: "General balanced recommendation." },
    hollow: { dpsStyle: "polished", gritRange: "1000–3000", microbevel: { angle: "0.5°", grit: "3000+" }, notes: "Hollows favor high polish." },
    convex: { dpsStyle: "balanced", gritRange: "600–1500", microbevel: { angle: "1°", grit: "800–1200" }, notes: "Convex is strong and versatile." },
    saber: { dpsStyle: "toothy", gritRange: "400–1000", microbevel: { angle: "1°", grit: "800–1000" }, notes: "Saber is durable; keep bite." },
    scandi: { dpsStyle: "toothy", gritRange: "400–800", microbevel: { angle: "0.5°–1°", grit: "800" }, notes: "Scandi benefits from bite." },
    chisel: { dpsStyle: "toothy", gritRange: "400–1000", microbevel: { angle: "0.5°–1°", grit: "800–1000" }, notes: "Chisel is aggressive; tune to use." },
    compound: { dpsStyle: "balanced", gritRange: "500–1500", microbevel: { angle: "0.5°–1°", grit: "800–1500" }, notes: "Hybrid — match working bevel." },
    tanto: { dpsStyle: "toothy", gritRange: "400–1000", microbevel: { angle: "0.5°–1°", grit: "800–1000" }, notes: "Tip needs bite and toughness." },
    microbevel: { dpsStyle: "balanced", gritRange: "800–2000", microbevel: { angle: "0.5°–1.5°", grit: "1000–3000" }, notes: "Polish microbevel to desired finish." }
  };

  // --- Error banner ---
  function showErrorBanner(msg) {
    var banner = document.getElementById("ksr-error-banner");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "ksr-error-banner";
      banner.style.background = "#ffecec";
      banner.style.color = "#900";
      banner.style.padding = "12px";
      banner.style.border = "1px solid #f5c2c2";
      banner.style.borderRadius = "6px";
      banner.style.margin = "12px";
      banner.style.fontWeight = "700";
      banner.style.textAlign = "center";
      var root = document.querySelector(".cards-root") || document.body;
      root.parentNode.insertBefore(banner, root);
    }
    banner.textContent = "Error: " + msg;
    console.error("KSR ERROR:", msg);
  }

  // --- Indexing & search ---
  function buildIndex(steels) {
    state.index = steels.map(function (s) {
      var aliases = Array.isArray(s.aliases) ? s.aliases.join(" ") : "";
      return { key: norm(s.name + " " + aliases + " " + (s.mfg || "")), ref: s };
    });
  }

  function score(key, q) {
    if (key.indexOf(q) !== -1) return 3;
    var qTokens = q.split(/\s+/).filter(Boolean);
    var kTokens = key.split(/\s+/).filter(Boolean);
    var overlap = 0;
    qTokens.forEach(function (t) { if (kTokens.indexOf(t) !== -1) overlap++; });
    if (overlap) return 2 + overlap * 0.25;
    if (key.indexOf(q) === 0) return 2;
    return 0;
  }

  function fuzzyFind(query, limit) {
    limit = limit || 50;
    var q = norm(query);
    if (!q) return [];
    return state.index
      .map(function (entry) { return { ref: entry.ref, score: score(entry.key, q) }; })
      .filter(function (x) { return x.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, limit)
      .map(function (x) { return x.ref; });
  }

  // --- Recommendation resolution ---
  function getRecommendation(steel, grind) {
    grind = grind || state.activeGlobalGrind || "fullFlat";
    if (steel && steel.grindRecommendations && steel.grindRecommendations[grind]) {
      return steel.grindRecommendations[grind];
    }
    if (steel && steel.steelClass && defaultBySteelClass[steel.steelClass] && defaultBySteelClass[steel.steelClass][grind]) {
      return defaultBySteelClass[steel.steelClass][grind];
    }
    return defaultByGrind[grind] || { dpsStyle: "balanced", gritRange: "800–1500", microbevel: { angle: "0.5°–1°", grit: "1000" }, notes: "" };
  }

  // --- Rendering helpers ---
  function createDpsHtml(dpsArray) {
    if (!Array.isArray(dpsArray)) return "";
    return dpsArray.map(function (row) {
      var bar = safeText(row.bar || "bar-green");
      var text = safeText(row.text || "");
      return '<div class="dps-row"><div class="' + bar + '"></div><div>' + text + "</div></div>";
    }).join("");
  }

  function isInCompare(steel) {
    return state.compare.some(function (s) { return s.name === steel.name; });
  }

  function syncCompareCheckboxes() {
    var boxes = document.querySelectorAll(".compare-checkbox");
    boxes.forEach(function (box) {
      var name = box.getAttribute("data-steel-name");
      if (!name) return;
      box.checked = state.compare.some(function (s) { return s.name === name; });
    });
  }

  function cardNode(s) {
    var div = document.createElement("div");
    div.className = "card";

    var details = document.createElement("details");
    var isDesktop = window.innerWidth >= 769;
    details.open = isDesktop;

    var summary = document.createElement("summary");

    // Add a small compare checkbox inside the summary. Stop propagation so clicking the checkbox doesn't toggle the details.
    var checkboxHtml = '<label style="display:inline-flex;align-items:center;margin-right:8px;">' +
      '<input type="checkbox" class="compare-checkbox" data-steel-name="' + safeText(s.name) + '" aria-label="Select ' + safeText(s.name) + ' for compare">' +
      '</label>';

    summary.innerHTML = checkboxHtml +
      '<div class="card-head" style="display:inline-flex;align-items:baseline;justify-content:space-between;width:calc(100% - 40px)"><div class="name">' + safeText(s.name) + '</div><div class="hrc">' + safeText(s.hrcRange) + " / " + safeText(s.hrcOptimal) + "</div></div>" +
      '<div class="summary-toggle" style="display:block;width:100%"><span class="chev">▼</span> Tap to ' + (details.open ? "collapse" : "expand") + "</div>";

    var rec = getRecommendation(s, state.activeGlobalGrind || "");
    var traitsHtml = Array.isArray(s.traits) ? s.traits.map(function (t) { return "<li>" + safeText(t) + "</li>"; }).join("") : "";
    var dpsHtml = createDpsHtml(s.dps || []);

    var grindOptions = ["fullFlat","hollow","convex","saber","scandi","chisel","compound","tanto","microbevel"];
    var grindSelectHtml = '<div class="grind-select"><label>Grind</label><select class="card-grind-select">';
    grindOptions.forEach(function (g) {
      var label = {
        fullFlat: "Full flat", hollow: "Hollow", convex: "Convex", saber: "Saber",
        scandi: "Scandi", chisel: "Chisel", compound: "Compound", tanto: "Tanto",
        microbevel: "Microbevel-focused"
      }[g] || g;
      grindSelectHtml += '<option value="' + g + '"' + (g === (state.activeGlobalGrind || "fullFlat") ? " selected" : "") + ">" + label + "</option>";
    });
    grindSelectHtml += "</select></div>";

    var body = document.createElement("div");
    body.className = "card-body";
    body.innerHTML = '<div class="card-title"><div class="name">' + safeText(s.name) + '</div><div class="hrc">' + safeText(s.hrcRange) + " / " + safeText(s.hrcOptimal) + "</div></div>" +
      '<div class="process">Process: ' + safeText(s.process) + "</div>" +
      '<ul class="traits">' + traitsHtml + "</ul>" +
      '<div class="mfg">🏭 ' + safeText(s.mfg) + "</div>" +
      '<div class="rec-block"><div><strong>Recommended finish:</strong> <span class="rec-style">' + safeText(rec.dpsStyle) + "</span></div>" +
      '<div><strong>Grit range:</strong> <span class="rec-grit">' + safeText(rec.gritRange) + "</span></div>" +
      '<div class="microbevel"><strong>Microbevel:</strong> <span class="rec-micro">' + safeText(rec.microbevel && rec.microbevel.angle) + " @ " + safeText(rec.microbevel && rec.microbevel.grit) + "</span></div>" +
      '<div class="rec-notes"><em>' + safeText(rec.notes) + "</em></div></div>" +
      '<div class="grit-pill">' + safeText(s.grit) + "</div>" +
      '<div class="dps">' + dpsHtml + "</div>' +
      grindSelectHtml +
      '<div style="margin-top:8px;display:flex;gap:8px;justify-content:space-between;align-items:center">' +
      '<button class="btn compare-btn">Compare</button>' +
      '<button class="btn copy-recipe-btn">Copy Recipe</button>' +
      "</div>";

    // Attach checkbox behavior after body is in DOM (we'll attach listeners below)
    details.addEventListener("toggle", function () {
      var txt = details.open ? "collapse" : "expand";
      var toggle = summary.querySelector(".summary-toggle");
      if (toggle) toggle.innerHTML = '<span class="chev">▼</span> Tap to ' + txt;
    });

    details.appendChild(summary);
    details.appendChild(body);
    div.appendChild(details);

    // Wire up per-card checkbox (prevent summary toggle when clicking checkbox)
    // The checkbox is inside summary; find it and attach handlers.
    var checkbox = summary.querySelector(".compare-checkbox");
    if (checkbox) {
      // Initialize checked state based on current compare list
      checkbox.checked = isInCompare(s);

      checkbox.addEventListener("click", function (ev) {
        // Prevent the click from toggling the <details>
        ev.stopPropagation();
      });

      checkbox.addEventListener("change", function () {
        // Toggle compare state to match checkbox
        var currently = isInCompare(s);
        if (checkbox.checked && !currently) {
          // add
          toggleCompare(s);
        } else if (!checkbox.checked && currently) {
          // remove
          toggleCompare(s);
        } else {
          // ensure sync
          syncCompareCheckboxes();
        }
      });
    }

    // Per-card grind selection
    var cardSelect = body.querySelector(".card-grind-select");
    if (cardSelect) {
      cardSelect.addEventListener("change", function (e) {
        var chosen = e.target.value;
        var newRec = getRecommendation(s, chosen);
        var recStyle = body.querySelector(".rec-style");
        var recGrit = body.querySelector(".rec-grit");
        var recMicro = body.querySelector(".rec-micro");
        var recNotes = body.querySelector(".rec-notes");
        if (recStyle) recStyle.textContent = safeText(newRec.dpsStyle);
        if (recGrit) recGrit.textContent = safeText(newRec.gritRange);
        if (recMicro) recMicro.textContent = safeText(newRec.microbevel && newRec.microbevel.angle) + " @ " + safeText(newRec.microbevel && newRec.microbevel.grit);
        if (recNotes) recNotes.textContent = safeText(newRec.notes);
      });
    }

    // Compare button
    var compareBtn = body.querySelector(".compare-btn");
    if (compareBtn) compareBtn.addEventListener("click", function () { toggleCompare(s); });

    // Copy recipe button
    var copyBtn = body.querySelector(".copy-recipe-btn");
    if (copyBtn) copyBtn.addEventListener("click", function () {
      var chosen = body.querySelector(".card-grind-select").value;
      var recObj = getRecommendation(s, chosen);
      var recipe = buildRecipeText(s, chosen, recObj);
      copyToClipboard(recipe);
    });

    return div;
  }

  // --- Compare tray ---
  function toggleCompare(steel) {
    var idx = state.compare.findIndex(function (s) { return s.name === steel.name; });
    if (idx === -1) {
      if (state.compare.length >= 3) { alert("Compare tray supports up to 3 items."); return; }
      state.compare.push(steel);
    } else {
      state.compare.splice(idx, 1);
    }
    renderCompareTray();
    // Keep checkboxes in sync after compare state changes
    syncCompareCheckboxes();
  }

  function renderCompareTray() {
    var tray = el("compareTray");
    var list = el("compareList");
    if (!tray || !list) return;
    list.innerHTML = "";
    if (state.compare.length === 0) { tray.hidden = true; return; }
    tray.hidden = false;
    state.compare.forEach(function (s) {
      var item = document.createElement("div");
      item.className = "compare-item";
      item.innerHTML = '<div><strong>' + safeText(s.name) + '</strong><div class="muted">' + safeText(s.hrcRange) + " / " + safeText(s.hrcOptimal) + "</div></div>" +
        '<div><button class="btn remove-compare">Remove</button></div>';
      item.querySelector(".remove-compare").addEventListener("click", function () { toggleCompare(s); });
      list.appendChild(item);
    });
    // Ensure checkboxes reflect the current compare list
    syncCompareCheckboxes();
  }

  function clearCompare() { state.compare = []; renderCompareTray(); syncCompareCheckboxes(); }

  function copyCompareRecipes() {
    if (state.compare.length === 0) return;
    var text = state.compare.map(function (s) {
      var rec = getRecommendation(s, state.activeGlobalGrind || "");
      return buildRecipeText(s, state.activeGlobalGrind || "fullFlat", rec);
    }).join("\n\n---\n\n");
    copyToClipboard(text);
  }

  // --- Recipe & clipboard ---
  function buildRecipeText(steel, grind, rec) {
    var lines = [];
    lines.push("Steel: " + safeText(steel.name) + " (" + safeText(steel.hrcRange) + " / " + safeText(steel.hrcOptimal) + ")");
    lines.push("Grind: " + (grind || "fullFlat"));
    lines.push("Recommended finish: " + safeText(rec.dpsStyle));
    lines.push("Grit range: " + safeText(rec.gritRange));
    if (rec.microbevel) lines.push("Microbevel: " + safeText(rec.microbevel.angle) + " @ " + safeText(rec.microbevel.grit));
    if (rec.notes) lines.push("Notes: " + safeText(rec.notes));
    lines.push("");
    lines.push("Suggested progression:");
    suggestProgression(rec.gritRange).forEach(function (p) { lines.push("- " + p); });
    lines.push("");
    lines.push("Strop: light leather with compound; 10-30 passes depending on steel and grit.");
    return lines.join("\n");
  }

  function suggestProgression(gritRange) {
    var g = safeText(gritRange);
    if (g.indexOf("400") !== -1 || g.indexOf("600") !== -1) {
      return ["220–400 (reprofile/damage)", "400–800 (primary edge)", "800–1000 (secondary/microbevel)", "Strop"];
    }
    if (g.indexOf("800") !== -1 || g.indexOf("1000") !== -1) {
      return ["400–800 (primary)", "800–1500 (refine)", "1500–3000 (polish microbevel if desired)", "Strop"];
    }
    if (g.indexOf("1500") !== -1 || g.indexOf("3000") !== -1) {
      return ["800–1500 (primary)", "1500–3000 (polish)", "3000+ (final polish)", "Strop"];
    }
    return ["400–800", "800–1500", "Strop"];
  }

  function copyToClipboard(text) {
    try {
      navigator.clipboard.writeText(text).then(function () { alert("Recipe copied to clipboard."); }).catch(function () {
        var ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); alert("Recipe copied to clipboard."); } catch (e) { alert("Copy failed."); }
        document.body.removeChild(ta);
      });
    } catch (e) { alert("Copy not supported."); }
  }

  // --- Grouped panels rendering ---
  function renderGrouped(steels) {
    var root = el("cards");
    if (!root) return;
    root.innerHTML = "";

    // Visible empty/error state
    if (!Array.isArray(steels) || steels.length === 0) {
      var empty = document.createElement("div");
      empty.className = "empty-state";
      empty.innerHTML = "<p>No steels loaded. Pull to refresh or try again later.</p>";
      root.appendChild(empty);
      console.warn("renderGrouped: no steels to render");
      return;
    }

    var panels = [
      { key: "Polished", cls: "panel-polished", title: "Polished" },
      { key: "Toothy", cls: "panel-toothy", title: "Toothy" }
    ];

    panels.forEach(function (p) {
      var section = document.createElement("section");
      section.className = "panel " + p.cls;

      var header = document.createElement("h2");
      header.className = "panel-header";
      header.textContent = p.title;
      section.appendChild(header);

      var grid = document.createElement("div");
      grid.className = "card-grid";

      var filtered = (steels || []).filter(function (s) { return s.finish === p.key; });

      if (state.activeGlobalGrind) {
        filtered.sort(function (a, b) {
          var ra = getRecommendation(a, state.activeGlobalGrind);
          var rb = getRecommendation(b, state.activeGlobalGrind);
          var scoreMap = { polished: 3, balanced: 2, toothy: 1 };
          var sa = scoreMap[(ra.dpsStyle || "").toLowerCase()] || 0;
          var sb = scoreMap[(rb.dpsStyle || "").toLowerCase()] || 0;
          return sb - sa;
        });
      } else {
        filtered.sort(function (a, b) { return parseHrcOptimal(a.hrcOptimal) - parseHrcOptimal(b.hrcOptimal); });
      }

      filtered.forEach(function (s) { grid.appendChild(cardNode(s)); });

      section.appendChild(grid);
      root.appendChild(section);
    });

    // Ensure checkboxes reflect compare state after full render
    syncCompareCheckboxes();
  }

  // --- Suggestions dropdown ---
  function renderSuggestions(list) {
    var ul = el("suggestions");
    if (!ul) return;
    ul.innerHTML = "";
    if (!list || list.length === 0) { ul.classList.remove("show"); return; }
    list.forEach(function (steel) {
      var li = document.createElement("li");
      li.textContent = steel.name;
      li.setAttribute("role", "option");
      li.addEventListener("click", function () {
        var input = el("steelSearch");
        if (input) input.value = steel.name;
        var clearBtn = el("clearSearch");
        if (clearBtn) clearBtn.style.display = "inline-block";
        renderCards([steel], true);
        scrollToCards();
      });
      ul.appendChild(li);
    });
    ul.classList.add("show");
  }

  function scrollToCards() {
    var elc = el("cards");
    if (elc && typeof elc.scrollIntoView === "function") elc.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderCards(steels, forceOpen) {
    var root = el("cards");
    if (!root) return;
    root.innerHTML = "";
    var grid = document.createElement("div");
    grid.className = "card-grid";
    (steels || []).forEach(function (s) { grid.appendChild(cardNode(s)); });
    root.appendChild(grid);
    // Sync checkboxes after rendering a focused set
    syncCompareCheckboxes();
  }

  // --- Expand/collapse helpers ---
  function expandAllCards() { document.querySelectorAll(".card details").forEach(function (d) { d.open = true; }); }
  function collapseAllCards() { if (window.innerWidth < 769) document.querySelectorAll(".card details").forEach(function (d) { d.open = false; }); }

  // --- Robust fetch with cache-bust & fallback ---
  async function loadSteels() {
    var base = "steels.json";
    var bust = base + "?v=" + encodeURIComponent(state.appVersion);
    try {
      var r = await fetch(bust, { cache: "no-store" });
      if (!r.ok) throw new Error("Failed to fetch " + bust + ": " + r.status + " " + r.statusText);
      var text = await r.text();
      var parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("steels.json root is not an array");
      console.log("Loaded steels (primary):", parsed.length);
      return parsed;
    } catch (e) {
      console.warn("Primary fetch failed, trying fallback:", e.message);
      try {
        var r2 = await fetch(base, { cache: "reload" });
        if (!r2.ok) throw new Error("Fallback fetch failed: " + r2.status + " " + r2.statusText);
        var text2 = await r2.text();
        var parsed2 = JSON.parse(text2);
        if (!Array.isArray(parsed2)) throw new Error("steels.json root is not an array (fallback)");
        console.log("Loaded steels (fallback):", parsed2.length);
        return parsed2;
      } catch (e2) {
        showErrorBanner("Could not load steels.json: " + e2.message);
        return [];
      }
    }
  }

  // --- Pull-to-refresh (requires #ptr element in DOM) ---
  function enablePullToRefresh() {
    var root = el("cards");
    var ptr = el("ptr");
    if (!root || !ptr) return;

    var startY = 0, currentY = 0, pulling = false;
    var threshold = 70;

    root.addEventListener("touchstart", function (e) {
      if (root.scrollTop === 0) { startY = e.touches[0].clientY; pulling = true; } else { pulling = false; }
    }, { passive: true });

    root.addEventListener("touchmove", function (e) {
      if (!pulling) return;
      currentY = e.touches[0].clientY;
      var delta = currentY - startY;
      if (delta > 0) {
        e.preventDefault();
        ptr.classList.add("active");
        ptr.style.transform = "translateY(" + Math.min(delta - ptr.offsetHeight, threshold) + "px)";
        ptr.querySelector(".ptr-arrow").textContent = (delta > threshold) ? "↻" : "⬇";
      }
    }, { passive: false });

    root.addEventListener("touchend", function () {
      if (!pulling) return;
      var delta = currentY - startY;
      ptr.style.transform = "";
      ptr.classList.remove("active");
      pulling = false;
      if (delta > threshold) { doRefresh(ptr); }
    }, { passive: true });
  }

  async function doRefresh(ptr) {
    try {
      ptr.classList.add("active");
      var arrow = ptr.querySelector(".ptr-arrow");
      if (arrow) arrow.textContent = "⟳";
      var data = await loadSteels();
      state.steels = data;
      buildIndex(state.steels);
      renderGrouped(state.steels);
    } catch (e) {
      showErrorBanner("Refresh failed: " + e.message);
    } finally {
      setTimeout(function () { ptr.classList.remove("active"); }, 600);
    }
  }

  // --- Init & wiring ---
  async function init() {
    var input = el("steelSearch");
    var clearBtn = el("clearSearch");
    var expandBtn = el("expandAll");
    var collapseBtn = el("collapseAll");
    var grindFilter = el("grindSelect"); // correct element in header
    var clearCompareBtn = el("clearCompare");
    var copyRecipeBtn = el("copyRecipe");

    if (clearBtn) clearBtn.style.display = "none";

    // Load steels.json
    try {
      state.steels = await loadSteels();
    } catch (e) {
      showErrorBanner("Load error: " + e.message);
      state.steels = [];
    }

    try {
      buildIndex(state.steels);
      renderGrouped(state.steels);
    } catch (e) {
      showErrorBanner("Render error: " + e.message);
    }

    // Search
    function updateClearVisibility() { if (!input || !clearBtn) return; clearBtn.style.display = input.value.trim().length ? "inline-block" : "none"; }
    if (input) {
      input.addEventListener("input", function (e) {
        updateClearVisibility();
        var q = e.target.value;
        if (!q) { renderSuggestions([]); renderGrouped(state.steels); return; }
        renderSuggestions(fuzzyFind(q));
      });
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          var q = e.target.value;
          var results = fuzzyFind(q, 50);
          renderSuggestions([]);
          if (results.length) renderCards(results, true);
          else renderGrouped(state.steels);
          scrollToCards();
        }
      });
    }
    if (clearBtn) clearBtn.addEventListener("click", function () {
      if (input) input.value = "";
      updateClearVisibility();
      renderSuggestions([]);
      renderGrouped(state.steels);
      scrollToCards();
    });

    // Expand/collapse
    if (expandBtn) expandBtn.addEventListener("click", expandAllCards);
    if (collapseBtn) collapseBtn.addEventListener("click", collapseAllCards);

    // Global grind filter
    if (grindFilter) {
      state.activeGlobalGrind = grindFilter.value && grindFilter.value !== "all" ? grindFilter.value : "";
      grindFilter.addEventListener("change", function (e) {
        var v = e.target.value || "";
        state.activeGlobalGrind = (v === "all") ? "" : v;
        renderGrouped(state.steels);
      });
    }

    // Compare tray actions
    if (clearCompareBtn) clearCompareBtn.addEventListener("click", clearCompare);
    if (copyRecipeBtn) copyRecipeBtn.addEventListener("click", copyCompareRecipes);

    // Close suggestions when clicking outside
    document.addEventListener("click", function (e) {
      var s = el("suggestions");
      var wrap = document.querySelector(".search-wrap");
      if (s && wrap && !wrap.contains(e.target)) s.classList.remove("show");
    });

    // Responsive re-render
    var prevIsDesktop = window.innerWidth >= 769;
    window.addEventListener("resize", function () {
      var nowIsDesktop = window.innerWidth >= 769;
      if (nowIsDesktop !== prevIsDesktop) {
        prevIsDesktop = nowIsDesktop;
        var q = (input && input.value) ? input.value.trim() : "";
        if (q) renderCards(fuzzyFind(q), true);
        else renderGrouped(state.steels);
      }
    });

    // Pull-to-refresh wiring (requires #ptr element present)
    enablePullToRefresh();
  }

  // Start
  try { document.addEventListener("DOMContentLoaded", init); } catch (e) { showErrorBanner("Initialization error: " + e.message); }

})();
