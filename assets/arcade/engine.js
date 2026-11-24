/* Basepaths Arcade: all 18 games from the BigDawgz Dugout app, same rules, levels, timers,
   strikes, XP and high scores, drawn in the painted park style.
   Data (every question bank and setting) is in data.js. */
(function () {
  var A = window.ARC, P = window.Profile, S = window.Sound;
  var root = document.getElementById('game');
  var G = null;
  var LVN = A.LVN, LVW = A.LVW, GT = A.GAMES_T;
  var XPM = [1, 1.25, 1.5, 2];
  var ICON = {};
  A.GAMES.forEach(function (g) { ICON[g[0]] = '../assets/img/games/' + g[0] + '.png'; });

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function sh(a) { return a.map(function (x) { return [Math.random(), x]; }).sort(function (a, b) { return a[0] - b[0]; }).map(function (x) { return x[1]; }); }
  function R(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function range(n) { return Array.from({ length: n }, function (_, i) { return i; }); }
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  function game(k) { return A.GAMES.find(function (g) { return g[0] === k; }); }
  function bestKey(k, lv) { return lv ? k + '_' + lv : k; }
  function toast(msg) {
    var t = document.getElementById('toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('on'); }, 2200);
  }
  function hsPts(raw, lv) { return Math.round((raw || 0) * LVW[lv || 0]); }
  function hsUpdate(k, lv, raw) {
    var p = P.data, pts = hsPts(raw, lv), cur = p.hs[k];
    if (typeof raw === 'number' && pts > 0 && (!cur || pts > cur.s)) { p.hs[k] = { s: pts, lv: lv || 0, r: raw, d: P.today() }; P.save(); return true; }
    return false;
  }
  var sfx = {
    tap: function () { S.tone(660, .07, 'sine', .06); },
    good: function () { S.tone(880, .1, 'triangle', .08); S.tone(1320, .14, 'triangle', .07, .07); },
    bad: function () { S.tone(220, .22, 'triangle', .1, 0, 140); },
    crack: function () { S.tone(1500, .05, 'square', .08); S.tone(240, .12, 'triangle', .14); },
    win: function () { [523, 659, 784, 1047].forEach(function (f, i) { S.tone(f, .22, 'triangle', .08, i * .1); }); }
  };

  /* ---------- level rules (same as the old app) ---------- */
  function lvInfo(k) { return A.lvInfo[k]; }
  function livesFor(k, lv) { return GT[k] ? [0, 0, 3, 1][lv] : 0; }

  /* ---------- question builders ---------- */
  function mk(q, opts, why, x) { var o = sh(opts.map(function (t, i) { return [t, i === 0]; })); return Object.assign({ q: q, opts: o.map(function (y) { return y[0]; }), a: o.findIndex(function (y) { return y[1]; }), why: why }, x || {}); }
  function qzBuild(k, lv) {
    var QZ = A.QZ, pk = function (a, n) { return sh(a).slice(0, n); }, pq = function (a, n) { return sh(a).slice(0, lv === 3 ? a.length : n); };
    if (k === 'trivia') return pq(A.TRIVIA, [5, 7, 10, 12][lv]).map(function (t) { return { tag: t[4], q: t[0], opts: t[1], a: t[2], why: t[3] }; });
    if (k === 'score') return pq(A.SCORE, [8, 10, 10, 12][lv]).map(function (s) {
      var o = [s[1]]; while (o.length < 4) { var c = A.SCORE[R(0, A.SCORE.length - 1)][1]; if (o.indexOf(c) < 0) o.push(c); }
      o = sh(o); var why = /^\d/.test(s[1]) ? 'The numbers are the fielders who touched the ball, in order.' : /^[FL]/.test(s[1]) ? 'The letter is how it was hit, the number is who caught it.' : '';
      return { tag: 'How do you score it?', q: s[0], opts: o, a: o.indexOf(s[1]), why: (why ? 'It’s ' + s[1] + '. ' + why : 'It’s ' + s[1] + '.'), cls: 'two2' };
    });
    if (k === 'call') return pq(QZ.call, 8).map(function (c) { return mk(c[1], c[2], c[3], { tag: 'Call the pitch', sb: { c: c[0] } }); });
    if (k === 'count') {
      var M = { '0-0': 2, '1-0': 0, '2-0': 0, '3-0': 0, '0-1': 1, '1-1': 2, '2-1': 0, '3-1': 0, '0-2': 1, '1-2': 1, '3-2': 2 };
      var W = ['More balls than strikes. The pitcher has to throw a strike, so hunt a fastball in your spot.', 'More strikes than balls. The pitcher can make you chase, so shorten up and battle.', 'Balls and strikes are tied. Look for a good pitch to drive and don’t chase.'];
      var keys = Object.keys(M), list = lv === 3 ? [].concat(sh(keys), sh(keys), sh(keys), sh(keys), sh(keys), sh(keys), sh(keys), sh(keys), sh(keys)) : pk(keys, 8);
      return list.map(function (c) { return { tag: 'Whose count is it?', q: 'The count is ' + c + '.', opts: ['Hitter’s count', 'Pitcher’s count', 'Even'], a: M[c], why: c === '3-2' ? 'Full count. Both sides are one pitch away, so be ready to swing at anything close.' : W[M[c]], sb: { c: c } }; });
    }
    if (k === 'send') return pq(QZ.send, [8, 8, 10, 12][lv]).map(function (s) { return { tag: s[0] + (s[0] === 1 ? ' out' : ' outs'), q: s[2], opts: ['Send him!', 'Hold him!'], a: s[3] ? 0 : 1, why: s[4], sb: { o: s[0], r: s[1] }, cls: 'two2' }; });
    if (k === 'backup') return pq(QZ.backup, [8, 8, 10, 12][lv]).map(function (s) { return { tag: 'You are the ' + A.BNAME[s[0]], q: s[1] + ' Tap the field where you run.', field: { you: s[0], from: s[2], to: s[3] }, opts: ['Behind first', 'Behind second', 'Behind third', 'Behind home'], a: s[4], why: s[5] }; });
    if (k === 'rbook') return pq(QZ.rbook, [8, 10, 12, 12][lv]).map(function (r) { return mk(r[0], r[1], r[2], { tag: '12U rule book' }); });
    if (k === 'rules') return pq(QZ.rules, 8).map(function (r) { return mk(r[0], r[1], r[3], { tag: 'Make the call', cls: 'two2' }); });
    if (k === 'stat') {
      var f3 = function (v) { return v.toFixed(3).replace(/^0/, ''); };
      var num = function (v, fm, ds) { var o = [fm(v)]; sh(ds).forEach(function (d) { var w = v + d; if (w > .02 && o.length < 4 && o.indexOf(fm(w)) < 0) o.push(fm(w)); }); var s2 = sh(o); return { opts: s2, a: s2.indexOf(fm(v)), cls: 'two2' }; };
      var D = [.05, -.05, .1, -.1, .025, -.025, .15, .2], qs = [];
      var one = function () {
        var out = [];
        for (var i = 0; i < 2; i++) { var ab = lv >= 2 ? R(7, 60) : [10, 20, 25, 40, 50][R(0, 4)], h = R(2, ab / 2 | 0); out.push(Object.assign({ tag: 'Batting average', q: h + ' hits in ' + ab + ' at-bats. What’s the batting average?', why: 'Hits ÷ at-bats = ' + h + ' ÷ ' + ab + ' = ' + f3(h / ab) + '.' }, num(h / ab, f3, D))); }
        for (var j = 0; j < 2; j++) { var x = [[16, 4], [20, 5], [36, 4], [45, 5]][R(0, 3)], ab2 = x[0], bb = x[1], h2 = R(3, ab2 / 2 | 0); out.push(Object.assign({ tag: 'On-base percentage', q: h2 + ' hits and ' + bb + ' walks in ' + (ab2 + bb) + ' trips to the plate. What’s the on-base percentage?', why: '(Hits + walks) ÷ trips to the plate = ' + (h2 + bb) + ' ÷ ' + (ab2 + bb) + ' = ' + f3((h2 + bb) / (ab2 + bb)) + '.' }, num((h2 + bb) / (ab2 + bb), f3, D))); }
        var ab3 = [10, 20][R(0, 1)], s1 = R(1, 4), d2 = R(0, 3), hr = R(0, 2), tb = s1 + 2 * d2 + 4 * hr;
        out.push(Object.assign({ tag: 'Slugging percentage', q: 'In ' + ab3 + ' at-bats: ' + s1 + ' single' + (s1 === 1 ? '' : 's') + ', ' + d2 + ' double' + (d2 === 1 ? '' : 's') + ' and ' + hr + ' home run' + (hr === 1 ? '' : 's') + '. What’s the slugging percentage?', why: 'Total bases ÷ at-bats. Singles count 1, doubles 2, homers 4: ' + tb + ' ÷ ' + ab3 + ' = ' + f3(tb / ab3) + '.' }, num(tb / ab3, f3, D)));
        var ip = [4, 5, 10][R(0, 2)], hh = R(2, 8), b2 = R(0, 5), f2 = function (v) { return v.toFixed(2); };
        out.push(Object.assign({ tag: 'WHIP', q: 'A pitcher gave up ' + hh + ' hits and ' + b2 + ' walk' + (b2 === 1 ? '' : 's') + ' in ' + ip + ' innings. What’s his WHIP?', why: '(Walks + hits) ÷ innings pitched = ' + (hh + b2) + ' ÷ ' + ip + ' = ' + f2((hh + b2) / ip) + '. Lower is better.' }, num((hh + b2) / ip, f2, [.25, -.25, .5, -.5, .1, 1, .75])));
        return sh(out);
      };
      qs = one(); if (lv === 3) for (var g = 0; g < 15; g++) qs = qs.concat(one());
      return qs;
    }
    if (k === 'who') {
      var all = QZ.who.map(function (w) { return w[0]; }), nO = [4, 4, 6, 6][lv];
      return pq(QZ.who, [6, 6, 8, 8][lv]).map(function (w) {
        var cl = w[2], o = sh([w[0]].concat(pk(all.filter(function (n) { return n !== w[0]; }), nO - 1)));
        return { tag: 'Who am I?', q: '', clues: lv >= 2 ? [w[1]].concat(cl) : cl, opts: o, a: o.indexOf(w[0]), why: 'That’s ' + w[0] + '. ' + cl[2], cls: nO > 4 ? 'two2' : '' };
      });
    }
    return [];
  }
  function playQs(lv) {
    var P2 = A.PLAYS, pool = range(P2.length).filter(function (i) { return lv ? true : P2[i][5] < 2; }), hard = pool.filter(function (i) { return P2[i][5] === 2; }), rest = sh(pool.filter(function (i) { return P2[i][5] < 2; }));
    var n = lv === 3 ? pool.length : [6, 8, 10, 12][lv], nh = lv === 3 ? hard.length : [0, 2, 4, 5][lv];
    return sh(sh(hard).slice(0, nh).concat(rest.slice(0, n - Math.min(nh, hard.length))));
  }

  /* ---------- start ---------- */
  var QUIZ = ['trivia', 'score', 'call', 'count', 'send', 'backup', 'rules', 'stat', 'who', 'rbook'];
  function start(k, lv, carry) {
    clearTimers();
    lv = lv || 0;
    var base = { k: k, lv: lv, right: 0, pts: 0, i: 0, miss: 0, strikes: 0, lives: livesFor(k, lv), tl: lv && GT[k] ? GT[k][lv - 1] : 0 };
    if (QUIZ.indexOf(k) >= 0) G = Object.assign(base, { quiz: true, qs: qzBuild(k, lv), pick: null, cl: 0, cmax: [2, 2, 1, 0][lv] });
    else if (k === 'play') G = Object.assign(base, { qs: playQs(lv), pick: null });
    else if (k === 'cut') G = Object.assign(base, { qs: sh(range(A.CUTS.length)).slice(0, lv === 3 ? 9999 : [6, 8, 10, 12][lv]), base: null, cut: null });
    else if (k === 'swing') G = Object.assign(base, { res: '', out: '', tal: { HR: 0, '2B': 0, '1B': 0, BB: 0, K: 0, OUT: 0 }, live: false, kind: '', zone: 'in', b: 0, s: 0, outs: 0, ab: 1 });
    else if (k === 'pos') G = Object.assign(base, { q: R(1, 9), t0: Date.now(), res: '', lives: 0 });
    else if (k === 'signs') G = Object.assign(base, { seq: [], inp: [], show: -1, round: 0, over: false, busy: true, ord: [0, 1, 2, 3, 4, 5], mixed: false, lives: 0 });
    else if (k === 'steal') G = Object.assign(base, { ph: 'ready', ev: '', res: '', ms: 0, n: lv === 3 ? 9999 : [8, 8, 10, 12][lv], lives: [0, 0, 3, 1][lv], fk: '' });
    else if (k === 'word') { var W = A.WORDS[(carry && carry.sp) || 'bb'], daily = lv !== 3 && !(carry && carry.rnd); G = Object.assign(base, { sp: (carry && carry.sp) || 'bb', ans: daily ? W[hash(P.today() + ((carry && carry.sp) || 'bb')) % W.length] : W[R(0, W.length - 1)], rows: [], cur: '', over: false, won: false, daily: daily, max: [6, 5, 4, 3][lv], lives: 0 }); }
    else if (k === 'four') { var sp = (carry && carry.sp) || 'bb', F = A.FOURS[sp], pi = R(0, F.length - 1), Pz = F[pi], tiles = []; Pz.forEach(function (g, gi) { g[1].forEach(function (w) { tiles.push([w, gi]); }); }); G = Object.assign(base, { sp: sp, P: Pz, tiles: sh(tiles), sel: [], solved: [], over: false, msg: '', mm: [4, 3, 2, 1][lv], lives: 0 }); }
    if (carry) { G.ch = carry.ch || 0; G.cn = carry.cn || 0; }
    G._r = 0;
    view = 'game'; render();
    if (k === 'signs') setTimeout(signsNext, 500);
    window.scrollTo(0, 0);
  }
  var view = 'levels', pickK = null, timers = [];
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  /* ---------- clock + strikes (Medium/Hard/Expert, same as the old app) ---------- */
  function answered() { return G.k === 'cut' ? G.cut != null : G.pick != null; }
  function clockHTML() {
    if (!G.lv || G.done || !GT[G.k]) return '';
    var h = '';
    if (G.lives) h += '<div class="lives" aria-label="Strikes">' + (G.lv === 3 ? 'One miss ends it' : 'Strikes') + ' ' + range(G.lives).map(function (i) { return '<i class="' + (i < G.strikes ? 'on' : '') + '"></i>'; }).join('') + '</div>';
    if (G.tl && !answered()) {
      var k = G.k, i = G.i;
      if (G._ti !== i) {
        G._ti = i; G._t0 = performance.now();
        later(function () { if (!G || G.k !== k || G.i !== i || G.done || answered()) return; if (k === 'cut') { G.base = '-'; G.cut = '-'; } else G.pick = -1; sfx.bad(); toast('Time’s up!'); afterAnswer(false); render(); }, G.tl * 1000);
      }
      h += '<div class="clock"><i style="animation-duration:' + G.tl + 's;animation-delay:-' + ((performance.now() - G._t0) / 1000).toFixed(2) + 's"></i></div>';
    }
    return h;
  }
  function afterAnswer(ok) { if (ok) return; if (G.lives) { G.strikes++; } }
  function struckOut() { return G.lives && G.strikes >= G.lives; }

  /* ---------- end of a game ---------- */
  function endGame(score, xp, label) {
    clearTimers();
    var k = G.k, lv = G.lv || 0, p = P.data, bk = bestKey(k, lv);
    if (lv === 3) xp = Math.min(xp, 120);
    xp = Math.round(xp * XPM[lv]);
    p.gp[k] = (p.gp[k] || 0) + 1;
    if (typeof score === 'number' && (p.best[bk] == null || score > p.best[bk])) p.best[bk] = score;
    G.hsPts = hsPts(score, lv); G.hsNew = hsUpdate(k, lv, score);
    P.save();
    var up = P.award(xp);
    G.done = { score: score, label: label, xp: xp };
    sfx.win(); render();
    if (up) later(function () { toast('Level up: ' + up + '!'); }, 1400);
  }
  function exLabel(k, raw, label) { if (k === 'swing') return raw + ' total bases before your first out'; if (k === 'signs') return label; if (k === 'who') return raw + ' points before your first miss'; return raw + ' right in a row'; }

  /* ---------- painted pieces ---------- */
  function prog(n, i) { return '<div class="prog">' + range(Math.min(n, 30)).map(function (j) { return '<i class="' + (j < i ? 'on' : j === i ? 'cur' : '') + '"></i>'; }).join('') + '</div>'; }
  function head() {
    var g = game(G.k);
    var top = G.lv === 3 && !G.done ? '<div class="exs"><span>EXPERT</span><b>' + (G.k === 'who' ? G.pts : (G.ch != null && (G.k === 'word' || G.k === 'four') ? G.cn || 0 : G.k === 'swing' ? G.pts : G.k === 'signs' ? Math.max(0, G.round - 1) : G.right)) + '</b><small>' + (G.k === 'who' ? 'points' : 'in a row') + ' · one miss ends it</small></div>' : '';
    return '<header class="ghead"><button class="gx" data-a="levels" aria-label="Back to levels"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><img src="' + ICON[G.k] + '" alt=""><span><b>' + esc(g[2]) + '</b><small>' + LVN[G.lv || 0] + '</small></span></header>' + top;
  }
  function fact(ok, txt) { return '<div class="fact ' + (ok ? 'ok' : 'no') + '">' + txt + '</div>'; }
  function cta(act, txt, alt) { return '<button class="cta' + (alt ? ' alt' : '') + '" data-a="' + act + '"><img src="../assets/img/' + (alt ? 'plank' : 'button') + '.png" alt=""><span>' + esc(txt) + '</span></button>'; }
  function diamond(run, opts) {
    opts = opts || {};
    var b = function (x, y, on, k) { return '<g ' + (opts.tap ? 'data-a="base:' + k + '" class="tap" role="button" aria-label="' + ({ 1: 'First base', 2: 'Second base', 3: 'Third base', 4: 'Home plate' })[k] + '"' : '') + '><rect x="' + (x - 14) + '" y="' + (y - 14) + '" width="28" height="28" rx="4" transform="rotate(45 ' + x + ' ' + y + ')" class="base ' + (on ? 'on' : '') + '"/>' + (opts.tap ? '<text x="' + x + '" y="' + (y + 5) + '" class="bt">' + (k === '4' ? 'H' : k) + '</text>' : '') + (on ? '<circle cx="' + x + '" cy="' + (y - 22) + '" r="7" class="runner"/>' : '') + '</g>'; };
    return '<svg viewBox="0 0 300 250" class="dia"><defs><radialGradient id="gr" cx="50%" cy="80%" r="80%"><stop offset="0" stop-color="#7cc24e"/><stop offset="1" stop-color="#4f9a37"/></radialGradient><linearGradient id="dt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4a465"/><stop offset="1" stop-color="#c98447"/></linearGradient></defs><path d="M150 236 L16 110 Q150 -44 284 110 Z" fill="url(#gr)" stroke="#3d6b24" stroke-width="3"/><path d="M150 230 L70 150 L150 70 L230 150 Z" fill="url(#dt)" stroke="#9a5f2c" stroke-width="2"/><path d="M150 210 L90 150 L150 90 L210 150 Z" fill="#6cb244"/><circle cx="150" cy="150" r="11" fill="#d99a5c" stroke="#9a5f2c" stroke-width="2"/>' + b(230, 150, run[0], '1') + b(150, 70, run[1], '2') + b(70, 150, run[2], '3') + b(150, 230, false, '4') + (opts.spots || '') + '</svg>';
  }
  function sbHTML(s) {
    var dots = function (n, t, c) { return '<span class="sbr"><u>' + c + '</u>' + range(t).map(function (i) { return '<i class="' + c + ' ' + (i < n ? 'on' : '') + '"></i>'; }).join('') + '</span>'; };
    var h = '<div class="sb"><div class="sbl">';
    if (s.c) { var bs = s.c.split('-').map(Number); h += dots(bs[0], 3, 'B') + dots(bs[1], 2, 'S'); }
    if (s.o != null) h += dots(s.o, 2, 'O');
    h += '</div>';
    if (s.r) h += '<svg viewBox="0 0 44 44" width="54" height="54" aria-label="Runners">' + [[22, 7, 1], [37, 21, 0], [7, 21, 2]].map(function (b) { return '<rect x="' + (b[0] - 6) + '" y="' + (b[1] - 6) + '" width="12" height="12" rx="2" transform="rotate(45 ' + b[0] + ' ' + b[1] + ')" fill="' + (s.r[b[2]] ? '#ffd35a' : '#3b2414') + '" stroke="#ffe3a8" stroke-width="1.5"/>'; }).join('') + '<polygon points="18,34 26,34 26,38 22,41 18,38" fill="#fff4dc"/></svg>';
    return h + '</div>';
  }
  /* Backup Buddy field */
  function bkZone(f) { var fr = A.BXY[f.from], to = A.BBASE[f.to], dx = to[0] - fr[0], dy = to[1] - fr[1], L = Math.hypot(dx, dy), c = function (v, m) { return Math.max(8, Math.min(m, v)); }; return [[c(to[0] + dx / L * 13, 192), c(to[1] + dy / L * 13, 176)], [c(to[0] + dx / L * 42, 192), c(to[1] + dy / L * 42, 176)]]; }
  function bkR() { return [22, 16, 12, 9][G.lv || 0]; }
  function fieldHTML(q, done) {
    var f = q.field, fr = A.BXY[f.from], to = A.BBASE[f.to], you = A.BXY[f.you], z = bkZone(f), pk = G.pick && G.pick.x != null ? G.pick : null;
    return '<div class="bf"><svg viewBox="0 0 200 184" ' + (done ? '' : 'data-a="bft"') + ' role="img" aria-label="Baseball field. Tap where you would run."><defs><radialGradient id="bg2" cx="50%" cy="80%" r="90%"><stop offset="0" stop-color="#7cc24e"/><stop offset="1" stop-color="#4f9a37"/></radialGradient></defs><rect width="200" height="184" rx="14" fill="url(#bg2)"/><polygon points="100,146 152,100 100,54 48,100" fill="#d99a5c" stroke="#9a5f2c" stroke-width="1.5"/><polygon points="100,134 138,100 100,66 62,100" fill="#6cb244"/><circle cx="100" cy="102" r="6" fill="#d99a5c"/>' +
      Object.keys(A.BBASE).map(function (k) { var b = A.BBASE[k]; return '<rect x="' + (b[0] - 4) + '" y="' + (b[1] - 4) + '" width="8" height="8" rx="1.5" fill="#fff4dc" stroke="#7a4a26"/>'; }).join('') +
      '<line x1="' + fr[0] + '" y1="' + fr[1] + '" x2="' + to[0] + '" y2="' + to[1] + '" stroke="#fff4dc" stroke-width="2.5" stroke-dasharray="5 4"/><circle cx="' + fr[0] + '" cy="' + fr[1] + '" r="4.5" fill="#fff" stroke="#c0392b" stroke-width="1.5"/>' +
      (done ? '<line x1="' + z[0][0] + '" y1="' + z[0][1] + '" x2="' + z[1][0] + '" y2="' + z[1][1] + '" stroke="#ffe27a" stroke-opacity=".75" stroke-width="' + bkR() * 2 + '" stroke-linecap="round"/>' : '') +
      '<g><rect x="' + (you[0] - 15) + '" y="' + (you[1] - 9) + '" width="30" height="16" rx="8" fill="#5C068C" stroke="#ffe3a8" stroke-width="1.5"/><text x="' + you[0] + '" y="' + (you[1] + 3) + '" text-anchor="middle" font-size="9" font-weight="700" fill="#fff" font-family="Fredoka,sans-serif">YOU</text></g>' +
      (pk ? '<g><line x1="' + you[0] + '" y1="' + you[1] + '" x2="' + pk.x + '" y2="' + pk.y + '" stroke="#ffe27a" stroke-width="2"/><circle cx="' + pk.x + '" cy="' + pk.y + '" r="7" fill="' + (pk.ok ? '#3fae5a' : '#d9473c') + '" stroke="#fff" stroke-width="2"/></g>' : '') + '</svg>' + (done ? '<p class="gi">The gold zone is where the backup should be.</p>' : '') + '</div>';
  }
  function pitcherSVG(pose) {
    var leg = pose === 'lift' ? '<path d="M58 92 L74 76 L86 84" class="pl"/><path d="M52 92 L50 122 L46 136" class="pl"/>' : pose === 'step' ? '<path d="M58 92 L40 116 L30 134" class="pl"/><path d="M52 92 L60 120 L64 136" class="pl"/>' : '<path d="M58 92 L60 120 L62 136" class="pl"/><path d="M52 92 L48 122 L46 136" class="pl"/>';
    return '<svg viewBox="0 0 120 150" class="pitcher ' + pose + '" aria-hidden="true"><ellipse cx="56" cy="140" rx="34" ry="7" fill="rgba(60,30,10,.3)"/>' + leg + '<path d="M40 54 Q56 46 70 54 L68 94 L44 94 Z" class="pj"/><path d="M44 58 L30 80 L38 86" class="pa"/><path d="M68 58 L84 76 L76 84" class="pa"/><circle cx="56" cy="38" r="12" class="ps"/><path d="M43 34 Q56 20 69 34 L74 35 L43 36 Z" class="pc"/></svg>';
  }

  /* ---------- screens ---------- */
  function levelsHTML(k) {
    var g = game(k), inf = lvInfo(k), p = P.data, h = p.hs[k];
    return '<header class="ghead"><a class="gx" href="./" aria-label="Back to the arcade"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></a><span><b>Arcade</b></span></header>' +
      '<section class="panel lvpanel"><img class="hero" src="' + ICON[k] + '" alt=""><h1>' + esc(g[2]) + '</h1><p class="sub">' + esc(g[3]) + '</p>' +
      '<div class="hsl"><span>Your high score</span><b>' + (h ? h.s + ' pts' : '—') + '</b>' + (h ? '<small>' + LVN[h.lv] + ' · ' + h.r + ' ' + (k === 'swing' ? 'bases' : 'right') + '</small>' : '') + '</div>' +
      '<p class="hsx">Points = what you get × level: Easy ×1, Medium ×2, Hard ×3, Expert ×4.</p>' +
      '<div class="lvs">' + LVN.map(function (n, i) { var b = p.best[bestKey(k, i)]; return '<button class="lvb l' + i + '" data-a="lv:' + i + '"><span class="lvn"><b>' + n + '</b>' + (i ? '<em>+' + [0, 25, 50, 100][i] + '% XP</em>' : '') + '</span><span class="lvi">' + esc(inf[i]) + '</span><small>' + (b != null ? 'Best ' + b : 'Not played yet') + '</small></button>'; }).join('') + '</div></section>';
  }
  function doneHTML() {
    var g = game(G.k), p = P.data, hs = p.hs[G.k], lv = G.lv || 0;
    return head() + '<section class="panel endp"><img class="hero" src="' + ICON[G.k] + '" alt=""><h1>' + esc(G.done.label) + '</h1>' +
      '<div class="hsend ' + (G.hsNew ? 'new' : '') + '"><small>' + LVN[lv] + ' ×' + LVW[lv] + '</small><b>' + G.hsPts + ' pts</b><span>' + (G.hsNew ? 'New high score!' : 'High score: ' + (hs ? hs.s : 0) + ' pts') + '</span></div>' +
      '<div class="xpwon"><img src="../assets/img/coin.png" alt=""><b>+' + G.done.xp + ' XP</b></div>' +
      '<div class="stack">' + cta('again', 'Play again') + (lv < 3 ? cta('next', 'Try ' + LVN[lv + 1], true) : '') + '<a class="ghost" href="./">Back to the arcade</a></div></section>';
  }
  function quizHTML() {
    var q = G.qs[G.i], done = G.pick != null, ok = q.field ? !!(G.pick && G.pick.ok) : G.pick === q.a, left = 2 - G.cl;
    var body = (G.lv === 3 ? '' : prog(G.qs.length, G.i)) + clockHTML() + (q.tag ? '<small class="qc">' + esc(q.tag) + '</small>' : '') + (q.sb ? sbHTML(q.sb) : '');
    if (q.clues) {
      body += '<div class="clues">' + q.clues.slice(0, (done ? Math.min(q.clues.length - 1, G.cl + 2) : G.cl) + 1).map(function (c, i) { return '<p><b>Clue ' + (i + 1) + '</b> ' + esc(c) + '</p>'; }).join('') + '</div>' + (!done && G.cl < G.cmax ? '<button class="ghost" data-a="qclue">Show another clue (then worth ' + left + ' point' + (left === 1 ? '' : 's') + ')</button>' : '');
    } else body += '<h2 class="q">' + esc(q.q) + '</h2>';
    body += q.field ? fieldHTML(q, done) : '<div class="opts ' + (q.cls || '') + '">' + q.opts.map(function (o, i) { return '<button class="' + (!done ? '' : i === q.a ? 'ok' : i === G.pick ? 'no' : 'dim') + '" data-a="qp:' + i + '" ' + (done ? 'disabled' : '') + '>' + esc(o) + '</button>'; }).join('') + '</div>';
    if (done) body += fact(ok, '<b>' + (ok ? 'Yes!' : G.pick === -1 ? 'Out of time.' : 'Not quite.') + '</b> ' + (q.field && !ok ? 'It’s ' + esc(q.opts[q.a]).toLowerCase() + '. ' : '') + esc(q.why)) + cta('qn', struckOut() ? 'See your score' : G.i + 1 < G.qs.length ? 'Next' : 'Finish');
    return body;
  }
  function playHTML() {
    var q = A.PLAYS[G.qs[G.i]], runs = q[0].filter(Boolean).length;
    var h = (G.lv === 3 ? '' : prog(G.qs.length, G.i)) + clockHTML() + '<div class="sit"><span>' + q[1] + ' out' + (q[1] === 1 ? '' : 's') + '</span><span>' + (runs ? 'Runner' + (runs > 1 ? 's' : '') + ' on ' + ['1st', '2nd', '3rd'].filter(function (_, i) { return q[0][i]; }).join(' & ') : 'Nobody on') + '</span></div><h2 class="q">' + esc(q[2]) + '.</h2>' + diamond(q[0], { tap: G.pick == null });
    if (G.pick == null) h += '<button class="ghost" data-a="base:0">Hold the ball (no throw)</button><p class="gi">Tap a base.</p>';
    else { var ok = G.pick === q[3]; h += fact(ok, '<b>' + (ok ? 'That’s the play!' : G.pick === -1 ? 'Out of time.' : 'Not this time.') + '</b> ' + (!ok ? (q[3] === '0' ? 'The play: hold the ball. ' : 'The play is at ' + ({ 1: 'first', 2: 'second', 3: 'third', 4: 'home' })[q[3]] + '. ') : '') + esc(q[4])) + cta('pnext', struckOut() ? 'See your score' : G.i + 1 < G.qs.length ? 'Next' : 'Finish'); }
    return h;
  }
  function cutHTML() {
    var q = A.CUTS[G.qs[G.i]], dn = G.cut != null, ok = G.base === q[2] && G.cut === q[3], bn = function (b) { return b === '4' ? 'home' : ({ 1: 'first', 2: 'second', 3: 'third' })[b]; };
    var h = (G.lv === 3 ? '' : prog(G.qs.length, G.i)) + clockHTML() + '<div class="sit"><span>' + (q[1].some(Boolean) ? 'Runner on ' + ['1st', '2nd', '3rd'].filter(function (_, i) { return q[1][i]; }).join(' & ') : 'Nobody on') + '</span></div><h2 class="q">' + esc(q[0]) + '.</h2>' + diamond(q[1], { tap: G.base == null });
    if (G.base == null) h += '<p class="gi"><b>Step 1.</b> Tap the base the throw is going to.</p>';
    else if (!dn) h += '<p class="gi"><b>Step 2.</b> Throw is going to ' + bn(G.base) + '. Who’s the cutoff?</p><div class="opts five">' + ['P', '1B', '2B', '3B', 'SS'].map(function (c) { return '<button data-a="cc:' + c + '">' + c + '</button>'; }).join('') + '</div>';
    else h += fact(ok, '<b>' + (ok ? 'That’s it!' : G.cut === '-' ? 'Out of time.' : 'Not quite.') + '</b> Throw to ' + bn(q[2]) + ', cutoff is the ' + q[3] + '. ' + esc(q[4])) + cta('cnext', struckOut() ? 'See your score' : G.i + 1 < G.qs.length ? 'Next' : 'Finish');
    return h + '<p class="fine">Teams line these up a little differently. If your coach says otherwise, your coach is right.</p>';
  }
  function posHTML() {
    var xy = [[150, 150], [150, 206], [246, 122], [196, 92], [54, 122], [104, 92], [58, 44], [150, 20], [242, 44]], lab = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
    var lim = [0, 0, 3, 1][G.lv || 0];
    return (G.lv === 3 ? '' : prog(10, G.i)) + (lim ? '<div class="lives">Misses ' + range(lim).map(function (i) { return '<i class="' + (i < G.miss ? 'on' : '') + '"></i>'; }).join('') + '</div>' : '') + '<h2 class="q">Tap position <span class="bign">' + G.q + '</span></h2><p class="gi">' + esc(G.res || 'Every position has a scorebook number.') + '</p>' +
      diamond([0, 0, 0], { spots: xy.map(function (p, i) { return '<g data-a="pp:' + (i + 1) + '" class="tap" role="button" aria-label="Position spot ' + (G.lv ? '' : lab[i]) + '"><circle cx="' + p[0] + '" cy="' + p[1] + '" r="18" class="spot"/><text x="' + p[0] + '" y="' + (p[1] + 4) + '" class="st">' + (G.lv ? '' : lab[i]) + '</text></g>'; }).join('') }) + '<p class="score">' + G.right + ' right · ' + G.miss + ' missed</p>';
  }
  function swingHTML() {
    var fin = G.lv === 3 ? G.outs >= 1 : (G.outs >= 3 || G.ab > 12), sw = G.out && ['look', 'k', 'ball', 'walk'].indexOf(G.out) < 0, good = ['hr', 'dbl', 'sgl', 'ball', 'walk'].indexOf(G.out) >= 0;
    var L = { hr: 'HOME RUN!', dbl: 'DOUBLE!', sgl: 'SINGLE!', lo: 'LINEOUT', fo: 'FLY OUT', go: 'GROUNDOUT', po: 'POP OUT', foul: 'FOUL', whiff: 'STRIKE!', k: 'STRIKE 3!', look: 'STRIKE!', ball: 'BALL', walk: 'BALL FOUR!' };
    return '<div class="count">' + sbHTML({ c: G.b + '-' + G.s, o: Math.min(2, G.outs) }) + '<span class="ab">At-bat ' + Math.min(G.ab, 12) + '</span></div>' +
      '<div class="lane o-' + G.out + '"><div class="plate"></div><div class="bat ' + (G.out && (sw || (G.out === 'k' && /Swing/.test(G.res))) ? 'sw' : '') + '"></div>' + (G.live ? '<div class="pball z-' + G.zone + ' ' + (G.kind === 'Curveball' ? 'cv' : '') + '" style="animation-duration:' + G.dur + 'ms"></div>' : '') + (G.out ? '<div class="outc ' + (good ? 'g' : '') + '">' + L[G.out] + '</div>' : '') + (G.live ? '<div class="kind">' + G.kind + '</div>' : '') + '</div>' +
      '<div class="fact ' + (good ? 'ok' : 'no') + '" style="visibility:' + (G.res ? 'visible' : 'hidden') + '">' + esc(G.res || '.') + '</div>' +
      (G.live ? '<button class="swingbtn" data-a="sw">SWING!</button>' : fin ? cta('swfin', 'See your score') : cta('spitch', G.i ? 'Next pitch' : 'Pitch!')) +
      '<p class="score">' + G.pts + ' total bases · HR ' + G.tal.HR + ' · 2B ' + G.tal['2B'] + ' · 1B ' + G.tal['1B'] + ' · BB ' + G.tal.BB + ' · K ' + G.tal.K + '</p>';
  }
  function signsHTML() {
    return '<h2 class="q">Round ' + Math.max(1, G.round) + '</h2><p class="gi">' + (G.over ? 'Missed the sign!' : G.busy ? (G.mixed ? 'Mixed up! Watch the coach…' : 'Watch the coach…') : 'Your turn. Repeat the signs in order.') + '</p>' +
      '<div class="signs">' + G.ord.map(function (i) { var s = A.SIGNS[i], tp = G.tap && G.tap[0] === i; return '<button class="' + (G.show === i || tp ? 'lit' : '') + ' ' + (tp ? (G.tap[1] ? 'tap' : 'bad') : '') + '" data-a="sg:' + i + '" ' + (G.busy || G.over ? 'disabled' : '') + '><span>' + s[0] + '</span><small>' + s[1] + '</small></button>'; }).join('') + '</div><p class="score">' + G.inp.length + ' / ' + G.seq.length + '</p>';
  }
  function stealHTML() {
    var Lv = G.lives, over = G.i >= G.n || (Lv && G.miss >= Lv), fkT = { look: 'He looks over at you…', flinch: 'He twitches his shoulder…', hold: 'He holds… and holds…' };
    var pose = G.ph === 'go' || (G.ph === 'res' && G.ev) ? (G.ev === 'home' ? 'lift' : 'step') : 'set';
    return (G.lv === 3 || G.n > 30 ? '' : prog(G.n, G.i)) + (Lv ? '<div class="lives">Strikes ' + range(Lv).map(function (i) { return '<i class="' + (i < G.miss ? 'on' : '') + '"></i>'; }).join('') + '</div>' : '') +
      '<div class="stl ' + G.ph + ' ' + G.ev + ' ' + (G.fk ? 'fk fk-' + G.fk : '') + '">' + pitcherSVG(pose) + '<b>' + (G.ph === 'ready' ? 'Take your lead' : G.ph === 'set' ? (G.fk ? fkT[G.fk] : 'He’s set… watch his feet') : G.ph === 'go' ? 'Read him!' : esc(G.res)) + '</b></div>' +
      (G.ph === 'ready' || G.ph === 'res' ? cta(over ? 'stfin' : 'stlead', over ? 'Finish' : G.i ? 'Next lead' : 'Take your lead') : '<div class="two"><button class="big back" data-a="st:back">BACK</button><button class="big go" data-a="st:go">GO!</button></div>') +
      '<p class="score">' + G.right + ' good reads' + (Lv ? ' · ' + G.miss + ' strike' + (G.miss === 1 ? '' : 's') : '') + '</p>';
  }
  function spChips(k, cur) { return '<div class="chips">' + A.SPORTS.map(function (s) { return '<button class="' + (cur === s[0] ? 'on' : '') + '" data-a="sp:' + s[0] + '">' + s[2] + '</button>'; }).join('') + '</div>'; }
  function runBox(act, exTxt, txt) {
    if (G.lv !== 3) return cta(act, txt);
    return '<div class="exrun ' + (G.won ? '' : 'over') + '"><b>' + (G.won ? 'Run alive' : 'Run over') + '</b><span>' + (G.cn || 0) + ' solved · ' + hsPts(G.ch || 0, 3) + ' pts' + (G.hsNew ? ' · New high score!' : '') + '</span></div>' + cta(act, G.won ? exTxt : 'Start a new run');
  }
  function wordHTML() {
    var ks = {};
    G.rows.forEach(function (r) { r[0].split('').forEach(function (c, i) { var m = r[1][i]; if (m === 'y' || (m === 'm' && ks[c] !== 'y') || !ks[c]) ks[c] = m; }); });
    var row = function (w, m) { return '<div class="wrow">' + range(5).map(function (i) { return '<i class="' + (m ? m[i] : w[i] ? 'f' : '') + '">' + (w[i] || '') + '</i>'; }).join('') + '</div>'; };
    var sp = A.SPORTS.find(function (s) { return s[0] === G.sp; });
    var h = spChips('word', G.sp) + '<p class="gi">Guess the ' + sp[2].toLowerCase() + ' word. <b class="kg">Gold</b> = right letter, right spot. <b class="kr">Ring</b> = right letter, wrong spot.</p><div class="wgrid">' + range(G.max).map(function (i) { return G.rows[i] ? row(G.rows[i][0], G.rows[i][1]) : i === G.rows.length && !G.over ? row(G.cur) : row(''); }).join('') + '</div>';
    if (G.over) h += fact(G.won, '<b>' + (G.won ? 'Solved in ' + G.rows.length + '!' : 'The word was ' + G.ans + '.') + '</b> ' + (G.daily ? 'That was today’s word.' : '')) + runBox('wnew', 'Next word', 'Play another word') + '<button class="ghost" data-a="wdone">See your score</button>';
    else h += '<div class="kb">' + ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map(function (r, ri) { return '<div>' + (ri === 2 ? '<button class="wide" data-a="wk:ENT">Enter</button>' : '') + r.split('').map(function (c) { return '<button class="' + (ks[c] || '') + '" data-a="wk:' + c + '">' + c + '</button>'; }).join('') + (ri === 2 ? '<button class="wide" data-a="wk:DEL" aria-label="Delete">⌫</button>' : '') + '</div>'; }).join('') + '</div>';
    return h;
  }
  function fourHTML() {
    var cols = ['#f29a3c', '#4fc7b0', '#ef7fb0', '#c9b8f0'];
    var h = spChips('four', G.sp) + '<p class="gi">Find four groups of four. Tap four words that go together, then Submit.</p>' +
      G.solved.map(function (g) { return '<div class="fsol" style="--c:' + cols[g] + '"><b>' + esc(G.P[g][0]) + '</b><small>' + G.P[g][1].map(esc).join(' · ') + '</small></div>'; }).join('') +
      '<div class="fgrid">' + G.tiles.map(function (t) { return '<button class="' + (G.sel.indexOf(t[0]) >= 0 ? 'on' : '') + ' ' + (Math.max.apply(null, t[0].split(/[ -]/).map(function (x) { return x.length; })) > 8 ? 'sm' : '') + '" data-a="ft:' + esc(t[0]) + '">' + esc(t[0]) + '</button>'; }).join('') + '</div>';
    if (G.over) h += fact(G.won, '<b>' + (G.won ? 'You found all four!' : 'Out of tries.') + '</b> ' + (G.won ? (G.miss ? G.miss + ' miss' + (G.miss > 1 ? 'es' : '') + '.' : 'Perfect, no misses.') : 'The groups are shown above.')) + runBox('fnext', 'Next puzzle', 'Next puzzle') + '<button class="ghost" data-a="fdone">See your score</button>';
    else h += '<div class="fmiss">Misses left ' + range(G.mm).map(function (i) { return '<i class="' + (i < G.mm - G.miss ? 'on' : '') + '"></i>'; }).join('') + ' <span>' + esc(G.msg) + '</span></div><div class="two">' + '<button class="ghost" data-a="fshuf">Shuffle</button>' + '<button class="pill" data-a="fsub" ' + (G.sel.length === 4 ? '' : 'disabled') + '>Submit</button></div>';
    return h;
  }
  function gameBody() {
    var k = G.k;
    if (G.quiz) return quizHTML();
    if (k === 'play') return playHTML();
    if (k === 'cut') return cutHTML();
    if (k === 'pos') return posHTML();
    if (k === 'swing') return swingHTML();
    if (k === 'signs') return signsHTML();
    if (k === 'steal') return stealHTML();
    if (k === 'word') return wordHTML();
    if (k === 'four') return fourHTML();
    return '';
  }
  function render() {
    if (view === 'levels') root.innerHTML = levelsHTML(pickK);
    else if (G.done) root.innerHTML = doneHTML();
    else root.innerHTML = head() + '<main class="gm panel">' + gameBody() + '</main>';
  }

  /* ---------- game moves ---------- */
  function quizNext() {
    if (struckOut()) return endGame(G.quiz ? G.pts : G.right, G.right * 3, 'Struck out! ' + G.right + ' right');
    G.i++; G.pick = null; G.cl = 0; G._ti = null;
    if (G.i >= G.qs.length) {
      var who = G.k === 'who';
      if (G.k === 'trivia') return endGame(G.right, G.right * 5, G.right + ' of ' + G.qs.length + ' right');
      if (G.k === 'score') return endGame(G.right, G.right * 2, G.right + ' of ' + G.qs.length + ' scored right');
      return endGame(G.pts, Math.min(40, G.pts * (who ? 2 : 4)), who ? G.pts + ' of ' + G.qs.length * 3 + ' points' : G.right + ' of ' + G.qs.length + ' right');
    }
    render(); window.scrollTo(0, 0);
  }
  function expertLabel(label) { return G.lv === 3 ? exLabel(G.k, G.k === 'who' ? G.pts : G.right, label) : label; }
  function signsNext() {
    if (!G || G.k !== 'signs') return;
    G.round++; G.seq.push(R(0, A.SIGNS.length - 1)); G.inp = []; G.busy = true;
    G.mixed = G.round >= [4, 3, 2, 1][G.lv || 0];
    if (G.mixed) G.ord = sh(G.ord);
    var fl = (G.round >= 7 ? 340 : 520) * [1, .8, .65, .5][G.lv || 0], i = 0;
    var step = function () {
      if (!G || G.k !== 'signs') return;
      G.show = i < G.seq.length ? G.seq[i] : -1; render();
      if (G.show >= 0) S.tone(440 + G.show * 90, .14, 'sine', .07);
      if (i < G.seq.length) { i++; later(function () { G.show = -1; render(); later(step, fl * .35); }, fl); }
      else { G.busy = false; render(); }
    };
    later(step, 400);
  }
  function stealLead() {
    G.ph = 'set'; G.res = ''; G.ev = ''; G.fk = ''; render();
    var lv = G.lv || 0, tok = G.tok = Math.random(), live = function () { return G && G.k === 'steal' && G.ph === 'set' && G.tok === tok; };
    var nf = lv >= 2 ? Math.floor(Math.random() * (lv === 3 ? 4 : 3)) : 0, t = 700 + Math.random() * 1500, at = [];
    for (var i = 0; i < nf; i++) { at.push(t); t += 450 + Math.random() * 900; }
    var fks = at.map(function () { return ['look', 'flinch', 'hold', 'look'][R(0, 3)]; }), evr = Math.random();
    at.forEach(function (tt, ix) { later(function () { if (!live()) return; G.fk = fks[ix]; render(); later(function () { if (live()) { G.fk = ''; render(); } }, lv === 3 ? 300 : 420); }, tt); });
    later(function () {
      if (!live()) return;
      G.fk = ''; G.ev = evr < [.6, .55, .5, .5][lv] ? 'home' : 'pick'; G.ph = 'go'; G.t0 = performance.now(); render();
      later(function () { if (G && G.k === 'steal' && G.ph === 'go' && G.tok === tok) stealTap(''); }, [1100, 850, 520, 420][lv]);
    }, t);
  }
  function stealTap(v) {
    if (G.ph === 'set') { G.res = G.fk ? 'He faked you out! You bit and got picked off.' : 'Too early! He caught you leaning.'; G.ok = false; G.fk = ''; }
    else { var ms = Math.round(performance.now() - G.t0), want = G.ev === 'home' ? 'go' : 'back'; G.ok = v === want; G.ms = ms; G.res = !v ? 'Too slow! ' + (G.ev === 'home' ? 'He kicked and went home. You never moved.' : 'He stepped off and you froze. Picked off.') : G.ok ? (want === 'go' ? 'Great jump! Safe at second. ' : 'Good read! You dove back in time. ') + '(' + ms + ' ms)' : (want === 'go' ? 'He went home and you dove back. No steal.' : 'He threw over and you took off. Picked off!'); }
    G.tok = null;
    if (G.ok) { G.right++; sfx.good(); } else { G.miss++; sfx.bad(); }
    G.ph = 'res'; G.i++; render();
  }
  function swingPitch() {
    var lv = G.lv || 0, r = Math.random();
    G.kind = lv >= 2 && r < .22 ? 'Curveball' : r < .42 ? 'Changeup' : 'Fastball';
    G.zone = Math.random() < [.7, .66, .62, .58][lv] ? 'in' : Math.random() < .5 ? 'hi' : 'lo';
    if (G.kind === 'Curveball' && G.zone === 'hi') G.zone = 'lo';
    G.dur = ({ Fastball: 950, Changeup: 1500, Curveball: 1300 })[G.kind] * [1, .85, .72, .6][lv];
    G.res = ''; G.out = ''; G.live = true; G.i++; render(); G.t0 = performance.now();
    later(function () {
      if (!(G && G.k === 'swing' && G.live)) return; G.live = false;
      if (G.zone === 'in') { G.s++; G.out = 'look'; if (G.s >= 3) { G.res = 'Strike three looking! ' + G.kind + ' right down the middle.'; G.out = 'k'; G.tal.K++; swOut(); } else G.res = 'Strike ' + G.s + ' looking. That ' + G.kind.toLowerCase() + ' was over the plate.'; sfx.bad(); }
      else { G.b++; G.out = 'ball'; if (G.b >= 4) { G.res = 'Ball four! Great eye. Take your base.'; G.out = 'walk'; G.tal.BB++; G.pts++; swNext(); } else G.res = 'Ball ' + G.b + '. Good take, that was ' + (G.zone === 'hi' ? 'high' : 'low') + '.'; sfx.good(); }
      render();
    }, G.dur * 1.15);
  }
  function swNext() { G.b = 0; G.s = 0; G.ab++; }
  function swOut() { G.outs++; swNext(); }
  function swingHit() {
    if (!G.live) return;
    var lv = G.lv || 0, f = (performance.now() - G.t0) / G.dur; G.live = false;
    var w = [.075, .065, .055, .045][lv], d = Math.abs(f - .92) + (G.zone === 'in' ? 0 : .05), tm = f < .92 ? 'early' : 'late';
    var pick = function (o) { var t = 0, k; for (k in o) t += o[k]; var r = Math.random() * t; for (k in o) { if ((r -= o[k]) < 0) return k; } return Object.keys(o)[0]; };
    var q = d <= w * .45 ? 'barrel' : d <= w ? 'solid' : d <= w * 1.9 ? 'weak' : d <= w * 2.8 ? 'tick' : 'whiff';
    var o = q === 'barrel' ? pick({ hr: 38, dbl: 32, sgl: 14, lo: 16 }) : q === 'solid' ? pick({ dbl: 14, sgl: 34, fo: 22, lo: 12, go: 18 }) : q === 'weak' ? pick({ sgl: 12, go: 38, po: 26, foul: 24 }) : q === 'tick' ? pick({ foul: 60, whiff: 40 }) : 'whiff';
    var M = { hr: ['Barreled! Home run!', 4, 'HR'], dbl: ['Rocket into the gap. Double!', 2, '2B'], sgl: ['Base hit!', 1, '1B'], lo: ['Smoked it… right at the shortstop. Lineout.', 0, 'OUT'], fo: ['Good swing, but it’s a fly out to center.', 0, 'OUT'], go: ['Rolled over it. Ground out to second.', 0, 'OUT'], po: ['Got under it. Pop out.', 0, 'OUT'] };
    var tag = q === 'barrel' ? ' (perfect timing)' : ' (' + tm + ')', bad = G.zone === 'in' ? '' : ' That pitch was ' + (G.zone === 'hi' ? 'high' : 'low') + '. Lay off it next time.';
    G.out = o;
    if (o !== 'whiff') sfx.crack();
    if (o === 'foul') { if (G.s < 2) G.s++; G.res = 'Foul ball' + tag + '. ' + (G.s >= 2 ? 'Two strikes.' : 'Strike ' + G.s + '.') + bad; }
    else if (o === 'whiff') { G.s++; G.res = (tm === 'early' ? 'Way out in front. ' : 'Too late. ') + 'Swing and a miss on the ' + G.kind.toLowerCase() + '.'; if (G.s >= 3) { G.res += ' Strike three!'; G.out = 'k'; G.tal.K++; swOut(); } else G.res += ' Strike ' + G.s + '.'; sfx.bad(); }
    else { var m = M[o]; G.res = m[0] + tag + (m[2] === 'OUT' ? bad : ''); if (m[2] === 'OUT') { G.tal.OUT++; swOut(); } else { G.pts += m[1]; G.tal[m[2]]++; swNext(); } }
    render();
  }
  function wordMark(g, a) { var r = Array(5).fill('n'), left = {}, i; for (i = 0; i < 5; i++) { if (g[i] === a[i]) r[i] = 'y'; else left[a[i]] = (left[a[i]] || 0) + 1; } for (i = 0; i < 5; i++) if (r[i] !== 'y' && left[g[i]]) { r[i] = 'm'; left[g[i]]--; } return r; }
  function wordKey(ch) {
    if (!G || G.k !== 'word' || G.over) return;
    if (ch === 'DEL') G.cur = G.cur.slice(0, -1);
    else if (ch === 'ENT') {
      if (G.cur.length < 5) { toast('Five letters'); return; }
      G.rows.push([G.cur, wordMark(G.cur, G.ans)]);
      var won = G.cur === G.ans; G.cur = '';
      if (won || G.rows.length >= G.max) {
        G.over = true; G.won = won; var sc = won ? G.max + 1 - G.rows.length : 0;
        if (won) sfx.win(); else sfx.bad();
        if (G.lv === 3) { if (won) { G.ch = (G.ch || 0) + sc; G.cn = (G.cn || 0) + 1; G.hsNew = hsUpdate('word', 3, G.ch) || G.hsNew; } }
        G.sc = sc;
      }
    } else if (G.cur.length < 5) G.cur += ch;
    render();
  }
  function fourSubmit() {
    if (G.sel.length !== 4 || G.over) return;
    var gs = G.sel.map(function (w) { return G.tiles.find(function (t) { return t[0] === w; })[1]; }), cnt = {};
    gs.forEach(function (g) { cnt[g] = (cnt[g] || 0) + 1; });
    var top = Math.max.apply(null, Object.values(cnt));
    if (top === 4) { G.solved.push(gs[0]); G.tiles = G.tiles.filter(function (t) { return t[1] !== gs[0]; }); G.sel = []; G.msg = ''; sfx.good(); if (G.solved.length === 4) fourEnd(true); }
    else { G.miss++; G.msg = top === 3 ? 'One away!' : 'Not a group. Try again.'; G.sel = []; sfx.bad(); if (G.miss >= G.mm) { [0, 1, 2, 3].forEach(function (g) { if (G.solved.indexOf(g) < 0) G.solved.push(g); }); G.tiles = []; fourEnd(false); } }
    render();
  }
  function fourEnd(won) { G.over = true; G.won = won; G.sc = won ? G.mm - G.miss + 1 : 0; if (won) sfx.win(); if (G.lv === 3 && won) { G.ch = (G.ch || 0) + G.sc; G.cn = (G.cn || 0) + 1; G.hsNew = hsUpdate('four', 3, G.ch) || G.hsNew; } }
  function puzzleDone() {
    if (G.k === 'word') { var raw = G.lv === 3 ? (G.ch || 0) : G.sc || 0; return endGame(raw, G.won ? 12 + (G.max - G.rows.length) * 3 : 3, G.lv === 3 ? (G.cn || 0) + ' word' + (G.cn === 1 ? '' : 's') + ' solved' : G.won ? 'Solved in ' + G.rows.length + '!' : 'The word was ' + G.ans); }
    var raw2 = G.lv === 3 ? (G.ch || 0) : G.sc || 0; endGame(raw2, G.won ? 12 + (4 - G.miss) * 3 : 3, G.lv === 3 ? (G.cn || 0) + ' puzzle' + (G.cn === 1 ? '' : 's') + ' solved' : G.won ? 'All four groups!' : 'Out of tries');
  }

  /* ---------- taps ---------- */
  root.addEventListener('click', function (e) {
    var el = e.target.closest('[data-a]'); if (!el || el.disabled) return;
    var a = el.getAttribute('data-a'), ix = a.indexOf(':'), k = ix < 0 ? a : a.slice(0, ix), v = ix < 0 ? '' : a.slice(ix + 1);
    if (k !== 'wk') sfx.tap();
    if (k === 'lv') return start(pickK, +v);
    if (k === 'levels') { clearTimers(); G = null; view = 'levels'; return render(); }
    if (k === 'again') return start(G.k, G.lv);
    if (k === 'next') return start(G.k, Math.min(3, (G.lv || 0) + 1));
    /* quiz-style */
    if (k === 'qp') { if (G.pick != null) return; var q = G.qs[G.i]; G.pick = +v; var ok = G.pick === q.a; if (ok) { G.right++; G.pts += q.clues ? 3 - G.cl : 1; sfx.good(); } else { sfx.bad(); afterAnswer(false); } return render(); }
    if (k === 'qclue') { G.cl++; return render(); }
    if (k === 'qn') { if (G.lv === 3 && G.pick !== G.qs[G.i].a && !(G.pick && G.pick.ok)) return endGame(G.k === 'who' ? G.pts : G.right, G.right * 3, expertLabel('')); return quizNext(); }
    if (k === 'bft') {
      if (G.pick != null) return; var qq = G.qs[G.i], svg = el.closest('svg'), r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 200, y = (e.clientY - r.top) / r.height * 184, z = bkZone(qq.field), vx = z[1][0] - z[0][0], vy = z[1][1] - z[0][1], t = Math.max(0, Math.min(1, ((x - z[0][0]) * vx + (y - z[0][1]) * vy) / (vx * vx + vy * vy || 1))), d = Math.hypot(x - z[0][0] - t * vx, y - z[0][1] - t * vy), ok2 = d <= bkR();
      G.pick = { x: x, y: y, ok: ok2 }; if (ok2) { G.right++; G.pts++; sfx.good(); } else { sfx.bad(); afterAnswer(false); } return render();
    }
    /* where's the play + cutoff */
    if (k === 'base') {
      if (G.k === 'play') { if (G.pick != null) return; G.pick = v; var ok3 = v === A.PLAYS[G.qs[G.i]][3]; if (ok3) { G.right++; sfx.good(); } else { sfx.bad(); afterAnswer(false); } return render(); }
      if (G.k === 'cut') { if (G.base != null) return; G.base = v; return render(); }
    }
    if (k === 'cc') { var c = A.CUTS[G.qs[G.i]]; G.cut = v; var ok4 = G.base === c[2] && G.cut === c[3]; if (ok4) { G.right++; sfx.good(); } else { sfx.bad(); afterAnswer(false); } return render(); }
    if (k === 'pnext' || k === 'cnext') {
      var wrong = k === 'pnext' ? G.pick !== A.PLAYS[G.qs[G.i]][3] : !(G.base === A.CUTS[G.qs[G.i]][2] && G.cut === A.CUTS[G.qs[G.i]][3]);
      if (G.lv === 3 && wrong) return endGame(G.right, G.right * 3, expertLabel(''));
      if (struckOut()) return endGame(G.right, G.right * 3, 'Struck out! ' + G.right + ' right');
      G.i++; G.pick = null; G.base = null; G.cut = null; G._ti = null;
      if (G.i >= G.qs.length) return k === 'pnext' ? endGame(G.right, G.right * 4, G.right + ' of ' + G.qs.length + ' plays right') : endGame(G.right, G.right * 4, G.right + ' of ' + G.qs.length + ' lined up right');
      return render();
    }
    /* position numbers */
    if (k === 'pp') {
      if (+v === G.q) { G.right++; G.res = 'Yes! ' + A.POS[G.q] + ' is ' + G.q + '.'; sfx.good(); } else { G.miss++; G.res = 'No. ' + G.q + ' is ' + A.POS[G.q] + '.'; sfx.bad(); }
      G.i++; var n; do { n = R(1, 9); } while (n === G.q); G.q = n;
      if ((G.lv !== 3 && G.i >= 10) || (G.lv >= 2 && G.miss >= [0, 0, 3, 1][G.lv])) return endGame(G.right, G.right * 2, G.lv === 3 ? exLabel('pos', G.right) : G.right + ' of ' + G.i + ' in ' + Math.round((Date.now() - G.t0) / 1000) + 's');
      return render();
    }
    /* barrel up */
    if (k === 'spitch') return swingPitch();
    if (k === 'sw') return swingHit();
    if (k === 'swfin') { var h = G.tal.HR + G.tal['2B'] + G.tal['1B']; return endGame(G.pts, Math.min(30, G.pts * 2), G.lv === 3 ? exLabel('swing', G.pts) : G.pts + ' total bases · ' + h + ' hit' + (h === 1 ? '' : 's')); }
    /* signs */
    if (k === 'sg') {
      if (G.busy || G.over) return;
      G.inp.push(+v); var ii = G.inp.length - 1, okT = G.seq[ii] === +v, tk = G.tap = [+v, okT, Math.random()];
      later(function () { if (G && G.k === 'signs' && G.tap === tk) { G.tap = null; render(); } }, okT ? 260 : 900);
      if (!okT) { G.over = true; sfx.bad(); render(); later(function () { if (G && G.k === 'signs') endGame(G.round - 1, Math.min(30, (G.round - 1) * 3), 'Got ' + (G.round - 1) + ' round' + (G.round === 2 ? '' : 's')); }, 900); return; }
      S.tone(440 + +v * 90, .12, 'sine', .06); render();
      if (G.inp.length === G.seq.length) { G.busy = true; sfx.good(); later(signsNext, 600); }
      return;
    }
    /* steal or stay */
    if (k === 'stlead') return stealLead();
    if (k === 'st') return stealTap(v);
    if (k === 'stfin') return endGame(G.right, G.right * 3, (G.lives && G.miss >= G.lives ? 'Struck out! ' : '') + G.right + ' of ' + G.i + ' good reads');
    /* six swings + four bagger */
    if (k === 'wk') return wordKey(v);
    if (k === 'sp') { if (G.k === 'word') return start('word', G.lv, { sp: v }); return start('four', G.lv, { sp: v }); }
    if (k === 'wnew') { if (G.lv === 3 && !G.won) return puzzleDone(); return start('word', G.lv, G.lv === 3 ? { sp: G.sp, ch: G.ch, cn: G.cn } : { sp: G.sp, rnd: true }); }
    if (k === 'wdone' || k === 'fdone') return puzzleDone();
    if (k === 'ft') { if (G.over) return; var w = v.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"'), si = G.sel.indexOf(w); if (si >= 0) G.sel.splice(si, 1); else if (G.sel.length < 4) G.sel.push(w); return render(); }
    if (k === 'fshuf') { G.tiles = sh(G.tiles); return render(); }
    if (k === 'fsub') return fourSubmit();
    if (k === 'fnext') { if (G.lv === 3 && !G.won) return puzzleDone(); return start('four', G.lv, G.lv === 3 ? { sp: G.sp, ch: G.ch, cn: G.cn } : { sp: G.sp }); }
  });
  /* keyboard for Six Swings */
  document.addEventListener('keydown', function (e) {
    if (!G || G.k !== 'word' || G.over || view !== 'game') return;
    if (e.key === 'Enter') wordKey('ENT'); else if (e.key === 'Backspace') wordKey('DEL'); else if (/^[a-z]$/i.test(e.key)) wordKey(e.key.toUpperCase());
  });
  /* ---------- go ---------- */
  var params = new URLSearchParams(location.search);
  pickK = params.get('g');
  if (!game(pickK)) { location.replace('./'); return; }
  document.title = game(pickK)[2] + ' · Arcade';
  view = 'levels'; render();
})();
