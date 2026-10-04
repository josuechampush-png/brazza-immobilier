/* ==================================================
   header.js — AFFICHAGE UTILISATEUR CONNECTÉ + NOTIFICATIONS + RÔLES (V3 ROBUSTE)
   ================================================== */

document.addEventListener("DOMContentLoaded", async function () {
  
  const headerActions = document.querySelector(".header-actions");
  if (!headerActions) return;
  
  let client;
  if (window.supabase && typeof window.supabase.from === 'function') {
    client = window.supabase;
  } else if (window.supabase && window.supabase.createClient) {
    const SUPABASE_URL = 'https://buymgwahouwcwwgdiogn.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1eW1nd2Fob3V3Y3d3Z2Rpb2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYyODQxOSwiZXhwIjoyMTA2MjA0NDE5fQ.4m7vMaiQvDEV5NtptuGlGcdh4gcxNMxHdD-8sPo6M4k';
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } else {
    console.error("❌ Supabase non disponible");
    return;
  }
  
  try {
    const { data: { session } } = await client.auth.getSession();
    
    if (session) {
      // 1. Nom
      let nomAffiche = session.user.user_metadata?.nom;
      if (!nomAffiche || nomAffiche.trim() === "") {
        nomAffiche = session.user.email.split('@')[0];
      }
      const nom = nomAffiche.replace(/_/g, ' ');
      
      // 2. ROLE DETECTION (CRUCIAL)
      let roleUtilisateur = session.user.user_metadata?.role; 

      // Fallback vers la base de données si pas dans metadata
      if (!roleUtilisateur) {
        try {
          const { data: profilDb, error } = await client
            .from('profils_admin')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          if (!error && profilDb && profilDb.role) {
            roleUtilisateur = profilDb.role;
          } else {
            roleUtilisateur = 'client'; // Défaut sécurisé
          }
        } catch (dbErr) {
          console.warn("Erreur lecture rôle DB:", dbErr);
          roleUtilisateur = 'client';
        }
      }

      console.log("--- DEBUG HEADER ---");
      console.log("Email:", session.user.email);
      console.log("Role Final Détecté:", roleUtilisateur);
      console.log("--------------------");

      // 3. LOGIQUE D'AFFICHAGE CLIENT
      if (roleUtilisateur === 'client') {
        
        // A. Cacher le bouton "+ Publier" en haut à droite
        // On vise plusieurs sélecteurs possibles au cas où la classe change
        const btnPubliers = document.querySelectorAll('.btn-publier-pro, a[href="publier.html"].btn-publier-pro');
        btnPubliers.forEach(btn => {
           if(btn) btn.style.display = 'none';
        });

        // B. Cacher l'onglet "Publier" dans le menu horizontal (si présent)
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
          if (link.href.includes('publier.html')) {
            const parentLi = link.closest('li');
            if(parentLi) parentLi.style.display = 'none';
          }
        });

        // C. Cacher "Mes annonces" dans la barre du bas
        const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
        bottomNavItems.forEach(item => {
          if (item.href.includes('mes-annonces.html')) {
            item.style.display = 'none';
          }
        });
      } 
      // Si prestataire/admin, on ne fait rien (tout reste visible)
      
      // 4. INJECTION USER CONTAINER (Nom + Cloche)
      const userContainer = document.createElement("div");
      userContainer.className = "user-container";
      
      userContainer.innerHTML = 
        '<div style="position:relative; display:inline-flex; align-items:center; gap:10px;">' +
          '<button id="btn-notif-cloche" title="Notifications" style="background:none; border:none; font-size:20px; cursor:pointer; position:relative; padding:0; margin:0;">🔔<span id="badge-notif-count" style="display:none; position:absolute; top:-5px; right:-8px; background:#e53e3e; color:white; font-size:10px; font-weight:bold; padding:2px 5px; border-radius:10px;">0</span></button>' +
          '<a href="profil.html" class="user-nom" style="text-decoration: none; color: inherit; cursor: pointer; white-space: nowrap;">👤 ' + nom + '</a>' +
          '<div id="dropdown-notifs" style="display:none; position:absolute; top:100%; right:0; margin-top:10px; width:300px; background:white; border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.1); z-index:1000; max-height:350px; overflow-y:auto;"></div>' +
        '</div>';
      
      headerActions.appendChild(userContainer);

      // ... (Le reste du code notifications reste identique) ...
      const btnCloche = document.getElementById("btn-notif-cloche");
      const dropdownNotifs = document.getElementById("dropdown-notifs");
      const badgeCount = document.getElementById("badge-notif-count");
      const userId = session.user.id;

      async function majBadge() {
        if (!client) return;
        const { count, error: countError } = await client
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('lu', false);

        if (!countError && count > 0) {
          badgeCount.textContent = count;
          badgeCount.style.display = "block";
        } else {
          badgeCount.style.display = "none";
        }
      }

      majBadge();

      window.delNotif = async (id) => {
        const { error } = await client.from('notifications').delete().eq('id', id).eq('user_id', userId);
        if (error) alert("Erreur: " + error.message);
        else {
          chargerListeNotifs();
          majBadge();
        }
      };

      window.delAll = async () => {
        if(!confirm("Supprimer toutes les notifications ?")) return;
        const { error } = await client.from('notifications').delete().eq('user_id', userId);
        if (error) alert("Erreur: " + error.message);
        else {
          chargerListeNotifs();
          majBadge();
        }
      };

      async function chargerListeNotifs() {
        const { data: notifs, error } = await client
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          dropdownNotifs.innerHTML = `<p style="color:red; padding:10px;">Erreur: ${error.message}</p>`;
          return;
        }

        if (!notifs || notifs.length === 0) {
          dropdownNotifs.innerHTML = '<p style="padding:15px; text-align:center; color:#718096;">Aucune notification</p>';
          return;
        }

        let html = "";
        notifs.forEach(n => {
          html += `
            <div style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
              <div style="flex:1; font-size:13px; color:${n.lu ? '#666' : '#0066cc'}; font-weight:${n.lu ? 'normal' : 'bold'};">
                ${n.message}
                <br><small style="color:#aaa; font-size:11px;">${new Date(n.created_at).toLocaleString()}</small>
              </div>
              <button onclick="window.delNotif('${n.id}')" style="background:none; border:none; color:red; font-size:18px; cursor:pointer; margin-left:10px;">✖</button>
            </div>
          `;
        });

        html += `
          <div style="padding:10px; text-align:center; border-top:1px solid #eee;">
            <button onclick="window.delAll()" style="background:#ffebee; color:c62828; border:1px solid #ef9a9a; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:12px;">Tout supprimer</button>
          </div>
        `;

        dropdownNotifs.innerHTML = html;
      }

      if (btnCloche) {
        btnCloche.onclick = (e) => {
          e.stopPropagation();
          if (dropdownNotifs.style.display === "block") {
            dropdownNotifs.style.display = "none";
          } else {
            dropdownNotifs.style.display = "block";
            chargerListeNotifs();
          }
        };
      }

      document.onclick = (e) => {
        if (dropdownNotifs && !e.target.closest(".notif-wrapper") && !e.target.closest("#btn-notif-cloche")) {
           if(!e.target.closest(".user-container")) {
             dropdownNotifs.style.display = "none";
           }
        }
      };

    } else {
      // Non connecté
      const userContainer = document.createElement("div");
      userContainer.className = "user-container";
      userContainer.innerHTML = '<a href="login.html" class="btn-connexion-header">🔐</a>';
      headerActions.appendChild(userContainer);
    }
    
  } catch (error) {
    console.error("Erreur session header :", error);
  }
  
});

