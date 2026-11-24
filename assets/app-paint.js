/* Swaps the app's emoji icons for the painted park icons, and keeps the park theme stylesheet last
   so it wins over styles the app adds while it runs. */
(function () {
  var I = '../assets/img/', M = {
    '💪': 'cat/arm', '🎯': 'cat/throw', '⚾': 'cat/pitch', '🏏': 'cat/hit', '🧤': 'cat/field', '🌤️': 'cat/of', '🌤': 'cat/of', '🛡️': 'cat/catch', '🛡': 'cat/catch',
    '💨': 'cat/run', '⚡': 'cat/ath', '🧠': 'cat/iq', '🎉': 'cat/fun', '🛋️': 'cat/inside', '🛋': 'cat/inside', '🎬': 'cat/film', '🏆': 'trophy', '🃏': 'binder',
    '🎮': 'games/derby', '🏟️': 'trophy', '🏟': 'trophy', '⭐': 'cat/star', '🎁': 'chest', '📚': 'bats', '🧭': 'cat/path', '🔁': 'chest-open', '⚔️': 'bats', '⚔': 'bats',
    '🥊': 'glove', '📊': 'scoreboard', '🎞️': 'cat/film', '🎞': 'cat/film', '🎥': 'cat/film', '📥': 'chest-open', '🎒': 'chest', '🧢': 'cat/iq'
  };
  var SEL = '.nav button>span,.dic,.cle,.rowb>span:first-child,.cat>span,.shd .big,.cltile .cle,.xth>span,.pcard>span,.dd .ddc span,.cardsbtn>span:first-child,.bdent button>span';
  function swap(root) {
    (root || document).querySelectorAll(SEL).forEach(function (e) {
      if (e.dataset.pi) return;
      var t = (e.textContent || '').trim(), k = M[t] || M[t.replace(/️/g, '')];
      if (!k || e.children.length) return;
      e.dataset.pi = 1; e.innerHTML = '<img class="pi" src="' + I + k + '.png" alt="">';
    });
  }
  var link = document.querySelector('link[href$="app-theme.css"]');
  function keepLast() { if (link && link !== document.head.lastElementChild) document.head.appendChild(link); }
  var q = false;
  new MutationObserver(function () { if (q) return; q = true; requestAnimationFrame(function () { q = false; swap(); keepLast(); }); }).observe(document.documentElement, { childList: true, subtree: true });
  swap(); keepLast();
})();
/* the team logo in the top bar goes back to the park; #coach, #parent or #p1 in the link opens that role */
(function () {
  document.addEventListener('click', function (e) { var l = e.target.closest('.top .lg'); if (l) { e.preventDefault(); e.stopPropagation(); location.href = '../'; } }, true);
  var h = location.hash.replace('#', '');
  if (h && typeof setWho === 'function' && (h === 'coach' || h === 'parent' || (typeof S !== 'undefined' && S && S.players && S.players.some(function (p) { return p.id === h; })))) { try { setWho(h); } catch (e) {} history.replaceState(null, '', location.pathname); }
})();
