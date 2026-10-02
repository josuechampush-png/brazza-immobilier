/* ==================================================
   server.js — SERVEUR EXPRESS
   Redirige la racine vers login.html
   ================================================== */

const express = require('express');
const app = express();

// Render fournit automatiquement le port via process.env.PORT
// 3000 est utilisé comme port de secours en local.
const PORT = process.env.PORT || 3000;

// ===== ROUTE PRINCIPALE (AVANT express.static) =====
// Quand on arrive sur la racine (/), rediriger vers login.html
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// ===== ENSUITE : Servir les fichiers statiques =====
app.use(express.static(__dirname));

// ===== DÉMARRAGE DU SERVEUR =====
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
});