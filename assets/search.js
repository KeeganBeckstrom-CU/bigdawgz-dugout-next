/* Find anything: one search for every place, tool, game and drill in the app.
   Adds a search button to the page header (or the park's top bar) and opens a full-screen search. */
(function () {
  var me = document.currentScript && document.currentScript.src || '';
  var BASE = me.replace(/assets\/search\.js.*$/, '');
  var IMG = BASE + 'assets/img/';
  var who = null; try { who = (JSON.parse(localStorage.getItem('dugout12u-v3') || 'null') || {}).who || null; } catch (e) {}
  var coach = who === 'coach', parent = who === 'parent', player = !!who && !coach && !parent;
  var A = function (h) { return BASE + 'app/#' + h; };
  /* [title, where/what, icon, link, extra words, who can see it: a=anyone p=player c=coach f=parent] */
  var PLACES = [
    ['The park', 'Home screen', 'team-logo', BASE, 'home main start', 'a'],
    ['Sign in or switch player', 'Who is using the app', 'team-logo', A('signin'), 'login account profile switch', 'a'],
    ["Today's homework", 'Your to-do for today', 'chest', A('go=home'), 'home daily task todo assignments due', 'p'],
    ['My Card', 'Your player card, badges, skills', 'cat/star', A('go=me'), 'profile badges streak saved drills', 'p'],
    ['My XP', 'Level, XP and what to spend', 'coin', A('go=xp'), 'level points experience spend bank', 'p'],
    ['Locker', 'Gear and jersey', 'glove', A('go=locker'), 'gear jersey cleats bat items', 'pc'],
    ['Dugout Cards', 'Shop, binder, squad', 'binder', A('go=cards'), 'cards collection packs shop squad binder trading', 'pc'],
    ['Open a card pack', 'Rookie Rush, All-Star Surge and more', 'pack', A('go=cards'), 'packs rip open buy', 'pc'],
    ['Card guide', 'Rarity, parallels, autographs', 'binder', A('go=cguide'), 'museum guide rarity parallels autos', 'pc'],
    ['Leaderboards', 'Top scores on the team', 'trophy', A('go=boards'), 'rank leaders top scores', 'a'],
    ['My high scores', 'Your best in every game', 'cat/star', A('a=hsp:me'), 'best scores records', 'p'],
    ['Trades', 'Swap cards with teammates', 'chest-open', A('go=trade'), 'trade swap cards', 'p'],
    ['Challenges', "Beat a teammate's score", 'bats', A('go=chal'), 'challenge dare compete', 'p'],
    ['Head-to-Head', 'Play live, same time', 'glove', A('go=duel'), 'duel versus live 1v1', 'p'],
    ['Dugout Live', "Coach's live trivia game", 'scoreboard', A('go=live'), 'live trivia game show', 'a'],
    ['My other sports', 'Soccer, hoops, anything', 'cat/ath', A('go=osp'), 'other sports soccer basketball football hockey', 'pf'],
    ['Schedule', 'Practices and games', 'scoreboard', A('go=sched'), 'calendar games practice events when where', 'pf'],
    ['Bullpen', 'All drills', 'bats', BASE + 'bullpen/', 'drills library practice videos', 'a'],
    ['What do you want to work on?', 'Pick a goal, get a plan', 'cat/goal', BASE + 'bullpen/#finder', 'goals plan finder improve', 'a'],
    ['Cleary Throwing Program', 'Warm-up, throw, arm care', 'cat/throw', BASE + 'bullpen/#program', 'throwing program arm care cleary warm up plyo', 'a'],
    ['Skill paths', 'Beginner to advanced', 'cat/path', BASE + 'bullpen/#path/gb', 'paths levels progression', 'a'],
    ['Living room drills', 'Drills you can do inside', 'cat/inside', BASE + 'bullpen/', 'inside indoor home living room', 'a'],
    ['Arcade', '23 baseball games', 'games/derby', BASE + 'play/', 'games play fun', 'a'],
    ['Clubhouse', 'Arcade, cards, trades, film', 'trophy', BASE + 'clubhouse/', 'clubhouse hub', 'a'],
    ['Film Room', 'Fun videos that teach the game', 'cat/film', BASE + 'clubhouse/film.html', 'videos watch movies film', 'a'],
    ["Coach's View", 'Players and progress', 'team-logo', A('coach&go=team'), 'coach team players progress roster', 'c'],
    ['Masterfile', 'Roster, logins, parents', 'binder', A('coach&go=team&a=ct:master'), 'roster add player logins parents approve', 'c'],
    ['Money', 'Season fees and payments', 'coin', A('coach&go=team&a=ct:money'), 'payments dues fees venmo money owed', 'c'],
    ['Cooperstown fundraiser', 'Money raised for the trip', 'coin', A('coach&go=team&a=ct:money'), 'fundraiser cooperstown trip raised goal', 'cf'],
    ['20-week program', 'Weekly at-home plans', 'cat/path', A('coach&go=team&a=ct:program'), 'program plans weeks off days practice days', 'c'],
    ['Weekly plans', 'Every week, pick players, focus weeks', 'cat/path', A('coach&go=plans'), 'plans weeks focus', 'c'],
    ['Assign homework', 'Pick players, drills and the day', 'cat/goal', A('coach&go=assign'), 'assign homework send drills due date', 'c'],
    ['Team settings', 'Announcements, schedule, team name', 'cat/star', A('coach&go=team&a=ct:settings'), 'settings announcements schedule team name throwing lock', 'c'],
    ['Announcements', 'Post to everyone', 'scoreboard', A('coach&go=team&a=ct:settings'), 'announce post message news', 'c'],
    ['Player videos', 'Clips players sent you', 'cat/film', A('coach&go=team&a=bpvopen'), 'videos clips review uploads', 'c'],
    ['Video database', 'Every video and who watched', 'cat/film', A('coach&go=vdb'), 'videos watched views', 'c'],
    ['Drill inbox', 'Saved TikTok, Instagram, Facebook videos', 'chest-open', A('coach&go=inbox'), 'inbox tiktok instagram facebook saved', 'c'],
    ['Video review', 'Check every drill video', 'cat/film', A('coach&go=vrev'), 'review videos clips start', 'c'],
    ['Add a drill from a video', 'Paste a link', 'bats', A('coach&go=qdrill'), 'add drill link youtube new', 'c'],
    ['Add your own drill', 'Write a new drill', 'bats', A('coach&go=newdrill'), 'new drill create custom', 'c'],
    ['Arm care and pitch counts', 'Pitch Smart rest days', 'cat/arm', A('coach&go=arm'), 'pitch count rest arm pitching log outing', 'c'],
    ['Player high scores', 'Every player, every game', 'scoreboard', A('coach&go=hstab'), 'scores table players games', 'c'],
    ['More coach tools', 'Everything else', 'cat/star', BASE + 'more/', 'more tools coach extras', 'c'],
    ['My Player', "Your player's week", 'team-logo', A('parent&go=fam'), 'my player kid child week', 'f'],
    ['Payments', 'Season fee and Venmo', 'coin', A('parent&go=money'), 'pay venmo fee dues owed', 'f'],
    ['Account', 'Your settings', 'cat/star', A('go=acct'), 'account settings', 'cf']
  ];
  var GAMES = [['derby', 'Home Run Derby'], ['bases', 'Run the Bases'], ['glove', 'Gold Glove'], ['ace', 'Ace'], ['corn', 'Can of Corn'], ['trivia', 'Trivia Blitz'], ['swing', 'Barrel Up'], ['play', "Where's the Play?"], ['pos', 'Position Numbers'], ['signs', 'Signs'], ['steal', 'Steal or Stay'], ['cut', 'Cutoff Captain'], ['score', 'Scorebook Scramble'], ['word', 'Six Swings'], ['four', 'Four Bagger'], ['call', 'Make the Call'], ['count', 'Count It'], ['send', 'Send or Hold'], ['backup', 'Back It Up'], ['rbook', 'Rule Book'], ['rules', 'Rules'], ['stat', 'Stat Attack'], ['who', 'Who Am I?']];
  var FX = { derby: 1, bases: 1, glove: 1, ace: 1, corn: 1 };
  function ok(r) { return r === 'a' || !who || (player && r.indexOf('p') >= 0) || (coach && r.indexOf('c') >= 0) || (parent && r.indexOf('f') >= 0); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var drills = null, loading = false;
  function loadDrills(cb) {
    if (drills || loading) return cb && drills && cb();
    if (window.DRL) { drills = window.DRL.D; return cb && cb(); }
    loading = true; var s = document.createElement('script'); s.src = BASE + 'assets/drills/data.js';
    s.onload = function () { drills = (window.DRL || {}).D || []; loading = false; cb && cb(); }; document.head.appendChild(s);
  }

  var css = '.zs-ov{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;background:rgba(30,14,4,.78);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);font-family:Fredoka,system-ui,sans-serif;color:#fff4dc;animation:zsin .2s ease}' +
    '@keyframes zsin{from{opacity:0}}' +
    '.zs-top{display:flex;gap:8px;align-items:center;padding:calc(env(safe-area-inset-top,0px) + 12px) 14px 10px;max-width:520px;width:100%;margin:0 auto;box-sizing:border-box}' +
    '.zs-box{flex:1;min-width:0;display:flex;align-items:center;gap:8px;height:50px;padding:0 14px;border-radius:999px;background:linear-gradient(180deg,#8a5530,#6b3f1e);box-shadow:inset 0 0 0 2.5px #ffd35a,inset 0 0 0 5px #5a3418,0 6px 14px rgba(0,0,0,.4)}' +
    '.zs-box input{flex:1;min-width:0;height:100%;border:0;background:none;outline:none;color:#fff4dc;font:600 17px Fredoka,system-ui,sans-serif}.zs-box input::placeholder{color:#e8c99a}' +
    '.zs-x{flex:none;height:44px;padding:0 14px;border:0;border-radius:999px;background:rgba(90,52,24,.95);color:#fff4dc;font:700 15px Fredoka,sans-serif;cursor:pointer}' +
    '.zs-list{flex:1;overflow-y:auto;max-width:520px;width:100%;margin:0 auto;padding:4px 14px calc(env(safe-area-inset-bottom,0px) + 24px);box-sizing:border-box}' +
    '.zs-h{margin:14px 4px 6px;font-weight:700;font-size:13px;color:#ffe27a;text-transform:uppercase;letter-spacing:.05em}' +
    '.zs-r{display:flex;align-items:center;gap:12px;padding:10px 12px;margin-bottom:7px;border-radius:16px;text-decoration:none;color:#fff4dc;background:linear-gradient(180deg,#8a5530,#6b3f1e);box-shadow:inset 0 0 0 2px #a8703f,inset 0 0 0 4px #5a3418,0 4px 10px rgba(0,0,0,.3)}' +
    '.zs-r:active{transform:scale(.98)}.zs-r img{width:42px;height:42px;object-fit:contain;flex:none;filter:drop-shadow(0 3px 3px rgba(40,20,8,.4))}.zs-r img.rd{border-radius:50%}' +
    '.zs-r span{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.2}.zs-r b{font-weight:700;font-size:16px}.zs-r small{font-weight:500;font-size:12.5px;color:#f3d9ae}' +
    '.zs-r i{font-style:normal;font-weight:700;font-size:22px;color:#ffe3a8}.zs-e{padding:30px 10px;text-align:center;color:#f3d9ae;font-weight:500}' +
    '.zs-btn{flex:none;width:44px;height:44px;border:0;border-radius:50%;display:grid;place-items:center;background:rgba(90,52,24,.92);box-shadow:0 3px 8px rgba(40,20,8,.35);color:#fff4dc;cursor:pointer;padding:0}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var ov = null;
  function row(t, s, ic, href) { return '<a class="zs-r" href="' + href + '"><img ' + (/team-logo/.test(ic) ? 'class="rd" ' : '') + 'src="' + IMG + ic + '.png" alt=""><span><b>' + esc(t) + '</b><small>' + esc(s) + '</small></span><i>›</i></a>'; }
  function draw(q) {
    var L = ov.querySelector('.zs-list'); q = (q || '').trim().toLowerCase();
    var words = q.split(/\s+/).filter(Boolean), hit = function (txt) { txt = txt.toLowerCase(); return words.every(function (w) { return txt.indexOf(w) >= 0; }); };
    var places = PLACES.filter(function (x) { return ok(x[5]) && (!q || hit(x[0] + ' ' + x[1] + ' ' + x[4])); });
    var games = q ? GAMES.filter(function (g) { return hit(g[1] + ' game arcade ' + g[0]); }) : [];
    var dr = q && drills ? drills.filter(function (d) { return hit(d.n + ' ' + (d.aka || '') + ' ' + d.c + ' ' + (d.cl || '')); }).slice(0, 12) : [];
    var h = '';
    if (places.length) h += '<div class="zs-h">' + (q ? 'Places and tools' : 'Go anywhere') + '</div>' + places.slice(0, q ? 12 : 60).map(function (x) { return row(x[0], x[1], x[2], x[3]); }).join('');
    if (games.length) h += '<div class="zs-h">Games</div>' + games.map(function (g) { return row(g[1], 'Arcade game', 'games/' + g[0], BASE + 'play/' + (FX[g[0]] ? 'fx.html?g=' : 'game.html?g=') + g[0]); }).join('');
    if (dr.length) h += '<div class="zs-h">Drills</div>' + dr.map(function (d) { return row(d.n, (d.aka ? 'aka ' + d.aka + ' · ' : '') + d.t + ' min', 'cat/' + d.c, BASE + 'bullpen/#d/' + d.id); }).join('');
    L.innerHTML = h || '<div class="zs-e">Nothing found for “' + esc(q) + '”. Try “drills”, “cards”, “schedule” or a drill name.</div>';
  }
  function open() {
    if (ov) return;
    ov = document.createElement('div'); ov.className = 'zs-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Search the app');
    ov.innerHTML = '<div class="zs-top"><label class="zs-box"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input type="search" placeholder="Find anything: drills, cards, schedule…" autocomplete="off" enterkeyhint="search" aria-label="Search the app"></label><button class="zs-x" type="button">Close</button></div><div class="zs-list"></div>';
    document.body.appendChild(ov);
    var inp = ov.querySelector('input');
    inp.addEventListener('input', function () { draw(inp.value); });
    ov.querySelector('.zs-x').addEventListener('click', close);
    ov.addEventListener('click', function (e) { var a = e.target.closest('a.zs-r'); if (a) { var same = a.href.split('#')[0] === location.href.split('#')[0]; close(); if (same) { location.href = a.href; if (/#/.test(a.href)) { e.preventDefault(); location.hash = a.href.split('#')[1]; } } } });
    document.addEventListener('keydown', esc1);
    draw(''); setTimeout(function () { inp.focus(); }, 50);
    loadDrills(function () { if (ov) draw(inp.value); });
  }
  function esc1(e) { if (e.key === 'Escape') close(); }
  function close() { if (ov) { ov.remove(); ov = null; } document.removeEventListener('keydown', esc1); }
  window.zSearch = open;

  /* the app's own 🔎 button opens this search */
  window.addEventListener('click', function (e) { var b = e.target.closest('[data-a="xsrch"],[data-zsearch]'); if (!b) return; e.preventDefault(); e.stopImmediatePropagation(); open(); }, true);
  /* add a search button to page headers that don't have one */
  function addBtn() {
    var hd = document.querySelector('.ghead,.hud'); if (!hd || hd.querySelector('[data-zsearch]')) return;
    var b = document.createElement('button'); b.className = 'zs-btn'; b.type = 'button'; b.setAttribute('data-zsearch', ''); b.setAttribute('aria-label', 'Search the app');
    b.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';
    var before = hd.querySelector('#mute') || hd.querySelector('.coins'); if (before) hd.insertBefore(b, before); else hd.appendChild(b);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addBtn); else addBtn();
  new MutationObserver(addBtn).observe(document.documentElement, { childList: true, subtree: true });
})();
