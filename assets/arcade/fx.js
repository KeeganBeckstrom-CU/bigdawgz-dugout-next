/* Basepaths Arcade: five play-through games in full painted scenes.
   Home Run Derby, Run the Bases, Gold Glove, Ace and Can of Corn.
   Each one teaches something real while you play: pitch recognition, base-running reads,
   where to throw, how to pitch a count, and reading fly balls. */
(function () {
  var A = window.ARC, P = window.Profile, S = window.Sound;
  var root = document.getElementById('game');
  var LVN = ['Easy', 'Medium', 'Hard', 'Expert'], LVW = [1, 2, 3, 4], XPM = [1, 1.25, 1.5, 2];
  var IMG = '../assets/img/', FX = IMG + 'fx/';
  var GAMES = {
    derby: { name: 'Home Run Derby', blurb: 'Swing for the fences. Lay off the bad ones.', unit: 'home runs',
      lv: ['10 outs. Slow pitches. The scoreboard tells you what’s coming.', '8 outs. Faster, and the pitch name shows late.', '7 outs. Curveballs, no pitch names. Chasing a ball is an out.', 'Fastest. 3 outs. Keep going as long as you can.'] },
    bases: { name: 'Run the Bases', blurb: 'Read the ball, read the coach. Go, or stay?', unit: 'runs',
      lv: ['5 outs. Lots of time to decide. Coach helps.', '3 outs. Less time.', '3 outs. Quick reads, tougher plays.', 'One wrong read ends it.'] },
    glove: { name: 'Gold Glove', blurb: 'Play shortstop and second base. Get in front of the grounder, then make the throw.', unit: 'outs made',
      lv: ['10 grounders. Big glove. Runners shown.', '10 grounders. Faster, with hops.', '12 grounders. Fast and tricky. 3 errors and you’re done.', 'Keep going until your first error.'] },
    ace: { name: 'Ace', blurb: 'Pick the pitch, hit your spot, win the count.', unit: 'outs',
      lv: ['5 batters. Big green zone on the meter. Coach gives tips.', '6 batters. Smaller green zone.', '7 batters. Tiny green zone, smarter hitters.', 'Keep going until a batter reaches base.'] },
    corn: { name: 'Can of Corn', blurb: 'Read the fly ball, make the catch, hit your cutoff.', unit: 'catches',
      lv: ['8 balls. The landing spot is marked.', '8 balls. Only the shadow shows where it’s going.', '10 balls. Faster, the shadow shows late, and a ball on the edge of your glove can pop out. 3 drops and you’re done.', 'Fastest, smallest glove, tight release. Keep going until your first drop.'] }
  };

  /* ---------- small helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function R(a, b) { return a + Math.random() * (b - a); }
  function RI(a, b) { return Math.floor(R(a, b + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function sh(a) { return a.map(function (x) { return [Math.random(), x]; }).sort(function (a, b) { return a[0] - b[0]; }).map(function (x) { return x[1]; }); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function at(e, x, y) { e.style.left = x + '%'; e.style.top = y + '%'; }
  function wait(ms) { return new Promise(function (r) { G.timers.push(setTimeout(r, ms)); }); }
  function alive(tok) { return G && G.tok === tok && !G.over; }
  var sfx = {
    tap: function () { S.tone(660, .07, 'sine', .06); },
    good: function () { S.tone(880, .1, 'triangle', .08); S.tone(1320, .14, 'triangle', .07, .07); },
    bad: function () { S.tone(220, .25, 'triangle', .1, 0, 140); },
    crack: function () { S.tone(1700, .04, 'square', .09); S.tone(260, .1, 'triangle', .16); S.tone(120, .18, 'sine', .1); },
    pop: function () { S.tone(180, .08, 'triangle', .18); S.tone(90, .12, 'sine', .14); },
    whoosh: function () { S.tone(240, .3, 'sine', .05, 0, 900); },
    cheer: function () { [523, 659, 784, 1047, 784, 1047].forEach(function (f, i) { S.tone(f, .2, 'triangle', .07, i * .09); }); },
    step: function () { S.tone(R(2400, 3200), .03, 'square', .02); }
  };
  /* animate an element along points [{x,y,s}] over ms (WAAPI, % positions) */
  function fly(e, pts, ms, ease) {
    var kf = pts.map(function (p) { return { left: p.x + '%', top: p.y + '%', transform: 'translate(-50%,-50%) scale(' + (p.s == null ? 1 : p.s) + ')' }; });
    var a = e.animate(kf, { duration: ms, easing: ease || 'linear', fill: 'forwards' });
    return a.finished.catch(function () {});
  }
  function arc(x0, y0, x1, y1, h, s0, s1, n) { var o = []; n = n || 14; for (var i = 0; i <= n; i++) { var t = i / n; o.push({ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t - h * 4 * t * (1 - t), s: s0 + (s1 - s0) * t }); } return o; }
  function fireworks(stage, x, y, n) {
    var cols = ['#ffe27a', '#ff8a3d', '#5C068C', '#4fc7b0', '#ef7fb0', '#fff'];
    for (var i = 0; i < (n || 26); i++) { var f = el('i', 'fw'); at(f, x, y); var a = Math.random() * Math.PI * 2, d = R(40, 120); f.style.setProperty('--dx', Math.cos(a) * d + 'px'); f.style.setProperty('--dy', Math.sin(a) * d + 'px'); f.style.background = pick(cols); f.style.animationDelay = R(0, .25) + 's'; stage.appendChild(f); (function (f) { setTimeout(function () { f.remove(); }, 1600); })(f); }
  }

  /* ---------- shared screen pieces ---------- */
  var G = null, key = null;
  function hsPts(raw, lv) { return Math.round((raw || 0) * LVW[lv || 0]); }
  function header(sub, back) {
    return '<header class="ghead">' + (back ? '<button class="gx" data-a="levels" aria-label="Back to levels">' : '<a class="gx" href="./" aria-label="Back to the arcade">') + '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>' + (back ? '</button>' : '</a>') + '<img src="' + IMG + 'games/' + key + '.png" alt=""><span><b>' + esc(GAMES[key].name) + '</b><small>' + esc(sub) + '</small></span></header>';
  }
  function levels() {
    stop();
    var g = GAMES[key], p = P.data, h = p.hs[key];
    root.className = 'app';
    root.innerHTML = header('Pick a level') + '<section class="panel lvpanel"><img class="hero" src="' + IMG + 'games/' + key + '.png" alt=""><h1>' + esc(g.name) + '</h1><p class="sub">' + esc(g.blurb) + '</p>' +
      '<div class="hsl"><span>Your high score</span><b>' + (h ? h.s + ' pts' : '—') + '</b>' + (h ? '<small>' + LVN[h.lv] + ' · ' + h.r + ' ' + g.unit + '</small>' : '') + '</div>' +
      '<p class="hsx">Points = what you get × level: Easy ×1, Medium ×2, Hard ×3, Expert ×4.</p>' +
      '<div class="lvs">' + LVN.map(function (n, i) { var b = p.best[i ? key + '_' + i : key]; return '<button class="lvb l' + i + '" data-a="lv:' + i + '"><span class="lvn"><b>' + n + '</b>' + (i ? '<em>+' + [0, 25, 50, 100][i] + '% XP</em>' : '') + '</span><span class="lvi">' + esc(g.lv[i]) + '</span><small>' + (b != null ? 'Best ' + b + ' ' + g.unit : 'Not played yet') + '</small></button>'; }).join('') + '</div></section>';
  }
  function stage(bg) {
    root.className = 'fxapp';
    root.innerHTML = header(LVN[G.lv], true) + '<div class="stage" id="stage">' + (bg ? '<img class="bgi" src="' + FX + bg + '" alt="">' : '') + '<div class="shud" id="hud"></div><div class="coach" id="coach" role="status" aria-live="polite"><img src="' + IMG + 'games/star.png" alt=""><span></span></div><div class="ctrl" id="ctrl"></div></div>';
    G.st = document.getElementById('stage'); G.hud = document.getElementById('hud'); G.ctrl = document.getElementById('ctrl'); G.coachEl = document.getElementById('coach');
    return G.st;
  }
  function coach(msg, kind, ms) {
    var c = G.coachEl; if (!c) return;
    c.querySelector('span').innerHTML = msg; c.className = 'coach on ' + (kind || '');
    clearTimeout(G.coachT); if (ms !== 0) G.coachT = setTimeout(function () { c.className = 'coach'; }, ms || 3200);
  }
  function coachOff() { if (G && G.coachEl) G.coachEl.className = 'coach'; }
  function callout(txt, cls, sub) { var c = el('div', 'callout ' + (cls || ''), esc(txt) + (sub ? '<small>' + esc(sub) + '</small>' : '')); G.st.appendChild(c); setTimeout(function () { c.remove(); }, 1300); }
  function dots(n, t, c) { var h = '<span class="dots">'; for (var i = 0; i < t; i++) h += '<i class="' + c + (i < n ? ' on' : '') + '"></i>'; return h + '</span>'; }
  function sprite(src, x, y, h, flip) { var s = el('div', 'sp', '<img src="' + FX + src + '" alt="">'); s.style.height = 'auto'; s.style.width = h + '%'; at(s, x, y); if (flip) s.firstChild.style.transform = 'scaleX(-1)'; G.st.appendChild(s); return s; }
  function setSprite(s, src) { s.firstChild.src = FX + src; }
  function timerBar(ms) { var t = el('div', 'timer', '<i></i>'); G.st.appendChild(t); t.firstChild.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: ms, fill: 'forwards' }); return t; }

  function finish(raw, xp, label, extra) {
    if (!G || G.over) return; G.over = true; stop(true);
    var k = key, lv = G.lv, p = P.data, bk = lv ? k + '_' + lv : k;
    if (lv === 3) xp = Math.min(xp, 120);
    xp = Math.round(xp * XPM[lv]);
    p.gp[k] = (p.gp[k] || 0) + 1;
    if (p.best[bk] == null || raw > p.best[bk]) p.best[bk] = raw;
    var pts = hsPts(raw, lv), cur = p.hs[k], nw = pts > 0 && (!cur || pts > cur.s);
    if (nw) p.hs[k] = { s: pts, lv: lv, r: raw, d: P.today() };
    P.save(); var up = P.award(xp);
    sfx.cheer();
    root.className = 'app';
    root.innerHTML = header(LVN[lv], true) + '<section class="panel endp"><img class="hero" src="' + IMG + 'games/' + k + '.png" alt=""><h1>' + esc(label) + '</h1>' + (extra ? '<div class="fxscore">' + extra.map(function (e) { return '<span>' + esc(e) + '</span>'; }).join('') + '</div>' : '') +
      '<div class="hsend ' + (nw ? 'new' : '') + '"><small>' + LVN[lv] + ' ×' + LVW[lv] + '</small><b>' + pts + ' pts</b><span>' + (nw ? 'New high score!' : 'High score: ' + (p.hs[k] ? p.hs[k].s : 0) + ' pts') + '</span></div>' +
      '<div class="xpwon"><img src="' + IMG + 'coin.png" alt=""><b>+' + xp + ' XP</b></div>' +
      (G.lessons && G.lessons.length ? '<div class="fact ok" style="text-align:left;margin:10px 0"><b>What you learned</b><br>' + G.lessons.slice(-3).map(esc).join('<br>') + '</div>' : '') +
      '<div class="stack"><button class="cta" data-a="again"><img src="' + IMG + 'button.png" alt=""><span>Play again</span></button>' + (lv < 3 ? '<button class="cta alt" data-a="lv:' + (lv + 1) + '"><img src="' + IMG + 'plank.png" alt=""><span>Try ' + LVN[lv + 1] + '</span></button>' : '') + '<a class="ghost" href="./">Back to the arcade</a></div></section>';
    if (up) setTimeout(function () { toast('Level up: ' + up + '!'); }, 1400);
  }
  function toast(msg) { var t = document.getElementById('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('on'); }, 2400); }
  function learn(s) { if (G.lessons.indexOf(s) < 0) G.lessons.push(s); }
  function stop(keep) { if (!G) return; G.timers.forEach(clearTimeout); G.timers = []; if (G.raf) cancelAnimationFrame(G.raf); G.tok = Math.random(); if (!keep) G = null; }
  function start(lv) {
    stop();
    G = { lv: lv, timers: [], tok: Math.random(), over: false, lessons: [] };
    ({ derby: derby, bases: bases, glove: glove, ace: ace, corn: corn })[key](lv);
  }

  /* =========================================================
     1. HOME RUN DERBY: batter's eye for the pitch, then the whole field for the ball.
     Real pitch speeds for 12U, real ball flight (exit velo + launch angle), real fence.
     ========================================================= */
  /* field math on the overhead park painting: feet from home -> % of the picture */
  var FLD = { hx: 50, hy: 72.5, ax: .509, ay: -.0545, by: -.202 };
  function fpt(xft, yft) { return { x: FLD.hx + FLD.ax * xft, y: FLD.hy + FLD.ay * xft + FLD.by * yft }; }
  function wallY(x) { return 36.5 + .0022 * (x - 50) * (x - 50); }
  var FIELDERS = { P: [0, 46], C: [0, -4], '1B': [44, 58], '2B': [24, 92], SS: [-24, 92], '3B': [-44, 58], LF: [-72, 138], CF: [0, 158], RF: [72, 138] };
  function crowd(sec, vol) {
    var a = S.ctx(); if (!a) return;
    var n = a.createBufferSource(), b = a.createBuffer(1, a.sampleRate * sec, a.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < d.length; i++) { var t = i / d.length; d[i] = (Math.random() * 2 - 1) * Math.min(1, t * 6) * Math.pow(1 - t, 1.4); }
    n.buffer = b; var f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = .6;
    var g = a.createGain(); g.gain.value = vol || .25; n.connect(f); f.connect(g); g.connect(a.destination); n.start();
  }
  function derby(lv) {
    var st = stage('bg-bat.jpg'), tok = G.tok;
    G.outs = 0; G.maxOuts = [10, 10, 7, 3][lv]; G.hr = 0; G.feet = 0; G.longest = 0; G.hrs = [];
    /* --- batter's eye scene --- */
    var bat = el('div', 'batcam'); st.insertBefore(bat, G.hud);
    var pitcher = el('div', 'sp', '<img src="' + FX + 'p-set.png" alt="Pitcher">'); pitcher.style.width = '7.5%'; at(pitcher, 49.5, 52.8); bat.appendChild(pitcher);
    var mitt = el('img', 'mitt'); mitt.src = IMG + 'glove.png'; mitt.alt = ''; mitt.style.width = '9%'; at(mitt, 49.5, 73); bat.appendChild(mitt);
    var shadow = el('div', 'shadow'); shadow.style.cssText += ';width:3%;height:1%;display:none'; bat.appendChild(shadow);
    var ball = el('div', 'ball spin'); ball.style.display = 'none'; bat.appendChild(ball);
    var batter = el('div', 'sp', '<img src="' + FX + 'rb-stance.png" alt="You, a right-handed hitter, in the box">'); batter.style.width = '25%'; at(batter, 27, 96); bat.appendChild(batter);
    var flash = el('div', 'flash'); bat.appendChild(flash);
    /* --- whole field camera --- */
    var cam = el('div', 'fieldcam', '<div class="fworld"><img class="parkimg" src="' + IMG + 'park.jpg" alt="The whole field"></div><div class="statcard" id="sc"></div>');
    st.insertBefore(cam, G.hud);
    var fw = cam.firstChild, fshadow = el('div', 'shadow'), fball = el('div', 'ball'), fdots = {};
    fshadow.style.cssText += ';width:2.4%;height:1%'; fball.style.width = '2.4%';
    /* no fielders: it's a derby, just you and the fence */
    fw.appendChild(fshadow); fw.appendChild(fball);
    var sc = cam.querySelector('#sc');
    function hud(spd) {
      G.hud.innerHTML = '<div class="sbx"><span class="k"><small>HR</small><b>' + G.hr + '</b></span><span class="k"><small>Outs</small>' + dots(G.outs, G.maxOuts, 'o') + '</span></div><div class="chipz">' + (spd ? '<span class="mph">' + spd + ' MPH</span>' : '') + '<span>Longest ' + G.longest + ' ft</span></div>';
    }
    hud();
    G.ctrl.innerHTML = '<button class="bigbtn" id="act">Pitch!</button>';
    var act = document.getElementById('act');
    var live = false, t0 = 0, dur = 0, kind = '', zone = 'in', mph = 0, path = null;
    var pitches = lv >= 2 ? ['Fastball', 'Fastball', 'Changeup', 'Curveball'] : ['Fastball', 'Fastball', 'Changeup'];
    var MPH = { Fastball: [56, 64], Changeup: [45, 50], Curveball: [46, 51] };
    coach('Swing at strikes, take the balls. A <b>changeup</b> comes in slower: wait on it. Square it up and it carries over the fence.', '', 4600);
    crowd(3, .08);
    /* perspective pitch path: tiny at the release point, fast and big at the plate */
    function pitchPath(ex, ey, curve) {
      var rx = 51.6, ry = 45.2, n = 22, pts = [];
      for (var i = 0; i <= n; i++) {
        var t = i / n, s = .2 / (1 - .8 * t), w = (s - .2) / .8;
        var bx = rx + (ex - rx) * w, by = ry + (ey - ry) * w;
        if (curve) by += Math.sin(w * Math.PI) * -2.2 + w * w * 3;
        pts.push({ x: bx, y: by, s: s * 1.55, g: 52.8 + (79 - 52.8) * w, t: t });
      }
      return pts;
    }
    async function pitch() {
      if (live || G.over || G.busy) return;
      coachOff(); act.disabled = true; act.textContent = 'Wait…'; G.busy = true;
      kind = pick(pitches); zone = Math.random() < [.74, .74, .64, .6][lv] ? 'in' : pick(['hi', 'lo', 'away']);
      if (kind === 'Curveball' && zone === 'hi') zone = 'lo';
      mph = RI(MPH[kind][0], MPH[kind][1]) + lv * 2;
      if (lv === 0) callout(kind, '', 'coming');
      at(mitt, zone === 'away' ? 58 : 49.5, zone === 'hi' ? 64 : zone === 'lo' ? 80 : 73);
      await wait(lv === 0 ? 650 : 300); if (!alive(tok)) return;
      setSprite(pitcher, 'p-kick.png'); await wait(520); if (!alive(tok)) return;
      setSprite(pitcher, 'p-release.png'); setSprite(batter, 'rb-load.png'); hud(lv <= 1 ? mph : 0);
      if (lv === 1) callout(kind, '');
      /* real time to the plate: 46 ft at this speed, stretched a little so kids can react */
      dur = 46 / (mph * 1.467) * 1000 * [2.3, 2.15, 1.75, 1.5][lv];
      var ex = zone === 'away' ? 59.5 : R(47.5, 51.5), ey = zone === 'hi' ? 63 : zone === 'lo' ? 81.5 : R(70.5, 75);
      path = pitchPath(ex, ey, kind === 'Curveball');
      ball.style.display = 'block'; shadow.style.display = 'block'; live = true; t0 = performance.now(); act.disabled = false; act.textContent = 'SWING!';
      ball.style.setProperty('--spin', (kind === 'Fastball' ? 80 : kind === 'Changeup' ? 220 : 140) + 'ms');
      G.anim = ball.animate(path.map(function (p) { return { left: p.x + '%', top: p.y + '%', transform: 'translate(-50%,-50%) scale(' + p.s + ')' }; }), { duration: dur, fill: 'forwards' });
      G.sanim = shadow.animate(path.map(function (p) { return { left: p.x + '%', top: p.g + '%', transform: 'translate(-50%,-50%) scale(' + p.s * .9 + ')', opacity: .3 + p.t * .5 }; }), { duration: dur, fill: 'forwards' });
      setTimeout(function () { setSprite(pitcher, 'p-set.png'); }, 600);
      G.timers.push(setTimeout(function () { if (live && alive(tok)) take(); }, dur + 90));
    }
    function hidePitch() { ball.style.display = 'none'; shadow.style.display = 'none'; if (G.anim) G.anim.cancel(); if (G.sanim) G.sanim.cancel(); }
    function take() {
      live = false; hidePitch(); sfx.pop(); setSprite(batter, 'rb-stance.png');
      if (zone === 'in') {
        if (lv >= 2) { G.outs++; callout('STRIKE!', 'bad', 'Called strike · out'); sfx.bad(); coach('That ' + kind.toLowerCase() + ' was a strike. In this derby <b>a strike you take is an out</b>. Be ready.', 'bad'); }
        else { callout('STRIKE!', 'bad', 'Called'); coach('Right over the plate. Load early so you’re ready to swing at strikes.', 'bad'); }
      } else { callout('BALL', 'gold', 'Good take!'); sfx.good(); coach('Good eye. That was ' + ({ hi: 'up at your eyes', lo: 'in the dirt', away: 'off the plate' })[zone] + '. <b>Great hitters swing at strikes.</b>', 'good'); learn('Take pitches out of the zone. Only swing at strikes.'); }
      next(900);
    }
    async function swing() {
      if (!live) return; live = false;
      var f = (performance.now() - t0) / dur; if (G.anim) G.anim.pause(); if (G.sanim) G.sanim.pause();
      setSprite(batter, 'rb-contact.png'); setTimeout(function () { setSprite(batter, 'rb-finish.png'); }, 130);
      S.tone(300, .18, 'sine', .05, 0, 120);
      var w = [.12, .115, .08, .06][lv], d = Math.abs(f - .95), tm = f < .95 ? 'early' : 'late';
      if (zone !== 'in') {
        hidePitch(); sfx.bad(); G.outs++; callout('CHASED!', 'bad', 'Swung at a ball');
        coach('That pitch was ' + ({ hi: 'up at your eyes', lo: 'in the dirt', away: 'off the plate' })[zone] + '. Chasing gives the pitcher a free out. <b>Swing at strikes.</b>', 'bad', 3800);
        learn('Chasing a ball out of the zone gives the pitcher an easy out.');
        return next(900);
      }
      if (d > w * 2.4) {
        hidePitch(); sfx.bad(); G.outs++; callout('SWING AND A MISS', 'bad', tm === 'early' ? 'Way out in front' : 'Too late');
        coach(tm === 'early' ? 'Way out in front' + (kind === 'Changeup' ? ' of a <b>changeup</b>. It’s slower: let it travel.' : '. Wait a hair longer.') : 'Late' + (kind === 'Fastball' ? ' on a <b>' + mph + ' mph fastball</b>. Start your swing as his arm comes forward.' : '.'), 'bad', 3800);
        if (kind === 'Changeup' && tm === 'early') learn('A changeup looks like a fastball but comes in slower. Wait on it.');
        if (kind === 'Fastball' && tm === 'late') learn('On a fastball, start your swing early.');
        return next(900);
      }
      /* contact: timing makes exit velocity and spray, pitch height makes launch angle */
      var br = ball.getBoundingClientRect(), sr = st.getBoundingClientRect(), cx = (br.left + br.width / 2 - sr.left) / sr.width * 100, cy = (br.top + br.height / 2 - sr.top) / sr.height * 100;
      hidePitch(); at(flash, cx, cy); flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('on');
      sfx.crack(); crowd(1.2, .12);
      var qual = Math.max(0, 1 - d / (w * 2.4));
      var ev = Math.round(40 + qual * 44 + R(-3, 3) + (kind === 'Fastball' ? 3 : 0) - (lv >= 2 ? lv : 0));
      var la = Math.round((zone === 'in' ? 18 : 10) + (ey() - 73) * -2.2 + R(-14, 18) + (qual > .7 ? 8 : 0));
      if (d > w * 1.6) la += pick([-22, 30]);
      var spray = Math.max(-58, Math.min(58, (tm === 'early' ? -1 : 1) * d / w * 22 + R(-10, 10)));
      await fieldPlay(ev, la, spray);
    }
    function ey() { return path ? path[path.length - 1].y : 73; }
    async function fieldPlay(ev, la, spray) {
      act.disabled = true; act.textContent = '…';
      var foul = Math.abs(spray) > 45;
      var v = ev * 1.467, rad = la * Math.PI / 180;
      var carry = la <= 4 ? 0 : Math.max(0, v * v * Math.sin(2 * rad) / 32.2 * .55);
      var hang = la <= 4 ? 0 : 2 * v * Math.sin(rad) / 32.2 * .78;
      var dist = carry, roll = la < 12 ? Math.min(150, v * 1.1) : la < 25 ? 20 : 0;
      var th = spray * Math.PI / 180, lx = Math.sin(th) * dist, ly = Math.cos(th) * dist;
      var land = fpt(lx, ly), hr = !foul && la > 14 && land.y < wallY(land.x) - .6;
      var feet = Math.round(dist * 1.15);
      /* camera: cut to the whole field, push out from home plate */
      cam.classList.add('on'); st.classList.add('fieldon'); fball.style.display = 'block'; fshadow.style.display = 'block';
      fw.animate([{ transform: 'scale(1.9)', transformOrigin: '50% 72%' }, { transform: 'scale(1)', transformOrigin: '50% 72%' }], { duration: 900, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' });
      sc.innerHTML = ''; sc.className = 'statcard';

      var ms = Math.max(900, Math.min(3600, (hang || 1) * 1000 * .9));
      var target = { x: lx + Math.sin(th) * roll, y: ly + Math.cos(th) * roll };
      /* who goes after it */





      /* the ball's flight: shadow on the ground, ball up in the air */
      var n = 26, sp = [], bp = [];
      for (var i = 0; i <= n; i++) {
        var t = i / n, gx = lx * t, gy = ly * t, g = fpt(gx, gy), hft = la > 4 ? Math.pow(v * Math.sin(rad), 2) / 64.4 * .6 * 4 * t * (1 - t) : 0;
        sp.push({ x: g.x, y: g.y, s: 1 });
        bp.push({ x: g.x, y: g.y - hft * .16, s: 1 + hft / 60 });
      }
      if (la <= 12) { var gEnd = fpt(target.x * .8, target.y * .8); sp = [{ x: FLD.hx, y: FLD.hy, s: 1 }, { x: gEnd.x, y: gEnd.y, s: 1 }]; bp = [{ x: FLD.hx, y: FLD.hy, s: 1 }, { x: gEnd.x, y: gEnd.y - .4, s: 1 }]; }

      if (hr) { G.timers.push(setTimeout(function () { if (alive(tok)) crowd(2.6, .3); }, ms * .55)); }
      fly(fshadow, sp, ms, la < 12 ? 'ease-out' : 'linear');
      await fly(fball, bp, ms, la < 12 ? 'ease-out' : 'linear'); if (!alive(tok)) return;
      var res, tip;
      if (foul) { res = 'FOUL BALL'; tip = 'Way ' + (spray < 0 ? 'early: you pulled it foul.' : 'late: you pushed it foul.') + ' Only home runs count in the derby.'; }
      else if (hr) { res = 'HOME RUN!'; tip = la >= 22 && la <= 35 ? 'That\u2019s the sweet spot: <b>' + la + '\u00b0</b> launch angle with a hard swing.' : 'Got it over the fence!'; }
      else if (la <= 10) { res = 'GROUND BALL'; tip = 'Launch angle <b>' + la + '\u00b0</b> is a ground ball. It can\u2019t leave the park. ' + (ey() > 76 ? 'Low pitches turn into grounders.' : 'Get the barrel under the ball a little more.'); learn('Ground balls (under 10\u00b0) can\u2019t leave the park. Home runs are usually 20\u201335\u00b0.'); }
      else if (la > 50) { res = 'POP-UP'; tip = 'Launch angle <b>' + la + '\u00b0</b> is a pop-up. ' + (ey() < 68 ? 'That pitch was up. ' : '') + 'You got too far under it.'; learn('Pop-ups (over 50\u00b0) go up but not out. Stay through the middle of the ball.'); }
      else if (land.y < wallY(land.x) + 3) { res = 'OFF THE WALL!'; tip = 'So close! ' + ev + ' mph. A little more bat speed and it\u2019s gone.'; }
      else if (la < 22) { res = 'LINE DRIVE'; tip = 'Hit hard at <b>' + la + '\u00b0</b>. Line drives are hits in a game, but for a home run you need a little more lift (20\u201335\u00b0).'; }
      else { res = 'FLY BALL'; tip = 'Good angle, but ' + ev + ' mph isn\u2019t enough to carry. ' + (ev < 72 ? 'Square it up on the barrel for more exit velo.' : 'Almost there.'); }
      if (!hr && !foul) { fball.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, delay: 400, fill: 'forwards' }); }
      if (hr) { fball.style.display = 'none'; G.hr++; G.feet += feet; G.longest = Math.max(G.longest, feet); G.hrs.push(feet); fireworks(fw, land.x, Math.min(land.y, wallY(land.x) - 2), 36); fireworks(fw, land.x + R(-10, 10), land.y - 6, 20); sfx.cheer(); }
      else G.outs++;
      hud(); fshadow.style.display = 'none';
      callout(res, hr ? 'gold' : 'bad', hr ? feet + ' feet' : foul ? '' : feet + ' ft');
      sc.innerHTML = '<div><small>Exit velo</small><b>' + ev + '<i>mph</i></b></div><div><small>Launch</small><b>' + la + '<i>°</i></b></div><div><small>Distance</small><b>' + (foul ? '—' : feet) + '<i>ft</i></b></div>';
      sc.className = 'statcard on';
      coach(tip, hr ? 'good' : '', 4200);
      await wait(hr ? 2600 : 2200); if (!alive(tok)) return;
      cam.classList.remove('on'); st.classList.remove('fieldon'); fball.style.display = 'none'; sc.className = 'statcard';
      next(200);
    }
    function next(ms) {
      G.timers.push(setTimeout(function () {
        if (!alive(tok)) return;
        hud(); setSprite(batter, 'rb-stance.png'); at(mitt, 49.5, 73); G.busy = false;
        if (G.outs >= G.maxOuts) { act.disabled = true; return finish(G.hr, Math.min(60, G.hr * 6 + 4), G.hr + ' home run' + (G.hr === 1 ? '' : 's'), ['Longest ' + G.longest + ' ft', 'Total ' + G.feet + ' ft']); }
        act.disabled = false; act.textContent = 'Pitch!';
      }, ms || 0));
    }
    act.addEventListener('click', function (e) { e.stopPropagation(); if (live) swing(); else pitch(); });
    st.addEventListener('pointerdown', function (e) { if (live && !e.target.closest('button')) swing(); });
  }

  /* =========================================================
     2. RUN THE BASES: overhead park. Base-running reads.
     ========================================================= */
  var BASE = { 0: [50, 72.5], 1: [75.2, 59.8], 2: [49.9, 52.5], 3: [24.6, 59.9], 4: [50, 72.5] };
  var SPOT = { LF: [24, 42], CF: [50, 36], RF: [76, 42], SS: [38, 55], '2B': [62, 55], '3B': [30, 61], '1B': [70, 61], P: [50, 60], C: [50, 76], deepRF: [82, 30], deepLF: [18, 30], deepCF: [50, 25], gapRC: [66, 33], gapLC: [34, 33] };
  function bases(lv) {
    var st = stage(null), tok = G.tok;
    var world = el('div', 'rbworld', '<img class="parkimg" src="' + IMG + 'park.jpg" alt="The ballpark from above">'); st.insertBefore(world, st.firstChild);
    G.outs = 0; G.maxOuts = [5, 3, 3, 1][lv]; G.runs = 0; G.reads = 0; G.on = 1;
    var runner = el('div', 'sp', '<img src="' + FX + 'runner.png" alt="Your runner">'); runner.style.width = '7%'; world.appendChild(runner);
    var ball = el('div', 'ball'); ball.style.width = '2%'; ball.style.display = 'none'; world.appendChild(ball);
    var glove = el('img', 'glovemark'); glove.src = IMG + 'glove.png'; glove.alt = ''; glove.style.display = 'none'; world.appendChild(glove);
    var csig = el('div', 'coachsig', '<img class="hand" src="' + IMG + 'games/send.png" alt=""><span>Coach</span>'); csig.style.display = 'none'; world.appendChild(csig);
    function place(b) { at(runner, BASE[b][0], BASE[b][1] + 1); }
    place(G.on);
    function hud() { G.hud.innerHTML = '<div class="sbx"><span class="k"><small>Runs</small><b>' + G.runs + '</b></span><span class="k"><small>Outs</small>' + dots(G.outs, G.maxOuts, 'o') + '</span></div><div class="chipz"><span>On ' + ['', 'first', 'second', 'third'][G.on] + '</span><span>' + G.sitOuts + ' out' + (G.sitOuts === 1 ? '' : 's') + ' in the inning</span></div>'; }
    var windows = [3200, 2300, 1700, 1300];
    /* the plays: what happens, when it happens, and the right read */
    function makePlay() {
      var b = G.on, o = RI(0, 2); G.sitOuts = o;
      var P2 = [];
      // fly ball with less than 2 outs: tag up (from 2nd or 3rd on a deep one), stay on a shallow one
      if (o < 2) {
        if (b === 3 || b === 2) P2.push({ txt: 'Deep fly ball to ' + (b === 3 ? 'center' : 'right'), to: b === 3 ? 'deepCF' : 'deepRF', kind: 'tag', ans: 'tag', lesson: 'Fewer than 2 outs on a fly ball: go back to the base, then tag up and run when it’s caught.', why: 'With less than two outs, get back to the bag. The moment he catches it, you can run.' });
        P2.push({ txt: 'Shallow pop-up to the shortstop', to: 'SS', kind: 'fly', ans: 'stay', lesson: 'On a shallow pop-up, stay close to your base.', why: 'A shallow pop-up gets caught. If you run, he throws you out before you get back.' });
        P2.push({ txt: 'Line drive right at the ' + (b === 1 ? 'second baseman' : 'shortstop'), to: b === 1 ? '2B' : 'SS', kind: 'liner', ans: 'stay', lesson: 'On a line drive, freeze. If it’s caught and you’re off the bag, you’re doubled off.', why: 'Line drive: freeze! If he catches it, you have to get back or it’s a double play.' });
      } else {
        P2.push({ txt: 'Two outs. Fly ball to ' + pick(['left', 'center', 'right']), to: pick(['LF', 'CF', 'RF']), kind: 'two', ans: 'go', lesson: 'With 2 outs, run on contact. If the ball is caught the inning is over anyway.', why: 'Two outs: run as soon as the ball is hit. If it’s caught, the inning is over anyway.' });
      }
      if (b === 2) {
        P2.push({ txt: 'Ground ball to the shortstop, in front of you', to: 'SS', kind: 'ground', ans: 'stay', lesson: 'Runner on 2nd: a grounder in front of you (to short or third), hold.', why: 'The ball was hit in front of you to the left side. If you run, he throws you out at third.' });
        P2.push({ txt: 'Ground ball to the second baseman, behind you', to: '2B', kind: 'ground', ans: 'go', lesson: 'Runner on 2nd: a grounder behind you (right side), go to third.', why: 'Ball hit behind you to the right side. The throw goes to first, so you can take third.' });
      }
      if (b === 1) P2.push({ txt: 'Ground ball to the second baseman', to: '2B', kind: 'force', ans: 'go', lesson: 'On first, a ground ball forces you to run. You have to go.', why: 'It’s a force. The batter is running to first, so you have to go to second. Run hard!' });
      if (b === 3 && o < 2) P2.push({ txt: 'Ground ball right back to the pitcher', to: 'P', kind: 'ground', ans: 'stay', lesson: 'On third with the ball hit back to the pitcher, hold. He’d throw you out at home.', why: 'The pitcher is right there. If you break for home he throws you out easily.' });
      P2.push({ txt: 'Base hit to ' + pick(['left', 'center', 'right']) + '!', to: pick(['LF', 'CF', 'RF']), kind: 'hit', ans: 'go', coach: Math.random() < .55 ? 'wave' : 'stop', lesson: 'On a base hit, run, and watch your base coach. Waving = keep going, hands up = stop.', why: '' });
      P2.push({ txt: 'Wild pitch! The ball gets past the catcher', to: 'C', kind: 'wild', ans: 'go', lesson: 'When the ball gets past the catcher, take the next base.', why: 'The ball rolled to the backstop. That’s a free base. Go!' });
      return pick(P2);
    }
    async function play() {
      if (G.over) return;
      var pl = makePlay(); hud(); coachOff();
      G.ctrl.innerHTML = '<button class="bigbtn stay" id="stay" disabled>STAY</button><button class="bigbtn go" id="go" disabled>GO!</button>';
      var go = document.getElementById('go'), stayB = document.getElementById('stay');
      coach('<b>' + G.sitOuts + ' out' + (G.sitOuts === 1 ? '' : 's') + '.</b> ' + esc(pl.txt) + (/[.!]$/.test(pl.txt) ? '' : '.') + (lv === 0 ? ' ' + hintFor(pl) : ''), '', 0);
      await wait(900); if (!alive(tok)) return;
      sfx.crack();
      var dst = SPOT[pl.to], catchAt = 0, decided = null, t0 = performance.now(), win = windows[lv];
      ball.style.display = 'block'; glove.style.display = 'block'; at(glove, dst[0], dst[1]);
      var flyMs = pl.kind === 'tag' ? 1500 : pl.kind === 'fly' || pl.kind === 'two' ? 1200 : pl.kind === 'wild' ? 700 : 800;
      var h = pl.kind === 'tag' || pl.kind === 'fly' || pl.kind === 'two' ? 14 : pl.kind === 'hit' ? 6 : 1;
      if (pl.kind === 'wild') fly(ball, [{ x: 50, y: 74, s: 1 }, { x: 46, y: 84, s: 1 }], flyMs); else fly(ball, arc(50, 72, dst[0], dst[1], h, 1, 1, 16), flyMs);
      go.disabled = false; stayB.disabled = false;
      var bar = timerBar(win);
      if (pl.kind === 'tag' || pl.kind === 'fly' || pl.kind === 'liner') catchAt = flyMs;
      if (pl.kind === 'hit') { csig.style.display = 'flex'; var cb = G.on === 2 ? [16, 64] : G.on === 3 ? [50, 80] : [82, 64]; at(csig, cb[0], cb[1]); csig.querySelector('img').src = IMG + 'games/' + (pl.coach === 'wave' ? 'send' : 'signs') + '.png'; csig.querySelector('span').textContent = pl.coach === 'wave' ? 'Waving you on!' : 'Hands up: STOP'; }
      if (catchAt) G.timers.push(setTimeout(function () { if (alive(tok)) { sfx.pop(); callout(pl.kind === 'liner' || pl.kind === 'fly' ? 'CAUGHT!' : 'CAUGHT!', '', pl.kind === 'tag' ? 'Tag up now?' : ''); } }, catchAt));
      var res = await new Promise(function (resolve) {
        go.onclick = function () { resolve({ a: 'go', t: performance.now() - t0 }); };
        stayB.onclick = function () { resolve({ a: 'stay', t: performance.now() - t0 }); };
        G.timers.push(setTimeout(function () { resolve({ a: 'none', t: win }); }, Math.max(win, catchAt + 900)));
      });
      if (!alive(tok)) return;
      bar.remove(); go.disabled = true; stayB.disabled = true;
      var a = res.a === 'none' ? 'stay' : res.a, ok, adv = 0;
      if (pl.kind === 'tag') { ok = a === 'go' && res.t >= catchAt; adv = ok ? 1 : 0; if (a === 'go' && res.t < catchAt) pl.why = 'You left before he caught it! On a tag-up you have to wait for the catch, then run.'; else if (!ok) pl.why = 'He caught a deep fly ball. You should tag up and run once it’s caught.'; else pl.why = 'Perfect tag-up! You waited for the catch, then ran.'; }
      else if (pl.kind === 'hit') { ok = a === 'go'; adv = ok ? (pl.coach === 'wave' ? 2 : 1) : 0; pl.why = ok ? (pl.coach === 'wave' ? 'The coach waved you around, so you kept going. Two bases!' : 'Coach put his hands up, so you stopped at the next base. Smart.') : 'That was a base hit! On a hit you run, then watch the coach.'; }
      else { ok = a === pl.ans; adv = ok && pl.ans === 'go' ? 1 : 0; }
      ball.style.display = 'none'; glove.style.display = 'none';
      if (ok) {
        G.reads++; sfx.good(); learn(pl.lesson);
        coach('<b>Good read!</b> ' + esc(pl.why), 'good', 3000);
        for (var i = 0; i < adv; i++) { await runTo(G.on + 1); if (G.on === 4) break; }
        csig.style.display = 'none';
        if (G.on >= 4) { G.runs++; fireworks(world, BASE[0][0], BASE[0][1] - 4, 24); sfx.cheer(); callout('RUN SCORES!', 'gold'); G.on = RI(1, 3); await wait(900); place(G.on); }
      } else {
        G.outs++; sfx.bad(); csig.style.display = 'none';
        var stamp = el('div', 'outstamp', 'OUT'); at(stamp, parseFloat(runner.style.left), parseFloat(runner.style.top) - 6); world.appendChild(stamp); setTimeout(function () { stamp.remove(); }, 1500);
        coach('<b>' + (a === 'go' ? 'Ran into an out.' : 'Missed your chance.') + '</b> ' + esc(pl.why), 'bad', 4200); learn(pl.lesson);
        await wait(1500); G.on = RI(1, 3); place(G.on);
      }
      hud();
      if (G.outs >= G.maxOuts) return finish(G.runs, Math.min(60, G.runs * 8 + G.reads * 2), G.runs + ' run' + (G.runs === 1 ? '' : 's') + ' scored', [G.reads + ' good reads']);
      G.ctrl.innerHTML = '<button class="bigbtn wood" id="nx">Next play</button>'; document.getElementById('nx').onclick = play;
    }
    function hintFor(pl) { return ({ tag: 'Tip: go back to the bag first.', fly: 'Tip: is it deep or shallow?', liner: 'Tip: line drives get caught.', two: 'Tip: how many outs?', ground: 'Tip: is it in front of you or behind you?', force: 'Tip: the batter is running to first.', hit: 'Tip: watch the coach.', wild: 'Tip: where’s the ball?' })[pl.kind] || ''; }
    function runTo(b) {
      var from = BASE[G.on], to = BASE[b > 3 ? 4 : b];
      runner.firstChild.style.transform = to[0] < from[0] ? 'scaleX(-1)' : '';
      var a = runner.animate([{ left: from[0] + '%', top: (from[1] + 1) + '%' }, { left: to[0] + '%', top: (to[1] + 1) + '%' }], { duration: 650, fill: 'forwards', easing: 'ease-in-out' });
      var steps = setInterval(sfx.step, 110); G.timers.push(setTimeout(function () { clearInterval(steps); }, 650));
      G.on = b; return a.finished.then(function () { at(runner, to[0], to[1] + 1); a.cancel(); });
    }
    G.ctrl.innerHTML = '<button class="bigbtn wood" id="nx">Play ball!</button>'; document.getElementById('nx').onclick = play;
    G.sitOuts = 0; hud();
    coach('You’re the runner. Read each ball, then tap <b>GO</b> or <b>STAY</b> before time runs out.', '', 4200);
  }

  /* =========================================================
     3. GOLD GLOVE: infield view. Get in front of it, then the right throw.
     ========================================================= */
  function glove(lv) {
    var st = stage('bg-field.jpg'), tok = G.tok;
    G.n = 0; G.total = lv === 3 ? 9999 : [10, 10, 12, 12][lv]; G.outsMade = 0; G.errors = 0; G.maxErr = [99, 99, 3, 1][lv];
    var fielder = sprite('fielder.png', 62, 93, 26); var fx = 62;
    var POS = [{ k: 'SS', n: 'Shortstop', num: 6, home: 64, lo: 44, hi: 86 }, { k: '2B', n: 'Second base', num: 4, home: 36, lo: 14, hi: 56 }], pos = POS[0];
    var ball = el('div', 'ball'); ball.style.display = 'none'; st.appendChild(ball);
    var shadow = el('div', 'shadow'); shadow.style.cssText += ';width:6%;height:2%;display:none'; st.appendChild(shadow);
    var BP = { 1: [9, 52], 2: [50, 99], 3: [91, 52], 4: [49, 39.5] };
    function hud(sit) { G.hud.innerHTML = '<div class="sbx"><span class="k"><small>Outs made</small><b>' + G.outsMade + '</b></span>' + (G.maxErr < 99 ? '<span class="k"><small>Errors</small>' + dots(G.errors, G.maxErr, 'o') + '</span>' : '') + '</div><div class="chipz"><span class="mph">You: ' + pos.n + ' (' + pos.num + ')</span>' + (sit ? '<span>' + sit.o + ' out' + (sit.o === 1 ? '' : 's') + '</span><span>' + runText(sit.r) + '</span>' : '') + '</div>'; }
    function runText(r) { var n = [1, 2, 3].filter(function (b) { return r[b - 1]; }); return n.length ? (n.length === 3 ? 'Bases loaded' : 'Runner' + (n.length > 1 ? 's' : '') + ' on ' + n.map(function (b) { return ['1st', '2nd', '3rd'][b - 1]; }).join(' & ')) : 'Nobody on'; }
    function answer(sit) {
      var r = sit.r, o = sit.o;
      if (o === 2) return [r[0] ? 2 : 1, r[0] ? 'Two outs and a force at second: take the short, easy throw for the third out. (First is OK too.)' : 'Two outs: just get the sure out at first.', r[0] ? [1, 2] : [1]];
      if (r[0] && r[1] && r[2]) return [4, 'Bases loaded, less than two outs: get the force at home and stop the run.', [4]];
      if (r[0]) return [2, 'Runner on first, less than two outs: start the double play at second' + (pos.k === '2B' ? '. Flip it to the shortstop covering the bag.' : '. Feed the second baseman covering the bag.'), [2]];
      if (r[2] && sit.inf) return [4, 'Infield is playing in with a runner on third: throw home to stop the run.', [4]];
      return [1, r[1] || r[2] ? 'No force at second. Look the runner back, then get the out at first.' : 'Nobody on: get the sure out at first.', [1]];
    }
    var reach = [12, 10, 8, 7][lv];
    st.addEventListener('pointermove', move); st.addEventListener('pointerdown', move);
    function move(e) { if (G.frozen) return; var r = st.getBoundingClientRect(); G.want = Math.max(10, Math.min(90, (e.clientX - r.left) / r.width * 100)); }
    G.want = 62;
    function loop() { if (!G || G.over) return; if (G.frozen) { G.raf = requestAnimationFrame(loop); return; } var d = G.want - fx, sp = [1.3, 1.5, 1.7, 1.9][lv]; fx += Math.max(-sp, Math.min(sp, d)); fielder.style.left = fx + '%'; G.raf = requestAnimationFrame(loop); }
    loop();
    async function grounder() {
      if (G.over) return;
      pos = POS[Math.floor(G.n / 3) % 2];
      if (G.n % 3 === 0) { G.frozen = true; fielder.animate([{ left: fx + '%' }, { left: pos.home + '%' }], { duration: 500, easing: 'ease-in-out' }); fx = pos.home; G.want = fx; fielder.style.left = fx + '%'; await wait(520); G.frozen = false; callout(pos.n.toUpperCase(), 'gold', 'You’re at ' + pos.n.toLowerCase() + ' (' + pos.num + ')'); await wait(900); if (!alive(tok)) return; }
      var sit = { r: [Math.random() < .45, Math.random() < .3, Math.random() < .25], o: RI(0, 2) }; sit.inf = sit.r[2] && sit.o < 2 && Math.random() < .5;
      hud(sit); G.ctrl.innerHTML = '<p class="hint">Slide your finger to get in front of the ball</p>';
      coach('<b>' + sit.o + ' out' + (sit.o === 1 ? '' : 's') + ', ' + runText(sit.r).toLowerCase() + (sit.inf ? ', infield in' : '') + '.</b> Know where you’re throwing before the pitch.', '', lv === 0 ? 2600 : 1800);
      await wait(lv === 0 ? 2200 : 1500); if (!alive(tok)) return;
      sfx.crack();
      var tx = R(pos.lo, pos.hi), dur = R(1500, 1900) * [1.15, .95, .8, .7][lv], hops = lv === 0 ? 2 : RI(2, 4);
      ball.style.display = 'block'; shadow.style.display = 'block';
      var pts = [], n = 24;
      for (var i = 0; i <= n; i++) { var t = i / n, x = 49 + (tx - 49) * t, y = 41 + (88 - 41) * t, hop = Math.abs(Math.sin(t * Math.PI * hops)) * (6 - t * 4); pts.push({ x: x, y: y - hop, s: .5 + t * 1.1 }); }
      fly(shadow, pts.map(function (p, i) { var t = i / n; return { x: p.x, y: 41 + (88 - 41) * t, s: .5 + t * 1.1 }; }), dur);
      await fly(ball, pts, dur); if (!alive(tok)) return;
      shadow.style.display = 'none';
      if (Math.abs(fx - tx) <= reach) {
        sfx.pop(); ball.style.display = 'none'; callout('GOT IT!', 'gold');
        await throwPick(sit);
      } else {
        ball.style.display = 'none'; G.errors++; sfx.bad(); callout('THROUGH!', 'bad', 'Base hit');
        coach('Get your feet moving as soon as the ball is hit. <b>Get in front of it</b>, glove down.', 'bad'); learn('Move your feet first and get your body in front of the ground ball.');
      }
      G.n++; hud(sit);
      if (G.errors >= G.maxErr || G.n >= G.total) return setTimeout(function () { finish(G.outsMade, Math.min(60, G.outsMade * 5), G.outsMade + ' out' + (G.outsMade === 1 ? '' : 's') + ' made', [G.errors + ' error' + (G.errors === 1 ? '' : 's')]); }, 1200);
      G.ctrl.innerHTML = '<button class="bigbtn wood" id="nx">Next grounder</button>'; document.getElementById('nx').onclick = grounder;
    }
    async function throwPick(sit) {
      var ans = answer(sit), win = [5000, 3500, 2600, 2000][lv];
      G.frozen = true;
      G.ctrl.innerHTML = '<div class="bases">' + [[1, '1st'], [2, '2nd'], [4, 'Home'], [3, '3rd']].map(function (b) { return '<button data-b="' + b[0] + '"><i></i>' + b[1] + '</button>'; }).join('') + '</div>';
      coach('Where’s the throw?', '', 0); var bar = timerBar(win);
      var pickB = await new Promise(function (res) { G.ctrl.querySelectorAll('[data-b]').forEach(function (b) { b.onclick = function () { res(+b.getAttribute('data-b')); }; }); G.timers.push(setTimeout(function () { res(0); }, win)); });
      if (!alive(tok)) return; bar.remove();
      var ok = ans[2].indexOf(pickB) >= 0;
      G.ctrl.querySelectorAll('[data-b]').forEach(function (b) { var v = +b.getAttribute('data-b'); if (v === ans[0]) b.classList.add('ok'); else if (v === pickB) b.classList.add('no'); b.disabled = true; });
      if (pickB) { ball.style.display = 'block'; sfx.whoosh(); await fly(ball, arc(fx, 80, BP[pickB][0], BP[pickB][1], 8, 1.2, .7), 520); ball.style.display = 'none'; }
      if (ok) { G.outsMade++; sfx.good(); callout('OUT!', 'gold'); coach('<b>Right throw!</b> ' + esc(ans[1]), 'good', 3400); }
      else { G.errors += lv >= 2 ? 1 : 0; sfx.bad(); callout(pickB ? 'SAFE' : 'TOO SLOW', 'bad'); coach('<b>Throw to ' + ['', 'first', 'second', 'third', 'home'][ans[0]] + '.</b> ' + esc(ans[1]), 'bad', 4400); }
      learn(ans[1]);
      await wait(1200);
      G.want = fx; G.frozen = false;
    }
    G.ctrl.innerHTML = '<button class="bigbtn wood" id="nx">Play ball!</button>'; document.getElementById('nx').onclick = grounder; hud();
    coach('You’ll play <b>shortstop (6)</b> and <b>second base (4)</b>. <b>Slide your finger</b> to get in front of each grounder, then make the right throw.', '', 4200);
  }

  /* =========================================================
     4. ACE: catcher's view. Pitch selection + location + execution.
     ========================================================= */
  function ace(lv) {
    var st = stage('bg-bat.jpg'), tok = G.tok;
    G.bat = 0; G.totalBat = lv === 3 ? 9999 : [5, 6, 7, 7][lv]; G.outsMade = 0; G.ks = 0; G.reached = 0; G.maxReach = [99, 99, 3, 1][lv];
    var pitcher = sprite('p-set.png', 49.5, 52.6, 7.5);
    var batter = sprite('rb-stance.png', 22, 96, 23);
    var mitt = el('img', 'mitt'); mitt.src = IMG + 'glove.png'; mitt.alt = ''; st.appendChild(mitt); at(mitt, 49.5, 74);
    var ball = el('div', 'ball'); ball.style.display = 'none'; st.appendChild(ball);
    /* zone: 5x5 grid over the plate, middle 3x3 = strike zone */
    var Z = { x0: 34, y0: 58, w: 31, h: 22 };
    var zone = el('div', 'zone off'); zone.style.cssText = 'left:' + Z.x0 + '%;top:' + Z.y0 + '%;width:' + Z.w + '%;height:' + Z.h + '%';
    for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) { var b = el('button', (r > 0 && r < 4 && c > 0 && c < 4) ? 'in' : ((r === 0 || r === 4) && (c === 0 || c === 4)) ? 'edge' : 'out'); b.setAttribute('data-z', r + ',' + c); b.setAttribute('aria-label', (r > 0 && r < 4 && c > 0 && c < 4 ? 'Strike zone ' : 'Off the plate ') + ['high', 'up', 'middle', 'down', 'low'][r] + ' ' + ['far inside', 'inside', 'middle', 'outside', 'far outside'][c]); zone.appendChild(b); }
    st.appendChild(zone);
    var types = lv >= 1 ? [['FB', 'Fastball', 'Fast and straight'], ['CH', 'Changeup', 'Slow, looks fast'], ['CB', 'Curveball', 'Drops down']] : [['FB', 'Fastball', 'Fast and straight'], ['CH', 'Changeup', 'Slow, looks fast']];
    var B = null;
    function newBatter() {
      B = { b: 0, s: 0, last: [], seen: {}, type: pick(['sitFB', 'chaser', 'patient', 'pull']) };
      var scout = { sitFB: 'This hitter is <b>sitting on fastballs</b>. Make him wait on a changeup.', chaser: 'This hitter <b>chases pitches up and down</b>. When you’re ahead, make him chase.', patient: 'This hitter is <b>patient</b>. Throw strikes early to get ahead.', pull: 'This hitter <b>pulls everything inside</b>. Work him on the outside corner.' }[B.type];
      coach('<b>Batter ' + (G.bat + 1) + '.</b> ' + scout, '', 4600);
    }
    function hud() { G.hud.innerHTML = '<div class="sbx"><span class="k"><small>Count</small><b>' + B.b + '-' + B.s + '</b></span><span class="k"><small>Outs</small><b>' + G.outsMade + '</b></span><span class="k"><small>K</small><b>' + G.ks + '</b></span></div><div class="chipz"><span>Batter ' + (G.bat + 1) + (G.totalBat < 999 ? ' of ' + G.totalBat : '') + '</span>' + (G.maxReach < 99 ? '<span>On base ' + G.reached + '/' + G.maxReach + '</span>' : '') + '</div>'; }
    var choice = null, target = null;
    function pickPhase() {
      if (G.over) return; hud(); zone.classList.add('off'); choice = null; target = null;
      G.ctrl.innerHTML = '<div class="pitchpick">' + types.map(function (t) { return '<button data-p="' + t[0] + '">' + t[1] + '<small>' + t[2] + '</small></button>'; }).join('') + '</div>';
      if (lv <= 1) { var tip = countTip(); if (tip) G.timers.push(setTimeout(function () { coach(tip, '', 3800); }, 300)); }
      G.ctrl.querySelectorAll('[data-p]').forEach(function (b) { b.onclick = function () { sfx.tap(); choice = b.getAttribute('data-p'); G.ctrl.querySelectorAll('[data-p]').forEach(function (x) { x.classList.toggle('sel', x === b); }); zone.classList.remove('off'); G.ctrl.insertAdjacentHTML('beforeend', ''); coach('Now tap <b>where</b> you want it.', '', 2000); }; });
    }
    function countTip() {
      if (B.b === 3) return '<b>' + B.b + '-' + B.s + ':</b> you have to throw a strike. Fastball over the plate.';
      if (B.s === 2 && B.b < 2) return '<b>' + B.b + '-' + B.s + ':</b> you’re ahead. You don’t need a strike. Try just off the plate or in the dirt.';
      if (B.b === 0 && B.s === 0) return 'First pitch: <b>get strike one</b>. Hitters who get behind 0-1 do a lot worse.';
      if (B.last.length >= 2 && B.last[B.last.length - 1] === B.last[B.last.length - 2]) return 'He’s seen that pitch twice in a row. <b>Change speeds</b>.';
      return '';
    }
    zone.addEventListener('click', function (e) { var b = e.target.closest('[data-z]'); if (!b || !choice) return; sfx.tap(); zone.querySelectorAll('.sel').forEach(function (x) { x.classList.remove('sel'); }); b.classList.add('sel'); var rc = b.getAttribute('data-z').split(','); target = { r: +rc[0], c: +rc[1] }; meterPhase(); });
    function cellXY(r, c) { return { x: Z.x0 + (c + .5) * Z.w / 5, y: Z.y0 + (r + .5) * Z.h / 5 }; }
    async function meterPhase() {
      zone.classList.add('off'); coachOff();
      G.ctrl.innerHTML = '<button class="bigbtn" id="rel">Release!</button>';
      var m = el('div', 'meter', '<i></i>'); st.appendChild(m); var needle = m.firstChild, t0 = performance.now(), per = [1500, 1200, 950, 800][lv], green = [.2, .14, .09, .07][lv];
      m.style.background = 'linear-gradient(90deg,#b8432f 0,#e8a21c ' + (50 - green * 100 - 12) + '%,#5cc46a ' + (50 - green * 100) + '%,#5cc46a ' + (50 + green * 100) + '%,#e8a21c ' + (50 + green * 100 + 12) + '%,#b8432f 100%)';
      var v = 0; (function tick() { if (!m.isConnected) return; var t = ((performance.now() - t0) % per) / per; v = t < .5 ? t * 2 : 2 - t * 2; needle.style.left = v * 100 + '%'; G.raf = requestAnimationFrame(tick); })();
      var miss = await new Promise(function (res) { document.getElementById('rel').onclick = function () { res(Math.abs(v - .5)); }; G.timers.push(setTimeout(function () { res(.5); }, 6000)); });
      cancelAnimationFrame(G.raf); m.remove(); if (!alive(tok)) return;
      var err = miss <= green ? 0 : miss <= green + .12 ? 1 : 2;
      var r = target.r, c = target.c;
      if (err) { var dr = RI(-err, err), dc = RI(-err, err); if (!dr && !dc) dr = err; r = Math.max(0, Math.min(4, r + dr)); c = Math.max(0, Math.min(4, c + dc)); }
      if (err === 1 && Math.random() < .5) { r = Math.max(1, Math.min(3, r)); c = Math.max(1, Math.min(3, c)); }
      await deliver({ r: r, c: c }, err);
    }
    async function deliver(loc, err) {
      G.ctrl.innerHTML = '';
      setSprite(pitcher, 'p-kick.png'); await wait(420); setSprite(pitcher, 'p-release.png'); if (!alive(tok)) return;
      var p = cellXY(loc.r, loc.c), dur = choice === 'FB' ? 520 : choice === 'CH' ? 820 : 720;
      ball.style.display = 'block'; at(mitt, p.x, p.y);
      var path = choice === 'CB' ? [{ x: 49.5, y: 49, s: .35 }, { x: 50, y: 54, s: .55 }, { x: p.x, y: p.y - 6, s: 1.1 }, { x: p.x, y: p.y, s: 1.4 }] : [{ x: 49.5, y: 49, s: .35 }, { x: p.x, y: p.y, s: 1.4 }];
      var inZ = loc.r > 0 && loc.r < 4 && loc.c > 0 && loc.c < 4, middle = loc.r === 2 && loc.c === 2;
      /* batter decision */
      var lastSame = B.last.length && B.last[B.last.length - 1] === choice, swingP = inZ ? .62 : .26;
      if (B.type === 'chaser' && !inZ && (loc.r === 0 || loc.r === 4)) swingP += .32;
      if (B.type === 'patient') swingP -= inZ ? .1 : .18;
      if (B.s === 2) swingP += inZ ? .3 : .16;
      if (B.b === 3 && !inZ) swingP -= .15;
      swingP += lv * .03;
      var swing = Math.random() < swingP;
      var contact = 0;
      if (swing) {
        contact = inZ ? .62 : .26;
        if (middle) contact += .22;
        if (choice === 'CH' && B.last.indexOf('FB') >= 0) contact -= .24;
        if (B.type === 'sitFB' && choice === 'FB') contact += .2;
        if (B.type === 'sitFB' && choice === 'CH') contact -= .18;
        if (B.type === 'pull' && loc.c <= 1) contact += .2;
        if (B.type === 'pull' && loc.c >= 3) contact -= .2;
        if (lastSame && B.last.length >= 2 && B.last[B.last.length - 2] === choice) contact += .18;
        if (choice === 'CB' && loc.r >= 3) contact -= .16;
        contact += lv * .04;
      }
      setTimeout(function () { setSprite(pitcher, 'p-set.png'); }, 500);
      await fly(ball, path, dur, choice === 'CB' ? 'cubic-bezier(.4,0,.8,.6)' : 'linear'); if (!alive(tok)) return;
      B.last.push(choice);
      if (swing) { setSprite(batter, 'rb-contact.png'); setTimeout(function () { setSprite(batter, 'rb-finish.png'); }, 130); }
      var outcome;
      if (!swing) { outcome = inZ ? 'strike' : 'ball'; sfx.pop(); }
      else {
        var r = Math.random();
        if (r > contact) outcome = 'whiff';
        else if (r > contact * .55) outcome = 'foul';
        else outcome = Math.random() < (middle ? .55 : .3) + lv * .03 ? 'hit' : 'out';
        if (outcome !== 'whiff') sfx.crack(); else sfx.pop();
      }
      await resolve(outcome, inZ, middle, err, loc);
    }
    async function resolve(o, inZ, middle, err, loc) {
      var tip = '';
      if (o === 'strike') { B.s++; callout('STRIKE!', 'gold', 'Looking'); }
      else if (o === 'ball') { B.b++; callout('BALL', 'bad'); if (err) tip = 'You missed your spot. Smooth, same release every time.'; else if (B.b === 3) tip = 'Three balls. Next one has to be a strike.'; }
      else if (o === 'whiff') { B.s = Math.min(3, B.s + 1); callout('SWING AND A MISS!', 'gold'); if (choice === 'CH') { tip = 'The changeup fooled him. <b>Changing speeds</b> beats hitters.'; learn('A changeup after fastballs throws off a hitter’s timing.'); } }
      else if (o === 'foul') { if (B.s < 2) B.s++; callout('FOUL', ''); }
      ball.style.display = 'none';
      if (o === 'hit' || o === 'out') {
        var ex = R(15, 85);
        var lp = cellXY(loc.r, loc.c); ball.style.display = 'block'; await fly(ball, arc(lp.x, lp.y, ex, R(28, 46), o === 'hit' ? 22 : 30, 1.3, .3), 900); ball.style.display = 'none';
        if (o === 'out') { G.outsMade++; sfx.good(); callout(pick(['FLY OUT', 'GROUNDOUT', 'POP OUT']), 'gold'); tip = 'Weak contact. That’s a win. <b>Let your defense work.</b>'; }
        else { G.reached++; sfx.bad(); callout('BASE HIT', 'bad'); tip = middle ? 'That one caught the <b>middle of the plate</b>. Hit the corners.' : B.last.length >= 3 && B.last.slice(-3).every(function (x) { return x === B.last[B.last.length - 1]; }) ? 'Same pitch three times. He timed it. <b>Mix it up.</b>' : 'He got one. Shake it off. Next batter.'; if (middle) learn('Pitches down the middle get hit hard. Aim for the corners.'); }
        return endAB(tip);
      }
      if (B.s >= 3) { G.outsMade++; G.ks++; sfx.cheer(); callout('STRIKEOUT!', 'gold', 'K'); fireworks(st, 50, 40, 18); learn('Get ahead early, then make the hitter chase.'); return endAB(choice === 'CH' ? 'Struck him out with the changeup!' : 'Strike three!'); }
      if (B.b >= 4) { G.reached++; sfx.bad(); callout('BALL FOUR', 'bad', 'Walk'); learn('Walks hurt. With three balls, throw a strike.'); return endAB('A walk is a free base. <b>Throw strikes when you’re behind.</b>'); }
      if (tip) coach(tip, o === 'ball' ? 'bad' : 'good', 3000);
      setSprite(batter, 'rb-stance.png'); at(mitt, 49.5, 74);
      await wait(700); pickPhase();
    }
    async function endAB(tip) {
      coach(tip, '', 3200); hud(); await wait(1500); if (!alive(tok)) return;
      G.bat++; setSprite(batter, 'rb-stance.png'); at(mitt, 49.5, 74);
      if (G.reached >= G.maxReach || G.bat >= G.totalBat) return finish(G.outsMade, Math.min(70, G.outsMade * 6 + G.ks * 4), G.outsMade + ' outs · ' + G.ks + ' strikeout' + (G.ks === 1 ? '' : 's'), [G.reached + ' reached base']);
      newBatter(); pickPhase();
    }
    newBatter(); pickPhase();
  }

  /* =========================================================
     5. CAN OF CORN: outfield view. Read the fly ball, then hit the cutoff.
     ========================================================= */
  function corn(lv) {
    var st = stage('bg-of.jpg'), tok = G.tok;
    G.n = 0; G.total = lv === 3 ? 9999 : [8, 8, 10, 10][lv]; G.catches = 0; G.drops = 0; G.maxDrop = [99, 99, 3, 1][lv]; G.throws = 0;
    var of = sprite('outfielder.png', 50, 94, 17); var fx = 50, fy = 94; G.want = { x: 50, y: 94 };
    var ball = el('div', 'ball'); ball.style.display = 'none'; st.appendChild(ball);
    var shadow = el('div', 'shadow'); shadow.style.cssText += ';width:8%;height:2.6%;display:none'; st.appendChild(shadow);
    var mark = el('div', 'target'); mark.style.display = 'none'; st.appendChild(mark);
    function hud() { G.hud.innerHTML = '<div class="sbx"><span class="k"><small>Catches</small><b>' + G.catches + '</b></span>' + (G.maxDrop < 99 ? '<span class="k"><small>Drops</small>' + dots(G.drops, G.maxDrop, 'o') + '</span>' : '') + '</div><div class="chipz"><span>Ball ' + (G.n + 1) + (G.total < 999 ? ' of ' + G.total : '') + '</span></div>'; }
    function move(e) { if (G.frozen) return; var r = st.getBoundingClientRect(); G.want = { x: Math.max(8, Math.min(92, (e.clientX - r.left) / r.width * 100)), y: Math.max(58, Math.min(96, (e.clientY - r.top) / r.height * 100 + 8)) }; }
    st.addEventListener('pointermove', move); st.addEventListener('pointerdown', move);
    var spd = [.55, .55, .5, .48][lv];
    function loop() {
      if (!G || G.over) return;
      if (G.frozen) { G.raf = requestAnimationFrame(loop); return; }
      var dx = G.want.x - fx, dy = G.want.y - fy, d = Math.hypot(dx, dy);
      if (d > .3) { var k = Math.min(1, spd / d); fx += dx * k; fy += dy * k; of.firstChild.style.transform = dx > 0 ? 'scaleX(-1)' : ''; }
      var sc = .7 + (fy - 58) / 38 * .3; of.style.left = fx + '%'; of.style.top = fy + '%'; of.style.width = 17 * sc + '%';
      G.raf = requestAnimationFrame(loop);
    }
    loop();
    async function flyBall() {
      if (G.over) return; hud(); G.ctrl.innerHTML = '<p class="hint">Drag to run to the ball</p>';
      var lx = R(14, 86), ly = R(62, 90), dur = R(2600, 3200) * [1.15, 1, .84, .74][lv];
      var kind = ly < 70 ? 'shallow' : ly > 84 ? 'deep' : 'medium';
      await wait(600); if (!alive(tok)) return; sfx.crack();
      ball.style.display = 'block'; shadow.style.display = 'none';
      if (lv === 0) { mark.style.display = 'block'; at(mark, lx, ly); }
      var n = 30, pts = []; for (var i = 0; i <= n; i++) { var t = i / n; pts.push({ x: 49 + (lx - 49) * t, y: (45 + (ly - 45) * t) - 70 * 4 * t * (1 - t) * (ly > 80 ? 1 : .85), s: .3 + t * 1.3 }); }
      var showAt = [0, 0, .45, .55][lv];
      G.timers.push(setTimeout(function () { if (!alive(tok)) return; shadow.style.display = 'block'; var rest = dur * (1 - showAt); fly(shadow, [{ x: 49 + (lx - 49) * showAt, y: 45 + (ly - 45) * showAt, s: .6 }, { x: lx, y: ly, s: 1.3 }], rest); }, dur * showAt));
      if (lv <= 1) G.timers.push(setTimeout(function () { if (alive(tok)) coach(kind === 'deep' ? 'It’s carrying! <b>Turn and run back</b> first. Don’t backpedal.' : kind === 'shallow' ? 'It’s dying in front of you. <b>Charge in!</b>' : 'Watch the shadow. <b>Get under it</b> and catch it in front of your face.', '', 2200); }, 420));
      await fly(ball, pts, dur, 'cubic-bezier(.3,.1,.6,1)'); if (!alive(tok)) return;
      shadow.style.display = 'none'; mark.style.display = 'none';
      var dist = Math.hypot(fx - lx, (fy - 3 - ly) * .7), rad = [11, 9, 6.2, 5.2][lv], caught = dist <= rad, bobble = false;
      if (caught && lv >= 2 && dist > rad * .7 && Math.random() < .55) { caught = false; bobble = true; }
      ball.style.display = 'none'; G.n++; G.frozen = true; G.want = { x: fx, y: fy };
      if (caught) {
        G.catches++; sfx.pop(); callout('CAN OF CORN!', 'gold');
        if (kind === 'deep') learn('On a ball over your head, turn and run. Don’t backpedal.');
        if (kind === 'shallow') learn('On a ball in front of you, charge it hard.');
        await afterCatch();
      } else {
        G.drops++; sfx.bad(); callout(bobble ? 'OFF THE GLOVE!' : 'IT DROPS!', 'bad', bobble ? 'Catch it in the middle of your glove' : 'Base hit');
        if (bobble) { coach('You got there, but it hit the <b>edge of your glove</b>. Get all the way under it, then catch it with two hands.', 'bad', 3200); learn('Get under the ball and catch it with two hands, not on the run at the edge of your glove.'); } else coach(kind === 'deep' ? 'That one was <b>over your head</b>. First step is back: turn and run.' : kind === 'shallow' ? 'That one was <b>in front of you</b>. Charge in fast.' : 'Read it off the bat and <b>run to the shadow</b>.', 'bad', 3200);
        await hitCutoff();
      }
      G.frozen = false; G.want = { x: fx, y: fy }; hud();
      if (G.drops >= G.maxDrop || G.n >= G.total) return setTimeout(function () { finish(G.catches, Math.min(60, G.catches * 5 + G.throws * 3), G.catches + ' catch' + (G.catches === 1 ? '' : 'es'), [G.throws + ' right throw' + (G.throws === 1 ? '' : 's'), G.drops + ' dropped']); }, 1000);
      G.ctrl.innerHTML = '<button class="bigbtn wood" id="nx">Next fly ball</button>'; document.getElementById('nx').onclick = flyBall;
    }
    /* after a catch: tag-up throws */
    async function afterCatch() {
      var sit = pick([
        { s: 'Runner on third, 1 out. He’s tagging up!', a: 4, why: 'He’s trying to score. Throw home, through your cutoff man, so the run doesn’t score.' },
        { s: 'Runner on first, 1 out. He’s staying.', a: 2, why: 'Nobody’s running. Get the ball back to second base quickly so the runner can’t sneak an extra base.' },
        { s: 'Runner on second, nobody out. He’s tagging to third!', a: 3, why: 'He’s tagging up to third. Throw to third to try to get him.' },
        { s: 'Nobody on, 2 outs. That’s the third out!', a: 0, why: 'Three outs, inning over. Jog it in and flip it to the umpire. Great job.' }
      ]);
      if (sit.a === 0) { coach(sit.why, 'good', 2600); await wait(1600); return; }
      await throwChoice(sit.s, sit.a, sit.why);
    }
    async function hitCutoff() {
      var q = A.CUTS[RI(0, A.CUTS.length - 1)], base = +q[2];
      await throwChoice(q[0] + '. ' + (q[1].some(Boolean) ? 'Runner on ' + ['1st', '2nd', '3rd'].filter(function (_, i) { return q[1][i]; }).join(' & ') + '.' : 'Nobody on.') + ' Where’s the throw?', base, q[4] + ' (The cutoff is the ' + q[3] + '.)');
    }
    async function throwChoice(prompt, ans, why) {
      var win = [6000, 4500, 3500, 2800][lv];
      coach('<b>' + esc(prompt) + '</b>', '', 0);
      G.ctrl.innerHTML = '<div class="bases">' + [[1, '1st'], [2, '2nd'], [4, 'Home'], [3, '3rd']].map(function (b) { return '<button data-b="' + b[0] + '"><i></i>' + b[1] + '</button>'; }).join('') + '</div>';
      var bar = timerBar(win);
      var p = await new Promise(function (res) { G.ctrl.querySelectorAll('[data-b]').forEach(function (b) { b.onclick = function () { res(+b.getAttribute('data-b')); }; }); G.timers.push(setTimeout(function () { res(0); }, win)); });
      if (!alive(tok)) return; bar.remove();
      G.ctrl.querySelectorAll('[data-b]').forEach(function (b) { var v = +b.getAttribute('data-b'); if (v === ans) b.classList.add('ok'); else if (v === p) b.classList.add('no'); b.disabled = true; });
      var BP = { 1: [33, 44], 2: [49, 41.5], 3: [66, 44], 4: [49, 45] }, cut = function (b) { return { x: fx + (BP[b][0] - fx) * .5, y: (fy - 8) + (BP[b][1] - fy + 8) * .5 }; };
      var rel = 2;
      if (p) {
        /* release: stop the needle in the green. Longer throws have a smaller green zone. */
        var far = Math.hypot(BP[p][0] - fx, BP[p][1] - fy) / 60, green = Math.max(.05, [.2, .15, .1, .08][lv] - far * .05);
        coach('<b>Release!</b> Stop the needle in the green for a strong, accurate throw.', '', 0);
        G.ctrl.innerHTML = '<button class="bigbtn" id="rel">Throw!</button>';
        var m = el('div', 'meter', '<i></i>'); st.appendChild(m); var needle = m.firstChild, t0 = performance.now(), per = [1400, 1150, 950, 820][lv], v = 0;
        m.style.background = 'linear-gradient(90deg,#b8432f 0,#e8a21c ' + (50 - green * 100 - 14) + '%,#5cc46a ' + (50 - green * 100) + '%,#5cc46a ' + (50 + green * 100) + '%,#e8a21c ' + (50 + green * 100 + 14) + '%,#b8432f 100%)';
        (function tick() { if (!m.isConnected) return; var t = ((performance.now() - t0) % per) / per; v = t < .5 ? t * 2 : 2 - t * 2; needle.style.left = v * 100 + '%'; G.raf2 = requestAnimationFrame(tick); })();
        var miss = await new Promise(function (res) { document.getElementById('rel').onclick = function () { res(Math.abs(v - .5)); }; G.timers.push(setTimeout(function () { res(.5); }, 5000)); });
        cancelAnimationFrame(G.raf2); m.remove(); if (!alive(tok)) return;
        rel = miss <= green ? 0 : miss <= green + .14 ? 1 : 2;
        ball.style.display = 'block'; sfx.whoosh();
        if (rel === 0) await fly(ball, arc(fx, fy - 8, BP[p][0], BP[p][1], 10, 1.1, .35), 650);
        else if (rel === 1) { var cp = cut(p); await fly(ball, arc(fx, fy - 8, cp.x, cp.y, 6, 1.1, .6).concat(arc(cp.x, cp.y, BP[p][0], BP[p][1], 3, .6, .35, 6).slice(1)), 950); }
        else await fly(ball, arc(fx, fy - 8, BP[p][0] + pick([-14, 14]), BP[p][1] - 8, 24, 1.1, .3), 800);
        ball.style.display = 'none';
      }
      var relTxt = ['A strike right on the bag!', 'One hop through the cutoff man. Still a good throw.', 'Wild throw! It sailed over the cutoff man.'][rel];
      if (p === ans && rel < 2) { G.throws++; sfx.good(); callout(rel ? 'GOOD THROW' : 'ON THE BAG!', 'gold'); coach('<b>' + relTxt + '</b> ' + esc(why), 'good', 3800); }
      else if (p === ans) { sfx.bad(); callout('WILD THROW', 'bad'); coach('<b>Right base, but ' + relTxt.toLowerCase() + '</b> Hit your cutoff man chest-high and runners can’t move up.', 'bad', 4400); learn('Throw through your cutoff man, chest-high. A wild throw lets runners take extra bases.'); }
      else { sfx.bad(); coach('<b>The throw goes to ' + ['', 'first', 'second', 'third', 'home'][ans] + '.</b> ' + esc(why), 'bad', 4600); }
      learn(why.split('.')[0] + '.');
      await wait(1400);
    }
    hud(); G.ctrl.innerHTML = '<button class="bigbtn wood" id="nx">Play ball!</button>'; document.getElementById('nx').onclick = flyBall;
    coach('You’re in center field. <b>Drag</b> to run under each fly ball. Watch the shadow on the grass.', '', 4200);
  }

  /* ---------- taps ---------- */
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]'); if (!b) return;
    var a = b.getAttribute('data-a'); sfx.tap();
    if (a.indexOf('lv:') === 0) return start(+a.slice(3));
    if (a === 'levels') return levels();
    if (a === 'again') return start(G ? G.lv : 0);
  });

  /* ---------- go ---------- */
  key = new URLSearchParams(location.search).get('g');
  if (!GAMES[key]) { location.replace('./'); return; }
  document.title = GAMES[key].name + ' · Arcade';
  levels();
})();
