/* Team app bridge: runs after the app's own code (same rules, data and actions as bigdawgz-dugout)
   and gives every screen the park design: painted sign-in, a park-style header, painted icons,
   and the new Bullpen, Arcade, Clubhouse and Film Room pages instead of the old ones. */
(function () {
  var I = '../assets/img/';
  var M = {
    '💪': 'cat/arm', '🎯': 'cat/throw', '⚾': 'cat/pitch', '🏏': 'cat/hit', '🧤': 'cat/field', '🌤️': 'cat/of', '🌤': 'cat/of', '🛡️': 'cat/catch', '🛡': 'cat/catch',
    '💨': 'cat/run', '⚡': 'cat/ath', '🧠': 'cat/iq', '🎉': 'cat/fun', '🛋️': 'cat/inside', '🛋': 'cat/inside', '🎬': 'cat/film', '🏆': 'trophy', '🃏': 'binder',
    '🎮': 'games/derby', '🏟️': 'trophy', '🏟': 'trophy', '⭐': 'cat/star', '🎁': 'chest', '📚': 'bats', '🧭': 'cat/path', '🔁': 'chest-open', '⚔️': 'bats', '⚔': 'bats',
    '🥊': 'glove', '📊': 'scoreboard', '🎞️': 'cat/film', '🎞': 'cat/film', '🎥': 'cat/film', '📥': 'chest-open', '🎒': 'chest', '🧢': 'team-logo', '🏠': 'park-home',
    '👥': 'team-logo', '🗂️': 'binder', '🗂': 'binder', '💵': 'coin', '📅': 'scoreboard', '📝': 'cat/goal', '⚙️': 'cat/star', '⚙': 'cat/star', '👪': 'team-logo', '🎴': 'pack'
  };
  var SEL = '.nav button>span,.dic,.cle,.rowb>span:first-child,.cat>span,.shd .big,.cltile .cle,.xth>span,.pcard>span,.dd .ddc span,.cardsbtn>span:first-child,.bdent button>span,.seg button>span,.tiles.four button>span';
  function swap(root) {
    (root || document).querySelectorAll(SEL).forEach(function (e) {
      if (e.dataset.pi) return;
      var t = (e.textContent || '').trim(), k = M[t] || M[t.replace(/️/g, '')];
      if (!k || e.children.length || k === 'park-home') return;
      e.dataset.pi = 1; e.innerHTML = '<img class="pi" src="' + I + k + '.png" alt="">';
    });
  }
  var link = document.querySelector('link[href$="app-theme.css"]');
  function keepLast() { if (link && link !== document.head.lastElementChild) document.head.appendChild(link); }
  var q = false;
  new MutationObserver(function () { if (q) return; q = true; requestAnimationFrame(function () { q = false; swap(); keepLast(); }); }).observe(document.documentElement, { childList: true, subtree: true });

  if (typeof render !== 'function' || typeof S === 'undefined') { swap(); keepLast(); return; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var lvl = function (xp) { try { return level(xp || 0); } catch (e) { return { n: '' }; } };

  /* ---------- painted sign-in ---------- */
  var pickMode = '';
  pickHTML = function () {
    var players = (S.players || []).filter(function (p) { return !p.tmp; });
    var big = function (a, img, b, s) { return '<button class="zzsgn" ' + a + '><img src="' + I + img + '" alt=""><span><b>' + b + '</b><small>' + s + '</small></span><i>›</i></button>'; };
    var h = '<div class="zzpk"><div class="zzhd"><a class="zzback" href="../" aria-label="Back to the park"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></a><span>Park</span></div>' +
      '<div class="zzhero"><img src="' + I + 'team-logo.png" alt="BigDawgz logo"><h1>' + esc(S.team) + '</h1><p>Drills, games and baseball smarts</p></div>';
    if (pickMode !== 'player') {
      h += '<h2 class="zzq">Who\'s signing in?</h2><div class="zzsgns">' +
        big('data-zk="player"', 'cat/hit.png', 'Player', 'Drills, games and your own player card') +
        big('data-a="who:coach"', 'team-logo.png', 'Coach', 'Plan practice, assign drills, run your team') +
        big('data-a="who:parent"', 'scoreboard.png', 'Parent', 'Your player\'s week, schedule and payments') + '</div>';
    } else {
      h += '<h2 class="zzq">Who\'s playing?</h2><div class="zzgrid">' + players.map(function (p) {
        return '<button class="zzpc" data-a="who:' + p.id + '" style="--c:' + p.col + '"><span class="zzav"><b>' + esc(p.num) + '</b></span><b>' + esc(p.n) + '</b><small>' + esc(lvl(p.xp).n) + '</small></button>';
      }).join('') + '</div><button class="ghost zzb" data-zk="">‹ Not a player</button>';
    }
    return h + '<p class="fine zzf">Test copy: sample team, saves on this device only.</p></div>';
  };
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-zk]'); if (!b) return; e.stopPropagation(); pickMode = b.dataset.zk; render(); scrollTo(0, 0); }, true);

  /* ---------- new pages replace the old Library, Arcade, Clubhouse and Film Room ---------- */
  var OUT = { lib: '../bullpen/', finder: '../bullpen/#finder', prog: '../bullpen/#program', play: '../play/', club: '../clubhouse/', film: '../clubhouse/film.html' };
  var _go = go;
  go = function (v) { if (OUT[v] && S && S.who) { save(); location.href = OUT[v]; return; } return _go(v); };

  /* ---------- park header, page titles with painted icons, a Park button in the dock ---------- */
  var TI = { team: 'team-logo', home: 'chest-open', me: 'cat/star', xp: 'coin', cards: 'binder', locker: 'glove', fam: 'team-logo', money: 'coin', sched: 'scoreboard', acct: 'cat/star', assign: 'cat/goal', plans: 'cat/path', boards: 'trophy', hsp: 'trophy', hstab: 'scoreboard', more: 'cat/star', arm: 'cat/arm', trade: 'chest-open', chal: 'bats', duel: 'glove', live: 'scoreboard', cguide: 'binder', vdb: 'cat/film', vrev: 'cat/film', inbox: 'chest-open', qdrill: 'bats', newdrill: 'bats', pprof: 'glove', osp: 'cat/ath', reels: 'cat/film', path: 'cat/path' };
  function chrome() {
    var app = document.getElementById('app'); if (!app) return;
    var top = app.querySelector('.top');
    if (top && !top.querySelector('.parkb')) top.insertAdjacentHTML('afterbegin', '<a class="parkb" href="../" aria-label="Back to the park"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></a>');
    var ph = app.querySelector('.ph');
    if (ph && !ph.querySelector('.phi')) { var k = TI[view] || 'team-logo'; ph.insertAdjacentHTML('afterbegin', '<img class="phi" src="' + I + k + '.png" alt="">'); }
    var nav = app.querySelector('.nav') || document.querySelector('nav.nav');
    if (nav && !nav.querySelector('.navpark')) nav.insertAdjacentHTML('afterbegin', '<a class="navpark" href="../"><span><img class="pi" src="' + I + 'park-btn.png" alt="" onerror="this.outerHTML=\'⛳\'"></span><small>Park</small></a>');
    if (app.querySelector('.zhero')) app.querySelectorAll('.xphero').forEach(function (x) { x.remove(); });
    document.body.classList.toggle('pk-on', !S.who || view === 'pick');
  }
  var _r = render;
  render = function () { _r(); try { chrome(); } catch (e) {} };

  /* ---------- links from the park: #coach, #parent, #p3, #go=home, #a=drill:t1 ---------- */
  function fromHash() {
    var h = decodeURIComponent(location.hash.replace(/^#/, '')); if (!h) return;
    var parts = h.split('&'), who = '', to = '', act = '';
    parts.forEach(function (x) { if (/^go=/.test(x)) to = x.slice(3); else if (/^a=/.test(x)) act = x.slice(2); else if (x) who = x; });
    history.replaceState(null, '', location.pathname);
    if (who === 'signin') { S.who = null; view = 'pick'; pickMode = ''; render(); return; }
    if (who && (who === 'coach' || who === 'parent' || (S.players || []).some(function (p) { return p.id === who; }))) { try { setWho(who); } catch (e) {} }
    if (!S.who) { view = 'pick'; render(); return; }
    if (to) {
      if (isCoach() && ['home', 'me', 'xp', 'fam', 'sched'].indexOf(to) >= 0) to = to === 'sched' ? 'team' : 'team';
      if (isParent() && ['home', 'me', 'xp', 'locker', 'cards', 'cguide', 'team', 'more'].indexOf(to) >= 0) to = 'fam';
      try { _go(to); } catch (e) { try { _go(homeView()); } catch (e2) {} }
    }
    if (act) { var b = document.createElement('button'); b.dataset.a = act; b.style.display = 'none'; document.body.appendChild(b); b.click(); b.remove(); }
  }
  window.addEventListener('hashchange', fromHash);
  if (location.hash.length > 1) fromHash(); else render();
  swap(); keepLast();
})();
