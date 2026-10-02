document.addEventListener("DOMContentLoaded", async function() {
  
  const SUPABASE_URL = 'https://buymgwahouwcwwgdiogn.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1eW1nd2Fob3V3Y3d3Z2Rpb2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYyODQxOSwiZXhwIjoyMTA2MjA0NDE5fQ.4m7vMaiQvDEV5NtptuGlGcdh4gcxNMxHdD-8sPo6M4k';
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  
  const ARRONDISSEMENTS = {
    "1": {
      nom: "1er - Makélékélé",
      coords: [-4.2767, 15.2833],
      quartiers: ["Centre Sportif", "Mayoma", "Météo", "Moukoudzi Ngouaka", "Ngangouoni", "Diata", "Kingouari", "Kinsoundi", "Niania", "Mamba", "Ngoma"]
    },
    "2": {
      nom: "2e - Bacongo",
      coords: [-4.2833, 15.2833],
      quartiers: ["La Glacière", "Dahomey", "Mbama", "Nimbi", "Nkéoua", "Cinq Chemins", "Tahiti", "Saint-Pierre Claver", "Mpissa"]
    },
    "3": {
      nom: "3e - Poto-Poto",
      coords: [-4.2600, 15.2850],
      quartiers: ["Vieux Poto-Poto", "Camp CFCO"]
    },
    "4": {
      nom: "4e - Moungali",
      coords: [-4.2500, 15.2900],
      quartiers: ["Anciens Combattants", "Plateau des 15 ans", "Dix Maisons", "CEG de la Paix", "Marché 10 Francs", "CEG Matsoua", "Moukondo", "La Poudrière", "O.C.H.", "Batignolles"]
    },
    "5": {
      nom: "5e - Ouenzé",
      coords: [-4.2350, 15.3000],
      quartiers: ["Mpila", "La Tsiémé", "Sukisa"]
    },
    "6": {
      nom: "6e - Talangaï",
      coords: [-4.2200, 15.3100],
      quartiers: ["Intendance", "Texaco Tsiémé", "Fleuve Congo", "Joseph Ngobali", "Champ de Tir", "Liberté", "Simba Pelle", "Volonté Populaire", "Maman Mboualé", "Ngamakosso", "Manianga", "Mikalou", "Petit-Chose"]
    },
    "7": {
      nom: "7e - Mfilou",
      coords: [-4.2100, 15.2500],
      quartiers: ["Kiélé Tenard", "Nzoko-Mbimi", "Ngamaba", "Ngambio", "Indzouli", "Mambo", "Loukanga", "Sadelmi", "Congo Chine", "Mayanga", "Domaine", "Mazala"]
    },
    "8": {
      nom: "8e - Madibou",
      coords: [-4.2500, 15.2000],
      quartiers: ["Madibou", "Sangolo", "Kibina", "Mantebé", "Kintsana", "Kombé", "Massissia", "M'bouono", "Ntsangamani"]
    },
    "9": {
      nom: "9e - Djiri",
      coords: [-4.2000, 15.2300],
      quartiers: ["Mikalou Madzouna", "Jacques Opangault", "Matari", "Nkombo", "Itatolo", "Impoh Manianga", "Makabandilou", "Académie Bilolo", "Massengo", "Don Bosco", "Émeraude"]
    },
    "10": {
      nom: "10e - Kintélé",
      coords: [-4.1500, 15.2500],
      quartiers: ["Kintélé"]
    }
  };
  
  function normaliserTexte(texte) {
    if (!texte) return "";
    return texte
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .trim();
  }
  
  function trouverNumeroParNom(nomArr) {
    if (!nomArr) return null;
    const nomNormalise = normaliserTexte(nomArr);
    for (const num in ARRONDISSEMENTS) {
      if (normaliserTexte(ARRONDISSEMENTS[num].nom) === nomNormalise) {
        return num;
      }
    }
    return null;
  }
  
  function trouverArrondissementParQuartier(nomQuartier) {
    if (!nomQuartier) return null;
    const quartierNormalise = normaliserTexte(nomQuartier);
    for (const num in ARRONDISSEMENTS) {
      for (const q of ARRONDISSEMENTS[num].quartiers) {
        if (normaliserTexte(q) === quartierNormalise) {
          return { num: num, data: ARRONDISSEMENTS[num] };
        }
      }
    }
    return null;
  }
  
  function getTousLesQuartiers() {
    let tous = [];
    for (const num in ARRONDISSEMENTS) {
      tous = tous.concat(ARRONDISSEMENTS[num].quartiers);
    }
    return tous.sort();
  }
  
  const carte = L.map('carte').setView([-4.2634, 15.2429], 12);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19
  }).addTo(carte);
  
  let toutesLesAnnonces = [];
  let marqueurs = [];
  
  const { data, error } = await supabase
    .from('annonces')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error || !data) {
    console.error("Erreur:", error);
    return;
  }
  
  toutesLesAnnonces = data;
  
  const inputRecherche = document.getElementById("recherche-carte");
  const btnRecherche = document.getElementById("btn-recherche");
  const selectArr = document.getElementById("filtre-arrondissement-carte");
  const selectQuartier = document.getElementById("filtre-quartier-carte");
  
  function initialiserQuartiers() {
    const tousQuartiers = getTousLesQuartiers();
    selectQuartier.innerHTML = '<option value="">🏘️ Tous les quartiers</option>';
    tousQuartiers.forEach(q => {
      const option = document.createElement("option");
      option.value = q;
      option.textContent = q;
      selectQuartier.appendChild(option);
    });
  }
  
  initialiserQuartiers();
  appliquerFiltres();
  
  if (selectArr) {
    selectArr.addEventListener("change", function() {
      const idChoisi = this.value;
      
      if (idChoisi && ARRONDISSEMENTS[idChoisi]) {
        selectQuartier.innerHTML = '<option value="">🏘️ Tous les quartiers</option>';
        ARRONDISSEMENTS[idChoisi].quartiers.forEach(q => {
          const option = document.createElement("option");
          option.value = q;
          option.textContent = q;
          selectQuartier.appendChild(option);
        });
        
        carte.setView(ARRONDISSEMENTS[idChoisi].coords, 14);
      } else {
        initialiserQuartiers();
      }
      
      appliquerFiltres();
    });
  }
  
  if (selectQuartier) {
    selectQuartier.addEventListener("change", function() {
      const quartierChoisi = this.value;
      
      if (quartierChoisi) {
        const arrParent = trouverArrondissementParQuartier(quartierChoisi);
        if (arrParent) {
          carte.setView(arrParent.data.coords, 16);
        }
      }
      
      appliquerFiltres();
    });
  }
  
  if (inputRecherche) {
    inputRecherche.addEventListener("input", appliquerFiltres);
  }
  
  if (btnRecherche) {
    btnRecherche.addEventListener("click", appliquerFiltres);
  }
  
  function appliquerFiltres() {
    const texte = inputRecherche ? normaliserTexte(inputRecherche.value) : "";
    const idArr = selectArr ? selectArr.value : "";
    const quartier = selectQuartier ? selectQuartier.value : "";
    
    const nomArrComplet = idArr ? ARRONDISSEMENTS[idArr].nom : "";
    
    const resultats = toutesLesAnnonces.filter(a => {
      if (texte) {
        const recherche = normaliserTexte(
          a.titre + " " + 
          (a.description || "") + " " + 
          (a.quartier || "") + " " + 
          (a.adresse || "") + " " + 
          (a.arrondissement || "")
        );
        if (!recherche.includes(texte)) return false;
      }
      if (nomArrComplet && a.arrondissement !== nomArrComplet) return false;
      if (quartier && normaliserTexte(a.quartier) !== normaliserTexte(quartier)) return false;
      return true;
    });
    
    afficherMarqueurs(resultats);
  }
  
  function afficherMarqueurs(annonces) {
    marqueurs.forEach(m => carte.removeLayer(m));
    marqueurs = [];
    
    const compteur = document.getElementById("nombre-annonces");
    if (compteur) compteur.textContent = annonces.length;
    
    annonces.forEach(a => {
      const numArr = trouverNumeroParNom(a.arrondissement);
      const coords = numArr ? ARRONDISSEMENTS[numArr].coords : [-4.2634, 15.2429];
      
      const lat = coords[0] + (Math.random() - 0.5) * 0.015;
      const lng = coords[1] + (Math.random() - 0.5) * 0.015;
      
      const photos = Array.isArray(a.photos) ? a.photos : [];
      const photoUrl = photos.length > 0 ? photos[0] : "https://via.placeholder.com/220x140?text=Pas+de+photo";
      
      const popupHtml = `
        <div class="popup-annonce">
          <img src="${photoUrl}" alt="${a.titre}">
          <div class="popup-annonce-contenu">
            <h3 class="popup-annonce-titre">${a.titre}</h3>
            <p class="popup-annonce-prix">${Number(a.prix).toLocaleString()} FCFA</p>
            <p class="popup-annonce-quartier">📍 ${a.quartier || 'Non précisé'}</p>
            <a href="annonce.html?id=${a.id}" class="popup-annonce-btn">Voir l'annonce</a>
          </div>
        </div>
      `;
      
      const marqueur = L.marker([lat, lng])
        .bindPopup(popupHtml, { maxWidth: 220 })
        .addTo(carte);
      
      marqueurs.push(marqueur);
    });
  }
  
});

