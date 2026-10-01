/* ============================================================================
   The Escape Theory · Mentee-Bereich – Hintergrund-Script (Google Apps Script)
   ----------------------------------------------------------------------------
   Dieses Script gehört in die Google-Tabelle "TET Mentee-Bereich"
   (Erweiterungen → Apps Script). Es
     • erkennt jeden Mentee an seinem persönlichen Link (?z=CODE),
     • liest aus DEINEM Google Kalender die bei dir gebuchten Termine
       (YouCanBook.me trägt sie dort ein) – jeder Mentee sieht nur seine eigenen,
     • schickt einmal täglich die Erinnerungs-Mails (an dich + an den Mentee),
       wenn jemand länger als 14 Tage keinen Termin hatte und keinen neuen gebucht hat,
     • speichert die Vorstellungs-Profile für den Austauschbereich.
   Schritt-für-Schritt-Anleitung: siehe SETUP-ANLEITUNG.md im Repository.
   ============================================================================ */

/* --- HIER KANNST DU ANPASSEN ------------------------------------------------ */
const EINSTELLUNGEN = {
  KALENDER_ID: 'primary',   // 'primary' = dein Hauptkalender. Sonst die Kalender-ID eintragen.
  ALARM_TAGE: 14,           // Rote Meldung + Mail, wenn so viele Tage kein Termin war & keiner gebucht ist
  RUECKBLICK_TAGE: 180,     // So weit wird nach vergangenen Terminen gesucht
  VORSCHAU_TAGE: 120,       // So weit in die Zukunft werden Termine angezeigt
  // Termine, deren Titel eines dieser Wörter enthält, zählen NICHT als 1:1-Termin:
  IGNORIEREN: ['Sprechstunde', 'Team Treffen', 'Team-Treffen'],

  // Wer hat Zugang? Alle Status außer diesen (und nur bis „Laufzeit bis“):
  KEIN_ZUGANG_STATUS: ['Beendet'],
  // Wer bekommt rote Meldung + Erinnerungs-Mail? (Pausierte bewusst nicht)
  ERINNERUNG_STATUS: ['Aktiv'],

  MEINE_EMAIL: 'anne.siebenkees@lovelifepassport.com',   // hierhin geht deine Meldung
  ABSENDER_NAME: 'Anne Siebenkees',
  CHECKIN_LINK: 'https://businessbegleitung-checkin.youcanbook.me/',
  BEREICH_LINK: 'https://annesiebenkees-ai.github.io/tet-mentee-bereich/',
  MAIL_UHRZEIT: 8,          // tägliche Prüfung gegen 8 Uhr morgens
  // ID der Tabelle „TET Mentee-Bereich“ (aus ihrer Adresse). Nötig, wenn das Script
  // als eigene Datei läuft; ist es direkt in der Tabelle eingebaut, wird diese genutzt.
  TABELLEN_ID: '1Y20RZgmugoX2ulqJSHY83ldEgvPJn_BUnGXTkZur9qI',
};
/* --------------------------------------------------------------------------- */

const TAB_MENTEES = 'Mentees';
const TAB_PROFILE = 'Profile';
const KOPF_MENTEES = ['Name', 'E-Mail', 'Status', 'Laufzeit bis', 'Zugangscode',
                      'Persönlicher Link', 'AM', 'Funnelmapping', 'Letzte Erinnerung'];
const KOPF_PROFILE = ['E-Mail', 'Name', 'Business', 'Über mich', 'Ich biete', 'Ich suche',
                      'Instagram', 'Website', 'Foto-URL', 'E-Mail zeigen', 'Aktualisiert'];
const MAX_LAENGE = 600;

function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(EINSTELLUNGEN.TABELLEN_ID);
}

/* ---------- Menü in der Tabelle ---------- */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Mentee-Bereich')
    .addItem('Einrichten (einmalig)', 'einrichten')
    .addItem('Fehlende Codes & Links erzeugen', 'codesErzeugen')
    .addItem('Erinnerungen jetzt prüfen', 'taeglichePruefung')
    .addToUi();
}

