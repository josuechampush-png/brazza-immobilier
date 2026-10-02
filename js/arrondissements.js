/* ==================================================
   arrondissements.js — DONNÉES DES ARRONDISSEMENTS
   ================================================== */

console.log("✅ arrondissements.js chargé !");

const ARRONDISSEMENTS = {
  "1er - Makélékélé": [
    "Centre Sportif",
    "Mayoma",
    "Météo",
    "Moukoudzi Ngouaka",
    "Ngangouoni",
    "Diata",
    "Kingouari",
    "Kinsoundi",
    "Niania Sita dia tsiolo",
    "Mamba",
    "Ngoma"
  ],
  "2e - Bacongo": [
    "La Glacière",
    "Dahomey (Vieux Bacongo)",
    "Mbama",
    "Nimbi",
    "Nkéoua",
    "Cinq Chemins",
    "Tahiti",
    "Saint-Pierre Claver",
    "Mpissa"
  ],
  "3e - Poto-Poto": [
    "Vieux Poto-Poto",
    "Camp CFCO"
  ],
  "4e - Moungali": [
    "Anciens Combattants",
    "Plateau des 15 ans",
    "Dix Maisons",
    "CEG de la Paix",
    "Marché 10 Francs",
    "CEG Matsoua",
    "Moukondo",
    "La Poudrière",
    "O.C.H.",
    "Batignolles"
  ],
  "5e - Ouenzé": [
    "Mpila",
    "La Tsiémé",
    "Sukisa"
  ],
  "6e - Talangaï": [
    "Mpila",
    "Intendance",
    "Texaco Tsiémé",
    "Fleuve Congo",
    "Joseph Ngobali",
    "Champ de Tir",
    "Liberté",
    "Simba Pelle",
    "Volonté Populaire",
    "Maman Mboualé",
    "Ngamakosso",
    "Manianga",
    "Mikalou",
    "Petit-Chose"
  ],
  "7e - Mfilou": [
    "Kiélé Tenard",
    "Nzoko-Mbimi",
    "Ngamaba",
    "Ngambio",
    "Indzouli",
    "Mambo",
    "Loukanga",
    "Sadelmi",
    "Congo Chine",
    "Mayanga",
    "Domaine"
  ],
  "8e - Madibou": [
    "Madibou",
    "Sangolo",
    "Kibina",
    "Mantebé",
    "Kintsana",
    "Kombé",
    "Massissia",
    "M'bouono",
    "Ntsangamani"
  ],
  "9e - Djiri": [
    "Mikalou Madzouna",
    "Jacques Opangault",
    "Matari",
    "Nkombo",
    "Itatolo",
    "Impoh Manianga",
    "Makabandilou",
    "Académie Bilolo",
    "Massengo",
    "Don Bosco",
    "Émeraude"
  ],
  "10e - Kintélé": [
    "Kintélé"
  ]
};

console.log("✅ " + Object.keys(ARRONDISSEMENTS).length + " arrondissements définis");

function remplirArrondissements(selectId) {
  console.log("🔍 Appel de remplirArrondissements avec : " + selectId);
  
  const select = document.getElementById(selectId);
  
  if (!select) {
    console.error("❌ ERREUR : Select introuvable : " + selectId);
    return;
  }
  
  console.log("✅ Select trouvé : " + selectId);
  
  // Vider le select
  select.innerHTML = '<option value="">🏛️ Tous les arrondissements</option>';
  
  // Ajouter chaque arrondissement
  Object.keys(ARRONDISSEMENTS).forEach(function(arr) {
    const option = document.createElement("option");
    option.value = arr;
    option.textContent = arr;
    select.appendChild(option);
  });
  
  console.log("✅ " + Object.keys(ARRONDISSEMENTS).length + " arrondissements ajoutés au select");
}

function remplirQuartiers(arrondissementSelectId, quartierSelectId) {
  console.log("🔍 Appel de remplirQuartiers");
  
  const arrSelect = document.getElementById(arrondissementSelectId);
  const quarSelect = document.getElementById(quartierSelectId);
  
  if (!arrSelect || !quarSelect) {
    console.error("❌ ERREUR : Selects introuvables");
    return;
  }
  
  arrSelect.addEventListener("change", function() {
    const arrondissement = this.value;
    console.log("🔄 Arrondissement sélectionné : " + arrondissement);
    
    quarSelect.innerHTML = '<option value="">🏘️ Sélectionnez un quartier</option>';
    
    if (arrondissement && ARRONDISSEMENTS[arrondissement]) {
      quarSelect.disabled = false;
      
      ARRONDISSEMENTS[arrondissement].forEach(function(quartier) {
        const option = document.createElement("option");
        option.value = quartier;
        option.textContent = quartier;
        quarSelect.appendChild(option);
      });
      
      console.log("✅ " + ARRONDISSEMENTS[arrondissement].length + " quartiers ajoutés");
    } else {
      quarSelect.disabled = true;
      quarSelect.innerHTML = '<option value="">🏘️ Choisissez d\'abord un arrondissement</option>';
    }
  });
}

// Rendre les fonctions accessibles globalement
window.remplirArrondissements = remplirArrondissements;
window.remplirQuartiers = remplirQuartiers;

console.log("✅ Fonctions exportées globalement");