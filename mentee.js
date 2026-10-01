/* =====================================================================
   The Escape Theory · Mentee-Bereich — gemeinsame Logik (Dashboard + Austausch)
   ===================================================================== */

/* Adresse der Google-Apps-Script-Web-App (siehe SETUP-ANLEITUNG.md).
   Leer lassen ("") = persönliche Bereiche ausgeblendet. */
const API_URL = "https://script.google.com/macros/s/AKfycbyXyMPS_TaaBA6s7XjQR4d8v_R8O1ezR27FNddf-8Yv_HlY_t87kK1DSVLuCTezubIK/exec";

const MON  = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
const MONL = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
const TAG  = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"];
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, "0");
function fmtLong(dt){ return `${TAG[dt.getDay()]}, ${dt.getDate()}. ${MONL[dt.getMonth()]} ${dt.getFullYear()} · ${pad(dt.getHours())}:${pad(dt.getMinutes())} Uhr`; }
function fmtRel(iso){
  const dt = new Date(iso), diff = (Date.now() - dt) / 1000;
  if (isNaN(dt)) return "";
  if (diff < 60) return "gerade eben";
  if (diff < 3600) return `vor ${Math.floor(diff/60)} Min`;
  if (diff < 86400) return `vor ${Math.floor(diff/3600)} Std`;
  if (diff < 7*86400) { const d = Math.floor(diff/86400); return d === 1 ? "gestern" : `vor ${d} Tagen`; }
  return `${dt.getDate()}. ${MONL[dt.getMonth()]} ${dt.getFullYear()}`;
}
function esc(s){ return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
// Text sicher anzeigen + Links klickbar machen
function richText(s){
  return esc(s).replace(/(https?:\/\/[^\s<]+)/g, u => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
}
function safeUrl(u){
  u = String(u || "").trim(); if (!u) return "";
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ""; } catch { return ""; }
}
function igUrl(v){
  v = String(v || "").trim(); if (!v) return "";
  if (/instagram\.com/i.test(v)) return safeUrl(v);
  return "https://instagram.com/" + encodeURIComponent(v.replace(/^@/, ""));
}
function initials(name){ return esc((name || "?").split(/\s+/).filter(Boolean).map(w => w[0]).join("").slice(0,2).toUpperCase()); }
function avatar(name, foto, cls){
  const f = safeUrl(foto);
  return `<div class="ava${cls ? " " + cls : ""}">${f ? `<img src="${esc(f)}" alt="" loading="lazy" referrerpolicy="no-referrer" />` : initials(name)}</div>`;
}

/* ---------- Persönlicher Zugang (?z=CODE) ---------- */
// Der Code bleibt in der Adresse stehen: So nimmt „Zum Home-Bildschirm“ auf dem
// Handy den persönlichen Zugang automatisch mit.
const CODE_KEY = "tet-zugangscode";
function getCode(){ try { return localStorage.getItem(CODE_KEY) || ""; } catch { return ""; } }
function setCode(c){ try { c ? localStorage.setItem(CODE_KEY, c) : localStorage.removeItem(CODE_KEY); } catch {} }
(function(){
  const url = new URL(location.href);
  const z = (url.searchParams.get("z") || "").trim().toUpperCase();
  if (z) setCode(z);
  else if (getCode()) { url.searchParams.set("z", getCode()); history.replaceState(null, "", url); }
})();
function withCode(href){
  const c = getCode(); if (!c) return href;
  const u = new URL(href, location.href); u.searchParams.set("z", c); return u.pathname.split("/").pop() + u.search + u.hash;
}

async function api(payload){
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" }, // kein CORS-Preflight
    body: JSON.stringify({ code: getCode(), ...payload }),
  });
  return res.json();
}

/* ---------- Beiträge (Austausch-Portal) ---------- */
const KATEGORIEN = ["Vorstellung", "Frage", "Erfolg", "Tipp", "Suche Unterstützung", "Allgemein"];
const KAT_ICON = { "Vorstellung":"👋", "Frage":"❓", "Erfolg":"🎉", "Tipp":"💡", "Suche Unterstützung":"🤝", "Allgemein":"💬" };

/* ---------- Als App aufs Handy ---------- */
let installPrompt = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installPrompt = e; document.dispatchEvent(new Event("tet-installbar")); });
const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const plattform = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  ? "ios" : /android/i.test(navigator.userAgent) ? "android" : "desktop";
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
