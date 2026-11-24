/* Clubhouse room: your player card up top, a painted room you swipe around, tap a spot to go there. */
(function () {
  var room = document.getElementById('room'), look = document.getElementById('look');
  /* player card */
  try {
    var p = Profile.data, L = Profile.level();
    if (Profile.linked && p) {
      document.getElementById('mn').textContent = p.n || p.name || 'Player';
      document.getElementById('ml').textContent = 'Level ' + L.num + ' · ' + L.n;
      document.getElementById('mb').style.width = L.pct + '%';
      document.getElementById('mx').textContent = (p.bank != null ? p.bank : p.xp || 0).toLocaleString();
      var num = p.num || p.no || '', nm = String(p.n || 'P');
      document.getElementById('av').textContent = num ? num : nm.replace(/[^A-Za-z0-9 ]/g, '').split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
    } else {
      var me = document.getElementById('me'); me.href = '../app/#signin';
      document.getElementById('av').textContent = '🐾';
    }
  } catch (e) {}

  /* start looking at the middle of the room (couch + whiteboard) */
  function center() { room.scrollLeft = (room.scrollWidth - room.clientWidth) * .45; }
  if (document.readyState === 'complete') center(); else addEventListener('load', center);
  setTimeout(center, 50);

  /* drag to look around with a mouse too */
  var down = null;
  room.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = { x: e.clientX, s: room.scrollLeft, moved: false }; });
  addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - down.x; if (Math.abs(dx) > 4) down.moved = true; room.scrollLeft = down.s - dx; });
  addEventListener('pointerup', function () { setTimeout(function () { down = null; }, 0); });
  room.addEventListener('click', function (e) { if (down && down.moved) { e.preventDefault(); e.stopPropagation(); } }, true);

  document.querySelectorAll('[data-pan]').forEach(function (b) {
    b.addEventListener('click', function () { room.scrollBy({ left: +b.dataset.pan * room.clientWidth * .6, behavior: 'smooth' }); });
  });
  room.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') room.scrollBy({ left: 120, behavior: 'smooth' });
    if (e.key === 'ArrowLeft') room.scrollBy({ left: -120, behavior: 'smooth' });
  });
  /* hide the "swipe" hint once they look around; show the arrows only when there's more room */
  function edges() {
    var max = room.scrollWidth - room.clientWidth;
    document.querySelector('.pan.l').hidden = room.scrollLeft < 8;
    document.querySelector('.pan.r').hidden = room.scrollLeft > max - 8 || max < 8;
    if (max < 8) look.hidden = true;
  }
  var moved = 0;
  room.addEventListener('scroll', function () { if (++moved > 3) look.classList.add('gone'); edges(); }, { passive: true });
  addEventListener('resize', edges); setTimeout(edges, 120);

  /* tapping a spot on the list lights up the same spot in the room */
  document.querySelectorAll('.hs,.spots a').forEach(function (a) {
    a.addEventListener('click', function () { try { Sound.tone(660, .07, 'sine', .06); } catch (e) {} });
    a.addEventListener('pointerenter', function () { var h = document.querySelector('.hs[data-k="' + a.dataset.k + '"]'); h && h.classList.add('hot'); });
    a.addEventListener('pointerleave', function () { var h = document.querySelector('.hs[data-k="' + a.dataset.k + '"]'); h && h.classList.remove('hot'); });
  });
})();
