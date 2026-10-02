/* ==================================================
   historique.js — AFFICHE LES ANNONCES CONSULTÉES
   Lit depuis localStorage la clé "brazza_historique"
   ================================================== */

document.addEventListener("DOMContentLoaded", async function () {
  
  const SUPABASE_URL = 'https://buymgwahouwcwwgdiogn.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1eW1nd2Fob3V3Y3d3Z2Rpb2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYyODQxOSwiZXhwIjoyMTA2MjA0NDE5fQ.4m7vMaiQvDEV5NtptuGlGcdh4gcxNMxHdD-8sPo6M4k';
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  
  const skeleton = document.getElementById("skeleton-historique");
  const liste = document.getElementById("liste-historique");
  const aucunHistorique = document.getElementById("aucun-historique");
  const zoneActions = document.getElementById("zone-actions");
  
  // 1. Lire l'historique depuis localStorage
  let historique = [];
  try {
    const stocke = localStorage.getItem("brazza_historique");
    if (stocke) {
      historique = JSON.parse(stocke);
    }
  } catch (e) {
    console.log("Erreur lecture historique:", e);
  }
  
  // 2. Cacher le skeleton
  skeleton.style.display = "none";
  
  // 3. Si historique vide → afficher le message
  if (!historique || historique.length === 0) {
    aucunHistorique.style.display = "block";
    return;
  }
  
  // 4. Charger les annonces depuis Supabase
  const { data, error } = await supabase
    .from('annonces')
    .select('*')
    .in('id', historique);
  
  if (error) {
    console.error("Erreur Supabase:", error);
    aucunHistorique.style.display = "block";
    return;
  }
  
  if (!data || data.length === 0) {
    aucunHistorique.style.display = "block";
    return;
  }
  
  // 5. Réordonner selon l'ordre de l'historique (plus récent en premier)
  const annoncesTriees = [];
  for (let i = 0; i < historique.length; i++) {
    const annonce = data.find(a => a.id === historique[i]);
    if (annonce) {
      annoncesTriees.push(annonce);
    }
  }
  
  // 6. Afficher la zone d'actions et la liste
  zoneActions.style.display = "block";
  liste.innerHTML = annoncesTriees.map(a => creerCarteHistorique(a)).join("");
  liste.style.display = "grid";
  
  // 7. Bouton "Effacer tout"
  document.getElementById("btn-effacer").addEventListener("click", function() {
    if (!confirm("Voulez-vous vraiment effacer tout l'historique ?")) return;
    try {
      localStorage.removeItem("brazza_historique");
    } catch (e) {
      console.log("Erreur suppression:", e);
    }
    location.reload();
  });
  
});

/* Créer une carte d'historique */
function creerCarteHistorique(a) {
  const photos = Array.isArray(a.photos) ? a.photos : [];
  const photo = photos.length > 0 ? photos[0] : "https://via.placeholder.com/400x300?text=Pas+de+photo";
  
  // Lien vers la page détail (avec / au début, comme pour favoris)
  const urlDetail = "/annonce.html?id=" + a.id;
  
  return `
    <article class="annonce-ma">
      <a href="${urlDetail}" class="annonce-ma-image-link">
        <div class="annonce-ma-image">
          <img src="${photo}" alt="${a.titre}">
        </div>
      </a>
      <div class="annonce-ma-contenu">
        <a href="${urlDetail}" class="titre-lien">
          <h3 class="annonce-ma-titre">${a.titre}</h3>
        </a>
        <p class="annonce-ma-prix">${Number(a.prix).toLocaleString()} FCFA</p>
        <p class="annonce-ma-quartier">📍 ${a.quartier}</p>
        <div class="annonce-ma-actions">
          <a href="${urlDetail}" class="btn-voir">👁️ Voir détails</a>
          <button class="btn-retirer" onclick="retirerHistorique(${a.id})">🗑️ Retirer</button>
        </div>
      </div>
    </article>
  `;
}

/* Retirer une annonce de l'historique */
function retirerHistorique(id) {
  if (!confirm("Retirer cette annonce de l'historique ?")) return;
  
  let historique = [];
  try {
    const stocke = localStorage.getItem("brazza_historique");
    if (stocke) {
      historique = JSON.parse(stocke);
    }
  } catch (e) {}
  
  historique = historique.filter(hid => hid !== id);
  
  try {
    localStorage.setItem("brazza_historique", JSON.stringify(historique));
  } catch (e) {}
  
  location.reload();
}

