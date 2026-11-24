/* Rebuilt team-app screens in the park design. Each one uses the app's own data and actions
   (same data-a buttons the app already understands), only the layout and art are new.
   Loaded after the app's code and before app-paint.js. */
(function () {
  if (typeof S === 'undefined' || typeof homeHTML !== 'function') return;
  var I = '../assets/img/';
  var CI = { arm: 'arm', throw: 'throw', pitch: 'pitch', hit: 'hit', field: 'field', of: 'of', catch: 'catch', run: 'run', ath: 'ath', iq: 'iq', fun: 'fun', game: 'star' };
  function icon(c, cls) { return '<img class="' + (cls || 'zic') + '" src="' + I + 'cat/' + (CI[c] || 'star') + '.png" alt="">'; }
  function ytId(u) { var m = String(u || '').match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/); return m ? m[1] : ''; }
  function safe(f, d) { try { return f(); } catch (e) { return d == null ? '' : d; } }
  function ring(pct, lv) {
    var r = 26, c = 2 * Math.PI * r;
    return '<span class="zring"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="' + r + '" class="t"/><circle cx="32" cy="32" r="' + r + '" class="f" stroke-dasharray="' + (c * pct / 100).toFixed(1) + ' ' + c.toFixed(1) + '"/></svg><b>' + lv + '</b></span>';
  }
  function board(title, sub, body, cls) {
    return '<section class="zboard ' + (cls || '') + '"><div class="zplank"><img src="' + I + 'plank.png" alt=""><b>' + title + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</div>' + body + '</section>';
  }

  /* ================= TODAY (player home) ================= */
  homeHTML = function () {
    var p = me(); if (!p) return topbar() + '<main></main>' + nav();
    var L = level(p.xp), t = today(), all = hwOpen(p),
      open = all.filter(function (h) { return (!h.on || h.on <= t) && !(h.wk && isPhys(DR[h.id]) && busyOn(p, t).length); }),
      later = all.filter(function (h) { return h.on && h.on > t; }),
      doneToday = p.hw.filter(function (h) { return h.done === t; }).length;
    var q = safe(function () { return econ(p) || p; }, p), bank = +(q.bank || 0);
    var dd = DV()[hash(t + p.id) % DV().length], tq = hash(t + 'q') % TRIVIA.length, sh = (p.shouts || []).slice(-2).reverse();
    var hello = ['Let\'s get better today', 'Time to put in work', 'Every rep counts', 'Go get it'][hash(t) % 4];

    var hero = '<section class="zhero"><img class="zchest" src="' + I + (open.length ? 'chest.png' : 'chest-open.png') + '" alt="">' +
      '<div class="zhi"><small>' + esc(nice(t)) + '</small><h1>Hey, ' + esc(p.n) + '</h1><p>' + hello + '</p></div>' +
      '<button class="zlvl" data-a="go:xp" aria-label="Level ' + (L.i + 1) + ', ' + esc(L.n) + '. Open XP">' + ring(L.pct, L.i + 1) +
      '<span class="zlt"><b>' + esc(L.n) + '</b><span class="zbar"><i style="width:' + L.pct + '%"></i></span><small>' + (p.xp || 0).toLocaleString() + ' XP' + (L.hi ? ' · ' + (L.hi - p.xp) + ' to ' + esc(L.next) : '') + '</small></span>' +
      '<span class="zchips"><span class="zchip"><img src="' + I + 'coin.png" alt="">' + bank.toLocaleString() + '<small>to spend</small></span><span class="zchip ' + (p.streak ? '' : 'cold') + '">🔥' + (p.streak || 0) + '<small>day' + (p.streak === 1 ? '' : 's') + '</small></span></span></button></section>';

    var todo = '<div class="todo-box zt">' + board('Today\'s to-do', doneToday + ' of ' + (doneToday + open.length) + ' done',
      open.length ? open.map(function (h) {
        var i = p.hw.indexOf(h), x = DR[h.id]; if (!x) return '';
        var late = h.due < t;
        return '<div class="hw zhw" style="--c:' + CAT[x.c].c + '"><button class="hwm" data-a="drill:' + x.id + '">' + icon(x.c) + '<span class="dtx"><b>' + esc(x.n) + '</b><small>' + esc(h.reps || x.t + ' min') + ' · ' + (late ? '<em>overdue</em>' : 'due ' + nice(h.due)) + '</small>' + (h.note ? '<small class="note">“' + esc(h.note) + '”</small>' : '') + '</span></button>' +
          (x.gk ? '<button class="done zdone" data-a="game:' + x.gk + '">Play</button>' : '<button class="done zdone" data-a="hw:' + i + '" aria-label="Done: ' + esc(x.n) + '">✓<small>Done</small></button>') + '</div>';
      }).join('') : '<div class="zempty"><img src="' + I + 'trophy.png" alt=""><b>All done for today!</b><span>Play a game or pick a drill in the Bullpen for bonus XP.</span></div>') + '</div>';

    var shouts = sh.length ? '<section class="shouts zsh">' + sh.map(function (s) {
      return '<div class="zbub"><img src="' + I + 'team-logo.png" alt=""><div><small>' + (s.from ? esc(s.from) + ' says' : 'Coach says') + '</small><b>' + esc(s.t) + '</b></div></div>';
    }).join('') + '</section>' : '';

    var a = (S.ann || []).slice(-1)[0], n = safe(function () { return upcoming()[0]; }, null);
    var news = (a ? '<div class="ann znote"><small>From Coach · ' + nice(a.at) + '</small><b>' + esc(a.t) + '</b></div>' : '') +
      (n ? '<button class="rowb nextev znext" data-a="go:sched"><img src="' + I + 'scoreboard.png" alt=""><span class="dtx"><small>Next up</small><b>' + esc(n.t) + '</b><small>' + (n.d === t ? 'Today' : nice(n.d)) + ' · ' + esc(n.time || '') + (n.at ? ' · ' + esc(n.at) : '') + '</small></span><span class="arr">›</span></button>' : '');

    var ds = weekDays(), act = p.act || {}, dn = hwDone(p).length, nAct = ds.filter(function (d) { return act[d]; }).length, tot = ds.reduce(function (s, d) { return s + (act[d] || 0); }, 0);
    var week = board('This week', nAct + ' of 7 days',
      '<div class="zwk">' + ds.map(function (d, i) { return '<div class="' + (act[d] ? 'on' : '') + (d === t ? ' td' : '') + '"><span>' + (act[d] ? '<img src="' + I + 'ball.png" alt="">' : '') + '</span><small>' + 'MTWTFSS'[i] + '</small></div>'; }).join('') + '</div>' +
      '<div class="zstats"><div><b>' + tot + '</b><small>things done</small></div><div><b>' + dn + '/' + (dn + all.length) + '</b><small>homework</small></div><div><b>' + Object.keys(act).length + '</b><small>active days</small></div></div>', 'wkc');

    var lat = '';
    if (later.length) {
      var by = {}; later.forEach(function (h) { (by[h.on] = by[h.on] || []).push(h); });
      lat = board('Coming up', 'this plan', '<div class="zlater">' + Object.keys(by).sort().slice(0, 7).map(function (d) { return '<div><b>' + nice(d) + '</b><span>' + by[d].map(function (h) { return DR[h.id] ? esc(DR[h.id].n) : ''; }).join(' · ') + '</span></div>'; }).join('') + '</div>');
    }

    var y = ytId(safe(function () { return vid(dd); }) || dd.v);
    var extra = '<h2 class="zh2">Extra credit <small>bonus XP</small></h2><div class="dd zdd">' +
      '<button class="ddc zddc" data-a="drill:' + dd.id + '" style="--c:' + CAT[dd.c].c + '"><span class="zth">' + (y ? '<img src="https://i.ytimg.com/vi/' + y + '/hqdefault.jpg" alt="" onerror="this.remove()">' : '') + icon(dd.c, 'zthi') + '</span><small>Drill of the day</small><b>' + esc(dd.n) + '</b><span>' + dd.t + ' min</span></button>' +
      '<button class="ddc zddc" data-a="game:trivia:' + tq + '" style="--c:#4EE1C1"><span class="zth zq"><img class="zthi" src="' + I + 'cat/iq.png" alt=""></span><small>Question of the day</small><b>' + esc(TRIVIA[tq][0]) + '</b><span>Tap to answer</span></button></div>';

    var sports = (p.sports || []).length;
    var tail = '<button class="rowb zrow" data-a="go:finder"><img src="' + I + 'cat/goal.png" alt=""><span class="dtx"><b>What do you want to work on?</b><small>Pick a goal and get the drills for it.</small></span><span class="arr">›</span></button>' +
      '<button class="rowb osbtn zrow" data-a="go:osp"><img src="' + I + 'cat/ath.png" alt=""><span class="dtx"><b>My other sports' + (sports ? ' · ' + sports : '') + '</b><small>' + (sports ? esc(p.sports.map(function (s) { return s.e; }).join(' ')) + ' On those days, baseball workouts come off' : 'Play another sport? Add it so your baseball work fits around it') + '</small></span><span class="arr">›</span></button>' +
      '<div class="tip ztip"><small>Dugout wisdom</small>' + esc(TIPS[hash(t) % TIPS.length]) + '</div>' +
      '<p class="safe">If your arm hurts, stop and tell your coach or a parent. Sore is okay. Pain is not.</p>';

    return topbar() + '<main class="zmain" data-tidy="1">' + hero + safe(function () { return qsHTML(p); }) + safe(function () { return busyBanner(p, t); }) +
      todo + shouts + news + week + safe(function () { return tutCard(); }) + (safe(function () { return reelsOn(); }, false) ? safe(function () { return reelsCard(); }) : '') +
      lat + extra + tail + '</main>' + nav();
  };

  /* ================= MY CARD ================= */
  meHTML = function () {
    var p = me(); if (!p) return topbar('My Card') + '<main></main>' + nav();
    var L = level(p.xp), got = p.badges || [];
    var card = safe(function () { return cardHTML(p); });
    var h = '<main class="zmain">' +
      '<section class="zcardwrap">' + card + '</section>' +
      '<div class="zquick"><button data-a="hsp:me"><img src="' + I + 'cat/star.png" alt=""><b>My high scores</b><small>Every game</small></button><button data-a="go:boards"><img src="' + I + 'trophy.png" alt=""><b>Leaderboards</b><small>See where you rank</small></button><button data-a="go:xp"><img src="' + I + 'coin.png" alt=""><b>My XP</b><small>' + (p.xp || 0).toLocaleString() + ' XP · ' + esc(L.n) + '</small></button><button data-a="go:locker"><img src="' + I + 'glove.png" alt=""><b>Locker</b><small>Gear and jersey</small></button></div>' +
      board('Badges', got.length + ' of ' + BADGES.length, '<div class="zbadges">' + BADGES.map(function (b) {
        var on = got.indexOf(b[0]) >= 0;
        return '<div class="zbdg ' + (on ? 'on' : '') + '"><span>' + b[1] + '</span><b>' + esc(b[2]) + '</b><small>' + esc(b[3]) + '</small></div>';
      }).join('') + '</div>') +
      board('My skills', 'drills done by type', '<div class="zskills">' + CATS.filter(function (c) { return c.k !== 'fun'; }).map(function (c) {
        var n = (p.cats || {})[c.k] || 0;
        return '<div class="zsk" style="--c:' + c.c + '">' + icon(c.k) + '<span><b>' + esc(c.n) + '</b><span class="zbar"><i style="width:' + Math.min(100, n * 10) + '%"></i></span></span><em>' + n + '</em></div>';
      }).join('') + '</div>') +
      ((p.fav || []).length ? board('Saved drills', p.fav.length, p.fav.map(function (id) { return DR[id] ? drillRow(DR[id]) : ''; }).join('')) : '') +
      ((p.log || []).length ? board('Lately', '', p.log.slice(0, 5).map(function (l) { return DR[l.id] ? drillRow(DR[l.id], '<small class="when">' + nice(l.d) + '</small>') : ''; }).join('')) : '') +
      '<button class="rowb osbtn zrow" data-a="go:osp"><img src="' + I + 'cat/ath.png" alt=""><span class="dtx"><b>My other sports</b><small>' + ((p.sports || []).length ? esc(p.sports.map(function (s) { return s.e + ' ' + s.n; }).join(' · ')) : 'Add soccer, hoops, anything') + '</small></span><span class="arr">›</span></button>' +
      safe(function () { return tutReplayBtn(); }) +
      '</main>';
    return topbar('My Card', (p.num ? '#' + p.num + ' · ' : '') + (p.pos || '')) + h + nav();
  };
  window.zBoard = board; window.zIcon = icon; window.zRing = ring;
})();