/* Einmalig ausführen: Blätter anlegen, Codes erzeugen, tägliche Prüfung starten. */
function einrichten() {
  const ss = ss_();
  let m = ss.getSheetByName(TAB_MENTEES);
  if (!m) {
    const erstes = ss.getSheets()[0];
    if (String(erstes.getRange(1, 1).getValue()).trim() === 'Name') { erstes.setName(TAB_MENTEES); m = erstes; }
    else { m = ss.insertSheet(TAB_MENTEES); }
  }
  [[m, KOPF_MENTEES], [ss.getSheetByName(TAB_PROFILE) || ss.insertSheet(TAB_PROFILE), KOPF_PROFILE]]
    .forEach(([sh, kopf]) => {
      const vorhanden = sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String) : [];
      kopf.forEach(k => { if (vorhanden.indexOf(k) < 0) { vorhanden.push(k); sh.getRange(1, vorhanden.length).setValue(k); } });
      sh.getRange(1, 1, 1, vorhanden.length).setFontWeight('bold');
      sh.setFrozenRows(1);
    });
  codesErzeugen();

  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'taeglichePruefung')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('taeglichePruefung').timeBased().everyDays(1).atHour(EINSTELLUNGEN.MAIL_UHRZEIT).create();

  // Einmal Mail-Berechtigung abfragen (es wird nichts verschickt)
  MailApp.getRemainingDailyQuota();
}

/* Füllt leere Zugangscodes mit zufälligen 12-stelligen Codes und baut die Links. */
function codesErzeugen() {
  const t = tabelle_(TAB_MENTEES);
  const zeichen = 'ABCDFGHJKLMNPQRSTUVWXYZ23456789';
  t.zeilen.forEach((r, i) => {
    if (!wert_(t, r, 'Name')) return;
    let code = wert_(t, r, 'Zugangscode');
    if (!code) {
      code = 'T';
      for (let k = 0; k < 11; k++) code += zeichen[Math.floor(Math.random() * zeichen.length)];
      setzen_(t, i, 'Zugangscode', code);
    }
    setzen_(t, i, 'Persönlicher Link', EINSTELLUNGEN.BEREICH_LINK + '?z=' + code);
  });
}

/* ---------- Tabellen-Helfer (Spalten werden über die Überschrift gefunden) ---------- */
function tabelle_(name) {
  const sh = ss_().getSheetByName(name);
  if (!sh || sh.getLastRow() < 1) return { sh: sh, kopf: [], zeilen: [] };
  const alle = sh.getRange(1, 1, sh.getLastRow(), Math.max(sh.getLastColumn(), 1)).getValues();
  return { sh: sh, kopf: alle[0].map(k => String(k).trim()), zeilen: alle.slice(1) };
}
function wert_(t, r, spalte) {
  const i = t.kopf.indexOf(spalte);
  if (i < 0) return '';
  const v = r[i];
  return v instanceof Date ? v : String(v == null ? '' : v).trim();
}
function setzen_(t, zeilenIndex, spalte, wert) {
  const i = t.kopf.indexOf(spalte);
  if (i >= 0) t.sh.getRange(zeilenIndex + 2, i + 1).setValue(wert);
}

/* Datum aus Zelle lesen: echtes Datum, „2027-03-31“ oder „31.03.2027“. Leer = unbegrenzt. */
function datum_(v) {
  if (v instanceof Date) return v;
  let m = String(v).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return new Date(+m[1], m[2] - 1, +m[3]);
  m = String(v).match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) return new Date(+m[3], m[2] - 1, +m[1]);
  return null;
}

/* ---------- Mentees ---------- */
function mentees_() {
  const t = tabelle_(TAB_MENTEES);
  const heute = new Date(); heute.setHours(0, 0, 0, 0);
  const ohne = EINSTELLUNGEN.KEIN_ZUGANG_STATUS.map(s => s.toLowerCase());
  const erinnern = EINSTELLUNGEN.ERINNERUNG_STATUS.map(s => s.toLowerCase());
  return t.zeilen.map((r, i) => {
    const status = String(wert_(t, r, 'Status'));
    const bis = datum_(wert_(t, r, 'Laufzeit bis'));
    const abgelaufen = bis !== null && bis < heute;
    return {
      zeile: i,
      name: String(wert_(t, r, 'Name')),
      emails: String(wert_(t, r, 'E-Mail')).toLowerCase().split(/[\s,;]+/).filter(Boolean),
      code: String(wert_(t, r, 'Zugangscode')).toUpperCase(),
      status: status,
      zugang: !abgelaufen && ohne.indexOf(status.toLowerCase()) < 0,
      erinnern: erinnern.indexOf(status.toLowerCase()) >= 0,
      link: String(wert_(t, r, 'Persönlicher Link')),
      letzteErinnerung: wert_(t, r, 'Letzte Erinnerung'),
    };
  }).filter(m => m.name && m.emails.length && m.zugang);
}

function menteeFinden_(code) {
  code = String(code || '').trim().toUpperCase();
  if (code.length < 8) return null;
  return mentees_().find(m => m.code === code) || null;
}

/* ---------- Web-App-Eingang ---------- */
function doGet(e)  { return antwort_(e && e.parameter || {}); }
function doPost(e) {
  let daten = {};
  try { daten = JSON.parse(e.postData.contents); } catch (_) {}
  return antwort_(daten);
}

