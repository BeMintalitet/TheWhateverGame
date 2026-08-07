# AdMob — svar på dine spørgsmål + de tekster du skal bruge

---

## 1. Skal du have en privacy policy? Ja. Det kan ikke undgås.

Der er to uafhængige krav, og begge rammer dig:

**Google Play** kræver en privatlivspolitik-URL for **alle** apps siden 2022 — også apps
der intet indsamler. Feltet i Play Console er obligatorisk; du kan ikke indsende uden det.

**AdMob** kræver den oveni, fordi annoncenetværket indsamler enheds-ID, IP og
omtrentlig placering. Uden en politik der beskriver det, bryder du både AdMob-vilkårene
og GDPR.

Den gode nyhed: den er allerede skrevet (`store/privacy-policy.html`), den er
selvstændig HTML uden afhængigheder, og hosting koster nul kroner. GitHub Pages,
Netlify Drop eller Cloudflare Pages — vælg én, upload filen som `index.html`, færdig
på ti minutter. Fremgangsmåden står i `PLAYSTORE_GUIDE.md` afsnit 2.

Du behøver **ikke** en hjemmeside til selve spillet. Kun den ene side.

---

## 2. Dine ID'er — allerede lagt ind i projektet

| | ID |
|---|---|
| **App ID** | `ca-app-pub-5434609640567182~9500756508` |
| **Banner** | `ca-app-pub-5434609640567182/1401674556` |
| **Interstitial** | `ca-app-pub-5434609640567182/6462429546` |
| **Rewarded** | `ca-app-pub-5434609640567182/3039289938` |

> **Omdøb den midterste annonceenhed i AdMob.** På dit fjerde screenshot hedder både
> den rewarded og den interstitial enhed `TWG Interstitial`. ID'erne er rigtige og
> koden er koblet korrekt, men om seks måneder når du kigger på indtjening pr. enhed,
> kan du ikke se forskel. Omdøb `ca-app-pub-…/3039289938` til **TWG Rewarded**.
> Navnet er kun en etiket — ID'et ændrer sig ikke.

---

## 3. Fjerde billede: "Frekvensbegrænsning — Kan ikke anvendes"

Det er ikke en fejl. Frekvensbegrænsning findes ikke for bannere, fordi et banner
ligger permanent på skærmen i stedet for at "vises" som en enkeltstående hændelse.
Der er intet at begrænse. Kolonnen siger bare "ikke relevant for denne annoncetype".

For dine to fuldskærmsenheder står der **"Ingen grænse"**. Det bør du lave om:

- **TWG Interstitial → Frekvensbegrænsning: 1 visning pr. 2 minutter.**
  Spillet håndhæver allerede en strengere regel i koden (mindst 3 runs *og* 90
  sekunder), men et loft på AdMob-siden er et sikkerhedsnet hvis der nogensinde
  slipper en fejl igennem. For mange interstitials er den hyppigste årsag til
  politik-advarsler i arkadespil.
- **TWG Rewarded → lad den stå på "Ingen grænse".** Rewarded er frivillig; spilleren
  trykker selv. At begrænse den koster dig kun penge.

### "Bonusudgaven af samme annoncetype"

Du tænker på **Rewarded interstitial**. Forskellen:

| | Rewarded | Rewarded interstitial |
|---|---|---|
| Starter | spilleren trykker på en knap | starter selv efter et skærmskift |
| Kræver | eksplicit valg | kun en "du får nu en reklame"-intro |
| Bruges til | continue, dagligt bonus | pauser mellem niveauer |

**Brug den ikke.** Spillet er bygget om en fair aftale: reklamer afbryder aldrig et
run, og fuldskærmsreklamer kommer kun *efter* du er død. En rewarded interstitial
starter af sig selv, og det bryder præcis den aftale. Din nuværende opsætning med tre
enheder er den rigtige.

---

## 4. Annonceindholdsvurdering — sæt den til **T**, ikke G

> **Rettelse.** En tidligere version af dette dokument sagde G. Det var for forsigtigt
> og ville have kostet dig cirka halvdelen af omsætningen uden at give nogen
> beskyttelse du havde brug for.

**Hvor:** AdMob → **Bloker annoncer** (venstre menu) → vælg din app →
**Annonceindholdsvurdering** → vælg **T — Teenagere** → **Gem**.
(*Blocking controls → Ad content rating → T*)

### Hvorfor T er det rigtige

Vurderingerne er kumulative: vælger du T, får du G + PG + T og blokerer MA.

| | Hvad den lukker ind | Passer til din app? |
|---|---|---|
| **G** | kun familievenligt | For stramt. G er beregnet til børne-apps og "Designed for Families" — programmer hvor målgruppen inkluderer under-13. Det gør din ikke. |
| **PG** | + tegneserievold | Stadig strammere end nødvendigt. |
| **T** | + almen sundhed, sociale netværk, uhyggelige billeder, kampsport | **Ja.** Din målgruppe i Play Console er 13-15, 16-17 og 18+. T er præcis defineret som "egnet for teenagere og opefter". |
| **MA** | + alkohol, våben, seksuelt indhold | Nej. *Dette* ville være et politikbrud over for en 13-årig. |

