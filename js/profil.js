/* ==================================================
   profil.js — GESTION DU PROFIL UTILISATEUR (AVEC NORMALISATION TEL)
   ================================================== */

document.addEventListener("DOMContentLoaded", async function () {
  
  const SUPABASE_URL = 'https://buymgwahouwcwwgdiogn.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1eW1nd2Fob3V3Y3d3Z2Rpb2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYyODQxOSwiZXhwIjoyMTA2MjA0NDE5fQ.4m7vMaiQvDEV5NtptuGlGcdh4gcxNMxHdD-8sPo6M4k';
  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  
  const nonConnecte = document.getElementById("non-connecte");
  const profilConnecte = document.getElementById("profil-connecte");
  
  // Vérifier la connexion
  const { data: { session } } = await supabaseClient.auth.getSession();
  
  if (!session) {
    nonConnecte.style.display = "block";
    return;
  }
  
  profilConnecte.style.display = "block";
  
  const user = session.user;
  
  // Afficher les informations de l'utilisateur
  document.getElementById("profil-email").value = user.email;
  
  // Récupérer depuis metadata ou table profils_admin
  let telInitial = user.user_metadata?.phone_number || "";
  let nomInitial = user.user_metadata?.nom || "";

  // Si vide, on essaie de chercher dans la table profils_admin
  if (!telInitial || !nomInitial) {
    const { data: profilDb } = await supabaseClient
      .from('profils_admin')
      .select('telephone, nom')
      .eq('id', user.id)
      .single();
    
    if (profilDb) {
      if (!telInitial) telInitial = profilDb.telephone || "";
      if (!nomInitial) nomInitial = profilDb.nom || "";
    }
  }

  document.getElementById("profil-nom").value = nomInitial;
  document.getElementById("profil-telephone").value = telInitial;
  
  // ✅ FONCTION DE NORMALISATION (Copiée depuis auth.js pour cohérence)
  function normaliserTelephone(telBrut) {
    if (!telBrut) return "";
    let clean = telBrut.replace(/[^+\d]/g, ''); 
    if (clean.startsWith('+')) return clean;
    if (clean.startsWith('0')) clean = clean.substring(1);
    if (clean.length < 8) return null;
    if (clean.startsWith('242')) return '+' + clean;
    return '+242' + clean;
  }

  // ===== SAUVEGARDER NOM & TÉLÉPHONE =====
  document.getElementById("btn-sauvegarder-infos").addEventListener("click", async function () {
    const messageInfos = document.getElementById("message-infos");
    const nouveauNom = document.getElementById("profil-nom").value.trim();
    const nouveauTelBrut = document.getElementById("profil-telephone").value.trim();
    
    if (!nouveauNom) {
      afficherMessage(messageInfos, "❌ Le nom ne peut pas être vide", "red");
      return;
    }
    
    // ✅ Normalisation automatique
    const nouveauTelNormalise = normaliserTelephone(nouveauTelBrut);
    
    if (!nouveauTelNormalise && nouveauTelBrut !== "") {
       afficherMessage(messageInfos, "⚠️ Format téléphone invalide", "red");
       return;
    }

    this.disabled = true;
    this.innerHTML = "<span>⏳</span><span>Enregistrement...</span>";
    
    try {
      // 1. Mettre à jour les metadata Auth
      const { error: authError } = await supabaseClient.auth.updateUser({
        data: { 
          nom: nouveauNom, 
          phone_number: nouveauTelNormalise 
        }
      });
      
      if (authError) throw authError;

      // 2. Mettre à jour la table profils_admin
      const { error: dbError } = await supabaseClient
        .from('profils_admin')
        .update({ 
          nom: nouveauNom,
          telephone: nouveauTelNormalise
        })
        .eq('id', user.id);
      
      if (dbError) throw dbError;
        
      // 3. Mettre à jour le nom_proprietaire dans les annonces existantes
      await supabaseClient
        .from('annonces')
        .update({ nom_proprietaire: nouveauNom })
        .eq('user_id', user.id);
        
      afficherMessage(messageInfos, "✅ Profil mis à jour avec succès !", "green");
      
    } catch (error) {
      console.error(error);
      afficherMessage(messageInfos, "❌ Erreur : " + error.message, "red");
    }
    
    this.disabled = false;
    this.innerHTML = "<span>💾</span><span>Sauvegarder Nom & Téléphone</span>";
  });
  
  // ===== CHANGER LE MOT DE PASSE =====
  document.getElementById("btn-changer-password").addEventListener("click", async function () {
    const messagePassword = document.getElementById("message-password");
    const password = document.getElementById("profil-password").value;
    const passwordConfirm = document.getElementById("profil-password-confirm").value;
    
    if (!password || !passwordConfirm) {
      afficherMessage(messagePassword, "❌ Veuillez remplir les deux champs", "red");
      return;
    }
    
    if (password.length < 6) {
      afficherMessage(messagePassword, "❌ Le mot de passe doit contenir au moins 6 caractères", "red");
      return;
    }
    
    if (password !== passwordConfirm) {
      afficherMessage(messagePassword, "❌ Les mots de passe ne correspondent pas", "red");
      return;
    }
    
    this.disabled = true;
    this.innerHTML = "<span>⏳</span><span>Modification...</span>";
    
    try {
      const { error } = await supabaseClient.auth.updateUser({
        password: password
      });
      
      if (error) {
        afficherMessage(messagePassword, "❌ Erreur : " + error.message, "red");
      } else {
        afficherMessage(messagePassword, "✅ Mot de passe changé avec succès !", "green");
        document.getElementById("profil-password").value = "";
        document.getElementById("profil-password-confirm").value = "";
      }
    } catch (error) {
      afficherMessage(messagePassword, "❌ Erreur : " + error.message, "red");
    }
    
    this.disabled = false;
    this.innerHTML = "<span>🔒</span><span>Changer le mot de passe</span>";
  });
  
  // ===== DÉCONNEXION =====
  document.getElementById("btn-deconnexion-profil").addEventListener("click", async function () {
    if (!confirm("Voulez-vous vraiment vous déconnecter ?")) {
      return;
    }
    
    await supabaseClient.auth.signOut();
    window.location.replace("login.html");
  });
  
});

/* Fonction utilitaire pour afficher un message */
function afficherMessage(element, texte, couleur) {
  element.textContent = texte;
  element.style.color = couleur === "red" ? "#c53030" : "#2f855a";
  element.style.background = couleur === "red" ? "#fed7d7" : "#c6f6d5";
  element.style.display = "block";
  
  setTimeout(() => {
    element.style.display = "none";
  }, 4000);
}