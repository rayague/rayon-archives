/**
 * ============================================================================
 * RAYON · main.js
 * ----------------------------------------------------------------------------
 * TROIS ÉTATS, ET RIEN ENTRE LES DEUX.
 *
 *   casier   les casiers, chacun montrant sa pile de fiches
 *   déplié   un casier ouvert : ses fiches occupent le plan de travail
 *   fiche    une fiche ouverte, lisible
 *
 * Chaque passage d'un état à l'autre est un FLIP. Les fiches changent
 * réellement de place dans le DOM — elles quittent leur casier pour le plan,
 * puis y reviennent. Ce n'est pas un décor : à tout moment, la structure du
 * document dit la vérité sur ce qui est rangé où.
 *
 * C'est aussi ce qui rend le retour EXACT. Fermer n'est pas « animer vers une
 * position calculée » mais rejouer le même mécanisme dans l'autre sens : la
 * fiche retrouve sa place parce que le navigateur la remet où elle va, pas
 * parce qu'on a mémorisé des coordonnées.
 *
 * POURQUOI LA TAILLE DU TEXTE SUIT LA LARGEUR DE LA FICHE
 *
 * Une fiche est une page. Vue de loin elle est petite, ouverte elle est
 * grande, mais c'est la MÊME page — pas un résumé qui deviendrait un texte.
 *
 * Sa taille de police est donc calculée depuis sa largeur. Le rapport entre
 * deux états est le même pour la boîte et pour le texte, l'échelle du FLIP
 * les décrit tous les deux, et il n'y a aucun ressaut à l'arrivée. Un texte
 * qui garderait sa taille pendant que la boîte grandit trahirait le truc à
 * chaque transition.
 * ============================================================================
 */

import gsap from 'gsap';
import { FONDS, GENRES } from './fonds.js';
import { creerDepliage } from './deplier.js';

