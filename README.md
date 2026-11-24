# bigdawgz-dugout-next

Basepaths, the new BigDawgz Dugout app, built from scratch.

**Live test site:** https://keeganbeckstrom-cu.github.io/bigdawgz-dugout-next/

## What's here

- `index.html`: the home screen, the painted Toon Park. Tap a sign, the chest or a bottom-bar item and the camera dives in, then that section's page opens.
- `bullpen/`: the drill library. All 187 drills from the old app (same steps, cues, games, equipment and YouTube clips with their start and end times), search, category tiles, Living Room, filters, "What do you want to work on?" plans, Skill Paths and the Cleary Throwing Program. Data in `assets/drills/data.js`, code in `assets/drills/drills.js`. Links: `#finder`, `#program`, `#path/gb`, `#d/<drill id>`.
- `clubhouse/film.html`: the Film Room videos (+10 XP each).
- `more/`: the coach's More screen (the ⋯ button on the park). Film review, player videos, video database, high scores, drill inbox, video review, add a drill, cards, Film Room, player profiles, settings. Tools that need team accounts open `more/soon.html?t=`.
- `clubhouse/`: the Team Clubhouse (park sign). Tiles for Arcade, Cards, Trades, Challenges, Leaderboards, Head-to-Head and Film Room. `leaders.html` shows your best score per game; `soon.html?t=` holds the sections that need team accounts.
- `play/`: the Arcade (inside the Clubhouse, and the PLAY button). All 18 games from the old app with the same question banks, levels (Easy, Medium, Hard, Expert), clocks, strikes, XP and high scores, redrawn in the painted style.
  - `play/index.html` is the game list, `play/game.html?g=trivia` (etc.) plays one game.
  - `assets/arcade/data.js` holds every question bank and setting, copied from `bigdawgz-dugout`.
  - `assets/arcade/engine.js` runs the games, `assets/arcade/arcade.css` is the look.
  - Progress (XP, best scores, high scores) is saved on the device for now (`assets/profile.js`), until accounts come back.
- `play/fx.html?g=derby` (and `bases`, `glove`, `ace`, `corn`): five play-through games in full painted scenes (Home Run Derby, Run the Bases, Gold Glove, Ace, Can of Corn). Each one teaches while you play. Code in `assets/arcade/fx.js` and `fx.css`; scenes and players in `assets/img/fx/`.
- One folder per section still to build, each a work-in-progress page:
  `bullpen/` (drills), `scoreboard/` (team), `daily/` (daily task), `locker/`, `cards/`, `packs/`, `museum/`.
- `assets/`: styles, scripts and all the painted art (made in Google Flow).

Every link is relative, so the whole folder works at any address.

## Moving it to the real app

When it's ready, copy everything in this repo into `bigdawgz-dugout` (replacing what's there) and push.
The address stays https://keeganbeckstrom-cu.github.io/bigdawgz-dugout/, so players just reload.
Bring over any Supabase sign-in and data code you still want from the old app before you replace it.
