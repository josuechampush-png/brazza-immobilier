/* ==================================================
   mes-annonces.js — LISTE DES ANNONCES DE L'UTILISATEUR
   Avec bouton Modifier + Supprimer + Stats Vues
   ================================================== */

document.addEventListener("DOMContentLoaded", async function () {
  
  const SUPABASE_URL = 'https://buymgwahouwcwwgdiogn.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1eW1nd2Fob3V3Y3d3Z2Rpb2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYyODQxOSwiZXhwIjoyMTA2MjA0NDE5fQ.4m7vMaiQvDEV5NtptuGlGcdh4gcxNMxHdD-8sPo6M4k';
  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  
  const skeleton = document.getElementById("skeleton-mes-annonces");
  const liste = document.getElementById("liste-mes-annonces");
  const aucuneAnnonce = document.getElementById("aucune-annonce");
  const nonConnecte = document.getElementById("non-connecte");
  
  const { data: { session } } = await supabaseClient.auth.getSession();
  
  if (!session) {
    skeleton.style.display = "none";
    nonConnecte.style.display = "block";
    return;
  }
  
  const userId = session.user.id;
  
  const { data, error } = await supabaseClient
    .from('annonces')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  skeleton.style.display = "none";
  
  if (error) {
    console.error("Erreur chargement :", error);
    liste.innerHTML = "<p style='color:red;padding:20px;'>❌ Erreur de chargement</p>";
    liste.style.display = "block";
    return;
  }
  
  if (!data || data.length === 0) {
    aucuneAnnonce.style.display = "block";
    return;
  }
  
  liste.innerHTML = data.map(a => creerCarteMesAnnonces(a)).join("");
  liste.style.display = "grid";
  
});

/* Créer une carte pour "Mes annonces" */
function creerCarteMesAnnonces(a) {
  const photos = Array.isArray(a.photos) ? a.photos : [];
  const photoUrl = photos.length > 0 ? photos[0] : "https://via.placeholder.com/400x300?text=Pas+de+photo";
  
  // ✅ NOUVEAU : Récupération du nombre de vues global depuis la base
  const vuesCount = a.nombre_vues || 0;

  return `
    <article class="annonce-ma">
      <a href="/annonce.html?id=${a.id}" class="annonce-ma-image-link">
        <div class="annonce-ma-image">
          <img src="${photoUrl}" alt="${a.titre}">
        </div>
      </a>
      <div class="annonce-ma-contenu">
        <a href="/annonce.html?id=${a.id}" class="titre-lien">
          <h3 class="annonce-ma-titre">${a.titre}</h3>
        </a>
        <p class="annonce-ma-prix">${Number(a.prix).toLocaleString()} FCFA</p>
        <p class="annonce-ma-quartier">📍 ${a.quartier} · 👁️ ${vuesCount} vues</p>
        <div class="annonce-ma-actions">
          <a href="/annonce.html?id=${a.id}" class="btn-voir">👁️ Voir</a>
          <a href="/modifier.html?id=${a.id}" class="btn-modifier">✏️ Modifier</a>
          <button class="btn-supprimer" onclick="supprimerAnnonce(${a.id})">🗑️</button>
        </div>
      </div>
    </article>
  `;
}

/* Supprimer une annonce */
async function supprimerAnnonce(id) {
  if (!confirm("⚠️ Voulez-vous vraiment supprimer cette annonce ?")) {
    return;
  }
  
  const SUPABASE_URL = 'https://buymgwahouwcwwgdiogn.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1eW1nd2Fob3V3Y3d3Z2Rpb2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYyODQxOSwiZXhwIjoyMTA2MjA0NDE5fQ.4m7vMaiQvDEV5NtptuGlGcdh4gcxNMxHdD-8sPo6M4k';
  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  
  const { error } = await supabaseClient
    .from('annonces')
    .delete()
    .eq('id', id);
  
  if (error) {
    alert("❌ Erreur : " + error.message);
    return;
  }
  
  alert("✅ Annonce supprimée !");
  location.reload();
}