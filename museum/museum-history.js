/* Lessons tab in the museum: three history lessons a week, a quiz at the end of the week,
   spread out until Cooperstown. The coach sets the dates here. Uses assets/history-plan.js. */
(function () {
  if (!window.BPH) return;
  var H = window.BPH;
  var team = H.load(), who = team.who || null;
  var coach = who === 'coach', parent = who === 'parent';
  var pid = !coach && !parent && who ? who : null;
  var ON = H.on();
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var ERAS = window.BP_ERAS || [];
  var main = document.querySelector('main'), nav = document.getElementById('nav');

  if (!ON) return; /* not a 12U team: the museum stays as it was */

  /* the Lessons tab, first in the row */
  var sec = document.createElement('section'); sec.className = 'scr'; sec.id = 's-les'; main.appendChild(sec);
  var tb = document.createElement('button'); tb.dataset.t = 'les'; tb.setAttribute('aria-controls', 's-les');
  tb.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M8 7h7M8 11h7"/></svg>Lessons<span class="badge" id="lesBadge" hidden></span>';
  nav.insertBefore(tb, nav.firstChild);
  tb.onclick = function () { go('les'); tone(520, 0, .05); };

  /* capsules now come from passing the weekly quiz, not homework */
  window.addRep = function (why) { toast(why); };
  var _rc = renderCaps;
  renderCaps = function () {
    _rc();
    var cards = document.querySelectorAll('#s-caps .card');
    cards.forEach(function (c) { if (/homework|reps too/i.test(c.textContent)) c.remove(); });
    var v = document.querySelector('#s-caps .vault');
    if (v && !document.getElementById('capHow')) {
      v.insertAdjacentHTML('afterend', '<button class="card zhow" id="capHow"><img src="../assets/img/museum.png" alt=""><span><b>How you earn capsules</b><small>Do your 3 history lessons each week, then pass the week’s quiz (2 of 3 right) to earn a time capsule.</small></span><span class="arr" aria-hidden="true">›</span></button>');
      document.getElementById('capHow').onclick = function () { go('les'); };
    }
    document.querySelectorAll('#s-caps .shelf div').forEach(function (d) { if (/Finish homework/.test(d.textContent)) d.textContent = 'No capsules yet. Pass a weekly quiz to earn one.'; });
  };

  /* ---------- the Lessons screen ---------- */
  var draft = null; /* coach's unsaved plan edits */
  function stTag(s, L) {
    return s === 'done' ? '<span class="zst ok">✓ Done</span>' : s === 'today' ? '<span class="zst go">Start ›</span>' : s === 'late' ? '<span class="zst late">Catch up ›</span>' : '<span class="zst lock">🔒 ' + H.DAYN[(new Date(L.date + 'T12:00').getDay() || 7)] + '</span>';
  }
  function lessonRow(L, pr) {
    var s = pr ? H.lessonState(L, pr) : (L.date > H.today() ? 'locked' : 'today');
    var lbl = L.t + ', ' + H.nice(L.date) + ', ' + ({ done: 'done', today: 'today', late: 'missed, catch up', locked: 'opens ' + H.nice(L.date) })[s];
    return '<button class="zl s-' + s + '" data-les="' + L.id + '" data-date="' + L.date + '"' + (L.review ? ' data-rev="1"' : '') + (s === 'locked' ? ' aria-disabled="true"' : '') + ' aria-label="' + esc(lbl) + '">' +
      '<span class="zday"><b>' + H.nice(L.date).split(',')[0] + '</b><small>' + H.nice(L.date).split(', ')[1] + '</small></span>' +
      '<span class="ztx"><small>' + (L.review ? 'Review · ' : '') + L.yr + ' · ' + esc(ERAS[L.era] || '') + '</small><b>' + esc(L.t) + '</b></span>' + stTag(s, L) + '</button>';
  }
  function quizRow(w, pr) {
    var s = pr ? H.quizState(w, pr) : 'locked', sc = pr && pr.q[w.n];
    var tag = s === 'passed' ? '<span class="zst ok">✓ ' + sc + '/3</span>' : s === 'open' ? '<span class="zst go">Take it ›</span>' : s === 'needs' ? '<span class="zst lock">Finish lessons</span>' : '<span class="zst lock">🔒 ' + H.nice(w.quiz).split(',')[0] + '</span>';
    return '<button class="zl zq s-' + s + '" data-quiz="' + w.n + '"' + (s === 'open' || s === 'passed' ? '' : ' aria-disabled="true"') + ' aria-label="Week ' + w.n + ' quiz, ' + esc(H.nice(w.quiz)) + '">' +
      '<span class="zday zqd"><b>Quiz</b><small>' + H.nice(w.quiz).split(', ')[1] + '</small></span>' +
      '<span class="ztx"><small>End of week ' + w.n + '</small><b>Week ' + w.n + ' quiz · 3 questions</b></span>' + tag + '</button>';
  }
  function eraOf(w) { var L = w.lessons[0]; return L ? (w.review ? 'Review week' : (ERAS[L.era] || '')) : ''; }

  function render() {
    var P = H.plan(), ws = H.weeks(P), t = H.today(), pr = pid ? H.prog(pid) : null;
    var cur = H.current(ws, t), total = ws.reduce(function (s, w) { return s + (w.review ? 0 : w.lessons.length); }, 0);
    var done = pr ? Object.keys(pr.l).filter(function (k) { return k.indexOf('r:') !== 0; }).length : 0;
    var weeksLeft = P.trip ? Math.max(0, Math.ceil((new Date(P.trip + 'T12:00') - new Date(t + 'T12:00')) / 6048e5)) : 0;
    var h = '<div class="sec zles"><h2 class="h1">Road to Cooperstown</h2>' +
      '<p class="sub">Three short history lessons a week, then a quiz to finish the week. ' + (P.trip ? '<b>' + weeksLeft + ' week' + (weeksLeft === 1 ? '' : 's') + '</b> until Cooperstown (' + esc(H.nice(P.trip)) + ').' : '') + '</p>';
    if (pr && total) h += '<div class="zprog" role="progressbar" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + done + '" aria-label="Lessons done"><i style="width:' + Math.round(done / total * 100) + '%"></i></div><p class="zpl"><b>' + done + '</b> of ' + total + ' lessons done</p>';
    if (coach) h += planner(P, ws);
    if (!P.trip) {
      h += '<div class="card zempty2"><img src="../assets/img/scoreboard.png" alt=""><b>' + (coach ? 'Set the Cooperstown date above to build the calendar.' : 'Lessons start once Coach sets the Cooperstown date.') + '</b></div></div>';
      sec.innerHTML = h; bind(); return;
    }
    if (!pid && !coach) h += '<div class="card zempty2"><b>' + (parent ? 'Your player does these on their own login.' : 'Sign in to start your lessons.') + '</b>' + (parent ? '' : '<a class="btn" href="../app/#signin">Sign in</a>') + '</div>';
    if (cur) {
      h += '<div class="zwk2"><div class="zwh"><small>Week ' + cur.n + ' of ' + ws.length + ' · ' + esc(H.nice(cur.start)).split(', ')[1] + '–' + esc(H.nice(H.add(cur.start, 6))).split(', ')[1] + '</small><b>' + esc(eraOf(cur)) + '</b></div>' +
        cur.lessons.map(function (L) { return lessonRow(L, pr); }).join('') + quizRow(cur, pr) + '</div>';
    }
    /* catch-up from earlier weeks */
    var past = ws.filter(function (w) { return cur && w.n < cur.n; });
    if (pr && past.length) {
      var miss = past.filter(function (w) { return H.quizState(w, pr) !== 'passed'; });
      if (miss.length) h += '<h3 class="zh3">Catch up</h3>' + miss.slice(-3).map(function (w) {
        return '<div class="zwk2 zpast"><div class="zwh"><small>Week ' + w.n + '</small><b>' + esc(eraOf(w)) + '</b></div>' + w.lessons.map(function (L) { return lessonRow(L, pr); }).join('') + quizRow(w, pr) + '</div>';
      }).join('');
    }
    var next = ws.filter(function (w) { return cur && w.n > cur.n; }).slice(0, 3);
    if (next.length) h += '<h3 class="zh3">Coming up</h3><div class="card znext2">' + next.map(function (w) {
      return '<div><b>Week ' + w.n + '</b><span>' + esc(eraOf(w)) + '</span><small>starts ' + esc(H.nice(w.start)) + '</small></div>';
    }).join('') + '</div>';
    if (pr && past.length) h += '<h3 class="zh3">Your quizzes</h3><div class="zqs">' + past.concat(cur && H.quizState(cur, pr) === 'passed' ? [cur] : []).map(function (w) {
      var sc = pr.q[w.n]; return '<span class="' + (sc >= 2 ? 'ok' : '') + '">Wk ' + w.n + '<b>' + (sc == null ? '–' : sc + '/3') + '</b></span>';
    }).join('') + '</div>';
    if (coach) h += teamCard(ws, cur);
    h += '</div>';
    sec.innerHTML = h; bind(); badge();
  }

  function planner(P, ws) {
    var d = draft || { start: P.start, trip: P.trip, days: P.days.slice(), quiz: P.quiz };
    var n = ws.length, nl = ws.reduce(function (s, w) { return s + (w.review ? 0 : w.lessons.length); }, 0);
    var days = [1, 2, 3, 4, 5, 6, 7].map(function (k) { var o = d.days.indexOf(k) >= 0; return '<button class="zchip' + (o ? ' on' : '') + '" data-day="' + k + '" aria-pressed="' + o + '">' + H.DAYN[k] + '</button>'; }).join('');
    var qd = [1, 2, 3, 4, 5, 6, 7].filter(function (k) { return k > Math.max.apply(null, d.days); }).map(function (k) { var o = d.quiz === k; return '<button class="zchip' + (o ? ' on' : '') + '" data-qday="' + k + '" aria-pressed="' + o + '">' + H.DAYN[k] + '</button>'; }).join('');
    return '<div class="card zplan"><b class="zpt">Coach: lesson calendar</b>' +
      (P.sample ? '<p class="zwarn">These are sample dates. Put in your real dates.</p>' : '') +
      '<label class="zf"><span>Lessons start</span><input type="date" id="hpStart" value="' + esc(d.start) + '"></label>' +
      '<label class="zf"><span>Cooperstown date</span><input type="date" id="hpTrip" value="' + esc(d.trip) + '" min="' + esc(d.start) + '"></label>' +
      '<div class="zf"><span id="hpDl">Lesson days (pick 3)</span><div class="zchips" role="group" aria-labelledby="hpDl">' + days + '</div></div>' +
      '<div class="zf"><span id="hpQl">Quiz day</span><div class="zchips" role="group" aria-labelledby="hpQl">' + (qd || '<small>Pick lesson days earlier in the week</small>') + '</div></div>' +
      '<button class="btn" id="hpSave">Save calendar</button>' +
      (P.trip ? '<p class="zsum">' + n + ' weeks · ' + nl + ' lessons, oldest to newest' + (nl < 100 ? ' (' + nl + ' of the 100 Moments, spread across every era)' : '') + '. Last quiz ' + esc(H.nice(ws.length ? ws[ws.length - 1].quiz : P.trip)) + '.</p>' : '') + '</div>';
  }

  function teamCard(ws, cur) {
    var S = H.load(), ps = S.players || [];
    if (!cur || !ps.length) return '';
    return '<h3 class="zh3">Team this week</h3><div class="card zteam">' + ps.map(function (p) {
      var pr = H.prog(p.id, S), n = cur.lessons.filter(function (L) { return H.lessonState(L, pr) === 'done'; }).length, q = pr.q[cur.n];
      var all = Object.keys(pr.l).filter(function (k) { return k.indexOf('r:') !== 0; }).length;
      return '<div><b>' + esc(p.n) + '</b><span class="zdots" aria-label="' + n + ' of 3 lessons">' + [0, 1, 2].map(function (i) { return '<i class="' + (i < n ? 'f' : '') + '"></i>'; }).join('') + '</span><small>Quiz ' + (q == null ? '–' : q + '/3') + ' · ' + all + ' total</small></div>';
    }).join('') + '</div>';
  }

  function bind() {
    sec.querySelectorAll('[data-les]').forEach(function (b) { b.onclick = function () { if (b.getAttribute('aria-disabled')) { toast('Opens ' + H.nice(b.dataset.date)); return; } openLesson(b.dataset.les, b.dataset.date, !!b.dataset.rev); }; });
    sec.querySelectorAll('[data-quiz]').forEach(function (b) { b.onclick = function () { if (b.getAttribute('aria-disabled')) { toast(/Finish/.test(b.textContent) ? 'Finish this week’s 3 lessons first' : 'The quiz opens at the end of the week'); return; } quiz(+b.dataset.quiz); }; });
    if (!coach) return;
    var d = draft || (draft = (function () { var P = H.plan(); return { start: P.start, trip: P.trip, days: P.days.slice(), quiz: P.quiz }; })());
    var S1 = document.getElementById('hpStart'), T1 = document.getElementById('hpTrip');
    S1.onchange = function () { d.start = S1.value; render(); };
    T1.onchange = function () { d.trip = T1.value; render(); };
    sec.querySelectorAll('[data-day]').forEach(function (b) { b.onclick = function () { var k = +b.dataset.day, i = d.days.indexOf(k); if (i >= 0) { if (d.days.length > 1) d.days.splice(i, 1); } else { d.days.push(k); if (d.days.length > 3) d.days.shift(); } d.days.sort(); if (d.quiz <= Math.max.apply(null, d.days)) d.quiz = Math.min(7, Math.max.apply(null, d.days) + 1); render(); }; });
    sec.querySelectorAll('[data-qday]').forEach(function (b) { b.onclick = function () { d.quiz = +b.dataset.qday; render(); }; });
    document.getElementById('hpSave').onclick = function () {
      if (d.days.length !== 3) { toast('Pick 3 lesson days'); return; }
      if (!d.trip || d.trip <= d.start) { toast('Put in the Cooperstown date'); return; }
      H.setPlan({ start: d.start, trip: d.trip, days: d.days, quiz: d.quiz }); draft = null; render(); toast('Calendar saved'); chime && chime('c');
    };
  }

  function badge() {
    var b = document.getElementById('lesBadge'); if (!b || !pid) return;
    var n = (H.todo(pid) || []).length; b.hidden = !n; b.textContent = n;
  }

  /* ---------- a lesson = the Moment's story ---------- */
  var CUR = null;
  function openLesson(id, date, rev) {
    if (!S.owned[id]) { S.owned[id] = Date.now(); save(); }
    CUR = { id: id, key: rev ? 'r:' + id + ':' + date : id };
    openStory(id);
  }
  new MutationObserver(function () {
    if (!CUR) return;
    var st = document.querySelector('.story .sb-end');
    if (st && pid) {
      var was = H.prog(pid).l[CUR.key];
      H.mark(pid, 'l', CUR.key, H.today());
      if (!was) setTimeout(function () { toast('Lesson done ✓'); }, 600);
      CUR = null; render();
    } else if (st) CUR = null;
  }).observe(document.body, { childList: true, subtree: true });

  /* ---------- the weekly quiz ---------- */
  function quiz(n) {
    var w = H.weeks().find(function (x) { return x.n === n; }); if (!w) return;
    var qs = w.lessons.map(function (L) { var m = BY[L.id]; return m && m.q ? { m: m, q: m.q } : null; }).filter(Boolean);
    var i = 0, right = 0;
    function step() {
      if (i >= qs.length) return end();
      var x = qs[i];
      openModal('<div class="zquiz" role="group" aria-label="Question ' + (i + 1) + ' of ' + qs.length + '"><small>Week ' + n + ' quiz · question ' + (i + 1) + ' of ' + qs.length + '</small><p class="zqm">' + esc(x.m.title) + ' · ' + x.m.yr + '</p><h3>' + esc(x.q[0]) + '</h3>' +
        x.q[1].map(function (o, k) { return '<button class="zopt" data-k="' + k + '">' + esc(o) + '</button>'; }).join('') + '<p class="zfb" aria-live="polite"></p></div>');
      var box = document.querySelector('#modal .zquiz');
      box.querySelectorAll('.zopt').forEach(function (b) {
        b.onclick = function () {
          if (box.dataset.done) return; box.dataset.done = 1;
          var ok = +b.dataset.k === x.q[2]; if (ok) right++;
          box.querySelectorAll('.zopt').forEach(function (o) { o.disabled = true; if (+o.dataset.k === x.q[2]) o.classList.add('right'); });
          if (!ok) b.classList.add('wrong');
          tone(ok ? 784 : 220, 0, .12);
          box.querySelector('.zfb').innerHTML = (ok ? '<b>Right!</b>' : '<b>Not quite.</b> It’s “' + esc(x.q[1][x.q[2]]) + '”.') + '<button class="btn" id="zqNext">' + (i + 1 < qs.length ? 'Next question' : 'See my score') + '</button>';
          var nx = document.getElementById('zqNext'); nx.focus(); nx.onclick = function () { i++; step(); };
        };
      });
    }
    function end() {
      var pass = right >= 2, before = pid ? H.prog(pid).q[n] : null, first = pass && !(before >= 2);
      if (pid) H.mark(pid, 'q', String(n), right);
      if (first) { S.caps++; save(); renderAll(); chime && chime('l'); confetti && confetti(80); }
      openModal('<div class="zquiz zend"><small>Week ' + n + ' quiz</small><div class="zbig">' + right + '/' + qs.length + '</div><h3>' + (pass ? (first ? 'You earned a time capsule!' : 'Passed!') : 'So close. Read the stories again and retry.') + '</h3>' +
        (pass ? '<button class="btn" id="zqCap">' + (first ? 'Open it in Capsules' : 'Back to lessons') + '</button>' : '<button class="btn" id="zqRe">Try again</button>') + '</div>');
      var a = document.getElementById('zqCap'), r = document.getElementById('zqRe');
      if (a) a.onclick = function () { closeModal(); go(first ? 'caps' : 'les'); };
      if (r) r.onclick = function () { i = 0; right = 0; step(); };
      render();
    }
    step();
  }

  /* re-render when the tab opens */
  var _ra = renderAll; renderAll = function () { _ra(); if (tab === 'les') render(); };
  window.zRenderLessons = render;
  badge();

  /* links from the app's Home: museum/#lessons, #lesson=m21@2026-11-25, #quiz=3 */
  function route() {
    var h = location.hash.slice(1); if (!h) return;
    if (/^lessons|^quiz|^lesson/.test(h)) go('les');
    var m = h.match(/^lesson=(m\d+)@(\d{4}-\d\d-\d\d)(r?)/); if (m) setTimeout(function () { openLesson(m[1], m[2], !!m[3]); }, 300);
    var q = h.match(/^quiz=(\d+)/); if (q) setTimeout(function () { quiz(+q[1]); }, 300);
    try { history.replaceState(history.state, '', location.pathname); } catch (e) {}
  }
  route();
})();
