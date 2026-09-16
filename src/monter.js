/**
 * ============================================================================
 * RAYON · monter.js
 * ----------------------------------------------------------------------------
 * UN CASIER NE PARAÎT PAS : IL SE CONSTRUIT.
 *
 * C'est une étagère. Quand on lui ajoute une case, on doit voir le meuble se
 * fabriquer — sinon l'ajout se lit comme un élément d'interface qui apparaît,
 * et la métaphore tombe.
 *
 * LA SÉQUENCE, 780 ms
 *
 *   1. les deux montants poussent depuis la planche du bas  260 ms  power3.out
 *   2. la planche du haut glisse et se pose                 220 ms  expo.out
 *   3. le casier se révèle derrière un masque               300 ms  expo.out
 *   4. les pièces se déposent, décalage 40 ms               200 ms  back.out
 *
 * LES ÉTAPES SE CHEVAUCHENT, ET C'EST ARITHMÉTIQUE. Bout à bout elles font
 * 260 + 220 + 300 + 200 = 980 ms, sans compter les décalages internes. Le
 * geste doit tenir en 780 : chaque étape part donc avant la fin de la
 * précédente, et c'est la FIN qui est fixe. La planche s'élance quand le
 * second montant est monté à 97 %, le masque s'ouvre quand la planche est
 * posée, la dernière pièce se pose à 780 ms pile.
 *
 *   montant gauche   0 → 260      planche   240 → 460
 *   montant droit   60 → 320      masque    380 → 680     pièces → 780
 *
 * CE QUI NE S'ANIME PAS
 *
 * Le bouton « Ajouter un casier ». Ni masqué, ni décalé, ni retardé d'une
 * image, et cliquable pendant toute la séquence : c'est la règle du studio
 * sur les éléments d'action, et elle ne souffre aucune exception esthétique.
 *
 * AUCUNE FILE D'ATTENTE
 *
 * Chaque case construit SES pièces, dans sa propre chronologie. Deux ajouts
 * rapprochés se superposent au lieu de se bloquer, et aucun redessin global
 * ne vient interrompre une construction en cours.
 * ============================================================================
 */

import { STRUCTURE } from './cadre.js';

const CLEF = 'rayon.casiers.v1';

export const DUREE   = 0.78;   /* la séquence complète                       */
export const CASCADE = 0.09;   /* d'un casier au suivant, dans une étagère   */
const PIECE          = 0.20;   /* la pose d'une pièce                        */
const PIECE_TOT      = 0.46;   /* jamais avant : le masque doit être ouvert  */


/* ── construire une case ────────────────────────────────────────────────── */

export function construire({ gsap, element, reduit = false }) {
  const q = s => element.querySelector(':scope > ' + s);

  const planche  = q('.planche');
  const montants = [q('.montant--g'), q('.montant--d')].filter(Boolean);
  /* Le fond, l'étiquette et la pile se révèlent ensemble : c'est l'intérieur
     de la caisse. Le bouton d'ajout n'en fait pas partie, et c'est voulu. */
  const contenu  = [q('.fond'), q('.casier__prise'), q('.casier__pile')].filter(Boolean);
  const pile     = q('.casier__pile');
  const pieces   = pile ? [...pile.children] : [];

  /* prefers-reduced-motion : un fondu de 200 ms, aucune construction. On
     fait fondre les PIÈCES de la case et non la case elle-même — une
     opacité sur un élément en preserve-3d l'aplatit le temps du fondu, et
     la profondeur reviendrait d'un coup à la fin. */
  if (reduit) {
    const tout = [...montants, planche, ...contenu].filter(Boolean);
    return gsap.fromTo(tout, { opacity: 0 },
      { opacity: 1, duration: 0.2, ease: 'none', clearProps: 'opacity' });
  }

  /* Les transitions CSS de survol écrivent dans la même transformation que
     la construction. Le temps du chantier, on les coupe. */
  const tl = gsap.timeline({
    onStart:    () => { element.dataset.chantier = 'oui'; },
    onComplete: () => { delete element.dataset.chantier; }
  });

  /* 1. LES MONTANTS. `transform-origin` en bas : ils poussent depuis la
        planche du bas. Un départ simultané fait mécanique — 60 ms séparent
        le gauche du droit. */
  montants.forEach((m, i) => {
    tl.fromTo(m,
      { scaleY: 0 },
      { scaleY: 1, duration: 0.26, ease: 'power3.out',
        transformOrigin: '50% 100%', clearProps: 'transform' },
      i * 0.06);
  });

  /* 2. LA PLANCHE. Elle arrive de la gauche et dépasse de 4 % de sa course
        avant de se caler : l'overshoot du répertoire, expo.out à l'aller,
        power2.out au retour. Sans lui, la pose paraît molle. */
  if (planche) {
    tl.fromTo(planche, { x: -40 }, { x: 1.6, duration: 0.16, ease: 'expo.out' }, 0.24)
      .to(planche, { x: 0, duration: 0.06, ease: 'power2.out', clearProps: 'transform' }, 0.40);
  }

  /* 3. LE MASQUE, JAMAIS LE FONDU SIMPLE. Le casier se découvre de bas en
        haut pendant que son contenu remonte de 14 %. */
  if (contenu.length) {
    tl.fromTo(contenu,
      { clipPath: 'inset(0% 0% 100% 0%)', yPercent: 14 },
      { clipPath: 'inset(0% 0% 0% 0%)', yPercent: 0, duration: 0.30, ease: 'expo.out',
        clearProps: 'clipPath,transform' },
      0.38);
  }

  /* 4. LES PIÈCES. La dernière se pose à 780 ms : on cale la fin, pas le
        début. Au-delà de quatre pièces, le décalage se resserre plutôt que
        de rallonger le geste. */
  if (pieces.length) {
    const n = pieces.length;
    const entre = n > 1 ? Math.min(0.04, (DUREE - PIECE - PIECE_TOT) / (n - 1)) : 0.04;
    const depart = DUREE - PIECE - entre * (n - 1);
    pieces.forEach((p, i) => {
      tl.fromTo(p,
        { y: -14, opacity: 0 },
        { y: 0, opacity: 1, duration: PIECE, ease: 'back.out(1.6)',
          clearProps: 'transform,opacity' },
        depart + i * entre);
    });
  }

  return tl;
}


/* ── le montage du meuble, une seule fois ───────────────────────────────── */

export function monter({ gsap, meuble, reduit = false }) {
  const cases = [...meuble.querySelectorAll('.casier')];

  if (reduit || !cases.length) {
    for (const c of cases) construire({ gsap, element: c, reduit: true });
    meuble.dataset.monte = 'oui';
    return null;
  }

  /* L'entrée en scène de l'outil : les cases se construisent en cascade,
     dans l'ordre où on les lit, et une seule fois. */
  const tl = gsap.timeline({ onComplete: () => { meuble.dataset.monte = 'oui'; } });
  cases.forEach((c, i) => {
    const t = construire({ gsap, element: c, reduit: false });
    if (t) tl.add(t, i * CASCADE);
  });
  return tl;
}

/* Une case ajoutée après coup se construit seule, du même geste. Quand
   l'ajout crée une étagère entière — la case neuve et ses cases de
   complément — le décalage les met en cascade. */
export function monterUne({ gsap, element, reduit = false, decalage = 0 }) {
  const t = construire({ gsap, element, reduit });
  if (t && decalage) t.delay(decalage);
  return t;
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

  /* L'emplacement vide est une CAISSE du meuble, pas une carte posée à
     côté. Il a donc les mêmes pièces — seulement, il n'y a rien dedans. */
  el.innerHTML = STRUCTURE;

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
