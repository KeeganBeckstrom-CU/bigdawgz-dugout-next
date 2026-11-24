/* Road to Cooperstown history lessons (12U).
   The coach sets a start date and the Cooperstown date. Every week players get three short history
   lessons on three different days, then a quiz at the end of the week on those three. The lessons walk
   through baseball history in order, spread out so the last one lands right before the trip.
   Shared by the museum and the app's Home screen. The plan and each player's progress live in the
   team save (dugout12u-v3): S.hist = plan, player.hist = { l: {momentId: date}, q: {week: best score} }. */
(function () {
  var KEY = 'dugout12u-v3';
  var DAYN = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || 'null') || {}; } catch (e) { return {}; } }
  function store(S) { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function iso(d) { var z = new Date(d.getTime() - d.getTimezoneOffset() * 6e4); return z.toISOString().slice(0, 10); }
  function D(s) { return new Date(s + 'T12:00:00'); }
  function today() { return iso(new Date()); }
  function add(s, n) { var d = D(s); d.setDate(d.getDate() + n); return iso(d); }
  function dow(s) { var g = D(s).getDay(); return g === 0 ? 7 : g; } /* Mon=1 .. Sun=7 */
  function monday(s) { return add(s, 1 - dow(s)); }
  function nice(s) { return D(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }

  /* 12U only: on for the BigDawgz 12U app, and for any Basepaths team whose age group is 12U */
  function on() { try { return localStorage.getItem('bp-hist-on') !== '0'; } catch (e) { return true; } }

  function plan(S) {
    S = S || load();
    /* test copy only: sample dates so the calendar shows something until the coach sets real ones */
    if (!S.hist && S.zSeed2) { S.hist = { start: '2026-11-23', trip: '2027-07-17', days: [1, 3, 5], quiz: 6, sample: true }; var T = load(); T.hist = S.hist; store(T); }
    var p = S.hist || {};
    return {
      start: p.start || monday(today()),
      trip: p.trip || '',
      days: (p.days && p.days.length === 3 ? p.days : [1, 3, 5]).slice().sort(),
      quiz: p.quiz || 6,
      sample: !!p.sample
    };
  }
  function setPlan(o) {
    var S = load(); var p = plan(S);
    Object.keys(o).forEach(function (k) { p[k] = o[k]; });
    delete p.sample;
    S.hist = p; store(S); return p;
  }

  /* the weekly calendar */
  function weeks(P) {
    P = P || plan();
    var M = window.BP_MOMENTS || [], out = [];
    if (!P.trip) return out;
    var mon = monday(P.start), qd = Math.max(P.quiz, P.days[2] + 1);
    var W = 0; while (add(mon, W * 7 + qd - 1) < P.trip) W++;
    var N = Math.min(W * 3, M.length), pick = [];
    for (var i = 0; i < N; i++) pick.push(M[N >= M.length ? i : Math.round(i * (M.length - 1) / Math.max(1, N - 1))]);
    for (var k = 0; k < W; k++) {
      var base = add(mon, k * 7), ls = [];
      for (var j = 0; j < 3; j++) {
        var m = pick[k * 3 + j];
        if (m) ls.push({ id: m[0], era: m[1], yr: m[2], t: m[3], date: add(base, P.days[j] - 1) });
      }
      var rev = !ls.length;
      if (rev) { /* past the last Moment: review weeks mix three earlier lessons */
        for (var r = 0; r < 3 && pick.length; r++) { var x = pick[(k * 7 + r * 13) % pick.length]; ls.push({ id: x[0], era: x[1], yr: x[2], t: x[3], date: add(base, P.days[r] - 1), review: 1 }); }
      }
      out.push({ n: k + 1, start: base, lessons: ls, quiz: add(base, qd - 1), review: rev });
    }
    return out.filter(function (w) { return w.quiz >= P.start; });
  }

  function player(S, pid) { return (S.players || []).find(function (p) { return p.id === pid; }); }
  function prog(pid, S) { S = S || load(); var p = player(S, pid); var h = (p && p.hist) || {}; return { l: h.l || {}, q: h.q || {} }; }
  function mark(pid, field, key, val) {
    var S = load(), p = player(S, pid); if (!p) return;
    p.hist = p.hist || {}; p.hist[field] = p.hist[field] || {};
    if (field === 'q') { if ((p.hist.q[key] || -1) < val) p.hist.q[key] = val; }
    else if (!p.hist.l[key]) p.hist.l[key] = val;
    store(S);
  }

  function lessonState(L, pr, t) {
    t = t || today();
    if (L.review ? pr.l['r:' + L.id + ':' + L.date] : pr.l[L.id]) return 'done';
    if (L.date > t) return 'locked';
    return L.date === t ? 'today' : 'late';
  }
  function quizState(w, pr, t) {
    t = t || today();
    if (pr.q[w.n] >= 2) return 'passed';
    var left = w.lessons.filter(function (L) { return lessonState(L, pr, t) !== 'done'; }).length;
    if (w.quiz > t) return 'locked';
    return left ? 'needs' : 'open';
  }
  function current(ws, t) {
    t = t || today();
    for (var i = 0; i < ws.length; i++) if (add(ws[i].start, 6) >= t) return ws[i];
    return ws[ws.length - 1] || null;
  }
  /* what a player should do today (for the Home screen) */
  function todo(pid) {
    if (!on()) return null;
    var P = plan(), ws = weeks(P), pr = prog(pid), t = today(), out = [];
    ws.forEach(function (w) {
      if (w.start > t) return;
      w.lessons.forEach(function (L) { var s = lessonState(L, pr, t); if (s === 'today' || s === 'late') out.push({ kind: 'lesson', w: w, L: L, late: s === 'late' }); });
      var q = quizState(w, pr, t); if (q === 'open') out.push({ kind: 'quiz', w: w, late: w.quiz < t });
    });
    return out;
  }

  /* test copy only: sample dates so the calendar shows something until the coach sets real ones */

  window.BPH = { on: on, plan: plan, setPlan: setPlan, weeks: weeks, prog: prog, mark: mark, lessonState: lessonState, quizState: quizState,
    current: current, todo: todo, today: today, add: add, nice: nice, monday: monday, DAYN: DAYN, load: load };
})();
