/* Tiny sound kit (Web Audio, nothing to download). Mute is remembered on this device. */
(function () {
  var ac = null;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var Sound = {
    muted: store('bp-muted') === '1',
    setMuted: function (m) { Sound.muted = m; store('bp-muted', m ? '1' : '0'); },
    ctx: function () {
      if (Sound.muted) return null;
      try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); return ac; } catch (e) { return null; }
    },
    tone: function (f, d, type, v, at, f2) {
      var a = Sound.ctx(); if (!a) return;
      var t0 = a.currentTime + (at || 0), o = a.createOscillator(), g = a.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v || .1, t0 + .01); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
      o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0 + d + .05);
    },
    knock: function () { Sound.tone(180, .12, 'triangle', .16); Sound.tone(260, .08, 'triangle', .1, .05); },
    whoosh: function () { Sound.tone(300, .35, 'sine', .06, .03, 640); },
    pop: function () { Sound.tone(520, .16, 'sine', .09, 0, 980); }
  };
  window.Sound = Sound;
})();
