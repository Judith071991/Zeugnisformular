import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// === HIER EINTRAGEN ===
const SUPABASE_URL = "https://nvnjbmviyifslpsgljid.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52bmpibXZpeWlmc2xwc2dsamlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDk5NDIsImV4cCI6MjA4MjQ4NTk0Mn0.g21Hp-wSTGmW-Uhtg4qJO767_DIl_rOztwPztVvrtBM";
// ======================

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Tabellen/Spalten (dein Setup)
const T = { fach: "fach", thema: "thema", item: "item", bewertungsskala: "bewertungsskala" };
const C = {
  fach_name: "name",
  fach_order: "order",

  thema_name: "thema",
  thema_fach: "fach",
  thema_jahrgang: "jahrgang",

  item_text: "item",
  item_fach: "fach",
  item_thema: "thema",
  item_jahrgang: "jahrgang",
  item_track: "track",
};

const TRACK_COUNTS = { hauptfach: 7, nebenfach: 5, arbeitsverhalten: 8, sozialverhalten: 8 };

const elStatus = document.getElementById("status");
const elFach = document.getElementById("fach");
const elPool = document.getElementById("pool_jahrgang");
const elThema = document.getElementById("thema");
const elLoad = document.getElementById("btn_load");
const elItems = document.getElementById("items");
const elInfo = document.getElementById("info");

function status(msg) { elStatus.textContent = msg; }

function normalizeTrack(t) {
  if (!t) return null;
  const x = String(t).trim().toLowerCase();
  if (x.includes("haupt")) return "hauptfach";
  if (x.includes("neben")) return "nebenfach";
  if (x.includes("arbeit")) return "arbeitsverhalten";
  if (x.includes("sozial")) return "sozialverhalten";
  return x;
}

function updateLoadButton() {
  elLoad.disabled = !(elFach.value && elPool.value && elThema.value);
}

// 1) Fächer laden
async function loadFaecher() {
  status("Lade Fächer …");
  const { data, error } = await supabase
    .from(T.fach)
    .select(`${C.fach_name}, ${C.fach_order}`)
    .order(C.fach_order, { ascending: true });

  if (error) { status("Fehler (Fächer): " + error.message); return; }

  elFach.innerHTML = `<option value="">— bitte wählen —</option>`;
  for (const r of data || []) {
    const opt = document.createElement("option");
    opt.value = r[C.fach_name];
    opt.textContent = r[C.fach_name];
    elFach.appendChild(opt);
  }
  status("Fächer geladen: " + (data?.length ?? 0));
}

// 2) Themen laden (Fach + Pool-Jahrgang)
async function loadThemen(fachName, poolJg) {
  elThema.disabled = true;
  elThema.innerHTML = `<option value="">— lade Themen —</option>`;
  updateLoadButton();

  status(`Lade Themen: ${fachName} · Jg ${poolJg} …`);

  const { data, error } = await supabase
    .from(T.thema)
    .select(`${C.thema_name}`)
    .eq(C.thema_fach, fachName)
    .eq(C.thema_jahrgang, Number(poolJg))
    .order(C.thema_name, { ascending: true });

  if (error) { status("Fehler (Themen): " + error.message); return; }

  elThema.innerHTML = `<option value="">— bitte wählen —</option>`;
  for (const r of data || []) {
    const opt = document.createElement("option");
    opt.value = r[C.thema_name];
    opt.textContent = r[C.thema_name];
    elThema.appendChild(opt);
  }

  elThema.disabled = false;
  status("Themen geladen: " + (data?.length ?? 0));
}

// 3) Items laden (Fach + Pool-Jahrgang + Thema)
async function loadItems(fachName, poolJg, themaName) {
  status(`Lade Items: ${fachName} · Jg ${poolJg} · ${themaName} …`);

  const { data, error } = await supabase
    .from(T.item)
    .select(`${C.item_text}, ${C.item_track}`)
    .eq(C.item_fach, fachName)
    .eq(C.item_jahrgang, Number(poolJg))
    .eq(C.item_thema, themaName)
    .order(C.item_text, { ascending: true });

  if (error) { status("Fehler (Items): " + error.message); return; }

  // Track-Info
  const track = normalizeTrack(data?.[0]?.[C.item_track] ?? null);
  const ziel = track ? (TRACK_COUNTS[track] ?? "—") : "—";
  elInfo.textContent = `track: ${track ?? "—"} | ziel: ${ziel}`;

  // Anzeige (erstmal nur listen, Korb kommt im nächsten Schritt)
  if (!data || data.length === 0) {
    elItems.innerHTML = `<div class="small">Keine Items gefunden.</div>`;
    status("Keine Items gefunden.");
    return;
  }

  elItems.innerHTML = "";
  for (const r of data) {
    const div = document.createElement("div");
    div.className = "line";

    const cb = document.createElement("input");
    cb.type = "checkbox";

    const txt = document.createElement("div");
    txt.textContent = r[C.item_text];

    const sel = document.createElement("select");
    sel.innerHTML = `
      <option value="">— Bewertung —</option>
      <option>immer</option>
      <option>meist</option>
      <option>teilweise</option>
      <option>manchmal</option>
      <option>selten</option>
    `;
    sel.disabled = true;

    cb.addEventListener("change", () => {
      sel.disabled = !cb.checked;
    });

    div.appendChild(cb);
    div.appendChild(txt);
    div.appendChild(sel);
    elItems.appendChild(div);
  }

  status("Items geladen: " + data.length);
}

// EVENTS
elFach.addEventListener("change", async () => {
  elThema.disabled = true;
  elThema.innerHTML = `<option value="">— zuerst Fach + Pool-Jahrgang —</option>`;
  elItems.innerHTML = `<div class="small">Noch keine Items geladen.</div>`;
  elInfo.textContent = `track: — | ziel: —`;
  updateLoadButton();

  if (elFach.value && elPool.value) await loadThemen(elFach.value, elPool.value);
});

elPool.addEventListener("change", async () => {
  elThema.disabled = true;
  elThema.innerHTML = `<option value="">— zuerst Fach + Pool-Jahrgang —</option>`;
  elItems.innerHTML = `<div class="small">Noch keine Items geladen.</div>`;
  elInfo.textContent = `track: — | ziel: —`;
  updateLoadButton();

  if (elFach.value && elPool.value) await loadThemen(elFach.value, elPool.value);
});

elThema.addEventListener("change", () => updateLoadButton());

elLoad.addEventListener("click", async () => {
  if (!elFach.value || !elPool.value || !elThema.value) return;
  await loadItems(elFach.value, elPool.value, elThema.value);
});

// INIT
document.addEventListener("DOMContentLoaded", async () => {
  status("JS läuft. Starte …");
  await loadFaecher();
  status("Bereit. Wähle Fach, Pool-Jahrgang, Thema.");
});
