# THE WHATEVER GAME

*A game that refuses to pick a genre. Now it refuses twenty-eight times.*

One orb. One finger. Every ~16 seconds reality glitches and the game **morphs into a different genre mid-play** — you keep your position, momentum, score and hearts through every mutation. The game has opinions about all of this and shares them constantly.

## What's inside

**28 genres:** runner (HOP) · cave-flier (FLAP) · twin-stick shooter (BLAST) · breakout where *you are the ball* (PADDLE) · snake (TRAIL) · rhythm (BEAT) · traffic-hopping (FROG) · tower building (STACK) · bullet-graze ballet (DODGE) · memory patterns (COPY) · tile-flipping (FLIP) · orbit-swinging (ORBIT) · mini-golf (GOLF) · whack-a-mole (WHACK) · fruit-slicing (SLICE) · mirror-match (MIRROR) · fishing (FISH) · button-mashing sumo (SUMO) · asteroid dodging (ASTRO) · pachinko (PLINKO) · base defense (DEFEND) · wall-climbing (CLIMB) · dot-eating (EAT) · laser-reflecting (LASER) · rhythm-parrying (PARRY) · a Pac-Man-style maze chase (MAZE) · a Spider-Man-style grapple swing (SWING) · and a full-on glitch mode (∅ FLUX) — plus, with no warning at all, **a cat sometimes appears and the only objective is to pet it** (PET). Mind the tail.

**3 rotating bosses** after every full cycle: **VS PONG** (first to 3, it *can* miss now), **THE CURSOR** (dodge its clicks, tap it while it thinks), and the **WORM KING** (chase the golden tail, avoid everything else).

**7 worlds** reskin each cycle: Neon City, Deep Space (low gravity), The Deep (underwater), Lava Core (faster), Retro Arcade (CRT green + scanlines), Glitch Void (reality leaks, mutators doubled), and Candy Core (sticky, pastel, suspicious).

**Mutators** roll on modes from cycle 2: TINY BIT, GIANT BIT, TURBO, LIGHTS OUT (spotlight only), GOLD RUSH (2× score), SLOW MO (a breather, at a price).

**Surprises:** coin rain, mystery gifts (magnet · 2× score · shield · heart · disappointment), a golden ghost worth chasing, a rare TIME WARP (a few seconds of grace), score-milestone fireworks.

## Competing (the important part)

- **HALL OF WHATEVER** — the in-game leaderboard. Arcade-style initials entry (tap the letter grid or just type), crowns for the top 3, your new entry glows. The game taunts accordingly.
- **VS — pass & play** — two players, one device. Both runs use the **same seeded universe**, so the obstacle rolls are identical: same layout, same luck, pure skill diff. Loser serves in the rematch. The result screen does not spare feelings.
- **DAILY CHALLENGE** — one shared seed per day. Everyone who plays that day gets the exact same universe; retries stay locked to that same seed, so bragging about a daily score is an actual fair comparison, not luck.
- **BADGES** — 12 achievements (Genre Hopper, Untouchable, Void Walker, Triple Threat, Hall Legend, and more), tracked live on the title screen and saved across sessions.
- **BRAG** — one tap shares your score via the system share sheet (or clipboard) so you can challenge people who aren't in the room.

Desktop: **Space/W/↑** act, **arrows/WASD** move, **V** = VS, **L** = Hall, **S** = Survival, **D** = Daily, **Esc** = quit to menu (also backs out of the leaderboard entry screen and the VS hand-off screen), **M** = mute. Mobile: one finger does everything, portrait or landscape — tap **✕ MENU** in the corner any time to bail back to the title screen mid-run, or the 🔊 icon next to it to mute.

Your best score, Hall of Whatever entries, and earned badges are saved on-device (a safe storage wrapper that no-ops instead of crashing in sandboxed/preview contexts where browser storage is blocked) — they survive closing and reopening the app, not just the current session.

Everything is procedural — art, SFX, and the per-genre backing track (kick/hat/bass at each mode's bpm). No assets, no network, no dependencies. **One HTML file.**

## Two builds

- **`TheWhateverGame.html`** — the dev/test build. Has an ∞ TEST MODE switch (infinite lives + a skip-to-next-genre button) for trying things out without dying constantly.
- **`TheWhateverGame-release.html`** — the store build. Identical game, ∞ TEST MODE fully removed. **Ship this one, not the dev file.**

## Run it

**Browser:** double-click either HTML file. Works offline.

**Host it:** upload `TheWhateverGame-release.html` to any static host — GitHub Pages, Netlify, itch.io (HTML5 game). No build step.

## Ship it to the App Store / Google Play

Full step-by-step walkthrough, with the icon/feature graphic/screenshots/store text/privacy policy already prepared: see **`PLAYSTORE_GUIDE.md`** and the **`store/`** folder.

Quick version (Android, via Capacitor):

```bash
mkdir whatever-app && cd whatever-app
npm init -y
npm install @capacitor/core @capacitor/cli
npx cap init "The Whatever Game" com.mesteren.whatevergame --web-dir=www
mkdir www && cp ../TheWhateverGame-release.html www/index.html

# Android (needs Android Studio)
npm install @capacitor/android && npx cap add android && npx cap open android
# → Build > Generate Signed App Bundle → Play Console

# iOS (needs Xcode + Apple Developer account)
npm install @capacitor/ios && npx cap add ios && npx cap open ios
# → Product > Archive → App Store Connect
```

Store pitch: *"28 games in one. It morphs mid-play. The first game with commitment issues."* Category: Arcade. Full store description, icon, feature graphic, screenshots, and privacy policy are all in `store/` — see `PLAYSTORE_GUIDE.md` for exactly where each one goes.

### Wrapped-app upgrades
- **Online leaderboard:** `addToBoard()` is the single funnel — POST the entry to any backend there and merge results into `LB`, on top of the existing on-device save.
- **Haptics:** `@capacitor/haptics` on `hurt()` and PERFECT hits.
- **Cloud save:** swap the `loadSave`/`writeSave` pair for `@capacitor/preferences` (or any cloud-synced store) to carry progress across devices.

## Tuning map (for future tinkering)

All knobs live at the top of each `Mode*` object. `G.modeDur` (16s) is the attention span; `G.speedMul` ramps per morph and per world. `WORLDS` holds palettes/physics per world, `AFFIXES` the mutators, `EVENT_DEFS` the surprises, `QUIPS` the personality. Fairness laws: 0.8s grace on every morph, obstacles never spawn beyond jump physics, bosses all have boredom timers, and the seeded RNG (`rand`) is gameplay-only — visuals roll `vrand` so VS seeds stay fair.

Built by Claude for Mesteren, July 2026. The cat forgives you in advance.
