import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* ===================================================
   HIER EINTRAGEN – NUR DAS!
=================================================== */

const SUPABASE_URL = "https://nvnjbmviyifslpsgljid.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52bmpibXZpeWlmc2xwc2dsamlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDk5NDIsImV4cCI6MjA4MjQ4NTk0Mn0.g21Hp-wSTGmW-Uhtg4qJO767_DIl_rOztwPztVvrtBM";

/* =================================================== */

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const elStatus = document.getElementById("status");
const elFach = document.getElementById("fach");

function status(msg) {
  elStatus.textContent = msg;
}

async function loadFaecher() {
  status("🔄 Lade Fächer …");

  const { data, error } = await supabase
    .from("fach")
    .select("name, order")
    .order("order", { ascending: true });

  if (error) {
    status("❌ Supabase-Fehler: " + error.message);
    return;
  }

  elFach.innerHTML = `<option value="">— bitte wählen —</option>`;
  for (const f of data || []) {
    const opt = document.createElement("option");
    opt.value = f.name;
    opt.textContent = f.name;
    elFach.appendChild(opt);
  }

  status("✅ Fertig. Fächer geladen: " + (data?.length ?? 0));
}

document.addEventListener("DOMContentLoaded", () => {
  status("🚀 app.js läuft – verbinde Supabase …");
  loadFaecher();
});
