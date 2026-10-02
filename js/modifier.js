/* ==================================================
   modifier.js — MODIFIER UNE ANNONCE EXISTANTE
   Avec système arrondissement → quartier
   ================================================== */

// Données des quartiers par arrondissement
const ARRONDISSEMENTS_DATA = {
  "1er - Makélékélé": ["Centre Sportif", "Mayoma", "Météo", "Moukoudzi Ngouaka", "Ngangouoni", "Diata", "Kingouari", "Kinsoundi", "Niania Sita dia tsiolo", "Mamba", "Ngoma"],
  "2e - Bacongo": ["La Glacière", "Dahomey (Vieux Bacongo)", "Mbama", "Nimbi", "Nkéoua", "Cinq Chemins", "Tahiti", "Saint-Pierre Claver", "Mpissa"],
  "3e - Poto-Poto": ["Vieux Poto-Poto", "Camp CFCO"],
  "4e - Moungali": ["Anciens Combattants", "Plateau des 15 ans", "Dix Maisons", "CEG de la Paix", "Marché 10 Francs", "CEG Matsoua", "Moukondo", "La Poudrière", "O.C.H.", "Batignolles"],
  "5e - Ouenzé": ["Mpila", "La Tsiémé", "Sukisa"],
  "6e - Talangaï": ["Mpila", "Intendance", "Texaco Tsiémé", "Fleuve Congo", "Joseph Ngobali", "Champ de Tir", "Liberté", "Simba Pelle", "Volonté Populaire", "Maman Mboualé", "Ngamakosso", "Manianga", "Mikalou", "Petit-Chose"],
  "7e - Mfilou": ["Kiélé Tenard", "Nzoko-Mbimi", "Ngamaba", "Ngambio", "Indzouli", "Mambo", "Loukanga", "Sadelmi", "Congo Chine", "Mayanga", "Domaine"],
  "8e - Madibou": ["Madibou", "Sangolo", "Kibina", "Mantebé", "Kintsana", "Kombé", "Massissia", "M'bouono", "Ntsangamani"],
  "9e - Djiri": ["Mikalou Madzouna", "Jacques Opangault", "Matari", "Nkombo", "Itatolo", "Impoh Manianga", "Makabandilou", "Académie Bilolo", "Massengo", "Don Bosco", "Émeraude"],
  "10e - Kintélé": ["Kintélé"]
};

// Mapping inverse : quartier → arrondissement (pour les anciennes annonces)
const QUARTIER_TO_ARRONDISSEMENT = {};
Object.keys(ARRONDISSEMENTS_DATA).forEach(function(arr) {
  ARRONDISSEMENTS_DATA[arr].forEach(function(q) {
    QUARTIER_TO_ARRONDISSEMENT[q] = arr;
  });
});

// Récupérer l'ID depuis l'URL
const params = new URLSearchParams(window.location.search);
const idAnnonce = Number(params.get("id"));

console.log("ID annonce à modifier:", idAnnonce);

if (!idAnnonce) {
  document.querySelector(".formulaire").innerHTML = "<p style='padding:20px;text-align:center;color:red;'>❌ ID manquant</p>";
} else {
  chargerEtPreRemplir();
}

