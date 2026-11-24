/* The signed-in player's progress. When a player is signed in to the team app (app/), this reads
   and writes that player's own record, so XP, streak, drills and high scores are the same
   everywhere. With nobody signed in (or a coach or parent), it keeps a device-only profile. */
(function () {
  var KEY = 'bp-profile', TEAM = 'dugout12u-v3';
  var LEVELS = [[0, 'Rookie Ball'], [120, 'Single-A'], [300, 'Double-A'], [550, 'Triple-A'], [900, 'The Show'], [1400, 'All-Star'], [2000, 'MVP'], [3000, 'Hall of Famer']];
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function addDays(s, n) { var d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  var team = null, p = null;
  try { team = JSON.parse(localStorage.getItem(TEAM) || 'null'); } catch (e) {}
  if (team && team.players && team.who && !/^(coach|parent)$/.test(team.who)) p = team.players.find(function (x) { return x.id === team.who; }) || null;
  var linked = !!p;
  if (!p) { try { p = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { p = {}; } }
  p.xp = p.xp || 0; p.best = p.best || {}; p.hs = p.hs || {}; p.gp = p.gp || {}; p.act = p.act || {}; p.done = p.done || {}; p.cats = p.cats || {}; p.log = p.log || []; p.fav = p.fav || [];
  var Profile = {
    data: p,
    linked: linked,
    who: team ? team.who : null,
    team: team,
    LEVELS: LEVELS,
    today: today,
    save: function () {
      try {
        if (linked) localStorage.setItem(TEAM, JSON.stringify(team));
        else localStorage.setItem(KEY, JSON.stringify(p));
      } catch (e) {}
    },
    level: function (xp) {
      xp = xp == null ? p.xp : xp; var i = 0;
      LEVELS.forEach(function (l, k) { if (xp >= l[0]) i = k; });
      var nx = LEVELS[i + 1];
      return { i: i, num: i + 1, n: LEVELS[i][1], pct: nx ? Math.min(100, (xp - LEVELS[i][0]) / (nx[0] - LEVELS[i][0]) * 100) : 100, next: nx ? nx[1] : '' };
    },
    /* add XP (and count today as active, keep the streak going); returns the new level name if this crossed into a new level */
    award: function (xp) {
      var before = Profile.level().i, t = today();
      p.xp += xp; p.act[t] = (p.act[t] || 0) + 1;
      if (p.last !== t) { p.streak = p.last === addDays(t, -1) ? (p.streak || 0) + 1 : 1; p.last = t; }
      Profile.save();
      var after = Profile.level();
      return after.i > before ? after.n : null;
    }
  };
  window.Profile = Profile;
})();
