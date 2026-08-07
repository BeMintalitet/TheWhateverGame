# THE WHATEVER GAME — Play Store udgivelsesguide

Skrevet 8. august 2026. Alt der kunne automatiseres er allerede gjort — det der står
her, er det der kræver dine hænder og din Play Console-konto.

---

## START HER: TWG Studio

Dobbeltklik **`twg-studio\START.bat`**. Der åbner en browserfane med et kontrolpanel
der gør stort set alt i denne guide for dig:

- tjekker at hele værktøjskæden er på plads (Java, SDK, keystore, target API)
- holder dine AdMob-ID'er ét sted og skriver dem ind i alle fire filer
- kan hente ID'erne **direkte fra din AdMob-konto** når du har koblet den på én gang
- bygger AAB + APK, kører hele regressionssuiten, og nægter at kalde det færdigt
  hvis noget fejler eller hvis der stadig ligger test-ID'er i buildet
- hæver `versionCode`, installerer APK'en på din telefon, og har en afkrydsningsliste
  der huskes mellem sessioner

Resten af guiden er baggrunden — det du skal gøre i Play Console og AdMob, som ingen
software kan gøre for dig.

**AdMob-specifikke svar** (G-rating, GDPR-tekst, frekvensbegrænsning, rewarded vs.
rewarded interstitial) står i `store/ADMOB_SETUP.md`.

---

## 0. Læs dette først (2 minutter, sparer dig for en afvisning)

**Deadline der rammer dig:** Google Play kræver **target API 36** for nye apps fra
**31. august 2026**. Projektet er allerede sat til API 36, så du er dækket — men du skal
igennem en 14-dages lukket test før produktion, så start nu og ikke om tre uger.

**Signeringsnøglen er allerede lavet** og ligger i
`android-app/android/upload-keystore.jks`. Adgangskoden står i
`android-app/android/keystore.properties`.

> **Tag en backup af begge filer i dag.** Læg dem et sted der ikke er denne PC —
> en adgangskodemanager, en krypteret USB, hvad som helst. Filerne er bevidst
> udeladt af enhver zip jeg laver, og de bliver ikke committet nogen steder.
> Mister du dem, kan du stadig redde dig med Play App Signing (Google kan udstede
> en ny upload-nøgle), men det er en supportsag på flere dage.

**Dine rigtige AdMob-ID'er er allerede lagt ind og bygget:**

| Hvad | ID |
|---|---|
| App ID | `ca-app-pub-5434609640567182~9500756508` |
| Banner | `ca-app-pub-5434609640567182/1401674556` |
| Interstitial | `ca-app-pub-5434609640567182/6462429546` |
| Rewarded | `ca-app-pub-5434609640567182/3039289938` |

> **Tap aldrig dine egne reklamer på en uregistreret telefon.** Det er live-ID'er nu,
> så hver visning tæller. AdMob læser selvtryk som invalid traffic, og en suspenderet
> konto er ikke noget man appellerer sig hurtigt ud af.
> Åbn `TheWhateverGame.html`, find `AD_TEST_DEVICES`, og indsæt dit enheds-ID før du
> tester. SDK'et printer det præcise ID til logcat ved første annonceanmodning —
> søg efter `setTestDeviceIds`.

---

## 1. Opret AdMob-appen (15 min)

