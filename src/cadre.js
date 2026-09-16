/**
 * ============================================================================
 * RAYON · cadre.js
 * ----------------------------------------------------------------------------
 * LE BÂTI, ET POURQUOI CHAQUE CASE PORTE DÉSORMAIS SES PIÈCES.
 *
 * Le bâti reste ce qu'il était : des montants qui montent du sol au sommet,
 * des tablettes qui traversent toute la largeur, et des cases qui naissent de
 * leur croisement. À l'œil, rien ne change — les pièces d'une case et celles
 * de sa voisine se superposent exactement sur leur arête commune.
 *
 * Ce qui change, c'est QUI les porte. Elles vivaient dans un cadre unique,
 * posé par-dessus la grille, qui plaçait ses montants à `i / colonnes` de la
 * largeur et ses tablettes à `r / rangées` de la hauteur. Deux choses l'ont
 * condamné :
 *
 *   1. UNE FRACTION DE LA HAUTEUR SUPPOSE DES RANGÉES ÉGALES. Dès que la
 *      hauteur d'une case suit son contenu — ce qu'exige le téléphone — les
 *      tablettes tombent à côté des vraies rangées.
 *
 *   2. UN CASIER DOIT POUVOIR SE CONSTRUIRE SEUL. Ses deux montants se
 *      relèvent, sa planche se pose. Un cadre d'un seul morceau ne se
 *      construit pas case par case.
 *
 * Portées par la case, les pièces suivent sa boîte réelle, la suivent quand
 * elle se déplace, et s'animent avec elle sans qu'aucun redessin global
 * n'interrompe une construction en cours.
 *
 * LES MONTANTS ONT UNE FACE VISIBLE, ET UNE SEULE
 *
 * Le point de fuite est au centre. Un montant à gauche du centre montre sa
 * face DROITE, un montant à droite montre sa face GAUCHE, et un montant
 * exactement au centre n'en montre aucune. Poser les deux faces donnerait une
 * épaisseur double et un meuble qui louche.
 * ============================================================================
 */

/* Les pièces d'une case. Toutes décoratives, toutes `aria-hidden` : un
   lecteur d'écran n'a que faire du mobilier, il vient chercher l'étiquette
   et les pièces rangées. Le fond est au fond, les montants et la planche
   sont sur le plan frontal — l'ordre du DOM ne décide de rien ici, c'est la
   profondeur qui trie. */
export const STRUCTURE =
  '<div class="fond"     aria-hidden="true"></div>' +
  '<div class="montant montant--g" aria-hidden="true"></div>' +
  '<div class="montant montant--d" aria-hidden="true"></div>' +
  '<div class="planche"  aria-hidden="true"></div>';

/* Le nombre de colonnes est décidé par le CSS, pas par le JavaScript : c'est
   une question de largeur d'écran, et les points de bascule sont déjà dans la
   feuille de style. Le JavaScript le LIT pour savoir combien de cases de
   complément poser et de quel côté tourner les faces. */
export function colonnes(meuble) {
  const v = parseInt(getComputedStyle(meuble).getPropertyValue('--colonnes'), 10);
  return Number.isFinite(v) && v > 0 ? v : 1;
}

/* Combien de cases vides faut-il pour que la dernière rangée soit pleine ?

   Un meuble dont la dernière rangée s'arrête au milieu n'existe pas : on
   verrait le bâti se poursuivre au-dessus du vide. Les cases manquantes sont
   donc dessinées, simplement vides. Sur une seule colonne, il n'en faut
   jamais. */
export function casesAcompleter(nombreCases, cols) {
  const reste = nombreCases % cols;
  return reste === 0 ? 0 : cols - reste;
}

const face = (bord, cols) =>
  bord < cols / 2 ? 'droite' : bord > cols / 2 ? 'gauche' : 'aucune';

/* Place chaque case dans le bâti : sa rangée, sa colonne, le rôle de sa
   planche et l'orientation de ses deux faces. À rejouer après tout
   changement du nombre de cases ou de colonnes. */
export function disposer(meuble) {
  const cols = colonnes(meuble);
  const cases = [...meuble.querySelectorAll('.casier')];
  const rangees = Math.max(1, Math.ceil(cases.length / cols));

  cases.forEach((c, i) => {
    const col = i % cols;
    const rangee = Math.floor(i / cols);

    c.style.setProperty('--col', col);
    c.style.setProperty('--rangee', rangee);
    c.dataset.rangee = rangee;

    const g = c.querySelector('.montant--g');
    const d = c.querySelector('.montant--d');
    const p = c.querySelector('.planche');

    if (g) g.dataset.face = face(col, cols);
    if (d) d.dataset.face = face(col + 1, cols);

    /* La tablette du sommet se voit par en DESSOUS : on regarde le meuble
       d'une hauteur d'homme, son couronnement est au-dessus de l'œil. */
    if (p) {
      if (rangee === 0) p.dataset.role = 'sommet';
      else p.removeAttribute('data-role');
    }
  });

  meuble.style.setProperty('--rangees', rangees);
  return { colonnes: cols, rangees, cases: cases.length };
}

/* LE SOCLE. La planche du bas ne se construit pas : les montants poussent
   depuis elle, il faut donc qu'elle soit déjà là. C'est la seule pièce du
   bâti qui n'appartienne à aucune case, et elle reste sous la dernière
   rangée quoi qu'il arrive. */
export function poserSocle(meuble) {
  let socle = meuble.querySelector(':scope > .socle');
  if (!socle) {
    socle = document.createElement('div');
    socle.className = 'socle';
    socle.setAttribute('aria-hidden', 'true');
  }
  meuble.append(socle);          /* toujours en dernier : il passe par-dessus */
  return socle;
}
