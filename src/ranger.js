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
 * ET IL EXISTE AUSSI AU CLAVIER
 *
 * Un classement qui n'existe qu'à la souris exclut ceux qui n'en ont pas.
 * La fiche ouverte porte donc une liste déroulante « ranger dans » : même
 * opération, même résultat, sans geste.
 *
 * LE SEUIL QUI SÉPARE LE CLIC DU PORTÉ
 *
 * Six pixels. En dessous, c'est un clic et la pile se déplie. Au-dessus,
 * c'est un déplacement. Sans ce seuil, un clic un peu tremblant arracherait
 * une fiche de son casier — et l'utilisateur ne saurait pas pourquoi.
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


export function creerRangement({ gsap, meuble, reduit = false, surDeplacement, coteDe, etatCourant }) {

  let porte = null;        /* la fiche en cours de portage        */
  let depart = null;       /* sa case d'origine                   */
  let ox = 0, oy = 0;      /* décalage entre le doigt et le coin  */
  let x0 = 0, y0 = 0;
  let engage = false;
  let cible = null;

  /* La fiche portée quitte le flux : position fixe, au-dessus de tout, et
     surtout `pointer-events: none` — sans quoi elle serait elle-même
     l'élément sous le curseur et on ne trouverait jamais la case visée. */
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

    try { fiche.setPointerCapture(ev.pointerId); } catch (e) {}
  }

  function porter(ev) {
    if (!porte) return;

    if (!engage) {
      if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < SEUIL) return;
      engage = true;

      const r = porte.getBoundingClientRect();
      porte.classList.add('fiche--portee');
      porte.style.width = r.width + 'px';
      porte.style.height = r.height + 'px';
      document.body.classList.add('range');
    }

    porte.style.left = (ev.clientX - ox) + 'px';
    porte.style.top = (ev.clientY - oy) + 'px';

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
    if (!porte) return;
    const fiche = porte, vers = cible;

    porte = null; cible = null;
    if (vers) vers.classList.remove('casier--vise');
    document.body.classList.remove('range');
    try { fiche.releasePointerCapture(ev.pointerId); } catch (e) {}

    if (!engage) return;                 /* c'était un clic, pas un porté */
    engage = false;

    /* FIRST : où la fiche est, à l'écran, pendant qu'on la tient. */
    const avant = fiche.getBoundingClientRect();

    fiche.classList.remove('fiche--portee');
    fiche.style.cssText = fiche.style.cssText
      .replace(/(left|top|width|height)\s*:[^;]*;?/g, '');

    if (vers) surDeplacement(fiche, vers.dataset.cote);

    /* LAST, INVERT, PLAY : elle rejoint sa place, qu'elle ait change de
       casier ou non. Le retour au bercail utilise le meme mecanisme que
       le rangement — il n'y a pas deux chemins a maintenir. */
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
    fiche.addEventListener('pointermove', porter, { passive: false });
    fiche.addEventListener('pointerup', lacher);
    fiche.addEventListener('pointercancel', lacher);
  }

  return { brancher, enCours: () => engage };
}
