/* ==================================================
   header.js — AFFICHAGE UTILISATEUR CONNECTÉ + NOTIFICATIONS
   Structure Originale Préservée
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
      const nom = session.user.user_metadata?.nom || session.user.email.split('@')[0];
      
      // ✅ RESPECT DE LA STRUCTURE ORIGINALE (.user-container)
      const userContainer = document.createElement("div");
      userContainer.className = "user-container";
      
      // On injecte la cloche AVANT le lien profil, dans un wrapper relatif
      // Pour ne pas casser le CSS .user-nom qui est défini ailleurs
      userContainer.innerHTML = 
        '<div style="position:relative; display:inline-flex; align-items:center; gap:10px;">' +
          '<button id="btn-notif-cloche" title="Notifications" style="background:none; border:none; font-size:20px; cursor:pointer; position:relative; padding:0; margin:0;">🔔<span id="badge-notif-count" style="display:none; position:absolute; top:-5px; right:-8px; background:#e53e3e; color:white; font-size:10px; font-weight:bold; padding:2px 5px; border-radius:10px;">0</span></button>' +
          '<a href="profil.html" class="user-nom" style="text-decoration: none; color: inherit; cursor: pointer;">👤 ' + nom + '</a>' +
          '<div id="dropdown-notifs" style="display:none; position:absolute; top:100%; right:0; margin-top:10px; width:300px; background:white; border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.1); z-index:1000; max-height:350px; overflow-y:auto;"></div>' +
        '</div>';
      
      headerActions.appendChild(userContainer);

      const btnCloche = document.getElementById("btn-notif-cloche");
      const dropdownNotifs = document.getElementById("dropdown-notifs");
      const badgeCount = document.getElementById("badge-notif-count");
      const userId = session.user.id;

      // Fonction Badge
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

      // Fonctions Globales pour Suppression
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

      // Chargement Liste
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

      // Événements Cloche
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

      // Fermer si clic dehors
      document.onclick = (e) => {
        if (dropdownNotifs && !e.target.closest(".notif-wrapper") && !e.target.closest("#btn-notif-cloche")) {
           // Note: Le wrapper n'a pas la classe notif-wrapper ici car j'ai utilisé un div inline
           // On vérifie juste si on clique hors du container user
           if(!e.target.closest(".user-container")) {
             dropdownNotifs.style.display = "none";
           }
        }
      };

    } else {
      // Utilisateur non connecté : Structure originale simple
      const userContainer = document.createElement("div");
      userContainer.className = "user-container";
      userContainer.innerHTML = '<a href="login.html" class="btn-connexion-header">🔐</a>';
      headerActions.appendChild(userContainer);
    }
    
  } catch (error) {
    console.error("Erreur session header :", error);
  }
  
});