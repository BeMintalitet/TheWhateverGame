# THE WHATEVER GAME

**A game that refuses to pick a genre. So it picks all of them.**

[▶ Play it in your browser](https://bemintalitet.github.io/TheWhateverGame/play.html) ·
[Site](https://bemintalitet.github.io/TheWhateverGame/) ·
[Privacy policy](https://bemintalitet.github.io/TheWhateverGame/privacy.html)

Every few seconds the entire game changes underneath you — platformer, shoot-em-up,
brick breaker, rhythm game, maze chase, grappling hook, fishing, sumo, golf, plinko,
tower defence. No loading screen, no menu between them. You just have to keep up.

| | |
|---|---|
| Genres | **31** |
| Bosses | **4** |
| Worlds | **9** |
| Badges | **1063** |
| Skins | **104** |

Everything is one self-contained HTML file. No build step, no framework, no assets —
the art, the music and all 104 character skins are generated procedurally at runtime.

---

## Repository layout

| Path | What |
|---|---|
| `TheWhateverGame.html` | **Dev build.** Has ∞ TEST MODE. Edit and test in this one. |
| `TheWhateverGame-release.html` | **Store build.** Test mode permanently stripped. |
| `twg-studio/` | The shipping console — build, verify, manage AdMob IDs, launch checklist |
| `android-app/` | Capacitor + Android project (AdMob, signing, R8) |
| `build/harness/` | Headless regression suite — runs the game in Node with a canvas stub |
| `build/mod/` | Readable source-of-record for the meta/skin/achievement/ad modules |
| `store/` | Play Console copy, privacy policy, icons, screenshots |
| `docs/` | The GitHub Pages site (landing, playable build, privacy policy) |

## Building the Android app

```
twg-studio\START.bat
```

Opens a control panel at `localhost:4747`. It checks the toolchain, manages the AdMob
IDs, strips test mode, syncs Capacitor, runs Gradle, and then runs the full regression
suite against the HTML that actually ends up inside the APK — and refuses to report
success if anything fails.

Requires Node and Android Studio (for its bundled JDK and the SDK). Details in
[`PLAYSTORE_GUIDE.md`](PLAYSTORE_GUIDE.md).

## Testing

```
cd build\harness
node run.js ..\..\TheWhateverGame-release.html all
```

Seven suites: boot, every mode in three orientations, meta/save round-trip, pause and
ad-interruption safety, ad policy gates, a long randomised stress run with resize
storms, and seed determinism. The canvas stub fails the run on any non-finite draw
argument, which is how geometry bugs get caught without a renderer.

## Not in this repo

The upload keystore, its password, and the TWG Studio OAuth tokens are gitignored and
must never be committed.

---

Built by Benjamin Foss Kristoffersen. Free, ad-supported, no accounts, no analytics,
works offline.
