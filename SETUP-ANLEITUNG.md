# Einrichtung: Persönlicher Zugang, eigene Termine & Austausch

Damit jeder Mentee einen eigenen Zugang hat, seine bei dir gebuchten Termine sieht
und sich im Austauschbereich vorstellen kann, braucht der Mentee-Bereich eine kleine
„Datenablage“. Dafür nutzen wir eine **Google-Tabelle mit einem Google Apps Script**.
Kostenlos, kein Programmieren nötig, einmalig ca. 15 Minuten.

> Solange du das nicht eingerichtet hast, funktioniert der Mentee-Bereich wie bisher
> (ohne Login). Die neuen Bereiche erscheinen erst, wenn Schritt 5 erledigt ist.

**Voraussetzung:** YouCanBook.me trägt die Buchungen in deinen **Google Kalender** ein
(Standard, wenn YCBM mit Google verbunden ist). Erledige alle Schritte mit **dem
Google-Konto, zu dem dieser Kalender gehört**.

---

## 1. Google-Tabelle anlegen
1. Öffne <https://sheets.new> und nenne die Tabelle z. B. **„Mentee-Bereich“**.
2. Menü **Erweiterungen → Apps Script**.
3. Lösche den vorhandenen Text komplett und füge den gesamten Inhalt der Datei
   [`backend/Code.gs`](backend/Code.gs) ein. Klicke auf **Speichern** (Disketten-Symbol).

## 2. Tabelle einrichten
1. Wähle oben im Apps-Script-Fenster die Funktion **`einrichten`** aus und klicke auf **Ausführen**.
2. Google fragt nach Berechtigungen (Tabelle & Kalender). Klicke auf
   **Berechtigungen prüfen → dein Konto → Erweitert → „… öffnen (unsicher)“ → Zulassen**.
   (Die Warnung erscheint, weil das Script von dir selbst stammt und nicht von Google geprüft wurde.)
3. In deiner Tabelle gibt es jetzt die Blätter **„Mentees“** und **„Profile“**.

## 3. Mentees eintragen
Im Blatt **„Mentees“** pro Person eine Zeile:

| Name | E-Mail | Zugangscode | Aktiv (ja/nein) |
|---|---|---|---|
| Maria Muster | maria@beispiel.de | *(leer lassen)* | ja |

- **E-Mail** = die Adresse, mit der die Person bei YouCanBook.me bucht.
  Darüber werden ihr ihre Termine zugeordnet.
- Lade die Tabelle neu. Oben erscheint das Menü **„Mentee-Bereich“**.
  Klicke auf **„2 · Fehlende Zugangscodes erzeugen“**. Jede Person bekommt einen
  eigenen 8-stelligen Code, den du ihr schickst.
- Wer nicht mehr dabei ist: bei „Aktiv“ **nein** eintragen. Ab dann ist der Zugang
  gesperrt, und das Profil verschwindet aus dem Austausch.

## 4. Als Web-App veröffentlichen
1. Im Apps-Script-Fenster oben rechts **Bereitstellen → Neue Bereitstellung**.
2. Zahnrad bei „Typ auswählen“ → **Web-App**.
3. **Ausführen als:** *Ich* · **Zugriff:** *Jeder*.
4. **Bereitstellen** klicken und die **Web-App-URL** kopieren
   (sieht aus wie `https://script.google.com/macros/s/…/exec`).

> „Jeder“ heißt nur, dass die Seite das Script erreichen kann. Ohne gültigen
> Zugangscode gibt es keine Daten.

## 5. URL in den Mentee-Bereich eintragen
In `index.html` ganz oben im Pflegebereich:

```js
zugang: {
  apiUrl: "https://script.google.com/macros/s/…/exec",
},
```

Speichern und hochladen. Ab jetzt sehen deine Mentees die Login-Seite.

---

## Gut zu wissen
- **Welche Termine werden angezeigt?** Alle Termine in deinem Kalender, bei denen die
  E-Mail des Mentees als Gast oder in der Beschreibung steht (so trägt YCBM die
  Buchungen ein). Termine mit „Sprechstunde“ oder „Team Treffen“ im Titel zählen nicht.
  Die Liste kannst du oben in `Code.gs` unter `IGNORIEREN` anpassen.
- **Rote Meldung:** erscheint, wenn der letzte Termin mehr als **14 Tage** her ist **und**
  noch kein neuer gebucht ist (oder es noch nie einen gab). Die Zahl änderst du in
  `Code.gs` bei `ALARM_TAGE`.
- Neue Buchungen erscheinen nach spätestens **5 Minuten** im Mentee-Bereich.
- **Änderungen am Script** werden erst aktiv, wenn du unter **Bereitstellen →
  Bereitstellungen verwalten → Bearbeiten (Stift) → Version: Neue Version →
  Bereitstellen** eine neue Version anlegst. Die URL bleibt dabei gleich.
- **Profile** stehen im Blatt „Profile“. Dort kannst du auch etwas korrigieren oder löschen.
