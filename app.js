alert("app.js läuft ✅");
// =========================
// 1) HIER EINTRAGEN
// =========================
const SUPABASE_URL = "https://nvnjbmviyifslpsgljid.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52bmpibXZpeWlmc2xwc2dsamlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDk5NDIsImV4cCI6MjA4MjQ4NTk0Mn0.g21Hp-wSTGmW-Uhtg4qJO767_DIl_rOztwPztVvrtBM";

// =========================
// 2) Tabellen-/Spaltennamen (dein Setup)
// =========================
const T = {
  fach: "fach",
  thema: "thema",
  item: "item",
  bewertungsskala: "bewertungsskala",
  zeugniseintraege: "zeugniseintraege",
  fachstand: "fachstand",
};

const C = {
  // fach
  fach_name: "name",
  fach_order: "order",

  // thema
  thema_jahrgang: "jahrgang",
  thema_name: "thema",
  thema_fach: "fach",

  // item
  item_jahrgang: "jahrgang",
  item_thema: "thema",
  item_text: "item",
  item_track: "track",
  item_fach: "fach",

  // bewertungsskala
  rating_label: "label",
  rating_order: "order",

  // zeugniseintraege
  z_kind_code: "kind_code",
  z_fach: "fach",
  z_jahrgang: "jahrgang",
  z_thema: "thema",
  z_item: "item",
  z_bewertung: "bewertungsskala",
  z_eingabe_id: "eingabe_id",
  z_pool_jahrgang: "pool_jahrgang",
  z_pool_thema: "pool_thema",

  // fachstand
  fs_kind_code: "kind_code",
  fs_fach: "fach",
  fs_aktuelle_eingabe_id: "aktuelle_eingabe_id",
  fs_aktualisiert_am: "aktualisiert_am",
};

// =========================
// 3) Track → Zielanzahl
// =========================
const TRACK_COUNTS = {
  hauptfach: 7,
  nebenfach: 5,
  arbeitsverhalten: 8,
  sozialverhalten: 8,
};

// =========================
// Supabase Client laden (ESM)
// =========================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =========================
// UI (IDs müssen in index.html existieren)
// =========================
const elKind = document.getElementById("kind_code");   // input
const elFach = document.getElementById("fach");        // select
const elPoolJg = document.getElementById("pool_jahrgang"); // select/input
const elThema = document.getElementById("thema");      // select
const elLoadItems = document.getElementById("loadItemsBtn"); // button
const elItems = document.getElementById("items");      // div
const elKorb = document.getElementById("korb");        // div
const elSave = document.getElementById("saveBtn");     // button
const elStatus = document.getElementById("status");    // div
const elInfo = document.getElementById("info");        // optional (wenn vorhanden)

function setStatus(msg) {
  if (elStatus) elStatus.textContent = msg;
  console.log(msg);
}

function normalizeTrack(x) {
  if (!x) return null;
  const t = String(x).trim().toLowerCase();
  if (t.includes("haupt")) return "hauptfach";
  if (t.includes("neben")) return "nebenfach";
  if (t.includes("arbeits")) return "arbeitsverhalten";
  if (t.includes("sozial")) return "sozialverhalten";
  return t;
}

// =========================
// State
// =========================
let ratings = [];         // [{label, order}]
let currentItems = [];    // items in current view
let currentTrack = null;  // hauptfach/nebenfach...
let requiredCount = null; // number
let korb = [];            // [{pool_jahrgang, pool_thema, item_text, bewertung_label}]

function korbKey(e) {
  return `${e.pool_jahrgang}||${e.pool_thema}||${e.item_text}`;
}

function findInKorb(pool_jahrgang, pool_thema, item_text) {
  const key = `${pool_jahrgang}||${pool_thema}||${item_text}`;
  return korb.find(e => korbKey(e) === key) || null;
}

