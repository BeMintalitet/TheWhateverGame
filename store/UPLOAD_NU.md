# Upload nu — trin for trin

AdMob er færdig. Herfra er der tre ting tilbage: **byg**, **udfyld Play Console**,
**lukket test**. Regn med 60-90 minutter aktivt arbejde, plus 14 dages ventetid.

---

## Nøglens adgangskode (du spurgte)

```
qKX#0cxmQxGABUEyTeD!Np?Wq/=O
```

Den ligger i klartekst i:

```
android-app\android\keystore.properties
```

Samme kode bruges til både **store password** og **key password**. Alias er
`whatevergame`. Nøglefilen selv er `android-app\android\upload-keystore.jks`
(4096-bit RSA, gyldig til 2053, SHA-1 `E8:01:0E:03:12:AC:5F:63:63:A4:5A:63:2B:6B:2C:DD:A8:1A:A0:69`).

> **Kopiér begge filer et sted hen i dag.** De ligger kun på denne PC og er bevidst
> holdt ude af GitHub. Gradle bruger dem automatisk, så du skal normalt aldrig
> indtaste koden i hånden — men mister du dem, skal du igennem en Play-supportsag
> for at få en ny upload-nøgle.

---

## Navnet til uploaden

Der er to felter, og folk blander dem sammen:

| Felt | Værdi | Hvor |
|---|---|---|
| **App name** (det brugerne ser) | `THE WHATEVER GAME` | Store listing |
| **Release name** (kun til dig) | `1.0 (1)` | Closed testing → Create release |

Release-navnet er internt. Play foreslår selv `1 (1.0)` — skriv `1.0 (1)` i stedet,
så matcher det versionName og versionCode og du kan læse historikken om et år.

---

## 1. Byg (2 minutter)

Dobbeltklik `twg-studio\START.bat` → **BUILD RELEASE**.

Den strippper test mode, synkroniserer Capacitor, kører Gradle, og kører derefter hele
regressionssuiten mod den HTML der faktisk havner i APK'en. Melder den ikke grønt,
så upload ikke.

Filen du skal bruge:

```
android-app\android\app\build\outputs\bundle\release\app-release.aab
```

---

## 2. Test på din egen telefon FØRST (15 minutter)

Det er billigere at finde fejl her end i Play Console.

TWG Studio → **Install APK on phone** (kræver USB-fejlfinding slået til).

Tjek:

- [ ] Splash → titelskærm, intet sort blink
- [ ] Samtykkeformularen dukker op ved allerførste start
- [ ] Banner nederst på menuen — **ingen** reklame under spil
- [ ] Tilbageknappen pauser midt i et run
- [ ] Pauseknappen (❚❚) fryser spillet helt
- [ ] Efter 3 runs: fuldskærmsreklame, runet er ikke tabt
- [ ] "WATCH AD — KEEP GOING" giver 2 hjerter + skjold
- [ ] BADGES / SKINS / PROFILE scroller flydende
- [ ] Luk appen helt, åbn igen: badges, bits og skins er der stadig
- [ ] Rotér telefonen: bliver i portrait

> **Læg din telefon i `AD_TEST_DEVICES` først.** Åbn `TheWhateverGame.html`, søg efter
> `AD_TEST_DEVICES`, og indsæt dit enheds-ID. SDK'et printer det til logcat ved første
> annonceanmodning — søg efter `setTestDeviceIds`. Uden det tæller dine egne tryk som
> rigtige visninger, og AdMob suspenderer konti for det.

---

## 3. Play Console (45 minutter)

**All apps → Create app**

| Felt | Værdi |
|---|---|
| App name | `THE WHATEVER GAME` |
| Default language | English (United States) |
| App or game | Game |
| Free or paid | **Free** — kan aldrig laves om bagefter |

Gå så Dashboard-listen igennem ovenfra. Alle tekster ligger i `store-listing.md`.

1. **App access** → "All functionality is available without special access"
2. **Ads** → Yes, contains ads
3. **Content rating** → IARC-spørgeskemaet. Svarene står i `store-listing.md`.
   Vær ærlig om **flashing imagery: Yes**. **Simuleret gambling: No** — PLINKO har
   ingen indsats og ingen loot boxes.
4. **Target audience** → **13-15, 16-17, 18+**. Sæt ikke flueben ved under-13.
5. **Data safety** → tabellen i `store-listing.md`. Kort: du deklarerer
   **Device IDs, Approximate location, App interactions, Diagnostics** — alle fordi
   AdMob indsamler dem. Scores og badges deklareres **ikke**, de forlader aldrig telefonen.
6. **Privacy policy** →
   `https://bemintalitet.github.io/TheWhateverGame/privacy.html`
7. **Government apps / Financial / Health** → No, No, No
8. **Store listing** → teksten nedenfor + grafik fra `store/icons/` og `store/screenshots/`

