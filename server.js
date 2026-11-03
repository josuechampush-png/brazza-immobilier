
/* ==================================================
   server.js — SERVEUR EXPRESS SÉCURISÉ
   Projet : Braza Immobilier
   ================================================== */

const express = require('express');
const app = express();

// Charger les protections de sécurité
const security = require('./security');

// Port Render ou port local
const PORT = process.env.PORT || 3000;

// Activer les protections
security(app);

// Rediriger la racine vers la connexion
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// Servir les fichiers publics
app.use(express.static(__dirname, {
  dotfiles: 'deny',
  index: false,
  extensions: ['html']
}));

// Page 404
app.use((req, res) => {
  res.status(404).send('Page introuvable');
});

// Démarrer le serveur
const server = app.listen(PORT, () => {
  console.log(`🔐 Braza Immobilier sécurisé`);
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});

// Limites de temps des connexions
server.requestTimeout = 30000;
server.headersTimeout = 35000;
server.keepAliveTimeout = 5000;

