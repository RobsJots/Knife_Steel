// Knife Steel Reference — production-ready
(function () {
  "use strict";

  // --- Version constant ---
  const APP_VERSION = "4.1.4";

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
    appVersion: APP_VERSION
  };

  function readAppVersion() { return APP_VERSION; }

  // --- Defaults maps (unchanged) ---
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
    details.open = true; // always open initially so cards show on mobile/PWA

    var summary = document.createElement("summary");

    var checkboxHtml = '<label style="display:inline-flex;align-items:center;margin-right:8px;">' +
      '<input type="checkbox" class="compare-checkbox" data-steel-name="' + safeText(s.name) + '" aria-label="Select ' + safeText(s.name) + ' for compare">' +
      "</label>";

    summary.innerHTML = checkboxHtml +
      '<div class="card-head" style="display:inline-flex;align-items:baseline;justify-content:space-between;width:calc(100% - 40px)">' +
        '<div class="name">' + safeText(s.name) + '</div>' +
        '<div class="hrc">' + safeText(s.hrcRange) + " / " + safeText(s.hrcOptimal) + "</div>" +
      '</div>' +
      '<div class="summary-toggle" style="display:block;width:100%"><span class="chev">▼</span> Tap to collapse</div>';

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
      grindSelectHtml += '<option value="' + g + '"' +
        (g === (state.activeGlobalGrind || "fullFlat") ? " selected" : "") + ">" + label + "</option>";
    });
    grindSelectHtml += "</select></div>";

    var body = document.createElement("div");
    body.className = "card-body";
    body.innerHTML =
      '<div class="card-title"><div class="name">' + safeText(s.name) + '</div>' +
        '<div class="hrc">' + safeText(s.hrcRange) + " / " + safeText(s.hrcOptimal) + "</div></div>" +
      '<div class="process">Process: ' + safeText(s.process) + "</div>" +
      '<ul class="traits">' + traitsHtml + "</ul>" +
      '<div class="mfg">🏭 " ' + safeText(s.mfg) + "</div>" +
      '<div class="rec-block"><div><strong>Recommended finish:</strong> <span class="rec-style">' + safeText(rec.dpsStyle) + "</span></div>" +
        '<div><strong>Grit range:</strong> <span class="rec-grit">' + safeText(rec.gritRange) + "</span></div>" +
        '<div class="microbevel"><strong>Microbevel:</strong> <span class="rec-micro">' +
          safeText(rec.microbevel && rec.microbevel.angle) + " @ " + safeText(rec.microbevel && rec.microbevel.grit) + "</span></div>" +
        '<div class="rec-notes"><em>' + safeText(rec.notes) + "</em></div></div>" +
      '<div class="grit-pill">' + safeText(s.grit) + "</div>" +
      '<div class="dps">' + dpsHtml + "</div>" +
      grindSelectHtml +
      '<div style="margin-top:8px;display:flex;gap:8px;justify-content:space-between;align-items:center">' +
        '<button class="btn compare-btn">Compare</button>' +
        '<button class="btn guide-btn">Sharpening Guide</button>' +
      "</div>";

    details.addEventListener("toggle", function () {
      var txt = details.open ? "collapse" : "expand";
      var toggle = summary.querySelector(".summary-toggle");
      if (toggle) toggle.innerHTML = '<span class="chev">▼</span> Tap to ' + txt;
    });

    details.appendChild(summary);
    details.appendChild(body);
    div.appendChild(details);

    var checkbox = summary.querySelector(".compare-checkbox");
    if (checkbox) {
      checkbox.checked = isInCompare(s);
      checkbox.addEventListener("click", function (ev) { ev.stopPropagation(); });
      checkbox.addEventListener("change", function () {
        var currently = isInCompare(s);
        if (checkbox.checked && !currently) toggleCompare(s);
        else if (!checkbox.checked && currently) toggleCompare(s);
        else syncCompareCheckboxes();
      });
    }

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

    var compareBtn = body.querySelector(".compare-btn");
    if (compareBtn) compareBtn.addEventListener("click", function () { toggleCompare(s); });

    var guideBtn = body.querySelector(".guide-btn");
    if (guideBtn) guideBtn.addEventListener("click", function () {
      var chosenSel = body.querySelector(".card-grind-select");
      var chosen = chosenSel ? chosenSel.value : (state.activeGlobalGrind || "fullFlat");
      var recObj = getRecommendation(s, chosen);
      var guide = buildRecipeText(s, chosen, recObj);
      showSharpeningGuide(guide);
    });

    var copyBtn = body.querySelector(".copy-recipe-btn");
    if (copyBtn) copyBtn.addEventListener("click", function () {
      var chosenSel2 = body.querySelector(".card-grind-select");
      var chosen2 = chosenSel2 ? chosenSel2.value : (state.activeGlobalGrind || "fullFlat");
      var recObj2 = getRecommendation(s, chosen2);
      var recipe = buildRecipeText(s, chosen2, recObj2);
      copyToClipboard(recipe);
    });

    return div;
  }

  // --- Compare tray ---
