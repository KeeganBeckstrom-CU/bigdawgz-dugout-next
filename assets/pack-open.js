/* The pack opening: a night stadium under the lights, a pack that floats in, a swipe to rip it,
   a burst of light in the best card's color, then each card flips one at a time. Big pulls
   (Superstar, Legend, autographs, red and black parallels) get the full walkout: the lights
   go down, the card shakes and glows, then it explodes into view.
   Replaces the app's pkRender(); uses the same pack data (PK) and the same finish button (xpdone). */
(function () {
  if (typeof pkRender !== 'function') return;
  var IMG = '../assets/img/pack/', ac = null;
  function A() { try { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); return ac; } catch (e) { return null; } }
  function muted() { try { return localStorage.getItem('bp-muted') === '1'; } catch (e) { return false; } }
  function tone(f, d, type, vol, slide, delay) {
    var c = A(); if (!c || muted()) return; var t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || .1, t + .02); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + .05);
  }
  function noise(d, vol, hp, delay) {
    var c = A(); if (!c || muted()) return; var t = c.currentTime + (delay || 0), n = Math.floor(c.sampleRate * d), b = c.createBuffer(1, n, c.sampleRate), x = b.getChannelData(0);
    for (var i = 0; i < n; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = b; f.type = 'highpass'; f.frequency.value = hp || 800; g.gain.value = vol || .2;
    s.connect(f); f.connect(g); g.connect(c.destination); s.start(t);
  }
  var SND = {
    drop: function () { tone(90, .5, 'sine', .25, 45); noise(.25, .12, 300); },
    tear: function (k) { noise(.06, .14 + k * .1, 1800 + k * 1500); },
    rip: function () { noise(.5, .35, 1200); tone(220, .6, 'sawtooth', .05, 880); },
    boom: function () { tone(60, .9, 'sine', .45, 30); noise(.8, .3, 200); [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 1.4, 'triangle', .06, 0, .05 + i * .04); }); },
    deal: function (i) { noise(.08, .1, 3000, i * .09); },
    flip: function () { noise(.12, .14, 2500); tone(880, .15, 'triangle', .05, 1320); },
    beat: function (i) { tone(55, .25, 'sine', .5, 40, i * .62); tone(70, .2, 'sine', .3, 50, i * .62 + .16); },
    rise: function () { tone(110, 2.2, 'sawtooth', .04, 880); noise(2.2, .05, 2000); },
    huge: function () { tone(40, 1.4, 'sine', .55, 25); noise(1.2, .35, 150); [392, 523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, 2, 'triangle', .07, 0, i * .07); }); },
    nice: function (r) { var base = { C: 440, R: 523, A: 587 }[r] || 440; [1, 1.25, 1.5].forEach(function (m, i) { tone(base * m, .3, 'triangle', .07, 0, i * .07); }); }
  };
  function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }
  var R = function () { return typeof RAR !== 'undefined' ? RAR : {}; };
  function rarOf(c) { return CARD[c.id] ? CARD[c.id].r : 'C'; }
  function colorOf(c) { var r = R()[rarOf(c)]; var pc = c.par && c.par !== 'base' && PAR[c.par] ? PAR[c.par][3] : ''; return pc || (r ? r[1] : '#ffd35a'); }
  function big(c) { try { return isBig(c); } catch (e) { return false; } }
  function label(c) {
    var b = CARD[c.id] || {}, out = [];
    if (b.r === 'L') out.push('LEGEND'); else if (b.r === 'S') out.push('SUPERSTAR');
    if (c.auto) out.push('AUTOGRAPH'); if (c.par === 'black') out.push('ONE OF ONE'); else if (c.par === 'red') out.push('RED /5');
    return out.join(' · ') || 'BIG PULL';
  }

  /* --- sparkles and confetti on a canvas --- */
  function Fx(cv) {
    var x = cv.getContext('2d'), P = [], W = 0, H = 0, run = true;
    function size() { var d = Math.min(2, window.devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * d; cv.height = H * d; x.setTransform(d, 0, 0, d, 0, 0); }
    size(); window.addEventListener('resize', size);
    for (var i = 0; i < 46; i++) P.push({ k: 'mote', x: Math.random(), y: Math.random(), r: .6 + Math.random() * 1.8, v: .0004 + Math.random() * .0012, a: Math.random() * 6 });
    function frame() {
      if (!run) return; x.clearRect(0, 0, W, H);
      for (var i = P.length - 1; i >= 0; i--) {
        var p = P[i];
        if (p.k === 'mote') { p.y -= p.v; p.a += .03; if (p.y < -.02) { p.y = 1.02; p.x = Math.random(); } x.globalAlpha = .35 + Math.sin(p.a) * .3; x.fillStyle = '#ffe9b0'; x.beginPath(); x.arc(p.x * W, p.y * H, p.r, 0, 7); x.fill(); continue; }
        p.vy += p.g; p.vx *= .985; p.vy *= .985; p.x += p.vx; p.y += p.vy; p.life--; p.rot += p.vr;
        if (p.life <= 0 || p.y > H + 40) { P.splice(i, 1); continue; }
        x.globalAlpha = Math.min(1, p.life / 30); x.fillStyle = p.c;
        if (p.k === 'spark') { x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fill(); }
        else { x.save(); x.translate(p.x, p.y); x.rotate(p.rot); x.fillRect(-p.r, -p.r * .45, p.r * 2, p.r * .9); x.restore(); }
      }
      x.globalAlpha = 1; requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return {
      burst: function (cx, cy, color, n, power) {
        var cols = [color, '#ffffff', '#ffd35a', color, '#fff4dc'];
        for (var i = 0; i < (n || 90); i++) { var a = Math.random() * Math.PI * 2, s = (2 + Math.random() * 9) * (power || 1); P.push({ k: Math.random() < .55 ? 'spark' : 'conf', x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 3, g: .16, r: 2 + Math.random() * 4, c: cols[i % cols.length], life: 60 + Math.random() * 70, rot: Math.random() * 6, vr: (Math.random() - .5) * .3 }); }
      },
      rain: function (color, n) { for (var i = 0; i < (n || 120); i++) P.push({ k: 'conf', x: Math.random() * W, y: -20 - Math.random() * H * .5, vx: (Math.random() - .5) * 2, vy: 2 + Math.random() * 3, g: .05, r: 3 + Math.random() * 4, c: [color, '#ffd35a', '#ffffff', '#b57bff'][i % 4], life: 200, rot: Math.random() * 6, vr: (Math.random() - .5) * .2 }); },
      stop: function () { run = false; window.removeEventListener('resize', size); }
    };
  }

  var O = null, fx = null, st = null;
  function el(h) { var d = document.createElement('div'); d.innerHTML = h; return d.firstElementChild; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  pkRender = function () {
    if (!PK) { if (O) { if (fx) fx.stop(); O.remove(); O = null; st = null; } document.body.classList.remove('lock'); return; }
    if (O && st && st.pk === PK) return;
    if (O) { if (fx) fx.stop(); O.remove(); }
    start();
  };

  function start() {
    var cards = PK.cards, pk = PK.pk || PACKS[0];
    var best = cards.reduce(function (m, c) { return Math.max(m, 'CRASL'.indexOf(rarOf(c))); }, 0), bc = (R()['CRASL'[best]] || [0, '#ffd35a'])[1];
    st = { pk: PK, i: 0, flipping: false, torn: 0 };
    document.body.classList.add('lock');
    O = el('<div id="pko" class="po" style="--glow:' + bc + '">' +
      '<div class="po-bg" style="background-image:url(' + IMG + 'stage.jpg)"></div><div class="po-beams"><i></i><i></i><i></i><i></i></div><div class="po-dim"></div>' +
      '<canvas class="po-fx"></canvas><div class="po-flash"></div>' +
      '<div class="po-top"><b>' + esc(PK.name) + '</b><button class="po-skip" type="button">Skip</button></div>' +
      '<div class="po-center"><div class="po-pack"><div class="po-tilt">' + (typeof packArt === 'function' ? packArt(pk, 1) : '') + '<div class="po-tear"></div><div class="po-shine"></div></div></div></div>' +
      '<div class="po-hint"><span class="po-swipe"></span><b>Swipe across the top to rip it open</b></div>' +
      '<div class="po-deck"></div><div class="po-row"></div><div class="po-call"></div>' +
      '<div class="po-end"><button class="cta" data-a="xpdone">Add to my binder</button></div></div>');
    document.body.appendChild(O);
    fx = Fx(O.querySelector('.po-fx'));
    O.querySelector('.po-skip').addEventListener('click', skip);
    requestAnimationFrame(function () { O.classList.add('in'); });
    setTimeout(function () { SND.drop(); buzz(20); O.classList.add('dropped'); }, 450);
    armRip();
  }

  /* --- rip: drag across the top of the pack (or tap it three times) --- */
  function armRip() {
    var pack = O.querySelector('.po-pack'), tear = O.querySelector('.po-tear'), tilt = O.querySelector('.po-tilt');
    var down = false, x0 = 0, taps = 0, prog = 0;
    function set(p) { prog = Math.max(prog, Math.min(1, p)); tear.style.setProperty('--p', prog); if (Math.random() < .5) SND.tear(prog); if (prog >= 1) done(); }
    function pos(e) { var t = e.touches ? e.touches[0] : e; return { x: t.clientX, y: t.clientY }; }
    function onDown(e) { if (st.torn) return; down = true; var p = pos(e); x0 = p.x; e.preventDefault(); }
    function onMove(e) {
      var p = pos(e), r = pack.getBoundingClientRect();
      if (!down) { var dx = (p.x - (r.left + r.width / 2)) / r.width, dy = (p.y - (r.top + r.height / 2)) / r.height; tilt.style.transform = 'rotateY(' + (dx * 22) + 'deg) rotateX(' + (-dy * 16) + 'deg)'; return; }
      e.preventDefault(); set(Math.abs(p.x - x0) / (r.width * .8));
    }
    function onUp() { if (!down) return; down = false; if (prog > 0 && prog < 1) { taps++; if (taps >= 3) set(1); } }
    pack.addEventListener('click', function () { if (st.torn || prog > 0) return; taps++; set(taps / 3); });
    pack.addEventListener('pointerdown', onDown); window.addEventListener('pointermove', onMove, { passive: false }); window.addEventListener('pointerup', onUp);
    pack.addEventListener('touchstart', onDown, { passive: false }); window.addEventListener('touchmove', onMove, { passive: false }); window.addEventListener('touchend', onUp);
    function done() {
      if (st.torn) return; st.torn = 1;
      window.removeEventListener('pointermove', onMove); window.removeEventListener('touchmove', onMove);
      rip();
    }
  }

  async function rip() {
    var r = O.querySelector('.po-pack').getBoundingClientRect();
    SND.rip(); buzz([30, 40, 60]); O.classList.add('ripping');
    await wait(420);
    SND.boom(); O.classList.add('burst'); fx.burst(r.left + r.width / 2, r.top + r.height * .25, getComputedStyle(O).getPropertyValue('--glow').trim() || '#ffd35a', 140, 1.2);
    flash(); shake(500);
    await wait(700);
    deal();
  }
  function flash(c) { var f = O.querySelector('.po-flash'); f.style.background = c || '#fff'; f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }
  function shake(ms) { O.classList.remove('shake'); void O.offsetWidth; O.classList.add('shake'); setTimeout(function () { if (O) O.classList.remove('shake'); }, ms); }

  /* --- deal the cards face down into a stack --- */
  async function deal() {
    O.classList.add('dealt');
    var deck = O.querySelector('.po-deck'), cards = PK.cards;
    deck.innerHTML = cards.map(function (c, i) {
      return '<div class="po-card" data-i="' + i + '" style="--i:' + i + ';--n:' + cards.length + ';--rc:' + colorOf(c) + '"><div class="po-flip"><div class="po-back" style="background-image:url(' + IMG + 'card-back.jpg)"></div><div class="po-front">' + (typeof tcard === 'function' ? tcard(c, 1) : '') + '</div></div></div>';
    }).join('');
    cards.forEach(function (c, i) { SND.deal(i); });
    await wait(80); deck.classList.add('stacked');
    await wait(cards.length * 90 + 450);
    nextCard();
  }
  function cardEl(i) { return O.querySelector('.po-card[data-i="' + i + '"]'); }
  function nextCard() {
    var i = st.i, c = PK.cards[i]; if (!c) return finish();
    var e = cardEl(i); e.classList.add('up'); O.querySelector('.po-call').innerHTML = '<b>Tap to flip</b><small>Card ' + (i + 1) + ' of ' + PK.cards.length + '</small>';
    O.querySelector('.po-call').className = 'po-call on';
    e.onclick = function () { if (!st.flipping) reveal(i); };
  }
  async function reveal(i) {
    st.flipping = true; var c = PK.cards[i], e = cardEl(i), col = colorOf(c), call = O.querySelector('.po-call');
    call.className = 'po-call';
    if (big(c)) {
      O.style.setProperty('--hot', col); O.classList.add('walkout');
      SND.rise(); e.classList.add('charge');
      for (var k = 0; k < 3; k++) { SND.beat(k); }
      await wait(1900);
      e.classList.remove('charge'); e.classList.add('flip'); flash(col); shake(700); SND.huge(); buzz([60, 40, 120]);
      var r = e.getBoundingClientRect();
      fx.burst(r.left + r.width / 2, r.top + r.height / 2, col, 200, 1.6); fx.rain(col, 160);
      call.innerHTML = '<span class="po-slam" style="--hot:' + col + '">' + esc(label(c)) + '</span><small>' + esc((CARD[c.id] || {}).n || '') + (typeof covr === 'function' ? ' · OVR ' + covr(c) : '') + '</small>';
      call.className = 'po-call on big';
      await wait(2600); O.classList.remove('walkout');
    } else {
      e.classList.add('flip'); SND.flip(); await wait(350); SND.nice(rarOf(c));
      if (rarOf(c) !== 'C' || c.par !== 'base') { var r2 = e.getBoundingClientRect(); fx.burst(r2.left + r2.width / 2, r2.top + r2.height / 2, col, 50, .8); }
      var R2 = R()[rarOf(c)];
      call.innerHTML = '<span class="po-tag" style="--hot:' + col + '">' + esc(R2 ? R2[0] : '') + (c.par !== 'base' && PAR[c.par] ? ' · ' + esc(PAR[c.par][0]) : '') + '</span>';
      call.className = 'po-call on';
      await wait(1200);
    }
    e.classList.remove('up'); e.classList.add('pdone'); moveToRow(e);
    st.i++; st.flipping = false; nextCard();
  }
  function moveToRow(e) { var row = O.querySelector('.po-row'); row.appendChild(e); e.style.removeProperty('--i'); }
  function finish() {
    O.querySelector('.po-call').innerHTML = '<b>Here\'s what you pulled</b>'; O.querySelector('.po-call').className = 'po-call on';
    O.classList.add('finished'); fx.rain('#ffd35a', 60);
  }
  function skip() {
    if (!st) return;
    if (!st.torn) { st.torn = 1; O.classList.add('ripping', 'burst', 'dealt'); }
    var deck = O.querySelector('.po-deck');
    if (!deck.children.length) deck.innerHTML = PK.cards.map(function (c) { return '<div class="po-card" style="--rc:' + colorOf(c) + '"><div class="po-flip"><div class="po-back" style="background-image:url(' + IMG + 'card-back.jpg)"></div><div class="po-front">' + tcard(c, 1) + '</div></div></div>'; }).join('');
    O.querySelectorAll('.po-card').forEach(function (e) { e.onclick = null; e.classList.remove('up', 'charge'); e.classList.add('flip', 'pdone'); moveToRow(e); });
    O.classList.remove('walkout'); st.i = PK.cards.length; finish();
  }
})();
