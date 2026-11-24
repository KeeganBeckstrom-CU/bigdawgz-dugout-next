/* Bullpen: the drill library from the BigDawgz Dugout app, redrawn in the painted park style.
   Same drills, videos, goals, skill paths and Cleary Throwing Program. Progress saves in Profile. */
(function () {
  var X = window.DRL, P = window.Profile, S = window.Sound, p = P.data;
  var D = X.D, DR = {}, CAT = {};
  D.forEach(function (x) { DR[x.id] = x; });
  X.CATS.forEach(function (c) { CAT[c.k] = c; });
  p.done = p.done || {}; p.fav = p.fav || []; p.log = p.log || []; p.pathDone = p.pathDone || {};
  var NOGEAR = new RegExp(X.NOGEAR, 'i'), IMG = '../assets/img/', PATH_N = X.PATH_N;
  var app = document.getElementById('app'), sheetEl = document.getElementById('sheet'), toastEl = document.getElementById('toast');

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ytId(u) { var m = String(u || '').match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/); return m ? m[1] : ''; }
  function thumb(u) { var id = ytId(u); return id ? 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg' : ''; }
  function clipLen(x) { return x.e ? Math.max(0, x.e - (x.s || 0)) : 0; }
  function fmtT(n) { n = Math.max(0, Math.floor(+n || 0)); var m = Math.floor(n / 60), s = n % 60; return m + ':' + String(s).padStart(2, '0'); }
  function catIcon(k, cls) { var c = CAT[k]; return '<img class="' + (cls || 'cic') + '" src="' + IMG + 'cat/' + k + '.png" alt="" onerror="this.outerHTML=\'<i class=&quot;' + (cls || 'cic') + ' em&quot;>' + c.e + '</i>\'">'; }
  function whosOf(x) { return [x.who].concat(x.wx || []); }
  function save() { P.save(); }
  function toast(t) { toastEl.textContent = t; toastEl.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.classList.remove('on'); }, 2400); }
  function back(href, label) { return '<header class="ghead"><a class="gx" href="' + href + '" aria-label="Back to ' + esc(label) + '"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></a><span><b>' + esc(label) + '</b></span><span class="coins" aria-label="Your XP"><img src="' + IMG + 'coin.png" alt=""><b>' + p.xp.toLocaleString() + '</b></span></header>'; }
  function title(img, h, sub) { return '<div class="hubtitle">' + img + '<div><h1>' + esc(h) + '</h1>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + '</div></div>'; }
  var safeNote = '<p class="safe">If your arm hurts, stop and tell your coach or a parent. Sore is okay. Pain is not.</p>';

  /* ---------- rows and cards ---------- */
  function drillRow(x, extra) {
    var c = CAT[x.c], n = p.done[x.id] || 0;
    return '<a class="drow" href="#d/' + x.id + '" style="--c:' + c.c + '">' + catIcon(x.c) +
      '<span class="dtx"><b>' + esc(x.n) + '</b>' + (x.aka ? '<small class="aka">aka ' + esc(x.aka) + '</small>' : '') +
      '<small>' + esc(c.n) + ' · ' + x.t + ' min' + (x.cl ? ' · Cleary' : '') + (x.v ? ' · ▶ Video' : '') + '</small>' +
      '<small class="eqs">' + esc(x.eq || 'Nothing') + ' · ' + ({ solo: 'Solo', partner: 'With a helper' }[x.who] || 'Group') + '</small></span>' +
      (extra || (n ? '<span class="dn">✓' + (n > 1 ? ' ' + n : '') + '</span>' : '<span class="arr">›</span>')) + '</a>';
  }
  function libCard(x) {
    var c = CAT[x.c], th = thumb(x.v), d = clipLen(x), n = p.done[x.id] || 0;
    return '<a class="lcard" href="#d/' + x.id + '" style="--c:' + c.c + '"><span class="lth">' + (th ? '<img class="thimg" src="' + th + '" alt="" loading="lazy">' : catIcon(x.c, 'lic')) +
      (x.v ? '<em>▶ ' + (d ? fmtT(d) : 'Video') + '</em>' : '') + (n ? '<b class="ldn">✓' + (n > 1 ? ' ' + n : '') + '</b>' : '') + '</span>' +
      '<span class="lnm">' + esc(x.n) + '</span><small>' + esc(c.n) + ' · ' + x.t + ' min</small></a>';
  }
  function grid(L) { return L.length ? '<div class="lgrid">' + L.map(libCard).join('') + '</div>' : '<div class="empty">Nothing matches. Try clearing a filter.</div>'; }

  /* ---------- library ---------- */
  var lib = { q: '', cat: '', f: {}, w: '', spot: '' };
  function libList() {
    var q = lib.q.trim().toLowerCase();
    return D.filter(function (x) {
      return (!lib.cat || x.c === lib.cat) && (!q || (x.n + ' ' + (x.aka || '') + ' ' + x.why + ' ' + CAT[x.c].n).toLowerCase().indexOf(q) >= 0) &&
        (!lib.f.solo || whosOf(x).indexOf('solo') >= 0) && (!lib.f.in || x.where === 'inside') && (!lib.w || x.where === lib.w) && (!lib.f.quick || x.t <= 5) && (!lib.f.vid || x.v) && (!lib.f.cl || x.cl);
    });
  }
  function plain() { return !lib.q.trim() && !lib.cat; }
  function shelves() {
    var by = {};
    libList().forEach(function (x) { (by[x.c] = by[x.c] || []).push(x); });
    return pathShelf() + X.CATS.filter(function (c) { return by[c.k]; }).map(function (c) {
      var L = by[c.k].slice().sort(function (a, b) { return (!!b.v - !!a.v) || a.lv - b.lv; });
      return '<section class="shelf"><div class="shh"><b>' + catIcon(c.k, 'shi') + esc(c.n) + '</b><button data-a="cat:' + c.k + '">See all ' + by[c.k].length + ' ›</button></div><div class="srow">' + L.slice(0, 12).map(libCard).join('') + '</div></section>';
    }).join('');
  }
  /* ---------- the field: tap a spot to open its drills ---------- */
  var SPOTS = { of: [50, 13], field: [29, 42], run: [73, 44], pitch: [50, 55], hit: [50, 83], 'catch': [24, 80], 'throw': [12, 58], arm: [88, 62], ath: [15, 12], fun: [81, 12], iq: [80, 90] };
  var SPOT_AT = { of: 'Outfield grass', field: 'Infield dirt', run: 'The bases', pitch: 'The mound', hit: 'Home plate', 'catch': 'Behind the plate', 'throw': 'Foul line', arm: 'The bullpen', ath: 'Weight room', fun: 'The backyard', iq: 'The dugout' };
  function fieldMap() {
    var by = {}; libList().forEach(function (x) { by[x.c] = (by[x.c] || 0) + 1; });
    var spots = Object.keys(SPOTS).filter(function (k) { return CAT[k]; }).map(function (k) {
      var n = by[k] || 0, c = CAT[k], q = SPOTS[k];
      return '<button class="spot' + (lib.spot === k ? ' on' : '') + (n ? '' : ' none') + '" data-a="spot:' + k + '" style="left:' + q[0] + '%;top:' + q[1] + '%;--c:' + c.c + '" aria-pressed="' + (lib.spot === k) + '" aria-label="' + esc(c.n) + ', ' + n + ' drill' + (n === 1 ? '' : 's') + '">' + catIcon(k, 'si') + '<b>' + esc(c.n) + '</b><small>' + n + '</small></button>';
    }).join('');
    var svg = '<svg class="fld" viewBox="0 0 400 420" aria-hidden="true"><defs><radialGradient id="fg" cx="50%" cy="100%" r="100%"><stop offset="0" stop-color="#6fd06a"/><stop offset="1" stop-color="#3f9a45"/></radialGradient></defs>' +
      '<path d="M200 395 L10 205 A270 270 0 0 1 390 205 Z" fill="url(#fg)" stroke="#2f7a35" stroke-width="4"/>' +
      '<path d="M200 395 L60 255 A200 200 0 0 1 340 255 Z" fill="#c98a4b" opacity=".95"/>' +
      '<path d="M200 345 L130 275 L200 205 L270 275 Z" fill="#5cbd5f" stroke="#fff" stroke-width="3"/>' +
      '<circle cx="200" cy="275" r="17" fill="#c98a4b"/><rect x="194" y="272" width="12" height="4" fill="#fff"/>' +
      '<g fill="#fff"><rect x="124" y="269" width="12" height="12" transform="rotate(45 130 275)"/><rect x="194" y="199" width="12" height="12" transform="rotate(45 200 205)"/><rect x="264" y="269" width="12" height="12" transform="rotate(45 270 275)"/><path d="M192 345h16v6l-8 7-8-7z"/></g>' +
      '<path d="M200 395 L10 205 M200 395 L390 205" stroke="#fff" stroke-width="3"/></svg>';
    return '<div class="fmap" role="group" aria-label="The field. Tap a spot to see its drills.">' + svg + spots + '</div>' + (lib.spot ? spotShelf(lib.spot) : '<p class="fmhint">Tap a spot on the field to open its drills.</p>');
  }
  function spotShelf(k) {
    var c = CAT[k], L = libList().filter(function (x) { return x.c === k; }).sort(function (a, b) { return (!!b.v - !!a.v) || a.lv - b.lv; });
    return '<section class="spsh" id="spsh" style="--c:' + c.c + '" aria-label="' + esc(c.n) + ' drills"><div class="spsh-h">' + catIcon(k, 'shi') + '<span><small>' + esc(SPOT_AT[k] || '') + '</small><b>' + esc(c.n) + '</b><em>' + esc(c.d || '') + '</em></span><button class="spx" data-a="spot:' + k + '" aria-label="Close ' + esc(c.n) + '">✕</button></div>' +
      (L.length ? '<div class="srow">' + L.slice(0, 14).map(libCard).join('') + '</div><button class="spall" data-a="cat:' + k + '">See all ' + L.length + ' ' + esc(c.n) + ' drills ›</button>' : '<div class="empty">No ' + esc(c.n) + ' drills for this spot. Try Anywhere.</div>') + '</section>';
  }
  function listHTML() {
    if (plain()) return fieldMap();
    var L = libList();
    return '<h2 class="grp"><b>' + esc(lib.cat ? CAT[lib.cat].n : lib.f.in ? 'Living Room' : 'Drills') + '</b><span>' + L.length + '</span></h2>' + grid(L);
  }
  function libHTML() {
    var chip = function (k, t) { return '<button class="fchip ' + (lib.f[k] ? 'on' : '') + '" data-a="f:' + k + '">' + t + '</button>'; };
    var nIn = D.filter(function (x) { return x.where === 'inside'; }).length;
    var wb = function (w, t) { return '<button class="wchip' + (lib.w === w ? ' on' : '') + '" data-a="w:' + w + '" aria-pressed="' + (lib.w === w) + '">' + t + '</button>'; };
    var listTop = lib.cat ? '<button class="tofield" data-a="cat:' + lib.cat + '">‹ Back to the field</button>' : '';
    return back('../', 'Park') + title('<img src="' + IMG + 'bats.png" alt="">', 'Bullpen', D.length + ' drills, routines and games') +
      '<label class="search"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="q" placeholder="Search drills…" value="' + esc(lib.q) + '" autocomplete="off" aria-label="Search drills"></label>' +
      '<div class="wrow" role="group" aria-label="Where are you?">' + wb('', 'Anywhere') + wb('inside', '🛋️ Indoors') + wb('yard', '🌳 Backyard') + wb('field', '🏟️ Field') + '</div>' +
      '<div class="fr">' + chip('solo', 'By myself') + chip('quick', '5 min or less') + chip('vid', 'Has video') + chip('cl', 'Cleary') + (plain() && !lib.w ? '' : '<button class="fchip clr" data-a="clr">Clear ✕</button>') + '</div>' +
      listTop + '<div id="list">' + listHTML() + '</div>' +
      '<a class="fhero" href="#finder"><img src="' + IMG + 'cat/goal.png" alt="" onerror="this.src=\'' + IMG + 'trophy.png\'"><span><small>Not sure where to start?</small><b>What do you want to work on?</b><span>Pick a goal. We\'ll hand you the drills that build it.</span></span><i>›</i></a>' +
      '<a class="prog" href="#program"><img src="' + IMG + 'cat/throw.png" alt="" onerror="this.src=\'' + IMG + 'ball.png\'"><span><small>Featured</small><b>Cleary Throwing Program</b><span>The college warm-up, throw and arm-care plan, sized for 12U.</span></span><i>›</i></a>' +
      pathShelf() + safeNote;
  }

  /* ---------- skill paths ---------- */
  function pathSteps(Pa) { return Pa[3].filter(function (id) { return DR[id]; }); }
  function pathState(Pa) {
    var next = false;
    return pathSteps(Pa).map(function (id) { var n = p.done[id] || 0, st; if (n >= PATH_N) st = 'done'; else if (!next) { st = 'now'; next = true; } else st = 'open'; return { id: id, n: n, st: st }; });
  }
  function pathShelf() {
    return '<section class="shelf"><div class="shh"><b><img class="shi" src="' + IMG + 'cat/path.png" alt="" onerror="this.remove()">Skill Paths</b><small>Every drill is open. Go in order or jump around</small></div><div class="srow">' +
      X.PATHS.map(function (Pa) {
        var s = pathState(Pa), d = s.filter(function (x) { return x.st === 'done'; }).length, k = DR[Pa[3][0]] ? DR[Pa[3][0]].c : Pa[0];
        return '<a class="pcard" href="#path/' + Pa[0] + '" style="--c:' + (CAT[k] || CAT.field).c + '">' + catIcon(CAT[Pa[0]] ? Pa[0] : k, 'pic') + '<b>' + esc(Pa[2]) + '</b><small>' + (d === s.length ? 'Complete!' : d + ' of ' + s.length + ' done') + '</small><i style="--w:' + Math.round(d / s.length * 100) + '%"></i></a>';
      }).join('') + '</div></section>';
  }
  function pathHTML(k) {
    var Pa = X.PATHS.find(function (x) { return x[0] === k; }) || X.PATHS[0], s = pathState(Pa), d = s.filter(function (x) { return x.st === 'done'; }).length;
    var ic = CAT[Pa[0]] ? Pa[0] : DR[Pa[3][0]].c;
    return back('#', 'Bullpen') + title(catIcon(ic, 'hti'), Pa[2] + ' Path', d === s.length ? 'Path complete! You\'re a pro at this.' : d + ' of ' + s.length + ' done · do each one ' + PATH_N + ' times to check it off') +
      '<div class="pbar"><i style="width:' + Math.round(d / s.length * 100) + '%"></i></div><div class="ppath">' +
      s.map(function (st, i) {
        var x = DR[st.id], c = CAT[x.c], m = Math.min(st.n, PATH_N);
        return '<a class="pstep ' + st.st + '" href="#d/' + x.id + '" style="--c:' + c.c + '"><span class="pnum">' + (st.st === 'done' ? '✓' : i + 1) + '</span><span class="dtx"><b>' + esc(x.n) + '</b><small>' + x.t + ' min' + (x.v ? ' · ▶ ' + (clipLen(x) ? fmtT(clipLen(x)) : 'Video') : '') + '</small>' +
          (st.st === 'now' ? '<span class="pcnt">' + '●'.repeat(m) + '○'.repeat(PATH_N - m) + ' ' + st.n + ' of ' + PATH_N + '</span>' : '') + '</span><span class="arr">›</span></a>';
      }).join('') + '</div>';
  }

  /* ---------- Cleary Throwing Program ---------- */
  function progHTML() {
    var plyo = ['a3', 'a4', 'a5', 'a6', 'a7', 'a8'].filter(function (id) { return DR[id]; });
    var step = function (n, b, s, rows) { return '<div class="step"><i>' + n + '</i><div><b>' + b + '</b><small>' + s + '</small>' + rows + '</div></div>'; };
    var r = function (ids) { return ids.filter(function (id) { return DR[id]; }).map(function (id) { return drillRow(DR[id]); }).join(''); };
    return back('#', 'Bullpen') + title('<img src="' + IMG + 'cat/throw.png" alt="" onerror="this.src=\'' + IMG + 'ball.png\'">', 'Cleary Throwing Program', '12U edition') +
      '<section class="note hd"><small>Every time you throw</small><b>Same five steps, in the same order. Warm up to throw. Never throw to warm up.</b></section>' +
      step(1, 'Mobility', 'Loosen up first.', r(['a1'])) +
      step(2, 'Pre-throw', 'Get your body moving in the right order.', r(['a2'])) +
      step(3, 'Plyo warm-up', 'Easy to firm. Regular baseball or soft ball.', r(plyo)) +
      step(4, 'Throw', 'Catch play, or a short bullpen for pitchers.', r(['t2', 't9', 'p8'])) +
      step(5, 'Post-throw arm care', 'Pick one each time. Rotate them.', r(X.POST)) +
      '<div class="note"><b>How this was sized for 12U</b><ul><li>Same order and drill names as Cleary\'s program.</li><li>Plyo drills use a regular baseball or soft ball at easy effort, not weighted balls.</li><li>Bullpens are 20–25 pitches, fastball and changeup only.</li><li>Steps 1 and 5 can be done in the living room. Steps 2–4 need space to throw.</li></ul></div>' + safeNote;
  }

  /* ---------- What do you want to work on? ---------- */
  var fin = (function () { var o = {}; try { o = JSON.parse(localStorage.getItem('bp-fin') || '{}') || {}; } catch (e) {} var f = Object.assign({}, X.FIN0, o); f.goals = (f.goals || []).filter(function (g) { return X.GOALS.some(function (x) { return x[0] === g; }); }); if (!f.goals.length) f.open = true; return f; })();
  function finSave() { try { localStorage.setItem('bp-fin', JSON.stringify(fin)); } catch (e) {} }
  var fwR = function (w) { return w === 'inside' ? 0 : w === 'field' ? 2 : 1; }, fwhoR = function (w) { return w === 'solo' ? 0 : w === 'partner' ? 1 : 2; };
  function finWho() { return fin.who || 'solo'; }
  function goalOf(k) { return X.GOALS.find(function (x) { return x[0] === k; }); }
  function finPool() {
    var sc = {}, gs = {};
    var add = function (x, g, s) { if (!x) return; sc[x.id] = (sc[x.id] || 0) + s; (gs[x.id] = gs[x.id] || []).indexOf(g) >= 0 || gs[x.id].push(g); };
    fin.goals.forEach(function (g) { var G = goalOf(g); if (G) G[3].forEach(function (id, i) { add(DR[id], g, 10 - Math.min(i, 10) * .5); }); });
    return Object.keys(sc).map(function (id) { return { x: DR[id], s: sc[id], g: gs[id] }; }).sort(function (a, b) { return b.s - a.s || a.x.lv - b.x.lv; });
  }
  function finOK(x, o) {
    o = o || fin;
    var wr = Math.min.apply(null, [x.where || 'yard'].concat(x.wh || []).map(fwR)), hr = Math.min.apply(null, whosOf(x).map(function (w) { return fwhoR(w || 'solo'); }));
    return wr <= fwR(o.where) && hr <= fwhoR(o.who || finWho()) && (!o.lv || x.lv <= o.lv) && (!o.short || x.t <= 5) && (!o.vid || !!x.v) && (!o.nogear || NOGEAR.test((x.eq || '').trim()));
  }
  function finPlan(R) {
    var out = [], tot = 0, more = true, q = fin.goals.map(function (g) { return R.filter(function (r) { return r.g.indexOf(g) >= 0; }); });
    while (more) { more = false; q.forEach(function (L) { var r = L.find(function (r) { return out.indexOf(r) < 0 && tot + r.x.t <= fin.time; }); if (r) { out.push(r); tot += r.x.t; more = true; } }); }
    if (!out.length && R.length) out.push(R.reduce(function (a, b) { return b.x.t < a.x.t ? b : a; }));
    var ord = function (x) { return x.c === 'arm' ? 0 : x.c === 'ath' ? 1 : x.c === 'iq' ? 8 : 5; };
    out.sort(function (a, b) { return ord(a.x) - ord(b.x); });
    var thr = out.some(function (r) { return ['throw', 'pitch', 'of', 'catch'].indexOf(r.x.c) >= 0; }), warm = thr && !out.some(function (r) { return r.x.c === 'arm'; }) ? DR.a1 : null;
    return { L: out.map(function (r) { return r.x; }), tot: out.reduce(function (a, r) { return a + r.x.t; }, 0), warm: warm };
  }
  function finGear(L) {
    var seen = {}, out = [];
    L.forEach(function (x) { String(x.eq || '').split(/,| or /).forEach(function (s) { s = s.trim().replace(/\.$/, ''); if (!s || NOGEAR.test(s) || /^(see the video|optional)$/i.test(s)) return; var k = s.toLowerCase().replace(/^(a|an|the) /, '').replace(/s$/, ''); if (seen[k]) return; seen[k] = 1; out.push(s.charAt(0).toUpperCase() + s.slice(1)); }); });
    return out;
  }
  function finHTML() {
    var Pl = finPool(), R = Pl.filter(function (r) { return finOK(r.x); }), L = R.map(function (r) { return r.x; }), hid = Pl.length - R.length, gl = fin.goals.map(goalOf).filter(Boolean), pick = !gl.length || fin.open;
    var cnt = function (o) { return Pl.filter(function (r) { return finOK(r.x, Object.assign({}, fin, o)); }).length; };
    var chip = function (on, a, t, n) { return '<button class="fchip ' + (on ? 'on' : '') + '" data-a="' + a + '">' + t + (n != null ? '<span class="fcn">' + n + '</span>' : '') + '</button>'; };
    var h = back('#', 'Bullpen') + title('<img src="' + IMG + 'cat/goal.png" alt="" onerror="this.src=\'' + IMG + 'trophy.png\'">', 'What do you want to work on?', gl.length ? gl.map(function (g) { return g[2]; }).join(' · ') : 'Pick a goal. We\'ll build the plan.');
    if (pick) {
      h += '<p class="lead">' + (gl.length ? 'Pick as many as you like. Tap again to take one off.' : 'What do you want to get better at? Tap one or more.') + '</p>' +
        X.GOAL_GRP.map(function (gg) { return '<div class="fdg"><h3>' + gg[0] + ' ' + esc(gg[1]) + '</h3><div class="goals">' + gg[2].map(goalOf).filter(Boolean).map(function (g) { return '<button class="goal ' + (fin.goals.indexOf(g[0]) >= 0 ? 'on' : '') + '" data-a="fg:' + g[0] + '"><span>' + g[1] + '</span><b>' + esc(g[2]) + '</b></button>'; }).join('') + '</div></div>'; }).join('') +
        (gl.length ? '<button class="cta stick" data-a="fdone"><img src="' + IMG + 'button.png" alt=""><span>Show my plan · ' + L.length + ' drill' + (L.length === 1 ? '' : 's') + '</span></button>' : '');
    } else {
      h += '<section class="fdsel"><small>Working on</small><div class="fr">' + gl.map(function (g) { return '<button class="fchip on" data-a="fg:' + g[0] + '" aria-label="Remove ' + esc(g[2]) + '">' + g[1] + ' ' + esc(g[2]) + ' ✕</button>'; }).join('') + '</div><button class="ghost sm" data-a="fopen">Change or add goals</button></section>';
    }
    if (!gl.length) return h;
    var mn = (fin.lv ? 1 : 0) + (fin.short ? 1 : 0) + (fin.vid ? 1 : 0) + (fin.nogear ? 1 : 0);
    h += '<h2 class="grp"><b>Where will you be?</b></h2><div class="fr">' + X.FW.map(function (w) { return chip(fin.where === w[0], 'fw:' + w[0], w[1] + ' ' + w[2], cnt({ where: w[0] })); }).join('') + '</div>' +
      '<h2 class="grp"><b>Who\'s doing it?</b></h2><div class="fr">' + X.FWHO.map(function (w) { return chip(finWho() === w[0], 'fwho:' + w[0], w[1] + ' ' + w[2], cnt({ who: w[0] })); }).join('') + '</div>' +
      '<details class="more" ' + (mn ? 'open' : '') + '><summary>More filters' + (mn ? ' · ' + mn + ' on' : '') + '</summary>' +
      '<p class="lfl">Only show</p><div class="fr">' + chip(fin.short, 'fx:short', '5 min or less', cnt({ short: !fin.short })) + chip(fin.vid, 'fx:vid', 'Has a video', cnt({ vid: !fin.vid })) + chip(fin.nogear, 'fx:nogear', 'No equipment', cnt({ nogear: !fin.nogear })) + '</div>' +
      (mn ? '<button class="ghost sm" data-a="fclr">Clear these filters</button>' : '') + '</details>';
    if (!L.length) return h + '<div class="empty">Nothing fits right now. ' + (fwR(fin.where) < 2 ? 'Try a bigger space, ' : '') + (fwhoR(finWho()) < 2 ? 'add a helper, ' : '') + 'or clear a filter.</div>';
    var pl = finPlan(R), gear = finGear(pl.L.concat(pl.warm ? [pl.warm] : []));
    var forG = function (x) { var r = R.find(function (r) { return r.x === x; }); return r && gl.length > 1 ? '<small class="fdfor">For: ' + r.g.map(function (g) { return esc(goalOf(g)[2]); }).join(' · ') + '</small>' : ''; };
    h += '<h2 class="grp"><b>Today\'s plan</b><span>' + (pl.tot + (pl.warm ? pl.warm.t : 0)) + ' min</span></h2>' +
      '<div class="fr"><span class="pgs">How much time?</span>' + X.FT.map(function (t) { return chip(fin.time === t, 'ft:' + t, t + ' min'); }).join('') + '</div>' +
      '<section class="plan">' + (pl.warm ? '<div class="pstepw"><i>🔥</i><div><small>Warm up first (throwing today)</small>' + drillRow(pl.warm) + '</div></div>' : '') +
      pl.L.map(function (x, i) { return '<div class="pstepw"><i>' + (i + 1) + '</i><div>' + forG(x) + drillRow(x) + '</div></div>'; }).join('') +
      '<p class="eq">' + (gear.length ? '<b>You\'ll need:</b> ' + gear.map(esc).join(' · ') : '<b>No equipment needed.</b>') + '</p>' +
      '<p class="eq">Do this plan 3 days this week. When it feels easy, come back and pick the next drills on the list.</p></section>' +
      '<button class="ghost" data-a="fshare">Send this plan</button>' +
      gl.slice(0, 3).map(function (g) { return X.GOAL_TIP[g[0]] ? '<div class="tip"><small>Tip · ' + g[1] + ' ' + esc(g[2]) + '</small>' + esc(X.GOAL_TIP[g[0]]) + '</div>' : ''; }).join('') +
      '<h2 class="grp"><b>All matching drills</b><span>' + L.length + '</span></h2>' + R.map(function (r) { return drillRow(r.x); }).join('') +
      (hid ? '<div class="note">' + hid + ' more drill' + (hid === 1 ? '' : 's') + ' for ' + (gl.length > 1 ? 'these goals' : 'this goal') + ' need' + (hid === 1 ? 's' : '') + ' more room, more people or a different filter. <button class="ghost sm" data-a="fall">Show all ' + Pl.length + '</button></div>' : '');
    return h;
  }
  function finShare() {
    var Pl = finPlan(finPool().filter(function (r) { return finOK(r.x); })), gl = fin.goals.map(goalOf).filter(Boolean), L = (Pl.warm ? [Pl.warm] : []).concat(Pl.L), gear = finGear(L);
    var txt = 'BigDawgz drill plan (' + (Pl.tot + (Pl.warm ? Pl.warm.t : 0)) + ' min)\nWorking on: ' + gl.map(function (g) { return g[2]; }).join(', ') + '\n\n' +
      L.map(function (x, i) { return (Pl.warm && i === 0 ? 'Warm-up' : Pl.warm ? i : i + 1) + '. ' + x.n + ' (' + x.t + ' min)'; }).join('\n') + (gear.length ? '\n\nYou\'ll need: ' + gear.join(', ') : '') + '\n\nOpen the Dugout for how-to steps and videos: ' + location.origin + location.pathname;
    if (navigator.share) { navigator.share({ title: 'Drill plan', text: txt }).catch(function () {}); return; }
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { toast('Plan copied. Paste it in a text.'); }, function () { toast('Couldn\'t copy on this device'); });
  }

  /* ---------- drill sheet ---------- */
  function chipT(t, c) { return '<span class="chip"' + (c ? ' style="--c:' + c + '"' : '') + '>' + esc(t) + '</span>'; }
  function sheetHTML(id) {
    var x = DR[id], c = CAT[x.c], n = p.done[id] || 0, y = ytId(x.v);
    var q = 'rel=0&modestbranding=1&playsinline=1' + (x.s ? '&start=' + x.s : '') + (x.e ? '&end=' + x.e : '');
    return '<div class="sh" role="dialog" aria-modal="true" aria-label="' + esc(x.n) + '" style="--c:' + c.c + '"><button class="x" data-a="close" aria-label="Close">✕</button>' +
      '<div class="shd">' + catIcon(x.c, "shic") + '<div><small>' + esc(c.n) + (x.cl ? ' · Cleary: ' + esc(x.cl) : '') + '</small><h2>' + esc(x.n) + '</h2>' + (x.aka ? '<p class="shaka">' + (x.cl ? 'Cleary name' : 'Coaches call it') + ': “' + esc(x.aka) + '”</p>' : '') + '</div></div>' +
      '<div class="tags">' + chipT(x.t + ' min', c.c) + whosOf(x).map(function (w) { return chipT(X.WHO_L[w] || w); }).join('') + chipT([x.where].concat(x.wh || []).map(function (w) { return X.WHERE_L[w] || w; }).join(' · ')) + '</div>' +
      (y ? '<div class="kflow"><span class="on">1 Watch it</span><span>2 Do it</span><span>3 Check it off</span></div><div class="ivid" id="ivid"><button class="vplay" data-a="vplay:' + id + '" aria-label="Play the video"><img src="' + thumb(x.v) + '" alt="" onerror="this.remove()"><i>▶</i><em>' + (x.e ? fmtT(clipLen(x)) + ' clip' : 'How-to video') + '</em></button></div>' : '') +
      '<h4>Purpose</h4><p class="why">' + esc(x.why) + '</p>' + (x.eq ? '<p class="eqn"><b>You need:</b> ' + esc(x.eq) + '</p>' : '') +
      '<h4>How to do it</h4><ol>' + x.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
      '<h4>Coach says</h4><div class="cues">' + x.cues.map(function (q) { return '<span>' + esc(q) + '</span>'; }).join('') + '</div>' +
      (x.game ? '<div class="mg"><small>Make it a game</small>' + esc(x.game) + '</div>' : '') +
      (x.c === 'arm' || x.c === 'pitch' ? '<p class="safe">Growing arms: easy effort, regular baseball or a soft ball. No weighted balls.</p>' : '') +
      (P.who === 'coach' ? '<a class="cta" href="../app/#coach&a=asgdrill:' + id + '"><img src="' + IMG + 'button.png" alt=""><span>Assign this drill</span></a>' :
       P.who === 'parent' ? '' : '<button class="cta" data-a="did:' + id + '"><img src="' + IMG + 'button.png" alt=""><span>I did it! +' + 10 * x.lv + ' XP</span></button>') +
      (P.who === 'coach' || P.who === 'parent' ? '' : '<div class="srow2"><span>' + (n ? 'You\'ve done this ' + n + ' time' + (n > 1 ? 's' : '') : 'First time? Go slow.') + '</span><button class="ghost sm" data-a="fav:' + id + '">' + (p.fav.indexOf(id) >= 0 ? '★ Saved' : '☆ Save') + '</button></div>') + '</div>';
  }
  function didDrill(id) {
    var x = DR[id], before = p.done[id] || 0;
    p.done[id] = before + 1; p.cats = p.cats || {}; p.cats[x.c] = (p.cats[x.c] || 0) + 1; p.log.unshift({ id: id, d: P.today() }); p.log = p.log.slice(0, 30);
    var up = P.award(10 * x.lv);
    S.tone(784, .08, 'triangle', .07); setTimeout(function () { S.tone(1046, .12, 'triangle', .07); }, 90);
    toast(up ? 'Level up! You\'re ' + up + '.' : 'Nice work! +' + 10 * x.lv + ' XP');
    if (before < PATH_N && p.done[id] >= PATH_N) X.PATHS.forEach(function (Pa) {
      var L = pathSteps(Pa), i = L.indexOf(id); if (i < 0) return;
      var all = L.every(function (k) { return (p.done[k] || 0) >= PATH_N; });
      if (all && !p.pathDone[Pa[0]]) { p.pathDone[Pa[0]] = P.today(); P.award(50); setTimeout(function () { toast(Pa[2] + ' Path complete! +50 XP'); }, 2500); }
      else if (L[i + 1] && (p.done[L[i + 1]] || 0) < PATH_N) setTimeout(function () { toast('Next up on your ' + Pa[2] + ' path: ' + DR[L[i + 1]].n); }, 2500);
    });
    save();
  }

  /* ---------- router: #finder, #program, #path/gb, and #d/<id> opens a drill over the page ---------- */
  var curView = null;
  function page(view) { return view === 'finder' ? finHTML() : view === 'program' ? progHTML() : view.indexOf('path/') === 0 ? pathHTML(view.slice(5)) : libHTML(); }
  function route(force) {
    var h = location.hash.replace(/^#\/?/, ''), m = h.match(/^d\/(\w+)/), view = m ? (curView == null ? '' : curView) : h;
    if (view !== curView || force) {
      var y = view === curView ? scrollY : 0;
      app.innerHTML = page(view); curView = view;
      document.title = (view === 'finder' ? 'What do you want to work on?' : view === 'program' ? 'Cleary Throwing Program' : view.indexOf('path/') === 0 ? 'Skill Path' : 'Bullpen') + ' · BigDawgz Dugout';
      scrollTo(0, y);
    }
    if (m && DR[m[1]]) { if (!sheetEl.classList.contains('on') || sheetEl.dataset.id !== m[1]) { sheetEl.innerHTML = sheetHTML(m[1]); sheetEl.dataset.id = m[1]; sheetEl.className = 'on'; sheetEl.scrollTop = 0; } document.body.classList.add('lock'); }
    else { sheetEl.className = ''; sheetEl.innerHTML = ''; sheetEl.dataset.id = ''; document.body.classList.remove('lock'); }
  }
  function rerender() { route(true); }
  var opened = false;
  function closeSheet() { if (opened) { opened = false; history.back(); } else location.hash = curView ? '#' + curView : '#'; }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]');
    if (!b) { if (e.target === sheetEl) closeSheet(); var a = e.target.closest('a[href^="#d/"]'); if (a) { opened = true; S.tone(660, .06, 'sine', .05); } return; }
    var k = b.dataset.a, v = k.slice(k.indexOf(':') + 1);
    if (k === 'close') return closeSheet();
    if (k.indexOf('cat:') === 0) { lib.cat = lib.cat === v ? '' : v; lib.f.in = false; if (lib.cat) lib.spot = lib.cat; if (location.hash.replace('#', '')) location.hash = '#'; rerender(); return; }
    if (k.indexOf('f:') === 0) { lib.f[v] = !lib.f[v]; if (v === 'in' && lib.f.in) lib.cat = ''; rerender(); return; }
    if (k === 'clr') { lib = { q: '', cat: '', f: {}, w: '', spot: '' }; rerender(); return; }
    if (k.indexOf('spot:') === 0) {
      lib.spot = lib.spot === v ? '' : v; S.tone(lib.spot ? 620 : 440, .06, 'sine', .05);
      var Ls = document.getElementById('list'); if (Ls) Ls.innerHTML = listHTML();
      var sh = document.getElementById('spsh'); if (sh) { var r = sh.getBoundingClientRect(); if (r.bottom > innerHeight) scrollBy({ top: r.bottom - innerHeight + 16, behavior: 'smooth' }); var f = sh.querySelector('.lcard'); f && f.focus({ preventScroll: true }); }
      else { var sp = document.querySelector('.spot[data-a="spot:' + v + '"]'); sp && sp.focus({ preventScroll: true }); }
      return;
    }
    if (k.indexOf('w:') === 0) { lib.w = v; rerender(); return; }
    if (k.indexOf('fg:') === 0) { var i = fin.goals.indexOf(v); i >= 0 ? fin.goals.splice(i, 1) : fin.goals.push(v); if (!fin.goals.length) fin.open = true; finSave(); rerender(); return; }
    if (k === 'fdone') { fin.open = false; finSave(); rerender(); scrollTo(0, 0); return; }
    if (k === 'fopen') { fin.open = true; finSave(); rerender(); return; }
    if (k.indexOf('fw:') === 0) { fin.where = v; finSave(); rerender(); return; }
    if (k.indexOf('fwho:') === 0) { fin.who = v; finSave(); rerender(); return; }
    if (k.indexOf('ft:') === 0) { fin.time = +v; finSave(); rerender(); return; }
    if (k.indexOf('fx:') === 0) { fin[v] = !fin[v]; finSave(); rerender(); return; }
    if (k === 'fclr') { fin.lv = 0; fin.short = fin.vid = fin.nogear = false; finSave(); rerender(); return; }
    if (k === 'fall') { fin.where = 'field'; fin.who = 'team'; fin.lv = 0; fin.short = fin.vid = fin.nogear = false; finSave(); rerender(); return; }
    if (k === 'fshare') return finShare();
    if (k.indexOf('vplay:') === 0) {
      var x = DR[v], q = 'rel=0&modestbranding=1&playsinline=1&autoplay=1' + (x.s ? '&start=' + x.s : '') + (x.e ? '&end=' + x.e : '');
      document.getElementById('ivid').innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + ytId(x.v) + '?' + q + '" title="' + esc(x.n) + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
      var f = sheetEl.querySelectorAll('.kflow span'); if (f[1]) { f[0].classList.remove('on'); f[1].classList.add('on'); }
      return;
    }
    if (k.indexOf('did:') === 0) { didDrill(v); var y = scrollY; app.innerHTML = page(curView || ''); scrollTo(0, y); var sy = sheetEl.scrollTop; sheetEl.innerHTML = sheetHTML(v); sheetEl.scrollTop = sy; sheetEl.querySelectorAll('.kflow span').forEach(function (s, i) { s.classList.toggle('on', i === 2); }); return; }
    if (k.indexOf('fav:') === 0) { var j = p.fav.indexOf(v); j >= 0 ? p.fav.splice(j, 1) : p.fav.push(v); save(); var sy2 = sheetEl.scrollTop; sheetEl.innerHTML = sheetHTML(v); sheetEl.scrollTop = sy2; return; }
  });
  document.addEventListener('input', function (e) { if (e.target.id !== 'q') return; lib.q = e.target.value; var L = document.getElementById('list'); if (L) L.innerHTML = listHTML(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheetEl.className === 'on') closeSheet(); });
  document.addEventListener('error', function (e) { var t = e.target; if (t && t.classList && t.classList.contains('thimg')) { var w = t.parentNode; t.remove(); } }, true);
  window.addEventListener('hashchange', function () { route(); });
  route();
})();
