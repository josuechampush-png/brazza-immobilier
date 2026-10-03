const CACHE_NAME = 'braza-immo-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/login.html',
  '/admin.html',
  '/publier.html',
  '/favoris.html',
  '/carte.html',
  '/profil.html',
  '/plus.html',
  '/css/variables.css',
  '/css/base.css',
  '/css/components.css',
  '/css/responsive.css',
  '/js/header.js',
  '/js/theme.js',
  '/js/supabase-client.js', // Assure-toi que ce nom correspond bien à ton fichier client Supabase
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Installation : Mettre en cache les ressources critiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Ouverture du cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch(err => console.error('Erreur lors de la mise en cache:', err))
  );
  self.skipWaiting();
});

// Activation : Nettoyer les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch : Stratégie "Network First" avec fallback Cache
// Essaie d'abord le réseau (pour avoir les dernières données), sinon prend le cache.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si c'est une requête valide et réussie, on peut optionnellement mettre à jour le cache ici
        // Pour simplifier, on laisse le cache statique tel quel pour l'instant
        
        // Gestion spéciale pour les appels API Supabase (ne pas cacher les données dynamiques sensibles)
        if (event.request.url.includes('supabase.co')) {
          return response; 
        }

        return response.clone();
      })
      .catch(() => {
        // Si le réseau échoue, on cherche dans le cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Fallback si rien n'est trouvé (ex: page 404 locale ou message hors ligne)
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            return new Response('Hors ligne. Veuillez vérifier votre connexion.', { status: 503 });
          });
      })
  );
});

