/* ==================================================
   footer.js — INJECTION DU FOOTER
   Affiche les annonces récemment consultées
   ================================================== */

document.addEventListener("DOMContentLoaded", function() {
  
  // Charger l'historique depuis localStorage
  let historique = [];
  try {
    const historiqueStocke = localStorage.getItem("brazza_historique");
    if (historiqueStocke) {
      historique = JSON.parse(historiqueStocke);
    }
  } catch (e) {
    console.log("Erreur chargement historique:", e);
  }
  
  // Créer la section historique si on a des annonces
  let sectionHistorique = "";
  if (historique.length > 0 && typeof annonces !== "undefined" && annonces.length > 0) {
    // Récupérer les 5 dernières annonces consultées
    const annoncesRecentes = historique
      .slice(0, 5)
      .map(id => annonces.find(a => a.id === id))
      .filter(a => a !== undefined);
    
    if (annoncesRecentes.length > 0) {
      sectionHistorique = `
        <div class="footer-section">
          <h3>🕐 Récemment consultées</h3>
          <ul>
            ${annoncesRecentes.map(a => `
              <li><a href="annonce.html?id=${a.id}">${a.titre}</a></li>
            `).join("")}
          </ul>
        </div>
      `;
    }
  }

  // Créer le HTML du footer
  const footerHTML = `
    <footer class="footer">
      <div class="footer-contenu">
        
        <div class="footer-section">
          <h3>🏠 Brazza-Immobilier</h3>
          <p>La plateforme de référence pour la location immobilière à Brazzaville.</p>
        </div>

        <div class="footer-section">
          <h3>Liens rapides</h3>
          <ul>
            <li><a href="index.html">Accueil</a></li>
            <li><a href="publier.html">Publier une annonce</a></li>
          </ul>
        </div>

        ${sectionHistorique}

        <div class="footer-section">
          <h3>Contact</h3>
          <p>📧 brazza-immobilier7@gmail.com</p>
          <p>📱 +242 06 462 57 30</p>
          <p>📍 Brazzaville, Congo</p>
        </div>

      </div>

      <div class="footer-bottom">
        <p>&copy; 2026 Brazza-Immobilier. Tous droits réservés.</p>
      </div>
    </footer>
  `;

  document.body.insertAdjacentHTML('beforeend', footerHTML);
});