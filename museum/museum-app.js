/* Museum inside the Basepaths app: app top bar, app bottom bar, a Back button that always
   works, and screen-reader / keyboard support. Runs after the museum's own script. */
(function () {
  var who = null;
  try { who = (JSON.parse(localStorage.getItem('dugout12u-v3') || 'null') || {}).who || null; } catch (e) {}
  var coach = who === 'coach', parent = who === 'parent';
  var A = function (h) { return '../app/#' + h; };
  var IMG = '../assets/img/';
  if (coach) document.documentElement.classList.add('zis-coach');

  var shell = document.getElementById('shell');
  var nav = document.getElementById('nav');
  var hd = shell.querySelector('.hd');

  /* museum sections (Hall / Capsules / Collection) sit under the top bar, like the app's tabs */
  hd.after(nav);
  nav.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-controls', 's-' + b.dataset.t); });

  /* the app's own bottom bar */
  var items = coach
    ? [['Park', '../', 'park'], ["Coach's View", A('go=team'), 'coach'], ['Clubhouse', A('go=club'), 'trophy.png'], ['Museum', '', 'museum.png'], ['More', A('go=more'), 'more']]
    : parent
      ? [['Park', '../', 'park'], ['Family', A('go=fam'), 'home'], ['Clubhouse', A('go=club'), 'trophy.png'], ['Museum', '', 'museum.png'], ['Account', A('go=acct'), 'more']]
      : [['Park', '../', 'park'], ['Home', A('go=home'), 'home'], ['Clubhouse', A('go=club'), 'trophy.png'], ['Museum', '', 'museum.png'], ['My Card', A('go=me'), 'cat/star.png']];
  var EMO = { park: '⛳', home: '🏠', coach: '📋', more: '⋯' };
  var bar = document.createElement('div');
  bar.className = 'znav'; bar.setAttribute('role', 'navigation'); bar.setAttribute('aria-label', 'App');
  bar.innerHTML = items.map(function (it) {
    var ic = /\.png$/.test(it[2]) ? '<img src="' + IMG + it[2] + '" alt="">' : '<span class="ze" aria-hidden="true">' + EMO[it[2]] + '</span>';
    return it[1]
      ? '<a href="' + it[1] + '">' + ic + '<small>' + it[0] + '</small></a>'
      : '<a class="on" aria-current="page" href="./">' + ic + '<small>' + it[0] + '</small></a>';
  }).join('');
  shell.appendChild(bar);
  bar.querySelector('a.on').addEventListener('click', function (e) { e.preventDefault(); wingOpen = -1; go('mus'); toTop(); });

  function toTop() { var s = document.querySelector('.scr.on'); if (s) s.scrollTop = 0; }

  /* ---------- Back: closes what's open, then steps out one level, then goes Home ---------- */
  var NAMES = { mus: 'Hall of Moments', caps: 'Time Capsules', col: 'Your Collection' };
  function inner() {
    var st = document.querySelector('.story:not(.out)'); if (st) return function () { var x = st.querySelector('.sb-x'); x && x.click(); };
    var md = document.getElementById('modal'); if (md.classList.contains('on')) return closeModal;
    if (tab !== 'mus') return function () { go('mus'); toTop(); };
    if (wingOpen >= 0) return function () { wingOpen = -1; renderMus(); toTop(); };
    return null;
  }
  function back() {
    var f = inner();
    if (f) { f(); return; }
    location.href = coach ? A('go=team') : parent ? A('go=fam') : who ? A('go=home') : '../';
  }
  document.getElementById('zBack').addEventListener('click', back);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var st = document.querySelector('.story:not(.out)');
    if (st && st.contains(document.activeElement)) return; /* the story handles its own Escape */
    var f = inner(); if (f) { e.preventDefault(); f(); }
  });
  /* phone back gesture / browser back steps out one level too */
  try {
    history.replaceState({ zm: 0 }, '');
    history.pushState({ zm: 1 }, '');
    addEventListener('popstate', function (e) {
      if (e.state && e.state.zm === 0) {
        var f = inner();
        if (f) { f(); history.pushState({ zm: 1 }, ''); } else history.back();
      }
    });
  } catch (e) {}

  /* ---------- keep labels, current tab and the subtitle in sync ---------- */
  function sync() {
    nav.querySelectorAll('button').forEach(function (b) {
      var on = b.dataset.t === tab;
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    var sub = document.getElementById('zSub');
    var g = (tab === 'mus' && wingOpen >= 0 && typeof LANDS !== 'undefined') ? LANDS[wingOpen].name : NAMES[tab];
    if (sub && g) sub.textContent = g;
    document.getElementById('zBack').setAttribute('aria-label', inner() ? 'Back' : 'Back to ' + (who ? 'Home' : 'the park'));
    var snd = document.getElementById('sndBtn');
    if (snd) { snd.setAttribute('aria-pressed', S.sound ? 'true' : 'false'); snd.setAttribute('aria-label', S.sound ? 'Sound on' : 'Sound off'); }
    var cap = document.getElementById('capChip');
    if (cap) cap.setAttribute('aria-label', S.caps + ' time capsule' + (S.caps === 1 ? '' : 's') + ' to open');
    /* images the museum draws without alt text are decoration */
    document.querySelectorAll('main img:not([alt])').forEach(function (i) { i.alt = ''; });
    /* tappable divs get keyboard support */
    document.querySelectorAll('main [onclick]:not(button):not(a):not([tabindex])').forEach(function (d) { d.tabIndex = 0; d.setAttribute('role', 'button'); });
  }
  var _go = go; go = function (t) { _go(t); sync(); };
  var _rm = renderMus; renderMus = function () { _rm(); sync(); };
  var _ra = renderAll; renderAll = function () { _ra(); sync(); };
  var _cm = closeModal; closeModal = function () { _cm(); sync(); };
  var _om = openModal; openModal = function (h) { _om(h); sync(); var m = document.getElementById('modal'); m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); var c = m.querySelector('.mclose'); if (c && kb) c.focus(); };
  var kb = false; addEventListener('keydown', function () { kb = true; }, true); addEventListener('pointerdown', function () { kb = false; }, true);
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('main [role="button"]')) { e.preventDefault(); e.target.click(); }
  });
  /* re-sync after any tap inside the museum (galleries open by clicks inside it) */
  document.addEventListener('click', function () { setTimeout(sync, 0); setTimeout(sync, 400); });
  sync();
})();
