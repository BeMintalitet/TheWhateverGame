# Play Console listing — THE WHATEVER GAME

Everything below is ready to paste. Character counts are given against Google's limits.

---

## App name (30 max)

```
THE WHATEVER GAME
```
`17/30`

## Short description (80 max)

```
31 games in one. It morphs mid-run and never asks permission. Good luck.
```
`71/80`

## Full description (4000 max)

```
THE WHATEVER GAME cannot pick a genre. So it picks all of them.

You are a small round thing called Bit. Every few seconds the entire game changes
underneath you — platformer, shoot-em-up, brick breaker, rhythm game, snake, maze
chase, grappling hook, fishing, sumo, golf, plinko, tower defence — and you have to
keep up. No tutorial screens. No menus between rounds. Just one continuous, escalating
identity crisis.

WHAT'S IN IT
• 31 genres, each a complete little game, all shuffled into one run
• 4 boss fights that break the rules on purpose
• 9 worlds that change gravity, speed and the entire mood
• 6 mutators that get rolled onto genres at random
• A cat. It shows up sometimes. Pet the cat.
• ∅ VOID — the mode where the rules stop working

PROGRESSION THAT ACTUALLY GOES SOMEWHERE
• Over 1000 badges to earn, from "score 500" to things you will not find by accident
• 104 hand-designed skins for Bit — crowns, wings, lava cracks, holograms, a void cat —
  unlocked through badges or bought with bits you earn by playing
• Mastery levels for every single genre
• A player rank that climbs the whole time you play
• Three fresh contracts every day, plus a login streak that pays out

MODES
• IDENTITY CRISIS — the main event. Everything, forever, faster.
• SURVIVAL — pick one genre and see how long you last as it turns on you
• DAILY CHALLENGE — everyone in the world gets the same seed today. No excuses.
• VS — pass and play on one phone. Same universe for both players.

BUILT FOR PHONES
• One thumb. Portrait. Pick it up for ninety seconds or an hour.
• Works completely offline
• Real pause, a proper back button, and a reduced-flashing mode
• Nothing is behind a paywall — there is no paywall

Free, with ads on the menus and between runs. Never during a run. You can watch an
optional video to keep a run going, but you never have to.

It's called THE WHATEVER GAME because that's the only honest name for it.
```
`~2050/4000`

---

## Categorisation

| Field | Value |
|---|---|
| App or game | **Game** |
| Category | **Arcade** |
| Tags (max 5) | Arcade, Casual, Action, Single player, Offline |
| Contains ads | **Yes** |
| In-app purchases | **No** |
| Free or paid | **Free** |

---

## Content rating questionnaire (IARC)

Answer exactly this — the rating is void if any answer is wrong.

| Question | Answer | Why |
|---|---|---|
| Category | Game | |
| Violence — realistic | **No** | abstract shapes only |
| Violence — cartoon/fantasy | **Yes, mild** | you shoot geometric enemies; no characters, no blood, no injury depicted |
| Blood / gore | No | |
| Sexuality / nudity | No | |
| Language | No | mild snark only ("skill issue"); no profanity |
| Controlled substances | No | |
| **Simulated gambling** | **No** | PLINKO is a score-payout minigame. No wagering, no currency staked, no chance-based purchase, no loot boxes. Bits are earned only by playing and buy cosmetics at a fixed, visible price. |
| Horror / fear | No | |
| User interaction | **No** | fully offline, no chat, no accounts, no sharing of user content |
| Shares location | No | |
| Allows purchases | No | |
| **Contains ads** | **Yes** | AdMob banner + interstitial + rewarded |
| Miscellaneous | Flashing imagery: **Yes** — declare it. The game ships a reduced-flashing setting. |

Expected outcome: **PEGI 3 / ESRB Everyone / USK 0**, with an "in-app ads" notice.

---

## Data safety form

Google's form, section by section.

**Does your app collect or share any of the required user data types?** → **Yes**
(the ad SDK does, and that counts as yours).

**Is all of the user data collected by your app encrypted in transit?** → **Yes**

**Do you provide a way for users to request that their data is deleted?** → **Yes**
(uninstall / clear app data; the policy documents it and gives a contact address)

### Data types to declare

| Data type | Collected | Shared | Purpose | Optional? |
|---|---|---|---|---|
| **Device or other IDs** | Yes | Yes | Advertising or marketing; Fraud prevention, security, and compliance | Not optional |
| **Approximate location** | Yes | Yes | Advertising or marketing | Not optional |
| **App interactions** (ad impressions/clicks) | Yes | Yes | Advertising or marketing; Analytics | Not optional |
| **Diagnostics** (device model/OS) | Yes | Yes | Advertising or marketing | Not optional |

Declare **nothing else**. In particular do NOT declare Personal info, Financial info,
Messages, Photos, Files, Contacts, Calendar, Health, or Web browsing — none are touched.

> Scores, badges, skins and stats are stored only on the device and are never
> transmitted, so under Google's own definition they are **not** "collected" and must
> not be listed.

**Advertising ID declaration** (separate page in Play Console): tick
**"My app uses advertising ID"**, purposes: *Advertising or marketing* +
*Analytics*.

---

## Ads declaration & policy checklist

- [x] "Contains ads" toggled on in the store listing
- [x] `com.google.android.gms.permission.AD_ID` present in the manifest
- [x] Google UMP consent flow shown before the first ad request (GDPR/EEA/UK)
- [x] No ad ever renders during gameplay
- [x] Interstitials only after a run ends, rate-limited (min 3 runs AND 90 s apart)
- [x] Rewarded ads are opt-in, clearly labelled, and always pay out
- [x] The close button on every ad is unobstructed (AdMob renders it natively)
- [x] No ad is placed under a button the player is about to tap
- [x] App is not enrolled in Designed for Families; ad content rating set to **T** (13+ audience — G is for under-13 apps and costs ~50% of revenue for no benefit)

Set the ad content rating in AdMob → App settings → **Maximum ad content rating: T**.

---

## Target audience & content

| Field | Value |
|---|---|
| Target age groups | **13–15, 16–17, 18+** (do **not** tick under-13 — that triggers Families policy and a much stricter ad regime) |
| Appeals to children? | No |
| Ads in app | Yes |
| Store listing pre-check | No child-directed imagery |

---

## Government apps / financial features / health

All **No**. This is an arcade game.

---

## App access

**All functionality is available without special access.** No login, no region lock,
nothing gated. Say exactly that in the box.

---

## Graphic assets checklist

| Asset | Spec | File |
|---|---|---|
| App icon | 512×512 PNG, 32-bit, no alpha | `icons/icon-512.png` |
| Feature graphic | 1024×500 PNG/JPG, no alpha | `icons/feature-graphic-1024x500.png` |
| Phone screenshots | 2–8, 1080×1920 portrait | `screenshots/*.png` |
| Adaptive launcher icon | 1024×1024 source | `icons/icon-1024.png` |

**Re-capture the screenshots before you submit.** The existing set predates the skins,
badges and profile screens. A good eight: title, badges list, skins grid, profile/mastery,
two or three genres, one boss, one world with a mutator banner.

---

## Release notes (first release)

```
First release.

31 genres, 4 bosses, 9 worlds, over 1000 badges and 104 skins to unlock.
It still refuses to pick a genre.
```
