// Récupérer l'ID depuis l'URL
const params = new URLSearchParams(window.location.search);
const idAnnonce = Number(params.get("id"));

if (!idAnnonce) {
  document.querySelector(".detail").innerHTML = "<p style='padding:20px;text-align:center;'>❌ ID manquant</p>";
} else {
  chargerAnnonce();
}

async function chargerAnnonce() {
  const SUPABASE_URL = 'https://buymgwahouwcwwgdiogn.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1eW1nd2Fob3V3Y3d3Z2Rpb2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYyODQxOSwiZXhwIjoyMTA2MjA0NDE5fQ.4m7vMaiQvDEV5NtptuGlGcdh4gcxNMxHdD-8sPo6M4k';
  
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  
  // 1. Charger l'annonce
  const { data, error } = await supabase
    .from('annonces')
    .select('*')
    .eq('id', idAnnonce)
    .single();
  
  if (error || !data) {
    document.querySelector(".detail").innerHTML = "<p style='padding:20px;text-align:center;'>❌ Annonce introuvable</p>";
    return;
  }
  
  // ✅ NOUVEAU : Incrémenter les vues dans la base de données (Global)
  try {
    // On utilise un RPC ou une mise à jour atomique si possible, 
    // mais ici on fait simple : read + update (risque mineur de concurrence, acceptable pour ce volume)
    const nouvellesVues = (data.nombre_vues || 0) + 1;
    
    await supabase
      .from('annonces')
      .update({ nombre_vues: nouvellesVues })
      .eq('id', idAnnonce);
      
    // Mettre à jour l'affichage immédiat
    const elVues = document.getElementById("nombre-vues");
    if (elVues) elVues.textContent = nouvellesVues;
    
  } catch (e) {
    console.error("Erreur incrémentation vues:", e);
    // Fallback : afficher la valeur actuelle si l'update échoue
    const elVuesFallback = document.getElementById("nombre-vues");
    if (elVuesFallback && data.nombre_vues !== undefined) {
       elVuesFallback.textContent = data.nombre_vues;
    }
  }
  
  // ===== HISTORIQUE =====
  try {
    let historique = JSON.parse(localStorage.getItem("brazza_historique") || "[]");
    const index = historique.indexOf(data.id);
    if (index > -1) historique.splice(index, 1);
    historique.unshift(data.id);
    if (historique.length > 10) historique = historique.slice(0, 10);
    localStorage.setItem("brazza_historique", JSON.stringify(historique));
  } catch (e) {}
  
  // ===== PHOTOS ET PLEIN ÉCRAN AVEC SWIPE =====
  const photos = Array.isArray(data.photos) ? data.photos : [];
  const carrousel = document.getElementById("carrousel");
  
  if (carrousel && photos.length > 0) {
    carrousel.innerHTML = photos.map((url, index) => 
      `<img src="${url}" alt="Photo" class="img-zoom" data-index="${index}" style="cursor: pointer;">`
    ).join("");

    const imgs = carrousel.querySelectorAll(".img-zoom");
    imgs.forEach(img => {
      img.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        let currentIndex = parseInt(this.getAttribute("data-index"));
        
        // Fond noir
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100vw";
        overlay.style.height = "100vh";
        overlay.style.backgroundColor = "rgba(0, 0, 0, 0.95)";
        overlay.style.zIndex = "999999";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.flexDirection = "column";
        
        // Image
        const fullImg = document.createElement("img");
        fullImg.src = photos[currentIndex];
        fullImg.style.maxWidth = "95%";
        fullImg.style.maxHeight = "85vh";
        fullImg.style.objectFit = "contain";
        fullImg.style.borderRadius = "8px";
        fullImg.style.boxShadow = "0 10px 40px rgba(0,0,0,0.8)";
        fullImg.style.transition = "opacity 0.2s";
        
        // Compteur
        const counter = document.createElement("div");
        counter.textContent = (currentIndex + 1) + " / " + photos.length;
        counter.style.color = "white";
        counter.style.fontSize = "16px";
        counter.style.marginTop = "20px";
        counter.style.fontWeight = "bold";
        
        // Croix ROUGE
        const closeBtn = document.createElement("div");
        closeBtn.innerHTML = "✕";
        closeBtn.style.position = "absolute";
        closeBtn.style.top = "20px";
        closeBtn.style.right = "20px";
        closeBtn.style.color = "#ff4444";
        closeBtn.style.fontSize = "40px";
        closeBtn.style.fontWeight = "bold";
        closeBtn.style.cursor = "pointer";
        closeBtn.style.zIndex = "1000000";
        closeBtn.style.background = "rgba(255,255,255,0.2)";
        closeBtn.style.width = "50px";
        closeBtn.style.height = "50px";
        closeBtn.style.borderRadius = "50%";
        closeBtn.style.display = "flex";
        closeBtn.style.alignItems = "center";
        closeBtn.style.justifyContent = "center";
        
        // Fonction de fermeture
        const fermer = () => {
          document.body.removeChild(overlay);
          document.body.style.overflow = "auto";
        };
        
        // Fonction pour changer d'image
        const changerImage = (direction) => {
          currentIndex = (currentIndex + direction + photos.length) % photos.length;
          fullImg.style.opacity = "0";
          setTimeout(() => {
            fullImg.src = photos[currentIndex];
            counter.textContent = (currentIndex + 1) + " / " + photos.length;
            fullImg.style.opacity = "1";
          }, 100);
        };
        
        closeBtn.onclick = fermer;
        overlay.onclick = function(ev) {
          if (ev.target === overlay) fermer();
        };
        
        // SWIPE (défilement tactile)
        let touchStartX = 0;
        let touchEndX = 0;
        
        overlay.addEventListener("touchstart", (e) => {
          touchStartX = e.changedTouches[0].screenX;
        });
        
        overlay.addEventListener("touchend", (e) => {
          touchEndX = e.changedTouches[0].screenX;
          const diff = touchStartX - touchEndX;
          
          if (Math.abs(diff) > 50) {
            if (diff > 0) {
              changerImage(1); // Swipe gauche = image suivante
            } else {
              changerImage(-1); // Swipe droite = image précédente
            }
          }
        });
        
        // Support clavier (flèches)
        const keyHandler = (e) => {
          if (e.key === "Escape") fermer();
          if (e.key === "ArrowLeft") changerImage(-1);
          if (e.key === "ArrowRight") changerImage(1);
        };
        document.addEventListener("keydown", keyHandler);
        
        // Assembler
        overlay.appendChild(fullImg);
        overlay.appendChild(counter);
        overlay.appendChild(closeBtn);
        document.body.appendChild(overlay);
        document.body.style.overflow = "hidden";
      });
    });
  }
  
  // Indicateurs
  const indicateurs = document.getElementById("indicateurs");
  if (indicateurs && photos.length > 0) {
    indicateurs.innerHTML = "";
    photos.forEach((_, i) => {
      const point = document.createElement("span");
      point.className = "indicateur-point" + (i === 0 ? " actif" : "");
      indicateurs.appendChild(point);
    });
  }
  
  // Compteur
  const compteur = document.getElementById("compteur-photos");
  if (compteur && photos.length > 0) {
    compteur.textContent = "1/" + photos.length;
  }
  
  // Scroll du carrousel
  if (carrousel) {
    carrousel.addEventListener("scroll", function() {
      const images = carrousel.querySelectorAll("img");
      const points = document.querySelectorAll(".indicateur-point");
      if (images.length === 0) return;
      const scrollLeft = carrousel.scrollLeft;
      const largeurImage = images[0].offsetWidth;
      const indexActuel = Math.round(scrollLeft / largeurImage);
      points.forEach((point, i) => {
        point.classList.toggle("actif", i === indexActuel);
      });
      if (compteur) compteur.textContent = (indexActuel + 1) + "/" + photos.length;
    });
  }
  
  // ===== TEXTES =====
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  
  setText("detail-titre", data.titre);
  setText("detail-prix", Number(data.prix).toLocaleString() + " FCFA/mois");
  setText("detail-quartier", "📍 " + data.quartier);
  setText("detail-adresse", "🏠 " + data.adresse);
  setText("detail-description", data.description);
  setText("detail-proprietaire", "👤 " + (data.nom_proprietaire || "Anonyme"));
  setText("detail-temps", "🕐 " + new Date(data.created_at).toLocaleDateString());
  
  const elPieces = document.getElementById("detail-pieces");
  if (elPieces) {
    if (data.pieces) {
      elPieces.textContent = "🚪 " + data.pieces + " pièce(s)";
      elPieces.style.display = "block";
    } else {
      elPieces.style.display = "none";
    }
  }
  
  const btnWa = document.getElementById("btn-whatsapp");
  if (btnWa && data.whatsapp) {
    btnWa.href = `https://wa.me/${data.whatsapp}?text=Bonjour, je suis intéressé par: ${encodeURIComponent(data.titre)}`;
  }
  
  const btnFav = document.getElementById("btn-favori-detail");
  let favoris = JSON.parse(localStorage.getItem("brazza_favoris") || "[]");
  const estFavori = favoris.includes(data.id);
  if (btnFav) {
    btnFav.textContent = estFavori ? "❤️ Retirer" : "🤍 Ajouter";
    btnFav.onclick = () => {
      if (estFavori) {
        favoris = favoris.filter(id => id !== data.id);
      } else {
        favoris.push(data.id);
      }
      localStorage.setItem("brazza_favoris", JSON.stringify(favoris));
      location.reload();
    };
  }
  
  const btnShare = document.getElementById("btn-partage-detail");
  if (btnShare) {
    btnShare.onclick = () => {
      if (navigator.share) {
        navigator.share({ title: data.titre, text: data.titre, url: window.location.href }).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert("Lien copié !");
      }
    };
  }
}