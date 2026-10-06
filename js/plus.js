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
  
  // ==================================================
  // ✅ INSTALLATION PWA (Application mobile)
  // ==================================================
  (function() {
    const sectionApp = document.getElementById("section-app-mobile");
    const btnInstaller = document.getElementById("btn-installer-app");
    const texteBouton = document.getElementById("texte-bouton-app");
    const iconeBouton = btnInstaller ? btnInstaller.querySelector('.plus-action-icone') : null;
    
    if (!sectionApp || !btnInstaller || !texteBouton) return;
    
    // Variable pour stocker l'événement d'installation
    let deferredPrompt = null;
    
    // Fonction : Vérifier si l'app est déjà installée
    function estDejaInstallee() {
      // Méthode 1 : display-mode standalone
      if (window.matchMedia('(display-mode: standalone)').matches) return true;
      // Méthode 2 : iOS
      if (window.navigator.standalone === true) return true;
      return false;
    }
    
    // Fonction : Mettre le bouton en état "déjà installé"
    function marquerCommeInstallee() {
      texteBouton.textContent = "✅ Application déjà installée";
      if (iconeBouton) iconeBouton.textContent = "✅";
      btnInstaller.disabled = true;
      btnInstaller.style.opacity = "0.5";
      btnInstaller.style.cursor = "not-allowed";
      btnInstaller.style.pointerEvents = "none";
    }
    
    // Vérifier immédiatement si déjà installée
    if (estDejaInstallee()) {
      sectionApp.style.display = "block";
      marquerCommeInstallee();
      return;
    }
    
    // Capturer l'événement beforeinstallprompt
    window.addEventListener('beforeinstallprompt', function(e) {
      // Empêcher l'affichage automatique du prompt natif
      e.preventDefault();
      deferredPrompt = e;
      
      // Afficher la section
      sectionApp.style.display = "block";
      
      console.log("✅ beforeinstallprompt capturé, bouton prêt");
    });
    
    // Gestion du clic sur le bouton
    btnInstaller.addEventListener('click', async function() {
      if (!deferredPrompt) {
        alert("⚠️ L'installation n'est pas disponible pour le moment.\n\nEssayez d'utiliser Chrome ou Edge, et assurez-vous de ne pas être en mode navigation privée.");
        return;
      }
      
      try {
        // Afficher le prompt d'installation
        deferredPrompt.prompt();
        
        // Attendre la réponse de l'utilisateur
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          // Installation réussie
          alert("✅ Application installée avec succès !\n\nVous la trouverez sur votre écran d'accueil.");
          marquerCommeInstallee();
        } else {
          // Utilisateur a annulé
          console.log("Installation annulée par l'utilisateur");
        }
        
        // Libérer le prompt (il ne peut être utilisé qu'une fois)
        deferredPrompt = null;
      } catch (err) {
        console.error("Erreur installation:", err);
        alert("❌ Erreur lors de l'installation : " + err.message);
      }
    });
    
    // Écouter l'événement appinstalled
    window.addEventListener('appinstalled', function() {
      console.log("✅ Application installée avec succès");
      marquerCommeInstallee();
      deferredPrompt = null;
    });
    
    // Fallback : si après 3 secondes l'événement beforeinstallprompt n'a pas été capturé
    // et que l'app n'est pas installée, on affiche quand même la section avec un message
    setTimeout(function() {
      if (!deferredPrompt && !estDejaInstallee() && sectionApp.style.display === "none") {
        // Le navigateur ne supporte peut-être pas l'installation
        // On affiche quand même la section avec une aide
        sectionApp.style.display = "block";
        texteBouton.textContent = "Utilisez Chrome pour installer";
        btnInstaller.disabled = true;
        btnInstaller.style.opacity = "0.6";
        btnInstaller.style.cursor = "not-allowed";
        if (iconeBouton) iconeBouton.textContent = "ℹ️";
      }
    }, 3000);
  })();
  
});

