# TWG Studio

Kontrolpanel for at bygge og udgive THE WHATEVER GAME.

**Start:** dobbeltklik `START.bat`. En browserfane åbner på `http://localhost:4747`.
Lad kommandovinduet stå åbent mens du arbejder.

Ingen npm-afhængigheder. Kun Node. Det er med vilje — værktøjet skal stadig starte om
to år, hvor `node_modules` ellers ville være rådnet.

---

## Hvad de fem paneler gør

**Status** — tjekker Node, Java (Android Studios JBR), SDK, platform 36, build-tools,
keystore, target-API og om der stadig ligger Google-test-ID'er i buildet. Alt der ikke
er grønt, stopper en udgivelse.

**AdMob IDs** — ét sted at holde dine fire ID'er. "Save IDs into every file" skriver
dem til `TheWhateverGame.html`, `TheWhateverGame-release.html`,
`android-app/www/index.html` og `AndroidManifest.xml` på én gang. Felterne validerer
formatet mens du skriver — App ID har en `~`, annonceenheder har en `/`, og den fanger
også hvis du kommer til at indsætte det samme ID to gange.

**Connect AdMob** — kobler værktøjet til din AdMob-konto, så det kan hente App ID og
alle annonceenheds-ID'er selv. Engangsopsætning, se nedenfor.

**Build & ship** — hele kæden: fjerner ∞ TEST MODE, kopierer til Capacitor, kører
`cap sync`, kører Gradle, og kører derefter hele regressionssuiten mod den HTML der
faktisk ryger i appen. Fejler noget, siger den fra i stedet for at aflevere en AAB du
tror er god. Knappen `+1` hæver `versionCode` — Play afviser en genbrugt værdi.

**Launch checklist** — 20 punkter i den rækkefølge der undgår en afvisning. Fluebenene
gemmes i `config.json`.

---

## Engangsopsætning: kobl AdMob på

AdMob har ingen API til at *oprette* apps og annonceenheder — `adUnits.create` findes,
men kræver særskilt adgang gennem en Google-kontaktperson, som små udgivere ikke får.
Selve oprettelsen skal derfor ske i AdMob-brugerfladen.

**Læsning** kan derimod automatiseres, og det er den del der koster tid: at finde og
kopiere fire lange ID'er uden at bytte om på dem. Med koblingen sat op trykker du én
knap, og værktøjet henter App ID og alle tre enheds-ID'er, matcher dem på annonceformat,
og skriver dem ind overalt.

1. [Opret et Google Cloud-projekt](https://console.cloud.google.com/projectcreate)
2. [Aktivér AdMob API](https://console.cloud.google.com/apis/library/admob.googleapis.com)
3. OAuth consent screen → **External** → tilføj din egen Gmail under **Test users**
4. Credentials → Create credentials → **OAuth client ID** → **Web application**
5. Authorised redirect URI: `http://localhost:4747/oauth/callback`
6. Indsæt client ID og secret i panelet → **Save & connect** → godkend i browseren
7. **Fetch my apps & units** → vælg appen → **Use this app's IDs**

Scopet er `admob.readonly`. Værktøjet kan læse din konto og intet andet — det kan ikke
ændre indstillinger, oprette noget eller røre din indtjening.

Tokens ligger i `twg-studio/config.json` på din maskine. Filen er gitignored.

---

## Filer

| Fil | Hvad |
|---|---|
| `server.js` | hele backenden — HTTP, build-kæden, AdMob-klienten |
| `index.html` | brugerfladen |
| `START.bat` | starter serveren og åbner browseren |
| `config.json` | dine flueben og OAuth-tokens (oprettes automatisk, gitignored) |

Porten er 4747. Vil du ændre den, står `PORT` øverst i `server.js` — husk så også at
rette redirect-URI'en i Google Cloud.
