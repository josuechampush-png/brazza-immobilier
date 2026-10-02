/* ==================================================
   publier.js — PUBLICATION D'UNE ANNONCE
   Avec système arrondissement → quartier
   ================================================== */

document.addEventListener("DOMContentLoaded", function() {
  
  const SUPABASE_URL = 'https://buymgwahouwcwwgdiogn.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1eW1nd2Fob3V3Y3d3Z2Rpb2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYyODQxOSwiZXhwIjoyMTA2MjA0NDE5fQ.4m7vMaiQvDEV5NtptuGlGcdh4gcxNMxHdD-8sPo6M4k';
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  
  // Initialiser les selects arrondissement/quartier
  remplirArrondissements("arrondissement");
  remplirQuartiers("arrondissement", "quartier");
  
  // Fonction pour afficher un message
  function afficherMessage(texte, couleur) {
    const message = document.getElementById("message");
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
  
  // Fonction pour afficher l'aperçu d'une photo
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
        textePhoto.textContent = "Ajouter une photo";
        label.classList.remove("btn-photo-selectionne");
      }
    });
  }
  
  afficherApercu("photo1", "apercu1");
  afficherApercu("photo2", "apercu2");
  afficherApercu("photo3", "apercu3");
  
  // Fonction pour compresser une image
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
  
  // Bouton de validation
  const bouton = document.getElementById("btn-valider");
  
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
    
    // Vérifier les photos
    const photo1 = document.getElementById("photo1").files[0];
    const photo2 = document.getElementById("photo2").files[0];
    const photo3 = document.getElementById("photo3").files[0];
    
    if (!photo1 || !photo2 || !photo3) {
      afficherMessage("❌ Veuillez ajouter les 3 photos", "red");
      return;
    }
    
    afficherMessage("📸 Compression des photos...", "green");
    
    try {
      const photos = [];
      photos.push(await compresserEtConvertir(photo1, 400, 0.5));
      photos.push(await compresserEtConvertir(photo2, 400, 0.5));
      photos.push(await compresserEtConvertir(photo3, 400, 0.5));
      
      // Vérifier la connexion
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        afficherMessage("❌ Vous devez être connecté pour publier", "red");
        return;
      }
      
      bouton.disabled = true;
      bouton.style.opacity = "0.6";
      afficherMessage("📡 Publication en cours...", "green");
      
      // Insérer dans Supabase
      const { error } = await supabase
        .from('annonces')
        .insert({
          titre: titre,
          prix: Number(prix),
          pieces: pieces,
          arrondissement: arrondissement,
          quartier: quartier,
          type: type,
          adresse: adresse,
          description: description,
          whatsapp: whatsapp,
          photos: photos,
          user_id: session.user.id,
          nom_proprietaire: session.user.user_metadata?.nom || "Anonyme"
        });
      
      if (error) {
        afficherMessage("❌ Erreur : " + error.message, "red");
        bouton.disabled = false;
        bouton.style.opacity = "1";
        return;
      }
      
      afficherMessage("✅ Annonce publiée avec succès ! Redirection...", "green");
      setTimeout(function() {
        window.location.replace("index.html");
      }, 2000);
      
    } catch (e) {
      afficherMessage("❌ Erreur : " + e, "red");
      bouton.disabled = false;
      bouton.style.opacity = "1";
    }
  });
  
});