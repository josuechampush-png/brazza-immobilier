// ==================================================
// js/data.js — DONNÉES DES ANNONCES
// 12 annonces avec images SVG intégrées
// ==================================================

function genererImageSVG(numero, titre) {
  const couleurs = [
    "#dbe9f6", "#e2f0db", "#f6e5db", "#efe2f5",
    "#fff5e6", "#e6f3ff", "#f0e6ff", "#ffe6f0"
  ];
  const fond = couleurs[numero % couleurs.length];
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>` +
    `<rect width='100%' height='100%' fill='${fond}'/>` +
    `<text x='50%' y='42%' font-size='64' text-anchor='middle'>🏠</text>` +
    `<text x='50%' y='70%' font-size='15' text-anchor='middle' fill='#444'>${titre}</text>` +
    `<text x='50%' y='82%' font-size='11' text-anchor='middle' fill='#888'>Photo ${numero}</text>` +
    `</svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

const annonces = [
  {
    id: 1,
    titre: "Appartement 2 pièces moderne",
    prix: 80000,
    quartier: "Poto-Poto",
    type: "appartement",
    adresse: "Rue Moungali, près du marché Total",
    description: "Bel appartement de 2 pièces avec balcon, eau et électricité comprises.",
    whatsapp: "242061234567",
    photos: [
      genererImageSVG(1, "Appartement 2 pièces"),
      genererImageSVG(2, "Appartement 2 pièces"),
      genererImageSVG(3, "Appartement 2 pièces")
    ],
    created_at: new Date(Date.now() - 5 * 60000)
  },
  {
    id: 2,
    titre: "Chambre moderne avec sanitaire",
    prix: 35000,
    quartier: "Moungali",
    type: "chambre",
    adresse: "Avenue de la Paix, non loin de l'ONU",
    description: "Chambre moderne avec sanitaire interne, accès internet WiFi inclus.",
    whatsapp: "242069876543",
    photos: [
      genererImageSVG(4, "Chambre moderne"),
      genererImageSVG(5, "Chambre moderne"),
      genererImageSVG(6, "Chambre moderne")
    ],
    created_at: new Date(Date.now() - 60 * 60000)
  },
  {
    id: 3,
    titre: "Maison familiale 4 pièces",
    prix: 250000,
    quartier: "Bacongo",
    type: "maison",
    adresse: "Quartier Cases de Gaulle",
    description: "Grande maison familiale avec 4 pièces, cour clôturée, garage.",
    whatsapp: "242064567890",
    photos: [
      genererImageSVG(7, "Maison familiale"),
      genererImageSVG(8, "Maison familiale"),
      genererImageSVG(9, "Maison familiale")
    ],
    created_at: new Date(Date.now() - 24 * 60 * 60000)
  },
  {
    id: 4,
    titre: "Studio meublé centre-ville",
    prix: 120000,
    quartier: "Makélékélé",
    type: "appartement",
    adresse: "Avenue du Général de Gaulle",
    description: "Studio entièrement meublé au centre-ville. Climatisation, cuisine équipée.",
    whatsapp: "242065678901",
    photos: [
      genererImageSVG(10, "Studio meublé"),
      genererImageSVG(11, "Studio meublé"),
      genererImageSVG(12, "Studio meublé")
    ],
    created_at: new Date(Date.now() - 2 * 60 * 60000)
  },
  {
    id: 5,
    titre: "Villa 5 pièces avec piscine",
    prix: 450000,
    quartier: "Ouenzé",
    type: "maison",
    adresse: "Quartier résidentiel Ouenzé Nord",
    description: "Magnifique villa de 5 pièces avec piscine, jardin, garage.",
    whatsapp: "242066789012",
    photos: [
      genererImageSVG(13, "Villa avec piscine"),
      genererImageSVG(14, "Villa avec piscine"),
      genererImageSVG(15, "Villa avec piscine")
    ],
    created_at: new Date(Date.now() - 3 * 60 * 60000)
  },
  {
    id: 6,
    titre: "Appartement 3 pièces lumineux",
    prix: 95000,
    quartier: "Poto-Poto",
    type: "appartement",
    adresse: "Rue des Manguiers",
    description: "Appartement 3 pièces très lumineux, 2 chambres, salon, cuisine.",
    whatsapp: "242067890123",
    photos: [
      genererImageSVG(16, "Appartement 3 pièces"),
      genererImageSVG(17, "Appartement 3 pièces"),
      genererImageSVG(18, "Appartement 3 pièces")
    ],
    created_at: new Date(Date.now() - 4 * 60 * 60000)
  },
  {
    id: 7,
    titre: "Chambre étudiante économique",
    prix: 25000,
    quartier: "Moungali",
    type: "chambre",
    adresse: "Près de l'Université Marien Ngouabi",
    description: "Chambre économique idéale pour étudiant. Sanitaire partagé, calme.",
    whatsapp: "242068901234",
    photos: [
      genererImageSVG(19, "Chambre étudiante"),
      genererImageSVG(20, "Chambre étudiante"),
      genererImageSVG(21, "Chambre étudiante")
    ],
    created_at: new Date(Date.now() - 5 * 60 * 60000)
  },
  {
    id: 8,
    titre: "Maison 3 pièces avec jardin",
    prix: 180000,
    quartier: "Bacongo",
    type: "maison",
    adresse: "Quartier Mpila",
    description: "Maison 3 pièces avec grand jardin, véranda, parking.",
    whatsapp: "242069012345",
    photos: [
      genererImageSVG(22, "Maison avec jardin"),
      genererImageSVG(23, "Maison avec jardin"),
      genererImageSVG(24, "Maison avec jardin")
    ],
    created_at: new Date(Date.now() - 6 * 60 * 60000)
  },
  {
    id: 9,
    titre: "Duplex moderne 4 pièces",
    prix: 220000,
    quartier: "Makélékélé",
    type: "appartement",
    adresse: "Résidence Les Palmiers",
    description: "Duplex moderne sur 2 niveaux, 4 pièces, terrasse, parking sécurisé.",
    whatsapp: "242060123456",
    photos: [
      genererImageSVG(25, "Duplex moderne"),
      genererImageSVG(26, "Duplex moderne"),
      genererImageSVG(27, "Duplex moderne")
    ],
    created_at: new Date(Date.now() - 7 * 60 * 60000)
  },
  {
    id: 10,
    titre: "Chambre meublée standing",
    prix: 55000,
    quartier: "Ouenzé",
    type: "chambre",
    adresse: "Avenue de la Libération",
    description: "Chambre meublée haut standing, lit king size, climatisation, WiFi.",
    whatsapp: "242061234568",
    photos: [
      genererImageSVG(28, "Chambre standing"),
      genererImageSVG(29, "Chambre standing"),
      genererImageSVG(30, "Chambre standing")
    ],
    created_at: new Date(Date.now() - 8 * 60 * 60000)
  },
  {
    id: 11,
    titre: "Appartement 2 pièces neuf",
    prix: 110000,
    quartier: "Poto-Poto",
    type: "appartement",
    adresse: "Nouvelle résidence Les Acacias",
    description: "Appartement neuf jamais habité, 2 pièces, cuisine américaine, balcon.",
    whatsapp: "242062345679",
    photos: [
      genererImageSVG(31, "Appartement neuf"),
      genererImageSVG(32, "Appartement neuf"),
      genererImageSVG(33, "Appartement neuf")
    ],
    created_at: new Date(Date.now() - 9 * 60 * 60000)
  },
  {
    id: 12,
    titre: "Maison traditionnelle 3 pièces",
    prix: 150000,
    quartier: "Bacongo",
    type: "maison",
    adresse: "Quartier Mfilou",
    description: "Maison traditionnelle 3 pièces, grande cour, dépendance possible.",
    whatsapp: "242063456780",
    photos: [
      genererImageSVG(34, "Maison traditionnelle"),
      genererImageSVG(35, "Maison traditionnelle"),
      genererImageSVG(36, "Maison traditionnelle")
    ],
    created_at: new Date(Date.now() - 10 * 60 * 60000)
  }
];
