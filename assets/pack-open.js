/* Pack opening, v2: a real painted foil pack under the stadium lights. Swipe across the top and the
   strip peels back with light pouring out, the strip flies off, the cards shoot out of the pack into
   your hand, and you flip them. Cards shine and tilt as you move your finger or phone; the rarer the
   card, the bigger the glow. Big pulls get a short walkout. Replaces the app's pkRender() and uses
   the same pack (PK) and the same finish button (xpdone). */
(function () {
  if (typeof pkRender !== 'function') return;
  var IMG = '../assets/img/pack/', ac = null;
  var ART = { rookie: 'rookie', allstar: 'allstar', heat: 'heat', slam: 'slam', series: 'series', hof: 'hof', galaxy: 'galaxy', locker: 'locker' };

  /* ---------- sound ---------- */
  function A() { try { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); return ac; } catch (e) { return null; } }
  function muted() { try { return localStorage.getItem('bp-muted') === '1'; } catch (e) { return false; } }
  function tone(f, d, type, vol, slide, delay) {
    var c = A(); if (!c || muted()) return; var t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || .1, t + .015); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + .05);
  }
  function noise(d, vol, hp, delay) {
    var c = A(); if (!c || muted()) return; var t = c.currentTime + (delay || 0), n = Math.max(1, Math.floor(c.sampleRate * d)), b = c.createBuffer(1, n, c.sampleRate), x = b.getChannelData(0);
    for (var i = 0; i < n; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = b; f.type = 'highpass'; f.frequency.value = hp || 800; g.gain.value = vol || .2;
    s.connect(f); f.connect(g); g.connect(c.destination); s.start(t);
  }
  var SND = {
    drop: function () { tone(80, .45, 'sine', .3, 45); noise(.2, .1, 300); },
    crinkle: function (k) { noise(.05, .1 + k * .12, 2500 + Math.random() * 3000); },
    rip: function () { noise(.35, .4, 1500); tone(300, .35, 'sawtooth', .04, 1200); },
    boom: function () { tone(55, .8, 'sine', .5, 30); noise(.6, .25, 200); [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, 1.1, 'triangle', .05, 0, .04 + i * .035); }); },
    whoosh: function (i) { noise(.12, .12, 2200, i * .12); tone(600, .12, 'sine', .02, 1400, i * .12); },
    flip: function () { noise(.08, .14, 3000); tone(900, .12, 'triangle', .05, 1500); },
    chime: function (r) { var f = { C: 523, R: 587, A: 659, S: 784, L: 880 }[r] || 523; [1, 1.26, 1.5, 2].slice(0, r === 'C' ? 2 : 4).forEach(function (m, i) { tone(f * m, .4, 'triangle', .06, 0, i * .06); }); },
    beat: function () { [0, .45].forEach(function (d) { tone(55, .22, 'sine', .55, 38, d); tone(72, .18, 'sine', .3, 50, d + .14); }); },
    rise: function () { tone(150, 1.1, 'sawtooth', .035, 1200); noise(1.1, .05, 2500); },
    huge: function () { tone(40, 1.2, 'sine', .55, 25); noise(1, .3, 150); [392, 523, 659, 784, 1047, 1319, 1568].forEach(function (f, i) { tone(f, 1.8, 'triangle', .06, 0, i * .06); }); }
  };
  function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

  /* ---------- card info ---------- */
  function rar(c) { return CARD[c.id] ? CARD[c.id].r : 'C'; }
  function col(c) { var pc = c.par && c.par !== 'base' && PAR[c.par] ? PAR[c.par][3] : ''; var r = RAR[rar(c)]; return pc || (r ? r[1] : '#ffd35a'); }
  function big(c) { try { return isBig(c); } catch (e) { return false; } }
  function slam(c) { var b = CARD[c.id] || {}, o = []; if (b.r === 'L') o.push('LEGEND'); else if (b.r === 'S') o.push('SUPERSTAR'); if (c.auto) o.push('AUTO'); if (c.par === 'black') o.push('1 OF 1'); else if (c.par === 'red') o.push('RED /5'); return o.join(' · ') || 'BIG PULL'; }
  function tagOf(c) { var R = RAR[rar(c)]; return (R ? R[0] : '') + (c.par !== 'base' && PAR[c.par] ? ' · ' + PAR[c.par][0] : '') + (c.auto ? ' · Auto' : ''); }
  function holoLevel(c) { return Math.min(1, .12 + 'CRASL'.indexOf(rar(c)) * .2 + (c.par !== 'base' ? .25 : 0) + (c.auto ? .2 : 0)); }

  /* ---------- particles ---------- */
  function Fx(cv) {
    var x = cv.getContext('2d'), P = [], W = 0, H = 0, run = true;
    function size() { var d = Math.min(2, window.devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * d; cv.height = H * d; x.setTransform(d, 0, 0, d, 0, 0); }
    size(); window.addEventListener('resize', size);
    for (var i = 0; i < 40; i++) P.push({ k: 'm', x: Math.random(), y: Math.random(), r: .6 + Math.random() * 1.6, v: .0004 + Math.random() * .001, a: Math.random() * 6 });
    (function frame() {
      if (!run) return; x.clearRect(0, 0, W, H);
      for (var i = P.length - 1; i >= 0; i--) {
        var p = P[i];
        if (p.k === 'm') { p.y -= p.v; p.a += .03; if (p.y < -.02) { p.y = 1.02; p.x = Math.random(); } x.globalAlpha = .3 + Math.sin(p.a) * .25; x.fillStyle = '#ffe9b0'; x.beginPath(); x.arc(p.x * W, p.y * H, p.r, 0, 7); x.fill(); continue; }
        p.vy += p.g; p.vx *= .983; p.vy *= .983; p.x += p.vx; p.y += p.vy; p.life--; p.rot += p.vr;
        if (p.life <= 0 || p.y > H + 40) { P.splice(i, 1); continue; }
        x.globalAlpha = Math.min(1, p.life / 25); x.fillStyle = p.c;
        if (p.k === 's') { x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fill(); }
        else { x.save(); x.translate(p.x, p.y); x.rotate(p.rot); x.fillRect(-p.r, -p.r * .45, p.r * 2, p.r * .9); x.restore(); }
      }
      x.globalAlpha = 1; requestAnimationFrame(frame);
    })();
    return {
      burst: function (cx, cy, c, n, pw, up) { var cs = [c, '#fff', '#ffd35a', c]; for (var i = 0; i < n; i++) { var a = up ? -Math.PI / 2 + (Math.random() - .5) * 1.6 : Math.random() * 6.283, s = (2 + Math.random() * 9) * (pw || 1); P.push({ k: Math.random() < .6 ? 's' : 'c', x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, g: .17, r: 1.6 + Math.random() * 3.6, c: cs[i % 4], life: 50 + Math.random() * 60, rot: Math.random() * 6, vr: (Math.random() - .5) * .3 }); } },
      rain: function (c, n) { for (var i = 0; i < n; i++) P.push({ k: 'c', x: Math.random() * W, y: -20 - Math.random() * H * .4, vx: (Math.random() - .5) * 2, vy: 2 + Math.random() * 3, g: .04, r: 3 + Math.random() * 4, c: [c, '#ffd35a', '#fff', '#b57bff'][i % 4], life: 220, rot: Math.random() * 6, vr: (Math.random() - .5) * .2 }); },
      stop: function () { run = false; window.removeEventListener('resize', size); }
    };
  }

  /* ---------- tilt and shine follow your finger, or the phone's tilt ---------- */
  var tiltTargets = [];
  function aim(nx, ny) { tiltTargets.forEach(function (e) { e.style.setProperty('--mx', (50 + nx * 50) + '%'); e.style.setProperty('--my', (50 + ny * 50) + '%'); e.style.setProperty('--rx', (-ny * 14) + 'deg'); e.style.setProperty('--ry', (nx * 18) + 'deg'); }); }
  function onMove(e) { var t = e.touches ? e.touches[0] : e; if (!t) return; aim(t.clientX / innerWidth * 2 - 1, t.clientY / innerHeight * 2 - 1); }
  function onTilt(e) { if (e.gamma == null) return; aim(Math.max(-1, Math.min(1, e.gamma / 30)), Math.max(-1, Math.min(1, (e.beta - 40) / 30))); }

  var O = null, fx = null, st = null;
  function q(s) { return O.querySelector(s); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function flash(c) { var f = q('.pv-flash'); f.style.background = c || '#fff'; f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }
  function shake() { O.classList.remove('shake'); void O.offsetWidth; O.classList.add('shake'); }
  function box(e) { var r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, t: r.top }; }
  function glowColor() { return getComputedStyle(O).getPropertyValue('--glow').trim() || '#ffd35a'; }

  pkRender = function () {
    if (!PK) { if (O) { if (fx) fx.stop(); window.removeEventListener('pointermove', onMove); window.removeEventListener('deviceorientation', onTilt); O.remove(); O = null; st = null; tiltTargets = []; } document.body.classList.remove('lock'); return; }
    if (O && st && st.pk === PK) return;
    if (O) { if (fx) fx.stop(); O.remove(); }
    open();
  };

  function open() {
    var pk = PK.pk || PACKS[0], art = IMG + (ART[pk.k] || 'rookie') + '.webp', cards = PK.cards;
    var best = cards.reduce(function (m, c) { return Math.max(m, 'CRASL'.indexOf(rar(c))); }, 0), glow = (RAR['CRASL'[best]] || [0, '#ffd35a'])[1];
    st = { pk: PK, torn: false, open: cards.map(function () { return false; }), busy: false };
    document.body.classList.add('lock');
    O = document.createElement('div'); O.id = 'pko'; O.className = 'pv'; O.style.setProperty('--glow', glow);
    O.innerHTML = '<div class="pv-bg" style="background-image:url(' + IMG + 'stage.jpg)"></div><div class="pv-beams"><i></i><i></i><i></i></div><div class="pv-vig"></div>' +
      '<canvas class="pv-fx"></canvas><div class="pv-flash"></div>' +
      '<header class="pv-top"><span><b>' + esc(PK.name) + '</b><small>' + cards.length + ' card' + (cards.length === 1 ? '' : 's') + '</small></span><button class="pv-skip" type="button">Skip</button></header>' +
      '<div class="pv-stage"><div class="pv-pack"><div class="pv-tilt">' +
      '<div class="pv-light"></div><img class="pv-body" src="' + art + '" alt="' + esc(PK.name) + ' pack" draggable="false"><img class="pv-strip" src="' + art + '" alt="" draggable="false"><div class="pv-seam"></div><div class="pv-gloss"></div>' +
      '</div></div></div>' +
      '<div class="pv-hint"><span class="pv-finger"></span><b>Swipe across the top to rip it</b></div>' +
      '<div class="pv-hand"></div><div class="pv-zoom"></div><div class="pv-call"></div>' +
      '<footer class="pv-foot"><button class="pv-all" type="button">Flip all</button><button class="cta pv-done" data-a="xpdone">Add to my binder</button></footer>';
    document.body.appendChild(O);
    fx = Fx(q('.pv-fx'));
    tiltTargets = [q('.pv-tilt')];
    window.addEventListener('pointermove', onMove, { passive: true }); window.addEventListener('deviceorientation', onTilt);
    q('.pv-skip').addEventListener('click', skip); q('.pv-all').addEventListener('click', flipAll);
    requestAnimationFrame(function () { O.classList.add('in'); });
    setTimeout(function () { if (!O) return; SND.drop(); buzz(15); O.classList.add('landed'); }, 380);
    armTear();
  }

  /* ---------- tearing the strip ---------- */
  function armTear() {
    var pack = q('.pv-pack'), down = false, x0 = 0, prog = 0, taps = 0, lastSnd = 0;
    function set(p) {
      prog = Math.max(prog, Math.min(1, p));
      O.style.setProperty('--tear', prog.toFixed(3));
      if (performance.now() - lastSnd > 45) { SND.crinkle(prog); lastSnd = performance.now(); if (prog > .2) buzz(4); }
      if (prog >= 1) finish();
    }
    function pt(e) { var t = e.touches ? e.touches[0] : e; return t ? t.clientX : 0; }
    function dn(e) { if (st.torn) return; down = true; x0 = pt(e); }
    function mv(e) { if (!down || st.torn) return; var r = pack.getBoundingClientRect(); set(Math.abs(pt(e) - x0) / (r.width * .75)); if (e.cancelable) e.preventDefault(); }
    function up() { down = false; }
    pack.addEventListener('pointerdown', dn); window.addEventListener('pointermove', mv, { passive: false }); window.addEventListener('pointerup', up);
    pack.addEventListener('touchstart', dn, { passive: true }); window.addEventListener('touchmove', mv, { passive: false }); window.addEventListener('touchend', up);
    pack.addEventListener('click', function () { if (st.torn || prog > .05) return; taps++; set(taps / 2); });
    function finish() {
      if (st.torn) return; st.torn = true;
      window.removeEventListener('pointermove', mv); window.removeEventListener('touchmove', mv);
      burstOpen();
    }
  }

  async function burstOpen() {
    var r = box(q('.pv-pack'));
    SND.rip(); buzz([25, 30, 50]); O.classList.add('torn');
    await wait(260);
    SND.boom(); flash(glowColor()); shake();
    fx.burst(r.x, r.t + r.h * .1, glowColor(), 110, 1.1, true);
    O.classList.add('erupt');
    await wait(380);
    deal();
  }

  /* ---------- cards shoot out of the pack into a fanned hand ---------- */
  function fanPos(i, n) {
    var spread = Math.min(9, 34 / Math.max(1, n - 1)), a = n > 1 ? (i - (n - 1) / 2) * spread : 0;
    return { a: a, x: (i - (n - 1) / 2) * Math.min(58, 210 / Math.max(1, n)), y: Math.abs(a) * 1.6 };
  }
  async function deal() {
    var hand = q('.pv-hand'), n = PK.cards.length, pr = box(q('.pv-pack')), hr = hand.getBoundingClientRect();
    hand.innerHTML = PK.cards.map(function (c, i) {
      return '<button class="pv-card" type="button" data-i="' + i + '" style="--rc:' + col(c) + ';--h:' + holoLevel(c) + '" aria-label="Flip card ' + (i + 1) + '">' +
        '<span class="pv-flip"><span class="pv-back" style="background-image:url(' + IMG + 'card-back.jpg)"></span><span class="pv-front">' + tcard(c, 1) + '<i class="pv-holo"></i></span></span></button>';
    }).join('');
    var els = hand.querySelectorAll('.pv-card');
    els.forEach(function (e, i) {
      var f = fanPos(i, n), sx = pr.x - (hr.left + hr.width / 2), sy = pr.t + pr.h * .15 - (hr.top + hr.height / 2);
      e.style.setProperty('--fx', f.x + 'px'); e.style.setProperty('--fy', f.y + 'px'); e.style.setProperty('--fa', f.a + 'deg');
      e.animate([
        { transform: 'translate(' + sx + 'px,' + sy + 'px) scale(.35) rotate(0deg)', opacity: 0 },
        { transform: 'translate(' + (sx + f.x * .3) + 'px,' + (sy - 170 - i * 12) + 'px) scale(.75) rotate(' + (f.a * 2) + 'deg)', opacity: 1, offset: .45 },
        { transform: 'translate(' + f.x + 'px,' + f.y + 'px) rotate(' + f.a + 'deg)', opacity: 1 }
      ], { duration: 620, delay: i * 120, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'backwards' });
      SND.whoosh(i);
      e.addEventListener('click', function () { reveal(i); });
    });
    O.classList.add('dealt');
    await wait(n * 120 + 650);
    if (!O) return;
    O.classList.add('ready');
    if (!st.open.every(Boolean)) say('<b>Tap a card to flip it</b><small>or Flip all</small>');
  }
  function say(h, cls) { var c = q('.pv-call'); c.innerHTML = h; c.className = 'pv-call on ' + (cls || ''); }

  /* ---------- reveal one card: it jumps up big, flips, then drops back into your hand ---------- */
  async function reveal(i, quick) {
    if (st.busy || st.open[i] || !O.classList.contains('ready')) return; st.busy = true;
    var c = PK.cards[i], e = q('.pv-card[data-i="' + i + '"]'), color = col(c), zoom = q('.pv-zoom');
    st.open[i] = true;
    var clone = e.cloneNode(true); clone.className = 'pv-card pv-big'; clone.removeAttribute('style'); clone.style.setProperty('--rc', color); clone.style.setProperty('--h', holoLevel(c));
    zoom.innerHTML = ''; zoom.appendChild(clone); O.classList.add('zooming');
    tiltTargets = [clone];
    if (big(c) && !quick) {
      O.style.setProperty('--hot', color); O.classList.add('walkout');
      say('<b>Something big is coming…</b>', 'hush');
      SND.rise(); SND.beat(); clone.classList.add('charge'); buzz([20, 400, 20]);
      await wait(1150);
      clone.classList.remove('charge');
    }
    await wait(60);
    clone.classList.add('flip'); e.classList.add('flip');
    var r = box(clone);
    if (big(c)) {
      flash(color); shake(); SND.huge(); buzz([60, 30, 120]);
      fx.burst(r.x, r.y, color, 170, 1.5); fx.rain(color, 110);
      say('<span class="pv-slam" style="--hot:' + color + '">' + esc(slam(c)) + '</span><small>' + esc((CARD[c.id] || {}).n || '') + (typeof covr === 'function' ? ' · OVR ' + covr(c) : '') + '</small>', 'big');
    } else {
      SND.flip(); setTimeout(function () { SND.chime(rar(c)); }, 180);
      if (rar(c) !== 'C' || c.par !== 'base') fx.burst(r.x, r.y, color, 40, .8);
      say('<span class="pv-tag" style="--hot:' + color + '">' + esc(tagOf(c)) + '</span>');
    }
    await wait(quick ? 350 : big(c) ? 1700 : 700);
    if (!quick) await waitTap(big(c) ? 0 : 1100);
    if (!O) return;
    closeZoom(); st.busy = false;
    if (st.open.every(Boolean)) done(); else say('<b>' + st.open.filter(function (x) { return !x; }).length + ' to go</b><small>Tap a card</small>');
  }
  function waitTap(ms) {
    return new Promise(function (res) {
      var t = ms ? setTimeout(fin, ms) : null;
      function fin() { if (t) clearTimeout(t); if (O) O.removeEventListener('pointerdown', fin, true); res(); }
      setTimeout(function () { if (O) O.addEventListener('pointerdown', fin, true); }, 200);
      if (!ms) q('.pv-call').insertAdjacentHTML('beforeend', '<em>Tap to keep going</em>');
    });
  }
  function closeZoom() { var z = q('.pv-zoom'); O.classList.remove('zooming', 'walkout'); z.innerHTML = ''; tiltTargets = []; }

  async function flipAll() {
    if (st.busy || !O.classList.contains('ready')) return;
    q('.pv-all').disabled = true;
    for (var i = 0; i < PK.cards.length; i++) {
      if (!O) return;
      if (st.open[i]) continue;
      var c = PK.cards[i];
      if (big(c)) { await reveal(i, false); continue; }
      st.open[i] = true; var e = q('.pv-card[data-i="' + i + '"]'); e.classList.add('flip'); SND.flip(); setTimeout(SND.chime.bind(null, rar(c)), 120);
      var r = box(e); if (rar(c) !== 'C' || c.par !== 'base') fx.burst(r.x, r.y, col(c), 25, .6);
      await wait(240);
    }
    if (O && st.open.every(Boolean)) done();
  }
  function done() {
    var els = O.querySelectorAll('.pv-hand .pv-card'), n = els.length, per = n <= 3 ? n : n === 4 ? 2 : 3, W = Math.min(innerWidth, 480);
    var cw = Math.min(W * .3, 128), gap = 10;
    els.forEach(function (e, i) {
      var row = Math.floor(i / per), inRow = Math.min(per, n - row * per), col = i - row * per;
      e.style.setProperty('--fx', ((col - (inRow - 1) / 2) * (cw + gap)) + 'px');
      e.style.setProperty('--fy', (row * (cw * 1.4 + gap) - (Math.ceil(n / per) - 1) * (cw * 1.4 + gap) / 2) + 'px');
      e.style.setProperty('--fa', '0deg');
    });
    O.classList.add('finished'); say('<b>Here’s what you pulled</b><small>Drag or tilt your phone to see them shine</small>');
    tiltTargets = [].slice.call(O.querySelectorAll('.pv-hand .pv-card'));
    fx.rain('#ffd35a', 50);
  }
  function skip() {
    if (!st) return;
    if (!st.torn) {
      st.torn = true; O.classList.add('torn', 'erupt');
      deal().then(function () { if (!O) return; PK.cards.forEach(function (c, i) { st.open[i] = true; q('.pv-card[data-i="' + i + '"]').classList.add('flip'); }); done(); });
      return;
    }
    closeZoom(); st.busy = false;
    PK.cards.forEach(function (c, i) { st.open[i] = true; var e = q('.pv-card[data-i="' + i + '"]'); if (e) e.classList.add('flip'); });
    done();
  }
})();