Advarslen AdMob viser (−34 til −62 % eksponeringer, −36 til −69 % omsætning ved at gå
fra MA til G) er reel. Ved at gå til T i stedet for G beholder du langt hovedparten af
udfyldningen, og du blokerer stadig præcis det indhold der ville være et problem.

**Kort sagt:** G ville ikke gøre appen mere lovlig — kun fattigere.

### Hvornår ville G have været påkrævet?

Kun hvis du satte flueben ved en målgruppe under 13 i Play Console, eller tilmeldte
appen "Designed for Families". Det gør vi bevidst ikke — det ville udløse en langt
strengere annonceordning (kun certificerede annoncenetværk, ingen personalisering,
ingen advertising ID). Din nuværende opsætning er 13+ og T.

### Mens du er der

**"Godkendelsesstatus: Kræver gennemgang"** på app-siden er helt normalt for en ny app.
Den løser sig selv når appen er publiceret på Play og du linker AdMob-appen til
butiksfortegnelsen.

---

## 5. Sjette billede: GDPR-samtykkeformularen

Du står i **Privatliv og meddelelser → GDPR**. Det meste af teksten er Googles egen og
kan ikke ændres — det er IAB TCF-standardteksten, og det er faktisk en fordel, fordi
den er juridisk gennemarbejdet. Det du styrer, er indstillingerne og et par felter.

### Indstillinger (højre side)

| Felt | Sæt til | Hvorfor |
|---|---|---|
| Vælg apps | **THE WHATEVER GAME** | uden dette vises formularen aldrig |
| Standardsprog | **engelsk (en)** | butiksfortegnelsen er på engelsk |
| Yderligere sprog | tilføj **dansk (da)** | dine første testere er danske |
| Samtykke | **Til** | påkrævet i EØS |
| Administrer muligheder | **Til** | GDPR kræver at man kan vælge fra, ikke kun til |
| Jeg giver ikke mit samtykke | **Til** ← *skift denne* | står på "Vælg" hos dig. Uden en synlig afvis-knap er samtykket ikke gyldigt efter GDPR art. 7 |
| Luk (giv ikke samtykke) | **Fra** | fint — så kan man ikke smutte udenom ved at lukke |

> Den vigtigste er **"Jeg giver ikke mit samtykke"**. Et samtykke hvor det er
> nemmere at sige ja end nej, er ikke frit givet, og det er præcis den konstruktion
> databeskyttelsesmyndigheder har slået ned på. Slå den til.

### Målretning

Vælg **EØS og Storbritannien**. Resten af verden har ikke brug for GDPR-formularen,
og at vise den globalt koster dig annonceindtægt uden at give nogen beskyttelse.

### Teksten du kan redigere

Google indsætter automatisk appnavnet hvor der står `%%APP_NAME%%`. Under
**Typografi** kan du sætte et logo — brug `store/icons/icon-512.png`.

Vil du tilføje en indledning (feltet hedder typisk "Brugerdefineret introduktion"),
er her en tekst der matcher spillets tone og din faktiske politik:

**Engelsk:**

```
THE WHATEVER GAME is free and stays free. Ads are what pay for it.

To show you ads, our advertising partners need to store and read some
information on your device — a device identifier, your approximate region,
and which ads you saw. The game itself collects nothing: your scores,
badges and skins never leave this phone.

You can say no. If you do, you will still see ads, they just will not be
personalised, and nothing in the game gets locked or limited. You can
change your answer at any time from the privacy option in the app.
```

**Dansk:**

```
THE WHATEVER GAME er gratis og forbliver gratis. Reklamerne er det, der
betaler for det.

For at kunne vise dig reklamer har vores annoncepartnere brug for at gemme
og læse nogle oplysninger på din enhed — et enheds-ID, din omtrentlige
region, og hvilke reklamer du har set. Selve spillet indsamler ingenting:
dine scores, badges og skins forlader aldrig denne telefon.

Du må gerne sige nej. Gør du det, ser du stadig reklamer — de er bare ikke
personaliserede — og intet i spillet bliver låst eller begrænset. Du kan
ændre dit svar når som helst under privatlivsindstillingerne i appen.
```

### Glem ikke at publicere

En gemt meddelelse gør ingenting. Der skal stå **Publiceret**, ikke *Kladde*.
En upubliceret GDPR-meddelelse er den hyppigste årsag til at samtykkeformularen
aldrig dukker op i appen — og til at annonceudfyldningen i Europa er nul.

### US states-meddelelsen

Samme menu, fanen ved siden af. Opret og publicer den også. Den dækker CCPA og de
tilsvarende delstatslove. Uden den kan du ikke lovligt vise personaliserede reklamer
i Californien, Colorado, Connecticut, Utah og Virginia.

---

## 6. Rækkefølgen der virker

1. Omdøb `…/3039289938` til **TWG Rewarded**
2. Sæt frekvensbegrænsning på interstitial: **1 pr. 2 minutter**
3. **Bloker annoncer → Annonceindholdsvurdering → T**
4. **GDPR-meddelelse** → vælg app, slå "Jeg giver ikke mit samtykke" til, målret EØS+UK → **Publicer**
5. **US states-meddelelse** → opret → **Publicer**
6. Host `privacy-policy.html` og gem URL'en
7. Byg appen i TWG Studio og sideload APK'en til din telefon
