import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// =========================
// 1) HIER EINTRAGEN
// =========================
const SUPABASE_URL = "https://nvnjbmviyifslpsgljid.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52bmpibXZpeWlmc2xwc2dsamlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDk5NDIsImV4cCI6MjA4MjQ4NTk0Mn0.g21Hp-wSTGmW-Uhtg4qJO767_DIl_rOztwPztVvrtBM"; // ohne Sonderzeichen

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// UI
function setStatus(msg) {
  const el = document.getElementById("status");
  if (el) el.textContent = msg;
}

async function loadFaecher() {
  setStatus("Lade Fächer…");

  // holt name + order aus deiner Tabelle fach
  const { data, error } = await supabase
    .from("fach")
    .select("name, order")
    .order("order", { ascending: true });

  if (error) {
    setStatus("❌ Fehler beim Laden der Fächer: " + error.message);
    return;
  }

  const sel = document.getElementById("fach");
  if (!sel) {
    setStatus("❌ Dropdown #fach nicht gefunden (ID stimmt nicht).");
    return;
  }

  sel.innerHTML = `<option value="">— bitte wählen —</option>`;
  for (const row of data || []) {
    const opt = document.createElement("option");
    opt.value = row.name;
    opt.textContent = row.name;
    sel.appendChild(opt);
  }

  setStatus(`✅ Fächer geladen: ${(data || []).length}`);
}

document.addEventListener("DOMContentLoaded", () => {
  setStatus("JS läuft (module). Starte…");
  loadFaecher();
});
