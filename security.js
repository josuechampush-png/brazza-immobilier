
/* ==================================================
   security.js — PROTECTION DE BRAZA IMMOBILIER
   Middleware de sécurité Express
   ================================================== */

module.exports = function security(app) {

  // 1. Masquer la technologie utilisée par le serveur
  app.disable('x-powered-by');

  // 2. Headers HTTP de sécurité
  app.use((req, res, next) => {

    // Empêcher la détection automatique du type de fichier
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Empêcher l'intégration du site dans une iframe externe
    res.setHeader('X-Frame-Options', 'DENY');

    // Contrôler les informations envoyées dans le Referer
    res.setHeader(
      'Referrer-Policy',
      'strict-origin-when-cross-origin'
    );

    // Limiter les permissions du navigateur
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(self)'
    );

    // Empêcher certaines attaques liées aux fenêtres
    res.setHeader(
      'Cross-Origin-Opener-Policy',
      'same-origin-allow-popups'
    );

    // Protection HTTPS en production
    if (process.env.NODE_ENV === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=15552000'
      );
    }

    next();
  });

  // 3. Bloquer l'accès aux fichiers sensibles
  app.use((req, res, next) => {

    const requestedPath = req.path.toLowerCase();

    const blockedFiles = [
      /^\/server\.js$/,
      /^\/security\.js$/,
      /^\/package\.json$/,
      /^\/package-lock\.json$/,
      /^\/yarn\.lock$/,
      /^\/pnpm-lock\.yaml$/,
      /^\/\.env(?:\..*)?$/,
      /^\/.*\.(?:sql|dump|bak|backup|old|log)$/i
    ];

    const blockedDirectories = [
      '/.git/',
      '/node_modules/',
      '/.svn/'
    ];

    // Bloquer les fichiers sensibles
    if (blockedFiles.some(pattern => pattern.test(requestedPath))) {
      return res.status(404).send('Not Found');
    }

    // Bloquer les dossiers internes
    if (blockedDirectories.some(directory =>
      requestedPath.includes(directory)
    )) {
      return res.status(404).send('Not Found');
    }

    next();
  });

  console.log('🔐 Protection de sécurité activée');

};
