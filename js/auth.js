// js/auth.js - VERSION FINALE NORMALISATION TÉLÉPHONE ROBUSTE

const SUPABASE_URL = 'https://buymgwahouwcwwgdiogn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1eW1nd2Fob3V3Y3d3Z2Rpb2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYyODQxOSwiZXhwIjoyMTA2MjA0NDE5fQ.4m7vMaiQvDEV5NtptuGlGcdh4gcxNMxHdD-8sPo6M4k';

document.addEventListener("DOMContentLoaded", function() {
  
  if (!window.supabase) {
    alert("Erreur critique : Supabase non chargé.");
    return;
  }

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // --- ÉLÉMENTS DU DOM ---
  const formRegister = document.getElementById("form-register");
  const formLogin = document.getElementById("form-login");
  const messageAuth = document.getElementById("message-auth");
  
  // Champs Inscription
  const inputNom = document.getElementById("nom");
  const inputEmailReg = document.getElementById("email");
  const inputTelReg = document.getElementById("telephone"); 
  const inputPassReg = document.getElementById("password");
  const inputPassConfirm = document.getElementById("password-confirm");

  // Champs Connexion
  const inputIdentifiantLog = document.getElementById("identifiant"); 
  const inputPassLog = document.getElementById("mdp-login"); 

  // Bouton Mot de passe oublié & Modale
  const btnForgotPassword = document.getElementById("btn-forgot-password");
  const modalForgot = document.getElementById("modal-forgot-password");
  const closeForgotModal = document.querySelector(".close-modal");
  const formForgot = document.getElementById("form-forgot");
  const inputForgotContact = document.getElementById("forgot-contact");

  // --- FONCTIONS UTILITAIRES ---
  function afficherMessage(msg, type) {
    if (!messageAuth) return;
    messageAuth.textContent = msg;
    messageAuth.className = `auth-message ${type}`;
    
    // ✅ MODIFICATION : On ne fait disparaître le message que si ce n'est PAS une inscription réussie.
    // Si c'est une inscription réussie (type success), on laisse le message affiché tant que l'utilisateur est sur la page.
    if (type !== 'success') {
      setTimeout(() => { 
        messageAuth.textContent = ""; 
      }, 5000);
    }
  }

  /**
   * ✅ FONCTION DE NORMALISATION ULTRA-ROBUSTE
   * Convertit TOUTES les variantes possibles vers le format canonique : +242XXXXXXXXX
   * Gère : "06...", "+242 06...", "242 06...", "6...", etc.
   */
  function normaliserTelephone(telBrut) {
    if (!telBrut) return null;
    
    // 1. Nettoyer : ne garder QUE les chiffres
    let digits = telBrut.replace(/\D/g, ''); 
    
    // 2. Cas où l'utilisateur a tapé le code pays sans le + (ex: 24206...)
    if (digits.startsWith('242')) {
      // On enlève le 242 du début pour avoir juste le numéro local (06...)
      digits = digits.substring(3);
    }
    
    // 3. Cas où l'utilisateur a tapé le numéro complet international avec + (ex: +24206...)
    // Le regex \D a déjà retiré le +, donc on se retrouve avec 24206...
    // Si après étape 2, ça commence encore par 242, c'était probablement +242...
    if (digits.startsWith('242')) {
       digits = digits.substring(3);
    }

    // 4. Maintenant, 'digits' devrait être soit "06...", soit "6..."
    // Si ça commence par 0, on l'enlève car le standard congolais interne est souvent sans le 0 initial pour le stockage brut, 
    // MAIS ici on veut reconstruire le format officiel +242 + (numéro à 9 chiffres commençant par 6).
    
    // Exemple : Input "064625730" -> Digits "064625730"
    // Exemple : Input "64625730" -> Digits "64625730"
    
    // On s'assure qu'on a bien 9 chiffres restants (le numéro local au Congo Brazza est sur 9 chiffres : 06 XXX XX XX ou 6 XXX XX XX)
    // Note : Les numéros mobiles sont généralement 06 suivi de 8 chiffres = 9 chiffres totaux avec le 0.
    // Donc sans le 0, c'est 8 chiffres ? Non, vérifions.
    // Standard : +242 06 XX XX XX XX (10 chiffres nationaux dont le premier est 0).
    // Donc après retrait du 242, on doit avoir 10 chiffres si le 0 est présent, ou 9 si le 0 est absent ?
    // En réalité, le format national est souvent considéré comme 9 chiffres significatifs après le 0.
    // Soyons pragmatiques : On accepte si la longueur finale (sans 242 ni 0 initial) est entre 8 et 9 chiffres.
    
    // Retirer le 0 initial si présent pour uniformiser la base locale
    if (digits.startsWith('0')) {
      digits = digits.substring(1);
    }

    // Vérification de taille minimale (un numéro mobile fait environ 8-9 chiffres sans le 0)
    if (digits.length < 8 || digits.length > 9) {
      return null; // Numéro invalide
    }

    // Reconstruction du format canonique : +242 + [Numéro local]
    // IMPORTANT : Dans ta base de données, comment as-tu stocké les anciens comptes ?
    // Si tu avais stocké "064625730", alors la recherche "+24264625730" ne marchera PAS.
    // La solution universelle est de chercher dans la DB avec PLUSIEURS formats potentiels,
    // OU de forcer la mise à jour de la DB.
    
    // Ici, je vais retourner le format standard "+242" + digits.
    // Mais pour la connexion, on va essayer de matcher plusieurs formes dans la requête SQL ci-dessous.
    return '+242' + digits;
  }

  async function getEmailFromPhone(phoneNumber) {
    const normalized = normaliserTelephone(phoneNumber);
    if (!normalized) return null;

    // Extraire les parties pour faire une recherche flexible
    // normalized est ex: "+24264625730"
    const sansPrefixe = normalized.replace('+242', ''); // "64625730"
    const avecZeroInitial = '0' + sansPrefixe;         // "064625730"
    const formatInternational = normalized;           // "+24264625730"

    try {
      // On cherche si le téléphone correspond à L'UN des ces formats en base
      const { data, error } = await supabase
        .from('profils_admin')
        .select('email')
        .or(`telephone.eq.${formatInternational},telephone.eq.${avecZeroInitial},telephone.eq.${sansPrefixe}`)
        .single();

      if (error || !data) return null;
      return data.email;
    } catch (err) {
      console.error("Erreur recherche tel:", err);
      return null;
    }
  }

  // ✅ NOUVEAU : Vérifier si l'utilisateur est autorisé à accéder au site
  async function verifierAccesUtilisateur(userId) {
    try {
      const { data: profil, error } = await supabase
        .from('profils_admin')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !profil) {
        return false;
      }
      
      if (profil.est_bloque === true) {
        return false;
      }

      return true;
    } catch (err) {
      console.error("Erreur vérification accès:", err);
      return false;
    }
  }

  // --- GESTION INSCRIPTION ---
  if (formRegister) {
    formRegister.addEventListener("submit", async function(e) {
      e.preventDefault();
      
      const nom = inputNom.value.trim();
      const email = inputEmailReg.value.trim();
      const telephoneRaw = inputTelReg ? inputTelReg.value.trim() : "";
      const password = inputPassReg.value;
      const confirmPassword = inputPassConfirm.value;

      if (!nom || !email || !password) {
        afficherMessage("⚠️ Veuillez remplir tous les champs requis.", "error");
        return;
      }
      if (password !== confirmPassword) {
        afficherMessage("❌ Les mots de passe ne correspondent pas.", "error");
        return;
      }
      
      const telephoneClean = normaliserTelephone(telephoneRaw);
      
      if (!telephoneClean) {
         afficherMessage("⚠️ Numéro de téléphone invalide.", "error");
         return;
      }

      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: { full_name: nom, phone_number: telephoneClean }
          }
        });

        if (authError) throw authError;

        if (authData.user) {
           // On sauvegarde le format CANONIQUE (+242...) dans la base
           await supabase.from('profils_admin').update({
             telephone: telephoneClean,
             nom: nom,
             role: 'utilisateur',
             est_bloque: false
           }).eq('id', authData.user.id);
           
           // ✅ MODIFICATION ICI : Message permanent demandant de vérifier l'email
           // Pas de redirection, pas de timeout. Le message reste tant que l'utilisateur ne quitte pas la page.
           afficherMessage("📧 Inscription réussie ! Merci de vérifier votre boîte email et cliquer sur le lien de confirmation.", "success");
        }

      } catch (err) {
        console.error(err);
        if (err.message.includes("already registered")) {
           afficherMessage("❌ Cet email est déjà inscrit.", "error");
        } else {
           afficherMessage("❌ Erreur technique : " + err.message, "error");
        }
      }
    });
  }

  // --- GESTION CONNEXION ---
  if (formLogin) {
    formLogin.addEventListener("submit", async function(e) {
      e.preventDefault();
      
      const identifiant = inputIdentifiantLog.value.trim();
      const password = inputPassLog.value;

      if (!identifiant || !password) {
        afficherMessage("⚠️ Veuillez entrer vos identifiants.", "error");
        return;
      }

      let emailToUse = null;

      if (identifiant.includes("@")) {
        emailToUse = identifiant;
      } else {
        const foundEmail = await getEmailFromPhone(identifiant);
        if (!foundEmail) {
          afficherMessage("❌ Numéro non trouvé.", "error");
          return;
        }
        emailToUse = foundEmail;
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password: password
        });

        if (error) throw error;

        const hasAccess = await verifierAccesUtilisateur(data.user.id);
        
        if (!hasAccess) {
          await supabase.auth.signOut();
          afficherMessage("🚫 Accès refusé. Votre compte est bloqué ou inexistant.", "error");
          return;
        }

        afficherMessage("✅ Connexion réussie !", "success");
        setTimeout(() => { window.location.replace("index.html"); }, 1000);

      } catch (err) {
        console.error(err);
        if (err.message.includes("Invalid login credentials")) {
           afficherMessage("❌ Identifiants incorrects.", "error");
        } else {
           afficherMessage("❌ Erreur : " + err.message, "error");
        }
      }
    });
  }

  // --- MOT DE PASSE OUBLIÉ ---
  if (btnForgotPassword && modalForgot) {
    btnForgotPassword.addEventListener("click", () => {
      modalForgot.style.display = "flex";
    });
    
    if(closeForgotModal) {
      closeForgotModal.addEventListener("click", () => {
        modalForgot.style.display = "none";
      });
    }

    if(formForgot) {
      formForgot.addEventListener("submit", async function(e) {
        e.preventDefault(); 
        
        const contact = inputForgotContact.value.trim();
        
        if(!contact) {
          alert("Entrez votre email ou téléphone.");
          return;
        }

        let emailTarget = null;

        if(contact.includes("@")) {
          emailTarget = contact;
        } else {
          emailTarget = await getEmailFromPhone(contact);
        }

        if(!emailTarget) {
          alert("Compte introuvable pour ce contact.");
          return;
        }

        try {
          const { error } = await supabase.auth.resetPasswordForEmail(emailTarget, {
            redirectTo: `${window.location.origin}/reset-password.html`
          });

          if(error) {
            alert("Erreur envoi lien : " + error.message);
          } else {
            alert("✅ Lien envoyé à " + emailTarget + ". Vérifiez vos spams.");
            modalForgot.style.display = "none";
          }
        } catch (err) {
           alert("Erreur technique lors de l'envoi.");
        }
      });
    }
  }
});