// =========================
// Render Korb
// =========================
function renderKorb() {
  if (!elKorb) return;

  if (korb.length === 0) {
    elKorb.innerHTML = "<div>Noch keine Auswahl.</div>";
    updateSaveState();
    return;
  }

  elKorb.innerHTML = "";
  for (const entry of korb) {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "1fr auto auto";
    row.style.gap = "10px";
    row.style.alignItems = "center";
    row.style.padding = "8px 0";
    row.style.borderBottom = "1px solid #ddd";

    const left = document.createElement("div");
    left.innerHTML = `<div><b>${escapeHtml(entry.item_text)}</b></div>
      <div style="font-size:12px;opacity:.75;">Pool: Jg ${entry.pool_jahrgang} · Thema: ${escapeHtml(entry.pool_thema)}</div>`;

    const sel = document.createElement("select");
    sel.innerHTML =
      `<option value="">— Bewertung —</option>` +
      ratings
        .slice()
        .sort((a, b) => a.order - b.order)
        .map(r => `<option value="${escapeAttr(r.label)}">${escapeHtml(r.label)}</option>`)
        .join("");

    sel.value = entry.bewertung_label || "";
    sel.addEventListener("change", () => {
      entry.bewertung_label = sel.value || null;
      updateSaveState();
    });

    const btn = document.createElement("button");
    btn.textContent = "✕";
    btn.title = "Entfernen";
    btn.addEventListener("click", () => {
      korb = korb.filter(x => korbKey(x) !== korbKey(entry));
      renderItems(); // Checkboxen neu setzen
      renderKorb();
    });

    row.appendChild(left);
    row.appendChild(sel);
    row.appendChild(btn);
    elKorb.appendChild(row);
  }

  updateSaveState();
}

function updateSaveState() {
  const kind = elKind?.value?.trim() || "";
  const fach = elFach?.value || "";

  const allRated = korb.every(e => !!e.bewertung_label);
  const countOK = requiredCount != null && korb.length === requiredCount;

  let ok = true;
  let msg = "";

  if (!kind) { ok = false; msg = "Bitte Kind-Code eingeben."; }
  else if (!fach) { ok = false; msg = "Bitte Fach wählen."; }
  else if (requiredCount == null) { ok = false; msg = "Track/Ziel nicht ermittelt. Prüfe item.track in Supabase."; }
  else if (!countOK) { ok = false; msg = `Bitte genau ${requiredCount} Items auswählen (aktuell ${korb.length}).`; }
  else if (!allRated) { ok = false; msg = "Bitte für alle ausgewählten Items eine Bewertung wählen."; }
  else { msg = "Bereit zum Speichern."; }

  if (elSave) elSave.disabled = !ok;
  setStatus(msg);

  if (elInfo) {
    elInfo.textContent = `track: ${currentTrack ?? "—"} | ziel: ${requiredCount ?? "—"} | gewählt: ${korb.length}`;
  }
}

// =========================
// Render Items (links)
// =========================
function renderItems() {
  if (!elItems) return;

  if (!currentItems || currentItems.length === 0) {
    elItems.innerHTML = "<div>Noch keine Items geladen.</div>";
    return;
  }

  const pool_jahrgang = Number(elPoolJg.value);
  const pool_thema = String(elThema.value);

  elItems.innerHTML = "";

  for (const it of currentItems) {
    const itemText = it[C.item_text];
    const existing = findInKorb(pool_jahrgang, pool_thema, itemText);

    const line = document.createElement("div");
    line.style.display = "grid";
    line.style.gridTemplateColumns = "auto 1fr";
    line.style.gap = "10px";
    line.style.alignItems = "start";
    line.style.padding = "8px 0";
    line.style.borderBottom = "1px solid #eee";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!existing;

    const txt = document.createElement("div");
    txt.innerHTML = escapeHtml(itemText);

    cb.addEventListener("change", () => {
      if (cb.checked) {
        // Max check
        if (requiredCount != null && korb.length >= requiredCount) {
          cb.checked = false;
          setStatus(`Maximal ${requiredCount} Items (track: ${currentTrack}). Entferne erst eins im Korb.`);
          return;
        }
        korb.push({
          pool_jahrgang,
          pool_thema,
          item_text: String(itemText),
          bewertung_label: null,
        });
      } else {
        korb = korb.filter(e => !(e.pool_jahrgang === pool_jahrgang && e.pool_thema === pool_thema && e.item_text === String(itemText)));
      }
      renderKorb();
    });

    line.appendChild(cb);
    line.appendChild(txt);
    elItems.appendChild(line);
  }
}

