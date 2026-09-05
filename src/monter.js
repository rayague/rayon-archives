/**
 * ============================================================================
 * RAYON · monter.js
 * ----------------------------------------------------------------------------
 * LE MEUBLE SE MONTE, ET ON PEUT LUI AJOUTER DES CASES.
 *
 * L'ENTRÉE EST UN PLI.
 *
 * Chaque case arrive à plat, couchée sur la tablette, et se relève sur son
 * arête basse. C'est exactement le geste de PLI — la tôle qui se plie — et
 * c'est volontaire : les deux projets montrent le même mobilier, il serait
 * incohérent qu'il se fabrique différemment.
 *
 * Ce n'est pas non plus une décoration. Une grille qui apparaît d'un coup ne
 * dit rien ; un meuble qui se monte dit qu'il est fait de pièces, et c'est
 * précisément ce qu'on veut faire comprendre avant que le visiteur clique.
 *
 * ET PUIS PLUS RIEN NE BOUGE.
 *
 * Une fois monté, le meuble est immobile. Seuls les papiers répondent à la
 * main — la pile se soulève d'un cheveu au survol. Le meuble, lui, ne
 * respire pas, ne flotte pas, ne dérive pas : c'est un meuble.
 *
 * AJOUTER UNE CASE
 *
 * L'emplacement vide n'imite pas une case pleine. Il est vide et il le dit.
 * Une case qui prétendrait contenir quelque chose serait un mensonge de plus
 * dans un meuble qui n'en fait aucun.
 * ============================================================================
 */

const CLEF = 'rayon.casiers.v1';

/* ── le montage ──────────────────────────────────────────────────────────*/

export function monter({ gsap, meuble, reduit = false }) {
  const cases = [...meuble.querySelectorAll('.casier')];
  const fiches = [...meuble.querySelectorAll('.fiche')];

  if (reduit) {
    meuble.dataset.monte = 'oui';
    return null;
  }

  const tl = gsap.timeline({ onComplete: () => { meuble.dataset.monte = 'oui'; } });

  /* Les cases se relèvent sur leur arête basse. `transformOrigin` en bas :
     une origine au centre ferait pivoter la case autour de rien. */
  tl.fromTo(cases,
    { rotateX: -84, opacity: 0, transformOrigin: '50% 100%' },
    { rotateX: 0, opacity: 1, duration: 0.62, ease: 'power3.out', stagger: 0.07 });

  /* Les papiers arrivent APRÈS. On ne range pas dans un meuble qui n'est
     pas encore debout. */
  tl.fromTo(fiches,
    { y: -14, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.34, ease: 'power2.out', stagger: 0.015 },
    '-=0.28');

  return tl;
}

/* Une case ajoutée après coup se monte seule, du même geste. */
export function monterUne({ gsap, element, reduit = false }) {
  if (reduit) return null;
  return gsap.fromTo(element,
    { rotateX: -84, opacity: 0, transformOrigin: '50% 100%' },
    { rotateX: 0, opacity: 1, duration: 0.6, ease: 'power3.out' });
}


/* ── ce que le visiteur a ajouté ─────────────────────────────────────────

   Un meuble où l'on range doit garder ce qu'on y a rangé. Sans persistance,
   « ajouter un casier » est une démonstration, pas une fonction.

   localStorage et pas l'URL : une configuration de meuble n'a pas vocation
   à être partagée — c'est le rangement de celui qui est devant l'écran.  */

export function lireAjouts() {
  try {
    const brut = localStorage.getItem(CLEF);
    if (!brut) return [];
    const l = JSON.parse(brut);
    return Array.isArray(l) ? l.filter(x => x && typeof x.titre === 'string').slice(0, 12) : [];
  } catch (e) {
    return [];               /* stockage refusé ou illisible : on continue */
  }
}

export function ecrireAjouts(liste) {
  try { localStorage.setItem(CLEF, JSON.stringify(liste)); } catch (e) {}
}


/* ── l'emplacement vide ──────────────────────────────────────────────────*/

export function creerEmplacement({ surNom }) {
  const el = document.createElement('article');
  el.className = 'casier casier--neuf';

  const bouton = document.createElement('button');
  bouton.type = 'button';
  bouton.className = 'ajouter';
  bouton.innerHTML =
    '<span class="ajouter__croix" aria-hidden="true">+</span>' +
    '<span class="ajouter__mot">Ajouter un casier</span>';

  el.append(bouton);

  bouton.addEventListener('click', () => baptiser(el, bouton, surNom));

  return el;
}

/* Nommer avant de créer. Un casier sans étiquette est un casier qu'on ne
   retrouve pas — et l'étiquette est le sujet même de ce meuble. */
function baptiser(el, bouton, surNom) {
  bouton.hidden = true;

  const form = document.createElement('form');
  form.className = 'bapteme';
  form.innerHTML =
    '<label for="nom-casier">Nom du casier</label>' +
    '<input id="nom-casier" name="nom" type="text" maxlength="24" autocomplete="off" required>' +
    '<span class="bapteme__aide">Entrée pour poser · Échap pour annuler</span>';

  el.append(form);
  const champ = form.querySelector('input');
  champ.focus();

  const annuler = () => { form.remove(); bouton.hidden = false; bouton.focus(); };

  form.addEventListener('submit', ev => {
    ev.preventDefault();
    const titre = champ.value.trim();
    if (!titre) return;
    form.remove();
    bouton.hidden = false;
    surNom(titre);
  });

  champ.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') { ev.stopPropagation(); annuler(); }
  });
}
