# bigdawgz-dugout-next

Basepaths, the new BigDawgz Dugout app, built from scratch.

**Live test site:** https://keeganbeckstrom-cu.github.io/bigdawgz-dugout-next/

## What's here

- `index.html`: the home screen, the painted Toon Park. Tap a sign, the chest or a bottom-bar item and the camera dives in, then that section's page opens.
- One folder per section, each a work-in-progress page to build out on its own:
  `bullpen/` (drills), `scoreboard/` (team), `daily/` (daily task), `locker/`, `cards/`, `play/` (games), `packs/`, `museum/`.
- `assets/`: styles, scripts and all the painted art (made in Google Flow).

Every link is relative, so the whole folder works at any address.

## Moving it to the real app

When it's ready, copy everything in this repo into `bigdawgz-dugout` (replacing what's there) and push.
The address stays https://keeganbeckstrom-cu.github.io/bigdawgz-dugout/, so players just reload.
Bring over any Supabase sign-in and data code you still want from the old app before you replace it.
