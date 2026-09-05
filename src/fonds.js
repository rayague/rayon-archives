/**
 * ============================================================================
 * RAYON · fonds.js
 * ----------------------------------------------------------------------------
 * CE QU'IL Y A DANS LES CASIERS.
 *
 * Le mot « fonds » est celui des archivistes : l'ensemble des documents
 * produits par une même activité. Ici, un fonds par projet du studio.
 *
 * TOUT EST VRAI.
 *
 * Aucun texte de remplissage, aucun chiffre inventé. Les mesures viennent des
 * README des dépôts, les dates des journaux de commits, les décisions des
 * briefs. Un portfolio qui se démontre lui-même ne peut pas se permettre du
 * faux contenu : la première personne qui lit une fiche s'en aperçoit, et
 * tout le reste devient suspect.
 *
 * LA CONTRAINTE QUI REND L'ANIMATION POSSIBLE
 *
 * Toutes les fiches ont le MÊME rapport largeur/hauteur, celui d'une page.
 * Ce n'est pas une coquetterie graphique : le dépliement change leur taille,
 * et une mise à l'échelle non uniforme déforme le texte. Format constant,
 * échelle uniforme, texte net à toutes les tailles.
 *
 * La contrainte bien choisie fait le travail à notre place — c'est le même
 * raisonnement que la géométrie générée de PLI.
 * ============================================================================
 */