/* ================= COACH'S VIEW ================= */
(function () {
  if (typeof teamHTML !== 'function') return;
  var I = '../assets/img/', prev = teamHTML;
  var TABS = [['players', 'team-logo', 'Players'], ['master', 'binder', 'Masterfile'], ['money', 'coin', 'Money'], ['program', 'cat/path', 'Program'], ['assign', 'cat/goal', 'Assign'], ['settings', 'cat/star', 'Team']];
  function safe(f) { try { return f(); } catch (e) { return ''; } }
  /* the content of any tab except Players comes from the app's own panels */
  function tabBody(html) {
    var d = document.createElement('div'); d.innerHTML = html;
    var m = d.querySelector('main'); if (!m) return '';
    var seg = m.querySelector('.seg.six'); if (!seg) return m.innerHTML;
    while (m.firstChild && m.firstChild !== seg) m.removeChild(m.firstChild);
    seg.remove(); return m.innerHTML;
  }
  teamHTML = function () {
    if (S.peek) return prev();
    var ct = window._ct || 'players', t = today(), L = S.players.filter(function (p) { return !p.tmp; });
    var act = L.filter(function (p) { return p.last === t; }).length,
      open = L.reduce(function (a, p) { return a + hwOpen(p).length; }, 0), dn = L.reduce(function (a, p) { return a + hwDone(p).length; }, 0);
    var hero = '<section class="zcoach"><img src="' + I + 'team-logo.png" alt=""><div><small>' + esc(nice(t)) + '</small><h1>' + esc(S.team) + '</h1><p>Players, program, assigning and settings</p></div></section>';
    var tabs = '<nav class="ztabs seg six" aria-label="Coach sections">' + TABS.map(function (x) {
      return '<button class="' + (ct === x[0] ? 'on' : '') + '" data-a="ct:' + x[0] + '"><img src="' + I + x[1] + '.png" alt="">' + x[2] + '</button>';
    }).join('') + '</nav>';
    var body;
    if (ct === 'players') {
      var wkN = function (p) { return weekDays().filter(function (d) { return (p.act || {})[d]; }).length; };
      var sorts = { hw: function (a, b) { return hwOpen(b).length - hwOpen(a).length; }, last: function (a, b) { return (a.last || '') < (b.last || '') ? -1 : 1; }, week: function (a, b) { return wkN(b) - wkN(a); } };
      var rows = L.slice().sort(sorts[window._ts] || function (a, b) { return b.xp - a.xp; }), mx = Math.max.apply(null, rows.map(function (p) { return p.xp; }).concat([1]));
      var ago = function (p) { return !p.last ? 'never' : p.last === t ? 'today' : p.last === addDays(t, -1) ? 'yesterday' : nice(p.last); };
      body = '<div class="zcstats"><div><b>' + L.length + '</b><small>Players</small></div><div><b>' + act + '</b><small>Active today</small></div><div><b>' + dn + '/' + (dn + open) + '</b><small>Homework done</small></div></div>' +
        safe(function () { return filmReviewHTML(); }) + safe(function () { return bpvBtn(); }) +
        safe(function () { return nudgeHTML(); }) +
        zBoard('Progress', 'tap a player', '<div class="fr zsort">' + [['xp', 'Most XP'], ['week', 'Most active'], ['hw', 'Most homework left'], ['last', 'Longest since active']].map(function (s) {
          return '<button class="fchip ' + ((window._ts || 'xp') === s[0] ? 'on' : '') + '" data-a="tsort:' + s[0] + '">' + s[1] + '</button>';
        }).join('') + '</div>' + rows.map(function (p, i) {
          var o = hwOpen(p).length, d = hwDone(p).length, r = safe(function () { return restInfo(p); }) || { ok: true }, tot = o + d;
          return '<button class="prow2 zpl" data-a="player:' + p.id + '" style="--c:' + p.col + '"><span class="zrk">' + (i + 1) + '</span><span class="zav" style="--c:' + p.col + '"><b>' + esc(p.num) + '</b></span>' +
            '<span class="zpm"><b>' + esc(p.n) + '</b><small>' + esc(level(p.xp).n) + ' · ' + esc(p.pos || '') + ' · active ' + ago(p) + '</small>' +
            '<span class="zpb"><span>XP</span><span class="zbar"><i style="width:' + (p.xp / mx * 100) + '%"></i></span><em>' + p.xp + '</em></span>' +
            '<span class="zpb"><span>HW</span><span class="zbar hw"><i style="width:' + (tot ? d / tot * 100 : 0) + '%"></i></span><em>' + d + '/' + tot + '</em></span>' +
            '<span class="zwk7">' + weekDays().map(function (d2) { return '<i class="' + ((p.act || {})[d2] ? 'on' : '') + '"></i>'; }).join('') + '<em>' + wkN(p) + '/7</em></span></span>' +
            '<span class="zside"><span class="' + (p.streak ? '' : 'cold') + '">🔥' + (p.streak || 0) + '</span>' + (r.ok ? '' : '<small class="rest">resting</small>') + '</span></button>';
        }).join(''));
    } else body = tabBody(prev());
    return topbar() + '<main class="zmain zcv">' + hero + tabs + body + '</main>' + nav();
  };
})();