// =========================
// Daten laden
// =========================
async function loadRatings() {
  const { data, error } = await supabase
    .from(T.bewertungsskala)
    .select(`id, ${C.rating_label}, ${C.rating_order}`)
    .order(C.rating_order, { ascending: true });

  if (error) throw error;
  ratings = (data ?? []).map(r => ({ label: r[C.rating_label], order: r[C.rating_order] }));
}

async function loadFaecher() {
  const { data, error } = await supabase
    .from(T.fach)
    .select(`id, ${C.fach_name}`)
    .order(C.fach_order, { ascending: true });

  if (error) throw error;

  elFach.innerHTML = `<option value="">— bitte wählen —</option>`;
  for (const row of (data ?? [])) {
    const opt = document.createElement("option");
    opt.value = row[C.fach_name];
    opt.textContent = row[C.fach_name];
    elFach.appendChild(opt);
  }
}

async function loadTrackForFach(fachName) {
  const { data, error } = await supabase
    .from(T.item)
    .select(`${C.item_track}`)
    .eq(C.item_fach, fachName)
    .limit(1);

  if (error) throw error;

  currentTrack = normalizeTrack(data?.[0]?.[C.item_track] ?? null);
  requiredCount = currentTrack ? (TRACK_COUNTS[currentTrack] ?? null) : null;
  updateSaveState();
}

async function loadThemen(fachName, poolJg) {
  elThema.disabled = true;
  elThema.innerHTML = `<option value="">— lade Themen —</option>`;

  const { data, error } = await supabase
    .from(T.thema)
    .select(`id, ${C.thema_name}`)
    .eq(C.thema_fach, fachName)
    .eq(C.thema_jahrgang, Number(poolJg))
    .order(C.thema_name, { ascending: true });

  if (error) throw error;

  elThema.innerHTML = `<option value="">— bitte wählen —</option>`;
  for (const row of (data ?? [])) {
    const opt = document.createElement("option");
    opt.value = row[C.thema_name];
    opt.textContent = row[C.thema_name];
    elThema.appendChild(opt);
  }
  elThema.disabled = false;
}

async function loadItems(fachName, poolJg, themaName) {
  const { data, error } = await supabase
    .from(T.item)
    .select(`id, ${C.item_text}, ${C.item_track}`)
    .eq(C.item_fach, fachName)
    .eq(C.item_jahrgang, Number(poolJg))
    .eq(C.item_thema, themaName)
    .order(C.item_text, { ascending: true });

  if (error) throw error;

  currentItems = data ?? [];

  // Track ggf. aus den Items ziehen (falls vorher leer)
  if (!currentTrack && currentItems.length > 0) {
    currentTrack = normalizeTrack(currentItems[0][C.item_track]);
    requiredCount = currentTrack ? (TRACK_COUNTS[currentTrack] ?? null) : null;
  }

  renderItems();
  updateSaveState();
}

