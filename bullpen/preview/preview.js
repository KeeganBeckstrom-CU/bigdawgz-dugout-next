/* Three ways to browse the drill library, side by side, with the real 187 drills. */
(function () {
  var R = window.DRL, D = R.D, CATS = R.CATS, IMG = '../../assets/img/';
  var CAT = {}; CATS.forEach(function (c) { CAT[c.k] = c; });
  var WHERE = R.WHERE_L, WHO = R.WHO_L;
  var st = { look: 'map', where: '', cat: '', deckI: 0, page: 0, flip: {} };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var done = {}; try { done = (window.Profile && Profile.data && Profile.data.done) || {}; } catch (e) {}
  var saved = {}; try { saved = JSON.parse(localStorage.getItem('bp-lib-saved') || '{}'); } catch (e) {}
  function ytId(u) { var m = String(u || '').match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/); return m ? m[1] : ''; }
  function thumb(d) { var y = ytId(d.v); return y ? 'https://i.ytimg.com/vi/' + y + '/hqdefault.jpg' : ''; }
  function icon(k, cls) { return '<img class="' + (cls || 'ic') + '" src="' + IMG + 'cat/' + k + '.png" alt="">'; }
  function list(cat) { return D.filter(function (d) { return (!cat || d.c === cat) && (!st.where || d.where === st.where); }); }
  var main = document.getElementById('pv');

  /* ---------- 1. Field map ---------- */
  var SPOTS = { of: [50, 13], field: [29, 42], run: [73, 44], pitch: [50, 55], hit: [50, 83], catch: [24, 80], throw: [12, 58], arm: [88, 62], ath: [14, 12], fun: [86, 12], iq: [80, 90] };
  function mapHTML() {
    var spots = Object.keys(SPOTS).map(function (k) {
      var n = list(k).length, c = CAT[k], p = SPOTS[k];
      return '<button class="spot' + (st.cat === k ? ' on' : '') + (n ? '' : ' none') + '" data-cat="' + k + '" style="left:' + p[0] + '%;top:' + p[1] + '%;--c:' + c.c + '" aria-label="' + esc(c.n) + ', ' + n + ' drills">' + icon(k, 'si') + '<b>' + esc(c.n) + '</b><small>' + n + '</small></button>';
    }).join('');
    var field = '<svg class="fld" viewBox="0 0 400 420" aria-hidden="true">' +
      '<defs><radialGradient id="g1" cx="50%" cy="100%" r="100%"><stop offset="0" stop-color="#6fd06a"/><stop offset="1" stop-color="#3f9a45"/></radialGradient></defs>' +
      '<path d="M200 395 L10 205 A270 270 0 0 1 390 205 Z" fill="url(#g1)" stroke="#2f7a35" stroke-width="4"/>' +

      '<path d="M200 395 L60 255 A200 200 0 0 1 340 255 Z" fill="#c98a4b" opacity=".95"/>' +
      '<path d="M200 345 L130 275 L200 205 L270 275 Z" fill="#5cbd5f" stroke="#fff" stroke-width="3"/>' +
      '<circle cx="200" cy="275" r="17" fill="#c98a4b"/><rect x="194" y="272" width="12" height="4" fill="#fff"/>' +
      '<g fill="#fff"><rect x="124" y="269" width="12" height="12" transform="rotate(45 130 275)"/><rect x="194" y="199" width="12" height="12" transform="rotate(45 200 205)"/><rect x="264" y="269" width="12" height="12" transform="rotate(45 270 275)"/><path d="M192 345h16v6l-8 7-8-7z"/></g>' +
      '<path d="M200 395 L10 205 M200 395 L390 205" stroke="#fff" stroke-width="3"/></svg>';
    var h = '<p class="pv-lead">Tap a spot on the field to open its drills.</p><div class="map">' + field + spots + '</div>';
    if (st.cat) h += shelf(st.cat);
    return h;
  }
  function shelf(k) {
    var c = CAT[k], ds = list(k);
    return '<section class="shelf2" style="--c:' + c.c + '" aria-label="' + esc(c.n) + ' drills"><div class="sh2h">' + icon(k, 'shi') + '<span><b>' + esc(c.n) + '</b><small>' + esc(c.d) + ' · ' + ds.length + ' drills</small></span><button class="x" data-close aria-label="Close">✕</button></div>' +
      '<div class="rail">' + ds.map(card).join('') + '</div></section>';
  }
  function card(d) {
    var t = thumb(d);
    return '<button class="dcard" data-d="' + d.id + '" style="--c:' + CAT[d.c].c + '"><span class="th">' + (t ? '<img src="' + t + '" alt="" loading="lazy" onerror="this.remove()">' : '') + icon(d.c, 'thi') + (done[d.id] ? '<i class="ok">✓</i>' : '') + '<em>' + d.t + ' min</em></span><b>' + esc(d.n) + '</b><small>' + esc(WHERE[d.where] || '') + ' · ' + esc(WHO[d.who] || '') + '</small></button>';
  }

  /* ---------- 2. Swipe deck ---------- */
  function deckHTML() {
    var chips = '<div class="chips" role="group" aria-label="Skill"><button data-cat="" aria-pressed="' + !st.cat + '">All</button>' + CATS.map(function (c) { return '<button data-cat="' + c.k + '" aria-pressed="' + (st.cat === c.k) + '" style="--c:' + c.c + '">' + icon(c.k, 'ci') + esc(c.n) + '</button>'; }).join('') + '</div>';
    var ds = list(st.cat);
    return chips + '<div class="deck" id="deck" aria-roledescription="carousel">' + ds.map(function (d, i) {
      var t = thumb(d), c = CAT[d.c];
      return '<article class="dk" style="--c:' + c.c + '" aria-label="' + (i + 1) + ' of ' + ds.length + ': ' + esc(d.n) + '"><div class="dkv">' + (t ? '<img src="' + t + '" alt="" loading="lazy" onerror="this.remove()">' : '') + icon(d.c, 'dki') + '<span class="play">▶</span></div>' +
        '<div class="dkb"><small>' + esc(c.n) + ' · ' + d.t + ' min · ' + esc(WHERE[d.where] || '') + '</small><h3>' + esc(d.n) + '</h3><p>' + esc(d.why) + '</p>' +
        '<div class="dka"><button class="btn" data-d="' + d.id + '">Do this drill</button><button class="heart" data-save="' + d.id + '" aria-pressed="' + !!saved[d.id] + '" aria-label="Save">' + (saved[d.id] ? '♥' : '♡') + '</button></div></div></article>';
    }).join('') + '</div><div class="dkn"><button data-step="-1" aria-label="Previous drill">‹</button><span id="dkc">1 / ' + ds.length + '</span><button data-step="1" aria-label="Next drill">›</button></div>';
  }

  /* ---------- 3. Card binder ---------- */
  function binderHTML() {
    var k = st.cat || 'hit', c = CAT[k], ds = list(k), per = 6, pages = Math.max(1, Math.ceil(ds.length / per));
    if (st.page >= pages) st.page = 0;
    var stamped = ds.filter(function (d) { return done[d.id]; }).length;
    var tabs = '<div class="tabs" role="tablist" aria-label="Binder sections">' + CATS.map(function (x) { return '<button role="tab" data-cat="' + x.k + '" aria-selected="' + (x.k === k) + '" style="--c:' + x.c + '" aria-label="' + esc(x.n) + '">' + icon(x.k, 'ti') + '</button>'; }).join('') + '</div>';
    var pg = ds.slice(st.page * per, st.page * per + per);
    return tabs + '<div class="binder" style="--c:' + c.c + '"><div class="bh"><b>' + esc(c.n) + '</b><small>' + stamped + ' of ' + ds.length + ' stamped</small></div><div class="bgrid">' + pg.map(function (d) {
      var f = st.flip[d.id];
      return '<button class="bc' + (f ? ' f' : '') + '" data-flip="' + d.id + '" aria-label="' + esc(d.n) + (f ? ', showing steps' : '') + '"><span class="in"><span class="fr">' + icon(d.c, 'bci') + (done[d.id] ? '<i class="stamp">★</i>' : '') + '<b>' + esc(d.n) + '</b><small>' + d.t + ' min</small></span>' +
        '<span class="bk"><b>' + esc(d.n) + '</b><ol>' + (d.steps || []).slice(0, 3).map(function (s) { return '<li>' + esc(s.split(':')[0].slice(0, 46)) + '</li>'; }).join('') + '</ol><em data-d="' + d.id + '">Open ›</em></span></span></button>';
    }).join('') + '</div><div class="bp"><button data-page="-1" aria-label="Previous page"' + (st.page ? '' : ' disabled') + '>◀</button><span>Page ' + (st.page + 1) + ' of ' + pages + '</span><button data-page="1" aria-label="Next page"' + (st.page < pages - 1 ? '' : ' disabled') + '>▶</button></div></div>';
  }

  /* ---------- drill sheet (same for all three) ---------- */
  var sheet = document.getElementById('pvSheet');
  function openDrill(id) {
    var d = D.find(function (x) { return x.id === id; }); if (!d) return;
    var y = ytId(d.v), c = CAT[d.c];
    sheet.innerHTML = '<div class="sbk" data-shut></div><div class="sbx" role="dialog" aria-modal="true" aria-label="' + esc(d.n) + '" style="--c:' + c.c + '"><button class="x" data-shut aria-label="Close">✕</button>' +
      '<small>' + esc(c.n) + ' · ' + d.t + ' min · ' + esc(WHERE[d.where] || '') + ' · ' + esc(WHO[d.who] || '') + '</small><h2>' + esc(d.n) + '</h2>' +
      (y ? '<div class="vid"><iframe src="https://www.youtube-nocookie.com/embed/' + y + '?rel=0&playsinline=1' + (d.s ? '&start=' + d.s : '') + (d.e ? '&end=' + d.e : '') + '" title="' + esc(d.n) + ' video" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe></div>' : '') +
      '<p class="why">' + esc(d.why) + '</p><ol class="steps">' + (d.steps || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
      (d.eq ? '<p class="eq"><b>You need:</b> ' + esc(d.eq) + '</p>' : '') +
      '<a class="btn" href="../#d/' + d.id + '">Open in the Bullpen</a></div>';
    sheet.classList.add('on'); sheet.setAttribute('aria-hidden', 'false');
    var x = sheet.querySelector('.x'); x && x.focus({ preventScroll: true });
  }
  function shut() { sheet.classList.remove('on'); sheet.setAttribute('aria-hidden', 'true'); setTimeout(function () { if (!sheet.classList.contains('on')) sheet.innerHTML = ''; }, 300); }
  sheet.addEventListener('click', function (e) { if (e.target.closest('[data-shut]')) shut(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheet.classList.contains('on')) shut(); });

  /* ---------- render + taps ---------- */
  function render() {
    document.querySelectorAll('[data-look]').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.look === st.look); });
    document.querySelectorAll('[data-where]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.where === st.where); });
    main.className = 'pv-' + st.look;
    main.innerHTML = st.look === 'map' ? mapHTML() : st.look === 'deck' ? deckHTML() : binderHTML();
    if (st.look === 'deck') {
      var dk = document.getElementById('deck'), n = dk.children.length;
      dk.addEventListener('scroll', function () { var i = Math.round(dk.scrollLeft / dk.clientWidth); document.getElementById('dkc').textContent = (n ? i + 1 : 0) + ' / ' + n; }, { passive: true });
    }
  }
  document.addEventListener('click', function (e) {
    var t = e.target;
    var lk = t.closest('[data-look]'); if (lk) { st.look = lk.dataset.look; st.cat = st.look === 'binder' ? (st.cat || 'hit') : ''; st.page = 0; render(); return; }
    var wh = t.closest('[data-where]'); if (wh) { st.where = wh.dataset.where; st.page = 0; render(); return; }
    if (!main.contains(t)) return;
    var dd = t.closest('[data-d]'); if (dd) { openDrill(dd.dataset.d); return; }
    var sv = t.closest('[data-save]'); if (sv) { var id = sv.dataset.save; if (saved[id]) delete saved[id]; else saved[id] = 1; try { localStorage.setItem('bp-lib-saved', JSON.stringify(saved)); } catch (er) {} sv.textContent = saved[id] ? '♥' : '♡'; sv.setAttribute('aria-pressed', !!saved[id]); return; }
    if (t.closest('[data-close]')) { st.cat = ''; render(); return; }
    var ct = t.closest('[data-cat]'); if (ct) { st.cat = st.look === 'map' && st.cat === ct.dataset.cat ? '' : ct.dataset.cat; st.page = 0; render(); if (st.look === 'map' && st.cat) { var s = main.querySelector('.shelf2'); s && s.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } return; }
    var sp = t.closest('[data-step]'); if (sp) { var dk = document.getElementById('deck'); dk.scrollBy({ left: +sp.dataset.step * dk.clientWidth, behavior: 'smooth' }); return; }
    var pg = t.closest('[data-page]'); if (pg) { st.page += +pg.dataset.page; render(); return; }
    var fl = t.closest('[data-flip]'); if (fl) { st.flip[fl.dataset.flip] = !st.flip[fl.dataset.flip]; fl.classList.toggle('f'); return; }
  });
  render();
})();
