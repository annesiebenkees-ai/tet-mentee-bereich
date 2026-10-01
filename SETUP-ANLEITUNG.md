# Einrichtung: Persönlicher Zugang, eigene Termine, Erinnerungen & Austausch

Die Tabelle **„TET Mentee-Bereich“** liegt schon in deinem Google Drive
(Konto *annesiebenkees@gmail.com*). Alle 17 Mentees sind eingetragen, und jeder hat
einen persönlichen Link. Du musst nur noch das Script einbauen und einschalten.
Dauer: ca. 10 Minuten.

> **Wichtig:** Die Termine werden aus dem Google Kalender des Kontos gelesen, in dem das
> Script läuft. Das sollte der Kalender sein, in den YouCanBook.me deine Buchungen einträgt.

---

## Schritt 1: Tabelle öffnen und Script einfügen
1. Öffne in Google Drive die Tabelle **„TET Mentee-Bereich“**.
2. Menü oben: **Erweiterungen → Apps Script**. Ein neuer Tab öffnet sich.
3. Dort steht schon etwas Code (`function myFunction() …`). **Alles markieren und löschen.**
4. Öffne die Datei [`backend/Code.gs`](backend/Code.gs), kopiere den **gesamten** Inhalt
   und füge ihn ein.
5. Oben auf das **Disketten-Symbol (Speichern)** klicken.

## Schritt 2: Einrichten (einmalig)
1. Wähle oben in der Leiste neben „Ausführen“ die Funktion **`einrichten`** aus.
2. Klicke auf **▶ Ausführen**.
3. Google fragt nach Berechtigungen. Klicke dich durch:
   **Berechtigungen prüfen → dein Konto wählen → „Erweitert“ → „TET Mentee-Bereich öffnen (unsicher)“ → Zulassen.**
   Die Warnung kommt nur, weil das Script von dir selbst ist und nicht von Google geprüft wurde.
4. Unten erscheint „Ausführung abgeschlossen“. Ab jetzt:
   - heißt das erste Blatt **„Mentees“**, und es gibt ein zweites Blatt **„Profile“** für den Austausch,
   - wird **jeden Morgen gegen 8 Uhr** automatisch geprüft, wer eine Erinnerung braucht.

## Schritt 3: Als Web-App veröffentlichen
1. Oben rechts: **Bereitstellen → Neue Bereitstellung**.
2. Beim Zahnrad neben „Typ auswählen“ **Web-App** wählen.
3. Einstellungen:
   - **Ausführen als:** Ich
   - **Wer hat Zugriff:** Jeder
4. **Bereitstellen** klicken und die **Web-App-URL** kopieren
   (`https://script.google.com/macros/s/…/exec`).

> „Jeder“ bedeutet nur, dass die Website das Script erreichen kann. Daten gibt es
> ausschließlich mit einem gültigen persönlichen Link.

## Schritt 4: URL an Claude schicken (oder selbst eintragen)
Schick mir die URL, dann trage ich sie ein und mache die Seite live.
Selbst eintragen geht so: In `mentee.js` ganz oben bei `const API_URL = "HIER EINFÜGEN";`.

## Schritt 5: Links ins Miro legen
In der Tabelle steht in Spalte **„Persönlicher Link“** für jeden Mentee sein eigener Link.
Leg ihn in das jeweilige Miro-Board, zum Beispiel als Button „Mein Mentee-Bereich“.
Fertig! 🎉

---

## So funktioniert es im Alltag

**Neuer Mentee:** Neue Zeile mit Name, E-Mail und Status ausfüllen. Dann im Menü
**Mentee-Bereich → Fehlende Codes & Links erzeugen** klicken, und Code und Link
erscheinen automatisch. *(Das Menü erscheint, nachdem du die Tabelle einmal neu geladen hast.)*

**Status** (Spalte C):
| Status | Zugang | Rote Meldung + Erinnerungs-Mail |
|---|---|---|
| Aktiv | ✅ | ✅ |
| Pausiert / Pausiert Lang / New Deal | ✅ | – |
| Beendet | ❌ | – |

**Laufzeit bis** (Spalte D): Ab dem Tag danach ist der Zugang automatisch gesperrt.
Leer = unbegrenzt.
⚠️ Die eingetragenen Daten sind aus „noch ~X Mon.“ **geschätzt** (Monatsende).
Bitte einmal prüfen und die echten Enddaten eintragen.

**Mehrere E-Mails** (wie bei Sonya): einfach mit Komma getrennt in eine Zelle schreiben.

**Erinnerungen:** Hatte ein *aktiver* Mentee seit über 14 Tagen keinen Termin und hat
auch keinen neuen gebucht, dann
- sieht er die **rote Meldung** im Mentee-Bereich,
- bekommt **er** eine Mail mit dem Link zum 15-Min-Check-in,
- bekommst **du** eine Mail an *anne.siebenkees@lovelifepassport.com*.

Die Mails gehen sofort raus, wenn der Mentee die Seite öffnet, sonst spätestens
am nächsten Morgen. Pro Pause gibt es genau **eine** Erinnerung (Datum in Spalte
„Letzte Erinnerung“). Sobald der Mentee wieder bucht, wird das zurückgesetzt.

**Welche Termine zählen?** Alle Termine in deinem Kalender, bei denen die E-Mail des
Mentees als Gast oder in der Beschreibung steht. So trägt YouCanBook.me die Buchungen ein.
Termine mit „Sprechstunde“ oder „Team Treffen“ im Titel zählen nicht.

**Anpassen** (oben in `Code.gs` unter `EINSTELLUNGEN`): Anzahl der Tage, deine
E-Mail-Adresse, Check-in-Link, Uhrzeit der täglichen Prüfung, welche Status erinnert werden.
Nach einer Änderung am Script: **Bereitstellen → Bereitstellungen verwalten → ✏️ →
Version: „Neue Version“ → Bereitstellen** (die URL bleibt gleich).

**Austausch:** Die Profile stehen im Blatt „Profile“. Dort kannst du auch etwas
korrigieren oder eine Zeile löschen.

---

## Austausch-Portal (`austausch.html`)

Hier schreiben deine Mentees Beiträge (Vorstellung, Frage, Erfolg, Tipp, Suche
Unterstützung, Allgemein) und kommentieren sie. Im Reiter „Team“ stehen alle
Vorstellungsprofile. Das Dashboard zeigt die 3 neuesten Beiträge als Vorschau.

- Beiträge stehen im Blatt **„Beiträge“**, Kommentare im Blatt **„Kommentare“**.
  Beide Blätter legt das Script von selbst an.
- **Moderieren:** Eine unpassende Zeile löschst du einfach in der Tabelle.
- Jeder kann nur seine eigenen Beiträge und Kommentare löschen.

## Als App aufs Handy

Der Mentee-Bereich lässt sich wie eine App installieren. Die Karte „Hol dir den
Mentee-Bereich als App aufs Handy“ auf dem Dashboard erklärt das für iPhone und
Android. Auf Android gibt es auch einen Direkt-Button. Der persönliche Link steckt
in der Adresse, deshalb öffnet die App direkt den eigenen Bereich.

## Design & Dateien

- `escape-os.css`: Escape-OS-Design (gleiche Werte wie Reel-Tool & Social-Media-Studio)
- `mentee.js`: gemeinsame Logik und die **Adresse der Web-App** (`API_URL`)
- `manifest.webmanifest`, `sw.js`, `icons/`: App-Installation
