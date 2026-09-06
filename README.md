# RAYON — le fonds du studio

Un meuble à archives où se rangent les projets du studio **Pineapple Effect**.
Cliquer un casier déplie ses pièces ; en ouvrir une la rend lisible ; on porte
une pièce d'une case à l'autre pour la classer.

Quatrième projet vitrine, et le seul dont le contenu est le studio lui-même.

---

## Ce que ce projet prouve

Les trois vitrines précédentes se lisent : on défile, on regarde, on configure.
Celle-ci **se range**. Ce n'est plus une page, c'est un lieu où les choses ont
une place et y retournent.

Trois compétences que les autres ne démontrent pas : la **mémoire spatiale** —
chaque pièce sait d'où elle vient et y revient au pixel —, l'**état
hiérarchique** à trois niveaux, et une mise en page **pilotée par le contenu**.

---

## Le meuble est un bâti, pas une grille

Première version : des rectangles sombres avec un dégradé. Ça se lisait comme
des cartes d'interface. Deuxième : des caisses, chacune portant ses flancs et
sa tablette. Mieux, et toujours faux.

**Un meuble n'est pas une collection de boîtes posées côte à côte.** C'est un
bâti — des montants qui vont du sol au sommet, des tablettes qui traversent
toute la largeur — et les cases naissent de leur croisement.

Ça ne se voit pas sur une rangée. Dès deux, des flancs par case ne s'alignent
plus et des tablettes par case s'arrêtent au bord : l'œil ne voit plus une
structure, il voit des morceaux. C'est exactement ainsi que **PLI** construit
son étagère, et c'est pour ça qu'elle se lit comme un meuble.

**Et c'est la proportion qui décidait de tout.** Cinq cases hautes et étroites
sur une seule rangée donnent une palissade. Trois colonnes de cases presque
carrées — 400 × 360 mm, celles de PLI — donnent une bibliothèque. Ni la
matière ni la lumière n'y changeaient quoi que ce soit.

### En CSS 3D, pas en WebGL

Importer la scène Three.js de PLI aurait rendu le texte non sélectionnable et
illisible pour un lecteur d'écran — précisément ce que RAYON évite. Les
montants et les tablettes sont de **vrais plans** en `transform-style:
preserve-3d`, pivotés sur leur arête, comme la tôle de PLI l'est sur sa ligne
de pli.

**Frontal, et c'est délibéré.** Incliner le meuble inclinerait les étiquettes,
or l'étiquette est le sujet de ce projet. La perspective fait le travail à sa
place : avec un point de fuite au centre, les montants de gauche montrent leur
face droite et ceux de droite leur face gauche — ce qu'on voit en
photographiant une bibliothèque de face. Les textes restent sur le plan
frontal, donc parfaitement droits.

### Trois pièges, payés en heures

- `overflow` ou `isolation` sur un ancêtre font s'effondrer tout le
  `preserve-3d`, **sans le moindre message d'erreur**.
- Un montant qui montre ses **deux** faces a une épaisseur double, et le meuble
  louche. Une seule face par montant : celle qui regarde le centre.
- Une dernière rangée qui s'arrête au milieu n'existe pas — on verrait les
  montants surplomber le vide. Les cases manquantes sont dessinées, vides.

**L'entrée est un pli.** Chaque case arrive à plat et se relève sur son arête
basse : le geste exact de PLI. Les deux projets montrent le même mobilier, il
serait incohérent qu'il se fabrique différemment. Une fois monté, plus rien ne
bouge — seuls les papiers répondent à la main.

---

## Le dépliement : FLIP

On ne déplace pas des éléments, on change la mise en page puis on ment sur le
passé.

1. **First** — relever où chaque fiche se trouve à l'écran, maintenant.
2. **Last** — modifier le DOM. Le navigateur recalcule tout d'un coup.
3. **Invert** — les renvoyer visuellement à leur ancienne place par une
   transformation. À l'œil, rien n'a bougé.
4. **Play** — ramener cette transformation à zéro.

Animer `left` et `top` ferait recalculer la mise en page à chaque image. FLIP
n'anime que `transform`, dont le compositeur se charge sans repasser par le
moteur de rendu.

**Le retour est exact parce qu'il n'est pas calculé.** Fermer n'anime pas vers
des coordonnées mémorisées : les fiches changent réellement de place dans le
DOM, et le navigateur les remet où elles vont.

Deux détails qui font la différence : l'**origine de transformation en haut à
gauche**, sans quoi translation et échelle se composent d'une façon qui oblige
à corriger le décalage à la main ; et le relevé **« last » transformations
remises à zéro**, sinon on mesure l'ancien mouvement au lieu de la nouvelle
mise en page.

---