function antwort_(p) {
  try {
    const ich = menteeFinden_(p.code);
    if (!ich) {
      Utilities.sleep(800); // bremst Raten von Codes
      return json_({ ok: false, fehler: 'Dein persönlicher Link ist nicht (mehr) gültig. Melde dich gern bei Anne.' });
    }
    if (p.aktion === 'profilSpeichern') profilSpeichern_(ich, p.profil || {});
    const termine = termine_(ich.emails, true);
    if (!ich.erinnern) termine.alarm = false;
    // Rote Meldung erscheint gerade → Mails sofort mitschicken (falls heute noch nicht passiert)
    if (termine.alarm && !ich.letzteErinnerung) {
      erinnerungSenden_(ich, termine);
      setzen_(tabelle_(TAB_MENTEES), ich.zeile, 'Letzte Erinnerung', new Date());
    }
    return json_({ ok: true, ich: { name: ich.name }, termine: termine, profile: profile_(ich.emails[0]) });
  } catch (err) {
    return json_({ ok: false, fehler: 'Technischer Fehler: ' + err });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------- Termine aus dem Kalender ---------- */
function kalenderEvents_() {
  const cal = EINSTELLUNGEN.KALENDER_ID === 'primary'
    ? CalendarApp.getDefaultCalendar()
    : CalendarApp.getCalendarById(EINSTELLUNGEN.KALENDER_ID);
  const jetzt = new Date();
  const ignorieren = EINSTELLUNGEN.IGNORIEREN.map(s => s.toLowerCase());
  return cal.getEvents(
    new Date(jetzt.getTime() - EINSTELLUNGEN.RUECKBLICK_TAGE * 86400000),
    new Date(jetzt.getTime() + EINSTELLUNGEN.VORSCHAU_TAGE * 86400000)
  ).filter(ev => !ignorieren.some(w => (ev.getTitle() || '').toLowerCase().includes(w)))
   .map(ev => ({
     titel: ev.getTitle(),
     start: ev.getStartTime(),
     ende: ev.getEndTime(),
     suchtext: ((ev.getDescription() || '') + ' ' +
                ev.getGuestList(true).map(g => g.getEmail() || '').join(' ')).toLowerCase(),
   }));
}

function termine_(emails, mitCache, events) {
  const cache = CacheService.getScriptCache();
  const key = 't_' + emails.join(',');
  if (mitCache) { const hit = cache.get(key); if (hit) return JSON.parse(hit); }

  const jetzt = new Date();
  const passend = (events || kalenderEvents_()).filter(ev => emails.some(e => ev.suchtext.includes(e)));
  const kommend = passend.filter(ev => ev.ende >= jetzt).sort((a, b) => a.start - b.start)
    .map(ev => ({ titel: ev.titel, start: ev.start.toISOString(), minuten: Math.round((ev.ende - ev.start) / 60000) }));
  const letzter = passend.filter(ev => ev.ende < jetzt).map(ev => ev.start).sort((a, b) => b - a)[0] || null;
  const tageSeit = letzter ? Math.floor((jetzt - letzter) / 86400000) : null;

  const ergebnis = {
    kommend: kommend,
    letzter: letzter ? letzter.toISOString() : null,
    tageSeit: tageSeit,
    alarmTage: EINSTELLUNGEN.ALARM_TAGE,
    alarm: kommend.length === 0 && (tageSeit === null || tageSeit > EINSTELLUNGEN.ALARM_TAGE),
  };
  cache.put(key, JSON.stringify(ergebnis), 300); // 5 Min zwischenspeichern
  return ergebnis;
}

/* ---------- Tägliche Erinnerungs-Mails ---------- */
// Läuft automatisch einmal am Tag. Pro „Pause“ geht genau EINE Erinnerung raus.
// Sobald der Mentee wieder einen Termin bucht, wird das zurückgesetzt.
function taeglichePruefung() {
  const t = tabelle_(TAB_MENTEES);
  const events = kalenderEvents_();
  mentees_().filter(m => m.erinnern).forEach(m => {
    const termine = termine_(m.emails, false, events);
    if (!termine.alarm) {
      if (m.letzteErinnerung) setzen_(t, m.zeile, 'Letzte Erinnerung', '');
      return;
    }
    if (m.letzteErinnerung) return; // schon erinnert
    erinnerungSenden_(m, termine);
    setzen_(t, m.zeile, 'Letzte Erinnerung', new Date());
  });
}

function erinnerungSenden_(m, termine) {
  const vorname = m.name.split(' ')[0];
  const seit = termine.tageSeit === null
    ? 'du hast bisher noch keinen 1:1-Termin bei mir gebucht'
    : 'dein letzter Termin bei mir ist schon ' + termine.tageSeit + ' Tage her';
  const link = EINSTELLUNGEN.CHECKIN_LINK;

  MailApp.sendEmail({
    to: m.emails.join(','),
    replyTo: EINSTELLUNGEN.MEINE_EMAIL,
    name: EINSTELLUNGEN.ABSENDER_NAME,
    subject: 'Zeit für deinen nächsten Check-in 💛',
    body: 'Hallo ' + vorname + ',\n\n' + seit + ' – lass uns wieder gemeinsam auf dein Business schauen!\n\n' +
          'Buch dir hier deinen 15-Minuten-Check-in:\n' + link + '\n\n' +
          'Ich freu mich auf dich!\nDeine Anne',
    htmlBody:
      '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#0d1c32;max-width:520px">' +
      '<p>Hallo ' + vorname + ',</p>' +
      '<p>' + seit + ' – lass uns wieder gemeinsam auf dein Business schauen!</p>' +
      '<p style="margin:26px 0"><a href="' + link + '" style="background:#0d1c32;color:#fff;text-decoration:none;' +
      'padding:13px 24px;border-radius:100px;display:inline-block">15-Minuten-Check-in buchen</a></p>' +
      '<p>Ich freu mich auf dich!<br>Deine Anne</p></div>',
  });

  MailApp.sendEmail({
    to: EINSTELLUNGEN.MEINE_EMAIL,
    subject: '🔴 ' + m.name + ': seit über ' + EINSTELLUNGEN.ALARM_TAGE + ' Tagen kein Termin',
    body: m.name + ' (' + m.emails.join(', ') + ', Status: ' + m.status + ')\n\n' +
          (termine.tageSeit === null ? 'Noch kein 1:1-Termin gefunden.' : 'Letzter Termin vor ' + termine.tageSeit + ' Tagen.') +
          '\nEs ist kein neuer Termin gebucht.\n\n' +
          'Die Erinnerung mit dem Link zum 15-Min-Check-in ist gerade an ' + vorname + ' rausgegangen.',
  });
}

/* ---------- Austausch: Profile ---------- */
function profile_(meineEmail) {
  const aktiv = {};
  mentees_().forEach(m => { aktiv[m.emails[0]] = m; });
  const t = tabelle_(TAB_PROFILE);
  return t.zeilen
    .map(r => ({ r: r, email: String(wert_(t, r, 'E-Mail')).toLowerCase() }))
    .filter(x => aktiv[x.email])                       // nur Mentees mit Zugang
    .map(({ r, email }) => {
      const eigenes = email === meineEmail;
      const zeigen = String(wert_(t, r, 'E-Mail zeigen')).toLowerCase() === 'ja';
      const akt = wert_(t, r, 'Aktualisiert');
      return {
        eigenes: eigenes,
        name: String(wert_(t, r, 'Name') || aktiv[email].name),
        business: String(wert_(t, r, 'Business')), ueber: String(wert_(t, r, 'Über mich')),
        biete: String(wert_(t, r, 'Ich biete')), suche: String(wert_(t, r, 'Ich suche')),
        instagram: String(wert_(t, r, 'Instagram')), website: String(wert_(t, r, 'Website')),
        foto: String(wert_(t, r, 'Foto-URL')),
        emailZeigen: zeigen,
        kontakt: (zeigen || eigenes) ? email : '',
        aktualisiert: akt instanceof Date ? akt.toISOString() : '',
      };
    })
    .sort((a, b) => (b.aktualisiert || '').localeCompare(a.aktualisiert || ''));
}

function profilSpeichern_(ich, p) {
  const s = v => String(v || '').trim().slice(0, MAX_LAENGE);
  const werte = {
    'E-Mail': ich.emails[0], 'Name': s(p.name) || ich.name, 'Business': s(p.business),
    'Über mich': s(p.ueber), 'Ich biete': s(p.biete), 'Ich suche': s(p.suche),
    'Instagram': s(p.instagram), 'Website': s(p.website), 'Foto-URL': s(p.foto),
    'E-Mail zeigen': p.emailZeigen ? 'ja' : 'nein', 'Aktualisiert': new Date(),
  };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const t = tabelle_(TAB_PROFILE);
    const zeile = t.kopf.map(k => (k in werte ? werte[k] : ''));
    const i = t.zeilen.findIndex(r => String(wert_(t, r, 'E-Mail')).toLowerCase() === ich.emails[0]);
    if (i >= 0) t.sh.getRange(i + 2, 1, 1, zeile.length).setValues([zeile]);
    else t.sh.appendRow(zeile);
  } finally {
    lock.releaseLock();
  }
}
