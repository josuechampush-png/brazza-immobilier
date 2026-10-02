/* ==================================================
   plus.js — PAGE PARAMÈTRES ET INFORMATIONS
   ================================================== */

document.addEventListener("DOMContentLoaded", function () {
  
  // ===== SWITCH THÈME =====
  const switchTheme = document.getElementById("switch-theme");
  
  // Vérifier si le mode sombre est actif
  if (document.body.classList.contains("theme-sombre")) {
    switchTheme.checked = true;
  }
  
  // Écouter le changement
  switchTheme.addEventListener("change", function () {
    const btnTheme = document.getElementById("btn-theme");
    if (btnTheme) {
      btnTheme.click(); // Simuler un clic sur le bouton thème
    }
  });
  
  // ===== BOUTON VIDER LE CACHE =====
  document.getElementById("btn-vider-cache").addEventListener("click", function () {
    if (!confirm("Voulez-vous vraiment vider le cache ?\n\nCela supprimera :\n- Vos favoris\n- Votre historique\n- Les vues des annonces\n\nCette action est irréversible.")) {
      return;
    }
    
    try {
      // Supprimer toutes les clés localStorage qui commencent par "brazza_"
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("brazza_")) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      alert("✅ Cache vidé avec succès !");
      location.reload();
    } catch (e) {
      alert("❌ Erreur lors de la suppression : " + e.message);
    }
  });
  
  // ===== BOUTON VOIR STATISTIQUES =====
  document.getElementById("btn-voir-stats").addEventListener("click", function () {
    let stats = "📊 Vos statistiques :\n\n";
    
    // Favoris
    let favoris = 0;
    try {
      const favorisStockes = localStorage.getItem("brazza_favoris");
      if (favorisStockes) {
        favoris = JSON.parse(favorisStockes).length;
      }
    } catch (e) {}
    stats += "❤️ Favoris : " + favoris + "\n";
    
    // Historique
    let historique = 0;
    try {
      const historiqueStocke = localStorage.getItem("brazza_historique");
      if (historiqueStocke) {
        historique = JSON.parse(historiqueStocke).length;
      }
    } catch (e) {}
    stats += "🕐 Historique : " + historique + " annonces consultées\n";
    
    // Vues (compter toutes les clés de vues)
    let totalVues = 0;
    let nbAnnoncesVues = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("brazza_vues_")) {
          const vues = parseInt(localStorage.getItem(key)) || 0;
          totalVues += vues;
          nbAnnoncesVues++;
        }
      }
    } catch (e) {}
    stats += "👁️ Vues : " + totalVues + " vues sur " + nbAnnoncesVues + " annonces\n";
    
    alert(stats);
  });
  
});