export const FONDS = [
  {
    cote: 'PE.01',
    titre: 'SÈVE',
    sousTitre: 'Bois Dormant',
    annee: '2026',
    couleur: 'seve',
    resume: "Landing page produit. Aucune photographie : tout en SVG et en typographie.",
    fiches: [
      {
        genre: 'brief',
        titre: 'La contrainte de départ',
        corps: [
          "Pas une seule photographie. Le produit n'existe pas encore, et une image de synthèse ratée aurait coûté plus cher que pas d'image du tout.",
          "Tout est donc tracé : le flacon, la matière, la lumière. Le dessin vectoriel ne prétend rien — il montre ce qu'il est."
        ]
      },
      {
        genre: 'technique',
        titre: 'Ce qui a été construit',
        corps: [
          "HTML, CSS et JavaScript à la main. Aucun cadriciel.",
          "La signature du studio y apparaît pour la première fois, et devient le module copié tel quel dans tous les projets suivants."
        ]
      },
      {
        genre: 'mesure',
        titre: 'Les chiffres',
        lignes: [
          ['Photographies', '0'],
          ['Cadriciels', '0'],
          ['Dépôt', 'public']
        ]
      }
    ]
  },

  {
    cote: 'PE.02',
    titre: 'LISIÈRE',
    sousTitre: 'Rapport 2026',
    annee: '2026',
    couleur: 'lisiere',
    resume: "Rapport annuel interactif sur le recul du trait de côte. Observatoire fictif, données réelles.",
    fiches: [
      {
        genre: 'brief',
        titre: 'Un observatoire qui n\'existe pas',
        corps: [
          "Le commanditaire est inventé, les données ne le sont pas : elles viennent du Cerema et d'OpenStreetMap.",
          "C'est la ligne à ne pas franchir — on peut inventer une institution, jamais un chiffre."
        ]
      },
      {
        genre: 'technique',
        titre: 'Le fil continu',
        corps: [
          "Une seule ligne traverse tout le rapport et se transforme en chaque graphique, sans jamais se rompre.",
          "L'interpolation se fait terme à terme entre deux listes de points de même longueur. Le rééchantillonnage passe par TOUS les sommets d'origine : un intervalle constant coupait les angles."
        ]
      },
      {
        genre: 'mesure',
        titre: 'La fidélité du fil',
        lignes: [
          ['Erreur maximale, 1re version', '3,54 px'],
          ['Après passage par les sommets', '4,20 px'],
          ['Après fermeture du contour', '0,066 px'],
          ['Dépôt', 'public']
        ]
      },
      {
        genre: 'note',
        titre: 'La mesure circulaire',
        corps: [
          "La première mesure de fidélité comparait le fil à la source rééchantillonnée aux mêmes 160 points. Elle ne prouvait rien : on comparait une chose à elle-même.",
          "La mesure honnête projette chaque point réel sur le segment le plus proche. C'est elle qui a révélé les 3,54 px."
        ]
      }
    ]
  },

  {
    cote: 'PE.03',
    titre: 'LÉBOU GUI',
    sousTitre: 'Chef à Bonifacio',
    annee: '2026',
    couleur: 'lebou',
    resume: "Premier projet client. Six pages, bilingue français-italien, mobile d'abord.",
    fiches: [
      {
        genre: 'brief',
        titre: 'Ce que le site doit faire',
        corps: [
          "Le succès se mesure à un téléphone qui sonne, pas à une entrée réussie.",
          "Aucune animation ne touche un bouton de contact : ni masqué au départ, ni dans une chronologie. Vérifié après chaque passe de mouvement."
        ]
      },
      {
        genre: 'technique',
        titre: 'Le bouton impossible',
        corps: [
          "L'ambre du studio sur le calcaire donne 1,74:1. Un élément d'interface doit atteindre 3:1.",
          "Assombrir l'ambre ne résout rien : se détacher du calcaire exige une luminance sous 0,223, porter un libellé lisible en exige au moins 0,324. Les deux contraintes s'excluent.",
          "Le bouton garde donc sa couleur et reçoit un filet de latérite. 4,78:1 pour la limite, 6,14:1 pour le libellé."
        ]
      },
      {
        genre: 'mesure',
        titre: 'À la livraison',
        lignes: [
          ['Boutons de contact', '41'],
          ['Dont animés', '0'],
          ['Poids du déploiement', '4,9 Mo'],
          ['Échecs de contraste', '0'],
          ['Dépôt', 'privé']
        ]
      },
      {
        genre: 'note',
        titre: 'Le build qui pesait trois fois trop',
        corps: [
          "Le dossier des images servait aussi de dossier copié tel quel. Chaque image partait deux fois, et les originaux non traités du chef étaient publiquement téléchargeables.",
          "14 Mo pour 4,7 Mo utiles. Une ligne de configuration."
        ]
      }
    ]
  },

  {
    cote: 'PE.04',
    titre: 'PLI',
    sousTitre: 'Configurateur',
    annee: '2026',
    couleur: 'pli',
    resume: "Configurateur produit en 3D temps réel. Géométrie générée dans le code, aucun fichier de modèle.",
    fiches: [
      {
        genre: 'brief',
        titre: 'La décision qui évite le naufrage',
        corps: [
          "Aucun fichier de modèle. Pour des modules rectangulaires, la configuration est une boucle qui construit des boîtes.",
          "Six semaines d'apprentissage 3D économisées, et un résultat plus léger que n'importe quel modèle importé."
        ]
      },
      {
        genre: 'technique',
        titre: 'Quatre appels de dessin',
        corps: [
          "Un maillage instancié par pièce — base, flanc gauche, flanc droit, tablette. Chaque module n'est qu'une matrice dans ces quatre tableaux.",
          "Trente modules coûtent quatre appels, pas cent vingt, et ce chiffre ne bouge pas quand la configuration grandit."
        ]
      },
      {
        genre: 'mesure',
        titre: 'Les budgets tenus',
        lignes: [
          ['Appels de dessin', '4 / 50'],
          ['Modules déplacés à l\'ajout', '0'],
          ['rAF en vol au repos', '0'],
          ['Poids gzip', '149 Ko / 400'],
          ['Dépôt', 'public']
        ]
      },
      {
        genre: 'note',
        titre: 'La sonde qui mesurait le navigateur',
        corps: [
          "Une première sonde a conclu que la cascade d'apparition était cassée. Elle ne l'était pas : Chrome sans fenêtre étrangle requestAnimationFrame à deux images par seconde.",
          "Elle avance maintenant la chronologie au lieu de l'attendre, et compte les images demandées plutôt que rendues."
        ]
      }
    ]
  }
];

/* Les genres décident de l'apparence d'une fiche, pas de son contenu. Un
   genre est une forme — une note se lit autrement qu'un tableau de mesures. */
export const GENRES = {
  brief:     { nom: 'Brief',    icone: '§' },
  technique: { nom: 'Technique', icone: '⌗' },
  mesure:    { nom: 'Mesures',  icone: '№' },
  note:      { nom: 'Note',     icone: '¶' }
};
