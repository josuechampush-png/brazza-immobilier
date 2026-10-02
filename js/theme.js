/* ==================================================
   theme.js — GESTION DU THÈME SOMBRE/CLAIR
   Ce fichier gère le thème sur toutes les pages
   ================================================== */

document.addEventListener("DOMContentLoaded", function() {
  
  const btnTheme = document.getElementById("btn-theme");
  
  // Charger le thème sauvegardé au démarrage
  try {
    const themeStocke = localStorage.getItem("brazza_theme");
    if (themeStocke === "sombre") {
      document.body.classList.add("theme-sombre");
      if (btnTheme) {
        btnTheme.textContent = "☀️";
      }
    }
  } catch (e) {
    console.log("Erreur chargement thème:", e);
  }
  
  // Gérer le clic sur le bouton thème
  if (btnTheme) {
    btnTheme.addEventListener("click", function() {
      document.body.classList.toggle("theme-sombre");
      const estSombre = document.body.classList.contains("theme-sombre");
      btnTheme.textContent = estSombre ? "☀️" : "🌙";
      
      // Sauvegarder le thème dans localStorage
      try {
        localStorage.setItem("brazza_theme", estSombre ? "sombre" : "clair");
      } catch (e) {
        console.log("Erreur sauvegarde thème:", e);
      }
    });
  }
  
});