## Ranger une pièce dans un autre casier

Un meuble où l'on ajoute des cases sans pouvoir y ranger quoi que ce soit n'est
vrai qu'à moitié : on fabrique des étagères vides.

On saisit la pièce du dessus d'une pile, on la porte, on la lâche dans une
autre case. **Pas de menu, pas de bouton, pas de mode.** C'est ce qu'on fait
avec du papier.

- **Le seuil qui sépare le clic du porté : six pixels.** En dessous, c'est un
  clic et la pile se déplie. Sans lui, un clic un peu tremblant arracherait une
  fiche de son casier, et personne ne saurait pourquoi.
- **La pièce portée est transparente au pointeur.** Sans cette précaution elle
  serait elle-même l'élément sous le curseur, et la case visée ne serait jamais
  trouvée. C'est le piège classique du glisser-déposer écrit à la main.
- **Le retour au bercail emprunte le même FLIP** que le rangement. Il n'y a pas
  deux chemins à maintenir.

## Ajouter un casier

Un emplacement vide, toujours en dernier. On le nomme avant de le poser — un
casier sans étiquette est un casier qu'on ne retrouve pas, et l'étiquette est
le sujet même de ce meuble. Le titre saisi est échappé : un meuble où l'on
nomme les cases est un meuble où l'on peut écrire n'importe quoi.

Une case vide **ne se déplie pas** : il n'y aurait rien à montrer, et une
animation qui ne montre rien passe pour une panne. Elle tressaute, et c'est
tout.

**Ce qui est rangé reste rangé.** Casiers ajoutés et classement des pièces sont
écrits dans `localStorage`, pas dans l'URL — une configuration de meuble n'a pas
vocation à être partagée, c'est le rangement de celui qui est devant l'écran.
Sans persistance, tout ça serait une démonstration, pas une fonction.

---

## La contrainte qui rend l'animation possible

Toutes les fiches ont le même rapport de forme, et leur taille de police est
**calculée depuis leur largeur** :

```css
.fiche{ width:var(--l); font-size:calc(var(--l) / 26); }
```

Une fiche est une page : petite dans son casier, grande une fois ouverte, mais
la même page. Le rapport entre deux états est donc identique pour la boîte et
pour le texte, et l'échelle du FLIP les décrit tous les deux d'un seul nombre.

Sans ça, le texte garderait sa taille pendant que la boîte grandit, et chaque
transition finirait par un ressaut. Tout l'intérieur d'une fiche est en `em`,
aucun `px`.

---

## Ce qui est mesuré

| Poste | Mesure |
|---|---|
| Écart au retour, aller-retour complet | **0 px** |
| Fiches déplacées au dépliement | **4 sur 15** — les autres ne bougent pas |
| Ordre du plan après lecture | préservé |
| Porté sous le seuil de 6 px | ne soulève pas |
| Lâcher dans une case | la pièce y va, les deux étiquettes se recomptent |
| Le lâcher ne déplie pas la case d'arrivée | l'état reste « casier » |
| Rangs de la pile d'arrivée | renumérotés 0,1,2… sans trou |
| Classement après rechargement | tenu |
| Lâcher à côté | la pièce rentre chez elle |
| Casier ajouté après rechargement | tenu |
| Erreurs de console | **0** |

---

## Lancer

```bash
npm install
```

```bash
npm run dev
```

| Module | Rôle |
|---|---|
| `src/cadre.js` | le bâti — montants, tablettes, cases de complément |
| `src/deplier.js` | le moteur FLIP, réutilisable |
| `src/ranger.js` | porter une pièce d'une case à l'autre |
| `src/monter.js` | le montage du meuble, et l'ajout de casiers |
| `src/main.js` | les trois états et leurs transitions |
| `src/fonds.js` | le contenu — tout est vrai, rien n'est du remplissage |

---

## Le contenu est vrai

Aucun texte de remplissage, aucun chiffre inventé. Les mesures viennent des
README des dépôts, les dates des journaux de commits, les décisions des briefs.

Un portfolio qui se démontre lui-même ne peut pas se permettre du faux
contenu : la première personne qui lit une fiche s'en aperçoit, et tout le
reste devient suspect.

**Et rien de ce qui appartient à un client n'y figure.** Le fonds Lébou Gui ne
porte que des faits techniques — un calcul de contraste, un nombre de boutons,
un poids de build. Ni SIRET, ni adresse, ni téléphone. C'est le vrai risque
d'un portfolio rempli avec du travail réel, et il se revérifie à chaque fonds
ajouté.

---

## Ce qui reste

Trier et chercher. Et une décision à prendre : ce meuble reste-t-il un projet
vitrine, ou devient-il **le** portfolio du studio ?
