/* ==================================================
   header.js — AFFICHAGE UTILISATEUR CONNECTÉ + NOTIFICATIONS + RÔLES (V10 FINAL)
   Correction : Marquer notifications comme lues à l'ouverture + badge qui disparaît
   ================================================== */

document.addEventListener("DOMContentLoaded", async function () {
  
  const headerActions = document.querySelector(".header-actions");
  if (!headerActions) return;
  
  let client;
  if (window.supabase && typeof window.supabase.from === 'function') {
    client = window.supabase;
  } else if (window.supabase && window.supabase.createClient) {
    const SUPABASE_URL = 'https://buymgwahouwcwwgdiogn.supabase.co';
    // ✅ CLÉ ANON (sécurisée) au lieu de SERVICE_ROLE (dangereuse)
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1eW1nd2Fob3V3Y3d3Z2Rpb2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2Mjg0MTksImV4cCI6MjEwNjIwNDQxOX0.B5GTAoT9ip-PTlTUVMw3I-t1xBESxPoeeoELbtNBxqo';
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } else {
    console.error("❌ Supabase non disponible");
    return;
  }
  
  try {
    const { data: { session } } = await client.auth.getSession();
    
    if (session) {
      
      const { data: profilDb, error: errProfil } = await client
        .from('profils_admin')
        .select('nom, role')
        .eq('id', session.user.id)
        .single();

      let nomAfficheFinal = "Utilisateur";
      
      if (!errProfil && profilDb && profilDb.nom) {
        nomAfficheFinal = profilDb.nom.trim();
      } else {
        let nomBrut = session.user.user_metadata?.nom || "";
        if (!nomBrut.trim()) {
          nomBrut = session.user.email.split('@')[0];
        }
        nomAfficheFinal = nomBrut.replace(/_/g, ' ').trim();
      }

      let roleUtilisateur = 'client';
      
      if (!errProfil && profilDb && profilDb.role) {
        roleUtilisateur = profilDb.role;
      } else {
        roleUtilisateur = session.user.user_metadata?.role || 'client';
      }

      console.log("--- DEBUG HEADER ---");
      console.log("Email:", session.user.email);
      console.log("Nom Lu en Base:", profilDb ? profilDb.nom : "NULL");
      console.log("Nom Affiché Final:", nomAfficheFinal);
      console.log("Role Détecté:", roleUtilisateur);
      console.log("--------------------");

      if (roleUtilisateur === 'client') {
        
        const elementsHideForClient = document.querySelectorAll('.hide-for-client');
        elementsHideForClient.forEach(el => {
           el.style.display = 'none';
        });

        const btnPublier = document.querySelector('.btn-publier-pro');
        if (btnPublier) {
          btnPublier.style.opacity = '0.5';
          btnPublier.style.pointerEvents = 'none'; 
          btnPublier.title = "Réservé aux prestataires";
          
          const spanTexte = btnPublier.querySelector('.btn-texte');
          if(spanTexte) spanTexte.textContent = "Prestataire";
        }

        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
          if (link.href.includes('publier.html')) {
            const parentLi = link.closest('li');
            if(parentLi) parentLi.style.display = 'none';
          }
        });

        const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
        bottomNavItems.forEach(item => {
          if (item.href.includes('mes-annonces.html')) {
            item.style.display = 'none';
          }
        });
      }
      
      const userContainer = document.createElement("div");
      userContainer.className = "user-container";
      
      userContainer.innerHTML = 
        '<div style="position:relative; display:inline-flex; align-items:center; gap:10px;">' +
          '<button id="btn-notif-cloche" title="Notifications" style="background:none; border:none; font-size:20px; cursor:pointer; position:relative; padding:0; margin:0;">🔔<span id="badge-notif-count" style="display:none; position:absolute; top:-5px; right:-8px; background:#e53e3e; color:white; font-size:10px; font-weight:bold; padding:2px 5px; border-radius:10px;">0</span></button>' +
          '<a href="profil.html" class="user-nom" style="text-decoration: none; color: inherit; cursor: pointer; white-space: nowrap;">👤 ' + nomAfficheFinal + '</a>' +
          '<div id="dropdown-notifs" style="display:none; position:absolute; top:100%; right:0; margin-top:10px; width:300px; background:white; border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.1); z-index:1000; max-height:350px; overflow-y:auto;"></div>' +
        '</div>';
      
      headerActions.appendChild(userContainer);

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

      async function marquerToutLu() {
        if (!client) return;
        try {
          await client
            .from('notifications')
            .update({ lu: true })
            .eq('user_id', userId)
            .eq('lu', false);
        } catch (err) {
          console.error("Erreur marquage lu:", err);
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
        btnCloche.onclick = async (e) => {
          e.stopPropagation();
          if (dropdownNotifs.style.display === "block") {
            dropdownNotifs.style.display = "none";
          } else {
            dropdownNotifs.style.display = "block";
            chargerListeNotifs();
            await marquerToutLu();
            majBadge();
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
      const userContainer = document.createElement("div");
      userContainer.className = "user-container";
      userContainer.innerHTML = '<a href="login.html" class="btn-connexion-header">🔐</a>';
      headerActions.appendChild(userContainer);
    }
    
  } catch (error) {
    console.error("Erreur session header :", error);
  }
  
});

