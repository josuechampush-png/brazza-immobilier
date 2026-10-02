/* ==================================================
   app.js — PAGE D'ACCUEIL
   ================================================== */

document.addEventListener("DOMContentLoaded", async function() {
  
  const SUPABASE_URL = 'https://buymgwahouwcwwgdiogn.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1eW1nd2Fob3V3Y3d3Z2Rpb2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYyODQxOSwiZXhwIjoyMTA2MjA0NDE5fQ.4m7vMaiQvDEV5NtptuGlGcdh4gcxNMxHdD-8sPo6M4k';
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  
  const skeleton = document.getElementById("skeleton");
  const liste = document.getElementById("liste");
  const aucunResultat = document.getElementById("aucun-resultat");
  
  let toutesLesAnnonces = [];
  
  const { data, error } = await supabase
    .from('annonces')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (skeleton) skeleton.style.display = "none";
  
  if (error) {
    if (liste) {
      liste.innerHTML = "<p style='color:red;padding:20px;grid-column:1/-1;'>❌ Erreur : " + error.message + "</p>";
      liste.style.display = "grid";
    }
    return;
  }
  
  if (!data || data.length === 0) {
    if (aucunResultat) aucunResultat.style.display = "block";
    return;
  }
  
  toutesLesAnnonces = data;
  afficherAnnonces(toutesLesAnnonces);
  
  const filtres = [
    "filtreTexte",
    "filtreArrondissement",
    "filtreQuartier",
    "filtreType",
    "filtrePieces",
    "filtrePrixMin",
    "filtrePrixMax",
    "triPrix"
  ];
  
  filtres.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener("input", appliquerFiltres);
      element.addEventListener("change", appliquerFiltres);
    }
  });
  
  function normaliserArrondissement(texte) {
    if (!texte) return "";
    return texte.toLowerCase()
      .replace(/[0-9]+er|ème|e/g, "")
      .replace(/[-–\s]/g, "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }
  
  function appliquerFiltres() {
    const texte = document.getElementById("filtreTexte").value.toLowerCase().trim();
    const arrondissement = document.getElementById("filtreArrondissement").value;
    const quartier = document.getElementById("filtreQuartier").value;
    const type = document.getElementById("filtreType").value;
    const pieces = document.getElementById("filtrePieces").value;
    const prixMin = document.getElementById("filtrePrixMin").value;
    const prixMax = document.getElementById("filtrePrixMax").value;
    const tri = document.getElementById("triPrix").value;
    
    const arrNormalise = normaliserArrondissement(arrondissement);
    
    let resultats = toutesLesAnnonces.filter(a => {
      if (texte) {
        const recherche = (String(a.titre || "") + " " + String(a.description || "") + " " + String(a.quartier || "") + " " + String(a.adresse || "")).toLowerCase();
        if (!recherche.includes(texte)) return false;
      }
      
      if (arrNormalise) {
        const arrAnnonce = normaliserArrondissement(a.arrondissement);
        if (arrAnnonce !== arrNormalise) return false;
      }
      
      if (quartier && a.quartier !== quartier) return false;
      if (type && a.type !== type) return false;
      
      if (pieces) {
        const nbPieces = Number(a.pieces);
        if (pieces === "5") {
          if (!a.pieces || nbPieces < 5) return false;
        } else {
          if (nbPieces !== Number(pieces)) return false;
        }
      }
      
      const prixAnnonce = Number(a.prix);
      if (prixMin && prixAnnonce < Number(prixMin)) return false;
      if (prixMax && prixAnnonce > Number(prixMax)) return false;
      
      return true;
    });
    
    if (tri === "croissant") {
      resultats.sort((a, b) => Number(a.prix) - Number(b.prix));
    } else if (tri === "decroissant") {
      resultats.sort((a, b) => Number(b.prix) - Number(a.prix));
    }
    
    afficherAnnonces(resultats);
  }
  
  function afficherAnnonces(annonces) {
    if (annonces.length === 0) {
      if (liste) {
        // Force le masquage malgré le !important présent dans le CSS de index.html
        liste.style.setProperty("display", "none", "important");
        // Vide complètement les anciennes données pour qu'elles ne restent pas affichées
        liste.innerHTML = "";
      }
      if (aucunResultat) aucunResultat.style.display = "block";
      return;
    }
    
    if (aucunResultat) aucunResultat.style.display = "none";
    if (liste) {
      liste.innerHTML = annonces.map(a => creerCarte(a)).join("");
      liste.style.setProperty("display", "grid", "important");
    }
  }
  
  function creerCarte(a) {
    const photos = Array.isArray(a.photos) ? a.photos : [];
    const photoUrl = photos.length > 0 ? photos[0] : "https://via.placeholder.com/400x300?text=Pas+de+photo";
    
    return `
      <article class="annonce">
        <div class="carrousel">
          <a href="/annonce.html?id=${a.id}">
            <img src="${photoUrl}" alt="${a.titre}">
          </a>
        </div>
        <div class="annonce-corps">
          <div class="annonce-actions">
            <button class="btn-favori" onclick="toggleFavori(${a.id}, event)">❤️</button>
            <button class="btn-partage" onclick="partagerAnnonce(${a.id}, '${a.titre.replace(/'/g, "\\'")}', event)">📤</button>
          </div>
          <a href="/annonce.html?id=${a.id}" style="text-decoration:none;color:inherit;">
            <h2>${a.titre}</h2>
            <p class="prix">${Number(a.prix).toLocaleString()} FCFA</p>
            <p class="infos">📍 ${a.quartier}</p>
            ${a.nom_proprietaire ? `<p class="infos proprietaire">👤 ${a.nom_proprietaire}</p>` : ''}
            <p class="temps">🕐 ${new Date(a.created_at).toLocaleDateString()}</p>
          </a>
        </div>
      </article>
    `;
  }
  
  window.toggleFavori = function(id, event) {
    event.stopPropagation();
    let favoris = JSON.parse(localStorage.getItem("brazza_favoris") || "[]");
    const index = favoris.indexOf(id);
    
    if (index > -1) {
      favoris.splice(index, 1);
      alert("Retiré des favoris");
    } else {
      favoris.push(id);
      alert("Ajouté aux favoris !");
    }
    
    localStorage.setItem("brazza_favoris", JSON.stringify(favoris));
  };
  
  window.partagerAnnonce = function(id, titre, event) {
    event.stopPropagation();
    const url = window.location.origin + "/annonce.html?id=" + id;
    
    if (navigator.share) {
      navigator.share({
        title: titre,
        text: titre + "\n" + url,
        url: url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(titre + "\n" + url).then(() => {
        alert("Lien copié !");
      });
    }
  };
  
  const btnRetourHaut = document.getElementById("btn-retour-haut");
  if (btnRetourHaut) {
    window.addEventListener("scroll", function() {
      if (window.scrollY > 300) {
        btnRetourHaut.classList.add("visible");
      } else {
        btnRetourHaut.classList.remove("visible");
      }
    });
    
    btnRetourHaut.addEventListener("click", function() {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
  
  const btnFavoris = document.getElementById("btn-favoris");
  if (btnFavoris) {
    btnFavoris.addEventListener("click", function() {
      window.location.href = "favoris.html";
    });
  }
  
  const btnHistorique = document.getElementById("btn-historique");
  if (btnHistorique) {
    btnHistorique.addEventListener("click", function() {
      window.location.href = "historique.html";
    });
  }
  
});