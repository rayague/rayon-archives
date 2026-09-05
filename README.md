# RAYON — le fonds du studio

Un meuble à archives où se rangent les projets du studio **Pineapple Effect**.
Cliquer un casier déplie ses pièces ; en ouvrir une la rend lisible.

Quatrième projet vitrine, et le seul dont le contenu est le studio lui-même.

> **En cours.** Le dépliement, le retour exact et les trois états fonctionnent
> et sont mesurés. L'ajout de casiers, le tri et la recherche restent à faire.

---

## Ce que ce projet prouve

Les trois vitrines précédentes se lisent : on défile, on regarde, on
configure. Celle-ci **se range**. Ce n'est plus une page, c'est un lieu où
les choses ont une place et y retournent.

Trois compétences que les autres ne démontrent pas : la **mémoire spatiale**
— chaque pièce sait d'où elle vient —, l'**état hiérarchique** à trois
niveaux, et une mise en page **pilotée par le contenu**.

---

## Le meuble est une étagère PLI

Première version : des rectangles sombres avec un dégradé. Ça se lisait comme
des cartes d'interface, pas comme un meuble — et un projet qui parle de ranger
des choses dans un lieu ne peut pas se permettre un lieu qui n'existe pas.

Le meuble reprend donc le vocabulaire de **PLI** : acier plié, tablettes de
chêne, angles droits. Le studio range ses archives dans son propre mobilier.

**En CSS 3D, pas en WebGL.** Importer la scène Three.js aurait rendu le texte
non sélectionnable et illisible pour un lecteur d'écran — précisément ce que
RAYON évite.

**Une case est une caisse, pas un rectangle.** Première version : des
rectangles verticaux séparés par un filet clair. Comparé au configurateur PLI,
le verdict était sans appel — on y voit un objet dans l'espace, ici une grille.
Le manque était la profondeur : une élévation à plat d'une étagère ressemble
toujours à des rectangles, parce que c'est ce qu'elle est.

Chaque case porte donc quatre **vrais plans** en `transform-style: preserve-3d`
— fond, cloison, tablette, chant — pivotés sur leur arête avant, comme la tôle
de PLI l'est sur sa ligne de pli. Pas des dégradés qui imitent un plan : des
plans.

**Frontal, et c'est délibéré.** Incliner le meuble inclinerait les étiquettes,
or l'étiquette est le sujet de ce projet. La perspective fait le travail à sa
place : avec un point de fuite au centre, les cases de gauche montrent leur
paroi droite et celles de droite leur paroi gauche — ce qu'on voit en
photographiant une bibliothèque de face. Les textes restent sur le plan
frontal, donc parfaitement droits.

Deux pièges à connaître : `overflow` ou `isolation` sur un ancêtre font
s'effondrer tout le `preserve-3d`, **sans le moindre message d'erreur**. Et une
case qui porte ses deux flancs donne, entre deux voisines, deux tôles dos à
dos là où un meuble n'en a qu'une.

**Et l'entrée est un pli.** Chaque case arrive à plat et se relève sur son arête
basse — le geste exact de PLI. Les deux projets montrent le même mobilier ; il
serait incohérent qu'il se fabrique différemment. Une fois monté, plus rien ne
bouge : seuls les papiers répondent à la main.

## Ajouter un casier

Un emplacement vide, toujours en dernier. On le nomme avant de le poser — un
casier sans étiquette est un casier qu'on ne retrouve pas, et l'étiquette est
le sujet même de ce meuble.

Ce qui est ajouté **persiste** : `localStorage`, pas l'URL. Une configuration de
meuble n'a pas vocation à être partagée, c'est le rangement de celui qui est
devant l'écran. Sans persistance, « ajouter un casier » serait une
démonstration, pas une fonction.

Une case vide **ne se déplie pas** : il n'y aurait rien à montrer, et une
animation qui ne montre rien passe pour une panne. Elle tressaute, et c'est
tout.

## La technique : FLIP

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
DOM, et le navigateur les remet où elles vont. Mesuré : **0 px d'écart** après
un aller-retour complet.

---

## La contrainte qui rend l'animation possible

Toutes les fiches ont le même rapport de forme, et leur taille de police est
**calculée depuis leur largeur** :

```css
.fiche{ width:var(--l); font-size:calc(var(--l) / 26); }
```

Une fiche est une page : petite dans son casier, grande une fois ouverte,
mais la même page. Le rapport entre deux états est donc identique pour la
boîte et pour le texte, et l'échelle du FLIP les décrit tous les deux d'un
seul nombre.

Sans ça, le texte garderait sa taille pendant que la boîte grandit, et chaque
transition finirait par un ressaut. Tout l'intérieur d'une fiche est en `em`,
aucun `px`.

---

## Pas de 3D, et c'est un choix

Le dépliement est une mise en page **en espace-écran**. Déplacer des maillages
3D vers une grille plate donne toujours un résultat bancal.

En DOM, le texte reste sélectionnable, lisible par un lecteur d'écran et
cherchable — trois choses qu'un maillage ne donne pas. Ça distingue aussi
RAYON de PLI au lieu de le doubler.

---

## Ce qui est mesuré

| Poste | Mesure |
|---|---|
| Écart au retour, aller-retour complet | **0 px** |
| Fiches déplacées au dépliement | **4 sur 15** — les autres ne bougent pas |
| Ordre du plan après lecture | préservé |
| Erreurs de console | 0 |

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
| `src/deplier.js` | le moteur FLIP, réutilisable |
| `src/main.js` | les trois états et leurs transitions |
| `src/fonds.js` | le contenu — tout est vrai, rien n'est du remplissage |

---

## Ce qui reste

Ajouter des casiers, trier, chercher. Et une décision à prendre : ce meuble
reste-t-il un projet vitrine, ou devient-il **le** portfolio du studio ?

---

## Ranger une pièce dans un autre casier

C'est le geste qui manquait. Un meuble où l'on ajoute des cases sans pouvoir y
ranger quoi que ce soit n'est vrai qu'à moitié : on fabrique des étagères
vides.

On saisit la pièce du dessus d'une pile, on la porte, on la lâche dans une
autre case. **Pas de menu, pas de bouton, pas de mode.** C'est ce qu'on fait
avec du papier.

**Le seuil qui sépare le clic du porté : six pixels.** En dessous, c'est un
clic et la pile se déplie. Au-dessus, c'est un déplacement. Sans ce seuil, un
clic un peu tremblant arracherait une fiche de son casier, et personne ne
saurait pourquoi.

**La pièce portée doit être transparente au pointeur.** Sans cette précaution
elle serait elle-même l'élément sous le curseur, et la case visée ne serait
jamais trouvée. C'est le piège classique du glisser-déposer écrit à la main.

**Ce qui est rangé reste rangé.** Le classement est écrit dans le stockage
local, par cote de pièce. Sans ça, ranger serait une animation : on classe, on
recharge, tout est revenu en place, et le meuble se moque de nous.

Le retour au bercail — quand on lâche à côté — emprunte **le même FLIP** que le
rangement. Il n'y a pas deux chemins à maintenir.

| Vérifié | |
|---|---|
| Porté sous le seuil de 6 px | ne soulève pas |
| Case visée | s'éclaire par le fond, pas par une bordure |
| Lâcher dans une case | la pièce y va, les deux étiquettes se recomptent |
| Le lâcher ne déplie pas la case d'arrivée | l'état reste « casier » |
| Rangs de la pile d'arrivée | renumérotés 0,1,2… sans trou |
| Après rechargement | le classement a tenu |
| Lâcher à côté | la pièce rentre chez elle |
