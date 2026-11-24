# Basepaths / BigDawgz Dugout — new design: handoff (Nov 24, 2026)

## What this is
- **New app (test copy):** repo `KeeganBeckstrom-CU/bigdawgz-dugout-next` → https://keeganbeckstrom-cu.github.io/bigdawgz-dugout-next/
- **Live app the kids use:** repo `KeeganBeckstrom-CU/bigdawgz-dugout`. **Do not touch it.** The new app will replace it later so players only have to reload.
- Goal: every function of the old app, in the painted-park design. Test copy runs on sample data (`window.DZ_NET=null`, no Supabase).

## Keegan's rules
- Free tools only. Google Flow's free Nano Banana image model is OK (used in his Chrome, project "Nov 23 - 16:58"). No Veo or credits, no paid anything.
- No white backgrounds; images blend into the backdrop.
- Don't enter passwords for him.
- He tests on his phone. Test with Playwright, iPhone 13 emulation, local server: `cd repo && setsid nohup python3 -m http.server 8765 &`
- Commit as Keegan Beckstrom <KeeganBeckstrom-CU@users.noreply.github.com>, push with `git -c push.negotiate=true push -q origin main`.

## How the app is built
- **Park (home screen):** `index.html` + `assets/park.js/.css`. Painted field with signs: Scoreboard, Bullpen, Clubhouse, **Museum** (new), Daily chest; dock: Locker, Cards, PLAY, Packs, Museum.
- **Team app:** `app/index.html` is the old app's whole code (the "engine"), unchanged except `DZ_NET=null` and boot `setTimeout(render,0)` (fixed a crash that broke Coach's View buttons). New look is layered on top by overriding its globals:
  - `assets/app-screens.js/.css` — new Home (today's homework + history lessons), My Card, Coach's View tabs, drill Watch/Do/Send steps, due-date picker (`zDates`).
  - `assets/app-paint.js` — painted icons, sign-in screen, sends lib/finder/prog/play/club/film to the new pages, hash routing (`app/#coach`, `#p3`, `#go=view`, `#a=action`, `#signin`).
  - `assets/app-theme.css` — wood theme for the old engine's screens.
  - `assets/pack-open.js/.css` — pack opening: tap the pack to open; cards deal into side-by-side rows; flip, holo shine.
  - `assets/search.js` — app-wide search (places, games, drills).
  - `assets/profile.js` — reads/writes the signed-in player from the team save `localStorage['dugout12u-v3']`.
- **Bullpen / drill library:** `bullpen/` + `assets/drills/drills.js/.css/data.js` (187 drills). Library home is now the **field map**: tap a spot (mound = Pitching, plate = Hitting, infield, bullpen = Arm Care…) and its drills slide up; Anywhere/Indoors/Backyard/Field filter; finder, Cleary Throwing Program and Skill Paths below.
- **Clubhouse:** `clubhouse/index.html` + `assets/clubroom.js/.css` + art `assets/img/clubhouse-room.webp`. MLB The Show-style room you swipe around; spots: TV = Film Room, arcade = Arcade, whiteboard = Challenges, couch = Head-to-Head, trophy case = Leaderboards, table = Cards, floor cards = Trades, lockers = My Locker. Player card on top.
- **Museum ("Hall of Moments", Keegan's artifact brought in):** `museum/index.html` (+ ~300 images in `museum/img/`), reskinned by `museum/museum-app.css/.js` (app top bar, Back that always works, app bottom bar, accessibility, Space/arrow keys in stories) and `museum/museum-history.js`.
- **12U Road to Cooperstown history lessons:** `assets/history-plan.js` (`window.BPH`) + `assets/moments.js` (100 Moments in history order). Coach sets start date, Cooperstown date, 3 lesson days, quiz day on the museum's **Lessons** tab. 3 lessons/week on different days, quiz at end of week (2 of 3 = a time capsule). Shows on Home. On only for 12U (`bp-hist-on`). Test copy has sample dates Nov 23 2026 → Jul 17 2027.

## Done in this chat (all pushed, last commit 44a2bef)
Assign uses a due-date picker (no "due in N days"); tap-to-open packs with spread-out cards; Museum on the field + in the app design; museum numbers cleaned up; Space bar pages stories; history lessons + weekly quiz; drill library field map; Clubhouse room.

## Open items / next ideas
- **Before going live:** coach's lesson calendar, players' lesson/quiz progress, and museum capsules live only in each phone's storage. They need to be connected to the team data (Supabase) so the coach's dates reach the kids' phones.
- Swap the new app in for the live one when Keegan says it's ready.
- Other screens not yet redesigned beyond the theme: Scoreboard/schedule, Locker, Coach's View inner tabs, Film Room page.
- NIL note: the cards use real MLB players' names; fine for the team, but selling it would need licenses (MLB + MLBPA) or fictional/BigDawgz players.
