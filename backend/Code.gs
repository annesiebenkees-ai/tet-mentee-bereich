/* ============================================================================
   The Escape Theory · Mentee-Bereich – Hintergrund-Script (Google Apps Script)
   ----------------------------------------------------------------------------
   Dieses Script gehört in die Google-Tabelle "Mentee-Bereich"
   (Erweiterungen → Apps Script). Es
     • prüft die persönlichen Zugangscodes deiner Mentees,
     • liest aus DEINEM Google Kalender die bei dir gebuchten Termine
       (YouCanBook.me trägt sie dort ein) – jeder Mentee sieht nur seine eigenen,
     • speichert die Vorstellungs-Profile für den Austauschbereich.
   Schritt-für-Schritt-Anleitung: siehe SETUP-ANLEITUNG.md im Repository.
   ============================================================================ */

/* --- HIER KANNST DU ANPASSEN ------------------------------------------------ */
const EINSTELLUNGEN = {
  KALENDER_ID: 'primary',   // 'primary' = dein Hauptkalender. Sonst die Kalender-ID eintragen.
  ALARM_TAGE: 14,           // Rote Meldung, wenn so viele Tage kein Termin war & keiner gebucht ist
  RUECKBLICK_TAGE: 180,     // So weit wird nach vergangenen Terminen gesucht
  VORSCHAU_TAGE: 120,       // So weit in die Zukunft werden Termine angezeigt
  // Termine, deren Titel eines dieser Wörter enthält, zählen NICHT als 1:1-Termin
  // (z. B. die wöchentliche Team-Sprechstunde):
  IGNORIEREN: ['Sprechstunde', 'Team Treffen', 'Team-Treffen'],
};
/* --------------------------------------------------------------------------- */

const TAB_MENTEES = 'Mentees';
const TAB_PROFILE = 'Profile';
const KOPF_MENTEES = ['Name', 'E-Mail', 'Zugangscode', 'Aktiv (ja/nein)'];
const KOPF_PROFILE = ['E-Mail', 'Name', 'Business', 'Über mich', 'Ich biete', 'Ich suche',
                      'Instagram', 'Website', 'Foto-URL', 'E-Mail zeigen', 'Aktualisiert'];
const MAX_LAENGE = 600;

/* ---------- Menü in der Tabelle ---------- */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Mentee-Bereich')
    .addItem('1 · Tabelle einrichten', 'einrichten')
    .addItem('2 · Fehlende Zugangscodes erzeugen', 'codesErzeugen')
    .addToUi();
}

/* Legt die beiden Tabellenblätter mit Überschriften an (falls noch nicht da). */
function einrichten() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  [[TAB_MENTEES, KOPF_MENTEES], [TAB_PROFILE, KOPF_PROFILE]].forEach(([name, kopf]) => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.appendRow(kopf);
      sh.getRange(1, 1, 1, kopf.length).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
  });
}

/* Füllt leere Zugangscodes mit zufälligen 8-stelligen Codes. */
function codesErzeugen() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB_MENTEES);
  const zeilen = sh.getLastRow() - 1;
  if (zeilen < 1) return;
  const bereich = sh.getRange(2, 1, zeilen, 3);
  const werte = bereich.getValues();
  const zeichen = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  werte.forEach(r => {
    if (r[0] && !String(r[2]).trim()) {
      let c = '';
      for (let i = 0; i < 8; i++) c += zeichen[Math.floor(Math.random() * zeichen.length)];
      r[2] = c;
    }
  });
  bereich.setValues(werte);
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
      return json_({ ok: false, fehler: 'Dieser Zugangscode ist uns nicht bekannt.' });
    }
    if (p.aktion === 'profilSpeichern') profilSpeichern_(ich, p.profil || {});
    return json_({
      ok: true,
      ich: { name: ich.name },
      termine: termine_(ich.email),
      profile: profile_(ich.email),
    });
  } catch (err) {
    return json_({ ok: false, fehler: 'Technischer Fehler: ' + err });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------- Mentees ---------- */
function mentees_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB_MENTEES);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues()
    .filter(r => r[0] && r[1] && String(r[3]).trim().toLowerCase() !== 'nein')
    .map(r => ({
      name: String(r[0]).trim(),
      email: String(r[1]).trim().toLowerCase(),
      code: String(r[2]).trim().toUpperCase(),
    }));
}

