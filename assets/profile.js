/* The player's progress, saved on this device until accounts come back.
   XP, levels, best scores and high scores, shared by the park and the arcade. */
(function () {
  var KEY = 'bp-profile';
  var LEVELS = [[0, 'Rookie Ball'], [120, 'Single-A'], [300, 'Double-A'], [550, 'Triple-A'], [900, 'The Show'], [1400, 'All-Star'], [2000, 'MVP'], [3000, 'Hall of Famer'], [4200, 'Legend'], [5700, 'Icon'], [7500, 'Immortal']];
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  var p = load();
  p.xp = p.xp || 0; p.best = p.best || {}; p.hs = p.hs || {}; p.gp = p.gp || {}; p.act = p.act || {};
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  var Profile = {
    data: p,
    LEVELS: LEVELS,
    today: today,
    save: function () { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {} },
    level: function (xp) {
      xp = xp == null ? p.xp : xp; var i = 0;
      LEVELS.forEach(function (l, k) { if (xp >= l[0]) i = k; });
      var nx = LEVELS[i + 1];
      return { i: i, num: i + 1, n: LEVELS[i][1], pct: nx ? Math.min(100, (xp - LEVELS[i][0]) / (nx[0] - LEVELS[i][0]) * 100) : 100, next: nx ? nx[1] : '' };
    },
    /* add XP; returns the new level name if this crossed into a new level */
    award: function (xp) {
      var before = Profile.level().i;
      p.xp += xp; p.act[today()] = (p.act[today()] || 0) + 1; Profile.save();
      var after = Profile.level();
      return after.i > before ? after.n : null;
    }
  };
  window.Profile = Profile;
})();
