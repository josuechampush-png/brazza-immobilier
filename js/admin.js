document.addEventListener("DOMContentLoaded", async function() {
  const SUPABASE_URL = 'https://buymgwahouwcwwgdiogn.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1eW1nd2Fob3V3Y3d3Z2Rpb2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYyODQxOSwiZXhwIjoyMTA2MjA0NDE5fQ.4m7vMaiQvDEV5NtptuGlGcdh4gcxNMxHdD-8sPo6M4k';
  
  if (!window.supabase) {
    alert("Erreur critique : La librairie Supabase n'est pas chargée.");
    return;
  }

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  let toutesLesAnnonces = [];
  let tousLesUtilisateurs = [];
  let tousLesSignalements = [];
  let tousLesQuartiers = []; 
  let tousLesTemoignages = [];

  let emailAdminCourant = '';

  const statAnnonces = document.getElementById("stat-annonces");
  const statUtilisateurs = document.getElementById("stat-utilisateurs");
  const statBloques = document.getElementById("stat-bloques");
  
  const skeletonUsers = document.getElementById("admin-skeleton-users");
  const listeUsers = document.getElementById("admin-liste-users");
  const aucunUsers = document.getElementById("admin-aucun-users");
  const rechercheUsers = document.getElementById("admin-recherche-users");

  const skeletonAnnonces = document.getElementById("admin-skeleton");
  const listeAnnonces = document.getElementById("admin-liste");
  const aucunAnnonces = document.getElementById("admin-aucun");
  const rechercheAnnonces = document.getElementById("admin-recherche");

  const skeletonSig = document.getElementById("admin-skeleton-sig");
  const listeSig = document.getElementById("admin-liste-sig");
  const aucunSig = document.getElementById("admin-aucun-sig");
  
  const listeQuartiers = document.getElementById("admin-liste-quartiers");
  const aucunQuartier = document.getElementById("admin-aucun-quartier");

  const listeTemoins = document.getElementById("admin-liste-temoins");
  const aucunTemoin = document.getElementById("admin-aucun-temoin");
  const formAjoutTemoin = document.getElementById("form-ajout-temoin");

  // ==================================================
  // ✅ ENVOI NOTIFICATION — VERSION MINIMALE SÛRE
  // Uniquement les 3 colonnes qui existent sûrement
  // Avec alerte visible sur téléphone pour debug
  // ==================================================
  async function envoyerNotification(userId, message) {
    if (!userId) {
      alert("⚠️ DEBUG : Notification non envoyée car userId est vide");
      return false;
    }
    
    try {
      // ✅ INSERT MINIMAL : seulement user_id, message, lu
      // Pas de 'type', pas de 'created_at' (valeur par défaut automatique)
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          message: message,
          lu: false
        });
      
      if (error) {
        // ✅ ALERTE VISIBLE SUR TÉLÉPHONE pour identifier le problème
        alert("❌ DEBUG Erreur notification :\n\n" + error.message + "\n\nDétail : " + JSON.stringify(error.details || error.hint || 'aucun'));
        return false;
      } else {
        // ✅ Confirmation visible
        alert("✅ DEBUG : Notification envoyée avec succès au prestataire !");
        return true;
      }
    } catch (err) {
      alert("❌ DEBUG Exception notification :\n\n" + err.message);
      return false;
    }
  }

  // ==================================================
  // FONCTION DE LOGGING D'ACTIVITÉ
  // ==================================================
  async function loggerAction(actionType, cibleId, details = {}) {
    try {
      await supabase.from('logs_admin').insert({
        admin_email: emailAdminCourant || 'inconnu',
        action_type: actionType,
        cible_id: cibleId,
        details: details
      });
    } catch (err) {
      console.error("Erreur log:", err);
    }
  }

  // ==================================================
  // GESTION DES ONGLETS
  // ==================================================
  window.afficherOnglet = function(onglet) {
    const sectionUtilisateurs = document.getElementById("section-utilisateurs");
    const sectionAnnonces = document.getElementById("section-annonces");
    const sectionSignalements = document.getElementById("section-signalements");
    const sectionQuartiers = document.getElementById("section-quartiers");
    const sectionTemoignages = document.getElementById("section-temoignages"); 
    
    const tabs = document.querySelectorAll(".admin-tab");
    
    let currentSection = null;
    if (onglet === 'utilisateurs') currentSection = sectionUtilisateurs;
    else if (onglet === 'annonces') currentSection = sectionAnnonces;
    else if (onglet === 'signalements') currentSection = sectionSignalements;
    else if (onglet === 'quartiers') currentSection = sectionQuartiers;
    else if (onglet === 'temoignages') currentSection = sectionTemoignages;

    if (!currentSection) return;

    const isVisible = currentSection.style.display !== "none";

    if (isVisible) {
      [sectionUtilisateurs, sectionAnnonces, sectionSignalements, sectionQuartiers, sectionTemoignages].forEach(s => {
         if(s) s.style.display = "none";
      });
      tabs.forEach(t => t.classList.remove("active"));
      return;
    }

    [sectionUtilisateurs, sectionAnnonces, sectionSignalements, sectionQuartiers, sectionTemoignages].forEach(s => {
       if(s) s.style.display = "none";
    });
    tabs.forEach(t => t.classList.remove("active"));

    if (onglet === 'utilisateurs') {
      if (sectionUtilisateurs) {
        sectionUtilisateurs.style.display = "block";
        tabs[0].classList.add("active");
      }
    } else if (onglet === 'annonces') {
      if (sectionAnnonces) {
        sectionAnnonces.style.display = "block";
        tabs[1].classList.add("active");
      }
    } else if (onglet === 'signalements') {
      if (sectionSignalements) {
        sectionSignalements.style.display = "block";
        tabs[2].classList.add("active");
        chargerSignalements();
      }
    } else if (onglet === 'quartiers') { 
      if (sectionQuartiers) {
        sectionQuartiers.style.display = "block";
        tabs[3].classList.add("active");
        chargerQuartiers();
      }
    } else if (onglet === 'temoignages') { 
      if (sectionTemoignages) {
        sectionTemoignages.style.display = "block";
        tabs[4].classList.add("active"); 
        chargerTemoignages();
      }
    }
  };

  async function chargerDonnees() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) emailAdminCourant = user.email;

      await Promise.all([chargerUtilisateurs(), chargerAnnonces()]);
      mettreAJourStatistiques();
      genererGraphique();       
      genererGraphiqueType();   
    } catch (err) {
      console.error("Erreur init données:", err);
      alert("Erreur lors du chargement des données : " + err.message);
    }
  }

  // ==================================================
  // GESTION DES UTILISATEURS
  // ==================================================
  async function chargerUtilisateurs() {
    const { data, error } = await supabase.from('profils_admin').select('*').order('date_inscription', { ascending: false });
    if (error) { 
      alert("Erreur utilisateurs: " + error.message); 
      return; 
    }
    tousLesUtilisateurs = data || [];
    afficherUtilisateurs(tousLesUtilisateurs);
  }

  function afficherUtilisateurs(utilisateurs) {
    if (skeletonUsers) skeletonUsers.style.display = "none";
    if (!utilisateurs || utilisateurs.length === 0) {
      if (listeUsers) listeUsers.style.display = "none";
      if (aucunUsers) aucunUsers.style.display = "block";
      return;
    }
    if (aucunUsers) aucunUsers.style.display = "none";
    if (listeUsers) {
      listeUsers.style.display = "flex";
      listeUsers.innerHTML = utilisateurs.map(u => {
        const initiales = (u.nom || u.email || "?").charAt(0).toUpperCase();
        const statutBadge = u.est_bloque ? '<span class="badge-statut badge-bloque">🚫 Bloqué</span>' : '<span class="badge-statut badge-actif">✅ Actif</span>';
        const btnBloquerClass = u.est_bloque ? 'btn-debloquer' : 'btn-bloquer';
        const btnBloquerText = u.est_bloque ? '✅' : '🚫';
        
        return `
          <div class="admin-ligne">
            <div class="admin-avatar">${initiales}</div>
            <div class="admin-info">
              <p class="admin-titre">${u.nom || 'Utilisateur sans nom'}</p>
              <p class="admin-detail">📧 ${u.email}</p>
              <p class="admin-detail">${statutBadge} <span>Rôle: ${u.role || 'utilisateur'}</span> · <span>Inscrit le ${new Date(u.date_inscription).toLocaleDateString()}</span></p>
            </div>
            <div class="admin-actions" style="flex-direction: column; align-items: flex-end; gap: 4px;">
              <button class="btn-admin btn-voir" onclick="voirDetailsUtilisateur('${u.id}')" title="Voir Profil & Annonces" style="width:auto; padding:4px 8px; font-size:12px;">👁️ Détail</button>
              
              <button class="btn-admin ${btnBloquerClass}" onclick="changerStatutUtilisateur('${u.id}', ${!u.est_bloque})" title="${u.est_bloque ? 'Débloquer' : 'Bloquer'}">${btnBloquerText}</button>
              <button class="btn-admin btn-supprimer" onclick="supprimerUtilisateur('${u.id}')" title="Supprimer">🗑️</button>
            </div>
          </div>`;
      }).join("");
    }
  }

  window.voirDetailsUtilisateur = async function(userId) {
    const { data: profil, error: errProfil } = await supabase
      .from('profils_admin')
      .select('*')
      .eq('id', userId)
      .single();

    if (errProfil || !profil) {
      alert("Impossible de charger le profil.");
      return;
    }

    const { data: annoncesUser, error: errAnnonces } = await supabase
      .from('annonces')
      .select('*')
      .eq('user_id', userId)
      .neq('statut', 'supprime')
      .order('created_at', { ascending: false });

    const initiales = (profil.nom || profil.email || "?").charAt(0).toUpperCase();
    const statutBadge = profil.est_bloque ? '<span class="badge-statut badge-bloque">🚫 Bloqué</span>' : '<span class="badge-statut badge-actif">✅ Actif</span>';

    let modale = document.getElementById('modale-details-utilisateur');
    if (!modale) {
      modale = document.createElement('div');
      modale.id = 'modale-details-utilisateur';
      modale.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:99999; display:flex; align-items:center; justify-content:center; padding:20px;';
      document.body.appendChild(modale);
    }

    let annoncesHTML = '';
    if (!errAnnonces && annoncesUser && annoncesUser.length > 0) {
      annoncesHTML = `
        <div style="margin-top:20px;">
          <h3 style="margin:0 0 12px 0; font-size:16px; color:var(--couleur-primaire);">📋 Annonces publiées (${annoncesUser.length})</h3>
          <div style="max-height:200px; overflow-y:auto;">
            ${annoncesUser.map(a => {
              const statut = a.statut || 'actif';
              const badgeStatut = statut === 'suspendu' ? '<span class="badge-statut badge-suspendu">⏸️ Suspendue</span>' : '<span class="badge-statut badge-actif">✅ Active</span>';
              return `
                <div style="background:var(--couleur-fond, #f7fafc); padding:10px; border-radius:6px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                  <div style="flex:1;">
                    <p style="margin:0; font-size:13px; font-weight:600;">${a.titre}</p>
                    <p style="margin:2px 0 0 0; font-size:11px; color:var(--couleur-texte-clair);">${a.arrondissement} - ${a.quartier} | ${Number(a.prix).toLocaleString()} FCFA</p>
                  </div>
                  <div style="display:flex; gap:4px; align-items:center;">
                    ${badgeStatut}
                    <a href="annonce.html?id=${a.id}" target="_blank" style="padding:4px 8px; background:#3182ce; color:white; border-radius:4px; text-decoration:none; font-size:11px;">Voir</a>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      `;
    } else {
      annoncesHTML = `<p style="margin-top:20px; text-align:center; color:var(--couleur-texte-clair); font-size:13px;">Aucune annonce active trouvée pour cet utilisateur.</p>`;
    }

    modale.innerHTML = `
      <div style="background:var(--couleur-carte, white); border-radius:12px; padding:24px; max-width:600px; width:100%; max-height:90vh; overflow-y:auto;">
        <div style="display:flex; align-items:center; gap:16px; margin-bottom:20px;">
          <div class="admin-avatar" style="width:80px; height:80px; font-size:32px;">${initiales}</div>
          <div>
            <h2 style="margin:0; font-size:20px; color:var(--couleur-primaire);">${profil.nom || 'Utilisateur sans nom'}</h2>
            <p style="margin:4px 0 0 0; font-size:14px; color:var(--couleur-texte-clair);">${statutBadge}</p>
          </div>
        </div>
        
        <div style="background:var(--couleur-fond, #f7fafc); padding:16px; border-radius:8px; margin-bottom:16px;">
          <p style="margin:8px 0; font-size:14px;"><strong>📧 Email :</strong> ${profil.email}</p>
          ${profil.telephone ? `<p style="margin:8px 0; font-size:14px;"><strong>📞 Téléphone :</strong> ${profil.telephone}</p>` : ''}
          <p style="margin:8px 0; font-size:14px;"><strong>👤 Rôle :</strong> ${profil.role || 'utilisateur'}</p>
          <p style="margin:8px 0; font-size:14px;"><strong>📅 Inscrit le :</strong> ${new Date(profil.date_inscription).toLocaleDateString()}</p>
          ${profil.date_blocage ? `<p style="margin:8px 0; font-size:14px;"><strong>🚫 Bloqué le :</strong> ${new Date(profil.date_blocage).toLocaleDateString()}</p>` : ''}
          ${profil.raison_blocage ? `<p style="margin:8px 0; font-size:14px;"><strong>📝 Raison :</strong> ${profil.raison_blocage}</p>` : ''}
        </div>

        ${annoncesHTML}

        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:20px;">
          ${profil.telephone ? `<a href="https://wa.me/${profil.telephone.replace(/\s/g, '')}" target="_blank" style="flex:1; padding:10px; background:#25D366; color:white; border-radius:6px; text-decoration:none; text-align:center; font-weight:600; font-size:14px;">💬 WhatsApp</a>` : ''}
          <a href="mailto:${profil.email}" style="flex:1; padding:10px; background:#3182ce; color:white; border-radius:6px; text-decoration:none; text-align:center; font-weight:600; font-size:14px;">📧 Email</a>
          <button onclick="fermerModaleDetailsUtilisateur()" style="flex:1; padding:10px; background:#718096; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:600; font-size:14px;">Fermer</button>
        </div>
      </div>
    `;
    modale.style.display = 'flex';
  };

  window.fermerModaleDetailsUtilisateur = function() {
    const modale = document.getElementById('modale-details-utilisateur');
    if (modale) modale.style.display = 'none';
  };

  window.changerStatutUtilisateur = async function(userId, nouveauStatut) {
    if (!confirm(`Êtes-vous sûr de vouloir ${nouveauStatut ? 'débloquer' : 'bloquer'} cet utilisateur ?`)) return;
    
    const { error } = await supabase.from('profils_admin').update({ 
      est_bloque: nouveauStatut, 
      date_blocage: nouveauStatut ? null : new Date().toISOString() 
    }).eq('id', userId);
    
    if (error) {
      alert("❌ Erreur technique : " + error.message + "\n\nVérifiez les permissions RLS dans Supabase.");
    } else { 
      await loggerAction(nouveauStatut ? 'DEBLOQUER_USER' : 'BLOQUER_USER', userId, { email_cible: tousLesUtilisateurs.find(u=>u.id===userId)?.email });
      chargerUtilisateurs(); 
      mettreAJourStatistiques(); 
    }
  };

  window.supprimerUtilisateur = async function(userId) {
    if (!confirm("⚠️ Supprimer ce profil de la plateforme ?")) return;
    
    const { error } = await supabase.from('profils_admin').delete().eq('id', userId);
    
    if (error) {
      alert("❌ Erreur suppression : " + error.message + "\n\nVérifiez les permissions RLS dans Supabase.");
    } else { 
      await loggerAction('SUPPRIMER_USER', userId, {});
      chargerUtilisateurs(); 
      mettreAJourStatistiques(); 
    }
  };

  // ==================================================
  // GESTION DES ANNONCES
  // ==================================================
  async function chargerAnnonces() {
    const { data, error } = await supabase.from('annonces').select('*').order('created_at', { ascending: false });
    if (error) { alert("Erreur annonces: " + error.message); return; }
    toutesLesAnnonces = data || [];
    afficherAnnonces(toutesLesAnnonces);
  }

  function afficherAnnonces(annonces) {
    if (skeletonAnnonces) skeletonAnnonces.style.display = "none";
    
    const annoncesVisibles = annonces.filter(a => (a.statut || 'actif') !== 'supprime');
    
    if (!annoncesVisibles || annoncesVisibles.length === 0) {
      if (listeAnnonces) listeAnnonces.style.display = "none";
      if (aucunAnnonces) aucunAnnonces.style.display = "block";
      return;
    }
    if (aucunAnnonces) aucunAnnonces.style.display = "none";
    if (listeAnnonces) {
      listeAnnonces.style.display = "flex";
      listeAnnonces.innerHTML = annoncesVisibles.map(a => {
        const statut = a.statut || 'actif';
        const photos = Array.isArray(a.photos) ? a.photos : [];
        const photoUrl = photos.length > 0 ? photos[0] : "https://via.placeholder.com/60x60?text=?";
        
        const estVerifie = a.est_verifiee === true;
        const badgeVerif = estVerifie 
          ? '<span style="background:#c6f6d5; color:#2f855a; padding:2px 6px; border-radius:4px; font-size:11px; margin-left:5px;">✔ Vérifié</span>' 
          : '';
          
        const btnVerifHtml = estVerifie
          ? `<button class="btn-admin btn-debloquer" onclick="changerStatutVerification('${a.id}', false)" title="Retirer la vérification" style="width:auto; padding:4px 8px; font-size:12px;">↩ Unverify</button>`
          : `<button class="btn-admin btn-suspendre" onclick="changerStatutVerification('${a.id}', true)" title="Marquer comme vérifié" style="width:auto; padding:4px 8px; font-size:12px; background:#38a169; color:white;">✔ Verify</button>`;

        const badgeStatut = statut === 'suspendu' ? '<span class="badge-statut badge-suspendu">⏸️ Suspendue</span>' : '<span class="badge-statut badge-actif">✅ Active</span>';
        
        // ✅ Bouton qui alterne : ⏸️ Suspendre ↔ ▶️ Réafficher
        const btnSuspendreText = statut === 'suspendu' ? '▶️ Réafficher' : '⏸️ Suspendre';
        const btnSuspendreClass = statut === 'suspendu' ? 'btn-debloquer' : 'btn-suspendre';
        const btnSuspendreTitle = statut === 'suspendu' ? 'Réafficher cette annonce' : 'Suspendre cette annonce';
        const nouveauStatut = statut === 'suspendu' ? 'actif' : 'suspendu';
        
        const opacityStyle = statut === 'suspendu' ? 'opacity: 0.6; background: #f7fafc;' : '';
        
        return `
          <div class="admin-ligne" style="${opacityStyle}">
            <img src="${photoUrl}" alt="${a.titre}" class="admin-miniature">
            <div class="admin-info">
              <p class="admin-titre">${a.titre} ${badgeVerif}</p>
              <p class="admin-detail">📍 ${a.arrondissement} - ${a.quartier}</p>
              <p class="admin-detail">💰 ${Number(a.prix).toLocaleString()} FCFA · ${badgeStatut} <span>Publiée le ${new Date(a.created_at).toLocaleDateString()}</span></p>
            </div>
            <div class="admin-actions" style="flex-direction: column; align-items: flex-end; gap: 4px;">
              <a href="annonce.html?id=${a.id}" target="_blank" class="btn-admin btn-voir" title="Voir">👁️</a>
              ${btnVerifHtml}
              <button class="btn-admin ${btnSuspendreClass}" onclick="changerStatutAnnonce('${a.id}', '${nouveauStatut}')" title="${btnSuspendreTitle}" style="width:auto; padding:6px 10px; font-size:12px;">${btnSuspendreText}</button>
              <button class="btn-admin btn-supprimer" onclick="supprimerAnnonce('${a.id}')" title="Supprimer">🗑️</button>
            </div>
          </div>`;
      }).join("");
    }
  }

  window.changerStatutVerification = async function(id, nouveauStatut) {
    if (!confirm(`Voulez-vous vraiment ${nouveauStatut ? 'vérifier' : 'retirer la vérification'} cette annonce ?`)) return;
    
    const { error } = await supabase.from('annonces').update({ est_verifiee: nouveauStatut }).eq('id', id);
    
    if (error) alert("Erreur : " + error.message);
    else { 
      await loggerAction(nouveauStatut ? 'VERIFIER_ANNONCE' : 'UNVERIFIER_ANNONCE', id, {});
      chargerAnnonces(); 
    }
  };

  // ✅ Suspendre/Réafficher depuis la section ANNONCES + notification
  window.changerStatutAnnonce = async function(id, nouveauStatut) {
    const action = nouveauStatut === 'suspendu' ? 'suspendre' : 'réafficher';
    if (!confirm(`Voulez-vous vraiment ${action} cette annonce ?`)) return;
    
    const { data: annonce, error: errAnnonce } = await supabase
      .from('annonces')
      .select('user_id, titre')
      .eq('id', id)
      .single();

    const { error } = await supabase.from('annonces').update({ statut: nouveauStatut }).eq('id', id);
    
    if (error) {
      alert("Erreur : " + error.message);
    } else { 
      await loggerAction(nouveauStatut === 'suspendu' ? 'SUSPENDRE_ANNONCE' : 'REACTIVER_ANNONCE', id, {});
      
      if (!errAnnonce && annonce && annonce.user_id) {
        const message = nouveauStatut === 'suspendu' 
          ? `⏸️ Votre annonce "${annonce.titre}" a été suspendue par l'administration. Veuillez vérifier qu'elle respecte nos conditions d'utilisation.`
          : `✅ Votre annonce "${annonce.titre}" a été réaffichée et est à nouveau visible sur le site.`;
        await envoyerNotification(annonce.user_id, message);
      }
      
      await chargerAnnonces(); 
      mettreAJourStatistiques(); 
    }
  };

  window.supprimerAnnonce = async function(id) {
    if (!confirm("⚠️ Supprimer définitivement cette annonce ?")) return;
    
    const { data: annonce, error: errAnnonce } = await supabase
      .from('annonces')
      .select('user_id, titre')
      .eq('id', id)
      .single();
    
    const { error } = await supabase.from('annonces').update({ statut: 'supprime' }).eq('id', id);
    
    if (error) {
      alert("Erreur : " + error.message);
    } else { 
      await loggerAction('SUPPRIMER_ANNONCE_LOGIQUE', id, {});
      
      if (!errAnnonce && annonce && annonce.user_id) {
        await envoyerNotification(
          annonce.user_id, 
          `🗑️ Votre annonce "${annonce.titre}" a été supprimée définitivement par l'administration.`
        );
      }
      
      await chargerAnnonces(); 
      mettreAJourStatistiques(); 
    }
  };

  // ==================================================
  // GESTION DES SIGNALEMENTS
  // ==================================================
  async function chargerSignalements() {
    if (skeletonSig) skeletonSig.style.display = "flex";
    
    // ✅ AJOUT DE 'statut' DANS LA SÉLECTION pour connaître l'état de l'annonce
    const { data: signalementsData, error: errorSig } = await supabase
      .from('signalements')
      .select(`*, annonces (id, titre, arrondissement, quartier, user_id, statut)`)
      .order('date_signalement', { ascending: false });

    if (errorSig) { 
      if (skeletonSig) skeletonSig.style.display = "none";
      alert("Erreur signalements: " + errorSig.message); 
      return; 
    }

    // ✅ FILTRER : On retire les signalements dont l'annonce est supprimée
    const signalementsFiltres = (signalementsData || []).filter(s => {
      if (!s.annonces) return false; // Annonce déjà supprimée de la base
      if (s.annonces.statut === 'supprime') return false; // Annonce marquée supprimée
      return true;
    });

    const userIds = [...new Set(
      signalementsFiltres
        .filter(s => s.annonces && s.annonces.user_id)
        .map(s => s.annonces.user_id)
    )];

    let prestataires = {};
    if (userIds.length > 0) {
      const { data: prestatairesData, error: errorPrest } = await supabase
        .from('profils_admin')
        .select('id, email, telephone, nom, est_bloque, role, date_inscription, date_blocage, raison_blocage')
        .in('id', userIds);

      if (!errorPrest && prestatairesData) {
        prestatairesData.forEach(p => {
          prestataires[p.id] = p;
        });
      }
    }

    const signalementsComplets = signalementsFiltres.map(sig => {
      const userId = sig.annonces ? sig.annonces.user_id : null;
      return {
        ...sig,
        profils_admin: userId && prestataires[userId] ? prestataires[userId] : null
      };
    });

    if (skeletonSig) skeletonSig.style.display = "none";
    tousLesSignalements = signalementsComplets;
    afficherSignalements(tousLesSignalements);
  }

  function grouperSignalementsParAnnonce(signalements) {
    const groupes = {};
    signalements.forEach(sig => {
      const annonceId = sig.annonce_id;
      if (!groupes[annonceId]) {
        groupes[annonceId] = {
          annonce: sig.annonces,
          prestataire: sig.profils_admin,
          signalements: []
        };
      }
      groupes[annonceId].signalements.push(sig);
    });
    return Object.values(groupes);
  }

  function afficherSignalements(signalements) {
    if (!signalements || signalements.length === 0) {
      if (listeSig) listeSig.style.display = "none";
      if (aucunSig) aucunSig.style.display = "block";
      return;
    }
    if (aucunSig) aucunSig.style.display = "none";
    if (listeSig) {
      listeSig.style.display = "flex";
      
      const groupes = grouperSignalementsParAnnonce(signalements);
      
      listeSig.innerHTML = groupes.map(groupe => {
        const titreAnnonce = groupe.annonce ? groupe.annonce.titre : "Annonce supprimée";
        const prestataire = groupe.prestataire;
        const annonceId = groupe.annonce ? groupe.annonce.id : '';
        const emailUtilisateur = groupe.signalements[0].email_utilisateur || '';
        const nbSignalements = groupe.signalements.length;
        const tousTraites = groupe.signalements.every(s => s.statut === 'traité');
        const badgeStatut = tousTraites 
          ? '<span class="badge-statut badge-actif">✅ Tous traités</span>' 
          : `<span class="badge-statut badge-suspendu">⏳ ${nbSignalements - groupe.signalements.filter(s => s.statut === 'traité').length} en attente</span>`;
        
        const nbNonTraites = groupe.signalements.filter(s => s.statut === 'en attente').length;
        const nomAffiche = prestataire ? (prestataire.nom || prestataire.email) : 'Chargement...';

        // ✅ VÉRIFICATION DU STATUT ACTUEL DE L'ANNONCE
        const statutAnnonce = groupe.annonce ? (groupe.annonce.statut || 'actif') : 'actif';
        const annonceSuspendue = statutAnnonce === 'suspendu';

        // ✅ BOUTON QUI ALTERNE SELON L'ÉTAT RÉEL DE L'ANNONCE
        let boutonSuspendreHTML = '';
        if (annonceSuspendue) {
          // L'annonce est déjà suspendue → on propose de la RÉAFFICHER
          boutonSuspendreHTML = `
            <button class="btn-admin btn-debloquer" onclick="reactiverAnnonceSignalee('${annonceId}')" title="Réafficher l'annonce" style="width:auto; padding:6px 12px; font-size:13px; background:#c6f6d5; color:#22543d; border:1px solid #9ae6b4;">
              ▶️ Réafficher annonce
            </button>
          `;
        } else {
          // L'annonce est active → on propose de la SUSPENDRE
          boutonSuspendreHTML = `
            <button class="btn-admin btn-suspendre" onclick="suspendreAnnonceSignalee('${annonceId}')" title="Suspendre l'annonce" style="width:auto; padding:6px 12px; font-size:13px;">
              ⏸️ Suspendre annonce
            </button>
          `;
        }

        // ✅ Badge indicateur si l'annonce est déjà suspendue
        const badgeAnnonceSuspendue = annonceSuspendue 
          ? ' <span style="background:#fefcbf; color:#744210; padding:2px 8px; border-radius:10px; font-size:11px;">⏸️ Annonce déjà suspendue</span>' 
          : '';

        return `
          <div class="admin-ligne" style="border-left: 4px solid ${tousTraites ? '#38a169' : '#e53e3e'};">
            <div class="admin-info" style="flex:2;">
              <p class="admin-titre">
                🚨 ${titreAnnonce}${badgeAnnonceSuspendue}
                <span style="background:#e53e3e; color:white; padding:2px 8px; border-radius:10px; font-size:12px; margin-left:8px;">
                  ${nbSignalements} signalement${nbSignalements > 1 ? 's' : ''}
                </span>
              </p>
              <p class="admin-detail">📍 ${groupe.annonce ? `${groupe.annonce.arrondissement} - ${groupe.annonce.quartier}` : 'N/A'}</p>
              <p class="admin-detail">👤 Auteur : ${nomAffiche} ${prestataire && prestataire.est_bloque ? '<span class="badge-statut badge-bloque">🚫 Bloqué</span>' : ''}</p>
              <p class="admin-detail" style="margin-top:5px;">${badgeStatut}</p>
            </div>
            <div class="admin-actions" style="flex-direction:column; align-items:flex-end; gap:6px;">
              <button class="btn-admin btn-voir" onclick="voirDetailsSignalements(${groupe.annonce ? groupe.annonce.id : 'null'})" title="Voir tous les signalements" style="width:auto; padding:6px 12px; font-size:13px;">
                👁️ Détails (${nbSignalements})
              </button>
              
              <button class="btn-admin btn-suspendre" onclick="voirProfilDepuisAnnonce('${annonceId}', '${emailUtilisateur}')" title="Voir le profil et les annonces du prestataire" style="width:auto; padding:6px 12px; font-size:13px;">
                👤 Voir Prestataire
              </button>

              ${nbNonTraites > 0 ? `
                ${boutonSuspendreHTML}
                
                <button class="btn-admin btn-supprimer" onclick="supprimerAnnonceDepuisSignalement('${annonceId}')" title="Supprimer définitivement" style="width:auto; padding:6px 12px; font-size:13px; background:#fed7d7; color:#c53030; border:1px solid #fc8181;">
                  🗑️ Supprimer
                </button>

                ${prestataire ? `
                  <button class="btn-admin btn-bloquer" onclick="bloquerPrestataire('${prestataire.id}')" title="Bloquer le prestataire" style="width:auto; padding:6px 12px; font-size:13px;">
                    🚫 Bloquer prestataire
                  </button>
                ` : ''}
                <button class="btn-admin btn-debloquer" onclick="marquerTousSignalementsTraites(${groupe.annonce ? groupe.annonce.id : 'null'})" title="Marquer tous comme traités" style="width:auto; padding:6px 12px; font-size:13px;">
                  ✅ Tout traiter
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }).join("");
    }
  }

  // ✅ NOUVELLE FONCTION : RÉACTIVER une annonce depuis les signalements
  window.reactiverAnnonceSignalee = async function(annonceId) {
    if (!annonceId || annonceId === 'null') {
      alert("ID de l'annonce introuvable.");
      return;
    }
    if (!confirm("▶️ Réafficher cette annonce ? Elle redeviendra visible sur le site public.")) return;
    
    const { data: annonce, error: errAnnonce } = await supabase
      .from('annonces')
      .select('user_id, titre')
      .eq('id', annonceId)
      .single();
    
    const { error } = await supabase.from('annonces').update({ statut: 'actif' }).eq('id', annonceId);
    if (error) {
      alert("❌ Erreur : " + error.message);
    } else {
      await loggerAction('REACTIVER_ANNONCE_SIGNALEE', annonceId, {});
      
      if (!errAnnonce && annonce && annonce.user_id) {
        await envoyerNotification(
          annonce.user_id, 
          `✅ Votre annonce "${annonce.titre}" a été réaffichée et est à nouveau visible sur le site.`
        );
      }
      
      alert("✅ Annonce réaffichée avec succès !");
      await chargerSignalements();
      await chargerAnnonces(); 
      mettreAJourStatistiques();
    }
  };

  window.supprimerAnnonceDepuisSignalement = async function(annonceId) {
    if (!annonceId || annonceId === 'null') {
      alert("ID de l'annonce introuvable.");
      return;
    }
    if (!confirm("⚠️ Supprimer DÉFINITIVEMENT cette annonce ? Cette action est irréversible.")) return;
    
    const { data: annonce, error: errAnnonce } = await supabase
      .from('annonces')
      .select('user_id, titre')
      .eq('id', annonceId)
      .single();
    
    const { error } = await supabase.from('annonces').update({ statut: 'supprime' }).eq('id', annonceId);
    
    if (error) {
      alert("Erreur : " + error.message);
    } else {
      await loggerAction('SUPPRIMER_ANNONCE_VIA_SIGNALEMENT', annonceId, {});
      
      if (!errAnnonce && annonce && annonce.user_id) {
        await envoyerNotification(
          annonce.user_id, 
          `🗑️ Votre annonce "${annonce.titre}" a été supprimée suite à des signalements d'utilisateurs.`
        );
      }
      
      alert("✅ Annonce supprimée avec succès !");
      await chargerSignalements();
      await chargerAnnonces();
      mettreAJourStatistiques();
    }
  };

  window.voirProfilDepuisAnnonce = async function(annonceId, emailUtilisateur) {
    let userId = null;
    let prestataire = null;

    if (annonceId && annonceId !== 'null' && annonceId !== '') {
      const { data: annonce, error: errAnnonce } = await supabase
        .from('annonces')
        .select('user_id, titre')
        .eq('id', annonceId)
        .single();

      if (!errAnnonce && annonce && annonce.user_id) {
        userId = annonce.user_id;
      }
    }

    if (userId) {
      const { data, error } = await supabase
        .from('profils_admin')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && data) prestataire = data;
    }

    if (!prestataire && emailUtilisateur && emailUtilisateur !== 'Anonyme' && emailUtilisateur !== 'null' && emailUtilisateur !== '') {
      const { data, error } = await supabase
        .from('profils_admin')
        .select('*')
        .eq('email', emailUtilisateur)
        .single();
      if (!error && data) {
        prestataire = data;
        userId = data.id;
      }
    }

    if (!prestataire) {
      alert("Impossible de trouver le profil du prestataire pour cette annonce.");
      return;
    }

    const { data: annoncesPrestataire, error: errAnnonces } = await supabase
      .from('annonces')
      .select('*')
      .eq('user_id', userId)
      .neq('statut', 'supprime')
      .order('created_at', { ascending: false });

    const initiales = (prestataire.nom || prestataire.email || "?").charAt(0).toUpperCase();
    const statutBadge = prestataire.est_bloque ? '<span class="badge-statut badge-bloque">🚫 Bloqué</span>' : '<span class="badge-statut badge-actif">✅ Actif</span>';

    let modale = document.getElementById('modale-profil-prestataire');
    if (!modale) {
      modale = document.createElement('div');
      modale.id = 'modale-profil-prestataire';
      modale.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:99999; display:flex; align-items:center; justify-content:center; padding:20px;';
      document.body.appendChild(modale);
    }

    let annoncesHTML = '';
    if (!errAnnonces && annoncesPrestataire && annoncesPrestataire.length > 0) {
      annoncesHTML = `
        <div style="margin-top:20px;">
          <h3 style="margin:0 0 12px 0; font-size:16px; color:var(--couleur-primaire);">📋 Annonces publiées (${annoncesPrestataire.length})</h3>
          <div style="max-height:200px; overflow-y:auto;">
            ${annoncesPrestataire.map(a => {
              const statut = a.statut || 'actif';
              const badgeStatut = statut === 'suspendu' ? '<span class="badge-statut badge-suspendu">⏸️</span>' : '<span class="badge-statut badge-actif">✅</span>';
              return `
                <div style="background:var(--couleur-fond, #f7fafc); padding:10px; border-radius:6px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                  <div style="flex:1;">
                    <p style="margin:0; font-size:13px; font-weight:600;">${a.titre}</p>
                    <p style="margin:2px 0 0 0; font-size:11px; color:var(--couleur-texte-clair);">${a.arrondissement} - ${a.quartier} | ${Number(a.prix).toLocaleString()} FCFA</p>
                  </div>
                  <div style="display:flex; gap:4px;">
                    ${badgeStatut}
                    <a href="annonce.html?id=${a.id}" target="_blank" style="padding:4px 8px; background:#3182ce; color:white; border-radius:4px; text-decoration:none; font-size:11px;">Voir</a>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      `;
    } else {
      annoncesHTML = `<p style="margin-top:20px; text-align:center; color:var(--couleur-texte-clair); font-size:13px;">Aucune annonce active trouvée pour ce prestataire.</p>`;
    }

    modale.innerHTML = `
      <div style="background:var(--couleur-carte, white); border-radius:12px; padding:24px; max-width:600px; width:100%; max-height:90vh; overflow-y:auto;">
        <div style="display:flex; align-items:center; gap:16px; margin-bottom:20px;">
          <div class="admin-avatar" style="width:80px; height:80px; font-size:32px;">${initiales}</div>
          <div>
            <h2 style="margin:0; font-size:20px; color:var(--couleur-primaire);">${prestataire.nom || 'Utilisateur sans nom'}</h2>
            <p style="margin:4px 0 0 0; font-size:14px; color:var(--couleur-texte-clair);">${statutBadge}</p>
          </div>
        </div>
        
        <div style="background:var(--couleur-fond, #f7fafc); padding:16px; border-radius:8px; margin-bottom:16px;">
          <p style="margin:8px 0; font-size:14px;"><strong>📧 Email :</strong> ${prestataire.email}</p>
          ${prestataire.telephone ? `<p style="margin:8px 0; font-size:14px;"><strong>📞 Téléphone :</strong> ${prestataire.telephone}</p>` : ''}
          <p style="margin:8px 0; font-size:14px;"><strong>👤 Rôle :</strong> ${prestataire.role || 'utilisateur'}</p>
          <p style="margin:8px 0; font-size:14px;"><strong>📅 Inscrit le :</strong> ${new Date(prestataire.date_inscription).toLocaleDateString()}</p>
          ${prestataire.date_blocage ? `<p style="margin:8px 0; font-size:14px;"><strong>🚫 Bloqué le :</strong> ${new Date(prestataire.date_blocage).toLocaleDateString()}</p>` : ''}
          ${prestataire.raison_blocage ? `<p style="margin:8px 0; font-size:14px;"><strong>📝 Raison :</strong> ${prestataire.raison_blocage}</p>` : ''}
        </div>

        ${annoncesHTML}

        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:20px;">
          ${prestataire.telephone ? `<a href="https://wa.me/${prestataire.telephone.replace(/\s/g, '')}" target="_blank" style="flex:1; padding:10px; background:#25D366; color:white; border-radius:6px; text-decoration:none; text-align:center; font-weight:600; font-size:14px;">💬 WhatsApp</a>` : ''}
          <a href="mailto:${prestataire.email}" style="flex:1; padding:10px; background:#3182ce; color:white; border-radius:6px; text-decoration:none; text-align:center; font-weight:600; font-size:14px;">📧 Email</a>
          <button onclick="fermerModalePrestataire()" style="flex:1; padding:10px; background:#718096; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:600; font-size:14px;">Fermer</button>
        </div>
      </div>
    `;
    modale.style.display = 'flex';
  };

  window.fermerModalePrestataire = function() {
    const modale = document.getElementById('modale-profil-prestataire');
    if (modale) modale.style.display = 'none';
  };

  window.voirDetailsSignalements = function(annonceId) {
    const signalementsAnnonce = tousLesSignalements.filter(s => s.annonce_id === annonceId);
    
    let contenu = `
      <div style="max-height:70vh; overflow-y:auto;">
        <h3 style="margin:0 0 15px 0; color:#e53e3e;">🚨 Détails des signalements (${signalementsAnnonce.length})</h3>
    `;
    
    signalementsAnnonce.forEach((sig, index) => {
      const badgeStatut = sig.statut === 'traité' ? '<span class="badge-statut badge-actif">✅ Traité</span>' : '<span class="badge-statut badge-suspendu">⏳ En attente</span>';
      
      contenu += `
        <div style="background:#f7fafc; padding:12px; border-radius:8px; margin-bottom:10px; border-left:3px solid ${sig.statut === 'en attente' ? '#e53e3e' : '#38a169'};">
          <p style="margin:0 0 8px 0; font-weight:600; font-size:14px;">Signalement #${index + 1}</p>
          <p style="margin:4px 0; font-size:13px;"><strong>Motif :</strong> ${sig.motif}</p>
          <p style="margin:4px 0; font-size:13px;"><strong>Signalé par :</strong> ${sig.email_utilisateur || 'Anonyme'}</p>
          <p style="margin:4px 0; font-size:13px;"><strong>Date :</strong> ${new Date(sig.date_signalement).toLocaleDateString()} à ${new Date(sig.date_signalement).toLocaleTimeString()}</p>
          ${sig.commentaire ? `<p style="margin:8px 0 4px 0; font-size:13px;"><strong>Commentaire :</strong></p><p style="margin:0; font-size:13px; background:white; padding:8px; border-radius:4px;">"${sig.commentaire}"</p>` : ''}
          <p style="margin:8px 0 0 0;">${badgeStatut}</p>
          ${sig.statut === 'en attente' ? `<button onclick="marquerSignalementTraite('${sig.id}')" style="margin-top:8px; padding:6px 12px; background:#38a169; color:white; border:none; border-radius:6px; cursor:pointer; font-size:12px;">✅ Marquer comme traité</button>` : ''}
        </div>
      `;
    });
    
    contenu += `
        <button onclick="fermerModaleDetails()" style="width:100%; padding:10px; background:#718096; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:600; margin-top:10px;">
          Fermer
        </button>
      </div>
    `;
    
    let modale = document.getElementById('modale-details-signalements');
    if (!modale) {
      modale = document.createElement('div');
      modale.id = 'modale-details-signalements';
      modale.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:99999; display:flex; align-items:center; justify-content:center; padding:20px;';
      document.body.appendChild(modale);
    }
    
    modale.innerHTML = `
      <div style="background:var(--couleur-carte, white); border-radius:12px; padding:20px; max-width:600px; width:100%; max-height:90vh; overflow-y:auto;">
        ${contenu}
      </div>
    `;
    modale.style.display = 'flex';
  };

  window.fermerModaleDetails = function() {
    const modale = document.getElementById('modale-details-signalements');
    if (modale) modale.style.display = 'none';
  };

  window.suspendreAnnonceSignalee = async function(annonceId) {
    if (!annonceId || annonceId === 'null') {
      alert("ID de l'annonce introuvable.");
      return;
    }
    if (!confirm("⏸️ Suspendre cette annonce ? Elle sera masquée du site public.")) return;
    
    const { data: annonce, error: errAnnonce } = await supabase
      .from('annonces')
      .select('user_id, titre')
      .eq('id', annonceId)
      .single();
    
    if (errAnnonce || !annonce) {
      alert("❌ Erreur : Impossible de récupérer l'annonce");
      return;
    }
    
    const signalementsAnnonce = tousLesSignalements.filter(s => s.annonce_id === annonceId && s.statut === 'en attente');
    const motifs = signalementsAnnonce.map(s => s.motif).join(', ');
    
    const { error } = await supabase.from('annonces').update({ statut: 'suspendu' }).eq('id', annonceId);
    if (error) {
      alert("❌ Erreur : " + error.message);
    } else {
      await loggerAction('SUSPENDRE_ANNONCE_SIGNALEE', annonceId, {});
      
      if (annonce.user_id) {
        const message = `⏸️ Votre annonce "${annonce.titre}" a été suspendue suite à des signalements. Motifs : ${motifs || 'Non précisés'}. Veuillez vérifier qu'elle respecte nos conditions.`;
        await envoyerNotification(annonce.user_id, message);
      }
      
      alert("✅ Annonce suspendue avec succès !");
      await chargerSignalements();
      await chargerAnnonces(); 
      mettreAJourStatistiques();
    }
  };

  window.bloquerPrestataire = async function(prestataireId) {
    if (!prestataireId) return;
    if (!confirm("🚫 Bloquer le prestataire ? Il ne pourra plus se connecter ni publier.")) return;
    
    const { error } = await supabase.from('profils_admin').update({ 
      est_bloque: true, 
      date_blocage: new Date().toISOString(),
      raison_blocage: 'Bloqué suite à un signalement'
    }).eq('id', prestataireId);
    
    if (error) {
      alert("Erreur : " + error.message);
    } else {
      await loggerAction('BLOQUER_PRESTATAIRE', prestataireId, {});
      alert("✅ Prestataire bloqué avec succès !");
      chargerSignalements();
      chargerUtilisateurs();
      mettreAJourStatistiques();
    }
  };

  window.marquerTousSignalementsTraites = async function(annonceId) {
    if (!annonceId || annonceId === 'null') return;
    if (!confirm("✅ Marquer tous les signalements de cette annonce comme traités ?")) return;
    
    const signalementsAnnonce = tousLesSignalements.filter(s => s.annonce_id === annonceId && s.statut === 'en attente');
    
    for (const sig of signalementsAnnonce) {
      await supabase.from('signalements').update({ statut: 'traité' }).eq('id', sig.id);
    }
    
    await loggerAction('TRAITER_TOUS_SIGNALEMENTS', annonceId, { count: signalementsAnnonce.length });
    alert("✅ Tous les signalements marqués comme traités !");
    chargerSignalements();
  };

  window.marquerSignalementTraite = async function(sigId) {
    const { error } = await supabase.from('signalements').update({ statut: 'traité' }).eq('id', sigId);
    if (error) alert("Erreur : " + error.message);
    else {
      await loggerAction('TRAITER_UN_SIGNALEMENT', sigId, {});
      chargerSignalements();
      const modale = document.getElementById('modale-details-signalements');
      if (modale && modale.style.display !== 'none') {
        const annonceId = tousLesSignalements.find(s => s.id === sigId)?.annonce_id;
        if (annonceId) voirDetailsSignalements(annonceId);
      }
    }
  };

  window.supprimerSignalement = async function(sigId) {
    if (!confirm("Archiver ce signalement ?")) return;
    const { error } = await supabase.from('signalements').delete().eq('id', sigId);
    if (error) alert("Erreur : " + error.message);
    else {
      await loggerAction('SUPPRIMER_SIGNALEMENT', sigId, {});
      chargerSignalements();
    }
  };

  // ==================================================
  // STATISTIQUES ET GRAPHIQUE
  // ==================================================
  function mettreAJourStatistiques() {
    if (statAnnonces) statAnnonces.textContent = toutesLesAnnonces.filter(a => (a.statut || 'actif') !== 'supprime').length;
    if (statUtilisateurs) statUtilisateurs.textContent = tousLesUtilisateurs.length;
    if (statBloques) statBloques.textContent = tousLesUtilisateurs.filter(u => u.est_bloque).length;
  }

  function genererGraphique() {
    const ctx = document.getElementById('chartAnnonces');
    if (!ctx) return;
    const annoncesActives = toutesLesAnnonces.filter(a => (a.statut || 'actif') !== 'supprime');
    const compteur = {};
    annoncesActives.forEach(a => {
      const arr = a.arrondissement || 'Non précisé';
      compteur[arr] = (compteur[arr] || 0) + 1;
    });

    const couleursFixes = { 'Non précisé': '#000000', '10e - Kintélé': '#8B4513' };
    const palette = ['#E63946', '#1D3557', '#2A9D8F', '#F4A261', '#6A4C93', '#F94144', '#43AA8B', '#F8961E', '#577590', '#90BE6D'];
    const labels = Object.keys(compteur);
    const couleursFinales = labels.map(label => {
      if (couleursFixes[label]) return couleursFixes[label];
      return palette[labels.filter(l => !couleursFixes[l]).indexOf(label) % palette.length];
    });

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{ data: Object.values(compteur), backgroundColor: couleursFinales, borderWidth: 3, borderColor: '#fff', hoverOffset: 10 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { padding: 15, usePointStyle: true, font: { size: 12, weight: '600' } } } } }
    });
  }

  function genererGraphiqueType() {
    const ctx = document.getElementById('chartTypes');
    if (!ctx) return;
    
    const annoncesActives = toutesLesAnnonces.filter(a => (a.statut || 'actif') !== 'supprime');
    const compteur = {};
    
    annoncesActives.forEach(a => {
      let typeBrut = a.type || 'Autre';
      let typePropre = typeBrut.charAt(0).toUpperCase() + typeBrut.slice(1).toLowerCase();
      compteur[typePropre] = (compteur[typePropre] || 0) + 1;
    });

    const paletteTypes = ['#3182ce', '#38a169', '#dd6b20', '#805ad5', '#e53e3e', '#718096'];
    const labels = Object.keys(compteur);
    const couleurs = labels.map((_, i) => paletteTypes[i % paletteTypes.length]);

    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{ 
          data: Object.values(compteur), 
          backgroundColor: couleurs, 
          borderWidth: 2, 
          borderColor: '#fff',
          hoverOffset: 8 
        }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        plugins: { 
          legend: { 
            position: 'right',
            labels: { 
              padding: 15, 
              usePointStyle: true, 
              font: { size: 12, weight: '600' } 
            } 
          } 
        } 
      }
    });
  }

  if (rechercheUsers) {
    rechercheUsers.addEventListener("input", function() {
      const terme = this.value.toLowerCase();
      afficherUtilisateurs(tousLesUtilisateurs.filter(u => (u.email && u.email.toLowerCase().includes(terme)) || (u.nom && u.nom.toLowerCase().includes(terme))));
    });
  }

  if (rechercheAnnonces) {
    rechercheAnnonces.addEventListener("input", function() {
      const terme = this.value.toLowerCase();
      afficherAnnonces(toutesLesAnnonces.filter(a => ((a.statut || 'actif') !== 'supprime') && ((a.titre && a.titre.toLowerCase().includes(terme)) || (a.quartier && a.quartier.toLowerCase().includes(terme)) || (a.arrondissement && a.arrondissement.toLowerCase().includes(terme)))));
    });
  }

  chargerDonnees();

  // ==================================================
  // GESTION DU MODE MAINTENANCE
  // ==================================================
  const toggleMaintenance = document.getElementById('toggle-maintenance');
  
  if (toggleMaintenance) {
    async function chargerEtatMaintenance() {
      const { data, error } = await supabase
        .from('parametres')
        .select('valeur')
        .eq('cle', 'mode_maintenance')
        .single();
      
      if (!error && data) {
        toggleMaintenance.checked = data.valeur === 'true';
      }
    }
    
    toggleMaintenance.addEventListener('change', async function() {
      const nouveauEtat = this.checked ? 'true' : 'false';
      const action = this.checked ? 'activer' : 'désactiver';
      
      if (!confirm(`Voulez-vous vraiment ${action} le mode maintenance ?`)) {
        this.checked = !this.checked;
        return;
      }
      
      const { error } = await supabase
        .from('parametres')
        .update({ 
          valeur: nouveauEtat,
          date_modification: new Date().toISOString()
        })
        .eq('cle', 'mode_maintenance');
      
      if (error) {
        alert("Erreur : " + error.message);
        this.checked = !this.checked;
      } else {
        await loggerAction(this.checked ? 'MAINTENANCE_ON' : 'MAINTENANCE_OFF', '', {});
        alert(`✅ Mode maintenance ${action} avec succès !`);
      }
    });
    
    chargerEtatMaintenance();
  }

  // ==================================================
  // FONCTIONS D'EXPORT CSV
  // ==================================================
  
  function echapperCSV(valeur) {
    if (valeur === null || valeur === undefined) return '';
    const chaine = String(valeur);
    if (chaine.includes(';') || chaine.includes('"') || chaine.includes('\n')) {
      return '"' + chaine.replace(/"/g, '""') + '"';
    }
    return chaine;
  }
  
  function telechargerCSV(contenu, nomFichier) {
    const BOM = '\uFEFF';
    const csvContenu = BOM + contenu;
    
    try {
      const blob = new Blob([csvContenu], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const lien = document.createElement('a');
      lien.href = url;
      lien.setAttribute('download', nomFichier);
      lien.style.display = 'none';
      document.body.appendChild(lien);
      lien.click();
      setTimeout(() => {
        document.body.removeChild(lien);
        URL.revokeObjectURL(url);
      }, 100);
      return true;
    } catch (e) {
      console.error('Erreur méthode 1:', e);
    }
    
    try {
      const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContenu);
      const lien = document.createElement('a');
      lien.href = dataUri;
      lien.download = nomFichier;
      lien.style.display = 'none';
      document.body.appendChild(lien);
      lien.click();
      document.body.removeChild(lien);
      return true;
    } catch (e) {
      console.error('Erreur méthode 2:', e);
      alert("❌ Impossible de télécharger. Essaie avec Chrome.");
      return false;
    }
  }
  
  window.exporterUtilisateurs = function() {
    if (!tousLesUtilisateurs || tousLesUtilisateurs.length === 0) {
      alert("❌ Aucun utilisateur à exporter.");
      return;
    }
    const entetes = ['Email', 'Nom', 'Rôle', 'Statut', 'Date inscription', 'Date blocage', 'Raison blocage'];
    const lignes = tousLesUtilisateurs.map(u => {
      return [
        echapperCSV(u.email),
        echapperCSV(u.nom || ''),
        echapperCSV(u.role || 'utilisateur'),
        echapperCSV(u.est_bloque ? 'Bloqué' : 'Actif'),
        echapperCSV(u.date_inscription ? new Date(u.date_inscription).toLocaleString('fr-FR') : ''),
        echapperCSV(u.date_blocage ? new Date(u.date_blocage).toLocaleString('fr-FR') : ''),
        echapperCSV(u.raison_blocage || '')
      ].join(';');
    });
    const contenuCSV = entetes.join(';') + '\n' + lignes.join('\n');
    const date = new Date().toISOString().split('T')[0];
    const nomFichier = `utilisateurs_brazza_${date}.csv`;
    
    if (telechargerCSV(contenuCSV, nomFichier)) {
      loggerAction('EXPORT_CSV_USERS', '', { count: tousLesUtilisateurs.length });
      alert(`✅ ${tousLesUtilisateurs.length} utilisateur(s) exporté(s) !\nFichier : ${nomFichier}`);
    }
  };
  
  window.exporterAnnonces = function() {
    if (!toutesLesAnnonces || toutesLesAnnonces.length === 0) {
      alert("❌ Aucune annonce à exporter.");
      return;
    }
    const annoncesExport = toutesLesAnnonces.filter(a => (a.statut || 'actif') !== 'supprime');
    if (annoncesExport.length === 0) {
      alert("❌ Aucune annonce active à exporter.");
      return;
    }
    const entetes = ['Titre', 'Prix (FCFA)', 'Arrondissement', 'Quartier', 'Adresse', 'Type', 'Pièces', 'Statut', 'Propriétaire', 'Date publication'];
    const lignes = annoncesExport.map(a => {
      return [
        echapperCSV(a.titre || ''),
        echapperCSV(a.prix || 0),
        echapperCSV(a.arrondissement || ''),
        echapperCSV(a.quartier || ''),
        echapperCSV(a.adresse || ''),
        echapperCSV(a.type || ''),
        echapperCSV(a.pieces || ''),
        echapperCSV(a.statut || 'actif'),
        echapperCSV(a.nom_proprietaire || ''),
        echapperCSV(a.created_at ? new Date(a.created_at).toLocaleString('fr-FR') : '')
      ].join(';');
    });
    const contenuCSV = entetes.join(';') + '\n' + lignes.join('\n');
    const date = new Date().toISOString().split('T')[0];
    const nomFichier = `annonces_brazza_${date}.csv`;
    
    if (telechargerCSV(contenuCSV, nomFichier)) {
      loggerAction('EXPORT_CSV_ANNONCES', '', { count: annoncesExport.length });
      alert(`✅ ${annoncesExport.length} annonce(s) exportée(s) !\nFichier : ${nomFichier}`);
    }
  };

  // ==================================================
  // GESTION DES QUARTIERS
  // ==================================================
  async function chargerQuartiers() {
    const { data, error } = await supabase.from('quartiers').select('*').order('arrondissement', { ascending: true }).order('ordre', { ascending: true });
    if (error) { alert("Erreur quartiers: " + error.message); return; }
    tousLesQuartiers = data || [];
    afficherQuartiers(tousLesQuartiers);
  }

  function afficherQuartiers(quartiers) {
    if (!quartiers || quartiers.length === 0) {
      if (listeQuartiers) listeQuartiers.style.display = "none";
      if (aucunQuartier) aucunQuartier.style.display = "block";
      return;
    }
    if (aucunQuartier) aucunQuartier.style.display = "none";
    if (listeQuartiers) {
      listeQuartiers.style.display = "flex";
      listeQuartiers.innerHTML = quartiers.map(q => `
        <div class="admin-ligne">
          <div class="admin-info" style="flex:2;">
            <p class="admin-titre">📍 ${q.quartier}</p>
            <p class="admin-detail">🏛️ ${q.arrondissement}</p>
          </div>
          <div class="admin-actions">
            <button class="btn-admin btn-supprimer" onclick="supprimerQuartier('${q.id}', '${q.quartier}')" title="Supprimer ce quartier">🗑️</button>
          </div>
        </div>
      `).join("");
    }
  }

  window.ajouterQuartier = async function() {
    const arr = document.getElementById("select-arrondissement-new").value;
    const nom = document.getElementById("input-quartier-new").value.trim();
    
    if (!arr || !nom) {
      alert("⚠️ Veuillez sélectionner un arrondissement et saisir un nom de quartier.");
      return;
    }

    const { error } = await supabase.from('quartiers').insert({ arrondissement: arr, quartier: nom, ordre: 99 });
    
    if (error) {
      if (error.code === '23505') {
        alert("⚠️ Ce quartier existe déjà dans cet arrondissement.");
      } else {
        alert("Erreur : " + error.message);
      }
    } else {
      await loggerAction('AJOUTER_QUARTIER', '', { arrondissement: arr, quartier: nom });
      alert("✅ Quartier ajouté avec succès !");
      document.getElementById("input-quartier-new").value = "";
      chargerQuartiers();
    }
  };

  window.supprimerQuartier = async function(id, nom) {
    if (!confirm(`⚠️ Supprimer définitivement le quartier "${nom}" ?`)) return;
    const { error } = await supabase.from('quartiers').delete().eq('id', id);
    if (error) {
      alert("Erreur : " + error.message);
    } else {
      await loggerAction('SUPPRIMER_QUARTIER', id, { nom_quartier: nom });
      alert("✅ Quartier supprimé avec succès !");
      chargerQuartiers();
    }
  };

  // ==================================================
  // GESTION DES TÉMOIGNAGES CLIENTS
  // ==================================================
  async function chargerTemoignages() {
    const { data, error } = await supabase
      .from('temoignages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) { 
      alert("Erreur témoignages: " + error.message); 
      return; 
    }
    
    tousLesTemoignages = data || [];
    afficherTemoignages(tousLesTemoignages);
  }

  function afficherTemoignages(temoins) {
    if (!temoins || temoins.length === 0) {
      if (listeTemoins) listeTemoins.style.display = "none";
      if (aucunTemoin) aucunTemoin.style.display = "block";
      return;
    }
    if (aucunTemoin) aucunTemoin.style.display = "none";
    if (listeTemoins) {
      listeTemoins.style.display = "flex";
      listeTemoins.innerHTML = temoins.map(t => {
        const stars = "⭐".repeat(t.note || 0);
        const statutBadge = t.est_valide 
          ? '<span class="badge-statut badge-actif">✅ Visible</span>' 
          : '<span class="badge-statut badge-suspendu">⏳ En attente</span>';
        
        const btnToggleStyle = t.est_valide
          ? 'background:#fefcbf; color:#744210; border:1px solid #ecc94b; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-size:16px;'
          : 'background:#c6f6d5; color:#22543d; border:1px solid #9ae6b4; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-size:16px;';
        
        const btnDeleteStyle = 'background:#fed7d7; color:#c53030; border:1px solid #fc8181; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-size:16px;';

        return `
          <div class="admin-ligne">
            <div class="admin-info" style="flex:2;">
              <p class="admin-titre">${stars} ${t.nom_client}</p>
              <p class="admin-detail">📍 ${t.ville}</p>
              <p class="admin-detail" style="font-style:italic; margin-top:5px;">"${t.message}"</p>
              <p class="admin-detail">${statutBadge} · <small>${new Date(t.created_at).toLocaleDateString()}</small></p>
            </div>
            <div class="admin-actions" style="gap:6px;">
              <button 
                onclick="validerTemoin('${t.id}', ${!t.est_valide})" 
                title="${t.est_valide ? 'Masquer' : 'Afficher'}"
                style="${btnToggleStyle}; border-radius:6px; cursor:pointer;"
              >
                ${t.est_valide ? '🙈' : '👁️'}
              </button>
              <button 
                onclick="supprimerTemoin('${t.id}')" 
                title="Supprimer"
                style="${btnDeleteStyle}; border-radius:6px; cursor:pointer;"
              >
                🗑️
              </button>
            </div>
          </div>`;
      }).join("");
    }
  }

  window.ouvrirFormAjoutTemoin = function() {
    if(formAjoutTemoin) formAjoutTemoin.style.display = "block";
  };

  window.fermerFormAjoutTemoin = function() {
    if(formAjoutTemoin) formAjoutTemoin.style.display = "none";
    document.getElementById("temoin-nom").value = "";
    document.getElementById("temoin-ville").value = "Brazzaville";
    document.getElementById("temoin-message").value = "";
    document.getElementById("temoin-note").value = "5";
  };

  window.sauvegarderTemoin = async function() {
    const nom = document.getElementById("temoin-nom").value.trim();
    const ville = document.getElementById("temoin-ville").value.trim() || "Brazzaville";
    const message = document.getElementById("temoin-message").value.trim();
    const note = parseInt(document.getElementById("temoin-note").value);

    if(!nom || !message) {
      alert("⚠️ Nom et Message sont obligatoires.");
      return;
    }

    const { error } = await supabase.from('temoignages').insert({
      nom_client: nom,
      ville: ville,
      message: message,
      note: note,
      est_valide: true
    });

    if(error) {
      alert("❌ Erreur : " + error.message);
    } else {
      await loggerAction('AJOUTER_TEMOIGNAGE', '', { nom: nom });
      alert("✅ Témoignage ajouté !");
      fermerFormAjoutTemoin();
      chargerTemoignages();
    }
  };

  window.validerTemoin = async function(id, nouveauStatut) {
    const { error } = await supabase.from('temoignages').update({ est_valide: nouveauStatut }).eq('id', id);
    if(error) alert("Erreur : " + error.message);
    else {
      await loggerAction(nouveauStatut ? 'VALIDER_TEMOIGNAGE' : 'MASQUER_TEMOIGNAGE', id, {});
      chargerTemoignages();
    }
  };

  window.supprimerTemoin = async function(id) {
    if(!confirm("⚠️ Supprimer ce témoignage définitivement ?")) return;
    const { error } = await supabase.from('temoignages').delete().eq('id', id);
    if(error) alert("Erreur : " + error.message);
    else {
      await loggerAction('SUPPRIMER_TEMOIGNAGE', id, {});
      chargerTemoignages();
    }
  };

});