async function chargerEtPreRemplir() {
  const SUPABASE_URL = 'https://buymgwahouwcwwgdiogn.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1eW1nd2Fob3V3Y3d3Z2Rpb2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYyODQxOSwiZXhwIjoyMTA2MjA0NDE5fQ.4m7vMaiQvDEV5NtptuGlGcdh4gcxNMxHdD-8sPo6M4k';
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  
  // Vérifier la connexion
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    alert("Vous devez être connecté");
    window.location.replace("login.html");
    return;
  }
  
  // Charger l'annonce
  const { data, error } = await supabase
    .from('annonces')
    .select('*')
    .eq('id', idAnnonce)
    .single();
  
  if (error || !data) {
    alert("Annonce introuvable");
    window.location.replace("mes-annonces.html");
    return;
  }
  
  // Vérifier que c'est bien l'annonce de l'utilisateur
  if (data.user_id !== session.user.id) {
    alert("Vous n'êtes pas autorisé à modifier cette annonce");
    window.location.replace("mes-annonces.html");
    return;
  }
  
  // ===== PRÉ-REMPLIR LES CHAMPS =====
  document.getElementById("titre").value = data.titre || "";
  document.getElementById("prix").value = data.prix || "";
  document.getElementById("pieces").value = data.pieces || "";
  document.getElementById("type").value = data.type || "";
  document.getElementById("adresse").value = data.adresse || "";
  document.getElementById("description").value = data.description || "";
  document.getElementById("whatsapp").value = data.whatsapp || "";
  
  // ===== GESTION ARRONDISSEMENT / QUARTIER =====
  const selectArr = document.getElementById("arrondissement");
  const selectQuar = document.getElementById("quartier");
  
  // Déterminer l'arrondissement
  let arrondissementActuel = data.arrondissement || "";
  
  // Si pas d'arrondissement, essayer de le deviner depuis le quartier
  if (!arrondissementActuel && data.quartier && QUARTIER_TO_ARRONDISSEMENT[data.quartier]) {
    arrondissementActuel = QUARTIER_TO_ARRONDISSEMENT[data.quartier];
  }
  
  // Pré-sélectionner l'arrondissement
  if (arrondissementActuel) {
    selectArr.value = arrondissementActuel;
    
    // Remplir les quartiers de cet arrondissement
    remplirQuartiersPourArrondissement(arrondissementActuel, data.quartier);
  }
  
  // Écouter les changements d'arrondissement
  selectArr.addEventListener("change", function() {
    const arr = this.value;
    remplirQuartiersPourArrondissement(arr, null);
  });
  
  function remplirQuartiersPourArrondissement(arr, quartierASelectionner) {
    selectQuar.innerHTML = '<option value="">Sélectionnez un quartier</option>';
    
    if (arr && ARRONDISSEMENTS_DATA[arr]) {
      selectQuar.disabled = false;
      ARRONDISSEMENTS_DATA[arr].forEach(function(q) {
        const opt = document.createElement("option");
        opt.value = q;
        opt.textContent = q;
        selectQuar.appendChild(opt);
      });
      
      // Pré-sélectionner le quartier actuel si fourni
      if (quartierASelectionner) {
        selectQuar.value = quartierASelectionner;
      }
    } else {
      selectQuar.disabled = true;
      selectQuar.innerHTML = '<option value="">Choisissez d\'abord un arrondissement</option>';
    }
  }
  
  // ===== AFFICHER LES PHOTOS ACTUELLES =====
  const photos = Array.isArray(data.photos) ? data.photos : [];
  if (photos.length > 0) {
    const sectionPhotos = document.getElementById("section-photos-actuelles");
    const containerPhotos = document.getElementById("photos-actuelles");
    sectionPhotos.style.display = "block";
    
    photos.forEach(function(url, i) {
      const img = document.createElement("img");
      img.src = url;
      img.alt = "Photo " + (i + 1);
      img.style.cssText = "width:80px;height:80px;object-fit:cover;border-radius:8px;border:2px solid #e2e8f0;";
      containerPhotos.appendChild(img);
    });
  }
  
  // ===== GESTION DES APERÇUS DES NOUVELLES PHOTOS =====
  function afficherApercu(inputId, apercuId) {
    const input = document.getElementById(inputId);
    const apercu = document.getElementById(apercuId);
    const label = input.nextElementSibling;
    const textePhoto = label.querySelector(".texte-photo");
    
    input.addEventListener("change", function() {
      apercu.innerHTML = "";
      if (input.files && input.files[0]) {
        const fichier = input.files[0];
        if (!fichier.type.startsWith("image/")) {
          apercu.innerHTML = '<p class="erreur-apercu">❌ Veuillez sélectionner une image</p>';
          return;
        }
        if (fichier.size > 5 * 1024 * 1024) {
          apercu.innerHTML = '<p class="erreur-apercu">❌ Image trop lourde (max 5 Mo)</p>';
          return;
        }
        const url = URL.createObjectURL(fichier);
        const img = document.createElement("img");
        img.src = url;
        apercu.appendChild(img);
        textePhoto.textContent = "✅ Photo ajoutée (cliquer pour changer)";
        label.classList.add("btn-photo-selectionne");
      } else {
        textePhoto.textContent = "Ajouter une photo (optionnel)";
        label.classList.remove("btn-photo-selectionne");
      }
    });
  }
  
  afficherApercu("photo1", "apercu1");
  afficherApercu("photo2", "apercu2");
  afficherApercu("photo3", "apercu3");
  
  // ===== COMPRESSION D'IMAGE =====
  function compresserEtConvertir(fichier, largeurMax = 400, qualite = 0.5) {
    return new Promise(function(resolve, reject) {
      const lecteur = new FileReader();
      lecteur.onload = function(e) {
        const img = new Image();
        img.onload = function() {
          let largeur = img.width;
          let hauteur = img.height;
          if (largeur > largeurMax) {
            hauteur = (hauteur * largeurMax) / largeur;
            largeur = largeurMax;
          }
          const canvas = document.createElement("canvas");
          canvas.width = largeur;
          canvas.height = hauteur;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, largeur, hauteur);
          const dataUrl = canvas.toDataURL("image/jpeg", qualite);
          resolve(dataUrl);
        };
        img.onerror = function() { reject("Erreur image"); };
        img.src = e.target.result;
      };
      lecteur.readAsDataURL(fichier);
    });
  }
  
  // ===== BOUTON DE SAUVEGARDE =====
  const bouton = document.getElementById("btn-valider");
  const message = document.getElementById("message");
  
  function afficherMessage(texte, couleur) {
    message.textContent = texte;
    message.style.color = couleur === "red" ? "#c53030" : "#2f855a";
    message.style.background = couleur === "red" ? "#fed7d7" : "#c6f6d5";
    message.style.display = "block";
    message.style.padding = "12px";
    message.style.borderRadius = "10px";
    message.style.textAlign = "center";
    message.style.fontWeight = "600";
    message.style.marginTop = "12px";
  }
  
  bouton.addEventListener("click", async function() {
    // Récupérer les valeurs
    const titre = document.getElementById("titre").value.trim();
    const prix = document.getElementById("prix").value.trim();
    const piecesValue = document.getElementById("pieces").value;
    const pieces = piecesValue ? Number(piecesValue) : null;
    const arrondissement = document.getElementById("arrondissement").value;
    const quartier = document.getElementById("quartier").value;
    const type = document.getElementById("type").value;
    const adresse = document.getElementById("adresse").value.trim();
    const description = document.getElementById("description").value.trim();
    const whatsapp = document.getElementById("whatsapp").value.trim();
    
    // Validations
    if (!titre || !prix || !arrondissement || !quartier || !type || !adresse || !description || !whatsapp) {
      afficherMessage("❌ Merci de remplir tous les champs obligatoires", "red");
      return;
    }
    
    if (!/^\d{9,15}$/.test(whatsapp)) {
      afficherMessage("❌ Numéro WhatsApp invalide (9-15 chiffres)", "red");
      return;
    }
    
    if (Number(prix) <= 0) {
      afficherMessage("❌ Le prix doit être supérieur à 0", "red");
      return;
    }
    
    // Gérer les photos
    const photo1 = document.getElementById("photo1").files[0];
    const photo2 = document.getElementById("photo2").files[0];
    const photo3 = document.getElementById("photo3").files[0];
    
    let photosFinales = photos; // Par défaut, garder les photos existantes
    
    // Si au moins une nouvelle photo est ajoutée, on remplace TOUTES les photos
    if (photo1 || photo2 || photo3) {
      if (!photo1) {
        afficherMessage("❌ Si vous ajoutez de nouvelles photos, ajoutez au moins la photo 1", "red");
        return;
      }
      
      afficherMessage("📸 Compression des nouvelles photos...", "green");
      
      try {
        const nouvellesPhotos = [];
        
        if (photo1) nouvellesPhotos.push(await compresserEtConvertir(photo1, 400, 0.5));
        if (photo2) nouvellesPhotos.push(await compresserEtConvertir(photo2, 400, 0.5));
        if (photo3) nouvellesPhotos.push(await compresserEtConvertir(photo3, 400, 0.5));
        
        photosFinales = nouvellesPhotos;
      } catch (e) {
        afficherMessage("❌ Erreur lors de la compression : " + e, "red");
        return;
      }
    }
    
    // Désactiver le bouton
    bouton.disabled = true;
    bouton.style.opacity = "0.6";
    afficherMessage("📡 Enregistrement en cours...", "green");
    
    // Mettre à jour dans Supabase (avec arrondissement !)
    const { error } = await supabase
      .from('annonces')
      .update({
        titre: titre,
        prix: Number(prix),
        pieces: pieces,
        arrondissement: arrondissement,
        quartier: quartier,
        type: type,
        adresse: adresse,
        description: description,
        whatsapp: whatsapp,
        photos: photosFinales
      })
      .eq('id', idAnnonce);
    
    if (error) {
      afficherMessage("❌ Erreur : " + error.message, "red");
      bouton.disabled = false;
      bouton.style.opacity = "1";
      return;
    }
    
    afficherMessage("✅ Modifications enregistrées ! Redirection...", "green");
    setTimeout(function() {
      window.location.replace("mes-annonces.html");
    }, 1500);
  });
}