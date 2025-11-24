// app.js — hardened debug-friendly v3.6.1
// Replace your existing app.js with this file and hard-refresh (Ctrl+F5)

(function () {
  'use strict';

  // Simple DOM helper to show an error banner
  function showErrorBanner(msg) {
    let banner = document.getElementById('ksr-error-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'ksr-error-banner';
      banner.style.background = '#ffecec';
      banner.style.color = '#900';
      banner.style.padding = '12px';
      banner.style.border = '1px solid #f5c2c2';
      banner.style.borderRadius = '6px';
      banner.style.margin = '12px';
      banner.style.fontWeight = '700';
      banner.style.textAlign = 'center';
      const root = document.querySelector('.cards-root') || document.body;
      root.parentNode.insertBefore(banner, root);
    }
    banner.textContent = 'Error: ' + msg;
    console.error('KSR ERROR:', msg);
  }

  // Minimal safe helpers
  var state = { steels: [], index: [] };

  function norm(s) {
    if (!s) return '';
    try {
      return String(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    } catch (e) {
      return String(s).toLowerCase();
    }
  }

  function parseHrcOptimal(s) {
    if (!s) return Number.NEGATIVE_INFINITY;
    var m = String(s).match(/(\d+(\.\d+)?)/);
    return m ? parseFloat(m[1]) : Number.NEGATIVE_INFINITY;
  }

  function buildIndex(steels) {
    state.index = steels.map(function (s) {
      var aliases = Array.isArray(s.aliases) ? s.aliases.join(' ') : '';
      return { key: norm(s.name + ' ' + aliases), ref: s };
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

  function renderSuggestions(list) {
    var ul = document.getElementById('suggestions');
    if (!ul) return;
    ul.innerHTML = '';
    if (!list || list.length === 0) { ul.classList.remove('show'); return; }
    list.forEach(function (steel) {
      var li = document.createElement('li');
      li.textContent = steel.name;
      li.setAttribute('role', 'option');
      li.addEventListener('click', function () {
        var input = document.getElementById('steelSearch');
        if (input) input.value = steel.name;
        var clearBtn = document.getElementById('clearSearch');
        if (clearBtn) clearBtn.style.display = 'inline-block';
        ul.classList.remove('show');
        renderCards([steel], true);
        scrollToCards();
      });
      ul.appendChild(li);
    });
    ul.classList.add('show');
  }

  function scrollToCards() {
    var el = document.getElementById('cards');
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function safeText(s) { return String(s == null ? '' : s); }

  function cardNode(s, forceOpen) {
    forceOpen = !!forceOpen;
    var div = document.createElement('div');
    div.className = 'card';

    var details = document.createElement('details');
    var isDesktop = window.innerWidth >= 769;
    details.open = isDesktop || forceOpen;

    var summary = document.createElement('summary');
    summary.innerHTML = '<div class="card-head"><div class="name">' + safeText(s.name) +
      '</div><div class="hrc">' + safeText(s.hrcRange) + ' / ' + safeText(s.hrcOptimal) + '</div></div>' +
      '<div class="summary-toggle"><span class="chev">▼</span> Tap to ' + (details.open ? 'collapse' : 'expand') + '</div>';

    var traitsHtml = '';
    if (Array.isArray(s.traits)) {
      traitsHtml = s.traits.map(function (t) { return '<li>' + safeText(t) + '</li>'; }).join('');
    }

    var dpsHtml = '';
    if (Array.isArray(s.dps)) {
      dpsHtml = s.dps.map(function (row) {
        var bar = safeText(row.bar || 'bar-green');
        var text = safeText(row.text || '');
        return '<div class="dps-row"><div class="' + bar + '"></div><div>' + text + '</div></div>';
      }).join('');
    }

    var body = document.createElement('div');
    body.className = 'card-body';
    body.innerHTML = '<div class="card-title"><div class="name">' + safeText(s.name) + '</div>' +
      '<div class="hrc">' + safeText(s.hrcRange) + ' / ' + safeText(s.hrcOptimal) + '</div></div>' +
      '<div class="process">Process: ' + safeText(s.process) + '</div>' +
      '<ul class="traits">' + traitsHtml + '</ul>' +
      '<div class="mfg">🏭 ' + safeText(s.mfg) + '</div>' +
      '<span class="grit-pill">' + safeText(s.grit) + '</span>' +
      '<div class="dps">' + dpsHtml + '</div>';

    details.addEventListener('toggle', function () {
      var txt = details.open ? 'collapse' : 'expand';
      var toggle = summary.querySelector('.summary-toggle');
      if (toggle) toggle.innerHTML = '<span class="chev">▼</span> Tap to ' + txt;
    });

    details.appendChild(summary);
    details.appendChild(body);
    div.appendChild(details);
    return div;
  }

  function renderGrouped(steels) {
    var root = document.getElementById('cards');
    if (!root) return;
    root.innerHTML = '';

    var panels = [
      { key: 'Polished', cls: 'panel-polished', title: 'Polished' },
      { key: 'Toothy', cls: 'panel-toothy', title: 'Toothy' }
    ];

    panels.forEach(function (p) {
      var section = document.createElement('section');
      section.className = 'panel ' + p.cls;

      var header = document.createElement('h2');
      header.className = 'panel-header';
      header.textContent = p.title;
      section.appendChild(header);

      var grid = document.createElement('div');
      grid.className = 'card-grid';

      var filtered = (steels || []).filter(function (s) { return s.finish === p.key; });
      filtered.sort(function (a, b) { return parseHrcOptimal(a.hrcOptimal) - parseHrcOptimal(b.hrcOptimal); });
      filtered.forEach(function (s) { grid.appendChild(cardNode(s)); });

      section.appendChild(grid);
      root.appendChild(section);
    });
  }

  function renderCards(steels, forceOpen) {
    var root = document.getElementById('cards');
    if (!root) return;
    root.innerHTML = '';
    var grid = document.createElement('div');
    grid.className = 'card-grid';
    (steels || []).forEach(function (s) { grid.appendChild(cardNode(s, forceOpen)); });
    root.appendChild(grid);
  }

  function expandAllCards() {
    document.querySelectorAll('.card details').forEach(function (d) { d.open = true; });
  }
  function collapseAllCards() {
    if (window.innerWidth < 769) {
      document.querySelectorAll('.card details').forEach(function (d) { d.open = false; });
    }
  }

  // Init with robust error handling
  function init() {
    var input = document.getElementById('steelSearch');
    var clearBtn = document.getElementById('clearSearch');
    var expandBtn = document.getElementById('expandAll');
    var collapseBtn = document.getElementById('collapseAll');

    if (clearBtn) clearBtn.style.display = 'none';

    // Load steels.json
    fetch('steels.json', { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('Failed to fetch steels.json: ' + r.status + ' ' + r.statusText);
        return r.text();
      })
      .then(function (text) {
        try {
          var parsed = JSON.parse(text);
          if (!Array.isArray(parsed)) throw new Error('steels.json root is not an array');
          state.steels = parsed;
        } catch (e) {
          showErrorBanner('Invalid steels.json: ' + e.message);
          state.steels = [];
        }
      })
      .catch(function (err) {
        showErrorBanner('Could not load steels.json: ' + err.message);
        state.steels = [];
      })
      .finally(function () {
        try {
          buildIndex(state.steels);
          renderGrouped(state.steels);
        } catch (e) {
          showErrorBanner('Render error: ' + e.message);
        }
      });

    function updateClearVisibility() {
      if (!input || !clearBtn) return;
      clearBtn.style.display = input.value.trim().length ? 'inline-block' : 'none';
    }

    if (input) {
      input.addEventListener('input', function (e) {
        updateClearVisibility();
        var q = e.target.value;
        if (!q) {
          renderSuggestions([]);
          renderGrouped(state.steels);
          return;
        }
        renderSuggestions(fuzzyFind(q));
      });

      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          var q = input.value;
          var results = fuzzyFind(q, 50);
          renderSuggestions([]);
          if (results.length) renderCards(results, true);
          else renderGrouped(state.steels);
          scrollToCards();
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (input) input.value = '';
        updateClearVisibility();
        renderSuggestions([]);
        renderGrouped(state.steels);
        scrollToCards();
      });
    }

    if (expandBtn) expandBtn.addEventListener('click', expandAllCards);
    if (collapseBtn) collapseBtn.addEventListener('click', collapseAllCards);

    document.addEventListener('click', function (e) {
      var s = document.getElementById('suggestions');
      var wrap = document.querySelector('.search-wrap');
      if (s && wrap && !wrap.contains(e.target)) s.classList.remove('show');
    });

    var prevIsDesktop = window.innerWidth >= 769;
    window.addEventListener('resize', function () {
      var nowIsDesktop = window.innerWidth >= 769;
      if (nowIsDesktop !== prevIsDesktop) {
        prevIsDesktop = nowIsDesktop;
        var q = (input && input.value) ? input.value.trim() : '';
        if (q) renderCards(fuzzyFind(q), true);
        else renderGrouped(state.steels);
      }
    });
  }

  // Start
  try { init(); } catch (e) { showErrorBanner('Initialization error: ' + e.message); }

})();

