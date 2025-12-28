import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://nvnjbmviyifslpsgljid.supabase.co";
const SUPABASE_ANON_KEY = "DEIN_PUBLISHABLE_KEY_HIER"; // nicht posten

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const elStatus = document.getElementById("status");
const elFach = document.getElementById("fach");

function status(msg){ elStatus.textContent = msg; }

async function loadFaecher(){
  status("Lade Fächer…");
  const { data, error } = await supabase
    .from("fach")
    .select("name, order")
    .order("order", { ascending: true });

  if (error) {
    status("❌ Fehler: " + error.message);
    return;
  }

  elFach.innerHTML = `<option value="">— bitte wählen —</option>`;
  for (const r of data || []) {
    const o = document.createElement("option");
    o.value = r.name;
    o.textContent = r.name;
    elFach.appendChild(o);
  }
  status("✅ Fächer geladen: " + (data?.length ?? 0));
}

document.addEventListener("DOMContentLoaded", () => {
  status("JS läuft. Starte…");
  loadFaecher();
});
