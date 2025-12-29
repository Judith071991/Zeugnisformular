import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* =========================
   HIER EINTRAGEN
========================= */
const SUPABASE_URL = "https://nvnjbmviyifslpsgljid.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52bmpibXZpeWlmc2xwc2dsamlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDk5NDIsImV4cCI6MjA4MjQ4NTk0Mn0.g21Hp-wSTGmW-Uhtg4qJO767_DIl_rOztwPztVvrtBM";
/* ========================= */

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Tabellen / Spalten (dein Setup)
const T = {
  fach: "fach",
  fachstand: "fachstand",
  zeugniseintraege: "zeugniseintraege",
};

const C = {
  // fach
  fach_name: "name",
  fach_order: "order",

  // fachstand
  fs_kind_code: "kind_code",
  fs_fach: "fach",
  fs_aktuelle_eingabe_id: "aktuelle_eingabe_id",

  // zeugniseintraege
  z_kind_code: "kind_code",
  z_fach: "fach",
  z_eingabe_id: "eingabe_id",
  z_pool_jahrgang: "pool_jahrgang",
  z_pool_thema: "pool_thema",
  z_item: "item",
  z_bewertung: "bewertungsskala",
};

const elKind = document.getElementById("kind_code_admin");
const elBtn = document.getElementById("btn_load_admin");
const elStatus = document.getElementById("status");
const elOut = document.getElementById("out");
const elBadge = document.getElementById("kind_badge");

function status(msg) {
  elStatus.textContent = msg;
  console.log(msg);
}

function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadFachReihenfolge() {
  const { data, error } = await supabase
    .from(T.fach)
    .select(`${C.fach_name}, ${C.fach_order}`)
    .order(C.fach_order, { ascending: true });

  if (error) throw error;

  // Rückgabe: ["Deutsch", "Mathe", ...]
  return (data ?? []).map(r => r[C.fach_name]);
}

async function loadFachstandMap(kind_code) {
  const { data, error } = await supabase
    .from(T.fachstand)
    .select(`${C.fs_fach}, ${C.fs_aktuelle_eingabe_id}`)
    .eq(C.fs_kind_code, kind_code);

  if (error) throw error;

  // Map fach -> aktuelle_eingabe_id
  const map = new Map();
  for (const r of (data ?? [])) {
    map.set(r[C.fs_fach], r[C.fs_aktuelle_eingabe_id]);
  }
  return map;
}

async function loadEintraege(kind_code, fach, eingabe_id) {
  const { data, error } = await supabase
    .from(T.zeugniseintraege)
    .select(`${C.z_pool_jahrgang}, ${C.z_pool_thema}, ${C.z_item}, ${C.z_bewertung}`)
    .eq(C.z_kind_code, kind_code)
    .eq(C.z_fach, fach)
    .eq(C.z_eingabe_id, eingabe_id)
    .order(C.z_pool_jahrgang, { ascending: true })
    .order(C.z_pool_thema, { ascending: true })
    .order(C.z_item, { ascending: true });

  if (error) throw error;
  return data ?? [];
}

function render(kind_code, fachListe, fachstandMap, eintraegeByFach) {
  elBadge.textContent = kind_code || "—";

  const container = document.createElement("div");

  for (const fach of fachListe) {
    const h3 = document.createElement("h3");
    h3.textContent = fach;
    container.appendChild(h3);

    const eingabe_id = fachstandMap.get(fach);
    if (!eingabe_id) {
      const p = document.createElement("div");
      p.className = "small muted";
      p.textContent = "— kein Eintrag —";
      container.appendChild(p);
      continue;
    }

    const rows = eintraegeByFach.get(fach) ?? [];
    if (rows.length === 0) {
      const p = document.createElement("div");
      p.className = "small muted";
      p.textContent = "— Eintrag vorhanden, aber keine Items gefunden —";
      container.appendChild(p);
      continue;
    }

    const ul = document.createElement("ul");

    // Optional: nach Pool-Thema gruppieren (übersichtlicher)
    // Wir machen es so: Thema als Zwischenüberschrift, darunter Items
    let currentTopic = null;

    for (const r of rows) {
      const topic = r[C.z_pool_thema];
      if (topic !== currentTopic) {
        currentTopic = topic;
        const liTopic = document.createElement("li");
        liTopic.innerHTML = `<span class="muted"><b>${esc(topic)}</b></span>`;
        ul.appendChild(liTopic);
      }

      const li = document.createElement("li");
      li.innerHTML = `${esc(r[C.z_item])} <span class="muted">(${esc(r[C.z_bewertung])})</span>`;
      ul.appendChild(li);
    }

    container.appendChild(ul);
  }

  elOut.innerHTML = "";
  elOut.className = ""; // reset
  elOut.appendChild(container);
}

async function run() {
  const kind_code = (elKind.value ?? "").trim();
  if (!kind_code) {
    status("Bitte Kind-Code eingeben.");
    return;
  }

  elBtn.disabled = true;
  status("Lade Fächer-Reihenfolge…");

  try {
    const fachListe = await loadFachReihenfolge();

    status("Lade fachstand (aktuelle Versionen)…");
    const fachstandMap = await loadFachstandMap(kind_code);

    status("Lade Zeugniseinträge je Fach…");
    const eintraegeByFach = new Map();

    // Parallel laden (nur für Fächer, die einen fachstand-Eintrag haben)
    const tasks = [];
    for (const fach of fachListe) {
      const eingabe_id = fachstandMap.get(fach);
      if (!eingabe_id) continue;

      tasks.push(
        loadEintraege(kind_code, fach, eingabe_id).then(rows => {
          eintraegeByFach.set(fach, rows);
        })
      );
    }
    await Promise.all(tasks);

    render(kind_code, fachListe, fachstandMap, eintraegeByFach);
    status("✅ Fertig.");
  } catch (e) {
    status("❌ Fehler: " + (e?.message ?? String(e)));
    elOut.innerHTML = `<div class="small mono">${esc(e?.message ?? String(e))}</div>`;
  } finally {
    elBtn.disabled = false;
  }
}

elBtn.addEventListener("click", run);
elKind.addEventListener("keydown", (e) => {
  if (e.key === "Enter") run();
});
