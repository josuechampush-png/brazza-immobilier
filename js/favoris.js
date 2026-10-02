document.addEventListener("DOMContentLoaded", async function () {
  
  const SUPABASE_URL = 'https://buymgwahouwcwwgdiogn.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1eW1nd2Fob3V3Y3d3Z2Rpb2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYyODQxOSwiZXhwIjoyMTA2MjA0NDE5fQ.4m7vMaiQvDEV5NtptuGlGcdh4gcxNMxHdD-8sPo6M4k';
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  
  const skeleton = document.getElementById("skeleton-favoris");
  const liste = document.getElementById("liste-favoris");
  const aucunFavori = document.getElementById("aucun-favori");
  
  let favoris = JSON.parse(localStorage.getItem("brazza_favoris") || "[]");
  
  skeleton.style.display = "none";
  
  if (favoris.length === 0) {
    aucunFavori.style.display = "block";
    return;
  }
  
  const { data, error } = await supabase
    .from('annonces')
    .select('*')
    .in('id', favoris)
    .order('created_at', { ascending: false });
  
  if (error || !data || data.length === 0) {
    aucunFavori.style.display = "block";
    return;
  }
  
  liste.innerHTML = data.map(a => {
    const photo = Array.isArray(a.photos) && a.photos.length > 0 ? a.photos[0] : "https://via.placeholder.com/400x300";
    return `
      <article class="annonce-ma">
        <a href="/annonce.html?id=${a.id}" class="annonce-ma-image-link">
          <div class="annonce-ma-image">
            <img src="${photo}" alt="${a.titre}">
          </div>
        </a>
        <div class="annonce-ma-contenu">
          <a href="/annonce.html?id=${a.id}" class="titre-lien">
            <h3 class="annonce-ma-titre">${a.titre}</h3>
          </a>
          <p class="annonce-ma-prix">${Number(a.prix).toLocaleString()} FCFA</p>
          <p class="annonce-ma-quartier">📍 ${a.quartier}</p>
          <div class="annonce-ma-actions">
            <a href="/annonce.html?id=${a.id}" class="btn-voir">👁️ Voir détails</a>
            <button class="btn-retirer" onclick="retirerFavori(${a.id})">💔 Retirer</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
  
  liste.style.display = "grid";
  
});

function retirerFavori(id) {
  if (!confirm("Retirer des favoris ?")) return;
  
  let favoris = JSON.parse(localStorage.getItem("brazza_favoris") || "[]");
  favoris = favoris.filter(fid => fid !== id);
  localStorage.setItem("brazza_favoris", JSON.stringify(favoris));
  location.reload();
}