// =========================
// Speichern (Version B)
// =========================
async function saveNewVersion() {
  const kind_code = elKind.value.trim();
  const fachName = elFach.value;

  if (!kind_code || !fachName) throw new Error("Kind-Code und Fach sind Pflicht.");
  if (requiredCount == null) throw new Error("Zielanzahl unbekannt.");
  if (korb.length !== requiredCount) throw new Error(`Bitte genau ${requiredCount} Items wählen.`);
  if (!korb.every(e => e.bewertung_label)) throw new Error("Bitte alle Bewertungen setzen.");

  const eingabe_id = crypto.randomUUID();

  // Insert: zeugniseintraege
  const rows = korb.map(e => ({
    [C.z_kind_code]: kind_code,
    [C.z_fach]: fachName,
    [C.z_jahrgang]: Number(e.pool_jahrgang),
    [C.z_thema]: String(e.pool_thema),
    [C.z_item]: String(e.item_text),
    [C.z_bewertung]: String(e.bewertung_label),
    [C.z_eingabe_id]: eingabe_id,
    [C.z_pool_jahrgang]: Number(e.pool_jahrgang),
    [C.z_pool_thema]: String(e.pool_thema),
  }));

  setStatus("Speichere Zeugniseinträge…");
  const { error: insErr } = await supabase.from(T.zeugniseintraege).insert(rows);
  if (insErr) throw insErr;

  // Upsert: fachstand (überschreiben)
  setStatus("Aktualisiere fachstand…");
  const upsertObj = {
    [C.fs_kind_code]: kind_code,
    [C.fs_fach]: fachName,
    [C.fs_aktuelle_eingabe_id]: eingabe_id,
    [C.fs_aktualisiert_am]: new Date().toISOString(),
  };

  const { error: upErr } = await supabase
    .from(T.fachstand)
    .upsert(upsertObj, { onConflict: `${C.fs_kind_code},${C.fs_fach}` });

  if (upErr) throw upErr;

  setStatus(`✅ Gespeichert! Version-ID: ${eingabe_id}`);

  // Optional: Korb leeren nach Save
  // korb = [];
  // renderKorb();
  // renderItems();
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(s) {
  return escapeHtml(s);
}

// =========================
// Events
// =========================
elFach.addEventListener("change", async () => {
  currentItems = [];
  renderItems();
  try {
    if (elFach.value) {
      await loadTrackForFach(elFach.value);
      if (elPoolJg.value) await loadThemen(elFach.value, elPoolJg.value);
    }
  } catch (e) {
    setStatus("Fehler: " + (e?.message ?? String(e)));
  }
});

elPoolJg.addEventListener("change", async () => {
  currentItems = [];
  renderItems();
  try {
    if (elFach.value && elPoolJg.value) {
      await loadThemen(elFach.value, elPoolJg.value);
      setStatus("Themen geladen.");
    }
  } catch (e) {
    setStatus("Fehler: " + (e?.message ?? String(e)));
  }
});

elLoadItems.addEventListener("click", async () => {
  try {
    const fachName = elFach.value;
    const poolJg = elPoolJg.value;
    const themaName = elThema.value;

    if (!fachName) return setStatus("Bitte Fach wählen.");
    if (!poolJg) return setStatus("Bitte Pool-Jahrgang wählen.");
    if (!themaName) return setStatus("Bitte Thema wählen.");

    await loadItems(fachName, poolJg, themaName);
    setStatus(`Items geladen: ${currentItems.length}`);
  } catch (e) {
    setStatus("Fehler: " + (e?.message ?? String(e)));
  }
});

elSave.addEventListener("click", async () => {
  try {
    await saveNewVersion();
  } catch (e) {
    setStatus("❌ Speichern fehlgeschlagen: " + (e?.message ?? String(e)));
  }
});

// =========================
// Init
// =========================
(async function init() {
  try {
    setStatus("Starte…");
    await loadRatings();
    await loadFaecher();
    renderItems();
    renderKorb();
    setStatus("✅ Bereit. Fach wählen → Pool-Jahrgang → Thema → Items laden → auswählen → speichern.");
  } catch (e) {
    setStatus("❌ INIT FEHLER: " + (e?.message ?? String(e)));
  }
})();
