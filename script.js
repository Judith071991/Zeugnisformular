// Beweis 1: läuft sofort (ohne DOM-Elemente)
document.documentElement.style.background = "#ffeeba";

// Beweis 2: erst wenn DOM da ist, Status setzen
window.addEventListener("DOMContentLoaded", () => {
  const s = document.getElementById("status");
  if (s) s.textContent = "JS DATEI LÄUFT ✅";
});
