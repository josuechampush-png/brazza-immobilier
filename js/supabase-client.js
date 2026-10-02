/* ==================================================
   supabase-client.js — CONNEXION À SUPABASE
   Ce fichier initialise la connexion à ta base de données
   ================================================== */

// 1. Importer la fonction pour créer le client Supabase
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// 2. Ton URL de projet (sans le /rest/v1/ à la fin)
const supabaseUrl = 'https://buymgwahouwcwwgdiogn.supabase.co';

// 3. Ta clé publique (anon key)
// ⚠️ Remplace la chaîne ci-dessous par TA VRAIE CLÉ PUBLIQUE
const supabaseKey = 'TA_CLE_PUBLIQUE_ANON_ICI';

// 4. Créer et exporter l'instance du client
export const supabase = createClient(supabaseUrl, supabaseKey);

console.log("✅ Client Supabase initialisé avec succès !");


