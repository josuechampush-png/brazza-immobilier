// js/auth.js - VERSION AVEC NOTIFICATION INSCRIPTION AUX ADMINS

const SUPABASE_URL = 'https://buymgwahouwcwwgdiogn.supabase.co';
// ✅ CLÉ ANON (sécurisée) au lieu de SERVICE_ROLE (dangereuse)
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1eW1nd2Fob3V3Y3d3Z2Rpb2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2Mjg0MTksImV4cCI6MjEwNjIwNDQxOX0.B5GTAoT9ip-PTlTUVMw3I-t1xBESxPoeeoELbtNBxqo';

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
  
  const inputNom = document.getElementById("nom");
  const inputEmailReg = document.getElementById("email");
  const inputTelReg = document.getElementById("telephone"); 
  const inputPassReg = document.getElementById("password");
  const inputPassConfirm = document.getElementById("password-confirm");
  const btnRegister = document.getElementById("btn-register");
  const inputRole = document.getElementById("role"); 

  const inputIdentifiantLog = document.getElementById("identifiant"); 
  const inputPassLog = document.getElementById("mdp-login"); 

  const btnForgotPassword = document.getElementById("btn-forgot-password");
  const modalForgot = document.getElementById("modal-forgot-password");
  const closeForgotModal = document.querySelector(".close-modal");
  const formForgot = document.getElementById("form-forgot");
  const inputForgotContact = document.getElementById("forgot-contact");

  function afficherMessage(msg, type) {
    if (!messageAuth) return;
    messageAuth.textContent = msg;
    messageAuth.className = `auth-message ${type}`;
    
    if (type === 'error') {
      setTimeout(() => { 
        messageAuth.textContent = ""; 
      }, 5000);
    }
  }

  function normaliserTelephone(telBrut) {
    if (!telBrut) return null;
    let digits = telBrut.replace(/\D/g, ''); 
    if (digits.startsWith('242')) digits = digits.substring(3);
    if (digits.startsWith('242')) digits = digits.substring(3);
    if (digits.startsWith('0')) digits = digits.substring(1);
    if (digits.length < 8 || digits.length > 9) return null;
    return '+242' + digits;
  }

  async function getEmailFromPhone(phoneNumber) {
    const normalized = normaliserTelephone(phoneNumber);
    if (!normalized) return null;
    const sansPrefixe = normalized.replace('+242', '');
    const avecZeroInitial = '0' + sansPrefixe;
    try {
      const { data, error } = await supabase
        .from('profils_admin')
        .select('email')
        .or(`telephone.eq.${normalized},telephone.eq.${avecZeroInitial},telephone.eq.${sansPrefixe}`)
        .maybeSingle();
      if (error || !data) return null;
      return data.email;
    } catch (err) {
      return null;
    }
  }

  // ✅ FONCTION CORRIGÉE : permet la connexion même si le profil n'existe pas
  async function verifierAccesUtilisateur(userId) {
    try {
      const { data: profil, error } = await supabase
        .from('profils_admin')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      // ✅ Si le profil n'existe pas, on permet quand même la connexion
      if (error || !profil) return true;
      
      // ✅ Si le profil existe et est bloqué, on bloque
      if (profil.est_bloque === true) return false;
      
      return true;
    } catch (err) {
      // ✅ En cas d'erreur, on permet la connexion
      return true;
    }
  }

  async function notifierAdminsInscription(nom, email, role) {
    try {
      const { data: admins, error: errAdmins } = await supabase
        .from('profils_admin')
        .select('id')
        .eq('role', 'admin');
      
      if (errAdmins || !admins || admins.length === 0) {
        console.warn("Aucun admin trouvé pour notification");
        return;
      }
      
      const roleLabel = role === 'prestataire' ? 'Prestataire' : 'Client';
      const message = `👤 Nouvelle inscription ${roleLabel} : ${nom} (${email})`;
      
      const notifications = admins.map(admin => ({
        user_id: admin.id,
        message: message,
        lu: false
      }));
      
      await supabase.from('notifications').insert(notifications);
      
    } catch (err) {
      console.error("Erreur notification admins:", err);
    }
  }

  if (formRegister) {
    formRegister.addEventListener("submit", async function(e) {
      e.preventDefault();
      
      if(btnRegister) {
        btnRegister.disabled = true;
        btnRegister.innerHTML = "Envoi...";
      }

      const nom = inputNom.value.trim();
      const email = inputEmailReg.value.trim();
      const telephoneRaw = inputTelReg ? inputTelReg.value.trim() : "";
      const password = inputPassReg.value;
      const confirmPassword = inputPassConfirm.value;
      const roleChoisi = inputRole ? inputRole.value : "";

      if (!nom || !email || !password) {
        afficherMessage("⚠️ Veuillez remplir tous les champs requis.", "error");
        resetButton();
        return;
      }
      
      if (!roleChoisi) {
        afficherMessage("⚠️ Veuillez choisir votre profil (Client ou Prestataire).", "error");
        resetButton();
        return;
      }

      if (password !== confirmPassword) {
        afficherMessage("❌ Les mots de passe ne correspondent pas.", "error");
        resetButton();
        return;
      }
      
      const telephoneClean = normaliserTelephone(telephoneRaw);
      if (!telephoneClean) {
         afficherMessage("⚠️ Numéro de téléphone invalide.", "error");
         resetButton();
         return;
      }

      try {
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: { 
              full_name: nom, 
              phone_number: telephoneClean,
              role: roleChoisi 
            }
          }
        });

        console.log("Réponse SignUp:", JSON.stringify(data, null, 2));
        console.log("Erreur SignUp:", error);

        if (error) {
          throw error;
        }

        if (data && data.user) {
           
           try {
             await supabase.from('profils_admin').update({
               role: roleChoisi,
               nom: nom,
               telephone: telephoneClean,
               est_bloque: false
             }).eq('id', data.user.id);
           } catch (dbErr) {
             console.warn("Update profil admin ignoré:", dbErr.message);
           }

           await notifierAdminsInscription(nom, email, roleChoisi);
           
           alert("✅ Compte créé avec succès !\n\n📧 Un lien de confirmation a été envoyé à :\n" + email + "\n\nMerci de vérifier votre boîte mail (et vos spams) et de cliquer sur le lien pour activer votre compte.\n\nVous serez redirigé vers la connexion.");
           
           window.location.href = "login.html";

        } else {
           afficherMessage("❌ Erreur inattendue lors de la création du compte.", "error");
           resetButton();
        }

      } catch (err) {
        console.error("Erreur SignUp Catch:", err);
        
        if (err.message.includes("already registered") || err.message.includes("User already registered")) {
           afficherMessage("❌ Cet email est déjà inscrit.", "error");
        } else if (err.message.includes("rate limit")) {
           afficherMessage("❌ Trop de tentatives. Attendez 24h.", "error");
        } else if (err.message.includes("invalid_email")) {
           afficherMessage("❌ Adresse email invalide.", "error");
        } else {
           afficherMessage("❌ Erreur technique : " + err.message, "error");
        }
        resetButton();
      }
    });
  }

  function resetButton() {
    if(btnRegister) { 
      btnRegister.disabled = false; 
      btnRegister.innerHTML = "Créer mon compte"; 
    }
  }

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
          afficherMessage("🚫 Accès refusé. Votre compte est bloqué.", "error");
          return;
        }

        afficherMessage("✅ Connexion réussie !", "success");
        setTimeout(() => { window.location.replace("index.html"); }, 1000);

      } catch (err) {
        console.error(err);
        if (err.message.includes("Invalid login credentials")) {
           afficherMessage("❌ Identifiants incorrects.", "error");
        } else if (err.message.includes("Email not confirmed")) {
           afficherMessage("⚠️ Veuillez confirmer votre email avant de vous connecter.", "error");
        } else {
           afficherMessage("❌ Erreur : " + err.message, "error");
        }
      }
    });
  }

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