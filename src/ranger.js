/**
 * ============================================================================
 * RAYON · ranger.js
 * ----------------------------------------------------------------------------
 * DÉPLACER UNE PIÈCE D'UN CASIER À UN AUTRE.
 *
 * C'est le geste qui manquait. Un meuble où l'on ajoute des cases sans
 * pouvoir y ranger quoi que ce soit n'est vrai qu'à moitié : on fabrique des
 * étagères vides.
 *
 * LE GESTE EST DIRECT
 *
 * On saisit la fiche du dessus d'une pile, on la porte, on la lâche dans une
 * autre case. Pas de menu, pas de bouton « déplacer », pas de mode. C'est ce
 * qu'on fait avec du papier.
 *
 * LE SEUIL QUI SÉPARE LE CLIC DU PORTÉ
 *
 * Six pixels. En dessous, c'est un clic et la pile se déplie. Au-dessus,
 * c'est un déplacement. Sans ce seuil, un clic un peu tremblant arracherait
 * une fiche de son casier — et l'utilisateur ne saurait pas pourquoi.
 *
 * LA PIÈCE PORTÉE SORT DU MEUBLE, ET IL A FALLU LE MESURER
 *
 * `position: fixed` ne se résout pas contre l'écran mais contre le premier
 * ancêtre transformé — et la pile EST transformée, reculée dans la caisse.
 * Laissée dans son casier, la pièce portée se posait **274 px à droite et
 * 344 px sous le doigt**. Elle passe donc dans le corps du document le temps
 * du geste, et retrouve sa place exacte au lâcher.
 *
 * Deux conséquences, et aucune n'est cosmétique. Sa largeur commande sa
 * taille de police : elle se fige en dur, sinon `--l`, qui vit sur la pile,
 * disparaît avec elle. Et les écoutes du porté vivent sur la FENÊTRE, pas
 * sur la pièce : changer son parent relâche la capture de pointeur, et le
 * geste s'arrêterait au premier millimètre.
 *
 * CE QUI EST RANGÉ RESTE RANGÉ
 *
 * Le classement est écrit dans `localStorage`, par cote de pièce. Sans ça,
 * ranger serait une animation : on classe, on recharge, tout est revenu en
 * place, et le meuble se moque de nous.
 * ============================================================================
 */

const CLEF = 'rayon.classement.v1';
const SEUIL = 6;

export function lireClassement() {
  try {
    const b = localStorage.getItem(CLEF);
    if (!b) return {};
    const o = JSON.parse(b);
    return (o && typeof o === 'object' && !Array.isArray(o)) ? o : {};
  } catch (e) { return {}; }
}

export function ecrireClassement(o) {
  try { localStorage.setItem(CLEF, JSON.stringify(o)); } catch (e) {}
}


export function creerRangement({ gsap, meuble, reduit = false, surDeplacement, etatCourant }) {

  let porte = null;        /* la pièce en cours de portage            */
  let depart = null;       /* sa case d'origine                       */
  let retour = null;       /* où la remettre si on la lâche à côté    */
  let ox = 0, oy = 0;      /* décalage entre le doigt et le coin      */
  let x0 = 0, y0 = 0;
  let engage = false;
  let bloqueClic = false;
  let cible = null;

  function saisir(ev, fiche) {
    if (etatCourant() !== 'casier') return;
    if (ev.button !== undefined && ev.button !== 0) return;

    porte = fiche;
    depart = fiche.closest('.casier');
    x0 = ev.clientX; y0 = ev.clientY;
    engage = false;

    const r = fiche.getBoundingClientRect();
    ox = ev.clientX - r.left;
    oy = ev.clientY - r.top;

    addEventListener('pointermove', porter, { passive: false });
    addEventListener('pointerup', lacher);
    addEventListener('pointercancel', lacher);
  }

  function porter(ev) {
    if (!porte) return;

    if (!engage) {
      if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < SEUIL) return;
      engage = true;

      const r = porte.getBoundingClientRect();
      retour = { parent: porte.parentElement, suivant: porte.nextSibling };
      porte.style.setProperty('--l', r.width + 'px');
      porte.classList.add('fiche--portee');
      document.body.append(porte);
      document.body.classList.add('range');
    }

    porte.style.left = (ev.clientX - ox) + 'px';
    porte.style.top = (ev.clientY - oy) + 'px';

    /* La pièce portée est transparente au pointeur : sans cette précaution
       elle serait elle-même l'élément sous le curseur, et la case visée ne
       serait jamais trouvée. C'est le piège classique du glisser-déposer
       écrit à la main. */
    const sous = document.elementFromPoint(ev.clientX, ev.clientY);
    const c = sous && sous.closest ? sous.closest('.casier[data-cote]') : null;

    if (c !== cible) {
      if (cible) cible.classList.remove('casier--vise');
      cible = (c && c !== depart) ? c : null;
      if (cible) cible.classList.add('casier--vise');
    }

    ev.preventDefault();
  }

  function lacher(ev) {
    removeEventListener('pointermove', porter, { passive: false });
    removeEventListener('pointerup', lacher);
    removeEventListener('pointercancel', lacher);

    if (!porte) return;
    const fiche = porte, vers = cible;

    porte = null; cible = null;
    if (vers) vers.classList.remove('casier--vise');
    document.body.classList.remove('range');

    if (!engage) return;                 /* c'était un clic, pas un porté */
    engage = false;

    /* Un porté se termine par un pointerup, qui déclenche aussi un clic
       dans la même tâche. Le verrou tombe juste après, sinon ranger une
       pièce déplierait la case d'arrivée. */
    bloqueClic = true;
    setTimeout(() => { bloqueClic = false; }, 0);

    /* FIRST : où la pièce est, à l'écran, pendant qu'on la tient. */
    const avant = fiche.getBoundingClientRect();

    fiche.classList.remove('fiche--portee');
    fiche.style.removeProperty('left');
    fiche.style.removeProperty('top');
    fiche.style.removeProperty('--l');

    if (vers) surDeplacement(fiche, vers.dataset.cote);
    else if (retour && retour.parent) {
      /* Lâchée à côté, elle rentre chez elle — à sa place dans la pile, pas
         sur le dessus : l'ordre d'une pile est une information. */
      if (retour.suivant && retour.suivant.parentElement === retour.parent)
        retour.parent.insertBefore(fiche, retour.suivant);
      else retour.parent.append(fiche);
    }
    retour = null;

    /* LAST, INVERT, PLAY : elle rejoint sa place, qu'elle ait changé de
       casier ou non. Le retour au bercail emprunte le même mécanisme que le
       rangement — il n'y a pas deux chemins à maintenir. */
    const apres = fiche.getBoundingClientRect();
    if (reduit || !apres.width) return;

    gsap.fromTo(fiche,
      { x: avant.left - apres.left, y: avant.top - apres.top,
        scale: avant.width / apres.width, transformOrigin: '0 0', zIndex: 60 },
      { x: 0, y: 0, scale: 1, duration: 0.42, ease: 'power3.out',
        clearProps: 'transform,zIndex' });
  }

  function brancher(fiche) {
    fiche.addEventListener('pointerdown', ev => saisir(ev, fiche));
  }

  /* `enCours` couvre aussi le clic qui suit immédiatement le lâcher : c'est
     lui que main.js interroge avant de déplier. */
  return { brancher, enCours: () => engage || bloqueClic };
}