const REDUIT = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function demarrer(racine) {
  const flip = creerDepliage({ gsap, reduit: REDUIT });

  const plan = racine.querySelector('[data-plan]');
  const grille = racine.querySelector('[data-casiers]');
  const lecteur = racine.querySelector('[data-lecteur]');

  let etat = 'casier';
  let ouvert = null;      /* le fonds déplié            */
  let lue = null;         /* la fiche en lecture        */
  let anime = false;      /* une transition est en vol  */

  /* ── construction ──────────────────────────────────────────────────────*/

  const fiches = new Map();   /* élément → { fonds, donnee } */

  for (const fonds of FONDS) {
    const casier = document.createElement('article');
    casier.className = 'casier';
    casier.dataset.cote = fonds.cote;
    casier.dataset.couleur = fonds.couleur;

    casier.innerHTML =
      '<button class="casier__prise" type="button" aria-expanded="false">' +
        '<span class="cote">' + fonds.cote + '</span>' +
        '<span class="casier__nom">' + fonds.titre + '</span>' +
        '<span class="casier__sous">' + fonds.sousTitre + '</span>' +
        '<span class="casier__compte">' + fonds.fiches.length + ' pièces · ' + fonds.annee + '</span>' +
      '</button>' +
      '<div class="casier__pile" data-pile></div>';

    const pile = casier.querySelector('[data-pile]');

    fonds.fiches.forEach((d, i) => {
      const f = creerFiche(fonds, d, i);
      fiches.set(f, { fonds, donnee: d });
      pile.append(f);
    });

    casier.querySelector('.casier__prise')
      .addEventListener('click', () => (ouvert === fonds ? replier() : deplier(fonds)));

    grille.append(casier);
  }

  function creerFiche(fonds, d, i) {
    const f = document.createElement('article');
    f.className = 'fiche';
    f.dataset.genre = d.genre;
    f.dataset.couleur = fonds.couleur;
    f.tabIndex = -1;
    f.style.setProperty('--rang', i);

    const corps = d.lignes
      ? '<dl class="fiche__mesures">' + d.lignes
          .map(([k, v]) => '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>').join('') + '</dl>'
      : '<div class="fiche__texte">' + d.corps.map(p => '<p>' + p + '</p>').join('') + '</div>';

    f.innerHTML =
      '<header class="fiche__tete">' +
        '<span class="fiche__genre">' + GENRES[d.genre].icone + ' ' + GENRES[d.genre].nom + '</span>' +
        '<span class="fiche__cote">' + fonds.cote + '.' + String(i + 1).padStart(2, '0') + '</span>' +
      '</header>' +
      '<h3 class="fiche__titre">' + d.titre + '</h3>' +
      corps;

    f.addEventListener('click', ev => {
      ev.stopPropagation();
      if (etat === 'deplie') lire(f);
      else if (etat === 'fiche') fermerFiche();
    });

    return f;
  }

  /* ── les transitions ───────────────────────────────────────────────────*/

  const toutes = () => [...fiches.keys()];

  function deplier(fonds) {
    if (anime || ouvert === fonds) return;
    anime = true;

    const prise = racine.querySelector('[data-cote="' + fonds.cote + '"] .casier__prise');
    const r = prise.getBoundingClientRect();
    const origine = { x: r.left + r.width / 2, y: r.top + r.height / 2 };

    flip.transition(toutes(), () => {
      /* Les fiches du fonds choisi partent sur le plan, les autres
         rentrent dans leur casier. Un seul fonds déplié à la fois. */
      for (const [el, { fonds: f }] of fiches) {
        if (f === fonds) plan.append(el);
        else pileDe(f).append(el);
      }
      ouvert = fonds;
      etat = 'deplie';
      appliquerEtat();
    }, {
      duree: 0.66,
      ordre: flip.parDistance(origine),
      surFin: () => { anime = false; plan.querySelector('.fiche')?.focus(); }
    });
  }

  function replier() {
    if (anime || !ouvert) return;
    anime = true;

    flip.transition(toutes(), () => {
      for (const [el, { fonds: f }] of fiches) pileDe(f).append(el);
      ouvert = null; lue = null;
      etat = 'casier';
      appliquerEtat();
    }, { duree: 0.58, surFin: () => { anime = false; } });
  }

  function lire(f) {
    if (anime) return;
    anime = true;

    flip.transition(toutes(), () => {
      lecteur.append(f);
      lue = f;
      etat = 'fiche';
      appliquerEtat();
    }, { duree: 0.6, decalage: 0, surFin: () => { anime = false; f.focus(); } });
  }

  function fermerFiche() {
    if (anime || !lue) return;
    anime = true;
    const cible = lue;

    flip.transition(toutes(), () => {
      plan.append(cible);
      /* On la remet à son rang : sans ça, la fiche lue revient toujours en
         dernier et l'ordre du plan change à chaque lecture. */
      const rangees = [...plan.children].sort(
        (a, b) => (+a.style.getPropertyValue('--rang')) - (+b.style.getPropertyValue('--rang')));
      for (const el of rangees) plan.append(el);
      lue = null;
      etat = 'deplie';
      appliquerEtat();
    }, { duree: 0.55, decalage: 0, surFin: () => { anime = false; cible.focus(); } });
  }

  const pileDe = fonds => racine.querySelector('[data-cote="' + fonds.cote + '"] [data-pile]');

  function appliquerEtat() {
    racine.dataset.etat = etat;
    for (const c of racine.querySelectorAll('.casier')) {
      const actif = ouvert && c.dataset.cote === ouvert.cote;
      c.classList.toggle('casier--ouvert', !!actif);
      c.querySelector('.casier__prise').setAttribute('aria-expanded', actif ? 'true' : 'false');
    }
    for (const f of fiches.keys()) f.tabIndex = (etat === 'casier') ? -1 : 0;
  }

  /* ── le clavier ────────────────────────────────────────────────────────
     Échap remonte d'un cran, jamais deux. On ne fait pas disparaître deux
     niveaux sur une seule touche : le visiteur perdrait où il en est. */

  addEventListener('keydown', ev => {
    if (ev.key !== 'Escape') return;
    if (etat === 'fiche') fermerFiche();
    else if (etat === 'deplie') replier();
  });

  appliquerEtat();

  /* Point d'entrée pour les sondes : le retour EXACT est la promesse de ce
     projet, et une promesse se mesure. */
  return {
    get etat() { return etat; },
    get ouvert() { return ouvert && ouvert.cote; },
    fiches, deplier, replier, lire, fermerFiche,
    fondsParCote: c => FONDS.find(f => f.cote === c),
    positions: () => {
      const m = {};
      for (const el of fiches.keys()) {
        const r = el.getBoundingClientRect();
        m[el.querySelector('.fiche__cote').textContent] =
          [Math.round(r.left * 100) / 100, Math.round(r.top * 100) / 100, Math.round(r.width * 100) / 100];
      }
      return m;
    }
  };
}
