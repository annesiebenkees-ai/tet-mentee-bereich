## Design Milchglas hinter dem Schalter (Auftrag „Studio in Milchglas“, Teil 1, 06.11.2026)

Auftraggeberin ist Anne; Anstoß Elliott (TET). Die Marke ist seit 28.10.2026 Milchglas, das Businessportal ist umgestellt. Das Studio läuft in einem einzigen Container für alle Kundinnen. Deshalb gilt: **Ausrollen allein ändert für Kundinnen nichts.** Die Unterlagen (DESIGN.md, Entwurf, Logos) sind nicht im Repo; maßgeblich sind DESIGN.md der Marke und der Entwurf vom 06.11.2026.

### Schalter (`grundlage.design-schalter`)
- Ohne Parameter gilt Milchglas (`data-design="milchglas"` auf `<html>`, schon in `index.html`). Der Parameter `?design=milchglas` ist nicht mehr nötig und ändert nichts.
- Wechsel zwischen Seiten im Studio (Router, neu laden, iframe) verliert den Schalter nicht: Er steht in `sessionStorage` dieses Tabs.
- Altes Design (Rückfall): `?design=standard`.
- Kein Aufruf des Servers, keine Einstellung, kein Eintrag in der Datenbank.
- Nachtrag 09.11.2026: Milchglas ist Standard (Anne). `?design=standard` holt für diesen Tab das alte Design zurück.

### Gestaltung unter dem Schalter (kein Element mit Kennung: ein Stilblatt, Stand gebaut)
Alles in `client/src/stil/milchglas.css`, jede Regel unter `[data-design="milchglas"]`, geladen nach allen anderen Stilblättern. Was aufgenommen ist: Farben nach Rolle, Glas (`backdrop-filter: blur(26px) saturate(165%)`), das Licht aus dem Entwurf als Grund (drei weiche Kreise in Lavendel, Violett, Lime, vom Studio selbst gezeichnet, weil es im iframe läuft), Hauptknopf „Lime wie Glas“, zweiter Knopf, Felder (Ecke 14, Rand Tinte 12 %), Stand-Pillen, Fortschritt (Spur Tinte 8 %, Füllung Lime), Navigation (Einträge ganz rund, aktiver in Tinte), Pop-in „läuft“ als dunkles Glas, Fenster, Etiketten in Großbuchstaben, Schrift nur Manrope.

Bewusst weggelassen: Punkt-Welle und Eigenbewegung im Knopf, Funkenkranz, Roll-Zeilen, hochzählende Zahlen, Plakat-Headline, Ablauf-Leiste, Formular-Sockel, Lime-Block, Sticker, bewegtes Licht. Das Studio braucht sie nicht.
Ebenfalls nicht umgesetzt, weil sie Markup brauchen: zweifarbige Überschrift (Auftakt in Grau) und die waagerechte Reiter-Leiste des Entwurfs (das Studio hat eine Leiste links). Fließtext bleibt bei der Größe des Studios (15 px), nicht 17 px.

Nie angefasst, auch nicht unter dem Schalter: Farben der Kundin, Marke, Karussell-Vorschauen, gerechnete Bilder und Videos. Das Stilblatt kennt keine Regel für Bild, Video, Zeichenfläche oder Vorschau.

### Schrift und Logo
- Manrope (400 bis 800, eine variable Datei) liegt selbst gehostet in `client/src/stil/milchglas/manrope.ttf` mit Lizenz (`OFL.txt`, SIL Open Font License). Es ist dieselbe Datei wie beim Kreis marke, aber eine eigene Kopie; ein Test hält beide gleich. Kein Aufruf zu Google.
- Logo unter dem Schalter: `tet-logo-hell.svg` (148 × 30 px) in der Kopfzeile; unter 375 px Breite `tet-zeichen-hell.svg`. Beide fertig, unverändert aus der Übergabe der Marke (Pearl, Stand 27.10.2026). Die Wortmarke „TET-Socialmediastudio“ bleibt für Vorleser da. Ohne Schalter bleibt das heutige Logo (`tet-logo.png`).

### Angebotene Rollen für die Kreise (Übergabe-Angebot, noch nicht in `docs/UEBERGABEN.md`)
Unter dem Schalter stehen diese Werte auf `<html>`. Wer eine feste Farbe im eigenen Stilblatt oder in einer JSX-Datei hat, ersetzt sie nach **Rolle** durch `var(--mg-<rolle>, <bisherige Farbe>)`. Der Rückfall ist die bisherige Farbe; ohne Schalter ändert sich nichts. Nie auf `:root` setzen, nie Farbe gegen Farbe tauschen. Die Farben der Kundin bleiben fest.

