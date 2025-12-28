import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://nvnjbmviyifslpsgljid.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52bmpibXZpeWlmc2xwc2dsamlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDk5NDIsImV4cCI6MjA4MjQ4NTk0Mn0.g21Hp-wSTGmW-Uhtg4qJO767_DIl_rOztwPztVvrtBM"; // nicht posten

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function setStatus(msg) {
  const s = document.getElementById("status");
  if (s) s.textContent = msg;
}

async function test() {
  setStatus("JS läuft (index). Teste Supabase…");
  const res = await supabase.from("fach").select("name, order").order("order");
  if (res.error) {
    setStatus("❌ Supabase Fehler: " + res.error.message);
    return;
  }
  setStatus("✅ OK (index): Fächer=" + (res.data?.length ?? 0));

  // optional: Dropdown füllen, falls es existiert
  const sel = document.getElementById("fach");
  if (sel) {
    sel.innerHTML = `<option value="">— bitte wählen —</option>`;
    for (const r of res.data || []) {
      const o = document.createElement("option");
      o.value = r.name;
      o.textContent = r.name;
      sel.appendChild(o);
    }
  }
}

document.addEventListener("DOMContentLoaded", test);
