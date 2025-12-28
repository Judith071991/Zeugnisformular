alert("JS läuft ✅ (Zeugnisformular)");

document.addEventListener("DOMContentLoaded", () => {
  // sichtbar, auch wenn CSS sonst drüber liegt
  document.body.style.background = "#ffeeba";

  const s = document.getElementById("status");
  if (s) s.textContent = "JS DATEI LÄUFT ✅";

  // zusätzlich sichtbar oben auf der Seite:
  const badge = document.createElement("div");
  badge.textContent = "JS OK ✅";
  badge.style.position = "fixed";
  badge.style.top = "10px";
  badge.style.right = "10px";
  badge.style.padding = "8px 10px";
  badge.style.background = "black";
  badge.style.color = "white";
  badge.style.borderRadius = "10px";
  badge.style.zIndex = "99999";
  document.body.appendChild(badge);
});
