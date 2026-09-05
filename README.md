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
