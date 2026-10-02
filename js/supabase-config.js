/* ==================================================
   supabase-config.js — CONFIGURATION SUPABASE
   Avec logs de débogage pour identifier les problèmes
   ================================================== */

// URL de ton projet Supabase
const SUPABASE_URL = 'https://buymgwahouwcwwgdiogn.supabase.co';

// ⚠️ REMPLACE LA LIGNE CI-DESSOUS PAR TA CLÉ PUBLIQUE ANON
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1eW1nd2Fob3V3Y3d3Z2Rpb2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYyODQxOSwiZXhwIjoyMTA2MjA0NDE5fQ.4m7vMaiQvDEV5NtptuGlGcdh4gcxNMxHdD-8sPo6M4k';

// Logs de débogage
console.log("🔍 Début de l'initialisation Supabase...");
console.log("📍 URL :", SUPABASE_URL);
console.log("🔑 Clé (premiers 20 caractères) :", SUPABASE_KEY.substring(0, 20) + "...");

// Vérifier si le CDN Supabase a chargé
if (typeof window.supabase === 'undefined') {
  console.error("❌ ERREUR CRITIQUE : Le CDN Supabase n'a pas chargé !");
  console.error("Vérifie que cette ligne existe dans ton HTML :");
  console.error('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
  alert("❌ Erreur : Impossible de charger Supabase. Vérifie ta connexion internet.");
} else {
  console.log("✅ CDN Supabase chargé avec succès");
  console.log("📦 Type de window.supabase :", typeof window.supabase);
  console.log("🔧 Type de window.supabase.createClient :", typeof window.supabase.createClient);
  
  // Créer le client Supabase et l'attacher à window
  try {
    window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("✅ Client Supabase créé avec succès");
    console.log("🎯 Type de window.supabase maintenant :", typeof window.supabase);
    console.log("🔍 Type de window.supabase.from :", typeof window.supabase.from);
    
    // Test rapide de connexion
    window.supabase.from('annonces').select('*').limit(1).then(result => {
      if (result.error) {
        console.error("❌ Erreur de connexion à Supabase :", result.error);
      } else {
        console.log("✅ Connexion à Supabase fonctionnelle !");
        console.log("📊 Données test :", result.data);
      }
    });
    
  } catch (error) {
    console.error("❌ Erreur lors de la création du client Supabase :", error);
    alert("❌ Erreur lors de l'initialisation de Supabase : " + error.message);
  }
}