function menteeFinden_(code) {
  code = String(code || '').trim().toUpperCase();
  if (code.length < 4) return null;
  return mentees_().find(m => m.code && m.code === code) || null;
}

/* ---------- Termine aus dem Kalender ---------- */
function termine_(email) {
  const cache = CacheService.getScriptCache();
  const key = 't_' + email;
  const hit = cache.get(key);
  if (hit) return JSON.parse(hit);

  const cal = EINSTELLUNGEN.KALENDER_ID === 'primary'
    ? CalendarApp.getDefaultCalendar()
    : CalendarApp.getCalendarById(EINSTELLUNGEN.KALENDER_ID);
  const jetzt = new Date();
  const von = new Date(jetzt.getTime() - EINSTELLUNGEN.RUECKBLICK_TAGE * 86400000);
  const bis = new Date(jetzt.getTime() + EINSTELLUNGEN.VORSCHAU_TAGE * 86400000);
  const ignorieren = EINSTELLUNGEN.IGNORIEREN.map(s => s.toLowerCase());

  const passend = cal.getEvents(von, bis).filter(ev => {
    const titel = (ev.getTitle() || '').toLowerCase();
    if (ignorieren.some(w => titel.includes(w))) return false;
    if ((ev.getDescription() || '').toLowerCase().includes(email)) return true;
    return ev.getGuestList(true).some(g => (g.getEmail() || '').toLowerCase() === email);
  });

  const kommend = passend
    .filter(ev => ev.getEndTime() >= jetzt)
    .sort((a, b) => a.getStartTime() - b.getStartTime())
    .map(ev => ({
      titel: ev.getTitle(),
      start: ev.getStartTime().toISOString(),
      minuten: Math.round((ev.getEndTime() - ev.getStartTime()) / 60000),
    }));

  const vergangen = passend
    .filter(ev => ev.getEndTime() < jetzt)
    .map(ev => ev.getStartTime())
    .sort((a, b) => b - a);
  const letzter = vergangen[0] || null;
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

/* ---------- Austausch: Profile ---------- */
function profilBlatt_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(TAB_PROFILE);
  if (!sh) { einrichten(); sh = ss.getSheetByName(TAB_PROFILE); }
  return sh;
}

function profile_(meineEmail) {
  const aktiv = {};
  mentees_().forEach(m => { aktiv[m.email] = m; });
  const sh = profilBlatt_();
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, KOPF_PROFILE.length).getValues()
    .map(r => ({ email: String(r[0]).trim().toLowerCase(), r: r }))
    .filter(x => aktiv[x.email])                       // nur aktive Mentees
    .map(({ email, r }) => {
      const eigenes = email === meineEmail;
      const zeigen = String(r[9]).toLowerCase() === 'ja';
      return {
        eigenes: eigenes,
        name: String(r[1] || aktiv[email].name),
        business: String(r[2]), ueber: String(r[3]),
        biete: String(r[4]), suche: String(r[5]),
        instagram: String(r[6]), website: String(r[7]), foto: String(r[8]),
        emailZeigen: zeigen,
        kontakt: (zeigen || eigenes) ? email : '',
        aktualisiert: r[10] instanceof Date ? r[10].toISOString() : '',
      };
    })
    .sort((a, b) => (b.aktualisiert || '').localeCompare(a.aktualisiert || ''));
}

function profilSpeichern_(ich, p) {
  const t = v => String(v || '').trim().slice(0, MAX_LAENGE);
  const zeile = [
    ich.email, t(p.name) || ich.name, t(p.business), t(p.ueber), t(p.biete), t(p.suche),
    t(p.instagram), t(p.website), t(p.foto), p.emailZeigen ? 'ja' : 'nein', new Date(),
  ];
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = profilBlatt_();
    const n = sh.getLastRow() - 1;
    const emails = n > 0 ? sh.getRange(2, 1, n, 1).getValues().map(r => String(r[0]).trim().toLowerCase()) : [];
    const i = emails.indexOf(ich.email);
    if (i >= 0) sh.getRange(i + 2, 1, 1, zeile.length).setValues([zeile]);
    else sh.appendRow(zeile);
  } finally {
    lock.releaseLock();
  }
}
