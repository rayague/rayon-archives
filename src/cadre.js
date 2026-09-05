/**
 * ============================================================================
 * RAYON · cadre.js
 * ----------------------------------------------------------------------------
 * LE BÂTI, ET POURQUOI IL NE PEUT PAS ÊTRE FAIT CASE PAR CASE.
 *
 * Première approche : chaque case portait ses propres flancs et sa propre
 * tablette. Ça paraissait logique, et c'était faux.
 *
 * Un meuble n'est pas une collection de boîtes posées côte à côte. C'est un
 * BÂTI — des montants qui vont du sol au sommet, des tablettes qui traversent
 * toute la largeur — et les cases naissent de leur croisement. C'est
 * exactement ainsi que PLI construit son étagère, et c'est pour ça qu'elle se
 * lit comme un meuble alors que la grille de RAYON se lisait comme une
 * palissade.
 *
 * La différence se voit immédiatement dès qu'il y a deux rangées : des flancs
 * par case ne s'alignent pas d'une rangée à l'autre, et des tablettes par
 * case s'arrêtent au bord de leur case. L'œil ne voit plus une structure,
 * il voit des morceaux.
 *
 * LES MONTANTS ONT UNE FACE VISIBLE, ET UNE SEULE
 *
 * Le point de fuite est au centre. Un montant à gauche du centre montre sa
 * face DROITE, un montant à droite montre sa face GAUCHE. Poser les deux sur
 * chaque montant donnerait une épaisseur double et un meuble qui louche.
 * ============================================================================
 */

export const COLONNES = 3;

export function poserCadre(meuble, nombreCases) {
  const rangees = Math.max(1, Math.ceil(nombreCases / COLONNES));

  let cadre = meuble.querySelector('.cadre');
  if (!cadre) {
    cadre = document.createElement('div');
    cadre.className = 'cadre';
    cadre.setAttribute('aria-hidden', 'true');
    meuble.prepend(cadre);
  }

  cadre.textContent = '';
  meuble.style.setProperty('--rangees', rangees);

  /* Les montants : un de plus que le nombre de colonnes — il en faut un à
     chaque extrémité, pas seulement entre les cases. */
  for (let i = 0; i <= COLONNES; i++) {
    const m = document.createElement('div');
    m.className = 'montant';
    m.style.setProperty('--i', i);

    /* De quel côté voit-on son épaisseur ? Celle qui regarde le centre. */
    m.dataset.face = (i < COLONNES / 2) ? 'droite' : 'gauche';
    cadre.append(m);
  }

  /* Les tablettes : une sous chaque rangée, plus celle du sommet. Elles
     traversent toute la largeur, montants compris — c'est ce qui fait la
     continuité que des tablettes par case ne donnent jamais. */
  for (let r = 0; r <= rangees; r++) {
    const t = document.createElement('div');
    t.className = 'etagere';
    t.style.setProperty('--r', r);
    if (r === 0) t.dataset.role = 'sommet';
    cadre.append(t);
  }

  return { rangees, colonnes: COLONNES };
}

/* Combien de cases vides faut-il pour que la dernière rangée soit pleine ?

   Un meuble dont la dernière rangée s'arrête au milieu n'existe pas : on
   voit le bâti se poursuivre au-dessus du vide. Les cases manquantes sont
   donc dessinées, simplement vides. */
export function casesAcompleter(nombreCases) {
  const reste = nombreCases % COLONNES;
  return reste === 0 ? 0 : COLONNES - reste;
}