---

## 4. Butiksside

### App name (30 tegn)

```
THE WHATEVER GAME
```

### Kort beskrivelse (80 tegn)

```
31 games in one. It morphs mid-run and never asks permission. Good luck.
```

### Fuld beskrivelse (4000 tegn)

```
THE WHATEVER GAME cannot pick a genre. So it picks all of them.

You are a small round thing called Bit. Every few seconds the entire game changes
underneath you — platformer, shoot-em-up, brick breaker, rhythm game, snake, maze
chase, grappling hook, fishing, sumo, golf, plinko, tower defence — and you have
to keep up. No tutorial screens. No menus between rounds. Just one continuous,
escalating identity crisis.

── WHAT'S IN IT ──

• 31 genres, each a complete little game, all shuffled into one run
• 4 boss fights that break the rules on purpose
• 9 worlds that change gravity, speed and the entire mood
• 6 mutators rolled onto genres at random — TINY BIT, LIGHTS OUT, GOLD RUSH
• A cat. It turns up sometimes. Pet the cat.
• ∅ VOID — the mode where the rules stop working

── PROGRESSION THAT GOES SOMEWHERE ──

• 1000+ badges, from "score 500" to things you will not find by accident
• 104 skins for Bit — crowns, wings, lava cracks, holograms, a void cat.
  Earned through badges or bought with bits you get just by playing.
• Mastery levels for every single genre
• A player rank that climbs the whole time you play
• Three fresh contracts every day, and a login streak that pays out

── FOUR WAYS TO PLAY ──

• IDENTITY CRISIS — the main event. Everything, forever, faster.
• SURVIVAL — pick one genre and see how long you last as it turns on you
• DAILY CHALLENGE — everyone in the world gets the same seed today. No excuses.
• VS — pass and play on one phone. Both players get an identical universe.

── BUILT FOR A PHONE ──

• One thumb. Portrait. Pick it up for ninety seconds or an hour.
• Works completely offline — no account, no login, no internet needed
• A real pause button, a working back button, and a reduced-flashing mode
• Nothing is behind a paywall, because there is no paywall

Free, funded by ads. Ads appear on menus and after a run has ended — never
during one. You can watch an optional video to keep a run going, but you never
have to, and nothing is locked if you don't.

It's called THE WHATEVER GAME because that's the only honest name for it.
```

### Kategori og tags

| Felt | Værdi |
|---|---|
| Category | **Arcade** |
| Tags | Arcade, Casual, Action, Single player, Offline |

### Grafik

| Asset | Fil |
|---|---|
| App icon 512×512 | `store/icons/icon-512.png` |
| Feature graphic 1024×500 | `store/icons/feature-graphic-1024x500.png` |
| Screenshots | `store/screenshots/*.png` — **tag nye først** |

> Screenshot-sættet er fra før skins, badges og profilskærmen fandtes. Tag otte nye:
> titel, badge-listen, skins-gitteret, profil/mastery, to-tre genrer, en boss, og en
> verden med et mutator-banner. Åbn `TheWhateverGame.html` i Chrome, tryk F12 →
> device toolbar → 1080×1920, og skyd derfra.

---

## 5. Lukket test — de 14 dage

Google kræver for nye personlige udviklerkonti: **mindst 12 testere, tilmeldt i
mindst 14 sammenhængende dage**, før du må ansøge om produktion.

1. **Testing → Closed testing → Create new release**
2. Upload `app-release.aab`
3. Release name: `1.0 (1)`
4. Release notes:
   ```
   First release.

   31 genres, 4 bosses, 9 worlds, over 1000 badges and 104 skins to unlock.
   It still refuses to pick a genre.
   ```
5. **Testers → Create email list** → 12+ Gmail-adresser
6. Kopiér **opt-in URL**'en og send den ud
7. **Review and roll out**

Uret starter når testerne **har accepteret**, ikke når du opretter releasen. Få dem
inviteret med det samme.

---

## 6. Produktion

Efter 14 dage dukker **"Apply for production"** op.

1. Udfyld spørgeskemaet om testen (hvad testede I, hvad fandt I, hvad rettede I)
2. **Production → Create new release** → samme AAB, eller en ny med `versionCode 2`
3. **Countries → Select all**
4. **Rollout: start på 20 %.** Ser crash-raten fin ud efter et par dage, hæv til 100 %.

Første produktionsgennemgang: typisk 3-7 dage.

---

## 7. Efter udgivelsen

- **AdMob → App settings → Link to app store.** Forbedrer annonceudfyldning mærkbart,
  og fjerner "Kræver gennemgang"-status.
- **Play Console → Vitals** viser crashes fra rigtige enheder. Kig ind den første uge.
- Opdateringer: hæv `versionCode` i TWG Studio (`+1`-knappen), byg, upload.