1. Gå til [admob.google.com](https://admob.google.com) og log ind med samme Google-konto
   som Play Console.
2. **Apps → Add app → Android → "Ja, den er på en app-butik"** er endnu ikke sandt,
   så vælg **"Nej"** og indtast navnet `THE WHATEVER GAME`. Du linker den til Play
   bagefter, når appen er publiceret.
3. Noter **App ID**'et (formatet er `ca-app-pub-XXXXXXXX~YYYYYYYY` — bemærk tilden).
4. Opret **tre ad units** under appen:

   | Navn | Format | Bruges til |
   |---|---|---|
   | `TWG Banner` | Banner | menuskærme |
   | `TWG Interstitial` | Interstitial | efter et run |
   | `TWG Rewarded` | Rewarded | continue + dagligt bonus |

5. **App settings → Maximum ad content rating → G.** Dette er ikke valgfrit når
   målgruppen inkluderer 13-17-årige.
6. **Privacy & messaging → GDPR → opret en meddelelse** og publicer den. Uden dette
   viser samtykkeformularen i appen ingenting i EU, og du bryder GDPR.
   Gør det samme for **US states**-meddelelsen.

Når du har værdierne, indsæt dem:

```
android-app/android/app/src/main/AndroidManifest.xml
   android:value="ca-app-pub-DIT_ID~DIT_APP_ID"

TheWhateverGame-release.html   (søg: const AD_UNITS)
   banner:       'ca-app-pub-DIT_ID/DIN_BANNER'
   interstitial: 'ca-app-pub-DIT_ID/DIN_INTERSTITIAL'
   rewarded:     'ca-app-pub-DIT_ID/DIN_REWARDED'
```

Kør derefter `build/rebuild.bat` (se afsnit 4) for at bygge en ny AAB.

---

## 2. Hosting af privatlivspolitikken (10 min, gratis)

Play kræver en **offentligt tilgængelig URL**. Filen er klar:
`store/privacy-policy.html`.

Nemmeste vej — GitHub Pages:

1. Opret et offentligt repo, f.eks. `whatevergame-privacy`.
2. Upload `privacy-policy.html` og omdøb den til `index.html`.
3. **Settings → Pages → Source: main / root → Save.**
4. Efter ~1 minut er den på `https://DITBRUGERNAVN.github.io/whatevergame-privacy/`.
5. Åbn URL'en i en inkognitofane og bekræft at den loader. En 404 her koster dig
   en afvisningsrunde.

Alternativer der virker lige så godt: Netlify Drop (træk mappen ind), Cloudflare Pages.

---

## 3. Play Console — opret appen (20 min)

**All apps → Create app**

| Felt | Værdi |
|---|---|
| App name | `THE WHATEVER GAME` |
| Default language | English (United States) |
| App or game | **Game** |
| Free or paid | **Free** (kan aldrig laves om til betalt bagefter) |

Kryds af i begge erklæringer nederst, og opret.

Gå derefter **Dashboard**-listen igennem ovenfra. Alle tekster du skal bruge ligger
i `store/store-listing.md` — den er skrevet til at blive kopieret direkte.

### Rækkefølge der virker

1. **App access** → "All functionality is available without special access"
2. **Ads** → **Yes, my app contains ads**
3. **Content rating** → udfyld IARC-spørgeskemaet. Svarene står i
   `store-listing.md`. Vær ærlig om **flashing imagery: Yes** — spillet har en
   reduced-flashing indstilling, så det er en detalje, ikke et problem.
   Svar **No** på simuleret gambling: PLINKO har ingen indsats og ingen loot boxes.
4. **Target audience** → **13-15, 16-17, 18+**.
   Sæt **ikke** flueben ved under-13. Det udløser Families-politikken og en langt
   strengere reklameordning.
5. **Data safety** → tabellen i `store-listing.md` er 1:1 det Google spørger om.
   Kort version: du deklarerer **Device IDs, Approximate location, App interactions,
   Diagnostics** — alle sammen fordi AdMob indsamler dem, ikke fordi spillet gør.
   Scores og badges deklareres **ikke**, fordi de aldrig forlader telefonen.
6. **Privacy policy** → indsæt URL'en fra afsnit 2.
7. **Government apps / Financial features / Health** → No, No, No.
8. **Store listing** → titel, korte og lange beskrivelser, grafik.
   Grafikken ligger i `store/icons/` og `store/screenshots/`.

> **Tag nye screenshots før du indsender.** Sættet i `store/screenshots/` er fra før
> skins, badges og profilskærmen fandtes. Otte gode: titelskærm, badge-listen,
> skins-gitteret, profil/mastery, to-tre genrer, en boss, og en verden med et
> mutator-banner. 1080×1920, portrait.

---

## 4. Byg AAB'en

Den er allerede bygget én gang. Filen ligger i:

```
android-app/android/app/build/outputs/bundle/release/app-release.aab
```

Skal du bygge igen (f.eks. efter at have indsat dine rigtige AdMob-ID'er):

```bat
build\rebuild.bat
```

Scriptet kopierer release-HTML'en ind i `www/`, kører `cap sync`, og bygger både
AAB og APK. APK'en er kun til at sideloade på din egen telefon — Play tager kun AAB'en.

**Hver gang du uploader en ny version skal `versionCode` op med mindst 1.**
Den står i `android-app/android/app/build.gradle`. Play afviser en upload med et
`versionCode` der allerede er brugt.

---

## 5. Test på din egen telefon først (15 min)

Byg-scriptet laver også en APK:

```
android-app/android/app/build/outputs/apk/release/app-release.apk
```

1. Slå **Udviklerindstillinger → USB-fejlfinding** til på telefonen.
2. Sæt den i USB'en og kør:
   ```
   "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb" install -r "C:\Users\compr\Documents\The Whatever Game\android-app\android\app\build\outputs\apk\release\app-release.apk"
   ```
3. Tjek denne liste:
   - [ ] Splash → titelskærm uden sort blink
   - [ ] Banner-reklame nederst på menuen, **ingen** reklame under spil
   - [ ] Hardware-tilbageknap pauser midt i et run, og pauser ikke to gange
   - [ ] Pauseknappen (❚❚) fryser spillet helt
   - [ ] Efter 3 runs: fuldskærmsreklame, og runet er ikke gået tabt
   - [ ] "WATCH AD — KEEP GOING" giver dig faktisk 2 hjerter og et skjold
   - [ ] BADGES, SKINS og PROFILE scroller flydende
   - [ ] Luk appen helt og åbn igen: badges, bits og skins er der stadig
   - [ ] Rotér telefonen: den bliver i portrait (låst i manifestet)

Fejl her er meget billigere end fejl i Play Console.

---

## 6. Lukket test — de 14 dage (påkrævet)

Google kræver for nye personlige udviklerkonti: **mindst 12 testere, der har været
tilmeldt i mindst 14 sammenhængende dage**, før du må ansøge om produktion.

1. **Testing → Closed testing → Create new release**
2. Upload `app-release.aab`
3. Release name: `1.0 (1)` · Release notes: teksten står i `store-listing.md`
4. **Testers → Create email list** → indsæt 12+ Gmail-adresser
   (venner, familie, en Discord-server — de skal bare acceptere invitationen og
   installere appen; de behøver ikke spille hver dag)
5. Kopiér **opt-in URL**'en og send den ud
6. **Review and roll out**

Godkendelsen tager typisk 1-3 dage. Uret på de 14 dage starter når testerne er
tilmeldt, ikke når du opretter releasen — så få dem inviteret med det samme.

Brug perioden til at fange rigtige bugs. Alle testere kan sende feedback direkte
gennem Play.

---

## 7. Produktion

Efter 14 dage dukker **"Apply for production"** op på dashboardet.

1. Udfyld spørgeskemaet om din test (hvad testede I, hvad fandt I, hvad rettede I)
2. **Production → Create new release** → genbrug den samme AAB, eller upload en
   nyere med `versionCode 2`
3. **Countries → Add countries → Select all** (eller vælg selv)
4. **Rollout: start på 20%.** Hvis crash-raten ser fin ud efter et par dage, hæv til
   100%. Et fuldt rollout fra dag ét betyder at en dum fejl rammer alle på én gang.

Første produktionsgennemgang tager typisk 3-7 dage.

---

## 8. Efter udgivelsen

- **Link AdMob til Play**: AdMob → App settings → "Link to app store". Det forbedrer
  annonceudfyldning mærkbart.
- **Play Console → Vitals** viser crashes og ANR'er fra rigtige enheder. Kig ind der
  den første uge.
- **Opdateringer**: Bed mig om et nyt release-build når som helst du har ændret spillet.
  Rutinen er: jeg regenererer `TheWhateverGame-release.html`, du hæver `versionCode`,
  kører `build\rebuild.bat`, og uploader.

---

## Filoversigt

| Fil | Hvad det er |
|---|---|
| `TheWhateverGame.html` | **Udviklingsbuild.** Har ∞ TEST MODE. Test og pil i denne. |
| `TheWhateverGame-release.html` | **Butiksbuild.** Test mode er permanent fjernet. Denne ryger i appen. |
| `android-app/` | Capacitor + Android-projektet |
| `android-app/android/upload-keystore.jks` | **Signeringsnøgle. Tag backup.** |
| `android-app/android/keystore.properties` | **Adgangskode. Tag backup.** |
| `store/store-listing.md` | Alle Play Console-tekster, klar til copy-paste |
| `store/privacy-policy.html` | Privatlivspolitik (ads-udgaven) — skal hostes |
| `store/icons/`, `store/screenshots/` | Butiksgrafik |
| `build/` | Patch-scripts, regressionstests og rebuild.bat |

---

## Hvis noget går galt

**"Your app targets API level X"** → `variables.gradle`, sæt `targetSdkVersion = 36`,
byg igen, hæv `versionCode`.

**"You must declare the AD_ID permission"** → den *er* i manifestet. Fejlen betyder
som regel at Data Safety-formularen ikke nævner advertising ID. Gå tilbage til
Data safety og kryds **Device or other IDs** af.

**"Upload failed: version code 1 has already been used"** → hæv `versionCode` i
`android-app/android/app/build.gradle`.

**Reklamer vises ikke i den lukkede test** → det er forventet med test-ID'erne hvis
enheden ikke er registreret som testenhed. Selve integrationen er verificeret;
brug Googles test-ID'er og kig i logcat efter `Ads` for at bekræfte kald.

**Gradle-build fejler efter en ændring** → `cd android-app\android` og kør
`gradlew.bat clean` først. Loggen ligger i `android-app\android\build.log`.