function toggleCompare(steel) {
  var idx = state.compare.findIndex(function (s) { return s.name === steel.name; });
  if (idx === -1) {
    if (state.compare.length >= 2) {
      alert("Compare tray supports only 2 steels. The oldest will be replaced.");
      state.compare.shift(); // remove oldest
    }
    state.compare.push(steel);
  } else {
    state.compare.splice(idx, 1);
  }
  renderCompareTray();
  syncCompareCheckboxes();
}

  function renderCompareTray() {
  var tray = el("compareTray");
  var list = el("compareList");
  if (!tray || !list) return;

  list.innerHTML = "";
  if (state.compare.length === 0) {
    tray.hidden = true;
    tray.setAttribute("aria-hidden", "true");
    return;
  }

  tray.hidden = false;
  tray.setAttribute("aria-hidden", "false");

  state.compare.forEach(function (s) {
    var rec = getRecommendation(s, state.activeGlobalGrind || "fullFlat");

    var item = document.createElement("div");
    item.className = "compare-item";

    item.innerHTML =
      '<div class="compare-header"><strong>' + safeText(s.name) + '</strong>' +
        '<div class="muted">' + safeText(s.hrcRange) + " / " + safeText(s.hrcOptimal) + "</div></div>" +

      '<div class="compare-rec"><strong>Finish:</strong> ' + safeText(rec.dpsStyle) + "</div>" +
      '<div class="compare-rec"><strong>Grit:</strong> ' + safeText(rec.gritRange) + "</div>" +
      '<div class="compare-rec"><strong>Microbevel:</strong> ' +
        safeText(rec.microbevel?.angle) + " @ " + safeText(rec.microbevel?.grit) + "</div>" +
      '<div class="compare-rec"><strong>Notes:</strong> ' + safeText(rec.notes) + "</div>" +
      '<div class="compare-rec"><strong>Traits:</strong> ' +
        (Array.isArray(s.traits) ? s.traits.join(", ") : "") + "</div>" +
      '<div class="compare-rec"><strong>🏭</strong> ' + safeText(s.mfg) + "</div>" +

      '<div class="compare-actions">' +
        '<button class="btn guide-btn">Sharpening Guide</button>' +
        '<button class="btn remove-compare">Remove</button>' +
      "</div>";

    // Wire up buttons
    var guideBtn = item.querySelector(".guide-btn");
    if (guideBtn) guideBtn.addEventListener("click", function () {
      var guide = buildRecipeText(s, state.activeGlobalGrind || "fullFlat", rec);
      showSharpeningGuide(guide);
    });

    var removeBtn = item.querySelector(".remove-compare");
    if (removeBtn) removeBtn.addEventListener("click", function () { toggleCompare(s); });

    list.appendChild(item);
  });

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

  // --- Modal helpers ---
  function showSharpeningGuide(text) {
    var overlay = el("guideModal");
    var content = el("guideContent");
    if (!overlay || !content) return;
    content.textContent = text;
    overlay.style.display = "flex";
    overlay.setAttribute("aria-hidden", "false");
  }

  function hideSharpeningGuide() {
    var overlay = el("guideModal");
    if (!overlay) return;
    overlay.style.display = "none";
    overlay.setAttribute("aria-hidden", "true");
  }

  function copyGuideToClipboard() {
    var content = el("guideContent");
    if (!content) return;
    var text = content.textContent;
    try {
      navigator.clipboard.writeText(text).catch(function () {
        var ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      });
    } catch (e) {}
  }

  // --- Grouped panels rendering ---
  function renderGrouped(steels) {
    var root = el("cards");
    if (!root) return;
    root.innerHTML = "";

    if (!Array.isArray(steels) || steels.length === 0) {
      var empty = document.createElement("div");
      empty.className = "empty-state";
      empty.innerHTML = "<p>No steels loaded. Use Refresh to try again.</p>";
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
    syncCompareCheckboxes();
  }

  // --- Robust fetch with cache-bust & fallback ---
 async function loadSteels(bustVersion) {
  const base = "steels.json";
  const url = bustVersion ? base + "?v=" + Date.now() : base;
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error("Failed to fetch steels.json: " + r.status);
    const parsed = await r.json();
    if (!Array.isArray(parsed)) throw new Error("steels.json root is not an array");
    console.log("Loaded steels:", parsed.length);
    return parsed;
  } catch (e) {
    showErrorBanner("Could not load steels.json: " + e.message);
    return [];
  }
}

  // --- Expand/collapse helpers ---
  function expandAllCards() { document.querySelectorAll(".card details").forEach(function (d) { d.open = true; }); }
  function collapseAllCards() { if (window.innerWidth < 769) document.querySelectorAll(".card details").forEach(function (d) { d.open = false; }); }

  // --- Force reload helper (used by Refresh button) ---
  async function forceReloadAll() {
    var btn = el("refreshBtn");
    if (btn) { btn.disabled = true; btn.textContent = "Refreshing..."; }

    try {
      // Unregister service worker if present
      if ('serviceWorker' in navigator) {
        try {
          var reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            await reg.unregister();
            console.log("Service worker unregistered for refresh.");
          }
        } catch (swErr) {
          console.warn("Service worker unregister failed:", swErr);
        }
      }

      // Clear all caches
      if (window.caches && caches.keys) {
        try {
          var keys = await caches.keys();
          await Promise.all(keys.map(function (k) { return caches.delete(k); }));
          console.log("All caches cleared.");
        } catch (cacheErr) {
          console.warn("Cache clear failed:", cacheErr);
        }
      }

      // Fetch fresh steels.json and re-render (warm UI)
      try {
        var fresh = await loadSteels(Date.now());
        state.steels = fresh;
        buildIndex(state.steels);
        renderGrouped(state.steels);
        console.log("UI updated with fresh steels.json.");
      } catch (fetchErr) {
        console.warn("Fetching fresh steels.json failed:", fetchErr);
      }

      // Finally reload the page so the browser fetches latest HTML/JS
      setTimeout(function () {
        try { location.reload(); } catch (e) { console.warn("Reload failed:", e); }
      }, 250);

    } catch (e) {
      showErrorBanner("Refresh failed: " + e.message);
      if (btn) { btn.disabled = false; btn.textContent = "Refresh"; }
    }
  }

  // --- Init & wiring ---
  async function init() {
    // 1. Inject version into DOM
    document.body.setAttribute("data-app-version", APP_VERSION);
    document.title = "Knife Steel Reference v" + APP_VERSION;

    var vSpan = document.querySelector(".version");
    if (vSpan) vSpan.textContent = APP_VERSION;
    var vStrong = document.querySelector(".visible-version");
    if (vStrong) vStrong.textContent = APP_VERSION;

    // Bust cache for manifest and CSS by appending ?v=APP_VERSION
    var manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) manifestLink.href = "manifest.webmanifest?v=" + APP_VERSION;
    var cssLink = document.querySelector('link[rel="stylesheet"]');
    if (cssLink) cssLink.href = "app.css?v=" + APP_VERSION;

    // Register service worker with version
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js?v=" + APP_VERSION);
    }

    // 2. Grab DOM elements
    var input = el("steelSearch");
    var clearBtn = el("clearSearch");
    var expandBtn = el("expandAll");
    var collapseBtn = el("collapseAll");
    var grindFilter = el("grindSelect");
    var clearCompareBtn = el("clearCompare");
    var refreshBtn = el("refreshBtn");
    var closeGuideBtn = el("closeGuideBtn");
    var copyGuideBtn = el("copyGuideBtn");

    // 3. Modal buttons
    if (closeGuideBtn) closeGuideBtn.addEventListener("click", hideSharpeningGuide);
    if (copyGuideBtn) copyGuideBtn.addEventListener("click", copyGuideToClipboard);

    // 4. Initial UI state
    if (clearBtn) clearBtn.style.display = "none";

    // 5. Load steels.json
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

    // 6. Wire refresh button
    if (refreshBtn) refreshBtn.addEventListener("click", forceReloadAll);

    // 7. Search wiring
    function updateClearVisibility() {
      if (!input || !clearBtn) return;
      clearBtn.style.display = input.value.trim().length ? "inline-block" : "none";
    }

    if (input) {
      input.addEventListener("input", function (e) {
        updateClearVisibility();
        var q = e.target.value;
        if (!q) {
          renderSuggestions([]);
          renderGrouped(state.steels);
          return;
        }
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

    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        if (input) input.value = "";
        updateClearVisibility();
        renderSuggestions([]);
        renderGrouped(state.steels);
        scrollToCards();
      });
    }

    // 8. Expand/collapse wiring
    if (expandBtn) expandBtn.addEventListener("click", expandAllCards);
    if (collapseBtn) collapseBtn.addEventListener("click", collapseAllCards);

    // 9. Global grind filter
    if (grindFilter) {
      state.activeGlobalGrind = grindFilter.value && grindFilter.value !== "all" ? grindFilter.value : "";
      grindFilter.addEventListener("change", function (e) {
        var v = e.target.value || "";
        state.activeGlobalGrind = (v === "all") ? "" : v;
        renderGrouped(state.steels);
      });
    }

    // 10. Compare tray actions
    if (clearCompareBtn) clearCompareBtn.addEventListener("click", clearCompare);
  
    // 11. Suggestions dropdown close
    document.addEventListener("click", function (e) {
      var s = el("suggestions");
      var wrap = document.querySelector(".search-wrap");
      if (s && wrap && !wrap.contains(e.target)) s.classList.remove("show");
    });

    // 12. Responsive re-render
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
  }

  // 13. Init trigger — single registration
  window.addEventListener("DOMContentLoaded", init);

})(); // close the IIFE