| Rolle | Variable | Wert |
| --- | --- | --- |
| Grund | `--mg-grund`, `--mg-grund-deckend` | `#ECEAF4`, `#F7F6FB` |
| Flächen | `--mg-flaeche` | Weiß 85 % |
| Glas | `--mg-glas`, `--mg-glas-stark`, `--mg-glas-linie`, `--mg-glas-schatten`, `--mg-glas-schatten-stark`, `--mg-unschaerfe` | Verlauf Weiß 74 → 52 %, 92 → 72 %, Kante Weiß 85 %, Schweben, `blur(26px) saturate(165%)` |
| Dunkles Glas | `--mg-dunkel`, `--mg-dunkel-linie`, `--mg-text-auf-dunkel`, `--mg-text-auf-dunkel-leise` | Verlauf `#2A2636` → `#111018`, Lichtkante, `#ECEAF4` |
| Weich | `--mg-weich`, `--mg-weich-stark` | Tinte 6 %, 10 % (Pillen, Platzhalter) |
| Text | `--mg-text`, `--mg-text-leise`, `--mg-text-auftakt` | `#16141F`, `#5B5770`, `#8A86A0` |
| Linien | `--mg-linie`, `--mg-linie-leicht`, `--mg-feld-rand`, `--mg-feld-rand-hover` | Tinte 10 %, 6 %, 12 %, 22 % |
| Akzent | `--mg-akzent`, `--mg-auf-akzent`, `--mg-akzent-knopf` | `#D7F25A` (nur die eine Handlung), Tinte, Lime-Verlauf |
| Licht | `--mg-licht-lavendel`, `--mg-licht-violett`, `--mg-licht-lime` | nur Licht hinter dem Glas, nie Text |
| Gefahr | `--mg-gefahr`, `--mg-gefahr-grund`, `--mg-gefahr-rand` | `#B42318`, `#F8D7D3`, Rot 28 % |
| Erfolg | `--mg-ok`, `--mg-ok-grund` | `#2F7D4A`, `#DCEFD9` |
| Läuft | `--mg-laeuft-grund` | Lavendel 55 % |
| Fokus | `--mg-fokus`, `--mg-fokus-ring` | `#16141F`, Tinte 18 % |
| Ecken, Schatten | `--mg-r-feld` 14, `--mg-r-karte` 24, `--mg-r-gross` 28, `--mg-r-rund` 999, `--mg-sh-leicht` | |

Die vorhandenen Namen der Hülle (`--water`, `--deep`, `--tint`, `--paper`, `--ink`, `--body`, `--slate`, `--accent`, `--hair`, `--focus`, `--danger`, `--ok`, `--r-*`, `--sh-*`, `--serif`, `--sans`, `--mono`) sind unter dem Schalter nach Rolle neu belegt; Kreise, die nur diese Namen benutzen, ziehen von selbst mit. Betroffen mit festen Farben (Zählung der Bauleitung): `schnitt.css` (16), `schnitt/Look.jsx` (4), `schnitt/Abspieler.jsx` (3), `schnitt/Zeitleiste.jsx` (1), `broll.css` (4), `marke.css` (3), `marke/Schriften.jsx` (2), `marke/Marke.jsx` (2), `plan.css` (2), `radar.css` (1). Sie gehören den Kreisen; die Grundlage ändert sie nicht. Die Bauleitung verteilt es.

### Tests (`server/test/grundlage.test.js`, Block „Milchglas“)
Reine Funktion des Schalters, Anwenden mit falschem und gesperrtem Speicher, Einbindung in `main.jsx` und `Studio.jsx`, `:root` und `grund.css` gegen den eingecheckten Stand, jede Regel unter dem Schalter, Manrope und Logo selbst gehostet, keine Adresse zu Google, Glas, Handy, reduzierte Transparenz, keine neuen Effekte, Rollen für die Kreise.

### Nicht geprüft
Im Browser noch nicht gesehen, weder am Rechner noch am Handy, und nicht mit der Kreis-Seiten daneben (deren feste Farben stehen noch). Deshalb „gebaut“, nicht „getestet“, für die Gestaltung. Abnahme liegt bei Anne.

