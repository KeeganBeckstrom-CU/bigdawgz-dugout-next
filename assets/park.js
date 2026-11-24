/* Basepaths painted park: home screen behavior */
(function () {
  var app = document.getElementById('app');
  var world = document.getElementById('world');
  var cam = document.getElementById('cam');

  /* Fit the park to the phone. Home plate (the daily chest) always sits just above the
     bottom bar, and the Scoreboard sign always sits just below the top bar, so nothing overlaps. */
  var IMG_RATIO = 1456 / 814;
  var CHEST_Y = .734, CHEST_BELOW = 30;   // chest sign hangs ~30px below home plate
  var SCORE_Y = .265, SIGN_H = 104;       // scoreboard sign height above its post
  function layout() {
    var w = app.clientWidth, h = app.clientHeight;
    var hud = document.querySelector('.hud').offsetHeight;
    var dock = document.querySelector('.dock').offsetHeight;
    var wh = w * IMG_RATIO;
    var maxTop = (h - dock - 12) - (CHEST_Y * wh + CHEST_BELOW);   // keep the chest above the dock
    var minTop = (hud + 8) - (SCORE_Y * wh - SIGN_H);              // keep the scoreboard sign under the top bar
    var top = Math.min(maxTop, Math.max(minTop, (h - wh) / 2 + 40));
    world.style.setProperty('--world-top', Math.round(top) + 'px');
    app.classList.toggle('short', maxTop < minTop);
  }
  window.addEventListener('resize', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  layout();

  /* Countdown to the next daily task (local midnight) */
  var timer = document.getElementById('timer');
  function tick() {
    var now = new Date(), mid = new Date(now); mid.setHours(24, 0, 0, 0);
    var s = Math.max(0, Math.floor((mid - now) / 1000));
    var hh = Math.floor(s / 3600), mm = Math.floor(s % 3600 / 60), ss = s % 60;
    timer.textContent = hh + ':' + String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
  }
  tick(); setInterval(tick, 1000);

  /* XP and level from this device's saved progress */
  var L = Profile.level();
  document.getElementById('xp').textContent = Profile.data.xp.toLocaleString();
  document.getElementById('lvlFill').style.width = L.pct + '%';
  document.getElementById('lvlName').textContent = 'Lv ' + L.num;
  document.getElementById('lvlTrack').setAttribute('aria-label', L.n + ', ' + Math.round(L.pct) + '% to ' + (L.next || 'the top'));

  /* Mute */
  var mute = document.getElementById('mute');
  function paintMute() { mute.classList.toggle('muted', Sound.muted); mute.setAttribute('aria-label', Sound.muted ? 'Turn sound on' : 'Mute sound'); }
  mute.addEventListener('click', function () { Sound.setMuted(!Sound.muted); paintMute(); if (!Sound.muted) Sound.pop(); });
  paintMute();

  /* Tap anything: a wood knock, the camera dives toward it, then its page opens */
  document.querySelectorAll('[data-go]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      var r = el.getBoundingClientRect(), a = app.getBoundingClientRect();
      cam.style.transformOrigin = ((r.left + r.width / 2 - a.left) / a.width * 100) + '% ' + ((r.top + r.height / 2 - a.top) / a.height * 100) + '%';
      Sound.knock(); Sound.whoosh();
      app.classList.add('diving');
      setTimeout(function () { window.location.href = el.getAttribute('href'); }, 480);
    });
  });
  /* Coming back with the browser's back button: undo the dive */
  window.addEventListener('pageshow', function () { app.classList.remove('diving'); });
})();
